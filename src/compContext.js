
import { UnresolvedItemError } from "./error.js";
import { unresolvedItem } from "./constants.js";

export class CompContext {
    
    constructor(compExprSeqs, parent = null) {
        // Map from CompExprSeq to list of item.
        this.itemsMap = new Map();
        for (const exprSeq of compExprSeqs) {
            const items = exprSeq.groups.map((group) => unresolvedItem);
            this.itemsMap.set(exprSeq, items);
        }
        this.parent = parent;
    }
    
    resolveCompItems() {
        let resolvedCount = 0;
        const unresolvedExprs = [];
        for (const [exprSeq, items] of this.itemsMap) {
            for (let index = 0; index < items.length; index++) {
                let item = items[index];
                if (item === unresolvedItem) {
                    const expr = exprSeq.groups[index]
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
    
    getCompItems(compExprSeq) {
        let items = this.itemsMap.get(compExprSeq);
        if (typeof items === "undefined") {
            items = this.parent.getCompItems(compExprSeq);
        }
        if (items.some((item) => (item === unresolvedItem))) {
            throw new UnresolvedItemError();
        }
        return items;
    }
    
    getCompItem(compExprSeq) {
        return this.getCompItems(compExprSeq)[0];
    }
}


