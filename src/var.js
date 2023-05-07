
import * as compUtils from "./compUtils.js";
import { Container } from "./container.js";

export class Var extends Container {
    // Concrete subclasses of Var must implement these methods:
    // unwrap, getConstraintType
    
    constructor(name) {
        super();
        this.name = name;
    }
    
    isExported() {
        return false;
    }
    
    getJsIdentifier() {
        return compUtils.getJsIdentifier(this.name);
    }
}

export class ImportVar extends Var {
    
    constructor(name, stmt) {
        super(name);
        this.stmt = stmt;
        this.variable = null;
    }
    
    getNonNullVar(compContext) {
        if (this.variable === null) {
            const importStmt = this.stmt.getImportStmt();
            const ostraCodeFile = importStmt.getImportedFile(compContext);
            this.variable = ostraCodeFile.getExportedVar(this.stmt.name);
        }
        return this.variable;
    }
    
    unwrap(compContext) {
        return this.getNonNullVar(compContext).unwrap();
    }
    
    isExported() {
        return this.stmt.hasExportStmt();
    }
    
    getConstraintType(compContext) {
        const type = this.stmt.getConstraintType(compContext);
        if (type === null) {
            return this.getNonNullVar(compContext).getConstraintType(compContext);
        } else {
            return type;
        }
    }
}

export class UnwrappedVar extends Var {
    // Concrete subclasses of UnwrappedVar must implement these methods:
    // iterateCompItems
    
    unwrap() {
        return this;
    }
}

export class CompVar extends UnwrappedVar {
    // Concrete subclasses of CompVar must implement these methods:
    // resolveCompItem
    
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
    
    isExported() {
        return this.stmt.hasExportStmt();
    }
    
    getConstraintType(compContext) {
        return this.constraintType;
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
    
    resolveCompItem(compContext) {
        return this.stmt.resolveCompItem(compContext);
    }
}

export class EvalVar extends UnwrappedVar {
    
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
    
    isExported() {
        return this.stmt.hasExportStmt();
    }
    
    getConstraintType(compContext) {
        return this.stmt.getConstraintType(compContext);
    }
}


