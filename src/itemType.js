
import { CompilerError } from "./error.js";
import { Item, AbsentItem } from "./item.js";
import { CompExprSeq } from "./groupSeq.js";
import { CompContext } from "./compContext.js";
import { GenericQualification } from "./qualification.js";

let nextTypeId = 0;

export const createTypeId = () => {
    const output = nextTypeId;
    nextTypeId += 1;
    return output;
};

const copyType = (type) => {
    if (type instanceof ItemType) {
        return type.copy();
    } else if (type instanceof AbsentItem) {
        return type;
    } else {
        throw new Error("Found invalid type.");
    }
};

export class ItemType extends Item {
    
    constructor() {
        super();
        this.genericExpr = null;
        this.qualifications = [];
    }
    
    copyHelper() {
        return new ItemType();
    }
    
    copy() {
        const output = this.copyHelper();
        output.genericExpr = this.genericExpr;
        output.qualifications = this.qualifications.map(
            (qualification) => qualification.copy(),
        );
        return output;
    }
    
    qualify(compContext, args) {
        if (this.genericExpr === null) {
            throw new CompilerError("Cannot qualify item which is not generic.");
        }
        const { exprSeq } = this.genericExpr;
        const compExprSeqs = exprSeq.getNodesByClass(CompExprSeq);
        const qualifications = this.qualifications.slice();
        qualifications.push(new GenericQualification(this.genericExpr, args));
        const argsContext = new CompContext(compExprSeqs, compContext);
        for (const qualification of qualifications) {
            argsContext.addQualificationVars(qualification);
        }
        argsContext.resolveCompItems();
        const output = exprSeq.getConstraintType(argsContext).copy();
        for (const oldQualification of qualifications) {
            if (!output.qualifications.some((qualification) => (oldQualification.genericExpr === qualification.genericExpr))) {
                output.qualifications.push(oldQualification);
            }
        }
        return output;
    }
    
    contains(type) {
        return true;
    }
}

export class ValueType extends ItemType {
    
    copyHelper() {
        return new ValueType();
    }
    
    contains(type) {
        return (type instanceof ValueType);
    }
}

export class TypeType extends ItemType {
    
    constructor(type = new ItemType()) {
        super();
        this.type = type;
    }
    
    copyHelper() {
        return new TypeType(copyType(this.type));
    }
    
    contains(type) {
        return (type instanceof TypeType) ? this.type.contains(type.type) : false;
    }
}

export class MissingType extends ValueType {
    
    copyHelper() {
        return new MissingType();
    }
    
    contains(type) {
        return (type instanceof MissingType);
    }
}

export class UndefType extends MissingType {
    
    copyHelper() {
        return new UndefType();
    }
    
    contains(type) {
        return (type instanceof UndefType);
    }
}

export class NullType extends MissingType {
    
    copyHelper() {
        return new NullType();
    }
    
    contains(type) {
        return (type instanceof NullType);
    }
}

export class BoolType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
    
    copyHelper() {
        return new BoolType(this.value);
    }
    
    contains(type) {
        if (type instanceof BoolType) {
            return (this.value === null) ? true : (this.value === type.value);
        } else {
            return false;
        }
    }
}

export class NumType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
    
    copyHelper() {
        return new NumType(this.value);
    }
    
    contains(type) {
        if (type instanceof NumType) {
            return (this.value === null) ? true : (this.value === type.value);
        } else {
            return false;
        }
    }
}

export class StrType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
    
    copyHelper() {
        return new StrType(this.value);
    }
    
    contains(type) {
        if (type instanceof StrType) {
            return (this.value === null) ? true : (this.value === type.value);
        } else {
            return false;
        }
    }
}

export class ListType extends ValueType {
    
    constructor(elemType = new ItemType(), elemTypes = null) {
        super();
        this.elemType = elemType;
        this.elemTypes = elemTypes;
    }
    
    copyHelper() {
        let elemTypes;
        if (this.elemTypes === null) {
            elemTypes = null;
        } else {
            elemTypes = this.elemTypes.map(copyType);
        }
        return new ListType(copyType(this.elemType), elemTypes);
    }
    
    contains(type) {
        if (!(type instanceof ListType)) {
            return false;
        }
        if (type.elemTypes === null) {
            if (this.elemTypes === null) {
                return this.elemType.contains(type.elemType);
            } else {
                return this.elemTypes.every((elemType) => elemType.contains(type.elemType));
            }
        } else {
            if (this.elemTypes === null) {
                return type.elemTypes.every((elemType) => this.elemType.contains(elemType));
            } else {
                if (this.elemTypes.length !== type.elemTypes.length) {
                    return false;
                }
                for (let index = 0; index < this.elemTypes.length; index += 1) {
                    const elemType1 = this.elemTypes[index];
                    const elemType2 = type.elemTypes[index];
                    if (!elemType1.contains(elemType2)) {
                        return false;
                    }
                }
                return true;
            }
        }
    }
}


