
import { CompilerError, UnknownItemError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { UnresolvedItem, UnresolvedExprItem, UnresolvedVarItem, AbsentItem } from "./item.js";
import { CompExprSeq } from "./groupSeq.js";

const handleUnknownItem = (unresolvedItem, operation) => {
    try {
        return operation();
    } catch (error) {
        if (error instanceof UnknownItemError) {
            const unknownItem = error.item;
            return (unknownItem instanceof AbsentItem) ? unknownItem : unresolvedItem;
        } else {
            throw error;
        }
    }
};

export class CompContext {
    
    constructor(node, parent = null) {
        this.node = node;
        this.parent = parent;
        // Map from CompExprSeq to list of items.
        this.seqItemsMap = new Map();
        const compExprSeqs = this.node.getNodesByClass(CompExprSeq);
        for (const exprSeq of compExprSeqs) {
            const items = exprSeq.groups.map((expr, index) => (
                new UnresolvedExprItem(exprSeq, index)
            ));
            this.seqItemsMap.set(exprSeq, items);
        }
        // Map from CompVar to item.
        this.varItemMap = new Map();
        const compVars = this.node.getCompVars();
        for (const variable of compVars) {
            this.varItemMap.set(variable, new UnresolvedVarItem(variable));
        }
        // Map from CompCompartment to type ID.
        this.typeIdMap = new Map();
        const compCompartments = this.node.getCompCompartments();
        for (const compartment of compCompartments) {
            this.typeIdMap.set(compartment, null);
        }
    }
    
    setQualificationVars(qualification) {
        const argVars = qualification.genericExpr.getArgVars();
        for (let index = 0; index < argVars.length; index++) {
            const argVar = argVars[index];
            const arg = qualification.args[index];
            this.varItemMap.set(argVar, arg);
        }
    }
    
    getResolvedItem(inputItem) {
        let item = inputItem;
        const seenItems = new Set();
        while (item instanceof UnresolvedItem) {
            seenItems.add(item);
            item = item.read(this);
            if (seenItems.has(item)) {
                return inputItem;
            }
        }
        return item;
    }
    
    replaceNestedItems(item, visitedItems) {
        if (visitedItems.has(item)) {
            return item;
        }
        visitedItems.add(item);
        if (item instanceof UnresolvedItem) {
            return item;
        }
        compUtils.iterateNestedItems(item, (nestedItem) => ({
            item: this.getResolvedItem(nestedItem),
        }));
        compUtils.iterateNestedItems(item, (nestedItem) => {
            this.replaceNestedItems(nestedItem, visitedItems);
        });
    }
    
    replaceUnresolvedItemsHelper(item, visitedItems) {
        item = this.getResolvedItem(item);
        this.replaceNestedItems(item, visitedItems);
        return item;
    }
    
    replaceUnresolvedItems(visitedItems = new Set()) {
        for (const items of this.seqItemsMap.values()) {
            for (let index = 0; index < items.length; index++) {
                let item = items[index];
                item = this.replaceUnresolvedItemsHelper(item, visitedItems);
                items[index] = item;
            }
        }
        for (const variable of this.varItemMap.keys()) {
            let item = this.varItemMap.get(variable);
            item = this.replaceUnresolvedItemsHelper(item, visitedItems);
            this.varItemMap.set(variable, item);
        }
        if (this.parent !== null) {
            this.parent.replaceUnresolvedItems(visitedItems);
        }
    }
    
    resolveCompItemsHelper() {
        let resolvedCount = 0;
        const unresolvedExprs = [];
        const unresolvedVars = [];
        for (const [exprSeq, items] of this.seqItemsMap) {
            this.replaceUnresolvedItems();
            for (let index = 0; index < items.length; index++) {
                const expr = exprSeq.groups[index];
                let item = items[index];
                if (item instanceof UnresolvedItem) {
                    item = handleUnknownItem(item, () => exprSeq.resolveCompItem(this, expr));
                    items[index] = item;
                }
                if (item instanceof UnresolvedItem) {
                    unresolvedExprs.push(expr);
                } else {
                    resolvedCount += 1;
                }
            }
        }
        for (const variable of this.varItemMap.keys()) {
            this.replaceUnresolvedItems();
            let item = this.varItemMap.get(variable);
            if (item instanceof UnresolvedItem) {
                item = handleUnknownItem(item, () => variable.resolveCompItem(this));
                this.varItemMap.set(variable, item);
            }
            if (item instanceof UnresolvedItem) {
                unresolvedVars.push(variable);
            } else {
                resolvedCount += 1;
            }
        }
        return { resolvedCount, unresolvedExprs, unresolvedVars };
    }
    
    resolveCompItems() {
        let lastResolvedCount = 0;
        while (true) {
            const {
                resolvedCount, unresolvedExprs, unresolvedVars,
            } = this.resolveCompItemsHelper();
            if (unresolvedExprs.length <= 0 && unresolvedVars.length <= 0) {
                break;
            }
            if (resolvedCount <= lastResolvedCount) {
                if (unresolvedExprs.length > 0) {
                    unresolvedExprs[0].throwError("Could not resolve expression to item.");
                } else {
                    const { name } = unresolvedVars[0];
                    throw new CompilerError(`Could not resolve comptime variable "${name}".`);
                }
            }
            lastResolvedCount = resolvedCount;
        }
        this.replaceUnresolvedItems();
    }
    
    getSeqItems(compExprSeq) {
        let items = this.seqItemsMap.get(compExprSeq);
        if (typeof items === "undefined") {
            if (this.parent === null) {
                throw new Error("CompContext is missing CompExprSeq.");
            }
            items = this.parent.getSeqItems(compExprSeq);
        }
        return items;
    }
    
    getSeqItem(compExprSeq) {
        return this.getSeqItems(compExprSeq)[0];
    }
    
    setSeqItem(compExprSeq, item) {
        this.getSeqItems(compExprSeq)[0] = item;
    }
    
    iterateSeqItems(compExprSeq, handle) {
        const items = this.getSeqItems(compExprSeq);
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const result = handle(item);
            if (typeof result !== "undefined") {
                items[index] = result.item;
            }
        }
    }
    
    getVarItemMap(compVar) {
        if (this.varItemMap.has(compVar)) {
            return this.varItemMap;
        }
        return (this.parent === null) ? null : this.parent.getVarItemMap(compVar);
    }
    
    hasVar(compVar) {
        return (this.getVarItemMap() !== null);
    }
    
    getVarItem(compVar) {
        const varItemMap = this.getVarItemMap(compVar);
        return (varItemMap === null) ? new AbsentItem() : varItemMap.get(compVar);
    }
    
    setVarItem(compVar, item) {
        const varItemMap = this.getVarItemMap(compVar);
        if (varItemMap === null) {
            throw new Error(`Could not find comptime var "${compVar.name}".`);
        }
        varItemMap.set(compVar, item);
    }
    
    getTypeId(compCompartment) {
        const typeId = this.typeIdMap.get(compCompartment);
        if (typeof typeId !== "undefined") {
            return typeId;
        }
        return (this.parent === null) ? null : this.parent.getTypeId(compCompartment);
    }
    
    stowTypeId(compCompartment, typeId) {
        if (this.typeIdMap.has(compCompartment)) {
            this.typeIdMap.set(compCompartment, typeId);
        }
    }
}


