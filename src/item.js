
export class Item {
    // Concrete subclasses of Item must implement these methods:
    // convertToJs
    
    // Note that this may exclude items returned by `getClosureItems`.
    iterateNestedItems(handle) {
        // Do nothing.
    }
    
    // Returns a map from Var to item.
    getClosureItems() {
        return new Map();
    }
}

export class UnknownItem extends Item {
    
}

// Unresolved items are currently not known, but may become known
// after their comptime expressions are evaluated.
export class UnresolvedItem extends UnknownItem {
    
    constructor(compExprSeq, index) {
        super();
        this.compExprSeq = compExprSeq;
        this.index = index;
    }
}

// Absent items cannot be known, because they originate from
// unassigned arguments of generic items.
export class AbsentItem extends UnknownItem {
    
}


