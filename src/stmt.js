
import { CompilerError } from "./error.js";
import { WordToken, OperatorToken } from "./token.js";
import { PreGroupSeq } from "./preGroup.js";
import { Group, GroupSeq } from "./group.js";
import { ExprSeq } from "./expr.js";
import { GroupParser } from "./parser.js";

const initItemName = "initialization item";

export class Stmt extends Group {
    
    constructor(components) {
        super(components);
        const resolvedComponents = components.map((component) => {
            if (component instanceof PreGroupSeq) {
                return component.resolveStmts(this);
            } else {
                return component;
            }
        });
        const parser = new GroupParser(resolvedComponents);
        if (this.isKeywordStmt()) {
            parser.index += 1;
        }
        try {
            this.init(parser);
        } catch (error) {
            if (error instanceof CompilerError && error.lineNumber === null) {
                error.lineNumber = this.getLineNumber();
            }
            throw error;
        }
        parser.assertEnd("statement")
    }
    
    init(parser) {
        // Do nothing.
    }
    
    isKeywordStmt() {
        return true;
    }
}

export class BhvrStmt extends Stmt {
    
}

export class VarStmt extends BhvrStmt {
    
    readInitItem(parser) {
        return parser.readByClass(ExprSeq, initItemName);
    }
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readCompExprSeq("constraint type");
        this.attrStmtSeq = parser.readByClass(AttrStmtSeq);
        if (parser.hasReachedEnd()) {
            this.initItemExprSeq = null;
            return;
        }
        const equalSignToken = parser.readByClass(OperatorToken, "operator");
        if (equalSignToken.text !== "=") {
            throw new CompilerError(
                "Expected equal sign.", null, equalSignToken.lineNumber,
            );
        }
        this.initItemExprSeq = this.readInitItem(parser);
    }
}

export class CompVarStmt extends VarStmt {
    
    readInitItem(parser) {
        return parser.readCompExprSeq(initItemName, true);
    }
}

export class ImmutEvalVarStmt extends VarStmt {
    
}

export class MutEvalVarStmt extends VarStmt {
    
}

export class ExprStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readComponent();
    }
    
    isKeywordStmt() {
        return false;
    }
}

export class IfStmt extends BhvrStmt {
    
    init(parser) {
        this.ifClause = parser.readIfClause();
        this.elseIfClauses = [];
        this.elseStmtSeq = null;
        while (!parser.hasReachedEnd()) {
            const component = parser.readComponent();
            if (component instanceof WordToken) {
                const keyword = component.text;
                if (keyword === "elseIf") {
                    const clause = parser.readIfClause();
                    this.elseIfClauses.push(clause);
                    continue;
                } else if (keyword === "else") {
                    this.elseStmtSeq = parser.readByClass(BhvrStmtSeq, "body");
                    break;
                }
            }
            throw new CompilerError(
                "Expected keyword \"elseIf\" or \"else\".", null, component.getLineNumber(),
            );
        }
    }
}

export class AttrStmt extends Stmt {
    
}

export const stmtConstructorMap = {
    comp: CompVarStmt,
    const: ImmutEvalVarStmt,
    var: MutEvalVarStmt,
    if: IfStmt,
};

export class StmtSeq extends GroupSeq {
    
}

export class BhvrStmtSeq extends StmtSeq {
    
}

export class AttrStmtSeq extends StmtSeq {
    
}


