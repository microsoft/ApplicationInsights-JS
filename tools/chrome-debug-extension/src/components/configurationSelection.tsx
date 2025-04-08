// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from "react";
import { getConfiguration } from "../configuration/configuration";
import { ConfigurationType, ConfigurationURLs } from "../configuration/Configuration.types";
import { IConfiguration } from "../configuration/IConfiguration";
import { doAwait } from "@nevware21/ts-async";

export const customConfigurationStorageKey = "customConfiguration";
export interface IConfigurationSelectionProps {
    configurationType: ConfigurationType;
    onConfigurationSaved: (newConfigurationType: ConfigurationType) => void;
    onCancel: () => void;
}

const optionValues: Array<string | undefined> = Object.keys(ConfigurationURLs);
optionValues.unshift(undefined);

export const ConfigurationSelection = (
    props: IConfigurationSelectionProps
): React.ReactElement<IConfigurationSelectionProps> => {
    const [unsavedConfigurationType, setUnsavedConfigurationType] = React.useState<ConfigurationType>(
        props.configurationType || "Default"
    );
    const [customConfiguration, setCustomConfiguration] = React.useState<string>("");
    const [customConfigurationDirty, setCustomConfigurationDirty] = React.useState<boolean>(false);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

    function onConfigurationTypeSelectionChanged(event: React.FormEvent<HTMLSelectElement>): void {
        if (Object.keys(ConfigurationURLs).includes(event.currentTarget.value)) {
            setUnsavedConfigurationType(event.currentTarget.value as ConfigurationType);
        } else {
            setUnsavedConfigurationType(undefined);
        }
    }

    function save(): void {
        props.onConfigurationSaved(unsavedConfigurationType);
    }

    function cancel(): void {
        props.onCancel();
    }

    function updateCustomConfiguration(newCustomConfiguration: string): void {
        setCustomConfigurationDirty(true);
        setCustomConfiguration(newCustomConfiguration);
        chrome.storage.local.set({ [customConfigurationStorageKey]: newCustomConfiguration });

    }

    function onCopyToCustomConfiguration(): void {
        getConfiguration(unsavedConfigurationType).then((configuration: IConfiguration | undefined) => {
            if (configuration) {
                updateCustomConfiguration(JSON.stringify(configuration, undefined, 2));
                setUnsavedConfigurationType("Custom");
            }
        });
    }

    function onCustomConfigurationChanged(event: React.FormEvent<HTMLTextAreaElement>): void {
        const newCustomConfiguration = event.currentTarget.value;
        updateCustomConfiguration(newCustomConfiguration);
    }

    React.useEffect(() => {
        try {
            doAwait(chrome.storage.local.get([customConfigurationStorageKey]), (savedValue: any) => {
                if (savedValue) {
                    setCustomConfiguration(savedValue[customConfigurationStorageKey]);
                }
                if (textAreaRef.current) {
                    textAreaRef.current.setAttribute("aria-labelledby", "customConfigurationLabel");
                }
            });
           
        } catch {
            // That's OK
        }
        
    }, []);

    const isCustomConfigurationTextareaReadonly = unsavedConfigurationType !== "Custom";
    const customConfigurationTextareaClassname = isCustomConfigurationTextareaReadonly
        ? "customConfigurationTextarea disabled"
        : "customConfigurationTextarea";

    const configTypeChanged = unsavedConfigurationType && unsavedConfigurationType !== props.configurationType;
    const isSaveEnabled =
        configTypeChanged || (unsavedConfigurationType === "Custom" && customConfigurationDirty);

    return (
        <div className='configurationContainer'>
            <div className='configurationSelectionSection'>
                <div className='configurationHeader'>Configuration Selection</div>
                <div className='configurationDescription'>
                    <p>The configuration of this tool defines how the captured data is displayed and filtered.</p>
                    <p>
                        If your team has a preset already build, select it from configuration list below and you're ready to
                        go!
                    </p>
                    <p>
                        If your team doesn't have a preset yet, you can use the Default configuration as a starting point.
                    </p>
                    <p>
                        To customize a configuration, you can copy it into the Custom Configuration box below then modify
                        and save it directly in this tool and it will immediately take effect. Your custom configuraiton is
                        saved in local storage in this web browser instance.
                    </p>
                    <p>To create a preset configuration for your project, see the instructions <a href="https://github.com/microsoft/ApplicationInsights-JS/blob/master/tools/chrome-debug-extension/README.md#creating-a-new-configuration" target="_blank">here</a></p>
                </div>

                <div className='configurationSelectionDropdownDiv'>
                    <div className='configurationSelectionDropdownLabel' id='configurationToUseLabel'>Configuration To Use:</div>
                    <select
                        aria-labelledby='configurationToUseLabel'
                        onChange={onConfigurationTypeSelectionChanged}
                        className='configurationSelectionDropdown'
                        value={unsavedConfigurationType}
                    >
                        {optionValues.map((value: string | undefined, index: number) => {
                            return <option key={value || ""}>{value}</option>;
                        })}
                    </select>
                    <button
                        disabled={unsavedConfigurationType === undefined || unsavedConfigurationType === "Custom"}
                        className='configurationSelectionCopyToCustom'
                        onClick={onCopyToCustomConfiguration}
                    >
                        Copy To Custom Configuration
                    </button>
                </div>

                <div className='configurationSelectionButtonsDiv'>
                    <button disabled={!isSaveEnabled} onClick={save} className='configurationSelectionButton'>
                        OK
                    </button>
                    {props.configurationType !== undefined ? (
                        <button className='configurationSelectionButton' onClick={cancel}>
                            Cancel
                        </button>
                    ) : undefined}
                </div>

                <div className='customConfigurationDiv' >
                    <div className='customConfigurationLabel' id='customConfigurationLabel'>Custom configuration:</div>
                    <textarea
                        className={customConfigurationTextareaClassname}
                        value={customConfiguration}
                        readOnly={isCustomConfigurationTextareaReadonly}
                        onChange={onCustomConfigurationChanged}
                        ref={textAreaRef}
                    ></textarea>
                </div>
            </div>
            <div className='updatesSection'>
                <div className='configurationHeader'>Updating this tool</div>
                <div className='configurationDescription'>
                    <p>Currently updates must be done manually.</p>
                    <p>
                        To update the tool, download either the <a href="https://js.monitor.azure.com/release/tools/ai.chrome-ext.zip" target="_blank">official</a> or <a href="https://js.monitor.azure.com/nightly/tools/ai.chrome-ext.nightly.zip" target="_blank">nightly</a> build and unzip it into the folder where you originally installed the tool.
                    </p>
                    <p>
                        For more information, see the instructions <a href="https://github.com/microsoft/ApplicationInsights-JS/blob/master/tools/chrome-debug-extension/README.md" target="_blank">here</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};
