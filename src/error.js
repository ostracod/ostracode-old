
export class UsageError extends Error {
    
}

export class CompilerError extends Error {
    
    getLabel() {
        // In the future, we will add a line number to the label.
        return "Error";
    }
}


