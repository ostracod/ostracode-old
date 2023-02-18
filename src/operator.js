
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
    
    constructor(text, precedence) {
        super(text);
        this.precedence = precedence;
        binaryOperatorMap.set(this.text, this);
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
new BinaryOperator("@", 1);
new BinaryOperator(":", 0);
new BinaryOperator("::", 0);
new BinaryOperator("=", 14);
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


