
import { openBracketTextList, closeBracketTextList, separatorTextList, operatorTextList } from "./constants.js";
import { CompilerError } from "./error.js";
import { ExprSeqSelector } from "./constants.js";
import { WordToken, DecNumToken, HexNumToken, CharToken, StrToken, OpenBracketToken, CloseBracketToken, SeparatorToken, OperatorToken } from "./token.js";
import { BhvrStmtSeq, AttrStmtSeq, EvalExprSeq, CompExprSeq } from "./groupSeq.js";
import { PreExpr } from "./preExpr.js";
import { BhvrPreStmt, AttrPreStmt } from "./preStmt.js";

const tokenConstructors = [
    { textList: openBracketTextList, constructor: OpenBracketToken },
    { textList: closeBracketTextList, constructor: CloseBracketToken },
    { textList: separatorTextList, constructor: SeparatorToken },
    { textList: operatorTextList, constructor: OperatorToken },
];

const isDecDigit = (charCode) => (charCode >= 48 && charCode <= 57);

const isHexDigit = (charCode) => (isDecDigit(charCode)
    || (charCode >= 65 && charCode <= 70)
    || (charCode >= 97 && charCode <= 102));

const isDecNumChar = (charCode) => (isDecDigit(charCode) || charCode === 46);

const isFirstWordChar = (charCode) => (
    (charCode >= 65 && charCode <= 90)
    || (charCode >= 97 && charCode <= 122)
    || charCode === 95 || charCode === 36
);

const isWordChar = (charCode) => (isFirstWordChar(charCode) || isDecDigit(charCode));

const getSeqBuilder = (openBracketToken) => {
    const openBracketText = openBracketToken.text;
    const firstChar = openBracketText.charCodeAt(0);
    const hasFactorType = (openBracketText.length > 1
        && openBracketText.charCodeAt(1) === 42);
    const charIndex = hasFactorType ? 2 : 1;
    let exprSeqSelector = ExprSeqSelector.ReturnItems;
    if (charIndex < openBracketText.length) {
        const character = openBracketText.charCodeAt(charIndex);
        if (character === 63) {
            exprSeqSelector = ExprSeqSelector.ConstraintTypes;
        } else if (character === 64) {
            exprSeqSelector = ExprSeqSelector.Anchors;
        }
    }
    let groupConstructor;
    let closeBracketText;
    let createHelper;
    if (firstChar === 40) {
        groupConstructor = PreExpr;
        closeBracketText = ")";
        createHelper = (preGroups) => new EvalExprSeq(hasFactorType, preGroups);
    } else if (firstChar === 60) {
        groupConstructor = PreExpr;
        closeBracketText = ">";
        createHelper = (preGroups) => (
            new CompExprSeq(hasFactorType, exprSeqSelector, preGroups)
        );
    } else if (firstChar === 123) {
        groupConstructor = BhvrPreStmt;
        closeBracketText = "}";
        createHelper = (preGroups) => new BhvrStmtSeq(preGroups);
    } else if (firstChar === 91) {
        groupConstructor = AttrPreStmt;
        closeBracketText = "]";
        createHelper = (preGroups) => new AttrStmtSeq(preGroups);
    } else {
        throw new Error(`Unexpected open bracket "${openBracketText}".`);
    }
    const createSeq = (preGroups) => {
        const output = createHelper(preGroups);
        output.lineNum = openBracketToken.lineNum;
        return output;
    };
    return { groupConstructor, closeBracketText, createSeq };
};

export class TokenParser {
    
    constructor(content) {
        this.content = content;
        this.index = 0;
        this.lineNum = 1;
    }
    
    peekChar(offset = 0) {
        const index = this.index + offset;
        if (index < this.content.length) {
            return this.content.charCodeAt(index);
        } else {
            return null;
        }
    }
    
    advanceIndex(amount = 1) {
        for (let count = 0; count < amount; count += 1) {
            const charCode = this.peekChar();
            if (charCode === 10) {
                this.lineNum += 1;
            }
            this.index += 1;
        }
    }
    
