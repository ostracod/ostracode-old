
import { ItemType, TypeType, ValueType, MissingType, UndefType, NullType, BoolType, NumType, StrType, SymbolType } from "./itemType.js";
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
    
    convertToJs(jsConverter) {
        return "console.log";
    }
}

class SymbolFunc extends BuiltInFunc {
    
    evaluate(args) {
        return (args.length > 0) ? Symbol(args[0]) : Symbol();
    }
    
    convertToJs(jsConverter) {
        return "Symbol";
    }
}

class NominalTypeFunc extends BuiltInFunc {
    
    evaluate(args) {
        return args[0].nominate();
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
createBuiltInTypeVar("symbolT", new SymbolType());
// TODO: Add constaint types of built-in functions.
createBuiltInVar("print", new PrintFunc());
createBuiltInVar("symbol", new SymbolFunc());
createBuiltInVar("nominalT", new NominalTypeFunc());

export class BuiltInNode extends Node {
    
    constructor() {
        super();
        this.addVars(builtInVars);
    }
}


