// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from "react";
import { ConfigurationSelection, customConfigurationStorageKey } from "./components/configurationSelection";
import { TelemetryViewer } from "./components/telemetryViewer";
import { getConfiguration } from "./configuration/configuration";
import { ConfigurationType, ConfigurationURLs } from "./configuration/Configuration.types";
import { IConfiguration } from "./configuration/IConfiguration";
import { Session } from "./session";
import { checkForUpdate } from "./UpdateCheck";
import { doAwait } from "@nevware21/ts-async";

type AppPhase =
    | "Startup"
    | "ShowConfigurationSelection"
    | "LoadingConfiguration"
    | "ConfigurationLoaded"
    | "ConfigurationLoadFailed";

const configurationTypeStorageKey = "configurationType";
const defaultVersion = "#version#";

export const TelemetryViewerPopup = (): React.ReactElement => {
    const [appPhase, setAppPhase] = React.useState<AppPhase>("Startup");
    const [session, setSession] = React.useState<Session | undefined>(undefined);
    const [configurationType, setConfigurationType] = React.useState<ConfigurationType>(undefined);
    let newAvailableVersion: string;
    // let newVersionDownload: string;

    function applyConfigurationType(newConfigurationType: ConfigurationType): void {
        if (newConfigurationType) {
            chrome.storage.local.set({ [configurationTypeStorageKey]: newConfigurationType });
        }
        setConfigurationType(newConfigurationType);

        if (newConfigurationType) {
            loadConfiguration(newConfigurationType);
        } else {
            setAppPhase("ShowConfigurationSelection");
        }
    }

    function loadConfiguration(configurationTypeToLoad: ConfigurationType): void {
        setAppPhase("LoadingConfiguration");

        if (configurationTypeToLoad === "Custom") {
            try {
                doAwait(chrome.storage.local.get([customConfigurationStorageKey]), (savedValue: any) => {
                    if (savedValue) {
                        const newConfiguration = JSON.parse(savedValue[customConfigurationStorageKey]) as IConfiguration;
                        let newSession = new Session(newConfiguration, session);
                        session && session.dispose();
                        setSession(newSession);
                        setAppPhase("ConfigurationLoaded");
                    } else {
                        setAppPhase("ConfigurationLoadFailed");
                    }
                });
                
            } catch {
                setAppPhase("ConfigurationLoadFailed");
            }
        } else {
            getConfiguration(configurationTypeToLoad)
                .then((newConfiguration: IConfiguration) => {
                    if (newConfiguration) {
                        let newSession = new Session(newConfiguration, session);
                        session && session.dispose();
                        setSession(newSession);
                        setAppPhase("ConfigurationLoaded");
                    } else {
                        setAppPhase("ConfigurationLoadFailed");
                    }
                })
                .catch(() => {
                    setAppPhase("ConfigurationLoadFailed");
                });
        }
    }

    function highlightNewVersion() {
        let orgTitle = document.title;
        let count = 0;
        let interval = setInterval(() => {
            count ++;
            if ((count % 2) == 0) {
                document.title = orgTitle;
            } else {
                document.title = orgTitle + " *** v" + encodeURIComponent(newAvailableVersion) + " Available ***"
            }
            if (count > 10) {
                clearInterval(interval);
            }
        }, 1500);
    }

    function versionCheck() {
        let manifestVersion = defaultVersion;
        if (chrome && chrome.runtime) {
            let manifest = chrome.runtime.getManifest();
            manifestVersion = manifest.version_name || manifest.version || "";
        }

        if (manifestVersion) {
            let newTitle = "Telemetry Viewer - v" + encodeURIComponent(manifestVersion);
            document.title = newTitle;
            checkForUpdate((newVersion, details) => {
                newAvailableVersion = newVersion;
                // newVersionDownload = details;
                highlightNewVersion();
            }, manifestVersion);
        }
    }

    React.useEffect(() => {
        versionCheck();

        let configurationTypeToSet: ConfigurationType = undefined;
        try {
            doAwait(chrome.storage.local.get([configurationTypeStorageKey]), (savedValue: any) => {
                if (savedValue && Object.keys(ConfigurationURLs).includes(savedValue)) {
                    configurationTypeToSet = savedValue[configurationTypeStorageKey] as ConfigurationType;
                }
                setConfigurationType(configurationTypeToSet);
                applyConfigurationType(configurationTypeToSet);

                return () => {
                    session && session.dispose();
                };
            });

        } catch {
            // That's OK
        }
    }, []);

    function reset(): void {
        setAppPhase("ShowConfigurationSelection");
    }

    function showConfigurationSelection(): void {
        setAppPhase("ShowConfigurationSelection");
    }

    function handleConfigurationSelectionCancel(): void {
        if (session) {
            setAppPhase("ConfigurationLoaded");
        } else {
            setAppPhase("ShowConfigurationSelection");
        }
    }

    switch (appPhase) {
    case "ShowConfigurationSelection":
        return (
            <ConfigurationSelection
                configurationType={configurationType}
                onConfigurationSaved={applyConfigurationType}
                onCancel={handleConfigurationSelectionCancel}
            />
        );
    case "LoadingConfiguration":
        return <div className='loadingConfiguration'>Loading Configuration...</div>;
    case "ConfigurationLoadFailed":
        return (
            <div className='loadingConfigurationFailed'>
                <div className='loadingConfigurationFailedHeader'>The configuration could not be loaded</div>
                <div>
                    <a href='#' onClick={() => loadConfiguration(configurationType)}>
                            Retry
                    </a>
                </div>
                <div>
                    <a href='#' onClick={reset}>
                            Choose a different configuration
                    </a>
                </div>
            </div>
        );
    case "ConfigurationLoaded":
        {
            if (session !== undefined) {
                return (
                    <TelemetryViewer session={session} onShowConfigurationSelection={showConfigurationSelection} />
                );
            } else {
                reset();
            }
        }
        break;
    }

    return <div></div>;
};
