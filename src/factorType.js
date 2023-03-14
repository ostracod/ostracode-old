
import { ItemType } from "./itemType.js";

export class FactorType extends ItemType {
    
}

export class FeatureTypeMember {
    
    constructor(name) {
        this.name = name;
    }
}

export class FeatureTypeField extends FeatureTypeMember {
    
    constructor(name, typeExprSeq, initItemExprSeq) {
        super(name);
        this.typeExprSeq = typeExprSeq;
        this.initItemExprSeq = initItemExprSeq;
    }
}

export class FeatureTypeMethod extends FeatureTypeMember {
    
    constructor(name, attrStmtSeq) {
        super(name);
        this.attrStmtSeq = attrStmtSeq;
    }
}

export class FeatureType extends ItemType {
    
    constructor(fieldStmts, methodStmts, discerner = null) {
        super();
        this.fields = fieldStmts.map((fieldStmt) => {
            const { name } = fieldStmt;
            if (name === null) {
                fieldStmt.throwError("Feature field must use name identifier.");
            }
            return new FeatureTypeField(
                name, fieldStmt.typeExprSeq, fieldStmt.initItemExprSeq,
            );
        });
        this.methods = methodStmts.map((methodStmt) => {
            return new FeatureTypeMethod(methodStmt.name, methodStmt.attrStmtSeq);
        });
        this.discerner = discerner;
    }
}


