import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { objKeys } from "@nevware21/ts-utils";
import { addAttributes, createAttributeContainer, createAttributeSnapshot, isAttributeContainer } from "../../../../src/attribute/attributeContainer";
import { eAttributeFilter, IAttributeChangeInfo } from "../../../../src/attribute/IAttributeContainer";
import { IOTelConfig } from "../../../../src/interfaces/config/IOTelConfig";
import { IOTelAttributes } from "../../../../src/interfaces/IOTelAttributes";
import { eAttributeChangeOp } from "../../../../src/enums/eAttributeChangeOp";
import { isFunction } from "@nevware21/ts-utils";

export class AttributeContainerTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {
        this.testCase({
            name: "AttributeContainer: Basic functionality",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");

                // Test initial state
                Assert.equal(0, container.size, "Initial size should be 0");
                Assert.equal(0, container.droppedAttributes, "Initial dropped attributes should be 0");

                // Test set/get
                Assert.ok(container.set("key1", "value1"), "Should successfully set attribute");
                Assert.equal("value1", container.get("key1"), "Should retrieve correct value");
                Assert.equal(1, container.size, "Size should be 1 after adding one attribute");

                // Test has
                Assert.ok(container.has("key1"), "Should return true for existing key");
                Assert.ok(!container.has("nonexistent"), "Should return false for non-existent key");

                // Test clear
                container.clear();
                Assert.equal(0, container.size, "Size should be 0 after clear");
                Assert.ok(!container.has("key1"), "Should not have key after clear");
                Assert.equal(undefined, container.get("key1"), "Should return undefined after clear");
            }
        });

        this.testCase({
            name: "AttributeContainer: Hierarchical keys (dotted notation)",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");

                // Test hierarchical keys
                Assert.ok(container.set("parent.child", "value1"), "Should set hierarchical key");
                Assert.ok(container.set("parent.child2", "value2"), "Should set second child");
                Assert.equal("value1", container.get("parent.child"), "Should get hierarchical value");
                Assert.equal("value2", container.get("parent.child2"), "Should get second hierarchical value");
                Assert.equal(2, container.size, "Should count hierarchical keys correctly");
            }
        });

        this.testCase({
            name: "AttributeContainer: Iterator methods",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");

                container.set("key1", "value1");
                container.set("key2", "value2");
                container.set("parent.child", "value3");

                // Test keys iterator
                const keys: string[] = [];
                const keysIter = container.keys();
                let keysResult = keysIter.next();
                while (!keysResult.done) {
                    keys.push(keysResult.value);
                    keysResult = keysIter.next();
                }
                Assert.equal(3, keys.length, "Should have 3 keys");
                Assert.ok(keys.includes("key1"), "Should include key1");
                Assert.ok(keys.includes("key2"), "Should include key2");
                Assert.ok(keys.includes("parent.child"), "Should include hierarchical key");

                // Test entries iterator
                const entries: [string, any, eAttributeFilter][] = [];
                const entriesIter = container.entries();
                let entriesResult = entriesIter.next();
                while (!entriesResult.done) {
                    entries.push(entriesResult.value);
                    entriesResult = entriesIter.next();
                }
                Assert.equal(3, entries.length, "Should have 3 entries");

                // Test values iterator
                const values: any[] = [];
                const valuesIter = container.values();
                let valuesResult = valuesIter.next();
                while (!valuesResult.done) {
                    values.push(valuesResult.value);
                    valuesResult = valuesIter.next();
                }
                Assert.equal(3, values.length, "Should have 3 values");
                Assert.ok(values.includes("value1"), "Should include value1");
                Assert.ok(values.includes("value2"), "Should include value2");
                Assert.ok(values.includes("value3"), "Should include value3");

                // Test forEach
                const forEachResults: { [key: string]: any } = {};
                container.forEach((key, value) => {
                    forEachResults[key] = value;
                });
                Assert.equal(3, objKeys(forEachResults).length, "forEach should iterate over all items");
                Assert.equal("value1", forEachResults["key1"], "forEach should provide correct key-value pairs");
            }
        });

        this.testCase({
            name: "AttributeContainer: attributes accessor property",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");

                container.set("key1", "value1");
                container.set("key2", 42);
                container.set("parent.child", true);

                const attributes = container.attributes;
                Assert.equal("value1", attributes["key1"], "Should include simple string attribute");
                Assert.equal(42, attributes["key2"], "Should include number attribute");
                Assert.equal(true, attributes["parent.child"], "Should include hierarchical boolean attribute");
                Assert.equal(3, objKeys(attributes).length, "Should have correct number of attributes");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container ID validation with name parameter",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Test container with no name
                const containerNoName = createAttributeContainer(otelCfg);
                Assert.ok(containerNoName.id, "Container should have an ID even without name");
                Assert.ok(containerNoName.id.includes("."), "Container ID should include dot separator");
                
                // Test container with custom name
                const containerWithName = createAttributeContainer(otelCfg, "custom-container");
                Assert.ok(containerWithName.id, "Container with name should have an ID");
                Assert.ok(containerWithName.id.startsWith("custom-container."), "Container ID should start with provided name");
                
                // Test container with descriptive name
                const containerDescriptive = createAttributeContainer(otelCfg, "span-attributes");
                Assert.ok(containerDescriptive.id.startsWith("span-attributes."), "Container ID should include descriptive name");
                
                // Test that different containers have different IDs
                const container1 = createAttributeContainer(otelCfg, "test-1");
                const container2 = createAttributeContainer(otelCfg, "test-2");
                const container3 = createAttributeContainer(otelCfg, "test-1"); // Same name, different instance
                
                Assert.notEqual(container1.id, container2.id, "Different containers should have different IDs");
                Assert.notEqual(container1.id, container3.id, "Containers with same name should have different IDs");
                Assert.notEqual(container2.id, container3.id, "All containers should have unique IDs");
                
                // Test ID format consistency
                Assert.ok(container1.id.includes("test-1."), "Container 1 should include its name");
                Assert.ok(container2.id.includes("test-2."), "Container 2 should include its name");
                Assert.ok(container3.id.includes("test-1."), "Container 3 should include its name");
            }
        });

        this.testCase({
            name: "AttributeContainer: Snapshot ID validation includes source container details",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create source container with name
                const sourceContainer = createAttributeContainer(otelCfg, "source-container");
                sourceContainer.set("key1", "value1");
                sourceContainer.set("key2", "value2");
                
                // Create snapshot from container
                const snapshot = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);
                
                Assert.ok(snapshot.id, "Snapshot should have an ID");
                Assert.ok(snapshot.id.includes("<-@["), "Snapshot ID should indicate it's a snapshot");
                Assert.ok(snapshot.id.includes(sourceContainer.id), "Snapshot ID should include source container ID");
                Assert.ok(snapshot.id.includes("]"), "Snapshot ID should close the snapshot notation");
                
                // Test snapshot from container without explicit name
                const unnamedContainer = createAttributeContainer(otelCfg);
                unnamedContainer.set("test", "value");
                const unnamedSnapshot = createAttributeSnapshot(otelCfg, "unnamed-snapshot", unnamedContainer);
                
                Assert.ok(unnamedSnapshot.id.includes("<-@["), "Unnamed container snapshot should indicate it's a snapshot");
                Assert.ok(unnamedSnapshot.id.includes(unnamedContainer.id), "Unnamed snapshot should include source container ID");
                
                // Test snapshot from plain object (should not include source container ID)
                const plainAttributes = { "plain": "value", "another": 42 };
                const plainSnapshot = createAttributeSnapshot(otelCfg, "plain-snapshot", plainAttributes);
                
                // Plain object snapshots get a different naming pattern since there's no source container
                Assert.ok(plainSnapshot.id, "Plain object snapshot should have an ID");
                Assert.notEqual(plainSnapshot.id, snapshot.id, "Plain snapshot should have different ID than container snapshot");
            }
        });

        this.testCase({
            name: "AttributeContainer: Snapshot ID uniqueness and inheritance details",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create multiple containers with the same name
                const container1 = createAttributeContainer(otelCfg, "parent-container");
                const container2 = createAttributeContainer(otelCfg, "parent-container");
                
                container1.set("key1", "value1");
                container2.set("key2", "value2");
                
                // Create snapshots from both containers
                const snapshot1 = createAttributeSnapshot(otelCfg, "snapshot1", container1);
                const snapshot2 = createAttributeSnapshot(otelCfg, "snapshot2", container2);
                
                Assert.notEqual(snapshot1.id, snapshot2.id, "Snapshots from different containers should have different IDs");
                
                // Both should reference their respective source container IDs
                Assert.ok(snapshot1.id.includes(container1.id), "Snapshot 1 should reference container 1 ID");
                Assert.ok(snapshot2.id.includes(container2.id), "Snapshot 2 should reference container 2 ID");
                
                // Test nested snapshot scenario
                const childContainer = createAttributeContainer(otelCfg, "child-container", container1);
                const childSnapshot = createAttributeSnapshot(otelCfg, "child-snapshot", childContainer);
                
                Assert.ok(childSnapshot.id.includes("<-@["), "Child snapshot should be identified as snapshot");
                Assert.ok(childSnapshot.id.includes(childContainer.id), "Child snapshot should reference child container ID");
                Assert.notEqual(childSnapshot.id, snapshot1.id, "Child snapshot should have different ID than parent snapshot");
                
                // Verify the child container ID includes its name
                Assert.ok(childContainer.id.includes("child-container."), "Child container ID should include its name");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - basic functionality",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2",
                    "shared.key": "parent_shared"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                // Test inherited attributes are accessible
                Assert.equal("parent_value1", container.get("parent.key1"), "Should get inherited attribute");
                Assert.equal("parent_value2", container.get("parent.key2"), "Should get second inherited attribute");
                Assert.equal("parent_shared", container.get("shared.key"), "Should get shared inherited attribute");
                Assert.ok(container.has("parent.key1"), "Should report inherited attribute as existing");
                Assert.equal(3, container.size, "Should count inherited attributes in size");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - override behavior",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "shared.key": "parent_shared",
                    "override.me": "parent_override"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                // Test initial inherited state
                Assert.equal(3, container.size, "Should start with 3 inherited attributes");
                Assert.equal("parent_shared", container.get("shared.key"), "Should get inherited value initially");

                // Test overriding inherited attribute
                Assert.ok(container.set("shared.key", "child_shared"), "Should successfully override inherited attribute");
                Assert.equal("child_shared", container.get("shared.key"), "Should get overridden value");
                Assert.equal(3, container.size, "Size should remain 3 after override");

                // Test adding new attribute alongside inherited ones
                Assert.ok(container.set("child.key", "child_value"), "Should add new attribute");
                Assert.equal("child_value", container.get("child.key"), "Should get new attribute value");
                Assert.equal("parent_value1", container.get("parent.key1"), "Should still get inherited attribute");
                Assert.equal(4, container.size, "Size should be 4 after adding new attribute");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - iterator methods include inherited attributes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2",
                    "shared.key": "parent_shared"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                // Add some child attributes
                container.set("child.key", "child_value");
                container.set("shared.key", "child_shared"); // Override inherited

                // Test keys iterator includes both inherited and child keys
                const keys: string[] = [];
                const keysIter = container.keys();
                let keysResult = keysIter.next();
                while (!keysResult.done) {
                    keys.push(keysResult.value);
                    keysResult = keysIter.next();
                }
                Assert.equal(4, keys.length, "Should have 4 total keys (2 child + 2 non-overridden inherited)");
                Assert.ok(keys.includes("child.key"), "Should include child key");
                Assert.ok(keys.includes("shared.key"), "Should include overridden key");
                Assert.ok(keys.includes("parent.key1"), "Should include inherited key1");
                Assert.ok(keys.includes("parent.key2"), "Should include inherited key2");

                // Test entries iterator
                const entries: [string, any, eAttributeFilter][] = [];
                const entriesIter = container.entries();
                let entriesResult = entriesIter.next();
                while (!entriesResult.done) {
                    entries.push(entriesResult.value);
                    entriesResult = entriesIter.next();
                }
                Assert.equal(4, entries.length, "Should have 4 total entries");
                
                // Convert to map by extracting key-value pairs (ignoring source)
                const entryMap = new Map(entries.map(entry => [entry[0], entry[1]]));
                Assert.equal("child_value", entryMap.get("child.key"), "Should have child entry");
                Assert.equal("child_shared", entryMap.get("shared.key"), "Should have overridden value in entries");
                Assert.equal("parent_value1", entryMap.get("parent.key1"), "Should have inherited entry");

                // Test forEach
                const forEachResults: { [key: string]: any } = {};
                container.forEach((key, value) => {
                    forEachResults[key] = value;
                });
                Assert.equal(4, objKeys(forEachResults).length, "forEach should iterate over all items including inherited");
                Assert.equal("child_shared", forEachResults["shared.key"], "forEach should use overridden value");
                Assert.equal("parent_value1", forEachResults["parent.key1"], "forEach should include inherited value");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - attributes includes inherited",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": 42,
                    "shared.key": "parent_shared"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                container.set("child.key", "child_value");
                container.set("shared.key", "child_shared"); // Override

                const attributes = container.attributes;
                Assert.equal("parent_value1", attributes["parent.key1"], "Should include inherited string");
                Assert.equal(42, attributes["parent.key2"], "Should include inherited number");
                Assert.equal("child_value", attributes["child.key"], "Should include child attribute");
                Assert.equal("child_shared", attributes["shared.key"], "Should use overridden value");
                Assert.equal(4, objKeys(attributes).length, "Should have correct total count");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - clear removes inherited attributes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                // Verify inherited attributes are present
                Assert.equal(2, container.size, "Should start with 2 inherited attributes");
                Assert.equal("parent_value1", container.get("parent.key1"), "Should access inherited attribute");

                // Add child attribute
                container.set("child.key", "child_value");
                Assert.equal(3, container.size, "Should have 3 total attributes");

                // Clear should remove everything including inherited
                container.clear();
                Assert.equal(0, container.size, "Should have 0 attributes after clear");
                Assert.ok(!container.has("parent.key1"), "Should not have inherited attribute after clear");
                Assert.ok(!container.has("child.key"), "Should not have child attribute after clear");
                Assert.equal(undefined, container.get("parent.key1"), "Should return undefined for inherited attribute after clear");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - empty parent attributes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const emptyParent: IOTelAttributes = {};
                const container = createAttributeContainer(otelCfg, "test-empty-parent", emptyParent);

                // Should behave like container without inheritance
                Assert.equal(0, container.size, "Should start with 0 attributes");
                container.set("key1", "value1");
                Assert.equal(1, container.size, "Should have 1 attribute after adding");
                Assert.equal("value1", container.get("key1"), "Should get attribute value");
            }
        });

        this.testCase({
            name: "AttributeContainer: Inheritance - null/undefined parent attributes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const containerNull = createAttributeContainer(otelCfg, "test-null", null as any);
                const containerUndefined = createAttributeContainer(otelCfg, "test-undefined", undefined as any);

                // Both should behave like containers without inheritance
                Assert.equal(0, containerNull.size, "Null parent should start with 0 attributes");
                Assert.equal(0, containerUndefined.size, "Undefined parent should start with 0 attributes");

                containerNull.set("key1", "value1");
                containerUndefined.set("key2", "value2");

                Assert.equal(1, containerNull.size, "Null parent container should have 1 after adding");
                Assert.equal(1, containerUndefined.size, "Undefined parent container should have 1 after adding");
            }
        });

        this.testCase({
            name: "AttributeContainer: addAttributes function with inheritance",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key": "parent_value"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                const attributesToAdd: IOTelAttributes = {
                    "added.key1": "added_value1",
                    "added.key2": 42,
                    "parent.key": "overridden_value" // Override inherited
                };

                addAttributes(container, attributesToAdd);

                Assert.equal(3, container.size, "Should have 3 attributes after adding");
                Assert.equal("added_value1", container.get("added.key1"), "Should have added attribute 1");
                Assert.equal(42, container.get("added.key2"), "Should have added attribute 2");
                Assert.equal("overridden_value", container.get("parent.key"), "Should override inherited attribute");
            }
        });

        this.testCase({
            name: "AttributeContainer: Complex inheritance scenarios",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "service.name": "parent-service",
                    "service.version": "1.0.0",
                    "deployment.environment": "staging",
                    "telemetry.sdk.name": "opentelemetry",
                    "common.attribute": "from_parent"
                };
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);

                // Add child-specific attributes
                container.set("span.kind", "client");
                container.set("http.method", "GET");
                container.set("http.url", "https://api.example.com");
                
                // Override some parent attributes
                container.set("service.version", "2.0.0"); // Override
                container.set("deployment.environment", "production"); // Override

                // Verify final state
                Assert.equal(8, container.size, "Should have 8 total attributes (5 parent + 5 child - 2 overrides)");
                
                // Check overridden values
                Assert.equal("2.0.0", container.get("service.version"), "Should use child version");
                Assert.equal("production", container.get("deployment.environment"), "Should use child environment");
                
                // Check inherited values
                Assert.equal("parent-service", container.get("service.name"), "Should inherit service name");
                Assert.equal("opentelemetry", container.get("telemetry.sdk.name"), "Should inherit SDK name");
                Assert.equal("from_parent", container.get("common.attribute"), "Should inherit common attribute");
                
                // Check child-only values
                Assert.equal("client", container.get("span.kind"), "Should have child span kind");
                Assert.equal("GET", container.get("http.method"), "Should have child HTTP method");

                const finalAttributes = container.attributes;
                Assert.equal(8, objKeys(finalAttributes).length, "attributes should return correct count");
                Assert.equal("2.0.0", finalAttributes["service.version"], "attributes should use overridden value");
                Assert.equal("parent-service", finalAttributes["service.name"], "attributes should include inherited value");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Valid container identification",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");

                // Test with valid container
                Assert.ok(isAttributeContainer(container), "Should identify valid container");
                
                // Test with inherited attributes
                const inheritedAttribs: IOTelAttributes = { "parent.key": "value" };
                const containerWithInheritance = createAttributeContainer(otelCfg, "test-inherited", inheritedAttribs);
                Assert.ok(isAttributeContainer(containerWithInheritance), "Should identify container with inheritance");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Child containers identification",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentContainer = createAttributeContainer(otelCfg, "parent-container");
                parentContainer.set("parent.key", "parent-value");

                // Test child container created with child() method
                const childContainer = parentContainer.child("child-container");
                Assert.ok(isAttributeContainer(childContainer), "Should identify child container as valid");
                
                // Test snapshot child container created with child() method
                const snapshotContainer = parentContainer.child("snapshot-container", true);
                Assert.ok(isAttributeContainer(snapshotContainer), "Should identify snapshot child container as valid");
                
                // Verify that child containers have the required methods and properties
                Assert.equal(isFunction(childContainer.child), true, "Child container should have child method");
                Assert.equal(isFunction(childContainer.listen), true, "Child container should have listen method");
                Assert.ok("id" in childContainer, "Child container should have id property");
                Assert.ok("size" in childContainer, "Child container should have size property");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Invalid object identification - null and undefined",
            test: () => {
                // Test null and undefined
                Assert.ok(!isAttributeContainer(null), "Should return false for null");
                Assert.ok(!isAttributeContainer(undefined), "Should return false for undefined");
                Assert.ok(!isAttributeContainer(void 0), "Should return false for void 0");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Invalid object identification - primitive types",
            test: () => {
                // Test primitive types
                Assert.ok(!isAttributeContainer("string"), "Should return false for string");
                Assert.ok(!isAttributeContainer(123), "Should return false for number");
                Assert.ok(!isAttributeContainer(true), "Should return false for boolean");
                Assert.ok(!isAttributeContainer(false), "Should return false for boolean false");
                Assert.ok(!isAttributeContainer(Symbol("test")), "Should return false for symbol");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Invalid object identification - arrays and other objects",
            test: () => {
                // Test arrays and other objects
                Assert.ok(!isAttributeContainer([]), "Should return false for empty array");
                Assert.ok(!isAttributeContainer([1, 2, 3]), "Should return false for array with values");
                Assert.ok(!isAttributeContainer({}), "Should return false for empty object");
                Assert.ok(!isAttributeContainer({ key: "value" }), "Should return false for plain object");
                Assert.ok(!isAttributeContainer(new Date()), "Should return false for Date object");
                Assert.ok(!isAttributeContainer(/regex/), "Should return false for RegExp object");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Missing required properties",
            test: () => {
                // Test objects missing size property
                const missingSize = {
                    droppedAttributes: 0,
                    attributes: {},
                    id: "test-id",
                    clear: () => {},
                    get: () => {},
                    has: () => {},
                    set: () => {},
                    del: () => {},
                    keys: () => {},
                    entries: () => {},
                    forEach: () => {},
                    values: () => {},
                    child: () => {},
                    listen: () => {}
                };
                Assert.ok(!isAttributeContainer(missingSize), "Should return false when missing size property");

                // Test objects missing droppedAttributes property
                const missingDroppedAttributes = {
                    size: 0,
                    attributes: {},
                    id: "test-id",
                    clear: () => {},
                    get: () => {},
                    has: () => {},
                    set: () => {},
                    del: () => {},
                    keys: () => {},
                    entries: () => {},
                    forEach: () => {},
                    values: () => {},
                    child: () => {},
                    listen: () => {}
                };
                Assert.ok(!isAttributeContainer(missingDroppedAttributes), "Should return false when missing droppedAttributes property");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Missing required methods",
            test: () => {
                const baseObj = {
                    size: 0,
                    droppedAttributes: 0,
                    attributes: {}
                };

                // Test missing each required method
                const requiredMethods = ["clear", "get", "has", "set", "del", "keys", "entries", "forEach", "values", "child", "listen"];
                
                requiredMethods.forEach(methodName => {
                    const objMissingMethod = { ...baseObj };
                    // Add all methods except the one we're testing
                    requiredMethods.forEach(method => {
                        if (method !== methodName) {
                            (objMissingMethod as any)[method] = () => {};
                        }
                    });
                    
                    Assert.ok(!isAttributeContainer(objMissingMethod), `Should return false when missing ${methodName} method`);
                });
            }
        });

        this.testCase({
            name: "isAttributeContainer: Wrong property types",
            test: () => {
                const baseObj = {
                    clear: () => {},
                    get: () => {},
                    has: () => {},
                    set: () => {},
                    del: () => {},
                    keys: () => {},
                    entries: () => {},
                    forEach: () => {},
                    values: () => {},
                    child: () => {},
                    listen: () => {}
                };

                // Test size property with wrong type
                const wrongSizeType = {
                    ...baseObj,
                    size: "not-a-number",
                    droppedAttributes: 0,
                    attributes: {}
                };
                Assert.ok(!isAttributeContainer(wrongSizeType), "Should return false when size is not a number");

                // Test droppedAttributes property with wrong type
                const wrongDroppedAttributesType = {
                    ...baseObj,
                    size: 0,
                    droppedAttributes: "not-a-number"
                };
                Assert.ok(!isAttributeContainer(wrongDroppedAttributesType), "Should return false when droppedAttributes is not a number");

                // Test both properties with wrong types
                const bothWrongTypes = {
                    ...baseObj,
                    size: true,
                    droppedAttributes: []
                };
                Assert.ok(!isAttributeContainer(bothWrongTypes), "Should return false when both properties have wrong types");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Wrong method types",
            test: () => {
                const baseObj = {
                    size: 0,
                    droppedAttributes: 0,
                    attributes: {}
                };

                const requiredMethods = ["clear", "get", "has", "set", "del", "keys", "entries", "forEach", "values", "child", "listen"];
                
                requiredMethods.forEach(methodName => {
                    const objWithWrongMethodType = { ...baseObj };
                    // Add all methods as functions except the one we're testing
                    requiredMethods.forEach(method => {
                        if (method !== methodName) {
                            (objWithWrongMethodType as any)[method] = () => {};
                        } else {
                            (objWithWrongMethodType as any)[method] = "not-a-function";
                        }
                    });
                    
                    Assert.ok(!isAttributeContainer(objWithWrongMethodType), `Should return false when ${methodName} is not a function`);
                });
            }
        });

        this.testCase({
            name: "isAttributeContainer: Objects with getter properties",
            test: () => {
                // Test object with lazy properties (similar to how attributeContainer implements size)
                const objWithGetters = {};
                
                // Define getters for size and droppedAttributes
                Object.defineProperty(objWithGetters, "size", {
                    get: () => 5,
                    enumerable: true
                });
                
                Object.defineProperty(objWithGetters, "droppedAttributes", {
                    get: () => 2,
                    enumerable: true
                });

                Object.defineProperties(objWithGetters, {
                    attributes: {
                        get: () => ({}),
                        enumerable: true
                    }
                });

                // Add required methods
                const requiredMethods = ["clear", "get", "has", "set", "del", "keys", "entries", "forEach", "values", "child", "listen"];
                requiredMethods.forEach(method => {
                    (objWithGetters as any)[method] = () => {};
                });

                // Add required id property
                (objWithGetters as any).id = "test-id";

                Assert.ok(isAttributeContainer(objWithGetters), "Should correctly identify object with getter properties");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Partial interface implementation",
            test: () => {
                // Test object that has some but not all required properties/methods
                const partialImplementation = {
                    size: 0,
                    droppedAttributes: 0,
                    clear: () => {},
                    get: () => {},
                    has: () => {},
                    set: () => {}
                    // Missing: del, keys, entries, forEach, values, child, listen, id, attributes
                };

                Assert.ok(!isAttributeContainer(partialImplementation), "Should return false for partial implementation");

                // Test object with all methods but wrong property types
                const wrongPropertyTypes = {
                    size: null,
                    droppedAttributes: undefined,
                    attributes: null,
                    clear: [],
                    get: () => {},
                    has: () => {},
                    set: () => {},
                    del: () => {},
                    keys: () => {},
                    entries: () => {},
                    forEach: () => {},
                    values: () => {},
                    child: () => {},
                    listen: () => {}
                };

                Assert.ok(!isAttributeContainer(wrongPropertyTypes), "Should return false when properties are null/undefined");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Edge cases and complex objects",
            test: () => {
                // Test function object (functions are objects in JavaScript)
                const func = function() {};
                func.size = 0;
                func.droppedAttributes = 0;
                func.attributes = {};
                func.id = "test-id";
                func.clear = () => {};
                func.get = () => {};
                func.has = () => {};
                func.set = () => {};
                func.del = () => {};
                func.keys = () => {};
                func.entries = () => {};
                func.forEach = () => {};
                func.values = () => {};
                func.child = () => {};
                func.listen = () => {};

                Assert.ok(isAttributeContainer(func), "Should identify function object with all required properties");

                // Test class instance
                class MockContainer {
                    size = 10;
                    droppedAttributes = 1;
                    attributes = {};
                    id = "mock-id";
                    clear() {}
                    get() {}
                    has() {}
                    set() {}
                    del() {}
                    keys() {}
                    entries() {}
                    forEach() {}
                    values() {}
                    child() {}
                    listen() {}
                }

                const mockInstance = new MockContainer();
                Assert.ok(isAttributeContainer(mockInstance), "Should identify class instance with all required properties");

                // Test object with prototype chain
                const prototypeObj = Object.create({
                    clear: () => {},
                    get: () => {},
                    has: () => {}
                });
                prototypeObj.size = 0;
                prototypeObj.droppedAttributes = 0;
                prototypeObj.attributes = {};
                prototypeObj.id = "proto-id";
                prototypeObj.set = () => {};
                prototypeObj.del = () => {};
                prototypeObj.keys = () => {};
                prototypeObj.entries = () => {};
                prototypeObj.forEach = () => {};
                prototypeObj.values = () => {};
                prototypeObj.child = () => {};
                prototypeObj.listen = () => {};

                Assert.ok(isAttributeContainer(prototypeObj), "Should identify object with methods in prototype chain");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Type guard functionality",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");
                const notContainer = { some: "object" };

                // Test type narrowing works correctly
                function processContainer(obj: any) {
                    if (isAttributeContainer(obj)) {
                        // In this block, TypeScript should know obj is IAttributeContainer
                        return obj.size; // This should compile without errors
                    }
                    return -1;
                }

                Assert.equal(0, processContainer(container), "Should return container size for valid container");
                Assert.equal(-1, processContainer(notContainer), "Should return -1 for invalid container");
                Assert.equal(-1, processContainer(null), "Should return -1 for null");
                Assert.equal(-1, processContainer("string"), "Should return -1 for string");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Real container usage scenarios",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Test container after operations
                const container = createAttributeContainer(otelCfg, "test-container");
                container.set("key1", "value1");
                container.set("key2", 42);
                
                Assert.ok(isAttributeContainer(container), "Should identify container after adding attributes");
                
                // Test container after clear
                container.clear();
                Assert.ok(isAttributeContainer(container), "Should still identify container after clear");
                
                // Test container with inheritance
                const inheritedAttribs: IOTelAttributes = {
                    "parent.key1": "value1",
                    "parent.key2": "value2"
                };
                const containerWithInheritance = createAttributeContainer(otelCfg, "test-inherited", inheritedAttribs);
                Assert.ok(isAttributeContainer(containerWithInheritance), "Should identify container with inheritance");
                
                // Test container after inheritance operations
                containerWithInheritance.set("child.key", "child_value");
                Assert.ok(isAttributeContainer(containerWithInheritance), "Should identify container after inheritance operations");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Does not access lazy properties",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create a mock object that has all the required methods and properties
                // but will throw if the lazy properties are accessed
                const mockContainer = {
                    id: "mock-container-id", // Add required id property
                    clear: () => {},
                    get: () => undefined,
                    has: () => false,
                    set: () => true,
                    del: () => false,
                    keys: () => {
                        return {
                            next: () => ({ done: true, value: undefined })
                        } as Iterator<string>;
                    },
                    entries: () => {
                        return {
                            next: () => ({ done: true, value: undefined })
                        } as Iterator<[string, any, any]>;
                    },
                    forEach: () => {},
                    values: () => {
                        return {
                            next: () => ({ done: true, value: undefined })
                        } as Iterator<any>;
                    },
                    child: () => ({}), // Add missing child method
                    listen: () => ({ rm: () => {} })
                };
                
                // Add properties that will throw if accessed via getter
                let sizeAccessed = false;
                let droppedAttributesAccessed = false;
                let attributesAccessed = false;
                
                Object.defineProperty(mockContainer, "size", {
                    get: () => {
                        sizeAccessed = true;
                        throw new Error("size property should not be accessed in isAttributeContainer");
                    },
                    enumerable: false,
                    configurable: true
                });
                
                Object.defineProperty(mockContainer, "droppedAttributes", {
                    get: () => {
                        droppedAttributesAccessed = true;
                        throw new Error("droppedAttributes property should not be accessed in isAttributeContainer");
                    },
                    enumerable: false,
                    configurable: true
                });
                
                Object.defineProperty(mockContainer, "attributes", {
                    get: () => {
                        attributesAccessed = true;
                        throw new Error("attributes property should not be accessed in isAttributeContainer");
                    },
                    enumerable: false,
                    configurable: true
                });
                
                // Test that isAttributeContainer does not access the lazy properties
                let result: boolean;
                let errorThrown = false;
                try {
                    result = isAttributeContainer(mockContainer);
                } catch (error) {
                    errorThrown = true;
                    // If an error was thrown, it means a lazy property was accessed
                }
                
                // Verify no error was thrown (meaning no lazy properties were accessed)
                Assert.ok(!errorThrown, "isAttributeContainer should not access lazy properties");
                
                // Verify the function works correctly
                Assert.ok(result!, "Should correctly identify as attribute container");
                
                // Verify that none of the lazy properties were accessed
                Assert.ok(!sizeAccessed, "size property should not be accessed during isAttributeContainer check");
                Assert.ok(!droppedAttributesAccessed, "droppedAttributes property should not be accessed during isAttributeContainer check");
                Assert.ok(!attributesAccessed, "attributes property should not be accessed during isAttributeContainer check");
            }
        });

        this.testCase({
            name: "isAttributeContainer: Lazy properties behavior verification",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create a real container
                const container = createAttributeContainer(otelCfg, "test-container");
                container.set("test.key", "test_value");
                
                // Test that the lazy properties exist (using 'in' operator which doesn't trigger getters)
                Assert.ok("size" in container, "Container should have size property");
                Assert.ok("droppedAttributes" in container, "Container should have droppedAttributes property");
                Assert.ok("attributes" in container, "Container should have attributes property");
                
                // Verify isAttributeContainer works with real container
                Assert.ok(isAttributeContainer(container), "Should identify real container correctly");
                
                // Now verify the properties actually work when accessed
                Assert.equal(1, container.size, "Size should be 1");
                Assert.equal(0, container.droppedAttributes, "DroppedAttributes should be 0");
                Assert.equal(1, Object.keys(container.attributes).length, "Attributes should have 1 key");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container-to-container inheritance - basic functionality",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container with some attributes
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", "parent_value2");
                parentContainer.set("shared.key", "parent_shared");
                
                // Create child container with parent container as inheritance source
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                // Test inherited attributes are accessible from parent container
                Assert.equal("parent_value1", childContainer.get("parent.key1"), "Should get inherited attribute from parent container");
                Assert.equal("parent_value2", childContainer.get("parent.key2"), "Should get second inherited attribute from parent container");
                Assert.equal("parent_shared", childContainer.get("shared.key"), "Should get shared inherited attribute from parent container");
                Assert.ok(childContainer.has("parent.key1"), "Should report inherited attribute from parent container as existing");
                Assert.equal(3, childContainer.size, "Should count inherited attributes from parent container in size");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container-to-container inheritance - override behavior",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("shared.key", "parent_shared");
                parentContainer.set("override.me", "parent_override");
                
                // Create child container with parent container as inheritance source
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                // Test initial inherited state
                Assert.equal(3, childContainer.size, "Should start with 3 inherited attributes from parent container");
                Assert.equal("parent_shared", childContainer.get("shared.key"), "Should get inherited value from parent container initially");
                
                // Test overriding inherited attribute from parent container
                Assert.ok(childContainer.set("shared.key", "child_shared"), "Should successfully override inherited attribute from parent container");
                Assert.equal("child_shared", childContainer.get("shared.key"), "Should get overridden value instead of parent container value");
                Assert.equal(3, childContainer.size, "Size should remain 3 after override of parent container attribute");
                
                // Test adding new attribute alongside inherited ones from parent container
                Assert.ok(childContainer.set("child.key", "child_value"), "Should add new attribute to child container");
                Assert.equal("child_value", childContainer.get("child.key"), "Should get new child attribute value");
                Assert.equal("parent_value1", childContainer.get("parent.key1"), "Should still get inherited attribute from parent container");
                Assert.equal(4, childContainer.size, "Size should be 4 after adding new attribute to child container");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container-to-container inheritance - iterator methods",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", "parent_value2");
                parentContainer.set("shared.key", "parent_shared");
                
                // Create child container with parent container as inheritance source
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                // Add some child attributes
                childContainer.set("child.key", "child_value");
                childContainer.set("shared.key", "child_shared"); // Override inherited from parent container
                
                // Test keys iterator includes both inherited from parent container and child keys
                const keys: string[] = [];
                const keysIter = childContainer.keys();
                let keysResult = keysIter.next();
                while (!keysResult.done) {
                    keys.push(keysResult.value);
                    keysResult = keysIter.next();
                }
                Assert.equal(4, keys.length, "Should have 4 total keys (2 child + 2 non-overridden from parent container)");
                Assert.ok(keys.includes("child.key"), "Should include child key");
                Assert.ok(keys.includes("shared.key"), "Should include overridden key");
                Assert.ok(keys.includes("parent.key1"), "Should include inherited key1 from parent container");
                Assert.ok(keys.includes("parent.key2"), "Should include inherited key2 from parent container");
                
                // Test entries iterator with parent container inheritance
                const entries: [string, any, eAttributeFilter][] = [];
                const entriesIter = childContainer.entries();
                let entriesResult = entriesIter.next();
                while (!entriesResult.done) {
                    entries.push(entriesResult.value);
                    entriesResult = entriesIter.next();
                }
                Assert.equal(4, entries.length, "Should have 4 total entries including parent container attributes");
                
                // Convert to map by extracting key-value pairs (ignoring source)
                const entryMap = new Map(entries.map(entry => [entry[0], entry[1]]));
                Assert.equal("child_value", entryMap.get("child.key"), "Should have child entry");
                Assert.equal("child_shared", entryMap.get("shared.key"), "Should have overridden value in entries");
                Assert.equal("parent_value1", entryMap.get("parent.key1"), "Should have inherited entry from parent container");
                
                // Test forEach with parent container inheritance
                const forEachResults: { [key: string]: any } = {};
                childContainer.forEach((key, value) => {
                    forEachResults[key] = value;
                });
                Assert.equal(4, objKeys(forEachResults).length, "forEach should iterate over all items including parent container attributes");
                Assert.equal("child_shared", forEachResults["shared.key"], "forEach should use overridden value");
                Assert.equal("parent_value1", forEachResults["parent.key1"], "forEach should include inherited value from parent container");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container-to-container inheritance - attributes includes parent container",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", 42);
                parentContainer.set("shared.key", "parent_shared");
                
                // Create child container with parent container as inheritance source
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                childContainer.set("child.key", "child_value");
                childContainer.set("shared.key", "child_shared"); // Override parent container value
                
                const attributes = childContainer.attributes;
                Assert.equal("parent_value1", attributes["parent.key1"], "Should include inherited string from parent container");
                Assert.equal(42, attributes["parent.key2"], "Should include inherited number from parent container");
                Assert.equal("child_value", attributes["child.key"], "Should include child attribute");
                Assert.equal("child_shared", attributes["shared.key"], "Should use overridden value instead of parent container value");
                Assert.equal(4, objKeys(attributes).length, "Should have correct total count including parent container attributes");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container-to-container inheritance - clear behavior",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", "parent_value2");
                
                // Create child container with parent container as inheritance source
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                // Verify inherited attributes from parent container are present
                Assert.equal(2, childContainer.size, "Should start with 2 inherited attributes from parent container");
                Assert.equal("parent_value1", childContainer.get("parent.key1"), "Should access inherited attribute from parent container");
                
                // Add child attribute
                childContainer.set("child.key", "child_value");
                Assert.equal(3, childContainer.size, "Should have 3 total attributes");
                
                // Clear should remove everything including inherited from parent container
                childContainer.clear();
                Assert.equal(0, childContainer.size, "Should have 0 attributes after clear");
                Assert.ok(!childContainer.has("parent.key1"), "Should not have inherited attribute from parent container after clear");
                Assert.ok(!childContainer.has("child.key"), "Should not have child attribute after clear");
                Assert.equal(undefined, childContainer.get("parent.key1"), "Should return undefined for inherited attribute from parent container after clear");
                
                // Verify parent container is unaffected by child clear
                Assert.equal(2, parentContainer.size, "Parent container should still have its attributes after child clear");
                Assert.equal("parent_value1", parentContainer.get("parent.key1"), "Parent container should still have its values after child clear");
            }
        });

        this.testCase({
            name: "AttributeContainer: Multi-level container inheritance - container with IOTelAttributes parent",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create grandparent attributes (IOTelAttributes)
                const grandparentAttribs: IOTelAttributes = {
                    "grandparent.key1": "grandparent_value1",
                    "grandparent.key2": "grandparent_value2",
                    "shared.all": "grandparent_shared"
                };
                
                // Create parent container with grandparent attributes as inheritance
                const parentContainer = createAttributeContainer(otelCfg, "test-grandparent", grandparentAttribs);
                parentContainer.set("parent.key", "parent_value");
                parentContainer.set("shared.all", "parent_shared"); // Override grandparent
                
                // Create child container with parent container as inheritance source
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                childContainer.set("child.key", "child_value");
                childContainer.set("shared.all", "child_shared"); // Override parent (and grandparent)
                
                // Test access to all levels
                Assert.equal("grandparent_value1", childContainer.get("grandparent.key1"), "Should access grandparent attribute through parent container");
                Assert.equal("grandparent_value2", childContainer.get("grandparent.key2"), "Should access second grandparent attribute through parent container");
                Assert.equal("parent_value", childContainer.get("parent.key"), "Should access parent attribute");
                Assert.equal("child_value", childContainer.get("child.key"), "Should access child attribute");
                Assert.equal("child_shared", childContainer.get("shared.all"), "Should get child override value");
                
                // Test size includes all levels
                Assert.equal(5, childContainer.size, "Should count attributes from all levels (2 grandparent + 1 parent + 1 child + 1 override)");
                
                // Test iterator includes all levels
                const allKeys: string[] = [];
                childContainer.forEach((key, value) => {
                    allKeys.push(key);
                });
                Assert.equal(5, allKeys.length, "forEach should iterate over all levels");
                Assert.ok(allKeys.includes("grandparent.key1"), "Should include grandparent key1");
                Assert.ok(allKeys.includes("grandparent.key2"), "Should include grandparent key2");
                Assert.ok(allKeys.includes("parent.key"), "Should include parent key");
                Assert.ok(allKeys.includes("child.key"), "Should include child key");
                Assert.ok(allKeys.includes("shared.all"), "Should include overridden key");
            }
        });

        this.testCase({
            name: "AttributeContainer: Multi-level container inheritance - container with container parent",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create great-grandparent container
                const greatGrandparentContainer = createAttributeContainer(otelCfg, "test-container");
                greatGrandparentContainer.set("great.key", "great_value");
                greatGrandparentContainer.set("shared.multi", "great_shared");
                
                // Create grandparent container inheriting from great-grandparent
                const grandparentContainer = createAttributeContainer(otelCfg, "test-grandparent", greatGrandparentContainer);
                grandparentContainer.set("grandparent.key", "grandparent_value");
                grandparentContainer.set("shared.multi", "grandparent_shared"); // Override great-grandparent
                
                // Create parent container inheriting from grandparent
                const parentContainer = createAttributeContainer(otelCfg, "test-parent", grandparentContainer);
                parentContainer.set("parent.key", "parent_value");
                parentContainer.set("shared.multi", "parent_shared"); // Override grandparent
                
                // Create child container inheriting from parent
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                childContainer.set("child.key", "child_value");
                
                // Test access through the inheritance chain
                Assert.equal("great_value", childContainer.get("great.key"), "Should access great-grandparent through inheritance chain");
                Assert.equal("grandparent_value", childContainer.get("grandparent.key"), "Should access grandparent through inheritance chain");
                Assert.equal("parent_value", childContainer.get("parent.key"), "Should access parent through inheritance chain");
                Assert.equal("child_value", childContainer.get("child.key"), "Should access child attribute");
                Assert.equal("parent_shared", childContainer.get("shared.multi"), "Should get most recent override in chain");
                
                // Test size counts inheritance chain correctly
                Assert.equal(5, childContainer.size, "Should count all unique attributes in inheritance chain");
                
                // Test that modifications to ancestor containers are reflected
                greatGrandparentContainer.set("new.great.key", "new_great_value");
                Assert.equal("new_great_value", childContainer.get("new.great.key"), "Should access newly added great-grandparent attribute");
                Assert.equal(6, childContainer.size, "Size should increase after ancestor modification");
            }
        });

        this.testCase({
            name: "AttributeContainer: Mixed inheritance types - IOTelAttributes and container combinations",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Test 1: IOTelAttributes -> Container -> Container
                const baseAttribs: IOTelAttributes = {
                    "base.key1": "base_value1",
                    "base.key2": "base_value2",
                    "shared.mixed": "base_shared"
                };
                
                const intermediateContainer = createAttributeContainer(otelCfg, "test-base", baseAttribs);
                intermediateContainer.set("intermediate.key", "intermediate_value");
                intermediateContainer.set("shared.mixed", "intermediate_shared");
                
                const finalContainer = createAttributeContainer(otelCfg, "test-final", intermediateContainer);
                finalContainer.set("final.key", "final_value");
                
                Assert.equal("base_value1", finalContainer.get("base.key1"), "Should access base IOTelAttributes through container");
                Assert.equal("base_value2", finalContainer.get("base.key2"), "Should access second base attribute through container");
                Assert.equal("intermediate_value", finalContainer.get("intermediate.key"), "Should access intermediate container attribute");
                Assert.equal("final_value", finalContainer.get("final.key"), "Should access final container attribute");
                Assert.equal("intermediate_shared", finalContainer.get("shared.mixed"), "Should get intermediate override of base");
                Assert.equal(5, finalContainer.size, "Should count all attributes through mixed inheritance");
                
                // Test 2: Container -> IOTelAttributes (should not work - IOTelAttributes can't inherit from container)
                // This tests that addAttributes works with containers
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                sourceContainer.set("source.key1", "source_value1");
                sourceContainer.set("source.key2", "source_value2");
                
                const targetContainer = createAttributeContainer(otelCfg, "test-container");
                addAttributes(targetContainer, sourceContainer);
                
                Assert.equal("source_value1", targetContainer.get("source.key1"), "Should copy container attributes via addAttributes");
                Assert.equal("source_value2", targetContainer.get("source.key2"), "Should copy second container attribute via addAttributes");
                Assert.equal(2, targetContainer.size, "Should have correct size after adding container attributes");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container inheritance edge cases",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Test empty parent container
                const emptyParentContainer = createAttributeContainer(otelCfg, "test-container");
                const childOfEmpty = createAttributeContainer(otelCfg, "test-child-empty", emptyParentContainer);
                
                Assert.equal(0, childOfEmpty.size, "Should have 0 size with empty parent container");
                childOfEmpty.set("child.key", "child_value");
                Assert.equal(1, childOfEmpty.size, "Should have 1 size after adding to child with empty parent container");
                Assert.equal("child_value", childOfEmpty.get("child.key"), "Should get child attribute with empty parent container");
                
                // Test parent container that gets modified after child creation
                const dynamicParent = createAttributeContainer(otelCfg, "test-container");
                const dynamicChild = createAttributeContainer(otelCfg, "test-dynamic-child", dynamicParent);
                
                Assert.equal(0, dynamicChild.size, "Should start with 0 size");
                
                // Modify parent after child creation
                dynamicParent.set("dynamic.key", "dynamic_value");
                Assert.equal("dynamic_value", dynamicChild.get("dynamic.key"), "Should access dynamically added parent attribute");
                Assert.equal(1, dynamicChild.size, "Should reflect parent modifications in size");
                
                // Test parent container that gets cleared after child creation
                dynamicParent.clear();
                Assert.equal(undefined, dynamicChild.get("dynamic.key"), "Should not access cleared parent attributes");
                Assert.equal(0, dynamicChild.size, "Should reflect parent clear in size");
                
                // Test circular reference prevention (child shouldn't be able to inherit from itself)
                const selfContainer = createAttributeContainer(otelCfg, "test-container");
                selfContainer.set("self.key", "self_value");
                // Note: This doesn't create actual circular reference as the inheritance is captured at creation time
                const pseudoCircular = createAttributeContainer(otelCfg, "test-pseudo-circular", selfContainer);
                pseudoCircular.set("pseudo.key", "pseudo_value");
                
                Assert.equal("self_value", pseudoCircular.get("self.key"), "Should access parent attribute");
                Assert.equal("pseudo_value", pseudoCircular.get("pseudo.key"), "Should access own attribute");
                Assert.equal(2, pseudoCircular.size, "Should have correct size with pseudo-circular setup");
            }
        });

        this.testCase({
            name: "AttributeContainer: Container inheritance with addAttributes function",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create source container with inheritance
                const baseAttribs: IOTelAttributes = {
                    "base.key": "base_value"
                };
                const sourceContainer = createAttributeContainer(otelCfg, "test-base", baseAttribs);
                sourceContainer.set("source.key1", "source_value1");
                sourceContainer.set("source.key2", "source_value2");
                
                // Create target container
                const targetContainer = createAttributeContainer(otelCfg, "test-container");
                targetContainer.set("target.existing", "existing_value");
                
                // Use addAttributes to copy from source container (which has inheritance)
                addAttributes(targetContainer, sourceContainer);
                
                // Verify all attributes from source container (including inherited) are copied
                Assert.equal("base_value", targetContainer.get("base.key"), "Should copy inherited attribute from source container");
                Assert.equal("source_value1", targetContainer.get("source.key1"), "Should copy source container attribute 1");
                Assert.equal("source_value2", targetContainer.get("source.key2"), "Should copy source container attribute 2");
                Assert.equal("existing_value", targetContainer.get("target.existing"), "Should preserve existing target attributes");
                Assert.equal(4, targetContainer.size, "Should have correct size after adding container with inheritance");
                
                // Test addAttributes with container that has container inheritance
                const grandparentContainer = createAttributeContainer(otelCfg, "test-container");
                grandparentContainer.set("grandparent.key", "grandparent_value");
                
                const parentContainer = createAttributeContainer(otelCfg, "test-parent", grandparentContainer);
                parentContainer.set("parent.key", "parent_value");
                
                const newTargetContainer = createAttributeContainer(otelCfg, "test-container");
                addAttributes(newTargetContainer, parentContainer);
                
                Assert.equal("grandparent_value", newTargetContainer.get("grandparent.key"), "Should copy multi-level inherited attribute");
                Assert.equal("parent_value", newTargetContainer.get("parent.key"), "Should copy parent container attribute");
                Assert.equal(2, newTargetContainer.size, "Should have correct size after adding multi-level container");
            }
        });

        // ===== createSnapshotAttributes Tests =====

        this.testCase({
            name: "createSnapshotAttributes: Invalid arguments - null and undefined",
            test: () => {
                const otelCfg: IOTelConfig = {};

                // Test null source
                const nullResult = createAttributeSnapshot(otelCfg, "null-test", null as any);
                Assert.ok(isAttributeContainer(nullResult), "Should return container for null source");
                Assert.equal(0, nullResult.size, "Should return empty container for null source");

                // Test undefined source
                const undefinedResult = createAttributeSnapshot(otelCfg, "undefined-test", undefined as any);
                Assert.ok(isAttributeContainer(undefinedResult), "Should return container for undefined source");
                Assert.equal(0, undefinedResult.size, "Should return empty container for undefined source");

                // Verify containers are functional
                Assert.ok(nullResult.set("test.key", "test_value"), "Null result container should be functional");
                Assert.equal("test_value", nullResult.get("test.key"), "Null result container should store values");
                
                Assert.ok(undefinedResult.set("test.key", "test_value"), "Undefined result container should be functional");
                Assert.equal("test_value", undefinedResult.get("test.key"), "Undefined result container should store values");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Invalid arguments - primitive types",
            test: () => {
                const otelCfg: IOTelConfig = {};

                // Test with primitive types (should create empty containers)
                const stringResult = createAttributeSnapshot(otelCfg, "string-test", "string" as any);
                Assert.ok(isAttributeContainer(stringResult), "Should return container for string");
                Assert.equal(0, stringResult.size, "Should return empty container for string");

                const numberResult = createAttributeSnapshot(otelCfg, "number-test", 123 as any);
                Assert.ok(isAttributeContainer(numberResult), "Should return container for number");
                Assert.equal(0, numberResult.size, "Should return empty container for number");

                const booleanResult = createAttributeSnapshot(otelCfg, "boolean-test", true as any);
                Assert.ok(isAttributeContainer(booleanResult), "Should return container for boolean");
                Assert.equal(0, booleanResult.size, "Should return empty container for boolean");

                // Verify containers are functional
                Assert.ok(stringResult.set("test.key", "test_value"), "String result container should be functional");
                Assert.ok(numberResult.set("test.key", "test_value"), "Number result container should be functional");
                Assert.ok(booleanResult.set("test.key", "test_value"), "Boolean result container should be functional");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IOTelAttributes - immediate deep copy",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceAttribs: IOTelAttributes = {
                    "service.name": "test-service",
                    "service.version": "1.0.0",
                    "deployment.environment": "production",
                    "request.id": "req-123",
                    "user.authenticated": true,
                    "request.size": 1024
                };

                const snapshotContainer = createAttributeSnapshot(otelCfg, "iotel-snapshot", sourceAttribs);

                // Verify all attributes are copied
                Assert.ok(isAttributeContainer(snapshotContainer), "Should return attribute container");
                Assert.equal(6, snapshotContainer.size, "Should have all source attributes");
                Assert.equal("test-service", snapshotContainer.get("service.name"), "Should copy string attribute");
                Assert.equal("1.0.0", snapshotContainer.get("service.version"), "Should copy version string");
                Assert.equal("production", snapshotContainer.get("deployment.environment"), "Should copy environment");
                Assert.equal("req-123", snapshotContainer.get("request.id"), "Should copy request ID");
                Assert.equal(true, snapshotContainer.get("user.authenticated"), "Should copy boolean attribute");
                Assert.equal(1024, snapshotContainer.get("request.size"), "Should copy number attribute");

                // Verify immutability - changes to source don't affect copy
                sourceAttribs["service.name"] = "modified-service";
                sourceAttribs["new.key"] = "new_value";
                delete sourceAttribs["request.id"];

                Assert.equal("test-service", snapshotContainer.get("service.name"), "Should remain unchanged after source modification");
                Assert.equal(undefined, snapshotContainer.get("new.key"), "Should not have new key added to source");
                Assert.equal("req-123", snapshotContainer.get("request.id"), "Should still have deleted key");
                Assert.equal(6, snapshotContainer.size, "Size should remain unchanged after source modifications");

                // Verify the snapshot container can be modified independently
                Assert.ok(snapshotContainer.set("snapshot.key", "snapshot_value"), "Should be able to add to snapshot container");
                Assert.equal("snapshot_value", snapshotContainer.get("snapshot.key"), "Should get newly added attribute");
                Assert.equal(7, snapshotContainer.size, "Size should increase after adding to snapshot container");
                Assert.equal(undefined, sourceAttribs["snapshot.key"], "Source should not have snapshot container additions");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IOTelAttributes - empty and single attribute",
            test: () => {
                const otelCfg: IOTelConfig = {};

                // Test empty attributes
                const emptyAttribs: IOTelAttributes = {};
                const emptySnapshot = createAttributeSnapshot(otelCfg, "empty-snapshot", emptyAttribs);
                Assert.equal(0, emptySnapshot.size, "Should create empty container for empty attributes");
                
                // Verify independence
                emptyAttribs["added.later"] = "added_value";
                Assert.equal(0, emptySnapshot.size, "Empty snapshot should remain empty after source modification");
                Assert.equal(undefined, emptySnapshot.get("added.later"), "Empty snapshot should not have added attributes");

                // Test single attribute
                const singleAttrib: IOTelAttributes = { "single.key": "single_value" };
                const singleSnapshot = createAttributeSnapshot(otelCfg, "single-snapshot", singleAttrib);
                Assert.equal(1, singleSnapshot.size, "Should have single attribute");
                Assert.equal("single_value", singleSnapshot.get("single.key"), "Should get single attribute value");

                // Verify independence
                singleAttrib["single.key"] = "modified_value";
                singleAttrib["second.key"] = "second_value";
                Assert.equal("single_value", singleSnapshot.get("single.key"), "Single snapshot should retain original value");
                Assert.equal(undefined, singleSnapshot.get("second.key"), "Single snapshot should not have added attributes");
                Assert.equal(1, singleSnapshot.size, "Single snapshot size should remain 1");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IOTelAttributes - complex hierarchical keys",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const complexAttribs: IOTelAttributes = {
                    "http.request.method": "GET",
                    "http.request.url": "https://api.example.com/users",
                    "http.request.headers.user-agent": "Test-Agent/1.0",
                    "http.request.headers.authorization": "Bearer token123",
                    "http.response.status_code": 200,
                    "http.response.headers.content-type": "application/json",
                    "span.attributes.custom.nested.deep.value": "deep_nested",
                    "user.session.id": "session-456",
                    "user.session.start_time": "2023-01-01T00:00:00Z"
                };

                const snapshotContainer = createAttributeSnapshot(otelCfg, "complex-snapshot", complexAttribs);

                // Verify all hierarchical attributes are copied correctly
                Assert.equal(9, snapshotContainer.size, "Should have all complex attributes");
                Assert.equal("GET", snapshotContainer.get("http.request.method"), "Should copy HTTP method");
                Assert.equal("https://api.example.com/users", snapshotContainer.get("http.request.url"), "Should copy HTTP URL");
                Assert.equal("Test-Agent/1.0", snapshotContainer.get("http.request.headers.user-agent"), "Should copy deeply nested header");
                Assert.equal("Bearer token123", snapshotContainer.get("http.request.headers.authorization"), "Should copy auth header");
                Assert.equal(200, snapshotContainer.get("http.response.status_code"), "Should copy status code");
                Assert.equal("application/json", snapshotContainer.get("http.response.headers.content-type"), "Should copy content type");
                Assert.equal("deep_nested", snapshotContainer.get("span.attributes.custom.nested.deep.value"), "Should copy very deep nested value");
                Assert.equal("session-456", snapshotContainer.get("user.session.id"), "Should copy session ID");
                Assert.equal("2023-01-01T00:00:00Z", snapshotContainer.get("user.session.start_time"), "Should copy session start time");

                // Test immutability with complex modifications
                complexAttribs["http.request.method"] = "POST";
                complexAttribs["http.request.headers.new-header"] = "new_value";
                delete complexAttribs["user.session.start_time"];

                Assert.equal("GET", snapshotContainer.get("http.request.method"), "Should retain original HTTP method");
                Assert.equal(undefined, snapshotContainer.get("http.request.headers.new-header"), "Should not have new header");
                Assert.equal("2023-01-01T00:00:00Z", snapshotContainer.get("user.session.start_time"), "Should retain deleted attribute");
                Assert.equal(9, snapshotContainer.size, "Complex snapshot size should remain unchanged");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - basic copy-on-change",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up initial state
                sourceContainer.set("initial.key1", "initial_value1");
                sourceContainer.set("initial.key2", "initial_value2");
                sourceContainer.set("shared.key", "original_shared");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "basic-container-snapshot", sourceContainer);

                // Verify initial state is copied
                Assert.ok(isAttributeContainer(snapshotContainer), "Should return attribute container");
                Assert.equal(3, snapshotContainer.size, "Should have all initial attributes");
                Assert.equal("initial_value1", snapshotContainer.get("initial.key1"), "Should have initial key1");
                Assert.equal("initial_value2", snapshotContainer.get("initial.key2"), "Should have initial key2");
                Assert.equal("original_shared", snapshotContainer.get("shared.key"), "Should have shared key");

                // Modify source container after snapshot creation
                sourceContainer.set("shared.key", "modified_shared");
                sourceContainer.set("new.key", "new_value");

                // Verify snapshot container shows pre-change values (lazy copy-on-change)
                Assert.equal("original_shared", snapshotContainer.get("shared.key"), "Should retain original shared value due to lazy copy-on-change");
                Assert.equal(undefined, snapshotContainer.get("new.key"), "Should not have new key added to source");
                Assert.equal(3, snapshotContainer.size, "Size should remain unchanged after source modifications");

                // Verify snapshot container can be modified independently
                Assert.ok(snapshotContainer.set("snapshot.only", "snapshot_value"), "Should be able to modify snapshot container");
                Assert.equal("snapshot_value", snapshotContainer.get("snapshot.only"), "Should get snapshot-only value");
                Assert.equal(4, snapshotContainer.size, "Snapshot size should increase");
                Assert.equal(undefined, sourceContainer.get("snapshot.only"), "Source should not have snapshot additions");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - with inheritance",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create source container with inheritance
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2",
                    "shared.inherited": "parent_shared"
                };
                const sourceContainer = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                sourceContainer.set("source.key", "source_value");
                sourceContainer.set("shared.inherited", "source_override");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "inheritance-snapshot", sourceContainer);

                // Verify all attributes including inherited are captured
                Assert.equal(4, snapshotContainer.size, "Should capture all attributes including inherited");
                Assert.equal("parent_value1", snapshotContainer.get("parent.key1"), "Should capture inherited key1");
                Assert.equal("parent_value2", snapshotContainer.get("parent.key2"), "Should capture inherited key2");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should capture source key");
                Assert.equal("source_override", snapshotContainer.get("shared.inherited"), "Should capture overridden value");

                // Modify source container (both own and inherited attributes)
                sourceContainer.set("parent.key1", "modified_parent1");
                sourceContainer.set("source.key", "modified_source");
                sourceContainer.set("new.source.key", "new_source_value");

                // Verify snapshot container retains original state
                Assert.equal("parent_value1", snapshotContainer.get("parent.key1"), "Should retain original inherited value");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should retain original source value");
                Assert.equal("source_override", snapshotContainer.get("shared.inherited"), "Should retain original override");
                Assert.equal(undefined, snapshotContainer.get("new.source.key"), "Should not have new source attributes");
                Assert.equal(4, snapshotContainer.size, "Size should remain unchanged");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - complex inheritance chain",
            test: () => {
                const otelCfg: IOTelConfig = {};

                // Create a complex inheritance chain
                const grandparentAttribs: IOTelAttributes = {
                    "grandparent.key1": "grandparent_value1",
                    "grandparent.key2": "grandparent_value2",
                    "shared.multi": "grandparent_shared"
                };

                const parentContainer = createAttributeContainer(otelCfg, "test-grandparent", grandparentAttribs);
                parentContainer.set("parent.key", "parent_value");
                parentContainer.set("shared.multi", "parent_override");

                const sourceContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                sourceContainer.set("source.key", "source_value");
                sourceContainer.set("shared.multi", "source_override");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "complex-inheritance-snapshot", sourceContainer);

                // Verify full inheritance chain is captured
                Assert.equal(5, snapshotContainer.size, "Should capture entire inheritance chain");
                Assert.equal("grandparent_value1", snapshotContainer.get("grandparent.key1"), "Should capture grandparent key1");
                Assert.equal("grandparent_value2", snapshotContainer.get("grandparent.key2"), "Should capture grandparent key2");
                Assert.equal("parent_value", snapshotContainer.get("parent.key"), "Should capture parent key");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should capture source key");
                Assert.equal("source_override", snapshotContainer.get("shared.multi"), "Should capture final override");

                // Modify multiple levels of the inheritance chain
                parentContainer.set("parent.key", "modified_parent");
                parentContainer.set("new.parent.key", "new_parent_value");
                sourceContainer.set("source.key", "modified_source");
                sourceContainer.set("grandparent.key1", "modified_grandparent"); // Override inherited
                sourceContainer.set("new.source.key", "new_source_value");

                // Verify snapshot container retains original state from all levels
                Assert.equal("grandparent_value1", snapshotContainer.get("grandparent.key1"), "Should retain original grandparent value");
                Assert.equal("parent_value", snapshotContainer.get("parent.key"), "Should retain original parent value");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should retain original source value");
                Assert.equal(undefined, snapshotContainer.get("new.parent.key"), "Should not have new parent attributes");
                Assert.equal(undefined, snapshotContainer.get("new.source.key"), "Should not have new source attributes");
                Assert.equal(5, snapshotContainer.size, "Size should remain unchanged after complex modifications");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - empty container",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const emptyContainer = createAttributeContainer(otelCfg, "test-container");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "empty-container-snapshot", emptyContainer);

                // Verify empty state
                Assert.equal(0, snapshotContainer.size, "Should create empty snapshot container");
                Assert.equal(undefined, snapshotContainer.get("any.key"), "Should not have any attributes");

                // Modify source after snapshot creation
                emptyContainer.set("added.later", "added_value");
                emptyContainer.set("another.key", "another_value");

                // Verify snapshot remains empty
                Assert.equal(0, snapshotContainer.size, "Snapshot should remain empty");
                Assert.equal(undefined, snapshotContainer.get("added.later"), "Should not have later additions");
                Assert.equal(undefined, snapshotContainer.get("another.key"), "Should not have later additions");

                // Verify snapshot can be modified independently
                Assert.ok(snapshotContainer.set("snapshot.key", "snapshot_value"), "Should be able to modify empty snapshot");
                Assert.equal("snapshot_value", snapshotContainer.get("snapshot.key"), "Should get snapshot value");
                Assert.equal(1, snapshotContainer.size, "Snapshot size should increase");
                Assert.equal(undefined, emptyContainer.get("snapshot.key"), "Source should not have snapshot additions");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - source container clear operation",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up initial state
                sourceContainer.set("key1", "value1");
                sourceContainer.set("key2", "value2");
                sourceContainer.set("key3", "value3");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify initial state
                Assert.equal(3, snapshotContainer.size, "Should have all initial attributes");
                Assert.equal("value1", snapshotContainer.get("key1"), "Should have key1");
                Assert.equal("value2", snapshotContainer.get("key2"), "Should have key2");
                Assert.equal("value3", snapshotContainer.get("key3"), "Should have key3");

                // Clear source container
                sourceContainer.clear();

                // Verify snapshot container preserves pre-clear state
                Assert.equal(3, snapshotContainer.size, "Should retain all attributes after source clear");
                Assert.equal("value1", snapshotContainer.get("key1"), "Should retain key1 after source clear");
                Assert.equal("value2", snapshotContainer.get("key2"), "Should retain key2 after source clear");
                Assert.equal("value3", snapshotContainer.get("key3"), "Should retain key3 after source clear");

                // Add new attributes to cleared source
                sourceContainer.set("new.key", "new_value");
                sourceContainer.set("key1", "new_value1"); // Same key, different value

                // Verify snapshot container is unaffected by post-clear additions
                Assert.equal(3, snapshotContainer.size, "Size should remain unchanged after post-clear additions");
                Assert.equal("value1", snapshotContainer.get("key1"), "Should retain original key1 value");
                Assert.equal(undefined, snapshotContainer.get("new.key"), "Should not have post-clear additions");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - with inherited container that changes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container that will be modified
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", "parent_value2");

                // Create source container with parent inheritance
                const sourceContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                sourceContainer.set("source.key", "source_value");
                sourceContainer.set("parent.key1", "source_override"); // Override parent

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify initial state includes inheritance
                Assert.equal(3, snapshotContainer.size, "Should have all attributes including inherited");
                Assert.equal("source_override", snapshotContainer.get("parent.key1"), "Should have source override");
                Assert.equal("parent_value2", snapshotContainer.get("parent.key2"), "Should have inherited parent key2");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should have source key");

                // Modify parent container after snapshot creation
                parentContainer.set("parent.key1", "modified_parent1");
                parentContainer.set("parent.key2", "modified_parent2");
                parentContainer.set("new.parent.key", "new_parent_value");

                // Modify source container
                sourceContainer.set("source.key", "modified_source");
                sourceContainer.set("new.source.key", "new_source_value");

                // Verify snapshot container retains original state despite parent and source changes
                Assert.equal("source_override", snapshotContainer.get("parent.key1"), "Should retain original override");
                Assert.equal("parent_value2", snapshotContainer.get("parent.key2"), "Should retain original inherited value");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should retain original source value");
                Assert.equal(undefined, snapshotContainer.get("new.parent.key"), "Should not have new parent attributes");
                Assert.equal(undefined, snapshotContainer.get("new.source.key"), "Should not have new source attributes");
                Assert.equal(3, snapshotContainer.size, "Size should remain unchanged");

                // Clear parent container
                parentContainer.clear();

                // Verify snapshot container still retains original state
                Assert.equal("source_override", snapshotContainer.get("parent.key1"), "Should retain override after parent clear");
                Assert.equal("parent_value2", snapshotContainer.get("parent.key2"), "Should retain inherited value after parent clear");
                Assert.equal("source_value", snapshotContainer.get("source.key"), "Should retain source value after parent clear");
                Assert.equal(3, snapshotContainer.size, "Size should remain unchanged after parent clear");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - multiple snapshot copies",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up initial state
                sourceContainer.set("shared.key", "initial_value");
                sourceContainer.set("common.attr", "common_value");

                // Create first snapshot copy
                const snapshot1 = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Modify source
                sourceContainer.set("shared.key", "modified_value");
                sourceContainer.set("new.key", "new_value");

                // Create second snapshot copy after modification
                const snapshot2 = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify both snapshot copies are independent
                Assert.equal("initial_value", snapshot1.get("shared.key"), "First snapshot should have initial value");
                Assert.equal("modified_value", snapshot2.get("shared.key"), "Second snapshot should have modified value");
                
                Assert.equal(undefined, snapshot1.get("new.key"), "First snapshot should not have new key");
                Assert.equal("new_value", snapshot2.get("new.key"), "Second snapshot should have new key");

                Assert.equal(2, snapshot1.size, "First snapshot should have 2 attributes");
                Assert.equal(3, snapshot2.size, "Second snapshot should have 3 attributes");

                // Modify both snapshot copies independently
                snapshot1.set("snapshot1.key", "snapshot1_value");
                snapshot2.set("snapshot2.key", "snapshot2_value");

                // Verify independence
                Assert.equal("snapshot1_value", snapshot1.get("snapshot1.key"), "First snapshot should have its own addition");
                Assert.equal(undefined, snapshot2.get("snapshot1.key"), "Second snapshot should not have first's addition");
                Assert.equal(undefined, snapshot1.get("snapshot2.key"), "First snapshot should not have second's addition");
                Assert.equal("snapshot2_value", snapshot2.get("snapshot2.key"), "Second snapshot should have its own addition");

                Assert.equal(3, snapshot1.size, "First snapshot size should be 3");
                Assert.equal(4, snapshot2.size, "Second snapshot size should be 4");

                // Verify source container is unaffected by snapshot modifications
                Assert.equal(undefined, sourceContainer.get("snapshot1.key"), "Source should not have first snapshot's addition");
                Assert.equal(undefined, sourceContainer.get("snapshot2.key"), "Source should not have second snapshot's addition");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: IAttributeContainer - iterators work correctly",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up diverse attribute types
                sourceContainer.set("string.attr", "string_value");
                sourceContainer.set("number.attr", 42);
                sourceContainer.set("boolean.attr", true);
                sourceContainer.set("nested.deep.attr", "nested_value");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Test keys iterator
                const keys: string[] = [];
                const keysIter = snapshotContainer.keys();
                let keyResult = keysIter.next();
                while (!keyResult.done) {
                    keys.push(keyResult.value);
                    keyResult = keysIter.next();
                }
                Assert.equal(4, keys.length, "Should iterate over all keys");
                Assert.ok(keys.includes("string.attr"), "Should include string attribute key");
                Assert.ok(keys.includes("number.attr"), "Should include number attribute key");
                Assert.ok(keys.includes("boolean.attr"), "Should include boolean attribute key");
                Assert.ok(keys.includes("nested.deep.attr"), "Should include nested attribute key");

                // Test entries iterator
                const entries: [string, any, eAttributeFilter][] = [];
                const entriesIter = snapshotContainer.entries();
                let entryResult = entriesIter.next();
                while (!entryResult.done) {
                    entries.push(entryResult.value);
                    entryResult = entriesIter.next();
                }
                Assert.equal(4, entries.length, "Should iterate over all entries");
                
                // Convert to map by extracting key-value pairs (ignoring source)
                const entryMap = new Map(entries.map(entry => [entry[0], entry[1]]));
                Assert.equal("string_value", entryMap.get("string.attr"), "Should have correct string entry");
                Assert.equal(42, entryMap.get("number.attr"), "Should have correct number entry");
                Assert.equal(true, entryMap.get("boolean.attr"), "Should have correct boolean entry");
                Assert.equal("nested_value", entryMap.get("nested.deep.attr"), "Should have correct nested entry");

                // Test values iterator
                const values: any[] = [];
                const valuesIter = snapshotContainer.values();
                let valueResult = valuesIter.next();
                while (!valueResult.done) {
                    values.push(valueResult.value);
                    valueResult = valuesIter.next();
                }
                Assert.equal(4, values.length, "Should iterate over all values");
                Assert.ok(values.includes("string_value"), "Should include string value");
                Assert.ok(values.includes(42), "Should include number value");
                Assert.ok(values.includes(true), "Should include boolean value");
                Assert.ok(values.includes("nested_value"), "Should include nested value");

                // Test forEach
                const forEachResults: { [key: string]: any } = {};
                snapshotContainer.forEach((key, value) => {
                    forEachResults[key] = value;
                });
                Assert.equal(4, objKeys(forEachResults).length, "forEach should process all attributes");
                Assert.equal("string_value", forEachResults["string.attr"], "forEach should provide correct string value");
                Assert.equal(42, forEachResults["number.attr"], "forEach should provide correct number value");
                Assert.equal(true, forEachResults["boolean.attr"], "forEach should provide correct boolean value");
                Assert.equal("nested_value", forEachResults["nested.deep.attr"], "forEach should provide correct nested value");

                // Test attributes
                const attributes = snapshotContainer.attributes;
                Assert.equal(4, objKeys(attributes).length, "attributes should include all attributes");
                Assert.equal("string_value", attributes["string.attr"], "attributes should have correct string attribute");
                Assert.equal(42, attributes["number.attr"], "attributes should have correct number attribute");
                Assert.equal(true, attributes["boolean.attr"], "attributes should have correct boolean attribute");
                Assert.equal("nested_value", attributes["nested.deep.attr"], "attributes should have correct nested attribute");

                // Modify source and verify snapshot iterators are unaffected
                sourceContainer.set("string.attr", "modified_string");
                sourceContainer.set("new.attr", "new_value");

                const postModifyKeys: string[] = [];
                const postModifyKeysIter = snapshotContainer.keys();
                let postModifyKeyResult = postModifyKeysIter.next();
                while (!postModifyKeyResult.done) {
                    postModifyKeys.push(postModifyKeyResult.value);
                    postModifyKeyResult = postModifyKeysIter.next();
                }
                Assert.equal(4, postModifyKeys.length, "Should still have 4 keys after source modification");
                Assert.ok(!postModifyKeys.includes("new.attr"), "Should not include new source attribute");

                const postModifyAttributes = snapshotContainer.attributes;
                Assert.equal("string_value", postModifyAttributes["string.attr"], "Should retain original string value");
                Assert.equal(undefined, postModifyAttributes["new.attr"], "Should not have new source attribute");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Mixed types - IOTelAttributes vs IAttributeContainer behavior",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create equivalent data in both forms
                const sourceAttribs: IOTelAttributes = {
                    "service.name": "test-service",
                    "service.version": "1.0.0",
                    "shared.key": "shared_value"
                };

                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                sourceContainer.set("service.name", "test-service");
                sourceContainer.set("service.version", "1.0.0");
                sourceContainer.set("shared.key", "shared_value");

                // Create snapshot versions
                const snapshotFromAttribs = createAttributeSnapshot(otelCfg, "test-snapshot", sourceAttribs);
                const snapshotFromContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify both have equivalent initial state
                Assert.equal(3, snapshotFromAttribs.size, "IOTelAttributes snapshot should have 3 attributes");
                Assert.equal(3, snapshotFromContainer.size, "IAttributeContainer snapshot should have 3 attributes");
                
                Assert.equal("test-service", snapshotFromAttribs.get("service.name"), "IOTelAttributes snapshot should have service name");
                Assert.equal("test-service", snapshotFromContainer.get("service.name"), "IAttributeContainer snapshot should have service name");
                
                Assert.equal("shared_value", snapshotFromAttribs.get("shared.key"), "IOTelAttributes snapshot should have shared key");
                Assert.equal("shared_value", snapshotFromContainer.get("shared.key"), "IAttributeContainer snapshot should have shared key");

                // Modify sources differently
                sourceAttribs["service.name"] = "modified-attribs-service";
                sourceAttribs["attribs.only"] = "attribs_only_value";
                
                sourceContainer.set("service.name", "modified-container-service");
                sourceContainer.set("container.only", "container_only_value");

                // Verify different immutability behaviors
                
                // IOTelAttributes snapshot should be unaffected (immediate copy)
                Assert.equal("test-service", snapshotFromAttribs.get("service.name"), "IOTelAttributes snapshot should retain original value");
                Assert.equal(undefined, snapshotFromAttribs.get("attribs.only"), "IOTelAttributes snapshot should not have new attribs");
                Assert.equal(3, snapshotFromAttribs.size, "IOTelAttributes snapshot size should remain 3");

                // IAttributeContainer snapshot should be unaffected (copy-on-change)
                Assert.equal("test-service", snapshotFromContainer.get("service.name"), "IAttributeContainer snapshot should retain original value");
                Assert.equal(undefined, snapshotFromContainer.get("container.only"), "IAttributeContainer snapshot should not have new container attrs");
                Assert.equal(3, snapshotFromContainer.size, "IAttributeContainer snapshot size should remain 3");

                // Both snapshot containers should function identically for modifications
                snapshotFromAttribs.set("snapshot.attribs", "attribs_snapshot_value");
                snapshotFromContainer.set("snapshot.container", "container_snapshot_value");

                Assert.equal("attribs_snapshot_value", snapshotFromAttribs.get("snapshot.attribs"), "IOTelAttributes snapshot should store new value");
                Assert.equal("container_snapshot_value", snapshotFromContainer.get("snapshot.container"), "IAttributeContainer snapshot should store new value");
                
                Assert.equal(4, snapshotFromAttribs.size, "IOTelAttributes snapshot size should increase to 4");
                Assert.equal(4, snapshotFromContainer.size, "IAttributeContainer snapshot size should increase to 4");

                // Verify sources are unaffected by snapshot modifications
                Assert.equal(undefined, sourceAttribs["snapshot.attribs"], "Source attribs should not have snapshot addition");
                Assert.equal(undefined, sourceContainer.get("snapshot.container"), "Source container should not have snapshot addition");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Stress test - large attribute sets",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create large attribute set
                let largeAttribs = createAttributeContainer(otelCfg, "largeAttribs");
                for (let i = 0; i < 100; i++) {
                    largeAttribs.set(`attr.${i}.key`, `value_${i}`);
                    largeAttribs.set(`nested.level1.level2.attr${i}`, i);
                    largeAttribs.set(`boolean.attr.${i}`, i % 2 === 0);
                }

                const snapshotContainer = createAttributeSnapshot(otelCfg, "large-snapshot", largeAttribs);

                // Verify all attributes are captured
                Assert.equal(128, snapshotContainer.size, "Should have all 128 large attributes");
                Assert.equal(172, snapshotContainer.droppedAttributes, "As the size should hanve been limited the dropped count should reflect the excess attributes");
                
                // Spot check various types
                Assert.equal("value_0", snapshotContainer.get("attr.0.key"), "Should have first string attribute");
                Assert.equal("value_42", snapshotContainer.get("attr.42.key"), "Should have last string attribute");
                Assert.equal(0, snapshotContainer.get("nested.level1.level2.attr0"), "Should have first number attribute");
                Assert.equal(42, snapshotContainer.get("nested.level1.level2.attr42"), "Should have last number attribute");
                Assert.equal(true, snapshotContainer.get("boolean.attr.0"), "Should have first boolean (true)");
                Assert.equal(false, snapshotContainer.get("boolean.attr.1"), "Should have second boolean (false)");
                Assert.equal(false, snapshotContainer.get("boolean.attr.41"), "Should have second-to-last boolean (false)");

                // Modify large source
                for (let i = 0; i < 100; i++) {
                    largeAttribs.set(`attr.${i}.key`, `modified_value_${i}`);
                    largeAttribs.set(`new.attr.${i}`, `new_value_${i}`);
                }

                // Verify snapshot container retains original values
                Assert.equal(128, snapshotContainer.size, "Size should remain 128 after large source modification");
                Assert.equal(329, snapshotContainer.droppedAttributes, "As the size should hanve been limited the dropped count should reflect the excess attributes");
                Assert.equal("value_0", snapshotContainer.get("attr.0.key"), "Should retain original first value");
                Assert.equal("value_42", snapshotContainer.get("attr.42.key"), "Should retain original last value");
                Assert.equal(undefined, snapshotContainer.get("new.attr.0"), "Should not have new attributes");
                Assert.equal(undefined, snapshotContainer.get("new.attr.99"), "Should not have new attributes");

                // Test iterator performance with large set
                let keyCount = 0;
                snapshotContainer.forEach((key, value) => {
                    keyCount++;
                });
                Assert.equal(128, keyCount, "forEach should iterate over all 300 attributes");

                const attributes = snapshotContainer.attributes;
                Assert.equal(128, objKeys(attributes).length, "attributes should return all 300 attributes");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Edge cases - malformed and special inputs",
            test: () => {
                const otelCfg: IOTelConfig = {};

                // Test with attribute objects that have non-string keys (should be handled gracefully)
                const weirdAttribs = {
                    "normal.key": "normal_value",
                    123: "numeric_key_value", // This may or may not be included depending on implementation
                    "": "empty_key_value",
                    " ": "space_key_value",
                    "key with spaces": "spaces_value",
                    "key.with.many.dots.in.it": "many_dots_value"
                } as any;

                const snapshotContainer = createAttributeSnapshot(otelCfg, "weird-snapshot", weirdAttribs);

                // Verify normal attributes are handled
                Assert.equal("normal_value", snapshotContainer.get("normal.key"), "Should handle normal key");
                Assert.equal("spaces_value", snapshotContainer.get("key with spaces"), "Should handle keys with spaces");
                Assert.equal("many_dots_value", snapshotContainer.get("key.with.many.dots.in.it"), "Should handle keys with many dots");
                
                // Test edge case values
                const edgeValueAttribs: IOTelAttributes = {
                    "null.value": null as any,
                    "undefined.value": undefined as any,
                    "zero.number": 0,
                    "false.boolean": false,
                    "empty.string": "",
                    "very.long.string": "a".repeat(1000),
                    "negative.number": -42,
                    "float.number": 3.14159
                };

                const edgeSnapshotContainer = createAttributeSnapshot(otelCfg, "edge-snapshot", edgeValueAttribs);

                // Verify edge case values are handled correctly
                Assert.equal(null, edgeSnapshotContainer.get("null.value"), "Should handle null value");
                Assert.equal(undefined, edgeSnapshotContainer.get("undefined.value"), "Should handle undefined value");
                Assert.equal(0, edgeSnapshotContainer.get("zero.number"), "Should handle zero value");
                Assert.equal(false, edgeSnapshotContainer.get("false.boolean"), "Should handle false value");
                Assert.equal("", edgeSnapshotContainer.get("empty.string"), "Should handle empty string");
                Assert.equal("a".repeat(1000), edgeSnapshotContainer.get("very.long.string"), "Should handle very long string");
                Assert.equal(-42, edgeSnapshotContainer.get("negative.number"), "Should handle negative number");
                Assert.equal(3.14159, edgeSnapshotContainer.get("float.number"), "Should handle float number");

                // Test with array-like object (should create empty container)
                const arrayLike = ["item1", "item2", "item3"] as any;
                const arraySnapshotContainer = createAttributeSnapshot(otelCfg, "array-snapshot", arrayLike);
                Assert.equal(0, arraySnapshotContainer.size, "Should create empty container for array-like input");

                // Test with function object which has properties assigned
                const funcObj = function() { return "test"; } as any;
                funcObj.customProp = "custom_value";
                const funcSnapshotContainer = createAttributeSnapshot(otelCfg, "func-snapshot", funcObj);
                Assert.equal(1, funcSnapshotContainer.size, "Should create container for function input");
                Assert.equal("custom_value", funcSnapshotContainer.get("customProp"), "Should include function property");

                // Test with function object (should create a container with it's properties)
                const funcObj2 = function() { return "test"; } as any;
                const func2SnapshotContainer = createAttributeSnapshot(otelCfg, "func2-snapshot", funcObj2);
                Assert.equal(0, func2SnapshotContainer.size, "Should create empty container for function input");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Lazy copy-on-change with eAttributeFilter behavior",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up initial state
                sourceContainer.set("original.key1", "original_value1");
                sourceContainer.set("shared.key", "original_shared");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Before any source changes, snapshot should access inherited values
                Assert.equal("original_value1", snapshotContainer.get("original.key1"), "Should get inherited value");
                Assert.equal("original_shared", snapshotContainer.get("shared.key"), "Should get inherited shared value");
                
                // Test eAttributeFilter behavior before changes
                Assert.ok(snapshotContainer.has("original.key1"), "Should have key (default - includes inherited)");
                Assert.ok(!snapshotContainer.has("original.key1", eAttributeFilter.Local), "Should NOT have key locally before source change");
                Assert.ok(snapshotContainer.has("original.key1", eAttributeFilter.Inherited), "Should have key as inherited before source change");

                // Now modify the source - this should trigger lazy copy-on-change
                sourceContainer.set("shared.key", "modified_shared");
                sourceContainer.set("new.key", "new_value");

                // After source change, snapshot should preserve original values via local copies
                Assert.equal("original_shared", snapshotContainer.get("shared.key"), "Should retain original shared value after source change");
                Assert.equal(undefined, snapshotContainer.get("new.key"), "Should not have new key added after snapshot");
                
                // Test eAttributeFilter behavior after changes
                Assert.ok(snapshotContainer.has("shared.key"), "Should have shared key (default - includes both local and inherited)");
                Assert.ok(snapshotContainer.has("shared.key", eAttributeFilter.Local), "Should have shared key locally after source change (lazy copy)");
                Assert.ok(snapshotContainer.has("shared.key", eAttributeFilter.Inherited), "Should still have an inherited shared key even after copied locally");
                Assert.equal("original_shared", snapshotContainer.get("shared.key"), "Should return the local copy of shared.key");
                Assert.equal("original_shared", snapshotContainer.get("shared.key", eAttributeFilter.Local), "Should return the local copy of shared.key");
                Assert.equal("original_shared", snapshotContainer.get("shared.key", eAttributeFilter.LocalOrDeleted), "Should return the local copy of shared.key");
                Assert.equal("modified_shared", snapshotContainer.get("shared.key", eAttributeFilter.Inherited), "Should return the inherited copy of shared.key");
                
                // Keys that weren't changed should still be inherited
                Assert.ok(snapshotContainer.has("original.key1"), "Should still have unchanged key");
                Assert.ok(!snapshotContainer.has("original.key1", eAttributeFilter.Local), "Unchanged key should still NOT be local");
                Assert.ok(snapshotContainer.has("original.key1", eAttributeFilter.Inherited), "Unchanged key should still be inherited");

                // Test clear operation behavior
                sourceContainer.clear();
                
                // After source clear, all original keys should be copied locally to preserve snapshot
                Assert.equal("original_value1", snapshotContainer.get("original.key1"), "Should still have original key1 after source clear");
                Assert.equal("original_shared", snapshotContainer.get("shared.key"), "Should still have original shared after source clear");
                
                // All keys should now be local (copied due to clear operation)
                Assert.ok(snapshotContainer.has("original.key1", eAttributeFilter.Local), "Key should be local after source clear");
                Assert.ok(!snapshotContainer.has("original.key1", eAttributeFilter.Inherited), "Key should NOT be inherited after source clear");
                Assert.ok(snapshotContainer.has("shared.key", eAttributeFilter.Local), "Shared key should be local after source clear");
                Assert.ok(!snapshotContainer.has("shared.key", eAttributeFilter.Inherited), "Shared key should NOT be inherited after source clear");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Iterator behavior with source tracking",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                sourceContainer.set("inherited.key1", "inherited_value1");
                sourceContainer.set("will.change", "original_value");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);
                
                // Add some local keys to snapshot
                snapshotContainer.set("local.key1", "local_value1");
                
                // Trigger lazy copy by changing source
                sourceContainer.set("will.change", "changed_value");

                // Collect entries with source information
                let entries: [string, any, number][] = [];
                let entriesIter = snapshotContainer.entries();
                let entryResult = entriesIter.next();
                while (!entryResult.done) {
                    entries.push(entryResult.value);
                    entryResult = entriesIter.next();
                }

                // Should have 3 entries: 1 inherited + 1 local copy due to change + 1 purely local
                Assert.equal(3, entries.length, "Should have 3 entries total");
                
                // Find each entry and verify source
                let inheritedEntry = entries.find(e => e[0] === "inherited.key1");
                let changedEntry = entries.find(e => e[0] === "will.change");
                let localEntry = entries.find(e => e[0] === "local.key1");

                Assert.ok(inheritedEntry, "Should have inherited entry");
                Assert.equal(eAttributeFilter.Inherited, inheritedEntry![2], "inherited.key1 should be marked as inherited");
                
                Assert.ok(changedEntry, "Should have changed entry");
                Assert.equal(eAttributeFilter.Local, changedEntry![2], "will.change should be marked as local (lazy copied)");
                Assert.equal("original_value", changedEntry![1], "will.change should have original value");
                
                Assert.ok(localEntry, "Should have local entry");
                Assert.equal(eAttributeFilter.Local, localEntry![2], "local.key1 should be marked as local");
            }
        });

        // ===== Delete Functionality Tests =====

        this.testCase({
            name: "AttributeContainer: Delete functionality - basic delete",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");
                
                // Set some attributes
                Assert.ok(container.set("key1", "value1"), "Should set key1");
                Assert.ok(container.set("key2", "value2"), "Should set key2");
                Assert.equal(2, container.size, "Should have 2 attributes");
                
                // Delete one attribute
                Assert.ok(container.del("key1"), "Should delete key1");
                Assert.ok(!container.has("key1"), "key1 should not exist after delete");
                Assert.equal(undefined, container.get("key1"), "key1 should return undefined after delete");
                Assert.equal("value2", container.get("key2"), "key2 should still exist");
                Assert.equal(1, container.size, "Should have 1 attribute after delete");
                
                // Try to delete non-existent key
                Assert.ok(!container.del("nonexistent"), "Should return false for non-existent key");
                
                // Try to delete already deleted key
                Assert.ok(!container.del("key1"), "Should return false for already deleted key");
            }
        });

        this.testCase({
            name: "AttributeContainer: Delete functionality - delete inherited attribute",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2",
                    "shared.key": "parent_shared"
                };
                
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                container.set("local.key", "local_value");
                
                // Verify initial state
                Assert.equal(4, container.size, "Should have 4 attributes (3 inherited + 1 local)");
                Assert.equal("parent_value1", container.get("parent.key1"), "Should get inherited value");
                Assert.ok(container.has("parent.key1"), "Should have inherited key");
                
                // Delete inherited attribute
                Assert.ok(container.del("parent.key1"), "Should delete inherited attribute");
                Assert.ok(!container.has("parent.key1"), "Inherited key should not exist after delete");
                Assert.equal(undefined, container.get("parent.key1"), "Deleted inherited key should return undefined");
                Assert.equal(3, container.size, "Size should decrease after deleting inherited key");
                
                // Other inherited attributes should still be accessible
                Assert.equal("parent_value2", container.get("parent.key2"), "Other inherited attributes should remain");
                Assert.equal("local_value", container.get("local.key"), "Local attributes should remain");
                
                // Delete should only affect this container, not the source
                const newContainer = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                Assert.equal("parent_value1", newContainer.get("parent.key1"), "Source attributes should be unaffected");
            }
        });

        this.testCase({
            name: "AttributeContainer: Delete functionality - with container inheritance",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", "parent_value2");
                
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                childContainer.set("child.key", "child_value");
                
                // Verify initial state
                Assert.equal(3, childContainer.size, "Should have 3 attributes");
                Assert.equal("parent_value1", childContainer.get("parent.key1"), "Should get inherited from parent container");
                
                // Delete inherited attribute from parent container
                Assert.ok(childContainer.del("parent.key1"), "Should delete inherited attribute from parent container");
                Assert.ok(!childContainer.has("parent.key1"), "Deleted inherited key should not exist");
                Assert.equal(undefined, childContainer.get("parent.key1"), "Deleted inherited key should return undefined");
                Assert.equal(2, childContainer.size, "Size should decrease");
                
                // Parent container should still have the attribute
                Assert.equal("parent_value1", parentContainer.get("parent.key1"), "Parent container should be unaffected");
                Assert.equal(2, parentContainer.size, "Parent container size should be unchanged");
                
                // Child can still access other inherited attributes
                Assert.equal("parent_value2", childContainer.get("parent.key2"), "Other inherited attributes should remain");
            }
        });

        this.testCase({
            name: "AttributeContainer: Delete functionality - iterator excludes deleted inherited keys",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2",
                    "parent.key3": "parent_value3"
                };
                
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                container.set("local.key", "local_value");
                
                // Delete one inherited key
                Assert.ok(container.del("parent.key2"), "Should delete inherited key");
                
                // Collect all keys via iterator
                const keys: string[] = [];
                container.forEach((key, value) => {
                    keys.push(key);
                });
                
                Assert.equal(3, keys.length, "Should iterate over 3 keys (2 inherited + 1 local, excluding deleted)");
                Assert.ok(keys.includes("parent.key1"), "Should include non-deleted inherited key1");
                Assert.ok(!keys.includes("parent.key2"), "Should not include deleted inherited key2");
                Assert.ok(keys.includes("parent.key3"), "Should include non-deleted inherited key3");
                Assert.ok(keys.includes("local.key"), "Should include local key");
                
                // Test entries iterator
                const entries: [string, any, eAttributeFilter][] = [];
                const entriesIter = container.entries();
                let result = entriesIter.next();
                while (!result.done) {
                    entries.push(result.value);
                    result = entriesIter.next();
                }
                
                Assert.equal(3, entries.length, "entries() should return 3 entries");
                const entryKeys = entries.map(e => e[0]);
                Assert.ok(!entryKeys.includes("parent.key2"), "entries() should not include deleted inherited key");
            }
        });

        this.testCase({
            name: "AttributeContainer: Delete functionality - clear doesn't affect deleted key tracking",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2"
                };
                
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                container.set("local.key", "local_value");
                
                // Delete inherited key
                Assert.ok(container.del("parent.key1"), "Should delete inherited key");
                Assert.ok(!container.has("parent.key1"), "Deleted key should not exist");
                
                // Clear container
                container.clear();
                Assert.equal(0, container.size, "Size should be 0 after clear");
                
                // Deleted key tracking should be reset after clear
                // Re-adding parent attributes should make the key available again
                const newContainer = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                Assert.equal("parent_value1", newContainer.get("parent.key1"), "Key should be available in new container");
            }
        });

        // ===== Change Operation Type Tests =====

        this.testCase({
            name: "AttributeContainer: Change operations - Add vs Change operations",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test-container");
                
                let lastChangeInfo: IAttributeChangeInfo<any> | null = null;
                const unloadHook = container.listen((changeInfo) => {
                    lastChangeInfo = changeInfo;
                });
                
                // Test Add operation (new key)
                Assert.ok(container.set("new.key", "new_value"), "Should add new key");
                Assert.ok(lastChangeInfo, "Should have change info");
                Assert.equal(eAttributeChangeOp.Add, lastChangeInfo!.op, "Should be Add operation for new key");
                Assert.equal("new.key", lastChangeInfo!.k, "Should have correct key");
                Assert.equal("new_value", lastChangeInfo!.val, "Should have new value");
                Assert.equal(undefined, lastChangeInfo!.prev, "Should have no previous value for new key");
                
                // Test Change operation (existing key)
                lastChangeInfo = null;
                Assert.ok(container.set("new.key", "updated_value"), "Should update existing key");
                Assert.ok(lastChangeInfo, "Should have change info for update");
                Assert.equal(eAttributeChangeOp.Set, lastChangeInfo!.op, "Should be Set operation for existing key");
                Assert.equal("new.key", lastChangeInfo!.k, "Should have correct key");
                Assert.equal("updated_value", lastChangeInfo!.val, "Should have updated value");
                Assert.equal("new_value", lastChangeInfo!.prev, "Should have previous value");
                
                // Test Delete operation
                lastChangeInfo = null;
                Assert.ok(container.del("new.key"), "Should delete key");
                Assert.ok(lastChangeInfo, "Should have change info for delete");
                Assert.equal(eAttributeChangeOp.Delete, lastChangeInfo!.op, "Should be Delete operation");
                Assert.equal("new.key", lastChangeInfo!.k, "Should have correct key for delete");
                Assert.equal("updated_value", lastChangeInfo!.prev, "Should have previous value for delete");
                Assert.equal(undefined, lastChangeInfo!.val, "Should have no new value for delete");
                
                // Test Clear operation
                container.set("key1", "value1");
                container.set("key2", "value2");
                lastChangeInfo = null;
                container.clear();
                Assert.ok(lastChangeInfo, "Should have change info for clear");
                Assert.equal(eAttributeChangeOp.Clear, lastChangeInfo!.op, "Should be Clear operation");
                Assert.equal(undefined, lastChangeInfo!.k, "Should have no key for clear");
                
                unloadHook.rm();
            }
        });

        this.testCase({
            name: "AttributeContainer: Change operations - with inherited attributes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "inherited.key": "inherited_value"
                };
                
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                
                let lastChangeInfo: IAttributeChangeInfo<any> | null = null;
                const unloadHook = container.listen((changeInfo) => {
                    lastChangeInfo = changeInfo;
                });
                
                // Test overriding inherited key (should be Add operation since it's new locally)
                Assert.ok(container.set("inherited.key", "override_value"), "Should override inherited key");
                Assert.ok(lastChangeInfo, "Should have change info");
                Assert.equal(eAttributeChangeOp.Set, lastChangeInfo!.op, "Should be Add operation when overriding inherited key");
                Assert.equal("inherited.key", lastChangeInfo!.k, "Should have correct key");
                Assert.equal("override_value", lastChangeInfo!.val, "Should have override value");
                Assert.equal("inherited_value", lastChangeInfo!.prev, "Should have no previous local value");
                
                // Test changing the local override (should be Change operation)
                lastChangeInfo = null;
                Assert.ok(container.set("inherited.key", "new_override_value"), "Should change local override");
                Assert.ok(lastChangeInfo, "Should have change info for change");
                Assert.equal(eAttributeChangeOp.Set, lastChangeInfo!.op, "Should be Change operation for existing local key");
                Assert.equal("inherited.key", lastChangeInfo!.k, "Should have correct key");
                Assert.equal("new_override_value", lastChangeInfo!.val, "Should have new override value");
                Assert.equal("override_value", lastChangeInfo!.prev, "Should have previous local value");
                
                unloadHook.rm();
            }
        });

        // ===== Snapshot Container with Delete Tests =====

        this.testCase({
            name: "createSnapshotAttributes: Delete operations - source container delete after snapshot",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up initial state
                sourceContainer.set("key1", "value1");
                sourceContainer.set("key2", "value2");
                sourceContainer.set("key3", "value3");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify initial state
                Assert.equal(3, snapshotContainer.size, "Should have all initial attributes");
                Assert.equal("value1", snapshotContainer.get("key1"), "Should have key1");
                Assert.equal("value2", snapshotContainer.get("key2"), "Should have key2");

                // Delete from source container after snapshot creation
                Assert.ok(sourceContainer.del("key1"), "Should delete key1 from source");

                // Verify snapshot container preserves pre-delete state (lazy copy-on-change)
                Assert.equal("value1", snapshotContainer.get("key1"), "Should retain original key1 value due to lazy copy-on-change");
                Assert.ok(snapshotContainer.has("key1"), "Should still have key1 due to lazy copy-on-change");
                Assert.equal(3, snapshotContainer.size, "Size should remain unchanged after source delete");

                // Verify source container shows the deletion
                Assert.equal(undefined, sourceContainer.get("key1"), "Source should not have deleted key");
                Assert.equal(2, sourceContainer.size, "Source size should decrease after delete");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Delete operations - snapshot container delete",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const sourceContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Set up initial state
                sourceContainer.set("key1", "value1");
                sourceContainer.set("key2", "value2");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify initial state
                Assert.equal(2, snapshotContainer.size, "Should have all initial attributes");
                
                // Delete from snapshot container
                Assert.ok(snapshotContainer.del("key1"), "Should delete key1 from snapshot");
                Assert.equal(undefined, snapshotContainer.get("key1"), "Snapshot should not have deleted key");
                Assert.ok(!snapshotContainer.has("key1"), "Snapshot should not have deleted key");
                Assert.equal(1, snapshotContainer.size, "Snapshot size should decrease after delete");

                // Verify source container is unaffected
                Assert.equal("value1", sourceContainer.get("key1"), "Source should still have key1");
                Assert.equal(2, sourceContainer.size, "Source size should be unchanged");
            }
        });

        this.testCase({
            name: "createSnapshotAttributes: Delete operations - with inherited attributes",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2"
                };
                
                const sourceContainer = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                sourceContainer.set("source.key", "source_value");

                const snapshotContainer = createAttributeSnapshot(otelCfg, "test-snapshot", sourceContainer);

                // Verify initial state with inheritance
                Assert.equal(3, snapshotContainer.size, "Should have all attributes including inherited");
                Assert.equal("parent_value1", snapshotContainer.get("parent.key1"), "Should access inherited attribute");

                // Delete inherited attribute from source after snapshot
                Assert.ok(sourceContainer.del("parent.key1"), "Should delete inherited attribute from source");
                
                // Verify snapshot preserves the inherited attribute
                Assert.equal("parent_value1", snapshotContainer.get("parent.key1"), "Snapshot should preserve inherited attribute");
                Assert.equal(3, snapshotContainer.size, "Snapshot size should remain unchanged");

                // Delete inherited attribute from snapshot directly
                Assert.ok(snapshotContainer.del("parent.key2"), "Should delete inherited attribute from snapshot");
                Assert.equal(undefined, snapshotContainer.get("parent.key2"), "Snapshot should not have deleted inherited attribute");
                Assert.equal(2, snapshotContainer.size, "Snapshot size should decrease");

                // Source should still have the inherited attribute
                Assert.equal("parent_value2", sourceContainer.get("parent.key2"), "Source should still have inherited attribute");
            }
        });

        // ===== Edge Case Tests =====

        this.testCase({
            name: "AttributeContainer: Delete edge case - inherited key added after deletion",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create parent container that starts empty
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                
                // Create child container with empty parent
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                // Create snapshot of child before any keys exist
                const snapshotContainer = createAttributeSnapshot(otelCfg, "child-snapshot", childContainer);
                
                // Delete a key that doesn't exist yet (preemptive deletion)
                Assert.ok(!childContainer.del("future.key"), "Should not be able to delete non-existent key");
                Assert.ok(!childContainer.has("future.key"), "Child should not have the key after deletion");
                
                // Now add the key to the parent (this is the edge case)
                parentContainer.set("future.key", "parent_value");
                
                // Child should still not see the key because it was preemptively deleted
                Assert.ok(childContainer.has("future.key"), "Child should still have the key after parent addition as the deletion failed");
                Assert.equal("parent_value", childContainer.get("future.key"), "Child should not get the inherited value");
                
                // Snapshot should also not see the key
                Assert.ok(!snapshotContainer.has("future.key"), "Snapshot should not have the key as it didn't exist at the point of creation");
                Assert.equal(undefined, snapshotContainer.get("future.key"), "Snapshot should not get the inherited value");
                
                // Parent should have the key
                Assert.ok(parentContainer.has("future.key"), "Parent should have the key");
                Assert.equal("parent_value", parentContainer.get("future.key"), "Parent should get the value");
                
                // New child container should see the inherited key
                const newChildContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                Assert.ok(newChildContainer.has("future.key"), "New child should have inherited key");
                Assert.equal("parent_value", newChildContainer.get("future.key"), "New child should get inherited value");
            }
        });

        this.testCase({
            name: "AttributeContainer: Iterator performance - no extra _find calls",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2",
                    "parent.key3": "parent_value3"
                };
                
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                container.set("local.key1", "local_value1");
                
                // Delete some inherited keys
                Assert.ok(container.del("parent.key2"), "Should delete inherited key");
                
                // Iterate through all keys - this should use the optimized deletedKeys tracking
                const keys: string[] = [];
                let iterationCount = 0;
                container.forEach((key, value) => {
                    keys.push(key);
                    iterationCount++;
                });
                
                // Should have 3 keys: parent.key1, parent.key3, local.key1 (excluding deleted parent.key2)
                Assert.equal(3, keys.length, "Should iterate over correct number of keys");
                Assert.equal(3, iterationCount, "Should iterate exactly 3 times");
                Assert.ok(keys.includes("parent.key1"), "Should include non-deleted inherited key1");
                Assert.ok(!keys.includes("parent.key2"), "Should not include deleted inherited key2");
                Assert.ok(keys.includes("parent.key3"), "Should include non-deleted inherited key3");
                Assert.ok(keys.includes("local.key1"), "Should include local key");
                
                // Test entries iterator as well
                const entries: [string, any, eAttributeFilter][] = [];
                const entriesIter = container.entries();
                let result = entriesIter.next();
                while (!result.done) {
                    entries.push(result.value);
                    result = entriesIter.next();
                }
                
                Assert.equal(3, entries.length, "entries() should return correct number of entries");
                const entryKeys = entries.map(e => e[0]);
                Assert.ok(!entryKeys.includes("parent.key2"), "entries() should not include deleted inherited key");
            }
        });

        // ===== Comprehensive Multi-Level Inheritance Tests =====

        this.testCase({
            name: "AttributeContainer: Deep inheritance chain - 5 levels with delete operations",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create 5-level inheritance chain
                const level5Container = createAttributeContainer(otelCfg, "level5-container");
                level5Container.set("level5.key", "level5_value");
                level5Container.set("shared.key", "level5_shared");
                
                const level4Container = createAttributeContainer(otelCfg, "level4-container", level5Container);
                level4Container.set("level4.key", "level4_value");
                level4Container.set("shared.key", "level4_shared"); // Override level5
                
                const level3Container = createAttributeContainer(otelCfg, "level3-container", level4Container);
                level3Container.set("level3.key", "level3_value");
                
                const level2Container = createAttributeContainer(otelCfg, "level2-container", level3Container);
                level2Container.set("level2.key", "level2_value");
                level2Container.set("shared.key", "level2_shared"); // Override level4
                
                const level1Container = createAttributeContainer(otelCfg, "level1-container", level2Container);
                level1Container.set("level1.key", "level1_value");
                
                // Verify full inheritance chain
                Assert.equal(6, level1Container.size, "Should have 6 attributes from all levels");
                Assert.equal("level5_value", level1Container.get("level5.key"), "Should access level5 attribute");
                Assert.equal("level4_value", level1Container.get("level4.key"), "Should access level4 attribute");
                Assert.equal("level3_value", level1Container.get("level3.key"), "Should access level3 attribute");
                Assert.equal("level2_value", level1Container.get("level2.key"), "Should access level2 attribute");
                Assert.equal("level1_value", level1Container.get("level1.key"), "Should access level1 attribute");
                Assert.equal("level2_shared", level1Container.get("shared.key"), "Should get level2 override of shared key");
                
                // Test delete operations across inheritance chain
                Assert.ok(level1Container.del("level4.key"), "Should delete inherited level4 key");
                Assert.ok(!level1Container.has("level4.key"), "level4.key should not exist after delete");
                Assert.equal("level4_value", level4Container.get("level4.key"), "level4 container should still have the key");
                Assert.equal(5, level1Container.size, "Size should decrease after delete");
                
                // Delete shared key that's overridden at current level
                Assert.ok(level2Container.del("shared.key"), "Should delete overridden shared key");
                Assert.ok(!level2Container.has("shared.key"), "shared.key should not exist after delete");
                Assert.equal("level4_shared", level3Container.get("shared.key"), "level3 should now see level4 value");
                Assert.equal(undefined, level1Container.get("shared.key"), "level1 should not see the level4 value through inheritance as it was deleted at level 2");
                
                // Test iterator with deleted keys
                const keys: string[] = [];
                level1Container.forEach((key, value) => {
                    keys.push(key);
                });
                Assert.equal(4, keys.length, "Should iterate over 4 remaining keys");
                Assert.ok(!keys.includes("level4.key"), "Should not include deleted level4 key");
                Assert.ok(keys.includes("level5.key"), "Should include level5 key");
            }
        });

        this.testCase({
            name: "AttributeContainer: Complex inheritance with snapshot containers",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create inheritance chain
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key1", "parent_value1");
                parentContainer.set("parent.key2", "parent_value2");
                parentContainer.set("shared.key", "parent_shared");
                
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                childContainer.set("child.key", "child_value");
                childContainer.set("shared.key", "child_shared"); // Override parent
                
                // Create snapshot of child (which includes inheritance)
                const snapshot = createAttributeSnapshot(otelCfg, "complex-inheritance-snapshot", childContainer);
                
                // Verify snapshot captures full inheritance
                Assert.equal(4, snapshot.size, "Snapshot should have all inherited attributes");
                Assert.equal("parent_value1", snapshot.get("parent.key1"), "Snapshot should have parent key1");
                Assert.equal("child_shared", snapshot.get("shared.key"), "Snapshot should have child override");
                
                // Delete inherited key from child
                Assert.ok(childContainer.del("parent.key1"), "Should delete inherited key from child");
                
                // Snapshot should preserve original state via lazy copy
                Assert.equal("parent_value1", snapshot.get("parent.key1"), "Snapshot should preserve deleted inherited key");
                Assert.ok(snapshot.has("parent.key1", eAttributeFilter.Local), "Deleted key should be copied locally in snapshot");
                
                // Test source filtering in snapshot after delete
                Assert.ok(!snapshot.has("parent.key1", eAttributeFilter.Inherited), "Should not appear as inherited after lazy copy");
                Assert.ok(snapshot.has("parent.key2", eAttributeFilter.Inherited), "Non-deleted keys should remain inherited");
                
                // Modify parent after snapshot - snapshot should copy lazily
                parentContainer.set("parent.key2", "modified_parent2");
                Assert.equal("parent_value2", snapshot.get("parent.key2"), "Snapshot should preserve original value");
                Assert.ok(snapshot.has("parent.key2", eAttributeFilter.Local), "Modified inherited key should be copied locally");
            }
        });

        this.testCase({
            name: "AttributeContainer: Circular reference prevention and edge cases",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                const container1 = createAttributeContainer(otelCfg, "test-container");
                container1.set("container1.key", "value1");
                
                // Test with null/undefined inheritance
                const containerWithNull = createAttributeContainer(otelCfg, "test-null", null as any);
                Assert.equal(0, containerWithNull.size, "Should handle null inheritance");
                
                const containerWithUndefined = createAttributeContainer(otelCfg, "test-undefined", undefined as any);
                Assert.equal(0, containerWithUndefined.size, "Should handle undefined inheritance");
                
                // Test with empty inheritance object
                const emptyAttribs: IOTelAttributes = {};
                const containerWithEmpty = createAttributeContainer(otelCfg, "test-empty-attribs", emptyAttribs);
                Assert.equal(0, containerWithEmpty.size, "Should handle empty inheritance object");
                
                // Test with inheritance object containing undefined/null values
                const attribsWithNulls: IOTelAttributes = {
                    "valid.key": "valid_value",
                    "null.key": null as any,
                    "undefined.key": undefined as any,
                    "empty.string": "",
                    "zero.value": 0
                };
                
                const containerWithNulls = createAttributeContainer(otelCfg, "test-with-nulls", attribsWithNulls);
                Assert.equal(5, containerWithNulls.size, "Should include all inheritance attributes including null/undefined");
                Assert.equal("valid_value", containerWithNulls.get("valid.key"), "Should get valid inherited value");
                Assert.equal(null, containerWithNulls.get("null.key"), "Should get null inherited value");
                Assert.equal(undefined, containerWithNulls.get("undefined.key"), "Should get undefined inherited value");
                Assert.equal("", containerWithNulls.get("empty.string"), "Should get empty string");
                Assert.equal(0, containerWithNulls.get("zero.value"), "Should get zero value");
            }
        });

        this.testCase({
            name: "AttributeContainer: Performance with large inheritance chains",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create a large inheritance chain
                let currentContainer = createAttributeContainer(otelCfg, "test-container");
                currentContainer.set("root.key", "root_value");
                
                // Build 10-level inheritance chain
                for (let i = 1; i <= 10; i++) {
                    const newContainer = createAttributeContainer(otelCfg, `level-${i}-container`, currentContainer);
                    newContainer.set(`level${i}.key`, `level${i}_value`);
                    newContainer.set(`shared.level${i}`, `shared_value_${i}`);
                    currentContainer = newContainer;
                }
                
                // Final container should have access to all levels
                Assert.equal(21, currentContainer.size, "Should have all attributes from 10-level chain");
                Assert.equal("root_value", currentContainer.get("root.key"), "Should access root attribute");
                Assert.equal("level5_value", currentContainer.get("level5.key"), "Should access middle level");
                Assert.equal("level10_value", currentContainer.get("level10.key"), "Should access top level");
                
                // Test performance of iteration over large inheritance
                let count = 0;
                currentContainer.forEach((key, value) => {
                    count++;
                });
                Assert.equal(21, count, "Should iterate over all inherited attributes");
                
                // Test delete performance in large chain
                Assert.ok(currentContainer.del("level5.key"), "Should delete from middle of chain");
                Assert.equal(20, currentContainer.size, "Size should decrease after delete");
                
                // Verify iteration still works correctly after delete
                count = 0;
                currentContainer.forEach((key, value) => {
                    count++;
                });
                Assert.equal(20, count, "Should iterate correctly after delete");
            }
        });

        this.testCase({
            name: "AttributeContainer: Change listener propagation through inheritance",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                const parentContainer = createAttributeContainer(otelCfg, "test-container");
                parentContainer.set("parent.key", "parent_value");
                
                const childContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                childContainer.set("child.key", "child_value");
                
                let childChangeInfo: IAttributeChangeInfo<any> | null = null;
                const childUnloadHook = childContainer.listen((changeInfo) => {
                    childChangeInfo = changeInfo;
                });
                
                let parentChangeInfo: IAttributeChangeInfo<any> | null = null;
                const parentUnloadHook = parentContainer.listen((changeInfo) => {
                    parentChangeInfo = changeInfo;
                });
                
                // Test parent change propagation to child
                parentContainer.set("parent.key", "modified_parent");
                Assert.ok(parentChangeInfo, "Parent should receive change notification");
                Assert.equal(eAttributeChangeOp.Set, parentChangeInfo!.op, "Parent should see Set operation");
                
                // Child should be notified about parent changes that don't conflict with local keys
                parentContainer.set("new.parent.key", "new_parent_value");
                Assert.ok(childChangeInfo, "Child should receive notification for non-conflicting parent change");
                
                // Test parent clear propagation
                childChangeInfo = null;
                parentContainer.clear();
                Assert.ok(childChangeInfo, "Child should receive clear notification");
                Assert.equal(eAttributeChangeOp.Clear, childChangeInfo!.op, "Child should see Clear operation");
                
                // Test delete operations
                parentContainer.set("parent.key", "restored_value");
                childChangeInfo = null;
                Assert.ok(parentContainer.del("parent.key"), "Should delete parent key");
                Assert.ok(childChangeInfo, "Child should receive delete notification");
                Assert.equal(eAttributeChangeOp.Delete, childChangeInfo!.op, "Child should see Delete operation");
                
                childUnloadHook.rm();
                parentUnloadHook.rm();
            }
        });

        this.testCase({
            name: "AttributeContainer: Edge case - delete non-existent keys with inheritance",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                const parentAttribs: IOTelAttributes = {
                    "parent.key1": "parent_value1",
                    "parent.key2": "parent_value2"
                };
                
                const container = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                
                // Test deleting non-existent key that doesn't exist anywhere
                Assert.ok(!container.del("completely.nonexistent"), "Should return false for completely non-existent key");
                
                // Test deleting inherited key (should return true and mark as deleted)
                Assert.ok(container.del("parent.key1"), "Should return true for deleting inherited key");
                Assert.ok(!container.has("parent.key1"), "Inherited key should not exist after delete");
                
                // Test deleting already deleted inherited key
                Assert.ok(!container.del("parent.key1"), "Should return false for already deleted inherited key");
                
                // Test deleting key that might be added to parent later (edge case)
                Assert.ok(!container.del("future.key"), "Should return false for future key that doesn't exist yet");
                
                // Add the key to parent after deletion mark
                const parentContainer = createAttributeContainer(otelCfg, "test-with-inheritance", parentAttribs);
                const newChildContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                
                // Delete a key that doesn't exist yet
                Assert.ok(!newChildContainer.del("future.added.key"), "Should return false for non-existent key");
                
                // Add the key to parent after child marked it as deleted
                parentContainer.set("future.added.key", "future_value");
                
                // Child should still not see the key due to pre-deletion
                Assert.ok(newChildContainer.has("future.added.key"), "Child should see key added even though we attempted to delete prior to it existing");
                Assert.equal("future_value", newChildContainer.get("future.added.key"), "Child should return value for prior deleted key");
                
                // But new containers should see it
                const anotherChildContainer = createAttributeContainer(otelCfg, "test-child", parentContainer);
                Assert.equal("future_value", anotherChildContainer.get("future.added.key"), "New child should see parent key");
            }
        });

        this.testCase({
            name: "AttributeContainer: Complex snapshot interactions with deep inheritance",
            test: () => {
                const otelCfg: IOTelConfig = {};
                
                // Create complex inheritance
                const greatGrandparent = createAttributeContainer(otelCfg, "test-container");
                greatGrandparent.set("ggp.key", "ggp_value");
                greatGrandparent.set("shared.deep", "ggp_shared");
                
                const grandparent = createAttributeContainer(otelCfg, "grandparent-container", greatGrandparent);
                grandparent.set("gp.key", "gp_value");
                grandparent.set("shared.deep", "gp_shared");
                
                const parent = createAttributeContainer(otelCfg, "parent-container", grandparent);
                parent.set("p.key", "p_value");
                
                const child = createAttributeContainer(otelCfg, "child-container", parent);
                child.set("c.key", "c_value");
                child.set("shared.deep", "c_shared");
                
                // Create snapshot of deep inheritance
                const snapshot = createAttributeSnapshot(otelCfg, "deep-inheritance-snapshot", child);
                
                // Verify snapshot captures full inheritance chain
                Assert.equal(5, snapshot.size, "Snapshot should capture all levels");
                Assert.equal("ggp_value", snapshot.get("ggp.key"), "Should capture great-grandparent");
                Assert.equal("gp_value", snapshot.get("gp.key"), "Should capture grandparent");
                Assert.equal("p_value", snapshot.get("p.key"), "Should capture parent");
                Assert.equal("c_value", snapshot.get("c.key"), "Should capture child");
                Assert.equal("c_shared", snapshot.get("shared.deep"), "Should capture child override");
                
                // Delete at various levels after snapshot
                Assert.ok(child.del("shared.deep"), "Child should delete its override");
                Assert.equal(undefined, child.get("shared.deep"), "Child still won't see the grand-parent as it's been deleted");
                Assert.ok(grandparent.del("gp.key"), "Grandparent should delete its key");
                greatGrandparent.clear(); // Clear great-grandparent
                
                // Snapshot should preserve all original values through lazy copying
                Assert.equal("ggp_value", snapshot.get("ggp.key"), "Should preserve ggp key after clear");
                Assert.equal("gp_value", snapshot.get("gp.key"), "Should preserve gp key after delete");
                Assert.equal("c_shared", snapshot.get("shared.deep"), "Should preserve child override after delete");
                Assert.equal(5, snapshot.size, "Snapshot size should remain unchanged");
                
                // Test that child now sees different inheritance chain
                Assert.equal(undefined, child.get("shared.deep"), "Child should still won't see grandparent value");
                Assert.equal(undefined, child.get("gp.key"), "Child should not see deleted grandparent key");
                Assert.equal(undefined, child.get("ggp.key"), "Child should not see cleared great-grandparent key");
                
                // Verify source tracking in snapshot after complex changes
                Assert.ok(snapshot.has("shared.deep", eAttributeFilter.Local), "shared.deep should be local in snapshot");
                Assert.ok(snapshot.has("ggp.key", eAttributeFilter.Local), "ggp.key should be copied locally in snapshot");
                Assert.ok(snapshot.has("gp.key", eAttributeFilter.Local), "gp.key should be copied locally in snapshot");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - basic functionality without snapshot",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parent = createAttributeContainer(otelCfg, "parent-container");
                
                // Add some attributes to parent
                parent.set("parent.key", "parent-value");
                parent.set("shared.key", "parent-shared");
                
                // Create child without snapshot
                const child = parent.child("test-child", false);
                
                // Verify child container basics
                Assert.ok(isAttributeContainer(child), "Child should be valid attribute container");
                Assert.notEqual(parent.id, child.id, "Child should have different ID");
                Assert.ok(child.id.includes("<=["), "Child ID should indicate it's a child");
                Assert.ok(child.id.includes(parent.id), "Child ID should reference parent ID");
                Assert.ok(child.id.includes("test-child"), "Child ID should include provided name");
                
                // Verify inheritance
                Assert.equal("parent-value", child.get("parent.key"), "Child should inherit parent values");
                Assert.equal("parent-shared", child.get("shared.key"), "Child should inherit shared values");
                Assert.equal(2, child.size, "Child size should include inherited attributes");
                
                // Verify child can override parent values
                Assert.ok(child.set("shared.key", "child-shared"), "Child should be able to override parent");
                Assert.equal("child-shared", child.get("shared.key"), "Child should return overridden value");
                Assert.equal("parent-shared", parent.get("shared.key"), "Parent should retain original value");
                
                // Verify child can add new attributes
                Assert.ok(child.set("child.key", "child-value"), "Child should be able to add new attributes");
                Assert.equal("child-value", child.get("child.key"), "Child should return new attribute");
                Assert.equal(undefined, parent.get("child.key"), "Parent should not see child-only attributes");
                
                // Verify size calculations
                Assert.equal(3, child.size, "Child size should include parent + child attributes");
                Assert.equal(2, parent.size, "Parent size should remain unchanged");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - basic functionality with snapshot",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parent = createAttributeContainer(otelCfg, "parent-container");
                
                // Add some attributes to parent
                parent.set("parent.key", "parent-value");
                parent.set("shared.key", "parent-shared");
                
                // Create child with snapshot
                const child = parent.child("test-child", true);
                
                // Verify child container basics
                Assert.ok(isAttributeContainer(child), "Child snapshot should be valid attribute container");
                Assert.notEqual(parent.id, child.id, "Child snapshot should have different ID");
                Assert.ok(child.id.includes("<-@["), "Child ID should indicate it's a snapshot child");
                Assert.ok(child.id.includes(parent.id), "Child ID should reference parent ID");
                Assert.ok(child.id.includes("test-child"), "Child ID should include provided name");
                
                // Verify initial inheritance (snapshot captures current state)
                Assert.equal("parent-value", child.get("parent.key"), "Child snapshot should have parent values");
                Assert.equal("parent-shared", child.get("shared.key"), "Child snapshot should have shared values");
                Assert.equal(2, child.size, "Child snapshot size should include captured attributes");
                
                // Verify child can modify without affecting parent
                Assert.ok(child.set("shared.key", "child-shared"), "Child snapshot should allow modifications");
                Assert.equal("child-shared", child.get("shared.key"), "Child snapshot should return modified value");
                Assert.equal("parent-shared", parent.get("shared.key"), "Parent should retain original value");
                
                // Verify parent changes don't affect snapshot child
                parent.set("parent.key", "parent-modified");
                parent.set("new.key", "new-value");
                Assert.equal("parent-value", child.get("parent.key"), "Child snapshot should retain original parent value");
                Assert.equal(undefined, child.get("new.key"), "Child snapshot should not see new parent attributes");
                Assert.equal(2, child.size, "Child snapshot size should remain stable");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - inheritance behavior differences",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parent = createAttributeContainer(otelCfg, "parent-container");
                
                // Setup initial parent state
                parent.set("base.key", "base-value");
                parent.set("dynamic.key", "dynamic-initial");
                
                // Create both types of children
                const regularChild = parent.child("regular", false);
                const snapshotChild = parent.child("snapshot", true);
                
                // Both should see initial state
                Assert.equal("base-value", regularChild.get("base.key"), "Regular child should see initial base value");
                Assert.equal("base-value", snapshotChild.get("base.key"), "Snapshot child should see initial base value");
                Assert.equal("dynamic-initial", regularChild.get("dynamic.key"), "Regular child should see initial dynamic value");
                Assert.equal("dynamic-initial", snapshotChild.get("dynamic.key"), "Snapshot child should see initial dynamic value");
                
                // Modify parent after children created
                parent.set("dynamic.key", "dynamic-modified");
                parent.set("new.key", "new-value");
                
                // Regular child should see changes, snapshot should not
                Assert.equal("dynamic-modified", regularChild.get("dynamic.key"), "Regular child should see parent modifications");
                Assert.equal("new-value", regularChild.get("new.key"), "Regular child should see new parent attributes");
                Assert.equal(3, regularChild.size, "Regular child size should include new parent attributes");
                
                Assert.equal("dynamic-initial", snapshotChild.get("dynamic.key"), "Snapshot child should retain original value");
                Assert.equal(undefined, snapshotChild.get("new.key"), "Snapshot child should not see new parent attributes");
                Assert.equal(2, snapshotChild.size, "Snapshot child size should remain stable");
                
                // Delete from parent
                Assert.ok(parent.del("base.key"), "Should be able to delete from parent");
                Assert.equal(undefined, regularChild.get("base.key"), "Regular child should see parent deletions");
                Assert.equal("base-value", snapshotChild.get("base.key"), "Snapshot child should retain deleted values");
                Assert.equal(2, regularChild.size, "Regular child size should reflect parent deletions");
                Assert.equal(2, snapshotChild.size, "Snapshot child size should remain stable");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - nested children behavior",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const grandparent = createAttributeContainer(otelCfg, "grandparent");
                
                // Setup inheritance chain
                grandparent.set("gp.key", "gp-value");
                grandparent.set("shared.key", "gp-shared");
                
                // Create regular child from grandparent
                const parent = grandparent.child("parent", false);
                parent.set("parent.key", "parent-value");
                parent.set("shared.key", "parent-shared"); // Override grandparent
                
                // Create both types of grandchildren
                const regularGrandchild = parent.child("regular-gc", false);
                const snapshotGrandchild = parent.child("snapshot-gc", true);
                
                // Both grandchildren should see the inheritance chain
                Assert.equal("gp-value", regularGrandchild.get("gp.key"), "Regular grandchild should see grandparent values");
                Assert.equal("parent-value", regularGrandchild.get("parent.key"), "Regular grandchild should see parent values");
                Assert.equal("parent-shared", regularGrandchild.get("shared.key"), "Regular grandchild should see parent override");
                
                Assert.equal("gp-value", snapshotGrandchild.get("gp.key"), "Snapshot grandchild should see grandparent values");
                Assert.equal("parent-value", snapshotGrandchild.get("parent.key"), "Snapshot grandchild should see parent values");
                Assert.equal("parent-shared", snapshotGrandchild.get("shared.key"), "Snapshot grandchild should see parent override");
                
                // Modify grandparent after grandchildren created
                grandparent.set("gp.key", "gp-modified");
                grandparent.set("gp.new", "gp-new-value");
                
                // Regular grandchild should see changes, snapshot should not
                Assert.equal("gp-modified", regularGrandchild.get("gp.key"), "Regular grandchild should see grandparent changes");
                Assert.equal("gp-new-value", regularGrandchild.get("gp.new"), "Regular grandchild should see new grandparent attributes");
                
                Assert.equal("gp-value", snapshotGrandchild.get("gp.key"), "Snapshot grandchild should retain original grandparent value");
                Assert.equal(undefined, snapshotGrandchild.get("gp.new"), "Snapshot grandchild should not see new grandparent attributes");
                
                // Modify parent after grandchildren created
                parent.set("parent.key", "parent-modified");
                
                // Regular grandchild should see parent changes, snapshot should not
                Assert.equal("parent-modified", regularGrandchild.get("parent.key"), "Regular grandchild should see parent changes");
                Assert.equal("parent-value", snapshotGrandchild.get("parent.key"), "Snapshot grandchild should retain original parent value");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - child creation from children",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const root = createAttributeContainer(otelCfg, "root");
                
                root.set("root.key", "root-value");
                
                // Create first level children
                const regularChild = root.child("regular", false);
                const snapshotChild = root.child("snapshot", true);
                
                regularChild.set("regular.key", "regular-value");
                snapshotChild.set("snapshot.key", "snapshot-value");
                
                // Create second level children from each type
                const regularFromRegular = regularChild.child("reg-from-reg", false);
                const snapshotFromRegular = regularChild.child("snap-from-reg", true);
                const regularFromSnapshot = snapshotChild.child("reg-from-snap", false);
                const snapshotFromSnapshot = snapshotChild.child("snap-from-snap", true);
                
                // All should see root value
                Assert.equal("root-value", regularFromRegular.get("root.key"), "Regular from regular should see root");
                Assert.equal("root-value", snapshotFromRegular.get("root.key"), "Snapshot from regular should see root");
                Assert.equal("root-value", regularFromSnapshot.get("root.key"), "Regular from snapshot should see root");
                Assert.equal("root-value", snapshotFromSnapshot.get("root.key"), "Snapshot from snapshot should see root");
                
                // Only children of regular parent should see regular parent's values
                Assert.equal("regular-value", regularFromRegular.get("regular.key"), "Regular from regular should see regular parent");
                Assert.equal("regular-value", snapshotFromRegular.get("regular.key"), "Snapshot from regular should see regular parent");
                Assert.equal(undefined, regularFromSnapshot.get("regular.key"), "Regular from snapshot should not see regular parent");
                Assert.equal(undefined, snapshotFromSnapshot.get("regular.key"), "Snapshot from snapshot should not see regular parent");
                
                // Only children of snapshot parent should see snapshot parent's values
                Assert.equal(undefined, regularFromRegular.get("snapshot.key"), "Regular from regular should not see snapshot parent");
                Assert.equal(undefined, snapshotFromRegular.get("snapshot.key"), "Snapshot from regular should not see snapshot parent");
                Assert.equal("snapshot-value", regularFromSnapshot.get("snapshot.key"), "Regular from snapshot should see snapshot parent");
                Assert.equal("snapshot-value", snapshotFromSnapshot.get("snapshot.key"), "Snapshot from snapshot should see snapshot parent");
                
                // Modify root after all children created
                root.set("root.key", "root-modified");
                
                // Regular children should see changes, snapshot children should not
                Assert.equal("root-modified", regularFromRegular.get("root.key"), "Regular from regular should see root changes");
                Assert.equal("root-value", snapshotFromRegular.get("root.key"), "Snapshot from regular should retain original root");
                Assert.equal("root-value", regularFromSnapshot.get("root.key"), "Regular from snapshot should see root changes");
                Assert.equal("root-value", snapshotFromSnapshot.get("root.key"), "Snapshot from snapshot should retain original root");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - clear and delete operations",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parent = createAttributeContainer(otelCfg, "parent");
                
                parent.set("parent.key1", "value1");
                parent.set("parent.key2", "value2");
                parent.set("shared.key", "parent-shared");
                
                const regularChild = parent.child("regular", false);
                const snapshotChild = parent.child("snapshot", true);
                
                // Both children should see all parent attributes
                Assert.equal(3, regularChild.size, "Regular child should see all parent attributes");
                Assert.equal(3, snapshotChild.size, "Snapshot child should see all parent attributes");
                
                // Add child-specific attributes
                regularChild.set("regular.key", "regular-value");
                snapshotChild.set("snapshot.key", "snapshot-value");
                
                Assert.equal(4, regularChild.size, "Regular child size should include child attribute");
                Assert.equal(4, snapshotChild.size, "Snapshot child size should include child attribute");
                
                // Clear parent
                parent.clear();
                
                // After parent.clear(), children still maintain parent connection and see the empty parent
                Assert.equal(1, regularChild.size, "Regular child should only have own attributes after parent clear");
                Assert.equal("regular-value", regularChild.get("regular.key"), "Regular child should retain own attributes");
                Assert.equal(undefined, regularChild.get("parent.key1"), "Regular child should not see cleared parent attributes");
                
                // Snapshot child preserves attributes at time of snapshot creation via lazy copying
                Assert.equal(4, snapshotChild.size, "Snapshot child should retain all attributes after parent clear");
                Assert.equal("value1", snapshotChild.get("parent.key1"), "Snapshot child should retain parent attributes");
                Assert.equal("snapshot-value", snapshotChild.get("snapshot.key"), "Snapshot child should retain own attributes");
                
                // Clear children - this breaks THEIR parent connections
                regularChild.clear();
                snapshotChild.clear();
                
                // Both should be empty and lose parent connections
                Assert.equal(0, regularChild.size, "Regular child should be empty after clear");
                Assert.equal(0, snapshotChild.size, "Snapshot child should be empty after clear");
                
                // Re-add to parent - children should NOT see it since THEIR clear() removed parent connections
                parent.set("parent.new", "new-value");
                
                // Regular child should NOT see new parent attribute after its own clear() removed parent connection
                Assert.equal(0, regularChild.size, "Regular child should not see new parent attribute after its own clear");
                Assert.equal(undefined, regularChild.get("parent.new"), "Regular child should not get new parent value after its own clear");
                
                Assert.equal(0, snapshotChild.size, "Snapshot child should remain empty");
                Assert.equal(undefined, snapshotChild.get("parent.new"), "Snapshot child should not see new parent attributes");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - listener propagation",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parent = createAttributeContainer(otelCfg, "parent");
                
                parent.set("parent.key", "parent-value");
                
                const regularChild = parent.child("regular", false);
                const snapshotChild = parent.child("snapshot", true);
                
                let regularChildChanges: IAttributeChangeInfo<any>[] = [];
                let snapshotChildChanges: IAttributeChangeInfo<any>[] = [];
                
                // Add listeners to children
                const regularHook = regularChild.listen((change) => regularChildChanges.push(change));
                const snapshotHook = snapshotChild.listen((change) => snapshotChildChanges.push(change));
                
                // Modify parent
                parent.set("parent.key", "parent-modified");
                parent.set("parent.new", "parent-new");
                
                // Both regular and snapshot children should receive change notifications
                // Regular children propagate parent changes directly
                // Snapshot children listen to maintain snapshot state
                Assert.equal(2, regularChildChanges.length, "Regular child should receive parent change notifications");
                // Snapshots get an extra notification if a parent changes a value and the local snapshot doesn't have the value or
                // it's different from the value being changed.
                Assert.equal(4, snapshotChildChanges.length, "Snapshot child should receive parent change notifications to maintain snapshot state");
                
                // Verify change details for regular child
                Assert.equal("parent.key", regularChildChanges[0].k, "First change should be parent.key");
                Assert.equal(eAttributeChangeOp.Set, regularChildChanges[0].op, "First change should be Set operation");
                Assert.equal("parent.new", regularChildChanges[1].k, "Second change should be parent.new");
                Assert.equal(eAttributeChangeOp.Add, regularChildChanges[1].op, "Second change should be Add operation");
                
                // Verify change details for snapshot child (receives notifications to manage snapshot state)
                Assert.equal("parent.key", snapshotChildChanges[0].k, "Snapshot child should receive parent.key change");
                Assert.equal(eAttributeChangeOp.Set, snapshotChildChanges[0].op, "Snapshot child should see Set operation");
                Assert.equal("parent.key", snapshotChildChanges[1].k, "Snapshot child should receive 2nd notification for parent.key change");
                Assert.equal(eAttributeChangeOp.Set, snapshotChildChanges[1].op, "Snapshot child should see 2nd Set operation");
                // It won't receive any notifications for "parent.new" as it didn't exist prior to the snapshot
                
                // Modify children directly
                regularChild.set("regular.key", "regular-value");
                snapshotChild.set("snapshot.key", "snapshot-value");
                
                // Each child should receive its own change notification
                Assert.equal(3, regularChildChanges.length, "Regular child should receive own change");
                Assert.equal(5, snapshotChildChanges.length, "Snapshot child should receive own change");
                
                // Clean up listeners
                regularHook.rm();
                snapshotHook.rm();
                
                // No more changes should be received after listeners removed
                parent.set("parent.final", "final-value");
                Assert.equal(3, regularChildChanges.length, "Regular child should not receive changes after listener removed");
                Assert.equal(5, snapshotChildChanges.length, "Snapshot child should not receive changes after listener removed");
            }
        });

        this.testCase({
            name: "AttributeContainer: Child function - clear behavior differences (parent vs child clear)",
            test: () => {
                const otelCfg: IOTelConfig = {};
                const parent = createAttributeContainer(otelCfg, "parent");
                
                parent.set("parent.key", "parent-value");
                
                // Test 1: Parent clear - children maintain connection
                const regularChild1 = parent.child("regular1", false);
                const snapshotChild1 = parent.child("snapshot1", true);
                
                // Both should see parent initially
                Assert.equal(1, regularChild1.size, "Regular child should see parent attribute");
                Assert.equal(1, snapshotChild1.size, "Snapshot child should see parent attribute");
                
                // Parent clears - children still have connection but see empty parent
                parent.clear();
                Assert.equal(0, regularChild1.size, "Regular child should see empty parent after parent clear");
                Assert.equal(1, snapshotChild1.size, "Snapshot child should preserve attributes after parent clear");
                
                // Add new attribute to parent - regular child should see it (connection maintained)
                parent.set("new.key", "new-value");
                Assert.equal(1, regularChild1.size, "Regular child should see new parent attribute (connection maintained)");
                Assert.equal("new-value", regularChild1.get("new.key"), "Regular child should get new parent value");
                Assert.equal(1, snapshotChild1.size, "Snapshot child should not see new parent attribute");
                
                // Test 2: Child clear - child loses parent connection
                const regularChild2 = parent.child("regular2", false);
                const snapshotChild2 = parent.child("snapshot2", true);
                
                // Both should see parent
                Assert.equal(1, regularChild2.size, "Regular child2 should see parent attribute");
                Assert.equal(1, snapshotChild2.size, "Snapshot child2 should see parent attribute");
                
                // Children clear themselves - they lose parent connection
                regularChild2.clear();
                snapshotChild2.clear();
                
                Assert.equal(0, regularChild2.size, "Regular child2 should be empty after its own clear");
                Assert.equal(0, snapshotChild2.size, "Snapshot child2 should be empty after its own clear");
                
                // Add another attribute to parent - cleared children should NOT see it (connection lost)
                parent.set("another.key", "another-value");
                Assert.equal(0, regularChild2.size, "Regular child2 should not see parent additions after its own clear");
                Assert.equal(0, snapshotChild2.size, "Snapshot child2 should not see parent additions after its own clear");
                
                // But the first regular child should still see it (it didn't clear itself)
                Assert.equal(2, regularChild1.size, "Regular child1 should see all parent attributes (it didn't clear itself)");
                Assert.equal("another-value", regularChild1.get("another.key"), "Regular child1 should get the latest parent value");
            }
        });
    }
}


