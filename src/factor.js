
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import * as compUtils from "./compUtils.js";
import { createTypeId } from "./itemType.js";
import { UnboundCustomMethod, BoundCustomMethod } from "./func.js";
import { CompItemAggregator } from "./aggregator.js";
import { Item } from "./item.js";

export class Factor extends Item {
    // Concrete subclasses of Factor must implement these methods:
    // getFeatures
}

export class FeatureField {
    
    constructor(fieldStmt, context) {
        this.fieldStmt = fieldStmt;
        this.context = context;
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
        return initItemExprSeq.evaluateToItem(this.context);
    }
    
    getNestedItems() {
        const aggregator = new CompItemAggregator();
        this.fieldStmt.aggregateCompItems(aggregator);
        return aggregator.getItems();
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
    
    constructor(itemFieldStmts, sharedFieldStmts, context) {
        super();
        this.typeId = createTypeId();
        this.itemFields = itemFieldStmts.map((fieldStmt) => (
            new FeatureField(fieldStmt, context)
        ));
        const sharedFields = sharedFieldStmts.map((fieldStmt) => (
            new FeatureField(fieldStmt, context)
        ));
        this.sharedItemMap = createItemMap(sharedFields);
    }
    
    getFeatures() {
        return [this];
    }
    
    getNestedItems() {
        const output = [];
        for (const field of this.itemFields) {
            niceUtils.extendList(output, field.getNestedItems());
        }
        for (const item of this.sharedItemMap.values()) {
            output.push(item);
        }
        return output;
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
        const typeIdIdentifier = compUtils.getJsTypeIdIdentifier(this.typeId);
        return `(class extends classes.Feature {
static typeId = typeIds.${typeIdIdentifier};
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


