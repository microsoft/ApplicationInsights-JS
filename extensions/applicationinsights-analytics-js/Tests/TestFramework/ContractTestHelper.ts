/// <reference path="../../JavaScriptSDK/Serializer.ts" />
/// <reference path="./TestClass.ts"/>

class ContractTestHelper extends TestClass {

    public name: string;
    private initializer: () => Microsoft.ApplicationInsights.ISerializable;

    constructor(initializer: () => Microsoft.ApplicationInsights.ISerializable, name: string) {
        super();
        
        this.name = name;
        this.initializer = initializer;
    }

    /** Method called before the start of each test method */
    public testInitialize() {
    }

    /** Method called after each test method has completed */
    public testCleanup() {
    }

    public registerTests() {
        const name = this.name + ": ";
        this.testCase({
            name: name + "constructor does not throw errors",
            test: () => {
                this.getSubject(this.initializer, this.name);
            }
        });

        this.testCase({
            name: name + "serialization does not throw errors",
            test: () => {
                const subject = this.getSubject(this.initializer, this.name);
                this.serialize(subject, this.name);
            }
        });

        this.testCase({
            name: name + "all required fields are constructed",
            test: () => {
                this.allRequiredFieldsAreConstructed(this.initializer, this.name);
            }
        });

        this.testCase({
            name: name + "extra fields are removed upon serialization",
            test: () => {
                this.extraFieldsAreRemovedBySerializer(this.initializer, this.name);
            }
        });

        this.testCase({
            name: this.name + "optional fields are not required by the back end",
            test: () => {
                this.optionalFieldsAreNotRequired(this.initializer, this.name);
            }
        });

        this.testCase({
            name: this.name + "all fields are serialized if included",
            test: () => {
                this.allFieldsAreIncludedIfSpecified(this.initializer, this.name);
            }
        });
    }

    public checkSerializableObject(initializer: () => any, name: string) {
        this.allRequiredFieldsAreConstructed(initializer, name);
        this.extraFieldsAreRemovedBySerializer(initializer, name);
        this.allFieldsAreIncludedIfSpecified(initializer, name);
    }

    private allRequiredFieldsAreConstructed(initializer: () => any, name: string) {
        const subject = this.getSubject(initializer, name);
        for (const field in subject.aiDataContract) {
            if (subject.aiDataContract[field] & Microsoft.ApplicationInsights.FieldType.Required) {
                Assert.ok(subject[field] != null, "The required field '" + field + "' is constructed for: '" + name + "'");
            }
        }
    }

    private extraFieldsAreRemovedBySerializer(initializer: () => any, name: string) {
        const subject = this.getSubject(initializer, name);
        
        const extra = "extra";
        subject[extra + 0] = extra;
        subject[extra + 1] = extra;
        subject[extra + 3] = extra;

        const serializedSubject = this.serialize(subject, name);

        for (const field in serializedSubject) {
            Assert.ok(subject.aiDataContract[field] != null, "The field '" + field + "' exists in the contract for '" + name + "' and was serialized");
        }
    }

    private optionalFieldsAreNotRequired(initializer: () => any, name: string) {
        const subject = this.getSubject(this.initializer, this.name);
        
        for (const field in subject.aiDataContract) {
            if (!subject.aiDataContract[field]) {
                delete subject[field];
            }
        }
    }

    private allFieldsAreIncludedIfSpecified(initializer: () => any, name: string) {
        const subject = this.getSubject(this.initializer, this.name);
        
        for (const field in subject.aiDataContract) {
            subject[field] = field;
        }

        const serializedSubject = this.serialize(subject, this.name);

        for (field in subject.aiDataContract) {
            Assert.ok(serializedSubject[field] === field, "Field '" + field + "' was not serialized" + this.name);
        }

        for (field in serializedSubject) {
            Assert.ok(subject.aiDataContract[field] !== undefined, "Field '" + field + "' was included but is not specified in the contract " + this.name);
        }
    }

    private serialize(subject: Microsoft.ApplicationInsights.ISerializable, name: string) {
        let serialized = "";

        try {
            serialized = Microsoft.ApplicationInsights.Serializer.serialize(subject);
        } catch (e) {
            Assert.ok(false, "Failed to serialize '" + name + "'\r\n" + e);
        }

        return JSON.parse(serialized);
    }

    private getSubject(construction: () => Microsoft.ApplicationInsights.ISerializable, name: string): any {
        const subject = construction();
        Assert.ok(!!subject, "can construct " + name);

        return subject;
    }
}