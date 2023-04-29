
import * as compUtils from "./compUtils.js";
import { Container } from "./container.js";
import { AbsentItem } from "./item.js";

export class Var extends Container {
    // Concrete subclasses of Var must implement these methods:
    // getConstraintType, iterateCompItems
    
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
    // getCompItemHelper, setCompItemHelper
    
    getCompItem(compContext) {
        const item = compContext.getVarItem(this);
        return (item instanceof AbsentItem) ? this.getCompItemHelper(compContext) : item;
    }
    
    setCompItem(compContext, item) {
        if (compContext.hasVar(this)) {
            compContext.setVarItem(this, item);
        } else {
            this.setCompItemHelper(compContext, item);
        }
    }
    
    iterateCompItems(compContext, handle) {
        const item = this.getCompItem(compContext);
        const result = handle(item);
        if (typeof result !== "undefined") {
            this.setCompItem(compContext, result.item);
        }
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
    
    getCompItemHelper(compContext) {
        return this.item;
    }
    
    setCompItemHelper(compContext, item) {
        this.item = item;
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
    
    getCompItemHelper(compContext) {
        return this.stmt.getCompItem(compContext);
    }
    
    setCompItemHelper(compContext, item) {
        this.stmt.setCompItem(compContext, item);
    }
}

export class EvalVar extends Var {
    
    iterateCompItems(compContext, handle) {
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


