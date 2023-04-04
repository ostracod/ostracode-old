
import { CompilerError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { Func } from "./func.js";

export class ItemConverter {
    // Concrete subclasses of ItemConverter must implement these methods:
    // convertItemToJs, convertNestedItem
    
    constructor(itemIdMap) {
        // Map from item to ID.
        this.itemIdMap = itemIdMap;
    }
    
    getJsIdentifier(item) {
        const itemId = this.itemIdMap.get(item);
        if (typeof itemId === "undefined") {
            return null;
        } else {
            return compUtils.getJsIdentifier(`${itemId}`, "C");
        }
    }
    
    convertItemToExpansion(item) {
        const type = typeof item;
        if (type === "string") {
            // TODO: Escape string characters.
            return `"${item}"`;
        } else if (type === "number" || type === "boolean" || type === "null"
                || type === "undefined") {
            return `${item}`;
        } else if (type === "object") {
            if (Array.isArray(item)) {
                const codeList = item.map((element, index) => this.convertNestedItem(
                    item,
                    element,
                    (identifier) => `${identifier}[${index}]`,
                ));
                return `[${codeList.join(", ")}]`;
            } else if (item instanceof Func) {
                return item.convertToJs(this);
            }
        }
        throw new CompilerError("Conversion to JS is not yet implemented for this type of item.");
    }
}

export class BuildItemConverter extends ItemConverter {
    
    convertItemToJs(item) {
        const itemId = this.itemIdMap.get(item);
        if (typeof itemId === "undefined") {
            return this.convertItemToExpansion(item);
        } else {
            return "compItems." + compUtils.getJsIdentifier(`${itemId}`, "C");
        }
    }
    
    convertNestedItem(parentItem, item, getRefJs) {
        return this.convertItemToJs(item);
    }
}

export class SupportItemConverter extends ItemConverter {
    
    constructor(itemIdMap) {
        super(itemIdMap);
        this.convertedItems = new Set();
        this.assignments = [];
    }
    
    convertItemToJs(item, convertedItems) {
        const output = this.convertItemToExpansion(item);
        this.convertedItems.add(item);
        return output;
    }
    
    convertNestedItem(parentItem, item, getRefJs) {
        const itemIdentifier = this.getJsIdentifier(item);
        if (itemIdentifier === null) {
            return this.convertItemToJs(item);
        } else if (this.convertedItems.has(item)) {
            return itemIdentifier;
        } else {
            const parentIdentifier = this.getJsIdentifier(parentItem);
            const refCode = getRefJs(parentIdentifier);
            this.assignments.push(`${refCode} = ${itemIdentifier};`);
            return "null";
        }
    }
}


