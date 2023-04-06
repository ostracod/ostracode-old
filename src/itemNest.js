
export class ItemNest {
    // Concrete subclasses of getRefJs must implement these methods:
    // convertToJs
    
    constructor(parentItem, childItem) {
        this.parentItem = parentItem;
        this.childItem = childItem;
    }
}

export class ListNest extends ItemNest {
    
    constructor(parentItem, childItem, index) {
        super(parentItem, childItem);
        this.index = index;
    }
    
    convertToJs(parentRefCode, childRefCode) {
        return `${parentRefCode}[${this.index}] = ${childRefCode};`;
    }
}


