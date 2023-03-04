
import { BuiltInFunc } from "./func.js";

class PrintFunc {
    
    evaluate(args) {
        // TODO: Support ToStringT interface.
        console.log(args[0]);
    }
}

export const builtInItems = {
    undef: undefined,
    null: null,
    true: true,
    false: false,
    print: new PrintFunc(),
};


