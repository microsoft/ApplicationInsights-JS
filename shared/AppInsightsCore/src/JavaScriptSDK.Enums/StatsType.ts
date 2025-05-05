// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//  @skip-file-minify

export const enum eStatsType {
    SDK = 0,
    CLIENT = 1,
}

export type StatsType = number | eStatsType;
