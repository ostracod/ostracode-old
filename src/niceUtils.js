
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";

const walkFilesHelper = (rootPath, relativePath, handle) => {
    const path = pathUtils.join(rootPath, relativePath);
    if (fs.lstatSync(path).isDirectory()) {
        for (const name of fs.readdirSync(path)) {
            const subPath = pathUtils.join(relativePath, name);
            walkFilesHelper(rootPath, subPath, handle);
        }
    } else {
        handle(relativePath);
    }
};

export const walkFiles = (path, handle) => {
    if (!fs.existsSync(path)) {
        throw new CompilerError(`Could not find file or directory at "${path}".`);
    }
    walkFilesHelper(path, ".", handle);
};


