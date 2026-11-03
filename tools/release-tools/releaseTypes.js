const supportedReleaseTypes = ["release", "rc", "dev", "nightly", "alpha"];

function isSupportedReleaseType(type) {
    return supportedReleaseTypes.indexOf(type) !== -1;
}

function validateReleaseVersion(version) {
    const preRelease = version.split("+", 2)[0].split("-", 2)[1];
    const type = preRelease ? preRelease.split(".")[0].split("-")[0] : "release";
    if (!isSupportedReleaseType(type)) {
        throw new Error("Unsupported release version [" + version + "]");
    }

    return type;
}

module.exports = { isSupportedReleaseType, validateReleaseVersion };
