
import { delimiterTextList, operatorTextList } from "./constants.js";
import { CompilerError } from "./error.js";
import { WordToken, NumberToken, CharToken, StringToken, DelimiterToken, OperatorToken } from "./token.js";
import { BhvrPreStmtSeq } from "./preStmt.js";

const isNumberChar = (charCode) => (charCode >= 48 && charCode <= 57);

const isFirstWordChar = (charCode) => (
    (charCode >= 65 && charCode <= 90)
    || (charCode >= 97 && charCode <= 122)
    || charCode === 95 || charCode === 36
);

const isWordChar = (charCode) => (isFirstWordChar(charCode) || isNumberChar(charCode));

export class TokenParser {
    
    constructor(content) {
        this.content = content;
        this.index = 0;
    }
    
    peekChar() {
        if (this.index < this.content.length) {
            return this.content.charCodeAt(this.index);
        } else {
            return null;
        }
    }
    
    readChar() {
        const output = this.peekChar();
        this.index += 1;
        return output;
    }
    
    readCharWithEscape() {
        let charCode = this.readChar();
        if (charCode !== 92) {
            return charCode;
        }
        charCode = this.readChar();
        if (charCode === 110) {
            return 10;
        } else if (charCode === 116) {
            return 9;
        } else {
            return charCode;
        }
    }
    
    // `textList` must be sorted by length descending.
    parseTokenText(textList) {
        for (let text of textList) {
            if (this.index + text.length <= this.content.length) {
                const subText = this.content.substring(this.index, this.index + text.length);
                if (subText === text) {
                    this.index += text.length;
                    return text;
                }
            }
        }
        return null;
    };
    
    parseTokenHelper(charMatches, tokenConstructor) {
        const startIndex = this.index;
        while (this.index < this.content.length) {
            const charCode = this.peekChar();
            if (!charMatches(charCode)) {
                break;
            }
            this.index += 1;
        }
        const text = this.content.substring(startIndex, this.index);
        return new tokenConstructor(text);
    }
    
    parseNumberToken() {
        // TODO: Parse hexadecimal and floating-point numbers.
        return this.parseTokenHelper(isNumberChar, NumberToken);
    }
    
    parseWordToken() {
        return this.parseTokenHelper(isWordChar, WordToken);
    }
    
    parseStringToken() {
        this.index += 1;
        const chars = [];
        while (true) {
            if (this.index >= this.content.length) {
                throw new CompilerError("Expected end quotation mark.");
            }
            let charCode = this.peekChar();
            if (charCode === 34) {
                this.index += 1;
                break;
            }
            charCode = this.readCharWithEscape();
            if (charCode === null) {
                throw new CompilerError("Unexpected end of string.");
            }
            chars.push(String.fromCharCode(charCode));
        }
        return new StringToken(chars.join(""));
    }
    
    parseCharToken() {
        this.index += 1;
        const charCode = this.readCharWithEscape();
        if (charCode === null) {
            throw new CompilerError("Expected character.");
        }
        const apostropheChar = this.readChar();
        if (apostropheChar !== 39) {
            throw new CompilerError("Expected apostrophe.");
        }
        return new CharToken(String.fromCharCode(charCode));
    }
    
    parseToken() {
        const firstChar = this.peekChar();
        if (firstChar === 32) {
            this.index += 1;
            return null;
        }
        if (firstChar === 34) {
            return this.parseStringToken();
        }
        if (firstChar === 39) {
            return this.parseCharToken();
        }
        if (isNumberChar(firstChar)) {
            return this.parseNumberToken();
        }
        if (isFirstWordChar(firstChar)) {
            return this.parseWordToken();
        }
        let text = this.parseTokenText(delimiterTextList);
        if (text !== null) {
            return new DelimiterToken(text);
        }
        text = this.parseTokenText(operatorTextList);
        if (text !== null) {
            return new OperatorToken(text);
        }
        throw new CompilerError(`Unexpected character '${String.fromCharCode(firstChar)}'.`);
    }
    
    parseTokens() {
        const output = [];
        while (this.index < this.content.length) {
            const token = this.parseToken();
            if (token !== null) {
                output.push(token);
            }
        }
        return output;
    }
}

export class PreStmtParser {
    
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }
    
    parseBhvrPreStmtSeq() {
        const bhvrPreStmts = [];
        // TODO: Implement.
        
        return new BhvrPreStmtSeq(bhvrPreStmts);
    }
}


