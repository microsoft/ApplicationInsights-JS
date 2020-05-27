function ModuleLoader(config) {

    if (config) {
        require.config(config);
    }

    var requiredModules = [];

    function processModules() {
        if (requiredModules.length > 0) {
            var moduleDef = requiredModules.shift();
            if (moduleDef.prepare) {
                moduleDef.prepare();
            }

            if (moduleDef.config) {
                require.config(config);
            }

            require([moduleDef.path], function (theModule) {
                try {
                    if (moduleDef.run) {
                        moduleDef.run(theModule);
                    } else {
                        define(moduleDef.name, function() {
                            if (moduleDef.asDefault) {
                                console && console.log("Returning default module - " + moduleDef.name);
                                return {
                                    "default": theModule
                                }
                            }
                            console && console.log("Returning module - " + moduleDef.name);
                            return theModule 
                        });

                        if (moduleDef.afterLoad) {
                            console && console.log("Module After Load called - " + moduleDef.name + " from " + moduleDef.path);
                            moduleDef.afterLoad(theModule);
                        }
                        console && console.log("Loaded module - " + moduleDef.name + " from " + moduleDef.path);
                    }
                } catch(err) {
                    console && console.error("Failed to load and initialize [" + moduleDef.name + "] from [" + moduleDef.path + "]\n - Require ERROR: " + err.toString());
                }

                processModules();
            },
            function (err) {
                console && console.error("Failed to load [" + moduleDef.name + "] from [" + moduleDef.path + "]\n - Require ERROR: " + err.toString());
                if (moduleDef.path.toLowerCase() !== moduleDef.path) {
                    console && console.log(" ** Validate the path it may need to be all lowercase -- " + moduleDef.path);
                }
            });
        }
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

    return {
        add: addModule,
        run: processModules
    }
}