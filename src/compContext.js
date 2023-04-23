
import { UnresolvedItemError } from "./error.js";
import { unresolvedItem } from "./constants.js";

export class CompContext {
    
    constructor(compExprSeqs, parent = null) {
        // Map from CompExprSeq to list of items.
        this.seqItemsMap = new Map();
        for (const exprSeq of compExprSeqs) {
            const items = exprSeq.groups.map((group) => unresolvedItem);
            this.seqItemsMap.set(exprSeq, items);
        }
        // Map from CompVar to item.
        this.varItemMap = new Map();
        this.parent = parent;
    }
    
    setVarItem(compVar, item) {
        this.varItemMap.set(compVar, item);
    }
    
    addQualificationVars(qualification) {
        const { argVars, args } = qualification;
        if (args === null) {
            return;
        }
        for (let index = 0; index < argVars.length; index++) {
            const argVar = argVars[index];
            const arg = args[index];
            this.setVarItem(argVar, arg);
        }
    }
    
    resolveCompItems() {
        let resolvedCount = 0;
        const unresolvedExprs = [];
        for (const [exprSeq, items] of this.seqItemsMap) {
            for (let index = 0; index < items.length; index++) {
                let item = items[index];
                if (item === unresolvedItem) {
                    const expr = exprSeq.groups[index];
                    try {
                        item = exprSeq.resolveCompItem(this, expr);
                        items[index] = item;
                    } catch (error) {
                        if (!(error instanceof UnresolvedItemError)) {
                            throw error;
                        }
                    }
                }
                if (item === unresolvedItem) {
                    unresolvedExprs.push(exprSeq.groups[index]);
                } else {
                    resolvedCount += 1;
                }
            }
        }
        return { resolvedCount, unresolvedExprs };
    }
    
    getSeqItems(compExprSeq) {
        let items = this.seqItemsMap.get(compExprSeq);
        if (typeof items === "undefined") {
            if (this.parent === null) {
                throw new Error("CompContext is missing CompExprSeq.");
            }
            items = this.parent.getCompItems(compExprSeq);
        }
        if (items.some((item) => (item === unresolvedItem))) {
            throw new UnresolvedItemError();
        }
        return items;
    }
    
    getSeqItem(compExprSeq) {
        return this.getSeqItems(compExprSeq)[0];
    }
    
    getVarItem(compVar) {
        const hasItem = this.varItemMap.has(compVar);
        if (!hasItem && this.parent !== null) {
            return this.parent.getVarItem(compVar);
        }
        const item = hasItem ? this.varItemMap.get(compVar) : null;
        return { hasItem, item };
    }
}


