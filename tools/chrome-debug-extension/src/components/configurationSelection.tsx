// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { getConfiguration } from '../configuration/configuration';
import { ConfigurationType, ConfigurationURLs } from '../configuration/Configuration.types';
import { IConfiguration } from '../configuration/IConfiguration';
import { customConfigurationStorageKey } from '../telemetryViewerPopup';

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
    props.configurationType
  );
  const [customConfiguration, setCustomConfiguration] = React.useState<string>('');
  const [customConfigurationDirty, setCustomConfigurationDirty] = React.useState<boolean>(false);

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
    localStorage.setItem(customConfigurationStorageKey, newCustomConfiguration);
  }

  function onCopyToCustomConfiguration(): void {
    getConfiguration(unsavedConfigurationType).then((configuration: IConfiguration | undefined) => {
      if (configuration) {
        updateCustomConfiguration(JSON.stringify(configuration, undefined, 2));
      }
    });
  }

  function onCustomConfigurationChanged(event: React.FormEvent<HTMLTextAreaElement>): void {
    const newCustomConfiguration = event.currentTarget.value;
    updateCustomConfiguration(newCustomConfiguration);
  }

  React.useEffect(() => {
    try {
      const savedValue = localStorage.getItem(customConfigurationStorageKey);
      if (savedValue) {
        setCustomConfiguration(savedValue);
      }
    } catch {
      // That's OK
    }
  }, []);

  const isCustomConfigurationTextareaReadonly = unsavedConfigurationType !== 'Custom';
  const customConfigurationTextareaClassname = isCustomConfigurationTextareaReadonly
    ? 'customConfigurationTextarea disabled'
    : 'customConfigurationTextarea';

  return (
    <div className='configurationSelection'>
      <div className='configurationSelectionHeader'>Configuration Selection</div>
      <div className='configurationSelectionDescription'>
        <p>The configuration of this tool affects how the captured data is displayed and filtered.</p>
        <p>
          Select a preset configuration for your web application. If one doesn't exist yet, you can start with
          an existing preset and customize it right here for the schema of your web application's telemetry.
        </p>
        <p>To create a preset configuration for your project, see the instructions here (ADD LINK TO MD)</p>
      </div>

      <div className='configurationSelectionDropdownDiv'>
        <div className='configurationSelectionDropdownLabel'>Preset Configuration:</div>
        <select
          onChange={onConfigurationTypeSelectionChanged}
          className='configurationSelectionDropdown'
          defaultValue={unsavedConfigurationType}
        >
          {optionValues.map((value: string | undefined, index: number) => {
            return <option key={value || ''}>{value}</option>;
          })}
        </select>
        <button
          disabled={unsavedConfigurationType === undefined || unsavedConfigurationType === 'Custom'}
          className='configurationSelectionCopyToCustom'
          onClick={onCopyToCustomConfiguration}
        >
          Copy To Custom Configuration
        </button>
      </div>

      <div className='configurationSelectionButtonsDiv'>
        <button
          disabled={
            unsavedConfigurationType === undefined ||
            (unsavedConfigurationType !== 'Custom' && unsavedConfigurationType === props.configurationType) ||
            (unsavedConfigurationType === 'Custom' && !customConfigurationDirty)
          }
          onClick={save}
          className='configurationSelectionButton'
        >
          Save
        </button>
        {props.configurationType !== undefined ? (
          <button className='configurationSelectionButton' onClick={cancel}>
            Cancel
          </button>
        ) : undefined}
      </div>

      <div className='customConfigurationDiv'>
        <div className='customConfigurationLabel'>Custom configuration:</div>
        <textarea
          className={customConfigurationTextareaClassname}
          value={customConfiguration}
          readOnly={isCustomConfigurationTextareaReadonly}
          onChange={onCustomConfigurationChanged}
        ></textarea>
      </div>
    </div>
  );
};
