
export class Token {
    
    constructor(text) {
        this.text = text;
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

export class OperatorToken extends Token {
    
}


