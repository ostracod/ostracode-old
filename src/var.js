
import * as compUtils from "./compUtils.js";

export class Var {
    // Concrete subclasses of Var must implement these methods:
    // getConstraintType, aggregateCompItems
    
    constructor(name) {
        this.name = name;
    }
    
    getJsIdentifier() {
        return compUtils.getJsIdentifier(this.name);
    }
}

export class CompVar extends Var {
    // Concrete subclasses of CompVar must implement these methods:
    // getCompItem
    
    aggregateCompItems(aggregator) {
        aggregator.addItem(this.getCompItem());
    }
}

export class BuiltInCompVar extends CompVar {
    
    constructor(name, item, constraintType) {
        super(name);
        this.item = item;
        this.constraintType = constraintType;
    }
    
    getConstraintType() {
        return this.constraintType;
    }
    
    getCompItem() {
        return this.item;
    }
}

export class StmtCompVar extends CompVar {
    
    constructor(name, stmt) {
        super(name);
        this.stmt = stmt;
    }
    
    getConstraintType() {
        return this.stmt.getConstraintType();
    }
    
    getCompItem() {
        return this.stmt.getCompItem();
    }
}

export class EvalVar extends Var {
    
    aggregateCompItems(aggregator) {
        // Do nothing.
    }
}

export class BuiltInEvalVar extends EvalVar {
    
    constructor(name, constraintType) {
        super(name);
        this.constraintType = constraintType;
    }
    
    getConstraintType() {
        return this.constraintType;
    }
}

export class ReflexiveVar extends BuiltInEvalVar {
    
    convertToRefJs() {
        return "this.obj";
    }
}

// Really wishing I had multiple inheritance right now...
export class StmtEvalVar extends EvalVar {
    
    constructor(name, stmt) {
        super(name);
        this.stmt = stmt;
    }
    
    getConstraintType() {
        return this.stmt.getConstraintType();
    }
}


