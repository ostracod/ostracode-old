
import { CompilerError } from "./error.js";
import { ResultRef, SubscriptRef } from "./itemRef.js";

export class Operator {
    
    constructor(text) {
        this.text = text;
    }
}

// Map from text to UnaryOperator.
export const unaryOperatorMap = new Map();

export class UnaryOperator extends Operator {
    constructor(text) {
        super(text);
        unaryOperatorMap.set(this.text, this);
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

export class SubscriptOperator extends BinaryOperator {
    
    constructor() {
        super("@", 1);
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

export class QualificationOperator extends BinaryOperator {
    
    constructor() {
        super("+:", 0);
    }
    
    getConstraintType(compContext, expr1, expr2) {
        const type = expr1.getConstraintType(compContext);
        const args = compContext.getSeqItems(expr2.exprSeq);
        return type.qualify(compContext, args);
    }
    
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
new SubscriptOperator();
new BinaryOperator(":", 0);
new BinaryOperator("::", 0);
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


