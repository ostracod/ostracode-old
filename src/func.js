
import { FlowControl } from "./constants.js";

export class Func {
    
    constructor(argStmts, bhvrStmtSeq) {
        this.argStmts = argStmts;
        this.bhvrStmtSeq = bhvrStmtSeq;
    }
    
    evaluate(args) {
        for (const stmt of this.bhvrStmtSeq.groups) {
            const result = stmt.evaluate();
            if (result.flowControl === FlowControl.Return) {
                return result.returnItem;
            } else if (result.flowControl !== FlowControl.None) {
                stmt.throwError("Invalid flow control statement in function.");
            }
        }
    }
}


