
import * as compUtils from "./compUtils.js";

const getJsIdentifier = (itemId) => compUtils.getJsIdentifier(`${itemId}`, "C");

export class CompItemAggregator {
    
    constructor() {
        // Map from item to ID.
        this.itemIdMap = new Map();
        this.nextItemId = 0;
    }
    
    convertItemToRefJs(item) {
        if (typeof item === "object" && item !== null) {
            let itemId = this.itemIdMap.get(item);
            if (typeof itemId === "undefined") {
                itemId = this.nextItemId;
                this.nextItemId += 1;
                this.itemIdMap.set(item, itemId);
            }
            return getJsIdentifier(itemId);
        } else {
            return compUtils.convertItemToJs(item);
        }
    }
}


