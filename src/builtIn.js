
import { ItemType, TypeType, ValueType, MissingType, UndefType, NullType, BoolType, NumType, StrType } from "./itemType.js";
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
    itemT: new ItemType(),
    typeT: new TypeType(),
    valueT: new ValueType(),
    missingT: new MissingType(),
    undefT: new UndefType(),
    nullT: new NullType(),
    boolT: new BoolType(),
    numT: new NumType(),
    strT: new StrType(),
    print: new PrintFunc(),
};


