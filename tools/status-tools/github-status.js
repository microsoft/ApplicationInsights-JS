const fs = require("fs");
const child_process = require("child_process");
const NO_LABELS = "<No Labels>";
const NO_MILESTONE = "<No Milestone>";
const DEFAULT_LABELS = [ "bug", "enhancement", "feature", "question", "documentation", "duplicate", "invalid", "wontfix" ];

let _startMonth = 0;
let _endMonth = 0;
let _csv = false;
let _csvOnly = false;
let _csvOutput = "";
let _labels = null;
let _noLabels = false;
let _missingLabels = false;
let _prevMonths = 6;
let _dump = false;

function showHelp() {
    var scriptParts;
    var scriptName = process.argv[1];
    if (scriptName.indexOf("\\") !== -1) {
        scriptParts = scriptName.split("\\");
        scriptName = scriptParts[scriptParts.length - 1];
    } else if (scriptName.indexOf("/") !== -1) {
        scriptParts = scriptName.split("/");
        scriptName = scriptParts[scriptParts.length - 1];
    }

    console.log("");
    console.log(scriptName + " <group> ");
    console.log("--------------------------");
    console.log(" <startYYYY[-][MM]>                  - Identifies the first year/month to report from (2021; 2021-01; 202101), overrides default of 6 months");
    console.log(" <endYYYY[-][MM]>                    - Identifies the last year/month to report from (2021; 2021-01; 202101)");
    console.log(" -mths <number>                      - Number of months to report (overrides -startYYYY[-][MM]), defaults to 6 months");
    console.log(" -l | -labels <comma separated list> - Only report on the specified labels");
    console.log(" -csv                                - Send the output to a CSV file (issues.csv)");
    console.log(" -csvOnly                            - Send the output to a CSV file (issues.csv) and not to the console");
    console.log(" -px                                 - Include priority labels (p0, p1, p2, p3, p4) and overrides -noLabels");
    console.log(" -allLabels                          - Include all labels (overrides -l, -px and -noLabels)");
    console.log(" -noLabels                           - Don't report on any labels (overrides -l, -px and -all)");
    console.log(" -missingLabels                      - Identify issues with no assigned labels");
    console.log(" -noDefault                          - Don't add the default labels (bug,enhancement,feature,question,documentation,duplicate,invalid,wontfix)");
    console.log(" -dump                               - Dump the raw JSON data to a file (issues.json)")
    console.log(" -? | -h | -help                     - This help message");
    console.log("");
    console.log("Examples:");
    console.log(`node ${scriptName} -mths 12 -csv -px      - Report on the last 12 months, include priority labels and send to a CSV file`);
    console.log(`node ${scriptName} 2021-01 -csvOnly       - Report from Jan 2021, send to a CSV file and not to the console`);
    console.log(`node ${scriptName} 2021-01 2021-06 -csv   - Report from Jan 2021 to Jun 2021 and send to a CSV file`);
    console.log(`node ${scriptName} -l bug,enhancement     - Report on the last 6 months, only report on bug and enhancement labels`);
    console.log(`node ${scriptName} -px -noDefault         - Report on the last 6 months, and don't include the default labels`);
    console.log(`node ${scriptName} -allLabels             - Report on the last 6 months, and include all labels`);
    console.log(`node ${scriptName} -missingLabels         - Report on the last 6 months, and include issues with no labels`);
}

function parseYrMonth(yrMth) {
    let result = 0;
    if (yrMth) {
        let parts = yrMth.split("-");
        if (parts.length > 1) {
            // Contained "-"
            result = Number(parts[0]) * 100 + (parts[1] > 0 ? parts[1] - 1 : 0);
        } else if (parts[0].length == 6) {
            // Simple YYYYMM
            result = (parts[0] % 100) ? Number(parts[0]) - 1 : Number(parts[0]);
        } else if (parts[0].length == 4) {
            // Simple YYYY
            result = Number(parts[0]) * 100;
        }

        if (result > 2000 && (result % 100) > 11) {
            // Remove the provided Month
            result -= (result % 100);
            // Set to December
            result += 11
        }
    }

    return result;
}

