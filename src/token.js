
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

export class NumberToken extends Token {
    
}

export class DecNumberToken extends NumberToken {
    
}

export class HexNumberToken extends NumberToken {
    
}

export class CharToken extends Token {
    
}

export class StringToken extends Token {
    
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


