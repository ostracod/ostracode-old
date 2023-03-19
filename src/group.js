
import { Node } from "./node.js";

export class Group extends Node {
    
    constructor(components) {
        super();
        this.components = components;
    }
    
    getLineNum() {
        return this.components[0].getLineNum();
    }
}

export class PreGroup extends Group {
    
    constructor(components) {
        super(components);
        this.setChildren(this.components);
    }
}

export class ResolvedGroup extends Group {
    
    resolveVars() {
        // Do nothing.
    }
    
    resolveExprsAndVars() {
        this.resolveVars();
        for (const node of this.children) {
            node.resolveExprsAndVars();
        }
    }
}


