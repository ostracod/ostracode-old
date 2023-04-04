
import * as fs from "fs";
import * as pathUtils from "path";
import { baseImportStmt } from "./constants.js";
import * as compUtils from "./compUtils.js";
import { SupportItemConverter } from "./itemConverter.js";

export class CompItemAggregator {
    
    constructor() {
        // Map from item to ID.
        this.itemIdMap = new Map();
        this.nextItemId = 0;
    }
    
    addItem(item) {
        if (typeof item === "object" && item !== null) {
            let itemId = this.itemIdMap.get(item);
            if (typeof itemId === "undefined") {
                itemId = this.nextItemId;
                this.nextItemId += 1;
                this.itemIdMap.set(item, itemId);
                return true;
            }
        }
        return false;
    }
    
    createJsFile(supportPath) {
        let items = Array.from(this.itemIdMap.keys());
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
        const itemConverter = new SupportItemConverter(this.itemIdMap);
        const codeList = [];
        for (const [item, id] of this.itemIdMap) {
            const identifier = compUtils.getJsCompIdentifier(id);
            const itemCode = itemConverter.convertItemToJs(item);
            itemConverter.visibleItems.add(item);
            codeList.push(`export const ${identifier} = ${itemCode};`);
        }
        const { assignments } = itemConverter;
        const code = baseImportStmt + "\n" + codeList.concat(assignments).join("\n") + "\n";
        const path = pathUtils.join(supportPath, "compItems.js");
        fs.writeFileSync(path, code);
    }
}


