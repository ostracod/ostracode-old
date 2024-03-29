
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";

export const extendList = (destination, elements) => {
    for (const element of elements) {
        destination.push(element);
    }
};

// `extension` must begin with a period.
export const replaceExtension = (path, extension) => {
    const dirPath = pathUtils.dirname(path);
    const fileName = pathUtils.basename(path);
    const periodIndex = fileName.lastIndexOf(".");
    const baseName = (periodIndex >= 0) ? fileName.substring(0, periodIndex) : fileName;
    return pathUtils.join(dirPath, baseName + extension);
};

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

export const ensureDirectoryExists = (path) => {
    if (!fs.existsSync(path)) {
        ensureDirectoryExists(pathUtils.dirname(path));
        fs.mkdirSync(path);
    }
};

export const nameSetsAreEqual = (names1, names2) => {
    if (names1.size !== names2.size) {
        return false;
    }
    for (const name of names1) {
        if (!names2.has(name)) {
            return false;
        }
    }
    return true;
};

export const capitalize = (text) => (
    text.charAt(0).toUpperCase() + text.substring(1, text.length)
);

export const getUnionText = (textList) => {
    if (textList.length > 2) {
        const lastIndex = textList.length - 1;
        return textList.slice(0, lastIndex).join(", ") + ", or " + textList[lastIndex];
    } else {
        return textList.join(" or ");
    }
};


