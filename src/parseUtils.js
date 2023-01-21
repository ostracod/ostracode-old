
import { BhvrPreStmtSeq } from "./preStmt.js";

export const parseBhvrPreStmtSeq = (content, index) => {
    const bhvrPreStmts = [];
    // TODO: Implement.
    
    return { bhvrPreStmtSeq: new BhvrPreStmtSeq(bhvrPreStmts), index };
};

export const parseFileContent = (content) => (
    parseBhvrPreStmtSeq(content, 0).bhvrPreStmtSeq
);


