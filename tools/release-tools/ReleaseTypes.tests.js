const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..", "..");
const setVersionSource = fs.readFileSync(path.join(__dirname, "setVersion.js"), "utf8");
const publishSource = fs.readFileSync(path.join(__dirname, "npm_publish.js"), "utf8");
const packageSource = fs.readFileSync(path.join(__dirname, "npm_package.js"), "utf8");
const latestSource = fs.readFileSync(path.join(__dirname, "npm_set_latest.js"), "utf8");
const releaseTypes = require("./releaseTypes");

function testVersionArgs(args, valid) {
    const messages = [];
    const context = {
        console: {
            log: function(message) { messages.push(message); },
            warn: function(message) { messages.push(message); },
            error: function(message) { messages.push(message); }
        },
        process: {
            argv: ["node", "setVersion.js"].concat(args, ["-test"]),
            cwd: function() { return root; },
            exitCode: 0
        },
        require: function(name) {
            if (name === "fs") {
                return {
                    existsSync: fs.existsSync,
                    writeFileSync: function() { throw new Error("Dry-run attempted a filesystem write"); }
                };
            }
            if (name === "globby") {
                return { sync: function() { return []; } };
            }
            if (name === "./releaseTypes") {
                return releaseTypes;
            }
            return JSON.parse(fs.readFileSync(name, "utf8"));
        }
    };
    let error;
    try {
        vm.runInNewContext(setVersionSource, context);
    } catch (caught) {
        error = caught;
    }
    if (valid) {
        assert.ifError(error);
        assert.strictEqual(context.process.exitCode, 0, args.join(" "));
        assert.ok(messages.some(function(message) { return /^New version /.test(message); }), "Expected version generation");
    } else {
        assert.ok(error || context.process.exitCode !== 0, "Accepted unsupported version arguments: " + args.join(" "));
        assert.ok(!messages.some(function(message) { return /^New version /.test(message); }), "Unsupported version generation must stop");
    }
}

function testNpmReleaseTool(source, version, valid) {
    const commands = [];
    const packaging = source === packageSource;
    const context = {
        console: { log: function() {}, error: function() {} },
        process: {
            argv: ["node", "release-tool.js", "sdk"].concat(packaging ? ["-test"] : []),
            exit: function(code) { throw new Error("Exit " + code); },
            cwd: function() { return root; },
            chdir: function() {}
        },
        require: function(name) {
            if (name === "fs") {
                return {
                    existsSync: function(file) { return !packaging || !file.endsWith(".tgz"); },
                    readFileSync: function(file) {
                        if (file === "./tools/release-tools/package_groups.json") {
                            return JSON.stringify({ sdk: ["AISKU"] });
                        }
                        return JSON.stringify({ name: "@microsoft/applicationinsights-web", version: version });
                    }
                };
            }
            if (name === "child_process") {
                return { execSync: function(command) { commands.push(command); } };
            }
            if (name === "./releaseTypes") {
                return releaseTypes;
            }
            throw new Error("Unexpected dependency " + name);
        }
    };
    let error;
    try {
        vm.runInNewContext(source, context);
    } catch (caught) {
        error = caught;
    }
    if (valid) {
        assert.ifError(error);
        assert.strictEqual(commands.length, 1, version);
        if (!packaging) {
            assert.ok(commands[0].includes(version), "Package version changed");
        }
    } else {
        assert.ok(error && /Unsupported release version/.test(error.message), version);
        assert.strictEqual(commands.length, 0, "Unsupported versions must never invoke npm");
    }
}

[
    ["-beta"],
    ["-pre", "beta"],
    ["-pre", "nightlybeta"],
    ["3.4.6-beta.1"],
    ["3.4.6-beta.2+build7"],
    ["3.4.6-nightlybeta.1"],
    ["3.4.6-custom.1"]
].forEach(function(args) { testVersionArgs(args, false); });

[
    ["-release"],
    ["-next", "-release"],
    ["-next", "-pre", "rc"],
    ["-dev"],
    ["-alpha"],
    ["-pre", "nightly"],
    ["3.4.6"],
    ["3.4.6-rc.1"],
    ["3.4.6-dev.1"],
    ["3.4.6-nightly.1"],
    ["3.4.6-alpha.1"]
].forEach(function(args) { testVersionArgs(args, true); });

[packageSource, publishSource, latestSource].forEach(function(source) {
    ["3.4.6", "3.4.6-rc.1", "3.4.6-dev.1", "3.4.6-nightly.1", "3.4.6-alpha.1"].forEach(function(version) {
        testNpmReleaseTool(source, version, true);
    });
    ["3.4.6-beta.1", "3.4.6-beta.2+build7", "3.4.6-nightlybeta.1", "3.4.6-custom.1"].forEach(function(version) {
        testNpmReleaseTool(source, version, false);
    });
});

console.log("PASS: supported release generation, npm packaging, publishing and latest-tag promotion; unsupported versions rejected");
