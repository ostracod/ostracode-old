
import { CompilerError, UnknownItemError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { UnboundCustomMethod, BoundCustomMethod } from "./func.js";
import { Item, UnknownItem } from "./item.js";
import { FeatureKeyNest } from "./itemNest.js";

export class Factor extends Item {
    // Concrete subclasses of Factor must implement these methods:
    // getFeatures
}

export class FeatureField {
    
    constructor(fieldStmt, evalContext) {
        this.fieldStmt = fieldStmt;
        this.evalContext = evalContext;
        this.name = this.fieldStmt.name;
        if (this.name === null) {
            this.fieldStmt.throwError("Feature field must use name identifier.");
        }
    }
    
    getInitItem() {
        const { initItemExprSeq } = this.fieldStmt;
        if (initItemExprSeq === null) {
            return undefined;
        }
        return initItemExprSeq.evaluateToItem(this.evalContext);
    }
    
    iterateNestedItems(handle) {
        const { compContext } = this.evalContext;
        this.fieldStmt.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        return this.fieldStmt.convertToJs(jsConverter);
    }
}

// Returns a Map from name to item.
const createItemMap = (fields) => {
    const output = new Map();
    for (const field of fields) {
        output.set(field.name, field.getInitItem());
    }
    return output;
};

export class Feature extends Factor {
    
    constructor(featureExpr, evalContext) {
        super();
        this.featureExpr = featureExpr;
        const anchor = this.featureExpr.getAnchor(evalContext.compContext);
        if (anchor instanceof UnknownItem) {
            throw new UnknownItemError(anchor);
        }
        if (anchor === null) {
            this.key = Symbol();
        } else {
            this.key = evalContext.derefAnchor(anchor).read();
        }
        this.itemFields = this.featureExpr.itemFieldStmts.map((fieldStmt) => (
            new FeatureField(fieldStmt, evalContext)
        ));
        const sharedFields = this.featureExpr.sharedFieldStmts.map((fieldStmt) => (
            new FeatureField(fieldStmt, evalContext)
        ));
        this.sharedItemMap = createItemMap(sharedFields);
    }
    
    getFeatures() {
        return [this];
    }
    
    iterateNestedItems(handle) {
        for (const field of this.itemFields) {
            field.iterateNestedItems(handle);
        }
        const result = handle(this.key);
        if (typeof result !== "undefined") {
            this.key = result.item;
        }
        for (const name of this.sharedItemMap.keys()) {
            let item = this.sharedItemMap.get(name);
            const result = handle(item);
            if (typeof result !== "undefined") {
                this.sharedItemMap.set(name, item);
            }
        }
    }
    
    getClosureItems() {
        // TODO: Implement.
        return new Map();
    }
    
    convertToJs(jsConverter) {
        const itemFieldCodeList = [];
        for (const field of this.itemFields) {
            itemFieldCodeList.push(field.fieldStmt.convertToItemJs(jsConverter));
        }
        const sharedFieldCodeList = [];
        for (const [name, item] of this.sharedItemMap.entries()) {
            const identifier = compUtils.getJsIdentifier(name);
            const itemCode = jsConverter.convertItemToJs(item);
            sharedFieldCodeList.push(`${identifier} = ${itemCode};`);
        }
        const nest = new FeatureKeyNest(this);
        return `(class extends classes.Feature {
static key = ${jsConverter.convertNestedItem(nest)};
constructor(obj) {
super(obj);
${itemFieldCodeList.join("\n")}
}
${sharedFieldCodeList.join("\n")}
})`;
    }
}

export class FeatureInstance {
    
    constructor(feature, obj) {
        this.feature = feature;
        this.obj = obj;
        this.itemMap = createItemMap(feature.itemFields);
        this.sharedItemMap = this.feature.sharedItemMap;
    }
    
    getMemberItem(name) {
        let item;
        if (this.itemMap.has(name)) {
            item = this.itemMap.get(name);
        } else if (this.sharedItemMap.has(name)) {
            item = this.sharedItemMap.get(name);
        } else {
            throw new CompilerError(`Unknown field "${name}".`);
        }
        if (item instanceof UnboundCustomMethod) {
            return new BoundCustomMethod(item, this);
        } else {
            return item;
        }
    }
    
    setMemberItem(name, item) {
        if (this.itemMap.has(name)) {
            this.itemMap.set(name, item);
        } else if (this.sharedItemMap.has(name)) {
            this.sharedItemMap.set(name, item);
        } else {
            throw new CompilerError(`Unknown field "${name}".`);
        }
    }
}


