
export class Item {
    // Concrete subclasses of Item must implement these methods:
    // convertToJs
    
    // Note that this may exclude items returned by `getClosureItems`.
    getNestedItems() {
        return [];
    }
    
    // Returns a map from Var to item.
    getClosureItems() {
        return new Map();
    }
}


