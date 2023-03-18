
export const getAttrStmt = (attrStmtSeq, attrStmtClass) => (
    (attrStmtSeq === null) ? null : attrStmtSeq.getAttrStmt(attrStmtClass)
);

export const getChildVars = (attrStmtSeq, attrStmtClass) => {
    const stmt = getAttrStmt(attrStmtSeq, attrStmtClass);
    return (stmt === null) ? [] : stmt.getChildVars();
};


