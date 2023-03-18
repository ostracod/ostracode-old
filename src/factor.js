
import { CompilerError } from "./error.js";
import * as nodeUtils from "./nodeUtils.js";
import { createTypeId } from "./itemType.js";
import { ArgsStmt } from "./stmt.js";
import { CustomMethod } from "./func.js";

export class Factor {
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
    
    constructor(name, context, initItemExprSeq) {
        super(name, context);
        this.initItemExprSeq = initItemExprSeq;
    }
    
    getInitItem() {
        if (this.initItemExpr === null) {
            return undefined;
        }
        return this.initItemExprSeq.evaluateToItem(this.context);
    }
}

export class FeatureMethod extends FeatureMember {
    
    constructor(name, context, attrStmtSeq, bhvrStmtSeq) {
        super(name, context);
        this.attrStmtSeq = attrStmtSeq;
        this.bhvrStmtSeq = bhvrStmtSeq;
    }
    
    createMethod(item) {
        const argVars = nodeUtils.getChildVars(this.attrStmtSeq, ArgsStmt);
        return new CustomMethod(argVars, this.bhvrStmtSeq, this.context, item);
    }
}

export class Feature {
    
    constructor(fieldStmts, methodStmts, context) {
        this.typeId = createTypeId();
        this.fields = fieldStmts.map((fieldStmt) => {
            const { name } = fieldStmt;
            if (name === null) {
                fieldStmt.throwError("Feature field must use name identifier.");
            }
            return new FeatureField(name, context, fieldStmt.initItemExprSeq);
        });
        // Map from name to FeatureMethod.
        this.methods = new Map();
        for (const methodStmt of methodStmts) {
            const { bhvrStmtSeq } = methodStmt;
            if (bhvrStmtSeq === null) {
                methodStmt.throwError("Feature method must provide behavior statement sequence.");
            }
            const featureMethod = new FeatureMethod(
                methodStmt.name, context, methodStmt.attrStmtSeq, bhvrStmtSeq,
            );
            this.methods.set(featureMethod.name, featureMethod);
        }
    }
    
    getFeatures() {
        return [this];
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
            throw new CompilerError(`Unknown field "${name}".`);
        }
        return featureMethod.createMethod(this.obj);
    }
    
    setMemberItem(name, item) {
        if (this.fields.has(name)) {
            return this.fields.set(name, item);
        }
        throw new CompilerError(`Unknown field "${name}".`);
    }
}


