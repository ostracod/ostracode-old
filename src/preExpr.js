
import { NumToken } from "./token.js";
import { PreGroup } from "./group.js";
import { GroupSeq } from "./groupSeq.js";
import { NumLiteralExpr } from "./expr.js";

// PreExpr = Pre-expression
// A pre-expression is an expression which has not yet been resolved to a specific type.
export class PreExpr extends PreGroup {
    
    resolveStmts() {
        for (const component of this.components) {
            if (component instanceof GroupSeq) {
                component.resolveStmts();
            }
        }
    }
    
    resolve(index = 0, precedence = 99) {
        const component = this.components[index];
        index += 1;
        if (component instanceof NumToken) {
            return new NumLiteralExpr(component);
        }
        component.throwError("Cannot parse expression.");
    }
}


