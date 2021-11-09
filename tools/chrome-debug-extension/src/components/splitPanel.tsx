// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from "react";

interface ISplitPanelProps {
    top: JSX.Element;
    bottom: JSX.Element;
}

export const SplitPanel = (props: ISplitPanelProps): React.ReactElement<ISplitPanelProps> => {
    React.useEffect(() => {
        const observer = new MutationObserver(updateBottomHeight);
        let container = document.getElementById("splitPanelTopContainer");
        if (container) {
            observer.observe(container, { attributes: true });
            updateBottomHeight();
        }
    }, []);

    const updateBottomHeight = (): void => {
        let container = document.getElementById("splitPanelTopContainer");
        if (container) {
            const currentTopHeight = container.style.height;
            const newBottomHeight = `calc(100% - ${currentTopHeight})`;
            let bottomContainer = document.getElementById("splitPanelBottomContainer");
            if (bottomContainer) {
                bottomContainer.style.height = newBottomHeight;
            }
        }
    };

    return (
        <div className='splitPanelRootContainer'>
            <div className='splitPanelTopContainer' id='splitPanelTopContainer' style={{ height: "60%" }}>
                <div className='scrollable'>{props.top}</div>
            </div>
            <div className='splitPanelBottomContainer' id='splitPanelBottomContainer'>
                <div className='scrollable'>{props.bottom}</div>
            </div>
        </div>
    );
};
