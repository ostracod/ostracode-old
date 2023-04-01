
import * as fs from "fs";
import * as pathUtils from "path";
import * as compUtils from "./compUtils.js";

const getJsIdentifier = (itemId) => compUtils.getJsIdentifier(`${itemId}`, "C");

export class CompItemAggregator {
    
    constructor(supportPath) {
        this.path = pathUtils.join(supportPath, "compItems.js");
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
            return "compItems." + getJsIdentifier(itemId);
        } else {
            return compUtils.convertItemToJs(item, this);
        }
    }
    
    createJsFile() {
        const codeList = [];
        for (const [item, id] of this.itemIdMap) {
            const identifier = getJsIdentifier(id);
            // TODO: Handle items which have been added to the aggregator
            // when calling `convertItemToJs`.
            const itemCode = compUtils.convertItemToJs(item, this);
            codeList.push(`export const ${identifier} = ${itemCode};`);
        }
        const code = codeList.join("\n") + "\n";
        fs.writeFileSync(this.path, code);
    }
}


