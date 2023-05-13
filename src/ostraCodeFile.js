
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
        if (codeFile.srcPath !== this.srcPath) {
            return false;
        }
        return niceUtils.nameSetsAreEqual(this.platformNames, codeFile.platformNames);
    }
    
    getOstraCodeFile() {
        return this;
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
        });
        this.bhvrStmtSeq.resolveStmts();
        this.bhvrStmtSeq.resolveExprsAndVars();
        this.bhvrStmtSeq.resolveCompartments();
    }
    
    getExportedVar(name) {
        const variable = this.bhvrStmtSeq.getVar(name, false);
        if (variable === null) {
            throw new CompilerError(`Module does not contain variable with name "${name}".`);
        }
        if (!variable.isExported()) {
            throw new CompilerError(`Variable with name "${name}" is not exported.`);
        }
        return variable;
    }
    
    iterateCompItems(compContext, handle) {
        this.bhvrStmtSeq.iterateCompItems(compContext, handle);
    }
    
    createJsFile(jsConverter) {
        this.validateTypes(jsConverter.getCompContext());
        niceUtils.ensureDirectoryExists(pathUtils.dirname(this.destPath));
        const codeList = this.bhvrStmtSeq.convertToJsList(jsConverter);
        const code = [
            baseImportStmt,
            // TODO: Fix these import paths.
            "import * as typeIds from \"../support/typeIds.js\";",
            "import * as compItems from \"../support/compItems.js\";",
            codeList.join("\n"),
            "",
        ].join("\n");
        fs.writeFileSync(this.destPath, code);
    }
}


