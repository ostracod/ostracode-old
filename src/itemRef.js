
import { CompilerError } from "./error.js";

export class ItemRef {
    // Concrete subclasses of ItemRef must implement these methods:
    // read, write
}

export class ResultRef extends ItemRef {
    
    constructor(item) {
        super();
        this.item = item;
    }
    
    read() {
        return this.item;
    }
    
    write(item) {
        throw new CompilerError("Cannot read item from this type of expression.");
    }
}

export class VarRef extends ItemRef {
    
    constructor(varItem) {
        super();
        this.varItem = varItem;
    }
    
    read() {
        return this.varItem.item;
    }
    
    write(item) {
        this.varItem.item = item;
    }
}

export class FeatureMemberRef extends ItemRef {
    
    constructor(featureInstance, name) {
        super();
        this.featureInstance = featureInstance;
        this.name = name;
    }
    
    read() {
        return this.featureInstance.getMemberItem(this.name);
    }
    
    write(item) {
        this.featureInstance.setMemberItem(this.name, item);
    }
}


