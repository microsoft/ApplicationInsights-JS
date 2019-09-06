// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Envelope as AIEnvelope } from '../../Interfaces/Contracts/Generated/Envelope';
import { Base } from '../../Interfaces/Contracts/Generated/Base';
import { IEnvelope } from '../../Interfaces/Telemetry/IEnvelope';
import { DataSanitizer } from './DataSanitizer';
import { FieldType } from '../../Enums';
import { Util } from '../../Util';
import { IDiagnosticLogger } from '@microsoft/applicationinsights-core-js';

export class Envelope extends AIEnvelope implements IEnvelope {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract;

    /**
     * Constructs a new instance of telemetry data.
     */
    constructor(logger: IDiagnosticLogger, data: Base, name: string) {
        super();

        this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
        this.data = data;
        this.time = Util.toISOStringForIE8(new Date());

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