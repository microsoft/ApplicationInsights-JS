// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { ConfigurationType, ConfigurationURLs } from '../configuration/Configuration.types';

export interface IConfigurationSelectionProps {
  configurationType: ConfigurationType;
  onConfigurationTypeChanged: (newConfigurationType: ConfigurationType) => void;
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

  function onConfigurationTypeSelectionChanged(event: React.FormEvent<HTMLSelectElement>): void {
    if (Object.keys(ConfigurationURLs).includes(event.currentTarget.value)) {
      setUnsavedConfigurationType(event.currentTarget.value as ConfigurationType);
    } else {
      setUnsavedConfigurationType(undefined);
    }
  }

  function save(): void {
    props.onConfigurationTypeChanged(unsavedConfigurationType);
  }

  function cancel(): void {
    props.onCancel();
  }

  return (
    <div className='configurationSelection'>
      <div className='configurationSelectionHeader'>Configuration Selection</div>
      <div className='configurationSelectionDescription'>
        <p>
          This tool has different configurations to choose from which affect how the captured data is
          displayed and filtered.
        </p>
        <p>
          Select the configuration for your project, or you can use the General configuration if your project
          doesn't have a custom configuration yet.
        </p>

        <p>To create a custom configuration for your project, see the instructions here (ADD LINK TO MD)</p>
      </div>

      <div className='configurationSelectionDropdownDiv'>
        <div className='configurationSelectionDropdownLabel'>Configuration:</div>
        <select
          onChange={onConfigurationTypeSelectionChanged}
          className='configurationSelectionDropdown'
          defaultValue={unsavedConfigurationType}
        >
          {optionValues.map((value: string | undefined, index: number) => {
            return <option key={value || ''}>{value}</option>;
          })}
        </select>
      </div>

      <div className='configurationSelectionButtonsDiv'>
        <button
          disabled={
            unsavedConfigurationType === undefined || unsavedConfigurationType === props.configurationType
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
    </div>
  );
};
