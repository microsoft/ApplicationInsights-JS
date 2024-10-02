export interface IExtendedConfiguration {
    /**
     * [Optional] Configuration for the Post Channel to the OneCollector.
     */
    channelConfiguration?: any;
    /**
     * [Optional] Configuration for the Property Manager to handle auto collection of Part A fields.
     */
    propertyConfiguration?: any;
    /**
     * [Optional] Configuration for the Web Analytics plugin
     */
    webAnalyticsConfiguration?: any;
}

export interface oneDsEnvelope {
    data: any;
    ext: any;
    time: string;
    iKey: string;
    name: string;
    ver: string;
}