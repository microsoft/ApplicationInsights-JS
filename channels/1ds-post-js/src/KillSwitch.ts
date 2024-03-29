/**
* KillSwitch.ts
* @author Abhilash Panwar (abpanwar)
* @copyright Microsoft 2018
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { arrForEach, dateNow, strTrim } from "@microsoft/1ds-core-js";

const SecToMsMultiplier = 1000;

/**
* Class to stop certain tenants sending events.
*/
export class KillSwitch {

    constructor() {
        let _killedTokenDictionary: { [token: string]: number } = {};

        function _normalizeTenants(values: string[]) {
            let result: string[] = [];
            if (values) {
                arrForEach(values, (value) => {
                    result.push(strTrim(value));
                });
            }

            return result;
        }

        dynamicProto(KillSwitch, this, (_self) => {
            _self.setKillSwitchTenants = (killTokens: string, killDuration: string): string[] => {
                if (killTokens && killDuration) {
                    try {
                        let killedTokens: string[] = _normalizeTenants(killTokens.split(","));
                        if (killDuration === "this-request-only") {
                            return killedTokens;
                        }
                        const durationMs = parseInt(killDuration, 10) * SecToMsMultiplier;
                        for (let i = 0; i < killedTokens.length; ++i) {
                            _killedTokenDictionary[killedTokens[i]] = dateNow() + durationMs;
                        }
                    } catch (ex) {
                        return [];
                    }
                }
                return [];
            };

            _self.isTenantKilled = (tenantToken: string): boolean => {
                let killDictionary = _killedTokenDictionary;
                let name = strTrim(tenantToken);
                if (killDictionary[name] !== undefined && killDictionary[name] > dateNow()) {
                    return true;
                }
                delete killDictionary[name];
                return false;
            };
        });
    }

    /**
     * Set the tenants that are to be killed along with the duration. If the duration is
     * a special value identifying that the tokens are too be killed for only this request, then
     * a array of tokens is returned.
     * @param killedTokens - Tokens that are too be marked to be killed.
     * @param killDuration - The duration for which the tokens are to be killed.
     * @returns The tokens that are killed only for this given request.
     */
    public setKillSwitchTenants(killTokens: string, killDuration: string): string[] {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return [];
    }

    /**
     * Determing if the given tenant token has been killed for the moment.
     * @param tenantToken - The token to be checked.
     * @returns True if token has been killed, false otherwise.
     */
    public isTenantKilled(tenantToken: string): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }
}
