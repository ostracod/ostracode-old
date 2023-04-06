
import { CompilerError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { CompVar, BuiltInEvalVar, StmtEvalVar } from "./var.js";
import { Func } from "./func.js";
import { ListNest } from "./itemNest.js";

export class JsConverter {
    // Concrete subclasses of JsConverter must implement these methods:
    // convertItemToJs, convertNestedItem, convertStmtEvalVar
    
    constructor(itemIdMap) {
        // Map from item to ID.
        this.itemIdMap = itemIdMap;
    }
    
    getJsIdentifier(item) {
        const itemId = this.itemIdMap.get(item);
        if (typeof itemId === "undefined") {
            return null;
        } else {
            return compUtils.getJsCompIdentifier(itemId);
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
                const codeList = item.map((element, index) => {
                    const nest = new ListNest(item, element, index);
                    return this.convertNestedItem(nest);
                });
                return `[${codeList.join(", ")}]`;
            } else if (item instanceof Func) {
                return item.convertToJs(this);
            }
        }
        throw new CompilerError("Conversion to JS is not yet implemented for this type of item.");
    }
    
    convertVarToRefJs(variable) {
        if (variable instanceof CompVar) {
            return this.convertItemToJs(variable.getCompItem());
        } else if (variable instanceof BuiltInEvalVar) {
            return variable.convertToRefJs();
        } else if (variable instanceof StmtEvalVar) {
            return this.convertStmtEvalVar(variable);
        } else {
            throw new Error("Unexpected variable type.");
        }
    }
}

export class BuildJsConverter extends JsConverter {
    
    convertItemToJs(item) {
        const itemId = this.itemIdMap.get(item);
        if (typeof itemId === "undefined") {
            return this.convertItemToExpansion(item);
        } else {
            return "compItems." + compUtils.getJsCompIdentifier(itemId);
        }
    }
    
    convertNestedItem(nest) {
        throw new Error("Unexpected nested item conversion.");
    }
    
    convertStmtEvalVar(variable) {
        return variable.getJsIdentifier();
    }
}

export class SupportJsConverter extends JsConverter {
    
    constructor(itemIdMap) {
        super(itemIdMap);
        this.visibleItems = new Set();
        this.assignments = [];
    }
    
    convertItemToJs(item) {
        return this.convertItemToExpansion(item);
    }
    
    convertNestedItem(nest) {
        const item = nest.childItem;
        const identifier = this.getJsIdentifier(item);
        if (identifier === null) {
            return this.convertItemToJs(item);
        } else if (this.visibleItems.has(item)) {
            return identifier;
        } else {
            const parentIdentifier = this.getJsIdentifier(nest.parentItem);
            const assignment = nest.convertToJs(parentIdentifier, identifier);
            this.assignments.push(assignment);
            return "null";
        }
    }
    
    convertStmtEvalVar(variable) {
        throw new Error("Unexpected evaltime variable.");
    }
}


