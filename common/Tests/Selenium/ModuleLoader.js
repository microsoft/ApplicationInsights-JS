function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function loadFetchModule(moduleLoader, name) {
    // Load whatwg-fetch
    moduleLoader.add(name || "whatwg-fetch").afterLoad = function (polyFetch) {
        window.fetch = window.fetch || polyFetch.fetch;
        window.Headers = window.Headers || polyFetch.Headers;
        window.Response = window.Response || polyFetch.Response;
        window.Request = window.Request || polyFetch.Request;
        
        var usePolyFetch = getParameterByName("polyFetch");
        if (usePolyFetch) {
            window.fetch = polyFetch.fetch;
            window.Headers = polyFetch.Headers;
            window.Response = polyFetch.Response;
            window.Request = polyFetch.Request;
        }
    };
}

function loadCommonModules(moduleLoader, onDone, includeShims) {

    // Load and define the app insights test framework module
    moduleLoader.add("@microsoft/ai-test-framework");
    if (includeShims !== false) {
        moduleLoader.add("@microsoft/applicationinsights-shims");
    }

    moduleLoader.addModuleDependencies(onDone);
}

function ModuleLoader(config) {

    if (config) {
        require.config(config);
    }

    var requiredModules = [];
    var loadedModules = {};

    function doModuleCb(moduleDef, theModule, cb) {
        if (theModule) {
            cb(theModule);
        } else {
            // Module was loaded, but has not yet created and instance -- so create one
            console && console.log("Module [" + moduleDef.name + "] loaded - creating instance - " + moduleDef.name);
            require([moduleDef.name], function (theModule) {
                cb(theModule);
            });
        }
    }

    function tryLoadModule(moduleDef, onSuccess, onFailure, prefix) {
        if (loadedModules[moduleDef.name]) {
            onSuccess();
            return;
        }

        console.log(prefix + "Module: " + moduleDef.name);
        prefix += "  |  ";
        prefix = prefix.replace(/\+\-\-/g, "|  ");
        function reportLoadFailure(reason) {
            console && console.error(prefix + "Failed to load [" + moduleDef.name + "] from [" + moduleDef.pkgPath + "]\n - Require ERROR: " + reason.toString());
            if (moduleDef.path.toLowerCase() !== moduleDef.path) {
                console && console.log(prefix + " ** Validate the path it may need to be all lowercase -- " + moduleDef.path);
            }

            onFailure && onFailure(reason);
        }

        var baseUrl = config.baseUrl;
        if ((moduleDef.name === moduleDef.path || moduleDef.isDependency) && !config.paths[moduleDef.name]) {
            var modulePath = "node_modules/" + moduleDef.path;
            doFetch(baseUrl + modulePath + "/package.json", function (theUrl, resp) {
                resp.text().then(function (theText) {
                    processPackageJson(moduleDef, modulePath, theText, onSuccess, reportLoadFailure, prefix);
                }, function (reason) {
                    reportLoadFailure(reason);
                });
            }, function (reason) {
                if (moduleDef.pkgPath) {
                    console.log("Trying - " + moduleDef.pkgPath + " [" + modulePath + "]");
                    modulePath = moduleDef.pkgPath + "/" + modulePath;
                    doFetch(baseUrl + modulePath + "/package.json", function (theUrl, resp) {
                        resp.text().then(function (theText) {
                            processPackageJson(moduleDef, modulePath, theText, onSuccess, reportLoadFailure, prefix);
                        }, reportLoadFailure);
                    }, function (reason) {
                        modulePath = moduleDef.pkgPath;
                        var idx = modulePath.lastIndexOf("node_modules/");
                        if (idx !== -1) {
                            modulePath = modulePath.substring(0, idx + 13);
                        }
    
                        console.log("Trying2 - " + moduleDef.pkgPath + " [" + modulePath + "]");
                        modulePath = modulePath + moduleDef.path;
                        doFetch(baseUrl + modulePath + "/package.json", function (theUrl, resp) {
                            resp.text().then(function (theText) {
                                processPackageJson(moduleDef, modulePath, theText, onSuccess, reportLoadFailure, prefix);
                            }, reportLoadFailure);
                        }, reportLoadFailure);
                    });
                } else {
                    reportLoadFailure(reason);
                }
            });
        } else {
            doRequireModule(moduleDef, moduleDef.path, onSuccess, reportLoadFailure, prefix);
        }
    }

    function processModules() {
        if (requiredModules.length > 0) {
            var moduleDef = requiredModules.shift();
            if (moduleDef.prepare) {
                moduleDef.prepare();
            }

            if (moduleDef.config) {
                require.config(config);
            }

            tryLoadModule(moduleDef, processModules, processModules, "");
        }
    }

    function doFetch(theUrl, onSuccess, onFailure) {
        //console.log("doFetch(" + theUrl + ")");
        var fileExt = /\.\w+/g.exec(theUrl)[0];
        fetch(theUrl).then(function (resp) {
            if (resp.ok) {
                onSuccess(theUrl, resp);
            } else {
                if (fileExt === ".js") {
                    doFetch(theUrl + ".cjs", onSuccess, onFailure);
                } else if (fileExt === ".cjs") {
                    doFetch(theUrl + ".mjs", onSuccess, onFailure);
                } else {
                    onFailure(resp.statusText);
                }
            }
        }, function (reason) {
            onFailure && onFailure(reason);
        });
    }

    function loadPackageJson(packageJson) {
        function removeTrailingComma(text) {
            return text.replace(/,(\s*[}\],])/g, "$1");
        }

        return JSON.parse(removeTrailingComma(packageJson));
    }

    function loadPackageDependencies(prefix, moduleDef, thePackage, onSuccess, onFailure) {
        var theDependencies;
        var depIdx = 0;

        function _loadDependencies() {
            if (theDependencies && depIdx < theDependencies.length) {
                var dependency = theDependencies[depIdx++];
                console.log(prefix + " +-- Adding dependency " + dependency + " for " + moduleDef.name);
                tryLoadModule(createDependencyModule(dependency, moduleDef.pkgPath), _loadDependencies, _loadDependencies, prefix + " |   +--");
            } else {
                onSuccess && onSuccess();
            }
        }

        if (thePackage && thePackage.dependencies) {
            theDependencies = Object.keys(thePackage.dependencies);
            _loadDependencies();
        } else {
            onSuccess && onSuccess();
        }
    }

    function processPackageJson(moduleDef, thePath, packageJson, onSuccess, onFailure, prefix) {
        
        function reportLoadFailure(reason) {
            console && console.error(prefix + "Failed to load [" + moduleDef.name + "] from [" + moduleDef.path + "]\n - Require ERROR: " + String(reason));
            if (moduleDef.path.toLowerCase() !== moduleDef.path) {
                console && console.log(prefix + " ** Validate the path it may need to be all lowercase -- " + moduleDef.path);
            }

            onFailure && onFailure(reason);
        }

        function loadThisModule() {
            //console.log(prefix + "loadThisModule - " + moduleDef.path);
            doRequireModule(moduleDef, moduleDef.path, onSuccess, reportLoadFailure, prefix);
        }

        var thePackage = loadPackageJson(packageJson);

        moduleDef.name = thePackage.name;
        moduleDef.pkgPath = thePath;
        moduleDef.path = (thePath + "/" + thePackage.main).replace(/\.\w*$/, "");

        loadPackageDependencies(prefix, moduleDef, thePackage, loadThisModule, loadThisModule);
    }

    function doRequireModule(moduleDef, modulePath, onSuccess, onFailure, prefix) {
        modulePath = modulePath || moduleDef.path;

        console.info(prefix + " +-Require - " + moduleDef.name + ":" + moduleDef.path);
        require([moduleDef.path], function (theModule) {
            try {
                if (moduleDef.run) {
                    doModuleCb(moduleDef, theModule, function(theModule) {
                        console && console.log(prefix + "    +--Running module: " + moduleDef.name);
                        moduleDef.run(theModule);
                    });
                } else {
                    define(moduleDef.name, function() {
                        if (moduleDef.asDefault || (theModule.name && !theModule.__esModule)) {
                            console && console.log(prefix + "    +--Returning default module: " + moduleDef.name);

                            if (moduleDef.asDefault === 2) {
                                theModule.default = theModule.default || theModule;
                                return theModule;
                            }

                            return {
                                "default": theModule
                            }
                        }
                        //console && console.log(prefix + "    +--Returning module: " + moduleDef.name);
                        return theModule 
                    });

                    if (moduleDef.afterLoad) {
                        doModuleCb(moduleDef, theModule, function(theModule) {
                            console && console.log(prefix + "    +--Module After Load called: " + moduleDef.name + " from " + moduleDef.path);
                            moduleDef.afterLoad(theModule);
                        });
                    }

                    loadedModules[moduleDef.name] = true;
                    console && console.log(prefix + "    +--Loaded: " + moduleDef.name + " from " + moduleDef.path);
                }
            } catch(err) {
                console && console.error(prefix + "    +--Failed to load and initialize [" + moduleDef.name + "] from [" + moduleDef.path + "]\n - Require ERROR: " + err.toString());
            }

            onSuccess && onSuccess();
        },
        function (err) {
            onFailure(err);
        });
    }

    function addModuleDependencies(onDone) {
        var moduleDef = {
            name: ""
        };
        var baseUrl = config.baseUrl;
        doFetch(baseUrl + "/package.json", function (theUrl, resp) {
            resp.text().then(function (theText) {
                var thePackage = loadPackageJson(theText);
                if (thePackage) {
                    moduleDef.name = thePackage.name;
                    moduleDef.pkgPath = "";
                    loadPackageDependencies("", moduleDef, thePackage, onDone, onDone);
                } else {
                    onDone();
                }
            }, onDone);
        }, onDone);
    }

    function addModule(name, path, asDefault) {
        var moduleDef = {
            name: name,
            path: !path ? name : path,
            asDefault: asDefault
        }
        
        requiredModules.push(moduleDef);

        return moduleDef;
    }

    function createDependencyModule(name, pkgPath) {
        return {
            name: name,
            path: name,
            pkgPath: pkgPath,
            isDependency: true
        }
    }

    return {
        add: addModule,
        addModuleDependencies: addModuleDependencies,
        run: processModules
    }
}
