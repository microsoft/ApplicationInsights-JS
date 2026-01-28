import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { eDistributedTracingModes } from "../../../src/Enums";

/**
 * Helper function to check if a mode should include tracestate header
 * This matches the internal implementation in the SDK
 */
function _checkTraceStateBit(distributedTracingMode: eDistributedTracingModes): boolean {
    // Use the proper bitwise check for the _W3CTraceState flag (which is an actual bit flag)
    return (distributedTracingMode & eDistributedTracingModes._W3CTraceState) === eDistributedTracingModes._W3CTraceState;
}

/**
 * Tests for W3C TraceState Configuration with different distributed tracing modes
 */
export class W3CTraceStateModesTests extends AITestClass {
    
    public testInitialize() {
        // No special setup required
    }

    public testCleanup() {
        // No special cleanup required
    }

    public registerTests() {
        this.testCase({
            name: "W3CTraceStateModes: Bit masks work correctly for trace modes",
            test: () => {
                // Test AI_AND_W3C_TRACE mode
                var tracingMode = eDistributedTracingModes.AI_AND_W3C_TRACE;
                
                // Get the base mode using _BaseMask
                var baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert base mode equals AI_AND_W3C
                Assert.equal(baseMode, eDistributedTracingModes.AI_AND_W3C, 
                    "AI_AND_W3C_TRACE base mode should be AI_AND_W3C");
                
                // Assert W3C_TRACE bit is set (testing the _W3CTraceState bit)
                Assert.equal(true, _checkTraceStateBit(tracingMode), 
                    "AI_AND_W3C_TRACE should include _W3CTraceState bit");

                // Test W3C_TRACE mode
                tracingMode = eDistributedTracingModes.W3C_TRACE;
                
                // Get the base mode using _BaseMask
                baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert base mode equals W3C
                Assert.equal(baseMode, eDistributedTracingModes.W3C, 
                    "W3C_TRACE base mode should be W3C");
                
                // Assert it's not equal to AI mode
                Assert.notEqual(baseMode, eDistributedTracingModes.AI, 
                    "W3C_TRACE base mode should NOT be AI");
                
                // Assert W3C_TRACE bit is set
                Assert.equal(true, _checkTraceStateBit(tracingMode), 
                    "W3C_TRACE should include _W3CTraceState bit");

                // Test AI_AND_W3C mode (without the trace bit)
                tracingMode = eDistributedTracingModes.AI_AND_W3C;
                
                // Get base mode - for AI_AND_W3C it's already the base mode
                baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert it equals AI_AND_W3C
                Assert.equal(baseMode, eDistributedTracingModes.AI_AND_W3C, 
                    "AI_AND_W3C should be its own base mode");
                
                // Assert it's not equal to just AI mode
                Assert.notEqual(baseMode, eDistributedTracingModes.AI, 
                    "AI_AND_W3C should NOT be AI");
                
                // Assert W3C_TRACE bit is NOT set
                Assert.equal(false, _checkTraceStateBit(tracingMode), 
                    "AI_AND_W3C should NOT include _W3CTraceState bit");

                // Test W3C mode (without trace bit)
                tracingMode = eDistributedTracingModes.W3C;
                
                // Get the base mode - for W3C it's already the base mode
                baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert it equals W3C
                Assert.equal(baseMode, eDistributedTracingModes.W3C, 
                    "W3C should be its own base mode");
                
                // Assert it's not equal to AI mode
                Assert.notEqual(baseMode, eDistributedTracingModes.AI, 
                    "W3C should NOT be AI");
                
                // Assert W3C_TRACE bit is NOT set
                Assert.equal(false, _checkTraceStateBit(tracingMode), 
                    "W3C should NOT include _W3CTraceState bit");
            }
        });
        
        this.testCase({
            name: "W3CTraceStateModes: Changing mode dynamically updates tracestate header behavior",
            test: () => {
                // First set mode without tracestate bit
                var tracingMode = eDistributedTracingModes.AI_AND_W3C;
                
                // Verify no tracestate initially
                Assert.equal(false, _checkTraceStateBit(tracingMode), 
                    "AI_AND_W3C should NOT include _W3CTraceState bit");
                    
                // Change to mode with tracestate bit
                tracingMode = eDistributedTracingModes.AI_AND_W3C_TRACE;
                
                // Verify tracestate bit is now set
                Assert.equal(true, _checkTraceStateBit(tracingMode), 
                    "AI_AND_W3C_TRACE should include _W3CTraceState bit");
                    
                // Change to W3C_TRACE mode
                tracingMode = eDistributedTracingModes.W3C_TRACE;
                
                // Verify tracestate bit is still set
                Assert.equal(true, _checkTraceStateBit(tracingMode), 
                    "W3C_TRACE should include _W3CTraceState bit");
                
                // Get the base mode
                var baseMode2 = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert base mode is W3C and not AI
                Assert.equal(baseMode2, eDistributedTracingModes.W3C, 
                    "W3C_TRACE base mode should be W3C");
                Assert.notEqual(baseMode2, eDistributedTracingModes.AI, 
                    "W3C_TRACE base mode should NOT be AI");
                    
                // Verify bitmask calculations work correctly
                Assert.equal(eDistributedTracingModes.W3C_TRACE, 
                            eDistributedTracingModes.W3C | eDistributedTracingModes._W3CTraceState,
                    "W3C_TRACE should equal W3C | _W3CTraceState");
                    
                Assert.equal(eDistributedTracingModes.AI_AND_W3C_TRACE, 
                            eDistributedTracingModes.AI_AND_W3C | eDistributedTracingModes._W3CTraceState,
                    "AI_AND_W3C_TRACE should equal AI_AND_W3C | _W3CTraceState");
            }
        });
        
        this.testCase({
            name: "W3CTraceStateModes: _BaseMask correctly isolates base mode from tracestate bit",
            test: () => {
                // Test AI_AND_W3C_TRACE mode with _BaseMask
                var tracingMode = eDistributedTracingModes.AI_AND_W3C_TRACE;
                var baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert base mode equals AI_AND_W3C
                Assert.equal(baseMode, eDistributedTracingModes.AI_AND_W3C,
                    "Base mode of AI_AND_W3C_TRACE should be AI_AND_W3C");
                
                // Test W3C_TRACE mode with _BaseMask
                tracingMode = eDistributedTracingModes.W3C_TRACE;
                baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert base mode equals W3C
                Assert.equal(baseMode, eDistributedTracingModes.W3C,
                    "Base mode of W3C_TRACE should be W3C");
                
                // Test that masking doesn't affect modes without the trace bit
                tracingMode = eDistributedTracingModes.AI;
                baseMode = tracingMode & eDistributedTracingModes._BaseMask;
                
                // Assert base mode equals AI
                Assert.equal(baseMode, eDistributedTracingModes.AI,
                    "Base mode of AI should still be AI after applying mask");
            }
        });
        
        this.testCase({
            name: "W3CTraceStateModes: Enable and disable tracestate bit dynamically",
            test: () => {
                // Start with AI_AND_W3C mode
                var baseMode = eDistributedTracingModes.AI_AND_W3C;
                
                // Verify no tracestate initially
                Assert.equal(false, _checkTraceStateBit(baseMode), 
                    "AI_AND_W3C should NOT include _W3CTraceState bit initially");
                    
                // Add the tracestate bit (|= operation)
                var updatedMode = baseMode | eDistributedTracingModes._W3CTraceState;
                
                // Verify it equals AI_AND_W3C_TRACE
                Assert.equal(updatedMode, eDistributedTracingModes.AI_AND_W3C_TRACE,
                    "Adding _W3CTraceState bit should result in AI_AND_W3C_TRACE");
                
                // Verify tracestate bit is now set
                Assert.equal(true, _checkTraceStateBit(updatedMode), 
                    "Updated mode should include _W3CTraceState bit");
                
                // Remove the tracestate bit (& ~operation)
                var restoredMode = updatedMode & ~eDistributedTracingModes._W3CTraceState;
                
                // Verify it equals the original mode
                Assert.equal(restoredMode, baseMode,
                    "Removing _W3CTraceState bit should restore original mode");
                
                // Verify tracestate bit is no longer set
                Assert.equal(false, _checkTraceStateBit(restoredMode), 
                    "Restored mode should NOT include _W3CTraceState bit");
                
                // Start with W3C mode
                baseMode = eDistributedTracingModes.W3C;
                
                // Add the tracestate bit
                updatedMode = baseMode | eDistributedTracingModes._W3CTraceState;
                
                // Verify it equals W3C_TRACE
                Assert.equal(updatedMode, eDistributedTracingModes.W3C_TRACE,
                    "Adding _W3CTraceState bit to W3C should result in W3C_TRACE");
                
                // Remove the tracestate bit
                restoredMode = updatedMode & ~eDistributedTracingModes._W3CTraceState;
                
                // Verify it equals original W3C mode
                Assert.equal(restoredMode, eDistributedTracingModes.W3C,
                    "Removing _W3CTraceState bit should restore W3C mode");
            }
        });
    }
}
