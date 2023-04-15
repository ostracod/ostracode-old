
import * as niceUtils from "./niceUtils.js";
import { WordToken, NumToken, StrToken, OperatorToken } from "./token.js";
import { GroupSeq, BhvrStmtSeq, AttrStmtSeq, ExprSeq, CompExprSeq } from "./groupSeq.js";
import { NumLiteralExpr, StrLiteralExpr, IdentifierExpr, UnaryExpr, BinaryExpr, IdentifierAccessExpr, ExprSeqExpr, InvocationExpr } from "./expr.js";
import { specialConstructorMap } from "./specialExpr.js";
import { unaryOperatorMap, binaryOperatorMap } from "./operator.js";

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
    
    getLastComponent() {
        return this.components[this.components.length - 1];
    }
    
    peekComponent() {
        if (this.hasReachedEnd()) {
            return null;
        } else {
            return this.components[this.index];
        }
    }
    
    readComponent() {
        const output = this.peekComponent();
        this.index += 1;
        return output;
    }
    
    // Here is a beautiful ASCII table to explain things, or maybe cause confusion.
    
    //                                    |  Case 1  |  Case 2  |  Case 3  |
    //                                    +----------+----------+----------+
    //                If `errorName` is:  |  Null    |  String  |  String  |
    //             And `mayReachEnd` is:  |  Any     |  True    |  False   |
    // Will `peekByClass` throw error...  +----------+----------+----------+
    //       ...when parser reaches end?  |  No      |  No      |  Yes     |
    // ...when component has wrong type?  |  No      |  Yes     |  Yes     |
    
    peekByClass(componentClass, errorName = null, mayReachEnd = false) {
        const component = this.peekComponent();
        if (!(component instanceof componentClass)) {
            if (errorName === null) {
                return null;
            }
            let errorComponent;
            if (component === null) {
                if (mayReachEnd) {
                    return null;
                }
                errorComponent = this.getLastComponent();
            } else {
                errorComponent = component;
            }
            errorComponent.throwError(`Expected ${errorName}.`);
        }
        return component;
    }
    
    readByClass(componentClass, errorName = null, mayReachEnd = false) {
        const component = this.peekByClass(componentClass, errorName, mayReachEnd);
        if (component !== null) {
            this.index += 1;
        }
        return component;
    }
    
    readIdentifierText(errorName = "identifier") {
        return this.readByClass(WordToken, errorName).text;
    }
}

export class StmtParser extends GroupParser {
    
    constructor(components, parentStmt) {
        super(components);
        this.parentStmt = parentStmt;
    }
    
    readChildSeq(groupSeqClass, errorName = null, mayReachEnd = false) {
        const groupSeq = this.readByClass(groupSeqClass, errorName, mayReachEnd);
        if (groupSeq !== null) {
            this.parentStmt.addChild(groupSeq);
        }
        return groupSeq;
    }
    
    readTokenText(
        tokenClass, errorName, matchTextList, validTextList = [], mayReachEnd = false,
    ) {
        const token = this.peekByClass(tokenClass, errorName, mayReachEnd);
        if (token === null) {
            return null;
        }
        const { text } = token;
        if (matchTextList.includes(text)) {
            this.index += 1;
            return text;
        } else if (validTextList.includes(text)) {
            return null;
        } else {
            token.throwError(`Expected ${errorName}.`);
        }
    }
    
    readEqualSign() {
        this.readTokenText(OperatorToken, "equal sign", ["="]);
    }
    
    readKeyword(matchTextList, validTextList = [], mayReachEnd = false) {
        const textList = matchTextList.concat(validTextList);
        const unionText = niceUtils.getUnionText(textList.map((text) => `"${text}"`));
        return this.readTokenText(
            WordToken, "keyword " + unionText, matchTextList, validTextList, mayReachEnd,
        );
    }
    
    readExprSeq(errorName = null, mayReachEnd = false) {
        const output = this.readChildSeq(ExprSeq, errorName, mayReachEnd);
        if (output !== null && output.groups.length !== 1) {
            output.throwError("Expression sequence must contain exactly one expression.");
        }
        return output;
    }
    
    readCompExprSeq(errorName, requireExprSeq = true, mayReachEnd = false) {
        const exprSeq = this.readExprSeq(requireExprSeq ? errorName : null, mayReachEnd);
        if (exprSeq === null) {
            return null;
        }
        if (!(exprSeq instanceof CompExprSeq)) {
            exprSeq.throwError(`${niceUtils.capitalize(errorName)} must be a comptime expression sequence.`);
        }
        return exprSeq;
    }
    
    readBhvrStmtSeq(mayReachEnd = false) {
        return this.readChildSeq(BhvrStmtSeq, "body", mayReachEnd);
    }
    
    readAttrStmtSeq() {
        return this.readChildSeq(AttrStmtSeq, null, true);
    }
    