    readChar() {
        const output = this.peekChar();
        this.advanceIndex();
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
                    this.advanceIndex(text.length);
                    return text;
                }
            }
        }
        return null;
    }
    
    seekChar(targetCharCode) {
        while (this.index < this.content.length) {
            const charCode = this.peekChar();
            if (charCode === targetCharCode) {
                break;
            }
            this.advanceIndex();
        }
    }
    
    parseTokenHelper(charMatches, tokenConstructor) {
        const startIndex = this.index;
        while (this.index < this.content.length) {
            const charCode = this.peekChar();
            if (!charMatches(charCode)) {
                break;
            }
            this.advanceIndex();
        }
        const text = this.content.substring(startIndex, this.index);
        return new tokenConstructor(text, this.lineNum);
    }
    
    parseDecNumToken() {
        return this.parseTokenHelper(isDecNumChar, DecNumToken);
    }
    
    parseHexNumToken() {
        return this.parseTokenHelper(isHexDigit, HexNumToken);
    }
    
    parseWordToken() {
        return this.parseTokenHelper(isWordChar, WordToken);
    }
    
    parseStrToken() {
        this.advanceIndex();
        const chars = [];
        while (true) {
            if (this.index >= this.content.length) {
                throw new CompilerError("Expected end quotation mark.");
            }
            let charCode = this.peekChar();
            if (charCode === 34) {
                this.advanceIndex();
                break;
            }
            charCode = this.readCharWithEscape();
            if (charCode === null) {
                throw new CompilerError("Unexpected end of string.");
            }
            chars.push(String.fromCharCode(charCode));
        }
        return new StrToken(chars.join(""), this.lineNum);
    }
    
    parseCharToken() {
        this.advanceIndex();
        const charCode = this.readCharWithEscape();
        if (charCode === null) {
            throw new CompilerError("Expected character.");
        }
        const apostropheChar = this.readChar();
        if (apostropheChar !== 39) {
            throw new CompilerError("Expected apostrophe.");
        }
        return new CharToken(String.fromCharCode(charCode), this.lineNum);
    }
    
    parseToken() {
        const firstChar = this.peekChar();
        if (firstChar === 32) {
            this.advanceIndex();
            return null;
        }
        if (firstChar === 34) {
            return this.parseStrToken();
        }
        if (firstChar === 39) {
            return this.parseCharToken();
        }
        if (firstChar === 46) {
            // Do not confuse decimal point with member access operator.
            const secondChar = this.peekChar(1);
            if (isDecDigit(secondChar)) {
                return this.parseDecNumToken();
            }
        }
        let text = this.readText(["//"]);
        if (text !== null) {
            this.seekChar(10);
            return null;
        }
        text = this.readText(["0x"]);
        if (text !== null) {
            return this.parseHexNumToken();
        }
        if (isDecDigit(firstChar)) {
            return this.parseDecNumToken();
        }
        if (isFirstWordChar(firstChar)) {
            return this.parseWordToken();
        }
        const { lineNum } = this;
        for (const dict of tokenConstructors) {
            text = this.readText(dict.textList);
            if (text !== null) {
                return new dict.constructor(text, lineNum);
            }
        }
        throw new CompilerError(`Unexpected character '${String.fromCharCode(firstChar)}'.`);
    }
    
    parseTokens() {
        const output = [];
        while (this.index < this.content.length) {
            let token;
            try {
                token = this.parseToken();
            } catch (error) {
                if (error instanceof CompilerError) {
                    error.lineNum = this.lineNum;
                }
                throw error;
            }
            if (token !== null) {
                output.push(token);
            }
        }
        return output;
    }
}

export class PreGroupParser {
    
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }
    
    peekToken() {
        if (this.index < this.tokens.length) {
            return this.tokens[this.index];
        } else {
            return null;
        }
    }
    
    readToken() {
        const output = this.peekToken();
        this.index += 1;
        return output;
    }
    
    parsePreGroupSeq() {
        const openBracketToken = this.readToken();
        const {
            groupConstructor, closeBracketText, createSeq,
        } = getSeqBuilder(openBracketToken);
        const preGroups = this.parsePreGroups(groupConstructor);
        const closeBracketToken = this.readToken();
        if (!(closeBracketToken instanceof CloseBracketToken)
                || closeBracketToken.text !== closeBracketText) {
            openBracketToken.throwError(`Missing "${closeBracketText}".`);
        }
        return createSeq(preGroups);
    }
    
    parseComponent() {
        const token = this.peekToken();
        if (token instanceof SeparatorToken || token instanceof CloseBracketToken) {
            return null;
        }
        if (token instanceof OpenBracketToken) {
            return this.parsePreGroupSeq();
        }
        this.index += 1;
        return token;
    }
    
    parsePreGroup(groupConstructor) {
        const components = [];
        while (this.index < this.tokens.length) {
            const token = this.peekToken();
            if (token instanceof SeparatorToken) {
                this.index += 1;
                break;
            }
            const component = this.parseComponent();
            if (component === null) {
                break;
            }
            components.push(component);
        }
        return (components.length > 0) ? new groupConstructor(components) : null;
    }
    
    parsePreGroups(groupConstructor) {
        const output = [];
        while (this.index < this.tokens.length) {
            const token = this.peekToken();
            if (token instanceof CloseBracketToken) {
                break;
            }
            const preGroup = this.parsePreGroup(groupConstructor);
            if (preGroup !== null) {
                output.push(preGroup);
            }
        }
        return output;
    }
}


