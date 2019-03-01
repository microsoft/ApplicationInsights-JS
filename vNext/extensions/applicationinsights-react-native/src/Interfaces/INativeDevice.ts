export interface INativeDevice {
    /**
     * Device type, e.g. Handset, Tablet, Tv
     */
    deviceClass?: string;

    /**
     * Unique installation ID
     */
    id?: string;

    /**
     * The device model: iPhone XS Max, Galaxy S10, etc
     */
    model?: string;
}
