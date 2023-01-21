
import * as fs from "fs";
import * as niceUtils from "./niceUtils.js";
import * as parseUtils from "./parseUtils.js";

export class OstraCodeFile {
    
    constructor(srcPath, destPath, platformNames) {
        this.srcPath = srcPath;
        this.destPath = destPath;
        // Set of strings.
        this.platformNames = platformNames;
        this.content = null;
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
        this.bhvrPreStmtSeq = parseUtils.parseFileContent(this.content);
    }
}


