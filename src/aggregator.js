
import * as compUtils from "./compUtils.js";
import { Item } from "./item.js";

export class ClosureItem {
    
    constructor(item, varId) {
        this.item = item;
        this.varId = varId;
    }
    
    getJsIdentifier() {
        return compUtils.getJsIdentifier(`${this.varId}`, "V");
    }
}

export class CompItemAggregator {
    
    constructor(compContext) {
        this.compContext = compContext;
        // Map from item to ID.
        this.itemIdMap = new Map();
        this.nextItemId = 0;
        // Map from Item to (Map from Var to ClosureItem).
        this.closureItemsMap = new Map();
        this.nextClosureVarId = 0;
    }
    
    addItem(item) {
        if ((typeof item === "object" && item !== null)
                || typeof item === "symbol") {
            let itemId = this.itemIdMap.get(item);
            if (typeof itemId === "undefined") {
                itemId = this.nextItemId;
                this.nextItemId += 1;
                this.itemIdMap.set(item, itemId);
                if (item instanceof Item) {
                    this.addClosureItems(item);
                }
                return true;
            }
        }
        return false;
    }
    
    addClosureItems(item) {
        const varItemMap = item.getClosureItems();
        const closureItemMap = new Map();
        for (const [variable, item] of varItemMap.entries()) {
            const varId = this.nextClosureVarId;
            this.nextClosureVarId += 1;
            const closureItem = new ClosureItem(item, varId);
            closureItemMap.set(variable, closureItem);
        }
        this.closureItemsMap.set(item, closureItemMap);
    }
    
    addNestedItems() {
        let items = this.getItems();
        while (items.length > 0) {
            let nextItems = [];
            for (const item of items) {
                const nestedItems = compUtils.getNestedItems(item);
                for (const nestedItem of nestedItems) {
                    const isNew = this.addItem(nestedItem);
                    if (isNew) {
                        nextItems.push(nestedItem);
                    }
                }
            }
            items = nextItems;
        }
    }
    
    getItems() {
        return Array.from(this.itemIdMap.keys());
    }
}


