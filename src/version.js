
import { CompilerError } from "./error.js";

class Version {
    
    constructor(major, minor, patch) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
    
    equals(version) {
        return (this.major === version.major && this.minor === version.minor
            && this.patch === version.patch);
    }
    
    isAfter(version) {
        if (this.major > version.major) {
            return true;
        }
        if (this.major < version.major) {
            return false;
        }
        if (this.minor > version.minor) {
            return true;
        }
        if (this.minor < version.minor) {
            return false;
        }
        return (this.patch > version.patch);
    }
    
    toString() {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}

class VersionBoundary {
    
    constructor(version, isInclusive) {
        this.version = version;
        this.isInclusive = isInclusive;
    }
}

class VersionRange {
    
    constructor(startBoundary, endBoundary) {
        this.startBoundary = startBoundary;
        this.endBoundary = endBoundary;
    }
    
    includesRange(range) {
        const startVersion1 = this.startBoundary.version;
        const startVersion2 = range.startBoundary.version;
        if (startVersion1.isAfter(startVersion2)) {
            return false;
        }
        if (startVersion1.equals(startVersion2) && !this.startBoundary.isInclusive
                && range.startBoundary.isInclusive) {
            return false;
        }
        const endVersion1 = this.endBoundary.version;
        const endVersion2 = range.endBoundary.version;
        if (endVersion2.isAfter(endVersion1)) {
            return false;
        }
        if (endVersion2.equals(endVersion1) && !this.endBoundary.isInclusive
                && range.endBoundary.isInclusive) {
            return false;
        }
        return true;
    }
    
    toString() {
        return [
            this.startBoundary.isInclusive ? ">=" : ">",
            this.startBoundary.version.toString(),
            " ",
            this.endBoundary.isInclusive ? "<=" : "<",
            this.endBoundary.version.toString(),
        ].join("");
    }
}

const getEndVersionMap = {
    "=": (startVersion) => (
        new Version(startVersion.major, startVersion.minor, startVersion.patch + 1)
    ),
    "~": (startVersion) => (
        new Version(startVersion.major, startVersion.minor + 1, 0)
    ),
    "^": (startVersion) => (
        new Version(startVersion.major + 1, 0, 0)
    ),
};

export const parseVersion = (versionText) => {
    const terms = versionText.split(".");
    if (terms.length !== 3) {
        throw new CompilerError(`Cannot parse "${versionText}" as a version.`);
    }
    const numberList = terms.map((term) => {
        const output = parseInt(term, 10);
        if (Number.isNaN(output)) {
            throw new CompilerError(`Cannot parse "${versionText}" as a version.`);
        }
        return output;
    });
    return new Version(numberList[0], numberList[1], numberList[2]);
};

export const parseVersionRange = (rangeText) => {
    const firstCharacter = rangeText.charAt(0);
    let getEndVersion = getEndVersionMap[firstCharacter];
    let versionText;
    if (typeof getEndVersion === "undefined") {
        getEndVersion = getEndVersion["="];
        versionText = rangeText;
    } else {
        versionText = rangeText.substring(1, rangeText.length);
    }
    const startVersion = parseVersion(versionText);
    const endVersion = getEndVersion(startVersion);
    return new VersionRange(
        new VersionBoundary(startVersion, true),
        new VersionBoundary(endVersion, false),
    );
};


