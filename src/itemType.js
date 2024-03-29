
import { CompilerError } from "./error.js";
import { constructors } from "./constructors.js";
import { Item, AbsentItem } from "./item.js";
import { GenericQualification } from "./qualification.js";

export const copyType = (type) => {
    if (type instanceof ItemType) {
        return type.copy();
    } else if (type instanceof AbsentItem) {
        return type;
    } else {
        throw new Error("Found invalid type.");
    }
};

export class NominalType {
    
    constructor(parent = null) {
        this.parent = parent;
    }
}

export class ItemType extends Item {
    
    constructor() {
        super();
        this.genericExpr = null;
        this.qualifications = [];
        this.nominalType = null;
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
        output.nominalType = this.nominalType;
        return output;
    }
    
    qualify(compContext, args) {
        if (this.genericExpr === null) {
            throw new CompilerError("Cannot qualify item which is not generic.");
        }
        const { exprSeq } = this.genericExpr;
        const argsContext = new constructors.CompContext(exprSeq, compContext);
        const qualifications = this.qualifications.slice();
        qualifications.push(new GenericQualification(this.genericExpr, args));
        for (const qualification of qualifications) {
            argsContext.setQualificationVars(qualification);
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
    
    nominate() {
        const output = this.copy();
        output.nominalType = new NominalType(output.nominalType);
        return output;
    }
    
    containsHelper(type) {
        return true;
    }
    
    contains(type) {
        let { nominalType } = type;
        while (nominalType !== this.nominalType) {
            if (nominalType === null) {
                return false;
            }
            nominalType = nominalType.parent;
        }
        return this.containsHelper(type);
    }
}

export class ValueType extends ItemType {
    
    copyHelper() {
        return new ValueType();
    }
    
    containsHelper(type) {
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
    
    containsHelper(type) {
        return (type instanceof TypeType) ? this.type.contains(type.type) : false;
    }
}

export class MissingType extends ValueType {
    
    copyHelper() {
        return new MissingType();
    }
    
    containsHelper(type) {
        return (type instanceof MissingType);
    }
}

export class UndefType extends MissingType {
    
    copyHelper() {
        return new UndefType();
    }
    
    containsHelper(type) {
        return (type instanceof UndefType);
    }
}

export class NullType extends MissingType {
    
    copyHelper() {
        return new NullType();
    }
    
    containsHelper(type) {
        return (type instanceof NullType);
    }
}

export class OptionalLiteralType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
    
    copyHelper() {
        return new this.constructor(this.value);
    }
    
    containsHelper(type) {
        if (type instanceof this.constructor) {
            return (this.value === null) ? true : (this.value === type.value);
        } else {
            return false;
        }
    }
}

export class BoolType extends OptionalLiteralType {
    
}

export class NumType extends OptionalLiteralType {
    
}

export class StrType extends OptionalLiteralType {
    
}

export class SymbolType extends OptionalLiteralType {
    
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
    
    iterateNestedItems(handle) {
        let result = handle(this.elemType);
        if (typeof result !== "undefined") {
            this.elemType = result.item;
        }
        result = handle(this.elemTypes);
        if (typeof result !== "undefined") {
            this.elemTypes = result.item;
        }
    }
    
    containsHelper(type) {
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


