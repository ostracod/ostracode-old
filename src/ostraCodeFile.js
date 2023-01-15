
export class OstraCodeFile {
    
    constructor(srcPath, destPath, platformNames) {
        this.srcPath = srcPath;
        this.destPath = destPath;
        this.platformNames = platformNames;
    }
    
    equals(codeFile) {
        if (codeFile.srcPath !== this.srcPath || codeFile.destPath !== codeFile.destPath) {
            return false;
        }
        const names1 = this.platformNames;
        const names2 = codeFile.platformNames;
        for (const name of names1) {
            if (!names2.includes(name)) {
                return false;
            }
        }
        for (const name of names2) {
            if (!names1.includes(name)) {
                return false;
            }
        }
        return true;
    }
}


