
import { CompilerError } from "./error.js";
import { FlowControl } from "./constants.js";
import * as nodeUtils from "./nodeUtils.js";
import { EvalContext } from "./evalContext.js";
import { ArgsStmt } from "./stmt.js";
import { CompItemAggregator } from "./aggregator.js";
import { Item } from "./item.js";

export class InvocableItem extends Item {
    // Concrete subclasses of InvocableItem must implement these methods:
    // evaluate
    
}

export class BuiltInFunc extends InvocableItem {
    
}

export class InvocableDeclaration {
    
    constructor(argVars, bhvrStmtSeq, parentContext) {
        this.argVars = argVars;
        this.bhvrStmtSeq = bhvrStmtSeq;
        this.closureContext = new EvalContext();
        // TODO: Add closure variables for default arg items.
        this.bhvrStmtSeq.buildClosureContext(this.closureContext, parentContext);
    }
    
    evaluate(parentContext, args) {
        const context = new EvalContext(parentContext);
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            const variable = this.argVars[index];
            // TODO: Populate default arg items.
            context.addVar(variable, item);
        }
        const result = this.bhvrStmtSeq.evaluate(context);
        if (result.flowControl === FlowControl.Return) {
            return result.returnItem;
        } else if (result.flowControl !== FlowControl.None) {
            result.stmt.throwError("Invalid flow control statement in function.");
        }
    }
}

export class CustomInvocable extends InvocableItem {
    // Concrete subclasses of CustomInvocable must implement these methods:
    // getDeclaration
    
    getParentContext() {
        return this.getDeclaration().closureContext;
    }
    
    evaluate(args) {
        const parentContext = this.getParentContext();
        return this.getDeclaration().evaluate(parentContext, args);
    }
    
    getNestedItems() {
        const aggregator = new CompItemAggregator();
        this.getDeclaration().bhvrStmtSeq.aggregateCompItems(aggregator);
        return aggregator.getItems();
    }
    
    getClosureItems() {
        return this.getDeclaration().closureContext.getVarItemMap();
    }
    
    getArgIdentifiers() {
        return this.declaration.argVars.map((argVar) => argVar.getJsIdentifier());
    }
    
    getBhvrCode(jsConverter) {
        return this.declaration.bhvrStmtSeq.convertToJs(jsConverter);
    }
}

export class CustomFunc extends CustomInvocable {
    
    constructor(argVars, bhvrStmtSeq, parentContext) {
        super();
        this.declaration = new InvocableDeclaration(argVars, bhvrStmtSeq, parentContext);
    }
    
    getDeclaration() {
        return this.declaration;
    }
    
    convertToJs(jsConverter) {
        // TODO: Handle default arg items.
        const argIdentifiers = this.getArgIdentifiers();
        const bhvrCode = this.getBhvrCode(jsConverter);
        return `(${argIdentifiers.join(", ")}) => ${bhvrCode}`;
    }
}

export class CustomMethod extends CustomInvocable {
    
}

export class UnboundCustomMethod extends CustomMethod {
    
    constructor(methodExpr, parentContext) {
        super();
        const argVars = nodeUtils.getChildVars(methodExpr.attrStmtSeq, ArgsStmt);
        this.declaration = new InvocableDeclaration(
            argVars, methodExpr.bhvrStmtSeq, parentContext,
        );
        this.methodExpr = methodExpr;
    }
    
    getDeclaration() {
        return this.declaration;
    }
    
    evaluate(args) {
        throw new CompilerError("Cannot invoke unbound method.");
    }
    
    convertToJs(jsConverter) {
        // TODO: Handle default arg items.
        const argIdentifiers = this.getArgIdentifiers();
        const bhvrCode = this.getBhvrCode(jsConverter);
        return `(function (${argIdentifiers.join(", ")}) ${bhvrCode})`;
    }
}

export class BoundCustomMethod extends CustomMethod {
    
    constructor(unboundMethod, featureInstance) {
        super();
        this.unboundMethod = unboundMethod;
        this.featureInstance = featureInstance;
    }
    
    getParentContext() {
        const { methodExpr } = this.unboundMethod;
        const featureExpr = methodExpr.getFeatureExpr();
        const compartment = featureExpr.getDiscernerCompartment();
        const output = new EvalContext(super.getParentContext());
        output.addVar(methodExpr.selfVar, this.featureInstance.obj);
        output.addCompartment(compartment, this.featureInstance.feature.typeId);
        return output;
    }
    
    getDeclaration() {
        return this.unboundMethod.getDeclaration();
    }
}


