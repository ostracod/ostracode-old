
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";
import { baseImportStmt } from "./constants.js";
import * as niceUtils from "./niceUtils.js";
import { Node } from "./node.js";
import { BhvrStmtSeq } from "./groupSeq.js";
import { BhvrPreStmt } from "./preStmt.js";
import { TokenParser, PreGroupParser} from "./parser.js";

export class OstraCodeFile extends Node {
    
    constructor(srcPath, destPath, platformNames) {
        super();
        this.srcPath = srcPath;
        this.destPath = destPath;
        // Set of strings.
        this.platformNames = platformNames;
        this.content = null;
        this.tokens = null;
        this.bhvrStmtSeq = null;
    }
    
    equals(codeFile) {
        if (codeFile.srcPath !== this.srcPath || codeFile.destPath !== codeFile.destPath) {
            return false;
        }
        return niceUtils.nameSetsAreEqual(this.platformNames, codeFile.platformNames);
    }
    
    tryOperation(operation) {
        try {
            operation();
        } catch (error) {
            if (error instanceof CompilerError) {
                error.ostraCodeFile = this;
            }
            throw error;
        }
    }
    
    parseTokens() {
        const parser = new TokenParser(this.content);
        this.tokens = parser.parseTokens();
        this.setChildren(this.tokens);
    }
    
    parsePreGroups() {
        const parser = new PreGroupParser(this.tokens);
        const bhvrPreStmts = parser.parsePreGroups(BhvrPreStmt);
        this.bhvrStmtSeq = new BhvrStmtSeq(bhvrPreStmts);
        this.bhvrStmtSeq.lineNum = 1;
        this.setChildren([this.bhvrStmtSeq]);
    }
    
    parse() {
        this.content = fs.readFileSync(this.srcPath, "utf8");
        this.tryOperation(() => {
            this.parseTokens();
            this.parsePreGroups();
            this.bhvrStmtSeq.resolveStmts();
            this.bhvrStmtSeq.resolveExprsAndVars();
            this.bhvrStmtSeq.resolveDiscerners();
        });
    }
    
    resolveCompItems() {
        let output;
        this.tryOperation(() => {
            output = super.resolveCompItems();
        });
        return output;
    }
    
    aggregateCompItems(aggregator) {
        this.bhvrStmtSeq.aggregateCompItems(aggregator);
    }
    
    createJsFile(itemConverter) {
        niceUtils.ensureDirectoryExists(pathUtils.dirname(this.destPath));
        const codeList = this.bhvrStmtSeq.convertToJsList(itemConverter);
        const code = [
            baseImportStmt,
            // TODO: Fix this import path.
            "import * as compItems from \"../support/compItems.js\";",
            codeList.join("\n"),
            "",
        ].join("\n");
        fs.writeFileSync(this.destPath, code);
    }
}


