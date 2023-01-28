
import { delimiterTextList, operatorTextList } from "./constants.js";
import { CompilerError } from "./error.js";
import { WordToken, DecNumberToken, HexNumberToken, CharToken, StringToken, DelimiterToken, OperatorToken } from "./token.js";
import { BhvrPreStmtSeq } from "./preStmt.js";

const isDecDigit = (charCode) => (charCode >= 48 && charCode <= 57);

const isHexDigit = (charCode) => (isDecDigit(charCode)
    || (charCode >= 65 && charCode <= 70)
    || (charCode >= 97 && charCode <= 102));

const isDecNumberChar = (charCode) => (isDecDigit(charCode) || charCode === 46);

const isFirstWordChar = (charCode) => (
    (charCode >= 65 && charCode <= 90)
    || (charCode >= 97 && charCode <= 122)
    || charCode === 95 || charCode === 36
);

const isWordChar = (charCode) => (isFirstWordChar(charCode) || isDecDigit(charCode));

export class TokenParser {
    
    constructor(content) {
        this.content = content;
        this.index = 0;
    }
    
    peekChar(offset = 0) {
        const index = this.index + offset;
        if (index < this.content.length) {
            return this.content.charCodeAt(index);
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
    readText(textList) {
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
    
    seekChar(targetCharCode) {
        while (this.index < this.content.length) {
            const charCode = this.peekChar();
            if (charCode === targetCharCode) {
                break;
            }
            this.index += 1;
        }
    }
    
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
    
    parseDecNumberToken() {
        return this.parseTokenHelper(isDecNumberChar, DecNumberToken);
    }
    
    parseHexNumberToken() {
        return this.parseTokenHelper(isHexDigit, HexNumberToken);
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
        if (firstChar === 46) {
            // Do not confuse decimal point with member access operator.
            const secondChar = this.peekChar(1);
            if (isDecDigit(secondChar)) {
                return this.parseDecNumberToken();
            }
        }
        let text = this.readText(["//"]);
        if (text !== null) {
            this.seekChar(10);
            return null;
        }
        text = this.readText(["0x"]);
        if (text !== null) {
            return this.parseHexNumberToken();
        }
        if (isDecDigit(firstChar)) {
            return this.parseDecNumberToken();
        }
        if (isFirstWordChar(firstChar)) {
            return this.parseWordToken();
        }
        text = this.readText(delimiterTextList);
        if (text !== null) {
            return new DelimiterToken(text);
        }
        text = this.readText(operatorTextList);
        if (text !== null) {
            return new OperatorToken(text);
        }
        throw new CompilerError(`Unexpected character '${String.fromCharCode(firstChar)}'.`);
    }
    
    parseTokens() {
        // TODO: Keep track of line numbers.
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


