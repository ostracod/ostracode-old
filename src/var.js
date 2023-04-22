
import * as compUtils from "./compUtils.js";
import { Container } from "./container.js";

export class Var extends Container {
    // Concrete subclasses of Var must implement these methods:
    // getConstraintType, aggregateCompItems
    
    constructor(name) {
        super();
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
        aggregator.addItem(this.getCompItem(aggregator.compContext));
    }
}

export class BuiltInCompVar extends CompVar {
    
    constructor(name, item, constraintType) {
        super(name);
        this.item = item;
        this.constraintType = constraintType;
    }
    
    getConstraintType(compContext) {
        return this.constraintType;
    }
    
    getCompItem(compContext) {
        return this.item;
    }
}

export class StmtCompVar extends CompVar {
    
    constructor(name, stmt) {
        super(name);
        this.stmt = stmt;
    }
    
    getConstraintType(compContext) {
        return this.stmt.getConstraintType(compContext);
    }
    
    getCompItem(compContext) {
        return this.stmt.getCompItem(compContext);
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
    
    getConstraintType(compContext) {
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
    
    getConstraintType(compContext) {
        return this.stmt.getConstraintType(compContext);
    }
}


