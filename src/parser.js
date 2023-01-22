
import { delimiterTextList } from "./constants.js";
import { CompilerError } from "./error.js";
import { WordToken, NumberToken, DelimiterToken } from "./token.js";
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
    
    getCharCode() {
        return this.content.charCodeAt(this.index);
    }
    
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
            const charCode = this.getCharCode();
            if (!charMatches(charCode)) {
                break;
            }
            this.index += 1;
        }
        const text = this.content.substring(startIndex, this.index);
        return new tokenConstructor(text);
    }
    
    parseNumberToken() {
        return this.parseTokenHelper(isNumberChar, NumberToken);
    }
    
    parseWordToken() {
        return this.parseTokenHelper(isWordChar, WordToken);
    }
    
    parseToken() {
        const firstCharCode = this.getCharCode();
        if (firstCharCode === 32) {
            this.index += 1;
            return null;
        }
        if (isNumberChar(firstCharCode)) {
            return this.parseNumberToken();
        }
        if (isFirstWordChar(firstCharCode)) {
            return this.parseWordToken();
        }
        let text = this.parseTokenText(delimiterTextList);
        if (text !== null) {
            return new DelimiterToken(text);
        }
        throw new CompilerError(`Unexpected character '${String.fromCharCode(firstCharCode)}'.`);
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


