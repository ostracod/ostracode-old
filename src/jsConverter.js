
import { CompilerError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { CompVar, BuiltInEvalVar, StmtEvalVar } from "./var.js";
import { Item } from "./item.js";
import { ListNest } from "./itemNest.js";

export class JsConverter {
    // Concrete subclasses of JsConverter must implement these methods:
    // convertStmtEvalVar
    
    constructor(aggregator) {
        this.aggregator = aggregator;
    }
    
    getCompContext() {
        return this.aggregator.compContext;
    }
    
    convertItemToRefJs(item) {
        const itemId = this.aggregator.itemIdMap.get(item);
        if (typeof itemId === "undefined") {
            return null;
        } else {
            return compUtils.getJsCompItemIdentifier(itemId);
        }
    }
    
    convertNestedItem(nest) {
        throw new Error("Unexpected nested item conversion.");
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
            } else if (item instanceof Item) {
                const closureItemMap = this.aggregator.closureItemsMap.get(item);
                const jsConverter = new ClosureJsConverter(this.aggregator, closureItemMap);
                return item.convertToJs(jsConverter);
            }
        }
        throw new CompilerError("Conversion to JS is not yet implemented for this type of item.");
    }
    
    convertItemToJs(item) {
        return this.convertItemToRefJs(item) ?? this.convertItemToExpansion(item);
    }
    
    convertVarToRefJs(variable) {
        if (variable instanceof CompVar) {
            const item = this.getCompContext().getVarItem(variable);
            return this.convertItemToJs(item);
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
    
    convertItemToRefJs(item) {
        const refCode = super.convertItemToRefJs(item);
        return (refCode === null) ? null : "compItems." + refCode;
    }
    
    convertStmtEvalVar(variable) {
        return variable.getJsIdentifier();
    }
}

export class SupportJsConverter extends JsConverter {
    
    constructor(aggregator) {
        super(aggregator);
        this.visibleItems = new Set();
        this.assignments = [];
    }
    
    convertNestedItem(nest) {
        const item = nest.childItem;
        const refCode = this.convertItemToRefJs(item);
        if (refCode === null) {
            return this.convertItemToJs(item);
        } else if (this.visibleItems.has(item)) {
            return refCode;
        } else {
            const parentRefCode = this.convertItemToRefJs(nest.parentItem);
            const assignment = nest.convertToJs(parentRefCode, refCode);
            this.assignments.push(assignment);
            return "null";
        }
    }
    
    convertStmtEvalVar(variable) {
        throw new Error("Unexpected evaltime variable.");
    }
}

export class ClosureJsConverter extends JsConverter {
    
    constructor(aggregator, closureItemMap) {
        super(aggregator);
        this.closureItemMap = closureItemMap;
    }
    
    convertStmtEvalVar(variable) {
        const closureItem = this.closureItemMap.get(variable);
        if (closureItem === null) {
            return variable.getJsIdentifier();
        } else {
            return closureItem.getJsIdentifier();
        }
    }
}


