
import { UnknownItemError } from "./error.js";
import { Item, UnresolvedItem } from "./item.js";
import { ItemType, copyType } from "./itemType.js";

export class Anchor extends Item {
    
    constructor(variable) {
        super();
        this.variable = variable;
    }
}

export class AnchorType extends ItemType {
    
    constructor(type = new ItemType()) {
        super();
        this.type = type;
    }
    
    copyHelper() {
        return new AnchorType(copyType(this.type));
    }
    
    iterateNestedItems(handle) {
        const result = handle(this.type);
        if (typeof result !== "undefined") {
            this.type = result.item;
        }
    }
    
    containsHelper(type) {
        if (!(type instanceof AnchorType)) {
            return false;
        }
        if (this.type instanceof UnresolvedItem) {
            throw new UnknownItemError(this.type);
        }
        if (type.type instanceof UnresolvedItem) {
            throw new UnknownItemError(type.type);
        }
        return this.type.contains(type.type);
    }
}


