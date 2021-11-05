// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import * as React from "react";
import { ConfigurationSelection, customConfigurationStorageKey } from "./components/configurationSelection";
import { TelemetryViewer } from "./components/telemetryViewer";
import { getConfiguration } from "./configuration/configuration";
import { ConfigurationType, ConfigurationURLs } from "./configuration/Configuration.types";
import { IConfiguration } from "./configuration/IConfiguration";
import { Session } from "./session";

type AppPhase =
    | "Startup"
    | "ShowConfigurationSelection"
    | "LoadingConfiguration"
    | "ConfigurationLoaded"
    | "ConfigurationLoadFailed";

const configurationTypeStorageKey = "configurationType";

export const TelemetryViewerPopup = (): React.ReactElement => {
    const [appPhase, setAppPhase] = React.useState<AppPhase>("Startup");
    const [session, setSession] = React.useState<Session | undefined>(undefined);
    const [configurationType, setConfigurationType] = React.useState<ConfigurationType>(undefined);

    function applyConfigurationType(newConfigurationType: ConfigurationType): void {
        if (newConfigurationType) {
            localStorage.setItem(configurationTypeStorageKey, newConfigurationType);
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
                const savedValue = localStorage.getItem(customConfigurationStorageKey);
                if (savedValue) {
                    const newConfiguration = JSON.parse(savedValue) as IConfiguration;
                    session && session.dispose();
                    setSession(new Session(newConfiguration));
                    setAppPhase("ConfigurationLoaded");
                } else {
                    setAppPhase("ConfigurationLoadFailed");
                }
            } catch {
                setAppPhase("ConfigurationLoadFailed");
            }
        } else {
            getConfiguration(configurationTypeToLoad)
                .then((newConfiguration: IConfiguration) => {
                    if (newConfiguration) {
                        session && session.dispose();
                        setSession(new Session(newConfiguration));
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

    React.useEffect(() => {
        let configurationTypeToSet = undefined;
        try {
            const savedValue = localStorage.getItem(configurationTypeStorageKey);
            if (savedValue && Object.keys(ConfigurationURLs).includes(savedValue)) {
                configurationTypeToSet = savedValue as ConfigurationType;
            }
        } catch {
            // That's OK
        }
        setConfigurationType(configurationTypeToSet);
        applyConfigurationType(configurationTypeToSet);

        return () => {
            session && session.dispose();
        };
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
