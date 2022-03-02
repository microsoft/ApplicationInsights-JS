

export function _toString(value: any, isRecursive: boolean = false): string {
    if (value === undefined) {
        return "<undefined>";
    }

    if (value === null) {
        return "<null>";
    }

    try {
        if (typeof value !== "string") {
            const objectTypeDump: string = Object.prototype.toString.call(value);
            let propertyValueDump: string = "";
            if (objectTypeDump === "[object Error]") {
                propertyValueDump = "{ stack: '" + value.stack + "', message: '" + value.message + "', name: '" + value.name + "'";
            } else {
                propertyValueDump = JSON.stringify(value);
            }
        
            return objectTypeDump + propertyValueDump;
        }
    } catch (e) {
        return "!!!Unable to convert to a string!!! - " + (!isRecursive ? _toString(e, true) : "%$#%&*@");
    }

    return value || "";
}

export function expectedToString(value: any) {
    return "Expected: [" + _toString(value) + "]";
}

export function stateToString(value: any) {
    return "State: [" + _toString(value) + "]";
}