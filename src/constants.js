
const compareLength = (text1, text2) => text2.length - text1.length;

export const openBracketTextList = [
    "(", "(*",
    "<", "<?", "<*", "<*?",
    "{", "[",
].sort(compareLength);

export const closeBracketTextList = [
    ")", ">", "}", "]",
].sort(compareLength);

export const separatorTextList = [
    ",", "\n",
].sort(compareLength);

export const operatorTextList = [
    "+", "-", "*", "/", "%", "**",
    "~", "|", "&", "^",
    "!", "||", "&&", "^^",
    "#sl", "#sr", "#srz",
    "#lt", "#lte", "#gt", "#gte", "#eq", "#neq",
    ".", "@", ":", "::", "+:",
    "=",
    "+=", "-=", "*=", "/=", "%=", "**=",
    "|=", "&=", "^=",
    "||=", "&&=", "^^=",
    "#sl=", "#sr=", "#srz=",
].sort(compareLength);

export const FlowControl = {
    None: Symbol("none"),
    Return: Symbol("return"),
    Break: Symbol("break"),
    Continue: Symbol("continue"),
};

export const baseImportStmt = "import { classes, utils } from \"ostracode-base\";";


