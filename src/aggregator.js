
import * as fs from "fs";
import * as pathUtils from "path";
import { baseImportStmt } from "./constants.js";
import * as compUtils from "./compUtils.js";
import { SupportItemConverter } from "./itemConverter.js";

export class CompItemAggregator {
    
    constructor(supportPath) {
        this.path = pathUtils.join(supportPath, "compItems.js");
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
            }
        }
    }
    
    createJsFile() {
        // TODO: Recursively add nested items of nested items.
        for (const item of this.itemIdMap.keys()) {
            const nestedItems = compUtils.getNestedItems(item);
            for (const nestedItem of nestedItems) {
                this.addItem(nestedItem);
            }
        }
        const itemConverter = new SupportItemConverter(this.itemIdMap);
        const codeList = [];
        for (const [item, id] of this.itemIdMap) {
            const identifier = compUtils.getJsIdentifier(`${id}`, "C");
            const itemCode = itemConverter.convertItemToJs(item);
            codeList.push(`export const ${identifier} = ${itemCode};`);
        }
        const { assignments } = itemConverter;
        const code = baseImportStmt + "\n" + codeList.concat(assignments).join("\n") + "\n";
        fs.writeFileSync(this.path, code);
    }
}


