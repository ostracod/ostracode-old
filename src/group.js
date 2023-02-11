
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

export class GroupSeq extends Node {
    
    constructor(groups) {
        super();
        this.groups = groups;
        if (this.groups !== null) {
            this.setChildren(this.groups);
        }
        this.lineNumber = null;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}


