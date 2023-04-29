
import { UnknownItemError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { UnresolvedItem, AbsentItem } from "./item.js";

export class CompContext {
    
    constructor(compExprSeqs, parent = null) {
        // Map from CompExprSeq to list of items.
        this.seqItemsMap = new Map();
        for (const exprSeq of compExprSeqs) {
            const items = exprSeq.groups.map((expr, index) => (
                new UnresolvedItem(exprSeq, index)
            ));
            this.seqItemsMap.set(exprSeq, items);
        }
        // Map from CompVar to item.
        this.varItemMap = new Map();
        this.parent = parent;
    }
    
    addQualificationVars(qualification) {
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
            const items = this.getSeqItems(item.compExprSeq);
            item = items[item.index];
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
        for (const [exprSeq, items] of this.seqItemsMap) {
            this.replaceUnresolvedItems();
            for (let index = 0; index < items.length; index++) {
                let item = items[index];
                if (item instanceof UnresolvedItem) {
                    const expr = exprSeq.groups[index];
                    try {
                        item = exprSeq.resolveCompItem(this, expr);
                        items[index] = item;
                    } catch (error) {
                        if (!(error instanceof UnknownItemError)) {
                            throw error;
                        }
                    }
                }
                if (item instanceof UnresolvedItem) {
                    unresolvedExprs.push(exprSeq.groups[index]);
                } else {
                    resolvedCount += 1;
                }
            }
        }
        return { resolvedCount, unresolvedExprs };
    }
    
    resolveCompItems() {
        let lastResolvedCount = 0;
        while (true) {
            const { resolvedCount, unresolvedExprs } = this.resolveCompItemsHelper();
            if (unresolvedExprs.length <= 0) {
                break;
            }
            if (resolvedCount <= lastResolvedCount) {
                unresolvedExprs[0].throwError("Could not resolve expression to item.");
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
}


