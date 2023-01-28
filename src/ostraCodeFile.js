
import * as fs from "fs";
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { TokenParser, PreStmtParser} from "./parser.js";

export class OstraCodeFile {
    
    constructor(srcPath, destPath, platformNames) {
        this.srcPath = srcPath;
        this.destPath = destPath;
        // Set of strings.
        this.platformNames = platformNames;
        this.content = null;
        this.tokens = null;
        this.bhvrPreStmtSeq = null;
    }
    
    equals(codeFile) {
        if (codeFile.srcPath !== this.srcPath || codeFile.destPath !== codeFile.destPath) {
            return false;
        }
        return niceUtils.nameSetsAreEqual(this.platformNames, codeFile.platformNames);
    }
    
    readContent() {
        this.content = fs.readFileSync(this.srcPath, "utf8");
    }
    
    parseTokens() {
        const parser = new TokenParser(this.content);
        try {
            this.tokens = parser.parseTokens();
        } catch (error) {
            if (error instanceof CompilerError) {
                error.ostraCodeFile = this;
            }
            throw error;
        }
    }
    
    parsePreStmts() {
        const parser = new PreStmtParser(this.tokens);
        this.bhvrPreStmtSeq = parser.parseBhvrPreStmtSeq();
    }
}


