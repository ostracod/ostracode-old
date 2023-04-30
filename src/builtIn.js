
import { NominalType, ItemType, TypeType, ValueType, MissingType, UndefType, NullType, BoolType, NumType, StrType } from "./itemType.js";
import { BuiltInFunc } from "./func.js";
import { BuiltInCompVar } from "./var.js";
import { Node } from "./node.js";

const builtInVars = [];

const createBuiltInVar = (identifier, item, constraintType = new ItemType()) => {
    const variable = new BuiltInCompVar(identifier, item, constraintType);
    builtInVars.push(variable);
};

const createBuiltInTypeVar = (identifier, type) => {
    createBuiltInVar(identifier, type, new TypeType(type));
};

class PrintFunc extends BuiltInFunc {
    
    evaluate(args) {
        // TODO: Support ToStringT interface.
        console.log(args[0]);
    }
    
    convertToJs(convertNestedItem) {
        return "console.log";
    }
}

class NominalTypeFunc extends BuiltInFunc {
    
    evaluate(args) {
        const output = args[0].copy();
        output.nominalType = new NominalType(output.nominalType);
        return output;
    }
}

createBuiltInVar("undef", undefined, new UndefType());
createBuiltInVar("null", null, new NullType());
createBuiltInVar("true", true, new BoolType());
createBuiltInVar("false", false, new BoolType());
createBuiltInTypeVar("itemT", new ItemType());
createBuiltInTypeVar("typeT", new TypeType());
createBuiltInTypeVar("valueT", new ValueType());
createBuiltInTypeVar("missingT", new MissingType());
createBuiltInTypeVar("undefT", new UndefType());
createBuiltInTypeVar("nullT", new NullType());
createBuiltInTypeVar("boolT", new BoolType());
createBuiltInTypeVar("numT", new NumType());
createBuiltInTypeVar("strT", new StrType());
// TODO: Add constaint types of built-in functions.
createBuiltInVar("print", new PrintFunc());
createBuiltInVar("nominalT", new NominalTypeFunc());

export class BuiltInNode extends Node {
    
    constructor() {
        super();
        this.addVars(builtInVars);
    }
}


