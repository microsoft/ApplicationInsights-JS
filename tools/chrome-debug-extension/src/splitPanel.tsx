/* eslint-disable @typescript-eslint/no-non-null-assertion */
// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------
// tslint:disable:jsx-ban-props

import React from 'react';

interface ISplitPanelProps {
  top: JSX.Element;
  bottom: JSX.Element;
}

export const SplitPanel = (props: ISplitPanelProps): React.ReactElement<ISplitPanelProps> => {
  React.useEffect(() => {
    const observer = new MutationObserver(updateBottomHeight);
    observer.observe(document.getElementById('splitPanelTopContainer')!, { attributes: true });
    updateBottomHeight();
  }, []);

  const updateBottomHeight = (): void => {
    const currentTopHeight = document.getElementById('splitPanelTopContainer')!.style.height;
    const newBottomHeight = `calc(100% - ${currentTopHeight})`;
    document.getElementById('splitPanelBottomContainer')!.style.height = newBottomHeight;
  };

  return (
    <div className='splitPanelRootContainer'>
      <div className='splitPanelTopContainer' id='splitPanelTopContainer' style={{ height: '60%' }}>
        <div className='scrollable'>{props.top}</div>
      </div>
      <div className='splitPanelBottomContainer' id='splitPanelBottomContainer'>
        <div className='scrollable'>{props.bottom}</div>
      </div>
    </div>
  );
};

// tslint:enable:jsx-ban-props