    readIfClause() {
        const condExprSeq = this.readExprSeq("condition");
        const stmtSeq = this.readBhvrStmtSeq();
        return new IfClause(condExprSeq, stmtSeq);
    }
    
    assertEnd(errorName) {
        if (!this.hasReachedEnd()) {
            const component = this.peekComponent();
            component.throwError(`Expected end of ${errorName}.`);
        }
    }
}

export class ExprParser extends GroupParser {
    
    constructor(components, parentNode) {
        super(components);
        this.parentNode = parentNode;
    }
    
    getComponents(startIndex) {
        return this.components.slice(startIndex, this.index);
    }
    
    readExpr(precedence = 99) {
        const startIndex = this.index;
        const component = this.readComponent();
        if (component === null) {
            this.getLastComponent().throwError("Unexpected end of expression.");
        }
        let output = null;
        if (component instanceof NumToken) {
            output = new NumLiteralExpr(component);
        } else if (component instanceof StrToken) {
            output = new StrLiteralExpr(component);
        } else if (component instanceof WordToken) {
            const wordText = component.text;
            const specialConstructor = specialConstructorMap[wordText];
            const variable = this.parentNode.getVar(wordText);
            if (typeof specialConstructor !== "undefined" && variable === null) {
                const groupSeqs = [];
                while (true) {
                    const component = this.readByClass(GroupSeq, null, true);
                    if (component === null) {
                        break;
                    }
                    groupSeqs.push(component);
                }
                const components = this.getComponents(startIndex);
                output = new specialConstructor(components, groupSeqs);
            } else {
                output = new IdentifierExpr(component);
            }
        } else if (component instanceof ExprSeq) {
            output = new ExprSeqExpr(component);
        } else if (component instanceof OperatorToken) {
            const operator = unaryOperatorMap.get(component.text);
            if (typeof operator !== "undefined") {
                const expr = this.readExpr(-99);
                const components = this.getComponents(startIndex);
                output = new UnaryExpr(components, operator, expr);
            }
        }
        if (output === null) {
            component.throwError("Invalid expression.");
        }
        while (true) {
            const component = this.peekComponent();
            if (component === null) {
                break;
            }
            const components = this.getComponents(startIndex);
            if (component instanceof OperatorToken) {
                const operatorText = component.text;
                if (operatorText === ".") {
                    this.index += 1;
                    const name = this.readIdentifierText();
                    output = new IdentifierAccessExpr(components, output, name);
                    continue;
                }
                const operator = binaryOperatorMap.get(operatorText);
                if (typeof operator !== "undefined") {
                    if (operator.precedence >= precedence) {
                        break;
                    }
                    this.index += 1;
                    const expr = this.readExpr(operator.precedence);
                    output = new BinaryExpr(components, operator, output, expr);
                    continue;
                }
            } else if (component instanceof ExprSeq) {
                this.index += 1;
                output = new InvocationExpr(components, output, component);
                continue;
            }
            component.throwError("Expected operator or argument expression sequence.");
        }
        return output;
    }
}

export class SpecialParser {
    
    constructor(groupSeqs, specialExpr) {
        this.groupSeqs = groupSeqs;
        this.specialExpr = specialExpr;
        this.index = 0;
    }
    
    hasReachedEnd() {
        return (this.index >= this.groupSeqs.length);
    }
    
    getLastComponent() {
        const { components } = this.specialExpr;
        return components[components.length - 1];
    }
    
    peekGroupSeq() {
        if (this.hasReachedEnd()) {
            return null;
        } else {
            return this.groupSeqs[this.index];
        }
    }
    
    readGroupSeq(groupSeqClass, errorName = null) {
        const groupSeq = this.peekGroupSeq();
        if (groupSeq instanceof groupSeqClass) {
            this.index += 1;
            this.specialExpr.addChild(groupSeq);
            return groupSeq;
        }
        if (errorName === null) {
            return null;
        }
        const errorComponent = (groupSeq === null) ? this.getLastComponent() : groupSeq;
        errorComponent.throwError(`Expected ${errorName}.`);
    }
    
    readExprSeq(expectOneExpression = false) {
        const output = this.readGroupSeq(ExprSeq, "expression sequence");
        if (expectOneExpression && output.groups.length !== 1) {
            output.throwError("Expression sequence must contain exactly one expression.");
        }
        return output;
    }
    
    readBhvrStmtSeq() {
        return this.readGroupSeq(BhvrStmtSeq, "behavior statement sequence");
    }
    
    readAttrStmtSeq() {
        return this.readGroupSeq(AttrStmtSeq);
    }
    
    assertEnd() {
        if (!this.hasReachedEnd()) {
            const groupSeq = this.peekGroupSeq();
            groupSeq.throwError("Expected end of special invocation.");
        }
    }
}


