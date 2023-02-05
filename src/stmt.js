
import { CompilerError } from "./error.js";
import { OperatorToken } from "./token.js";
import { PreGroupSeq } from "./preGroup.js";
import { Group, GroupSeq } from "./group.js";
import { ExprSeq } from "./expr.js";
import { GroupParser } from "./parser.js";

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
        try {
            this.init(parser);
        } catch (error) {
            if (error instanceof CompilerError && error.lineNumber === null) {
                error.lineNumber = this.getLineNumber();
            }
            throw error;
        }
    }
    
    init(parser) {
        // Do nothing.
    }
}

export class BhvrStmt extends Stmt {
    
}

export class VarStmt extends BhvrStmt {
    
    init(parser) {
        parser.index += 1;
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readByClass(ExprSeq);
        this.attrStmtSeq = parser.readByClass(AttrStmtSeq);
        if (parser.hasReachedEnd()) {
            this.initItemExprSeq = null;
            return;
        }
        const equalSignToken = parser.readByClass(OperatorToken, "Expected operator.");
        if (equalSignToken.text !== "=") {
            throw new CompilerError(
                "Expected equal sign.", null, equalSignToken.lineNumber,
            );
        }
        this.initItemExprSeq = parser.readByClass(ExprSeq, "Expected initialization item.");
    }
}

export class CompVarStmt extends VarStmt {
    
}

export class ImmutEvalVarStmt extends VarStmt {
    
}

export class MutEvalVarStmt extends VarStmt {
    
}

export class ExprStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readComponent();
    }
}

export class AttrStmt extends Stmt {
    
}

export const stmtConstructorMap = {
    comp: CompVarStmt,
    const: ImmutEvalVarStmt,
    var: MutEvalVarStmt,
};

export class StmtSeq extends GroupSeq {
    
}

export class BhvrStmtSeq extends StmtSeq {
    
}

export class AttrStmtSeq extends StmtSeq {
    
}


