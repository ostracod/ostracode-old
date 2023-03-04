
import { FlowControl } from "./constants.js";
import { EvalContext } from "./evalContext.js";

export class Func {
    // Concrete subclasses of Func must implement these methods:
    // evaluate
}

export class BuiltInFunc extends Func {
    
}

export class CustomFunc extends Func {
    
    constructor(argVars, bhvrStmtSeq, parentContext) {
        super();
        this.argVars = argVars;
        this.bhvrStmtSeq = bhvrStmtSeq;
        // TODO: Use `parentContext` to create a closure.
        
    }
    
    evaluate(args) {
        const context = new EvalContext(this.argVars);
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            const variable = this.argVars[index];
            context.setItem(variable, item);
        }
        const result = this.bhvrStmtSeq.evaluate(context);
        if (result.flowControl === FlowControl.Return) {
            return result.returnItem;
        } else if (result.flowControl !== FlowControl.None) {
            result.stmt.throwError("Invalid flow control statement in function.");
        }
    }
}


