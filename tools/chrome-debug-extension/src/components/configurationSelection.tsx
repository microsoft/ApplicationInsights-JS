// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { getConfiguration } from '../configuration/configuration';
import { ConfigurationType, ConfigurationURLs } from '../configuration/Configuration.types';
import { IConfiguration } from '../configuration/IConfiguration';

export const customConfigurationStorageKey = 'customConfiguration';
export interface IConfigurationSelectionProps {
  configurationType: ConfigurationType;
  onConfigurationSaved: (newConfigurationType: ConfigurationType) => void;
  onCancel: () => void;
}``

const optionValues: Array<string | undefined> = Object.keys(ConfigurationURLs);
optionValues.unshift(undefined);

export const ConfigurationSelection = (
  props: IConfigurationSelectionProps
): React.ReactElement<IConfigurationSelectionProps> => {
  const [unsavedConfigurationType, setUnsavedConfigurationType] = React.useState<ConfigurationType>(
    props.configurationType || 'Default'
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
        setUnsavedConfigurationType('Custom');
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

  const configTypeChanged = unsavedConfigurationType && unsavedConfigurationType !== props.configurationType;
  const isSaveEnabled =
    configTypeChanged || (unsavedConfigurationType === 'Custom' && customConfigurationDirty);

  return (
    <div className='configurationSelection'>
      <div className='configurationSelectionHeader'>Configuration Selection</div>
      <div className='configurationSelectionDescription'>
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
        <p>To create a preset configuration for your project, see the instructions here (ADD LINK TO MD)</p>
      </div>

      <div className='configurationSelectionDropdownDiv'>
        <div className='configurationSelectionDropdownLabel'>Configuration To Use:</div>
        <select
          onChange={onConfigurationTypeSelectionChanged}
          className='configurationSelectionDropdown'
          value={unsavedConfigurationType}
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
        <button disabled={!isSaveEnabled} onClick={save} className='configurationSelectionButton'>
          OK
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
