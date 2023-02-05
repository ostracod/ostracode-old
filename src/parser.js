
import { openBracketTextList, closeBracketTextList, separatorTextList, operatorTextList, ExprSeqSelector } from "./constants.js";
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { WordToken, DecNumberToken, HexNumberToken, CharToken, StringToken, OpenBracketToken, CloseBracketToken, SeparatorToken, OperatorToken } from "./token.js";
import { PreExpr, EvalPreExprSeq, CompPreExprSeq } from "./preExpr.js";
import { BhvrPreStmt, AttrPreStmt, BhvrPreStmtSeq, AttrPreStmtSeq } from "./preStmt.js";
import { ExprSeq, CompExprSeq } from "./expr.js";
import { BhvrStmtSeq } from "./stmt.js";

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

const isDecNumberChar = (charCode) => (isDecDigit(charCode) || charCode === 46);

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
    const startIndex = hasFactorType ? 2 : 1;
    const questionMarks = openBracketText.substring(startIndex, openBracketText.length);
    let exprSeqSelector;
    if (questionMarks === "??") {
        exprSeqSelector = ExprSeqSelector.InitTypes;
    } else if (questionMarks === "?") {
        exprSeqSelector = ExprSeqSelector.ConstraintTypes;
    } else {
        exprSeqSelector = ExprSeqSelector.ReturnItems;
    }
    let groupConstructor;
    let closeBracketText;
    let createHelper;
    if (firstChar === 40) {
        groupConstructor = PreExpr;
        closeBracketText = ")";
        createHelper = (preGroups) => new EvalPreExprSeq(hasFactorType, preGroups);
    } else if (firstChar === 60) {
        groupConstructor = PreExpr;
        closeBracketText = ">";
        createHelper = (preGroups) => (
            new CompPreExprSeq(hasFactorType, exprSeqSelector, preGroups)
        );
    } else if (firstChar === 123) {
        groupConstructor = BhvrPreStmt;
        closeBracketText = "}";
        createHelper = (preGroups) => new BhvrPreStmtSeq(preGroups);
    } else if (firstChar === 91) {
        groupConstructor = AttrPreStmt;
        closeBracketText = "]";
        createHelper = (preGroups) => new AttrPreStmtSeq(preGroups);
    } else {
        throw new Error(`Unexpected open bracket "${openBracketText}".`);
    }
    const createSeq = (preGroups) => {
        const output = createHelper(preGroups);
        output.lineNumber = openBracketToken.lineNumber;
        return output;
    };
    return { groupConstructor, closeBracketText, createSeq };
};

export class TokenParser {
    
    constructor(content) {
        this.content = content;
        this.index = 0;
        this.lineNumber = 1;
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
                this.lineNumber += 1;
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
    };
    
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
        return new tokenConstructor(text, this.lineNumber);
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
        return new StringToken(chars.join(""), this.lineNumber);
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
        return new CharToken(String.fromCharCode(charCode), this.lineNumber);
    }
    
    parseToken() {
        const firstChar = this.peekChar();
        if (firstChar === 32) {
            this.advanceIndex();
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
        const lineNumber = this.lineNumber;
        for (const dict of tokenConstructors) {
            text = this.readText(dict.textList);
            if (text !== null) {
                return new dict.constructor(text, lineNumber);
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
                    error.lineNumber = this.lineNumber;
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
            groupConstructor, closeBracketText, createSeq
        } = getSeqBuilder(openBracketToken);
        const preGroups = this.parsePreGroups(groupConstructor);
        const closeBracketToken = this.readToken();
        if (!(closeBracketToken instanceof CloseBracketToken)
                || closeBracketToken.text !== closeBracketText) {
            throw new CompilerError(`Expected "${closeBracketText}".`);
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
        this.index += 1
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

class IfClause {
    
    constructor(condExprSeq, stmtSeq) {
        this.condExprSeq = condExprSeq;
        this.stmtSeq = stmtSeq;
    }
}

export class GroupParser {
    
    constructor(components) {
        this.components = components;
        this.index = 0;
    }
    
    hasReachedEnd() {
        return (this.index >= this.components.length);
    }
    
    peekComponent() {
        if (!this.hasReachedEnd()) {
            return this.components[this.index];
        } else {
            return null;
        }
    }
    
    readComponent() {
        const output = this.peekComponent();
        this.index += 1;
        return output;
    }
    
    readByClass(componentClass, errorName = null) {
        const component = this.peekComponent();
        if (!(component instanceof componentClass)) {
            if (errorName === null) {
                return null;
            }
            let lineNumber;
            if (component === null) {
                const lastComponent = this.components[this.components.length - 1];
                lineNumber = lastComponent.getLineNumber();
            } else {
                lineNumber = component.getLineNumber();
            }
            throw new CompilerError(`Expected ${errorName}.`, null, lineNumber);
        }
        this.index += 1;
        return component;
    }
    
    readIdentifierText() {
        return this.readByClass(WordToken, "identifier").text;
    }
    
    readRequiredText(tokenClass, errorName, requiredText) {
        const token = this.readByClass(tokenClass, errorName);
        if (token.text !== requiredText) {
            throw new CompilerError(`Expected ${errorName}.`, null, token.getLineNumber());
        }
    }
    
    readEqualSign() {
        this.readRequiredText(OperatorToken, `equal sign`, "=");
    }
    
    readKeyword(requiredText) {
        this.readRequiredText(WordToken, `keyword "${requiredText}"`, requiredText);
    }
    
    readCompExprSeq(errorName = null, required = false) {
        const exprSeq = this.readByClass(ExprSeq, required ? errorName : null);
        if (exprSeq === null) {
            return null;
        }
        if (!(exprSeq instanceof CompExprSeq)) {
            if (errorName === null) {
                return null;
            } else {
                throw new CompilerError(`${niceUtils.capitalize(errorName)} must be a comptime expression sequence.`, null, exprSeq.getLineNumber());
            }
        }
        return exprSeq;
    }
    
    readBhvrStmtSeq() {
        return this.readByClass(BhvrStmtSeq, "body");
    }
    
    readIfClause() {
        const condExprSeq = this.readByClass(ExprSeq, "condition");
        const stmtSeq = this.readBhvrStmtSeq();
        return new IfClause(condExprSeq, stmtSeq);
    }
    
    assertEnd(errorName) {
        if (!this.hasReachedEnd()) {
            const component = this.peekComponent();
            throw new CompilerError(
                `Expected end of ${errorName}.`, null, component.getLineNumber(),
            );
        }
    }
}


