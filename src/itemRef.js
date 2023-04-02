
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
        throw new CompilerError("Cannot write item to this type of expression.");
    }
}

export class VarRef extends ItemRef {
    
    constructor(varContent) {
        super();
        this.varContent = varContent;
    }
    
    read() {
        return this.varContent.item;
    }
    
    write(item) {
        this.varContent.item = item;
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

export class SubscriptRef extends ItemRef {
    
    constructor(item, subscript) {
        super();
        this.item = item;
        this.subscript = subscript;
    }
    
    read() {
        return this.item[this.subscript];
    }
    
    write(item) {
        this.item[this.subscript] = item;
    }
}


