
export class Operator {
    
    constructor(text) {
        this.text = text;
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

new BinaryOperator("#sl", 5);
new BinaryOperator("+", 4);
new BinaryOperator("*", 3);


