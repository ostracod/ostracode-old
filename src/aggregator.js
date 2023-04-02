
import * as fs from "fs";
import * as pathUtils from "path";
import * as niceUtils from "./niceUtils.js";
import * as compUtils from "./compUtils.js";

const getJsIdentifier = (itemId) => compUtils.getJsIdentifier(`${itemId}`, "C");

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
            return itemId;
        } else {
            return null;
        }
    }
    
    getJsIdentifier(item) {
        const itemId = this.itemIdMap.get(item);
        return (typeof itemId === "undefined") ? null : getJsIdentifier(itemId);
    }
    
    convertItemToRefJs(item) {
        const itemId = this.addItem(item);
        if (itemId === null) {
            return this.convertItemToJs(item);
        } else {
            return "compItems." + getJsIdentifier(itemId);
        }
    }
    
    convertItemToJs(item) {
        return compUtils.convertItemToJs(item, (nestedItem) => (
            this.convertItemToRefJs(nestedItem)
        ));
    }
    
    convertItemToModuleJs(item, convertedItems) {
        const assignments = [];
        const identifier = this.getJsIdentifier(item);
        const itemCode = compUtils.convertItemToJs(item, (nestedItem, getRefJs) => {
            const nestedItemIdentifier = this.getJsIdentifier(nestedItem);
            if (nestedItemIdentifier === null) {
                const result = this.convertItemToModuleJs(nestedItem, convertedItems);
                niceUtils.extendList(assignments, result.assignments);
                return result.itemCode;
            } else if (convertedItems.has(nestedItem)) {
                return nestedItemIdentifier;
            } else {
                const refCode = getRefJs(identifier);
                assignments.push(`${refCode} = ${nestedItemIdentifier};`);
                return "null";
            }
        });
        convertedItems.add(item);
        return { itemCode, assignments };
    }
    
    createJsFile() {
        for (const item of this.itemIdMap.keys()) {
            const nestedItems = compUtils.getNestedItems(item);
            for (const nestedItem of nestedItems) {
                this.addItem(nestedItem);
            }
        }
        const convertedItems = new Set();
        const codeList = [];
        const assignments = [];
        for (const [item, id] of this.itemIdMap) {
            const identifier = getJsIdentifier(id);
            const result = this.convertItemToModuleJs(item, convertedItems);
            codeList.push(`export const ${identifier} = ${result.itemCode};`);
            niceUtils.extendList(assignments, result.assignments);
        }
        const code = codeList.join("\n") + "\n" + assignments.join("\n") + "\n";
        fs.writeFileSync(this.path, code);
    }
}


