
import { CompilerError } from "./error.js";

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

// Absent items cannot be known, because they originate from
// unassigned arguments of generic items.
export class AbsentItem extends UnknownItem {
    
    convertToJs(jsConverter) {
        throw new CompilerError("Cannot convert absent item to JS.");
    }
}

// Unresolved items are currently not known, but may become known
// after their comptime expressions or variables are resolved.
export class UnresolvedItem extends UnknownItem {
    // Concrete subclasses of UnresolvedItem must implement these methods:
    // read
}

export class UnresolvedExprItem extends UnresolvedItem {
    
    constructor(compExprSeq, index) {
        super();
        this.compExprSeq = compExprSeq;
        this.index = index;
    }
    
    read(compContext) {
        const items = compContext.getSeqItems(this.compExprSeq);
        return items[this.index];
    }
}

export class UnresolvedVarItem extends UnresolvedItem {
    
    constructor(compVar) {
        super();
        this.compVar = compVar;
    }
    
    read(compContext) {
        return compContext.getVarItem(this.compVar);
    }
}


