
import { FlowControl } from "./constants.js";
import * as nodeUtils from "./nodeUtils.js";
import { EvalContext } from "./evalContext.js";
import { ArgsStmt } from "./stmt.js";

export class Func {
    // Concrete subclasses of Func must implement these methods:
    // evaluate, convertToJs
}

export class BuiltInFunc extends Func {
    
}

export class CustomFunc extends Func {
    
    constructor(argVars, bhvrStmtSeq, parentContext) {
        super();
        this.argVars = argVars;
        this.bhvrStmtSeq = bhvrStmtSeq;
        this.closureContext = new EvalContext();
        // TODO: Add closure variables for default arg items.
        this.bhvrStmtSeq.buildClosureContext(this.closureContext, parentContext);
    }
    
    getParentContext() {
        return this.closureContext;
    }
    
    evaluate(args) {
        const context = new EvalContext(this.argVars, [], this.getParentContext());
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            const variable = this.argVars[index];
            // TODO: Populate default arg items.
            context.getRef(variable).write(item);
        }
        const result = this.bhvrStmtSeq.evaluate(context);
        if (result.flowControl === FlowControl.Return) {
            return result.returnItem;
        } else if (result.flowControl !== FlowControl.None) {
            result.stmt.throwError("Invalid flow control statement in function.");
        }
    }
    
    convertToJs(itemConverter) {
        // TODO: Handle default arg items.
        const argIdentifiers = this.argVars.map((argVar) => argVar.getJsIdentifier());
        const bhvrCode = this.bhvrStmtSeq.convertToJs(itemConverter);
        return `(${argIdentifiers.join(", ")}) => ${bhvrCode}`;
    }
}

export class CustomMethod extends CustomFunc {
    
    constructor(methodStmt, parentContext, featureInstance) {
        const argVars = nodeUtils.getChildVars(methodStmt.attrStmtSeq, ArgsStmt);
        if (methodStmt.bhvrStmtSeq === null) {
            methodStmt.throwError("Feature method must provide behavior statement sequence.");
        }
        super(argVars, methodStmt.bhvrStmtSeq, parentContext);
        this.methodStmt = methodStmt;
        this.featureInstance = featureInstance;
    }
    
    getParentContext() {
        const { selfVar } = this.methodStmt;
        const featureExpr = this.methodStmt.getFeatureExpr();
        const parentContext = super.getParentContext();
        const output = new EvalContext([selfVar], [featureExpr], parentContext);
        output.getRef(selfVar).write(this.featureInstance.obj);
        output.stowTypeId(featureExpr, this.featureInstance.feature.typeId);
        return output;
    }
}


