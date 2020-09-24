/**
 * Enums.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */

export const ActionType = {
    CLICKLEFT: 'CL',
    CLICKRIGHT: 'CR',
    CLICKMIDDLE: 'CM',
    SCROLL: 'S',
    ZOOM: 'Z',
    RESIZE: 'R',
    KEYBOARDENTER: 'KE',
    KEYBOARDSPACE: 'KS',
    OTHER: 'O'
};

export enum EventType {
    PAGE_ACTION,
    CONTENT_UPDATE
};