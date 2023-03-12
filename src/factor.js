
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
    
    constructor(name, context, initItemExpr) {
        super(name, context);
        this.initItemExpr = initItemExpr;
    }
    
    getInitItem() {
        if (this.initItemExpr === null) {
            return undefined;
        }
        return this.initItemExpr.evaluate(this.context);
    }
}

export class FeatureMethod extends FeatureMember {
    
    constructor(name, context, attrStmtSeq, bhvrStmtSeq) {
        super(name, context);
        this.attrStmtSeq = attrStmtSeq;
        this.bhvrStmtSeq = bhvrStmtSeq;
    }
}

let nextFeatureId = 0;

export class Feature {
    
    constructor(fieldStmts, methodStmts, context) {
        this.id = nextFeatureId;
        nextFeatureId += 1;
        this.fields = fieldStmts.map((fieldStmt) => {
            const { name } = fieldStmt;
            if (name === null) {
                fieldStmt.throwError("Feature field must use name identifier.");
            }
            return new FeatureField(name, context, fieldStmt.initItemExprSeq.children[0]);
        });
        this.methods = methodStmts.map((methodStmt) => {
            const { bhvrStmtSeq } = methodStmt;
            if (bhvrStmtSeq === null) {
                methodStmt.throwError("Feature method must provide behavior statement sequence.");
            }
            return new FeatureMethod(
                methodStmt.name, context, methodStmt.attrStmtSeq, bhvrStmtSeq,
            );
        });
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
}