function parseArgs() {
    if (process.argv.length < 2) {
        console.error("!!! Invalid number of arguments -- " + process.argv.length);
        return false;
    }

    let useDefaultLabels = true;
    let idx = 2;
    while (idx < process.argv.length) {
        let theArg = process.argv[idx];
        if (theArg.startsWith("-")) {
            if (theArg === "-?" || theArg === "-h" || theArg === "-help") {
                return false;
            } else if (theArg === "-csv") {
                _csv = true;
            } else if (theArg === "-csvOnly") {
                _csv = true;
                _csvOnly = true;
            } else if ((theArg === "-labels" || theArg === "-l") && idx + 1 < process.argv.length) {
                if (!_labels) {
                    _labels = [];
                }
                process.argv[++idx].split(",").forEach(label => {
                    _labels.push(label);
                });
                useDefaultLabels = false;
            } else if(theArg === "-px") {
                if (!_labels) {
                    _labels = [];
                }
                _labels.push("p0", "p1", "p2", "p3", "p4");
                _noLabels = false;
                useDefaultLabels = false;
            } else if(theArg === "-noLabels") {
                _noLabels = true;
                useDefaultLabels = false;
            } else if (theArg === "-allLabels") {
                _labels = null;
                _noLabels = false;
                useDefaultLabels = false;
            } else if (theArg === "-missingLabels") {
                _missingLabels = true;
                _noLabels = false;
            } else if (theArg === "-noDefault") {
                if (!_labels) {
                    _labels = [];
                }
                useDefaultLabels = false;
            } else if (theArg === "-mths" && idx + 1 < process.argv.length) {
                _prevMonths = Number(process.argv[++idx]);
                if (_prevMonths < 1) {
                    _prevMonths = 1;
                }
            } else if (theArg === "-dump") {
                _dump = true;
            } else {
                console.error("!!! Unknown switch [" + theArg + "] detected");
                return false;
            }
        } else if (!_startMonth) {
            _startMonth = parseYrMonth(theArg);
        } else if (!_endMonth) {
            _endMonth = parseYrMonth(theArg);
        } else {
            console.error("!!! Invalid Argument [" + theArg + "] detected");
            return false;
        }

        idx++;
    }

    if (useDefaultLabels && !_labels) {
        _labels =  DEFAULT_LABELS;
    }

    return true;
}

function logMessage(message) {
    if (!_csvOnly) {
        console.log(message);
    }
}

function logLines(lines) {
    if (lines) {
        lines.forEach(line => {
            logMessage(line);
        });
    }
}

function logHeader(title, firstYear, lastYear, lastMonth, issues) {
    let csvOutput =  "\"" + title + "\"";
    logMessage(title);

    if (_csv && issues) {
        for (let yr = firstYear; yr <= lastYear; yr++) {
            let year = issues[yr] || { cnt: 0, opened: 0, closed: 0 };
            if (year) {
                for (let mth = 0; mth < 12; mth++) {
                    let now = (yr * 100) + mth;
                    if (now <= lastMonth) {
                        let month = year[String(mth + 1).padStart(2, "0")];
                        if (month && now >= _startMonth) {
                            csvOutput += `,\"${yr}-${String(mth + 1).padStart(2, "0")}\"`;
                        }
                    }
                }
            }
        }
    }

    if (_csv) {
        _csvOutput += csvOutput + "\n";
    }
}

function dumpActive(label, issues, firstYear, lastYear, lastMonth) {
    let csvOutput =  "\"" + label + "\"";
    let lines = [];
    let hasData = false;
    lines.push(label);

    let active = 0;
    for (let yr = firstYear; yr <= lastYear; yr++) {
        let year = issues[yr] || { cnt: 0, opened: 0, closed: 0 };
        for (let mth = 0; mth < 12; mth++) {
            let now = (yr * 100) + mth;
            if (now <= lastMonth) {
                let month = year[String(mth + 1).padStart(2, "0")];
                if (month) {
                    active += month.cnt;
                }

                if (now >= _startMonth) {
                    csvOutput += `,${active}`;
                    lines.push(`${yr}-${String(mth + 1).padStart(2, "0")}: ${"".padStart(active, "#")}`);
                    if (active) {
                        hasData = true;
                    }
                }
            }
        }
    }


    lines.push(` --- End of ${label} ---`);
    if (hasData) {
        logLines(lines);
        if (_csv) {
            _csvOutput += csvOutput + "\n";
        }
    }
}

