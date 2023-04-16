
import { Item } from "./item.js";

let nextTypeId = 0;

export const createTypeId = () => {
    const output = nextTypeId;
    nextTypeId += 1;
    return output;
};

export class ItemType extends Item {
    
}

export class ValueType extends ItemType {
    
}

export class TypeType extends ItemType {
    
    constructor(type = new ItemType()) {
        super();
        this.type = type;
    }
}

export class MissingType extends ValueType {
    
}

export class UndefType extends MissingType {
    
}

export class NullType extends MissingType {
    
}

export class BoolType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
}

export class NumType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
}

export class StrType extends ValueType {
    
    constructor(value = null) {
        super();
        this.value = null;
    }
}


