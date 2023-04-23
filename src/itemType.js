
import { Item } from "./item.js";
import { CompExprSeq } from "./groupSeq.js";
import { CompContext } from "./compContext.js";

let nextTypeId = 0;

export const createTypeId = () => {
    const output = nextTypeId;
    nextTypeId += 1;
    return output;
};

export class ItemType extends Item {
    
    constructor() {
        super();
        this.qualifications = [];
    }
    
    copyHelper() {
        return new ItemType();
    }
    
    copy() {
        const output = this.copyHelper();
        output.qualifications = this.qualifications.map(
            (qualification) => qualification.copy(),
        );
        return output;
    }
    
    qualify(compContext, inputArgs) {
        const { genericExpr } = this.qualifications.at(-1);
        const compExprSeqs = genericExpr.getNodesByClass(CompExprSeq);
        const argsContext = new CompContext(compExprSeqs, compContext);
        let hasUsedArgs = false;
        for (let index = this.qualifications.length - 1; index >= 0; index--) {
            const qualification = this.qualifications[index];
            let { args } = qualification;
            if (args === null && !hasUsedArgs) {
                args = inputArgs;
                hasUsedArgs = true;
            }
            if (args !== null) {
                argsContext.addGenericArgs(qualification.genericExpr, args);
            }
        }
        argsContext.resolveCompItems();
        return genericExpr.getConstraintType(argsContext);
    }
}

export class ValueType extends ItemType {
    
    copyHelper() {
        return new ValueType();
    }
}

export class TypeType extends ItemType {
    
    constructor(type = new ItemType()) {
        super();
        this.type = type;
    }
    
    copyHelper() {
        return new TypeType(this.type.copy());
    }
}

export class MissingType extends ValueType {
    
    copyHelper() {
        return new MissingType();
    }
}

export class UndefType extends MissingType {
    
    copyHelper() {
        return new UndefType();
    }
}

export class NullType extends MissingType {
    
    copyHelper() {
        return new NullType();
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
}

export class NumType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
    
    copyHelper() {
        return new NumType(this.value);
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
}

export class ListType extends ValueType {
    
    constructor(elemType = null) {
        super();
        this.elemType = elemType;
    }
    
    copyHelper() {
        const elemType = (this.elemType === null) ? null : this.elemType.copy();
        return new ListType(elemType);
    }
}


