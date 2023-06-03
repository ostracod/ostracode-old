
import { CompilerError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { ObjType } from "./obj.js";
import { ResultRef, SubscriptRef } from "./itemRef.js";
import { Anchor } from "./anchor.js";
import { CompVar } from "./var.js";

export class Operator {
    
    constructor(text) {
        this.text = text;
    }
}

// Map from text to UnaryOperator.
export const unaryOperatorMap = new Map();

export class UnaryOperator extends Operator {
    // Concrete subclasses of BinaryOperator must implement these methods:
    // perform, convertToJs
    
    constructor(text) {
        super(text);
        unaryOperatorMap.set(this.text, this);
    }
    
    iterateCompItems(compContext, expr, handle) {
        expr.iterateCompItems(compContext, handle);
    }
}

export class DereferenceOperator extends UnaryOperator {
    
    constructor() {
        super("%");
    }
    
    perform(evalContext, expr) {
        const anchor = expr.evaluateToItem(evalContext);
        return evalContext.derefAnchor(anchor);
    }
    
    getAnchorVar(compContext, expr) {
        return compContext.getSeqItem(expr.exprSeq).variable;
    }
    
    iterateCompItems(compContext, expr, handle) {
        const variable = this.getAnchorVar(compContext, expr);
        variable.iterateCompItems(compContext, handle);
    }
    
    convertToJs(expr, jsConverter) {
        const compContext = jsConverter.getCompContext();
        const variable = this.getAnchorVar(compContext, expr);
        // TODO: Handle the case when the variable must be imported.
        if (variable instanceof CompVar) {
            const item = compContext.getVarItem(variable);
            return jsConverter.convertItemToJs(item);
        } else {
            return variable.getJsIdentifier();
        }
    }
}

export const identifierOperatorMap = new Map();

export class IdentifierOperator extends Operator {
    
    constructor(text) {
        super(text);
        identifierOperatorMap.set(this.text, this);
    }
    
    buildClosureContext(destContext, srcContext, expr, name) {
        // Do nothing.
    }
}

export class FeatureFieldOperator extends IdentifierOperator {
    // Concrete subclasses of BinaryOperator must implement these methods:
    // perform, convertToJs
    
    constructor() {
        super(".");
    }
    
    buildClosureContext(destContext, srcContext, expr, name) {
        const type = expr.getConstraintType(srcContext.compContext);
        if (type instanceof ObjType) {
            const anchor = type.factorType.getAnchor(name);
            if (anchor instanceof Anchor) {
                const content = srcContext.getVarContentByVar(anchor.variable);
                if (content !== null) {
                    destContext.addVarContent(content);
                }
            }
        }
    }
    
    perform(evalContext, expr, name) {
        const item = expr.evaluateToItem(evalContext);
        const type = expr.getConstraintType(evalContext.compContext);
        if (type instanceof ObjType) {
            return type.factorType.getObjMember(item, name, evalContext);
        } else {
            throw new Error("Item member access is not yet implemented.");
        }
    }
    
    convertToJs(expr, name, jsConverter) {
        const type = expr.getConstraintType(jsConverter.getCompContext());
        if (type instanceof ObjType) {
            const anchor = type.factorType.getAnchor(name);
            return `${expr.convertToJs(jsConverter)}[${jsConverter.convertVarToRefJs(anchor.variable)}].${compUtils.getJsIdentifier(name)}`;
        } else {
            throw new Error("Item member access is not yet implemented.");
        }
    }
}

export class IdentifierSubscriptOperator extends IdentifierOperator {
    
    constructor() {
        super("@");
    }
}

// Map from text to BinaryOperator.
export const binaryOperatorMap = new Map();

export class BinaryOperator extends Operator {
    // Concrete subclasses of BinaryOperator must implement these methods:
    // getConstraintType, perform
    
    constructor(text, precedence) {
        super(text);
        this.precedence = precedence;
        binaryOperatorMap.set(this.text, this);
    }
    
    perform(itemRef1, itemRef2) {
        throw new CompilerError(`"${this.text}" operator is not yet implemented.`);
    }
    
    iterateCompItems(compContext, expr1, expr2, handle) {
        expr1.iterateCompItems(compContext, handle);
        expr2.iterateCompItems(compContext, handle);
    }
    
    convertToJs(expr1, expr2, jsConverter) {
        const code1 = expr1.convertToJs(jsConverter);
        const code2 = expr2.convertToJs(jsConverter);
        return `(${code1} ${this.text} ${code2})`;
    }
}

export class ExprSubscriptOperator extends BinaryOperator {
    
    constructor() {
        super("@/", 1);
    }
    
    perform(itemRef1, itemRef2) {
        const item = itemRef1.read();
        const subscript = itemRef2.read();
        return new SubscriptRef(item, subscript);
    }
    
    convertToJs(expr1, expr2, jsConverter) {
        const code1 = expr1.convertToJs(jsConverter);
        const code2 = expr2.convertToJs(jsConverter);
        return `${code1}[${code2}]`;
    }
}

export class TypeChangeOperator extends BinaryOperator {
    
    perform(itemRef1, itemRef2) {
        return itemRef1;
    }
    
    iterateCompItems(compContext, expr1, expr2, handle) {
        expr1.iterateCompItems(compContext, handle);
    }
    
    convertToJs(expr1, expr2, jsConverter) {
        return expr1.convertToJs(jsConverter);
    }
}

export class ForceCastOperator extends TypeChangeOperator {
    
    constructor() {
        super("::", 0);
    }
    
    getConstraintType(compContext, expr1, expr2) {
        const type = compContext.getSeqItem(expr2.exprSeq);
        compUtils.validateKnownItems([type]);
        return type;
    }
}

export class QualificationOperator extends TypeChangeOperator {
    
    constructor() {
        super("+:", 0);
    }
    
    getConstraintType(compContext, expr1, expr2) {
        const type = expr1.getConstraintType(compContext);
        const args = compContext.getSeqItems(expr2.exprSeq);
        compUtils.validateKnownItems([type, ...args]);
        return type.qualify(compContext, args);
    }
}

export class AssignOperator extends BinaryOperator {
    
    constructor() {
        super("=", 14);
    }
    
    perform(itemRef1, itemRef2) {
        const item = itemRef2.read();
        itemRef1.write(item);
        return new ResultRef(item);
    }
}

new UnaryOperator("-");
new UnaryOperator("~");
new UnaryOperator("!");
new DereferenceOperator();

new FeatureFieldOperator();
new IdentifierSubscriptOperator();

new BinaryOperator("+", 4);
new BinaryOperator("-", 4);
new BinaryOperator("*", 3);
new BinaryOperator("/", 3);
new BinaryOperator("%", 3);
new BinaryOperator("**", 2);
new BinaryOperator("|", 10);
new BinaryOperator("&", 8);
new BinaryOperator("^", 9);
new BinaryOperator("#sl", 5);
new BinaryOperator("#sr", 5);
new BinaryOperator("#srz", 5);
new BinaryOperator("#lt", 6);
new BinaryOperator("#gt", 6);
new BinaryOperator("#lte", 6);
new BinaryOperator("#gte", 6);
new BinaryOperator("#eq", 7);
new BinaryOperator("#neq", 7);
new BinaryOperator("||", 13);
new BinaryOperator("&&", 11);
new BinaryOperator("^^", 12);
new ExprSubscriptOperator();
new BinaryOperator(":", 0);
new ForceCastOperator();
new QualificationOperator();
new AssignOperator();
new BinaryOperator("+=", 14);
new BinaryOperator("-=", 14);
new BinaryOperator("*=", 14);
new BinaryOperator("/=", 14);
new BinaryOperator("%=", 14);
new BinaryOperator("**=", 14);
new BinaryOperator("|=", 14);
new BinaryOperator("&=", 14);
new BinaryOperator("^=", 14);
new BinaryOperator("||=", 14);
new BinaryOperator("&&=", 14);
new BinaryOperator("^^=", 14);
new BinaryOperator("#sl=", 14);
new BinaryOperator("#sr=", 14);
new BinaryOperator("#srz=", 14);


