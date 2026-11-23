import dynamicProto from "@microsoft/dynamicproto-js";
import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { arrForEach, objCreate } from "@nevware21/ts-utils";
import { NotificationManager } from "../../../../src/core/NotificationManager";
import { INotificationListener } from "../../../../src/interfaces/ai/INotificationListener";
import { INotificationManager } from "../../../../src/interfaces/ai/INotificationManager";
import { ITelemetryItem } from "../../../../src/interfaces/ai/ITelemetryItem";

class CustomNotificationManager extends NotificationManager {
    constructor(callback: (events: ITelemetryItem[]) => void) {
        super();
        dynamicProto(CustomNotificationManager, this, (_self, _base) => {
            _self.eventsSent = (events) => {
                callback(events);
                _base.eventsSent(events);
            };
        });
    }
}

export class NotificationManagerTests extends AITestClass {
    public registerTests() {
        const notifications: Array<"eventsSent" | "eventsDiscarded" | "eventsRetry"> = [
            "eventsSent", "eventsDiscarded", "eventsRetry"
        ];
        arrForEach(notifications, (name) => {
            this.testCase({
                name: "NotificationManager: hasListener tracks listeners and instance overrides for " + name,
                useFakeTimers: true,
                test: () => {
                    const manager = new NotificationManager();
                    this.onDone(() => manager.unload(false));
                    Assert.equal(false, manager.hasListener(name), "No consumers before the first dispatch");
                    const unrelated: INotificationListener = { perfEvent: () => {} };
                    arrForEach(notifications, (other) => {
                        if (other !== name) {
                            unrelated[other] = this.sandbox.spy();
                        }
                    });
                    manager.addNotificationListener(unrelated);
                    Assert.equal(false, manager.hasListener(name), "Other notification callbacks are not consumers");

                    const callback = this.sandbox.spy();
                    const listener: INotificationListener = {};
                    listener[name] = callback;
                    manager.addNotificationListener(listener);
                    Assert.equal(true, manager.hasListener(name), "A matching callback is a consumer");
                    Assert.equal(0, callback.callCount, "Querying does not invoke the callback");
                    manager[name].call(manager, [], 1, 400);
                    Assert.equal(0, callback.callCount, "Dispatch remains asynchronous");
                    this.clock.tick(1);
                    Assert.equal(1, callback.callCount, "Dispatch reaches the matching listener");
                    Assert.equal(true, manager.hasListener(name), "Recognize the handler after DynamicProto caches it");

                    delete listener[name];
                    Assert.equal(false, manager.hasListener(name), "Deleting a callback takes effect immediately");
                    listener[name] = callback;
                    Assert.equal(true, manager.hasListener(name), "Restoring a callback takes effect immediately");
                    manager.removeNotificationListener(listener);
                    Assert.equal(false, manager.hasListener(name), "Removing the listener stops notification work");

                    const override = this.sandbox.stub(manager, name);
                    Assert.equal(true, manager.hasListener(name), "An instance override may handle notifications directly");
                    override.restore();
                    Assert.equal(false, manager.hasListener(name), "Restoring the built-in handler restores the optimization");
                }
            });

            this.testCase({
                name: "NotificationManager: hasListener preserves prototype overrides for " + name,
                test: () => {
                    const manager = new NotificationManager();
                    this.onDone(() => manager.unload(false));
                    Assert.equal(false, manager.hasListener(name), "Unmodified manager has no consumers");
                    const override = this.sandbox.stub(NotificationManager.prototype, name);
                    Assert.equal(true, manager.hasListener(name), "A prototype override may handle notifications directly");
                    override.restore();
                    Assert.equal(false, manager.hasListener(name), "Restoring the prototype restores the optimization");
                }
            });
        });

        arrForEach([
            "eventsSendRequest", "perfEvent", "offlineEventsStored", "offlineBatchSent", "offlineBatchDrop", "unload",
            "futureNotification"
        ], (name) => {
            this.testCase({
                name: "NotificationManager: hasListener accepts other notification names: " + name,
                test: () => {
                    const manager = new NotificationManager();
                    this.onDone(() => manager.unload(false));
                    Assert.equal(false, manager.hasListener(name), "No matching consumers");
                    const listener: INotificationListener & { futureNotification?: () => void } = {};
                    listener[name] = this.sandbox.spy();
                    manager.addNotificationListener(listener);
                    Assert.equal(true, manager.hasListener(name), "A matching callback is a consumer");
                    Assert.equal(0, listener[name].callCount, "Querying does not dispatch the notification");
                    delete listener[name];
                    Assert.equal(false, manager.hasListener(name), "Deleting the callback takes effect immediately");
                    listener[name] = this.sandbox.spy();
                    manager.removeNotificationListener(listener);
                    Assert.equal(false, manager.hasListener(name), "Removing the listener stops notification work");
                }
            });
        });

        this.testCase({
            name: "NotificationManager: optional hint preserves interface-to-class compatibility",
            test: () => {
                const interfaceManager: INotificationManager = new NotificationManager();
                const manager: NotificationManager = interfaceManager;
                this.onDone(() => manager.unload(false));
                Assert.equal(false, manager.hasListener("eventsSent"), "The built-in manager implements the optional hint");
                manager.hasListener = undefined;
                const legacyManager: INotificationManager = manager;
                Assert.equal(undefined, legacyManager.hasListener, "Managers without the hint remain supported");
            }
        });

        this.testCase({
            name: "NotificationManager: inherited hints do not suppress wrapper notifications",
            test: () => {
                const manager = new NotificationManager();
                const wrapper: NotificationManager = objCreate(manager);
                this.onDone(() => manager.unload(false));
                wrapper.eventsSent = this.sandbox.spy();
                Assert.equal(false, manager.hasListener("eventsSent"), "The original manager has no consumers");
                Assert.equal(true, wrapper.hasListener("eventsSent"), "An inherited hint cannot describe a wrapper's consumers");
            }
        });

        this.testCase({
            name: "NotificationManager: hasListener preserves subclass overrides",
            useFakeTimers: true,
            test: () => {
                const callback = this.sandbox.spy();
                const manager = new CustomNotificationManager(callback);
                const other = new NotificationManager();
                this.onDone(() => {
                    manager.unload(false);
                    other.unload(false);
                });
                Assert.equal(true, manager.hasListener("eventsSent"), "A subclass can consume events without listeners");
                Assert.equal(false, other.hasListener("eventsSent"), "Other instances still skip unused notifications");
                manager.eventsSent([]);
                Assert.equal(1, callback.callCount, "The subclass handles the notification");
                Assert.equal(true, manager.hasListener("eventsSent"), "The cached subclass implementation remains a consumer");

                const listener = { eventsSent: this.sandbox.spy() };
                manager.addNotificationListener(listener);
                manager.eventsSent([]);
                this.clock.tick(1);
                Assert.equal(2, callback.callCount, "The subclass still handles the notification");
                Assert.equal(1, listener.eventsSent.callCount, "Delegating to the base preserves listener delivery");
            }
        });
    }
}
