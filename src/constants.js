
const compareLength = (text1, text2) => text2.length - text1.length;

export const delimiterTextList = [
    ",", "\n",
    "(", "(*", ")",
    "<", "<?", "<??", "<*", "<*?", "<*??", ">",
    "{", "}",
    "[", "]",
].sort(compareLength);

export const ExprSeqSelector = {
    ReturnItems: Symbol("returnItems"),
    ConstraintTypes: Symbol("constraintTypes"),
    InitTypes: Symbol("initTypes"),
};


