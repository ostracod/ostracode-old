
import { ItemType } from "./itemType.js";
import { FeatureMemberRef } from "./itemRef.js";

export class FactorType extends ItemType {
    // Concrete subclasses of FactorType must implement these methods:
    // getObjMember
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
        this.methods = methodStmts.map((methodStmt) => (
            new FeatureTypeMethod(methodStmt.name, methodStmt.attrStmtSeq)
        ));
        this.discerner = discerner;
    }
    
    getObjMember(obj, name, context) {
        const typeId = context.getTypeId(this.discerner);
        const featureInstance = obj.featureInstances.get(typeId);
        return new FeatureMemberRef(featureInstance, name);
    }
}


