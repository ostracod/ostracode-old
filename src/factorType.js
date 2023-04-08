
import { CompilerError } from "./error.js";
import { ItemType } from "./itemType.js";
import { FeatureMemberRef } from "./itemRef.js";

export class FactorType extends ItemType {
    // Concrete subclasses of FactorType must implement these methods:
    // getCompartment
    
    getObjMember(obj, name, context) {
        const compartment = this.getCompartment(name);
        if (compartment === null) {
            throw new CompilerError("Cannot retrieve member of feature without discerned type.");
        }
        const typeId = context.getTypeId(compartment);
        const featureInstance = obj.featureInstances.get(typeId);
        return new FeatureMemberRef(featureInstance, name);
    }
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

export class FeatureType extends FactorType {
    
    constructor(fieldStmts, methodStmts, compartment = null) {
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
        this.compartment = compartment;
    }
    
    getCompartment(name) {
        return this.compartment;
    }
}


