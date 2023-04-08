
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { createTypeId } from "./itemType.js";
import { CustomMethod } from "./func.js";
import { CompItemAggregator } from "./aggregator.js";
import { Item } from "./item.js";

export class Factor extends Item {
    // Concrete subclasses of Factor must implement these methods:
    // getFeatures
}

export class FeatureMember {
    
    constructor(name, context) {
        this.name = name;
        this.context = context;
    }
}

export class FeatureField extends FeatureMember {
    
    constructor(fieldStmt, context) {
        super(fieldStmt.name, context);
        this.fieldStmt = fieldStmt;
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

export class FeatureMethod extends FeatureMember {
    
    constructor(methodStmt, context) {
        super(methodStmt.name, context);
        this.methodStmt = methodStmt;
    }
    
    createMethod(featureInstance) {
        return new CustomMethod(this.methodStmt, this.context, featureInstance);
    }
    
    getNestedItems() {
        const aggregator = new CompItemAggregator();
        this.methodStmt.aggregateCompItems(aggregator);
        return aggregator.getItems();
    }
    
    convertToJs(jsConverter) {
        return this.methodStmt.convertToJs(jsConverter);
    }
}

export class Feature extends Factor {
    
    constructor(fieldStmts, methodStmts, context) {
        super();
        this.typeId = createTypeId();
        this.fields = fieldStmts.map((fieldStmt) => {
            const { name } = fieldStmt;
            if (name === null) {
                fieldStmt.throwError("Feature field must use name identifier.");
            }
            return new FeatureField(fieldStmt, context);
        });
        // Map from name to FeatureMethod.
        this.methods = new Map();
        for (const methodStmt of methodStmts) {
            const featureMethod = new FeatureMethod(methodStmt, context);
            this.methods.set(featureMethod.name, featureMethod);
        }
    }
    
    getFeatures() {
        return [this];
    }
    
    getNestedItems() {
        const output = [];
        for (const field of this.fields) {
            niceUtils.extendList(output, field.getNestedItems());
        }
        for (const method of this.methods.values()) {
            niceUtils.extendList(output, method.getNestedItems());
        }
        return output;
    }
    
    getClosureItems() {
        // TODO: Implement.
        return new Map();
    }
    
    convertToJs(jsConverter) {
        const fieldCodeList = [];
        for (const field of this.fields) {
            fieldCodeList.push(field.convertToJs(jsConverter));
        }
        const methodCodeList = [];
        for (const method of this.methods.values()) {
            methodCodeList.push(method.convertToJs(jsConverter));
        }
        return `(class extends classes.Feature {
constructor(obj) {
super(obj);
${fieldCodeList.join("\n")}
}
${methodCodeList.join("\n")}
})`;
    }
}

export class FeatureInstance {
    
    constructor(feature, obj) {
        this.feature = feature;
        this.obj = obj;
        // Map from name to item.
        this.fields = new Map();
        for (const field of this.feature.fields) {
            this.fields.set(field.name, field.getInitItem());
        }
    }
    
    getMemberItem(name) {
        if (this.fields.has(name)) {
            return this.fields.get(name);
        }
        const featureMethod = this.feature.methods.get(name);
        if (typeof featureMethod === "undefined") {
            throw new CompilerError(`Unknown member "${name}".`);
        }
        return featureMethod.createMethod(this);
    }
    
    setMemberItem(name, item) {
        if (this.fields.has(name)) {
            return this.fields.set(name, item);
        }
        throw new CompilerError(`Unknown field "${name}".`);
    }
}


