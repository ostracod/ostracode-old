
import { Node } from "./node.js";

export class Group extends Node {
    
    constructor(components) {
        super();
        this.components = components;
        this.setChildren(this.components);
    }
    
    getLineNumber() {
        return this.components[0].getLineNumber();
    }
}

export class PreGroup extends Group {
    
}

export class ResolvedGroup extends Group {
    
}


