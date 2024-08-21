const fs = require("fs");
const chalk = require("chalk");

function _mapReplacements(replacement) {
    return [replacement.pattern, replacement.replacement];
}

function readFileWithRetry(inst, filePath, retryCount, done) {
    try {
        let content = fs.readFileSync(filePath, "utf8");
        if (retryCount > 0) {
            inst.log.writeln(" -- Successfully read file after " + retryCount + " retries: " + filePath);
        }
        done(content);
    } catch(e) {
        if (retryCount > 5) {
            throw "Failed to read file after 5 retries: " + filePath + " Error: " + e;
        }

        inst.log.writeln(" -- (Retrying" + (retryCount + 1) + ") Error reading file: " + filePath + " Error: " + e);
        setTimeout(() => {
            readFileWithRetry(inst, filePath, retryCount + 1, done);
        }, 50);
    }
}

function writeFileWithRetry(inst, filePath, content, retryCount, done) {
    try {
        fs.writeFileSync(filePath, content, "utf8");
        if (retryCount > 0) {
            inst.log.writeln(" -- Successfully wrote file after " + retryCount + " retries: " + filePath);
        }
        done();
    } catch(e) {
        if (retryCount > 5) {
            throw "Failed to write file after 5 retries: " + filePath + " Error: " + e;
        }

        inst.log.writeln(" -- (Retrying:" + (retryCount + 1) + ") Error writing file: " + filePath + " Error: " + e);
        setTimeout(() => {
            writeFileWithRetry(inst, filePath, content, retryCount + 1, done);
        }, 50);
    }
}

function stringReplaceFn(inst) {

    function _process(tasks, doWork, onDone) {
        let lp = 0;
    
        function doNext(err) {
            if (err) {
                inst.log.error(err);
                onDone && onDone(err);
                doWork = null;
                return;
            }
    
            try {
                if (doWork && tasks && lp < tasks.length) {
                    doWork(tasks[lp++], doNext);
                } else {
                    onDone && onDone();
                }
            } catch (e) {
                inst.log.error(e);
                // Only call the onDone once
                onDone && onDone(e);
                onDone = null;
                doWork = null;
            }
        }
    
        doNext();
    }

    function _decorateReplaceFn(replacement, src, dest) {
        return function () {
            inst.log.debug('running replace function with extra arguments');
            var args = Array.prototype.slice.apply(arguments);
            args.push(src, dest);
            return replacement.apply(null, args);
        };
    }
    
    function _doMultiReplace(string, replacements, src, dest) {
        return replacements.reduce(function (content, replacements) {
            var pattern = replacements[0];
            var replacement = replacements[1];
    
            if (typeof replacement === "function") {
                inst.log.debug("replacing function with augmented one");
                replacement = _decorateReplaceFn(replacement, src, dest);
            }
    
            return content.replace(pattern, replacement);
        }, string);
    }
    
    function _doReplace(files, replacements, options, onComplete) {
        let newContent, dest;
        let counter = 0;
    
        if (!options.hasOwnProperty("saveUnchanged")) {
            options.saveUnchanged = true;
        } else {
            options.saveUnchanged = !!options.saveUnchanged;
        }
    
        _process(files, function (file, filesDone) {
            _process(file.src, function (src, srcDone) {
                inst.log.debug("processing file: ", src);
    
                if (!fs.existsSync(src)) {
                    inst.log.writeln("missing file:", src);
                    return srcDone(src + " file not found");
                }
    
                if (fs.statSync(src).isDirectory()) {
                    inst.log.writeln("src is a folder", src);
                    return srcDone();
                }
    
                if (file.dest[file.dest.length - 1] === "/") {
                    inst.log.writeln("dest is a folder");
    
                    if (inst.file.doesPathContain(file.dest, src)) {
                        dest = path.join(
                            file.dest,
                            src.replace(file.dest, "")
                        );
                    } else {
                        dest = path.join(file.dest, src);
                    }
                } else {
                    dest = file.dest;
                }
    
                dest = dest.replace(/\\/g, '/');
                inst.log.writeln("src path :", src);
                inst.log.writeln("dest path:", dest);
                readFileWithRetry(inst, src, 0, function (content) {
                    newContent =_doMultiReplace(content, replacements, src, dest);
        
                    if (content !== newContent || options.saveUnchanged) {
                        writeFileWithRetry(inst, dest, newContent, 0, function () {
                            counter += 1;
                            inst.verbose.writeln("File " + chalk.cyan(dest) + " updated.");
                            srcDone();
                        });

                        return;
                    } else {
                        inst.log.writeln("File " + chalk.cyan(dest) + " " + chalk.red("not") + " updated; No replacements found.");
                    }
        
                    srcDone();
                });
            }, filesDone);
        }, function (err) {
            inst.log.writeln("\n" + chalk.cyan(counter) + " files updated");
            onComplete(err);
        });
    }
    
    inst.registerMultiTask(
        "string-replace",
        "Task to Replace String values.",
        function () {
            let done = this.async();
            try {
                let options = this.options({
                    replacements: []
                });
                let replacements = options.replacements;
                if (typeof replacements === "function") {
                    replacements = replacements();
                }
                replacements = replacements.map(_mapReplacements);
                _doReplace(this.files, replacements, options || {}, function (err) {
                    if (err) {
                        done(new Error(err));
                    } else {
                        done();
                    }
                });
            } catch (e) {
                inst.log.error(e);
                done(false);
            }
        }
    );
}

module.exports = stringReplaceFn;
