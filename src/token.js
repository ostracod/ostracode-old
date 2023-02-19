
import { Node } from "./node.js";

export class Token extends Node {
    
    constructor(text, lineNumber) {
        super();
        this.text = text;
        this.lineNumber = lineNumber;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}

export class WordToken extends Token {
    
}

export class NumToken extends Token {
    // Concrete subclasses of NumToken must implement these methods:
    // getNum
}

export class DecNumToken extends NumToken {
    
    getNum() {
        return parseInt(this.text, 10);
    }
}

export class HexNumToken extends NumToken {
    
    getNum() {
        return parseInt(this.text, 16);
    }
}

export class CharToken extends NumToken {
    
    getNum() {
        return this.text.charCodeAt(0);
    }
}

export class StrToken extends Token {
    
}

export class DelimiterToken extends Token {
    
}

export class OpenBracketToken extends DelimiterToken {
    
}

export class CloseBracketToken extends DelimiterToken {
    
}

export class SeparatorToken extends DelimiterToken {
    
}

export class OperatorToken extends Token {
    
}


