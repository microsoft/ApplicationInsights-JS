// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Envelope as AIEnvelope } from "../../Interfaces/Contracts/Generated/Envelope";
import { Base } from "../../Interfaces/Contracts/Generated/Base";
import { IEnvelope } from "../../Interfaces/Telemetry/IEnvelope";
import { dataSanitizeString } from "./DataSanitizer";
import { FieldType } from "../../Enums";
import { IDiagnosticLogger, toISOString } from "@microsoft/applicationinsights-core-js";
import { strNotSpecified } from "../../Constants";

export class Envelope extends AIEnvelope implements IEnvelope {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract: any;

    /**
     * Constructs a new instance of telemetry data.
     */
    constructor(logger: IDiagnosticLogger, data: Base, name: string) {
        super();

        this.name = dataSanitizeString(logger, name) || strNotSpecified;
        this.data = data;
        this.time = toISOString(new Date());

        this.aiDataContract = {
            time: FieldType.Required,
            iKey: FieldType.Required,
            name: FieldType.Required,
            sampleRate: () => {
                return (this.sampleRate === 100) ? FieldType.Hidden : FieldType.Required;
            },
            tags: FieldType.Required,
            data: FieldType.Required
        };
    }
}