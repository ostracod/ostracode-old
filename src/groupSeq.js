
import { FlowControl } from "./constants.js";
import { constructors } from "./constructors.js";
import { Node } from "./node.js";
import { PreStmt } from "./preStmt.js";
import { PreExpr } from "./preExpr.js";
import { EvalContext } from "./evalContext.js";
import { ResultRef } from "./itemRef.js";
import { EvalCompartment, CompCompartment } from "./compartment.js";

export class GroupSeq extends Node {
    
    constructor(groups) {
        super();
        this.setGroups(groups);
        this.lineNum = null;
    }
    
    setGroups(groups) {
        this.groups = groups;
        this.setChildren(this.groups);
    }
    
    getLineNum() {
        return this.lineNum;
    }
    
    resolveStmts() {
        for (const group of this.groups) {
            group.resolveStmts();
        }
    }
    
    resolveVars() {
        // Do nothing.
    }
    
    resolveExprsAndVars() {
        this.resolveVars();
        for (const group of this.groups) {
            group.resolveExprsAndVars();
        }
    }
}

// StmtSeq = Statement sequence
export class StmtSeq extends GroupSeq {
    
    resolveStmts() {
        const stmts = this.groups.map((stmt) => (
            (stmt instanceof PreStmt) ? stmt.resolve() : stmt
        ));
        this.setGroups(stmts);
        super.resolveStmts();
    }
}

// BhvrStmtSeq = Behavior statement sequence
// Represents `{...}`.
export class BhvrStmtSeq extends StmtSeq {
    
    resolveVars() {
        for (const stmt of this.groups) {
            this.addVars(stmt.getParentVars());
        }
    }
    
    shouldStoreCompartmentsHelper() {
        return true;
    }
    
    evaluate(parentContext) {
        const evalContext = new EvalContext({ parent: parentContext, node: this });
        for (const stmt of this.groups) {
            const result = stmt.evaluate(evalContext);
            if (result.flowControl !== FlowControl.None) {
                return result;
            }
        }
        return { flowControl: FlowControl.None };
    }
    
    iterateCompItems(compContext, handle) {
        for (const stmt of this.groups) {
            stmt.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJsList(jsConverter) {
        const output = [];
        for (const compartment of this.getCompartments()) {
            if (compartment instanceof EvalCompartment) {
                output.push(`let ${compartment.convertToJs(jsConverter)};`);
            }
        }
        this.groups.forEach((stmt) => {
            output.push(stmt.convertToJs(jsConverter));
        });
        return output;
    }
    
    convertToJs(jsConverter) {
        return "{\n" + this.convertToJsList(jsConverter).join("\n") + "\n}";
    }
}

// AttrStmtSeq = Attribute statement sequence
// Represents `[...]`.
export class AttrStmtSeq extends StmtSeq {
    
    getAttrStmt(attrStmtClass) {
        for (const stmt of this.groups) {
            if (stmt instanceof attrStmtClass) {
                return stmt;
            }
        }
        return null;
    }
}

// ExprSeq = Expression sequence
export class ExprSeq extends GroupSeq {
    // Concrete subclasses of ExprSeq must implement these methods:
    // evaluate, iterateCompItems, convertToJsList
    
    constructor(hasFactorType, exprs) {
        super(exprs);
        this.hasFactorType = hasFactorType;
    }
    
    resolveExprsAndVars() {
        const exprs = this.groups.map((expr) => (
            (expr instanceof PreExpr) ? expr.resolve() : expr
        ));
        this.setGroups(exprs);
        super.resolveExprsAndVars();
    }
    
    getConstraintTypesHelper(compContext) {
        return this.groups.map((expr) => expr.getConstraintType(compContext));
    }
    
    getConstraintTypes(compContext) {
        // TODO: Use `hasFactorType`.
        return this.getConstraintTypesHelper(compContext);
    }
    
    getConstraintType(compContext) {
        return this.getConstraintTypes(compContext)[0];
    }
    
    evaluateToItems(evalContext) {
        return this.evaluate(evalContext).map((itemRef) => itemRef.read());
    }
    
    evaluateToItem(evalContext) {
        return this.evaluateToItems(evalContext)[0];
    }
    
    convertToJs(jsConverter) {
        return this.convertToJsList(jsConverter)[0];
    }
}

// EvalExprSeq = Evaltime expression sequence
// Represents `(...)`, and `(*...)`
export class EvalExprSeq extends ExprSeq {
    
    evaluate(evalContext) {
        return this.groups.map((group) => group.evaluate(evalContext));
    }
    
    iterateCompItems(compContext, handle) {
        for (const expr of this.groups) {
            expr.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJsList(jsConverter) {
        return this.groups.map((expr) => expr.convertToJs(jsConverter));
    }
}

// CompExprSeq = Comptime expression sequence
// Represents `<...>`, `<?...>`, `<*...>`, and `<*?...>``.
export class CompExprSeq extends ExprSeq {
    
    constructor(hasFactorType, useConstraintTypes, exprs) {
        super(hasFactorType, exprs);
        this.useConstraintTypes = useConstraintTypes;
        this.itemResolutions = [];
        while (this.itemResolutions.length < this.groups.length) {
            this.itemResolutions.push({ hasResolved: false, item: undefined });
        }
    }
    
    stowCompTypeId(compContext, discerner, typeId) {
        let node = this.parent;
        while (node !== null) {
            const compartment = node.getCompartment(discerner, false);
            if (compartment instanceof CompCompartment) {
                compContext.stowTypeId(compartment, typeId);
            }
            node = node.parent;
        }
    }
    
    stowCompTypeIds(evalContext) {
        for (const content of evalContext.compartmentContentMap.values()) {
            const { compartment: { discerner }, typeId } = content;
            this.stowCompTypeId(evalContext.compContext, discerner, typeId);
        }
    }
    
    resolveCompItem(compContext, expr) {
        expr.validateTypes(compContext);
        // TODO: Use `hasFactorType`.
        if (this.useConstraintTypes) {
            return expr.getConstraintType(compContext);
        } else {
            const evalContext = new EvalContext({ compContext, node: this });
            const output = expr.evaluateToItem(evalContext);
            this.stowCompTypeIds(evalContext);
            return output;
        }
    }
    
    shouldStoreCompartmentsHelper() {
        return true;
    }
    
    resolveCompartments() {
        super.resolveCompartments();
        const output = [];
        if (!this.useConstraintTypes) {
            for (const compartment of this.compartmentMap.values()) {
                output.push(new CompCompartment(compartment.discerner));
            }
        }
        return output;
    }
    
    validateTypes(compContext) {
        // Do nothing. Types have already been validated during comp item resolution.
    }
    
    evaluate(evalContext) {
        const items = evalContext.compContext.getSeqItems(this);
        return items.map((item) => new ResultRef(item));
    }
    
    aggregateCompTypeIds(compContext, typeIdSet) {
        // Do nothing.
    }
    
    iterateCompItems(compContext, handle) {
        compContext.iterateSeqItems(this, handle);
    }
    
    convertToJsList(jsConverter) {
        const items = jsConverter.getCompContext().getSeqItems(this);
        return items.map((item) => jsConverter.convertItemToJs(item));
    }
}

constructors.CompExprSeq = CompExprSeq;


