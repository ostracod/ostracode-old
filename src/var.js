
import * as compUtils from "./compUtils.js";
import { Container } from "./container.js";
import { UnresolvedVarItem } from "./item.js";

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
    // getUnknownItem, resolveCompItem
    
    iterateCompItems(compContext, handle) {
        const item = compContext.getVarItem(this);
        const result = handle(item);
        if (typeof result !== "undefined") {
            compContext.setVarItem(this, result.item);
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
    
    getUnknownItem() {
        return new UnresolvedVarItem(this);
    }
    
    resolveCompItem(compContext) {
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
    
    getUnknownItem() {
        return this.stmt.getUnknownItem();
    }
    
    resolveCompItem(compContext) {
        return this.stmt.resolveCompItem(compContext);
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


