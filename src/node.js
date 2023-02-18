
import { CompilerErrorThrower } from "./error.js";

export class Node extends CompilerErrorThrower {
    
    constructor() {
        super();
        this.parent = null;
        this.children = [];
    }
    
    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }
    
    setChildren(children) {
        for (const child of this.children) {
            if (child.parent === this) {
                child.parent = null;
            }
        }
        this.children = [];
        for (const child of children) {
            this.addChild(child);
        }
    }
    
    getDisplayString(indentation = "") {
        const textList = [indentation + this.constructor.name];
        const nextIndentation = indentation + "    ";
        for (const child of this.children) {
            textList.push(child.getDisplayString(nextIndentation));
        }
        return textList.join("\n");
    }
}