function dumpCount(label, issues, firstYear, lastYear, lastMonth, name) {
    let csvOutput =  "\"" + label + "\"";
    let lines = [];
    let hasData = false;
    lines.push(label);

    for (let yr = firstYear; yr <= lastYear; yr++) {
        let active = 0;
        let year = issues[yr] || { cnt: 0, opened: 0, closed: 0 };
        for (let mth = 0; mth < 12; mth++) {
            let now = (yr * 100) + mth;
            if (now >= _startMonth && now <= lastMonth) {
                let month = year[String(mth + 1).padStart(2, "0")];
                if (month) {
                    active = month[name];
                }

                csvOutput += `,${active}`;
                lines.push(`${yr}-${String(mth + 1).padStart(2, "0")}: ${"".padStart(active, "#")}`);
                if (active) {
                    hasData = true;
                }
            }
        }
    }

    lines.push(` --- End of ${label} ---`);

    if (hasData) {
        logLines(lines);
        if (_csv && csvOutput) {
            _csvOutput += csvOutput + "\n";
        }
    }
}

function sumValues(issues, createdAt, closedAt, issue) {
    let openYear = createdAt.getFullYear();
    let openMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
    let year = issues[openYear] = issues[openYear] || { cnt: 0, opened: 0, closed: 0 };
    year.cnt++;
    year.opened++;

    let month = year[openMonth] = year[openMonth] || { cnt: 0, opened: 0, closed: 0 };
    month.opened++;
    month.cnt++;
    if (issue) {
        let openIssues = month.openedIssues = (month.openedIssues || {});

        if (issue.milestone) {
            openIssues = openIssues[issue.milestone.title] = openIssues[issue.milestone.title] || [];
        } else {
            openIssues = openIssues[NO_MILESTONE] = openIssues[NO_MILESTONE] || [];
        }

        let labels = "";
        if (issue.labels) {
            issue.labels.forEach(label => {
                labels += (labels ? ", " : "") + label.name;
            });
        }

        if (!closedAt) {
            openIssues.push(`#${issue.number} ${labels ? "[" + labels + "]" : ""} :${issue.title}`);
        } else {
            openIssues.push(`#${issue.number} ${labels ? "[" + labels + "]" : ""} =<(Closed)>=- :${issue.title}`);
        }
    }

    if (closedAt) {
        let closeYear = closedAt.getFullYear();
        let closeMonth = String(closedAt.getMonth() + 1).padStart(2, "0");
        let year = issues[closeYear] = issues[closeYear] || { cnt: 0, opened: 0, closed: 0 };
        year.cnt--;
        year.closed++;

        let month = year[closeMonth] = year[closeMonth] || { cnt: 0, opened: 0, closed: 0 };
        month.closed++;
        month.cnt--;

        if (issue) {
            let closedIssues = month.closedIssues = (month.closedIssues || {});
            if (issue.milestone) {
                closedIssues = closedIssues[issue.milestone.title] = closedIssues[issue.milestone.title] || [];
            } else {
                closedIssues = closedIssues[NO_MILESTONE] = closedIssues[NO_MILESTONE] || [];
            }

            closedIssues.push(`#${issue.number} - ${issue.title}`);
        }
    }
}

function writeFile(filename, data, extension, overwrite = true, idx = 0) {
    let newFilename = filename + (idx ? ("-" + idx) : "") + "." + extension;

    if (!overwrite && fs.existsSync(newFilename)) {
        console.log(" -- Existing " + newFilename);
        writeFile(filename, data, extension, overwrite, idx + 1);
        return;
    }

    try {
        fs.writeFileSync(newFilename, data);
    } catch (e) {
        console.error(` -- Failed to write newFilename - ${e}`);
        writeFile(filename, data, extension, overwrite, idx + 1);
    }
}

