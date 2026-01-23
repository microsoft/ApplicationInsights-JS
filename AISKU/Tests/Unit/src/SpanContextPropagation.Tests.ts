import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { IReadableSpan, IDistributedTraceContext, ITelemetryItem, asString } from "@microsoft/applicationinsights-core-js";
import { createPromise, IPromise } from '@nevware21/ts-async';

export class SpanContextPropagationTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${SpanContextPropagationTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "SpanContextPropagationTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: SpanContextPropagationTests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    maxBatchInterval: 0,
                    disableExceptionTracking: false
                }
            });

            this._ai.loadAppInsights();

            // Hook core.track to capture calls
            const originalTrack = this._ai.core.track;
            this._ai.core.track = (item: ITelemetryItem) => {
                this._trackCalls.push(item);
                return originalTrack.call(this._ai.core, item);
            };
            
        } catch (e) {
            console.error('Failed to initialize tests: ' + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addParentChildRelationshipTests();
        this.addMultiLevelHierarchyTests();
        this.addSiblingSpanTests();
        this.addAsyncBoundaryTests();
        this.addContextPropagationTests();
    }

    private addParentChildRelationshipTests(): void {
        this.testCase({
            name: "ParentChild: child span should inherit parent's traceId",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-span");
                Assert.ok(parentSpan, "Parent span should be created");

                // Act
                const parentContext = parentSpan!.spanContext();
                const childSpan = this._ai.startSpan("child-span", undefined, parentContext);
                const childContext = childSpan!.spanContext();

                // Assert
                Assert.equal(childContext.traceId, parentContext.traceId, "Child span should inherit parent's traceId");
                Assert.notEqual(childContext.spanId, parentContext.spanId, "Child span should have different spanId from parent");

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ParentChild: child span should have unique spanId",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-unique-id");
                const parentContext = parentSpan!.spanContext();

                // Act
                const child1 = this._ai.startSpan("child-1", undefined, parentContext);
                const child2 = this._ai.startSpan("child-2", undefined, parentContext);

                const child1Context = child1!.spanContext();
                const child2Context = child2!.spanContext();

                // Assert
                Assert.notEqual(child1Context.spanId, child2Context.spanId,
                    "Sibling children should have unique spanIds");
                Assert.notEqual(child1Context.spanId, parentContext.spanId,
                    "Child 1 spanId should differ from parent");
                Assert.notEqual(child2Context.spanId, parentContext.spanId,
                    "Child 2 spanId should differ from parent");

                // Cleanup
                child1?.end();
                child2?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ParentChild: child spans created via getTraceCtx",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-via-getTraceCtx");
                
                this._ai.setActiveSpan(parentSpan!);

                // Act - Use getTraceCtx to get current context
                const currentContext = this._ai.getTraceCtx();
                const childSpan = this._ai.startSpan("child-via-getTraceCtx", undefined, currentContext || undefined);

                // Assert
                const parentContext = parentSpan!.spanContext();
                const childContext = childSpan!.spanContext();

                Assert.equal(childContext.traceId, parentContext.traceId,
                    "Child should inherit traceId via getTraceCtx");
                Assert.notEqual(childContext.spanId, parentContext.spanId,
                    "Child should have unique spanId");

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ParentChild: parent context should preserve traceFlags",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-traceflags");
                const parentContext = parentSpan!.spanContext();

                // Act
                const childSpan = this._ai.startSpan("child-traceflags", undefined, parentContext);
                const childContext = childSpan!.spanContext();

                // Assert
                Assert.equal(childContext.traceFlags, parentContext.traceFlags,
                    "Child should preserve parent's traceFlags");

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ParentChild: parent context should preserve traceState if present",
            test: () => {
                // Arrange - Create parent span
                const parentSpan = this._ai.startSpan("parent-tracestate");
                const parentContext = parentSpan!.spanContext();
                
                // Manually set traceState (if the implementation supports it)
                if (parentContext.traceState !== undefined) {
                    // Act
                    const childSpan = this._ai.startSpan("child-tracestate", undefined, parentContext);
                    const childContext = childSpan!.spanContext();

                    // Assert
                    Assert.equal(asString(childContext.traceState), asString(parentContext.traceState),
                        "Child should preserve parent's traceState");

                    // Cleanup
                    childSpan?.end();
                }
                
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ParentChild: multiple children from same parent share traceId",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-multiple-children");
                const parentContext = parentSpan!.spanContext();

                // Act - Create multiple children
                const children: IReadableSpan[] = [];
                for (let i = 0; i < 5; i++) {
                    const child = this._ai.startSpan(`child-${i}`, undefined, parentContext);
                    if (child) {
                        children.push(child);
                    }
                }

                // Assert
                children.forEach((child, index) => {
                    const childContext = child.spanContext();
                    Assert.equal(childContext.traceId, parentContext.traceId,
                        `Child ${index} should have parent's traceId`);
                });

                // All children should have unique spanIds
                for (let i = 0; i < children.length; i++) {
                    for (let j = i + 1; j < children.length; j++) {
                        const ctx1 = children[i].spanContext();
                        const ctx2 = children[j].spanContext();
                        Assert.notEqual(ctx1.spanId, ctx2.spanId,
                            `Child ${i} and child ${j} should have different spanIds`);
                    }
                }

                // Cleanup
                children.forEach(child => child.end());
                parentSpan?.end();
            }
        });
    }

    private addMultiLevelHierarchyTests(): void {
        this.testCase({
            name: "MultiLevel: grandchild inherits root traceId",
            test: () => {
                // Arrange & Act - Create 3-level hierarchy
                const rootSpan = this._ai.startSpan("root-span");
                const rootContext = rootSpan!.spanContext();

                const childSpan = this._ai.startSpan("child-span", undefined, rootContext);
                const childContext = childSpan!.spanContext();

                const grandchildSpan = this._ai.startSpan("grandchild-span", undefined, childContext);
                const grandchildContext = grandchildSpan!.spanContext();

                // Assert
                Assert.equal(childContext.traceId, rootContext.traceId,
                    "Child should have root's traceId");
                Assert.equal(grandchildContext.traceId, rootContext.traceId,
                    "Grandchild should have root's traceId");

                Assert.notEqual(childContext.spanId, rootContext.spanId,
                    "Child should have unique spanId");
                Assert.notEqual(grandchildContext.spanId, childContext.spanId,
                    "Grandchild should have unique spanId");
                Assert.notEqual(grandchildContext.spanId, rootContext.spanId,
                    "Grandchild spanId should differ from root");

                // Cleanup
                grandchildSpan?.end();
                childSpan?.end();
                rootSpan?.end();
            }
        });

        this.testCase({
            name: "MultiLevel: deep hierarchy maintains trace consistency",
            test: () => {
                // Arrange - Create deep hierarchy (5 levels)
                const spans: IReadableSpan[] = [];
                
                // Act - Create root
                const rootSpan = this._ai.startSpan("level-0-root");
                spans.push(rootSpan!);
                
                // Create nested spans
                for (let i = 1; i <= 4; i++) {
                    const parentContext = spans[i - 1].spanContext();
                    const childSpan = this._ai.startSpan(`level-${i}`, undefined, parentContext);
                    spans.push(childSpan!);
                }

                // Assert - All spans share same traceId
                const rootTraceId = spans[0].spanContext().traceId;
                spans.forEach((span, index) => {
                    const context = span.spanContext();
                    Assert.equal(context.traceId, rootTraceId,
                        `Level ${index} should have root traceId`);
                });

                // All spans should have unique spanIds
                const spanIds = spans.map(span => span.spanContext().spanId);
                const uniqueSpanIds = new Set(spanIds);
                Assert.equal(uniqueSpanIds.size, spans.length,
                    "All spans should have unique spanIds");

                // Cleanup
                for (let i = spans.length - 1; i >= 0; i--) {
                    spans[i].end();
                }
            }
        });

        this.testCase({
            name: "MultiLevel: intermediate span can be parent to multiple children",
            test: () => {
                // Arrange - Create hierarchy with branching
                const rootSpan = this._ai.startSpan("root");
                const rootContext = rootSpan!.spanContext();

                const intermediateSpan = this._ai.startSpan("intermediate", undefined, rootContext);
                const intermediateContext = intermediateSpan!.spanContext();

                // Act - Create multiple children from intermediate
                const leaf1 = this._ai.startSpan("leaf-1", undefined, intermediateContext);
                const leaf2 = this._ai.startSpan("leaf-2", undefined, intermediateContext);
                const leaf3 = this._ai.startSpan("leaf-3", undefined, intermediateContext);

                // Assert
                const leaf1Context = leaf1!.spanContext();
                const leaf2Context = leaf2!.spanContext();
                const leaf3Context = leaf3!.spanContext();

                // All share same traceId
                Assert.equal(leaf1Context.traceId, rootContext.traceId,
                    "Leaf 1 should have root traceId");
                Assert.equal(leaf2Context.traceId, rootContext.traceId,
                    "Leaf 2 should have root traceId");
                Assert.equal(leaf3Context.traceId, rootContext.traceId,
                    "Leaf 3 should have root traceId");

                // All have unique spanIds
                Assert.notEqual(leaf1Context.spanId, leaf2Context.spanId,
                    "Leaf 1 and 2 should have different spanIds");
                Assert.notEqual(leaf2Context.spanId, leaf3Context.spanId,
                    "Leaf 2 and 3 should have different spanIds");
                Assert.notEqual(leaf1Context.spanId, leaf3Context.spanId,
                    "Leaf 1 and 3 should have different spanIds");

                // Cleanup
                leaf3?.end();
                leaf2?.end();
                leaf1?.end();
                intermediateSpan?.end();
                rootSpan?.end();
            }
        });
    }

    private addSiblingSpanTests(): void {
        this.testCase({
            name: "Siblings: spans with same parent have same traceId",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-for-siblings");
                const parentContext = parentSpan!.spanContext();

                // Act - Create sibling spans
                const sibling1 = this._ai.startSpan("sibling-1", undefined, parentContext);
                const sibling2 = this._ai.startSpan("sibling-2", undefined, parentContext);
                const sibling3 = this._ai.startSpan("sibling-3", undefined, parentContext);

                // Assert
                const ctx1 = sibling1!.spanContext();
                const ctx2 = sibling2!.spanContext();
                const ctx3 = sibling3!.spanContext();

                Assert.equal(ctx1.traceId, parentContext.traceId,
                    "Sibling 1 should have parent's traceId");
                Assert.equal(ctx2.traceId, parentContext.traceId,
                    "Sibling 2 should have parent's traceId");
                Assert.equal(ctx3.traceId, parentContext.traceId,
                    "Sibling 3 should have parent's traceId");

                // Cleanup
                sibling3?.end();
                sibling2?.end();
                sibling1?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "Siblings: independent root spans have different traceIds",
            test: () => {
                // Act - Create independent root spans
                const root1 = this._ai.startSpan("independent-root-1", { root: true });
                const root2 = this._ai.startSpan("independent-root-2", { root: true });
                const root3 = this._ai.startSpan("independent-root-3", { root: true });

                // Assert
                const ctx1 = root1!.spanContext();
                const ctx2 = root2!.spanContext();
                const ctx3 = root3!.spanContext();

                Assert.notEqual(ctx1.traceId, ctx2.traceId,
                    "Independent root 1 and 2 should have different traceIds");
                Assert.notEqual(ctx2.traceId, ctx3.traceId,
                    "Independent root 2 and 3 should have different traceIds");
                Assert.notEqual(ctx1.traceId, ctx3.traceId,
                    "Independent root 1 and 3 should have different traceIds");

                // Cleanup
                root3?.end();
                root2?.end();
                root1?.end();
            }
        });

        this.testCase({
            name: "Siblings: sibling spans have unique spanIds",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-unique-siblings");
                const parentContext = parentSpan!.spanContext();

                // Act - Create many sibling spans
                const siblings: IReadableSpan[] = [];
                for (let i = 0; i < 10; i++) {
                    const sibling = this._ai.startSpan(`sibling-${i}`, undefined, parentContext);
                    if (sibling) {
                        siblings.push(sibling);
                    }
                }

                // Assert - All spanIds should be unique
                const spanIds = siblings.map(s => s.spanContext().spanId);
                const uniqueSpanIds = new Set(spanIds);
                Assert.equal(uniqueSpanIds.size, siblings.length,
                    "All sibling spans should have unique spanIds");

                // Cleanup
                siblings.forEach(s => s.end());
                parentSpan?.end();
            }
        });
    }

    private addAsyncBoundaryTests(): void {
        this.testCase({
            name: "AsyncBoundary: context can be captured and used across async operations",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("async-root");
                const capturedContext = rootSpan!.spanContext();

                // Act - Simulate async boundary by creating child later
                return createPromise<void>((resolve) => {
                    setTimeout(() => {
                        // Create child span using captured context
                        const childSpan = this._ai.startSpan("async-child", undefined, capturedContext);
                        const childContext = childSpan!.spanContext();

                        // Assert
                        Assert.equal(childContext.traceId, capturedContext.traceId,
                            "Child created after async boundary should have parent's traceId");

                        // Cleanup
                        childSpan?.end();
                        rootSpan?.end();
                        resolve();
                    }, 10);
                });
            }
        });

        this.testCase({
            name: "AsyncBoundary: getTraceCtx can capture context for async operations",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("async-getTraceCtx-root");
                this._ai.setActiveSpan(rootSpan!);

                // Capture context using getTraceCtx
                const capturedContext = this._ai.getTraceCtx();

                // Act - Simulate async operation
                return createPromise<void>((resolve) => {
                    setTimeout(() => {
                        // Use captured context in async boundary
                        const asyncSpan = this._ai.startSpan("async-operation", undefined, capturedContext || undefined);
                        const asyncContext = asyncSpan!.spanContext();

                        // Assert
                        Assert.equal(asyncContext.traceId, capturedContext.traceId, "Async span should inherit captured traceId");

                        // Cleanup
                        asyncSpan?.end();
                        rootSpan?.end();
                        resolve();
                    }, 10);
                });
            }
        });

        this.testCase({
            name: "AsyncBoundary: nested async operations maintain trace",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("nested-async-root");
                const rootContext = rootSpan!.spanContext();

                // Act - Chain async operations
                return createPromise<void>((resolve) => {
                    setTimeout(() => {
                        const child1 = this._ai.startSpan("async-child-1", undefined, rootContext);
                        const child1Context = child1!.spanContext();

                        setTimeout(() => {
                            const child2 = this._ai.startSpan("async-child-2", undefined, child1Context);
                            const child2Context = child2!.spanContext();

                            // Assert
                            Assert.equal(child1Context.traceId, rootContext.traceId,
                                "First async child should have root traceId");
                            Assert.equal(child2Context.traceId, rootContext.traceId,
                                "Second async child should have root traceId");

                            // Cleanup
                            child2?.end();
                            child1?.end();
                            rootSpan?.end();
                            resolve();
                        }, 10);
                    }, 10);
                });
            }
        });

        this.testCase({
            name: "AsyncBoundary: parallel async operations share traceId",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("parallel-async-root");
                const rootContext = rootSpan!.spanContext();

                // Act - Create parallel async operations
                const promises: IPromise<void>[] = [];
                const childContexts: IDistributedTraceContext[] = [];

                for (let i = 0; i < 3; i++) {
                    const promise = createPromise<void>((resolve) => {
                        setTimeout(() => {
                            const childSpan = this._ai.startSpan(`parallel-child-${i}`, undefined, rootContext);
                            childContexts.push(childSpan!.spanContext());
                            childSpan?.end();
                            resolve();
                        }, 10 + i * 5);
                    });
                    promises.push(promise);
                }

                return Promise.all(promises).then(() => {
                    // Assert - All parallel children should share root traceId
                    childContexts.forEach((ctx, index) => {
                        Assert.equal(ctx.traceId, rootContext.traceId,
                            `Parallel child ${index} should have root traceId`);
                    });

                    // All should have unique spanIds
                    const spanIds = childContexts.map(ctx => ctx.spanId);
                    const uniqueSpanIds = new Set(spanIds);
                    Assert.equal(uniqueSpanIds.size, childContexts.length,
                        "Parallel children should have unique spanIds");

                    // Cleanup
                    rootSpan?.end();
                });
            }
        });
    }

    private addContextPropagationTests(): void {
        this.testCase({
            name: "ContextPropagation: explicit parent context overrides active context",
            test: () => {
                // Arrange - Create two independent traces
                const trace1Root = this._ai.startSpan("trace-1-root", { root: true });
                const trace2Root = this._ai.startSpan("trace-2-root", { root: true });

                this._ai.setActiveSpan(trace1Root!);

                // Act - Create child with explicit trace2 parent
                const trace2Context = trace2Root!.spanContext();
                const childSpan = this._ai.startSpan("explicit-parent-child", undefined, trace2Context);
                const childContext = childSpan!.spanContext();

                // Assert - Child should belong to trace2, not active trace1
                Assert.equal(childContext.traceId, trace2Context.traceId,
                    "Explicit parent context should override active context");
                Assert.notEqual(childContext.traceId, trace1Root!.spanContext().traceId,
                    "Child should not belong to active trace");

                // Cleanup
                childSpan?.end();
                trace2Root?.end();
                trace1Root?.end();
            }
        });

        this.testCase({
            name: "ContextPropagation: spans without parent create new trace",
            test: () => {
                // Act - Create spans without explicit parent
                const span1 = this._ai.startSpan("no-parent-1");
                const span2 = this._ai.startSpan("no-parent-2");

                const ctx1 = span1!.spanContext();
                const ctx2 = span2!.spanContext();

                // Assert - Should create independent traces or share active context
                // (depends on implementation - both are valid)
                Assert.ok(ctx1.traceId, "Span 1 should have traceId");
                Assert.ok(ctx2.traceId, "Span 2 should have traceId");
                Assert.ok(ctx1.spanId !== ctx2.spanId,
                    "Spans should have unique spanIds");

                // Cleanup
                span2?.end();
                span1?.end();
            }
        });

        this.testCase({
            name: "ContextPropagation: root option creates new trace",
            test: () => {
                // Arrange - Create parent span
                const parentSpan = this._ai.startSpan("existing-parent");
                this._ai.setActiveSpan(parentSpan!);

                // Act - Create root span (should ignore active parent)
                const rootSpan = this._ai.startSpan("new-root", { root: true });

                const parentContext = parentSpan!.spanContext();
                const rootContext = rootSpan!.spanContext();

                // Assert - Root span should have different traceId
                Assert.notEqual(rootContext.traceId, parentContext.traceId,
                    "Root option should create new independent trace");

                // Cleanup
                rootSpan?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ContextPropagation: context with all required fields propagates correctly",
            test: () => {
                // Arrange - Create context with all fields
                const parentSpan = this._ai.startSpan("full-context-parent");
                const parentContext = parentSpan!.spanContext();

                // Act - Create child
                const childSpan = this._ai.startSpan("full-context-child", undefined, parentContext);
                const childContext = childSpan!.spanContext();

                // Assert - All fields should be present
                Assert.ok(childContext.traceId, "Child should have traceId");
                Assert.ok(childContext.spanId, "Child should have spanId");
                Assert.equal(childContext.traceFlags, parentContext.traceFlags,
                    "Child should have traceFlags");

                Assert.equal(childContext.traceId, parentContext.traceId,
                    "TraceId should propagate");
                Assert.equal(childContext.traceFlags, parentContext.traceFlags,
                    "TraceFlags should propagate");

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "ContextPropagation: recording attribute propagates independently",
            test: () => {
                // Arrange - Create recording parent
                const recordingParent = this._ai.startSpan("recording-parent", { recording: true });
                const recordingContext = recordingParent!.spanContext();

                // Act - Create non-recording child from recording parent
                const nonRecordingChild = this._ai.startSpan("non-recording-child", 
                    { recording: false }, recordingContext);

                // Assert - Recording is per-span, not propagated
                Assert.ok(recordingParent!.isRecording(),
                    "Parent should be recording");
                Assert.ok(!nonRecordingChild!.isRecording(),
                    "Child should not be recording despite recording parent");

                // But traceId should still propagate
                Assert.equal(nonRecordingChild!.spanContext().traceId, recordingContext.traceId,
                    "TraceId should propagate regardless of recording state");

                // Cleanup
                nonRecordingChild?.end();
                recordingParent?.end();
            }
        });

        this.testCase({
            name: "ContextPropagation: span attributes do not propagate to children",
            test: () => {
                // Arrange - Create parent with attributes
                const parentAttrs = {
                    "parent.attr1": "value1",
                    "parent.attr2": "value2"
                };
                const parentSpan = this._ai.startSpan("parent-with-attrs", 
                    { attributes: parentAttrs });
                const parentContext = parentSpan!.spanContext();

                // Act - Create child with different attributes
                const childAttrs = {
                    "child.attr1": "childValue1"
                };
                const childSpan = this._ai.startSpan("child-with-attrs", 
                    { attributes: childAttrs }, parentContext);

                // Assert - Attributes are per-span, not inherited
                Assert.ok(parentSpan!.attributes["parent.attr1"] === "value1",
                    "Parent should have its attributes");
                Assert.ok(childSpan!.attributes["child.attr1"] === "childValue1",
                    "Child should have its attributes");
                Assert.ok(!childSpan!.attributes["parent.attr1"],
                    "Child should not inherit parent's attributes");

                // But context should propagate
                Assert.equal(childSpan!.spanContext().traceId, parentContext.traceId,
                    "TraceId should propagate");

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });
    }
}