function processIssues(issues) {
    let labels = {};
    let openIssues = {};
    let firstYear = 0;
    let lastYear = 0;
    let lastMonth = 0;

    for (let lp = 0; lp < issues.length; lp++) {
        let issue = issues[lp];
        let createdAt = new Date(issue.createdAt);
        let closedAt = issue.closedAt ? new Date(issue.closedAt) : null;

        let openYear = createdAt.getFullYear();
        let openMonth = (openYear * 100) + createdAt.getMonth();
        if (openYear < firstYear || firstYear === 0) {
            firstYear = openYear;
        }
        if (openYear > lastYear) {
            firstYear = openYear;
        }
        if (lastMonth < openMonth) {
            lastMonth = openMonth;
        }
        if (openYear > lastYear) {
            lastYear = openYear;
        }

        if (closedAt) {
            let closeYear = closedAt.getFullYear();
            let closeMonth = (closeYear * 100) + closedAt.getMonth();
            if (closeYear > lastYear) {
                lastYear = closeYear;
            }
            if (lastMonth < closeMonth) {
                lastMonth = closeMonth;
            }
        }

        sumValues(openIssues, createdAt, closedAt, issue);
        if (!_noLabels && issue.labels && issue.labels.length > 0) {
            issue.labels.forEach(label => {
                if (!_labels || _labels.includes(label.name)) {
                    labels[label.name] = labels[label.name] || {};
                    sumValues(labels[label.name], createdAt, closedAt);
                }
            });
        } else if (_missingLabels) {
            labels[NO_LABELS] = labels[NO_LABELS] || {};
            sumValues(labels[NO_LABELS], createdAt, closedAt);
        }
    }

    if (_endMonth && lastMonth > _endMonth) {
        lastMonth = _endMonth;
    }

    if (!_startMonth) {
        let yr = Math.floor(lastMonth / 100);
        let mon = lastMonth % 100;
        let subMonths = (_prevMonths || 12) - 1;
        yr -= Math.floor(subMonths / 12);
        subMonths %= 12;
        if (subMonths > 0) {
            mon -= subMonths;
            if (mon < 0) {
                yr --;
                mon += 12;
            }
        }

        _startMonth = (yr * 100) + mon;
    }

    let filename = `issues-${_startMonth + 1}-${lastMonth + 1}`;

    //console.log(`Reporting from: ${firstYear} to ${lastYear} - ${_startMonth + 1} to ${lastMonth + 1}`);

    logMessage(`Reporting from: ${_startMonth + 1} to ${lastMonth + 1}`);
    logHeader("Issues", firstYear, lastYear, lastMonth, openIssues);
    dumpCount("New", openIssues, firstYear, lastYear, lastMonth, "opened");
    dumpCount("Closed", openIssues, firstYear, lastYear, lastMonth, "closed");
    dumpActive("Active", openIssues, firstYear, lastYear, lastMonth);

    Object.keys(labels).sort().forEach(label => {
        dumpActive(label, labels[label], firstYear, lastYear, lastMonth);
    });
    //console.log(JSON.stringify(labels, null, 4));


    if (_dump) {
        console.log("Dumping raw JSON data to: " + filename + "-dump");
        writeFile(filename + "-dump", JSON.stringify(openIssues, null, 4), "json", true);

        console.log("Dumping raw JSON data to: " + filename + "-issues");
        writeFile(filename + "-issues", JSON.stringify(issues, null, 4), "json", true);
    }

    return filename;
}

if (parseArgs()) {

    logMessage("Getting Github Status");

    let npmCmd = `gh issue list --limit 10000 --state all --json number,state,title,labels,milestone,createdAt,closedAt,updatedAt`;
    console.log(`Running: \"${npmCmd}\"`);
    try {
        let output = child_process.execSync(npmCmd);
        let filename = processIssues(JSON.parse(output));
    
        if (_csv) {
            console.log("Writing CSV data to: " + filename);
            writeFile(filename, _csvOutput, "csv", true);
        }
    } catch (e) {
        console.error("This command requires the Github CLI to be installed and configured.");
        throw e;
    }

} else {
    showHelp();
    process.exit(1);
}
