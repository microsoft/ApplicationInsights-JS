# Span API End-to-End (E2E) Tests

This directory contains end-to-end tests for the new Span APIs that send real telemetry to Azure Application Insights (Breeze endpoint) for manual validation in the Azure Portal.

## 📁 Files

- **`SpanE2E.Tests.ts`** - Automated E2E test suite that can be configured to send real telemetry
- **`span-e2e-manual-test.html`** - Interactive HTML page for manual testing with visual feedback

## 🚀 Quick Start - Manual HTML Testing

The easiest way to test is using the interactive HTML page:

1. **Get your Application Insights credentials**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to your Application Insights resource (or create a new one)
   - Copy the **Instrumentation Key** or **Connection String** from the Overview page

2. **Open the test page**:
   ```bash
   # Option 1: Open directly in browser
   open AISKU/Tests/Manual/span-e2e-manual-test.html
   
   # Option 2: Serve via local web server
   cd AISKU/Tests/Manual
   python -m http.server 8080
   # Then open http://localhost:8080/span-e2e-manual-test.html
   ```

3. **Run tests**:
   - Paste your Instrumentation Key or Connection String
   - Click "Initialize SDK"
   - Run individual tests or click "Run All Tests"
   - Watch the output log for confirmation

4. **View results in Azure Portal**:
   - Wait 1-2 minutes for telemetry to arrive
   - Go to your Application Insights resource
   - Navigate to **Performance** → **Dependencies** or **Requests**
   - Use **Search** to find specific test scenarios
   - Click **"View in End-to-End Transaction"** to see distributed traces

## 🧪 Automated Test Suite

### Configuration

To run the automated test suite with real telemetry:

1. Open [`SpanE2E.Tests.ts`](../Unit/src/SpanE2E.Tests.ts)

2. Update the configuration:
   ```typescript
   // Set to true to send real telemetry
   private static readonly MANUAL_E2E_TEST = true;
   
   // Replace with your instrumentation key
   private static readonly _instrumentationKey = "YOUR-IKEY-HERE";
   ```

3. Run the tests:
   ```bash
   # From repository root
   rush build
   rush test
   ```

### Test Scenarios Included

The test suite covers:

#### Basic Span Tests
- ✅ CLIENT span → RemoteDependency
- ✅ SERVER span → Request  
- ✅ Failed span → success=false

#### Distributed Trace Tests
- ✅ Parent-child relationships
- ✅ 3-level nested hierarchy
- ✅ Context propagation

#### HTTP Dependency Tests
- ✅ Various HTTP methods (GET, POST, PUT, DELETE)
- ✅ Multiple status codes (2xx, 4xx, 5xx)
- ✅ Full HTTP details (headers, body size, response time)

#### Database Dependency Tests
- ✅ MySQL, PostgreSQL, MongoDB, Redis, SQL Server
- ✅ SQL statements and operations
- ✅ Slow query scenarios

#### Complex Scenarios
- ✅ E-commerce checkout flow (7 dependencies)
- ✅ Mixed success and failure operations
- ✅ Rich custom properties for filtering

## 🔍 What to Look For in the Portal

### Performance Blade

**Dependencies Tab**:
- Look for CLIENT, PRODUCER, and INTERNAL spans
- Verify dependency types (Http, mysql, postgresql, redis, etc.)
- Check duration, target, and result codes
- Examine custom properties in the details pane

**Requests Tab**:
- Look for SERVER and CONSUMER spans
- Verify URLs, methods, and status codes
- Check success/failure status
- View response codes and durations

### Search Feature

Filter by custom properties to find specific test runs:
```
customDimensions.test.scenario == "ecommerce"
customDimensions.test.timestamp >= datetime(2025-12-01)
customDimensions.business.tenant == "manual-test-corp"
```

### End-to-End Transaction View

1. Click any request or dependency
2. Click **"View in End-to-End Transaction"**
3. See the complete distributed trace:
   - Timeline showing span durations
   - Parent-child relationships
   - All related dependencies
   - Custom properties at each level

### Transaction Timeline

Look for:
- ✅ Correct parent-child relationships (indentation)
- ✅ Proper span nesting (visual hierarchy)
- ✅ Accurate duration calculations
- ✅ Operation IDs matching across spans
- ✅ Custom dimensions preserved throughout

## 📊 Expected Results

### Test: Basic CLIENT Span
- **Portal Location**: Performance → Dependencies
- **Dependency Type**: "Dependency" or "Http"
- **Custom Properties**: test.scenario, test.timestamp

### Test: Parent-Child Trace
- **Portal Location**: End-to-End Transaction view
- **Expected**: 1 Request + 2 Dependencies
- **Relationship**: Both children reference same parent operation.id

### Test: E-commerce Checkout
- **Portal Location**: End-to-End Transaction view
- **Expected**: 1 Request + 7 Dependencies
- **Types**: Http (inventory, payment, email), Database (create order), Redis (cache)
- **Duration**: Parent spans entire operation

### Test: Rich Custom Properties
- **Portal Location**: Search → Custom dimensions filter
- **Expected Properties**: 
  - business.tenant
  - user.subscription
  - feature.* flags
  - performance.* metrics

## 🐛 Troubleshooting

### Telemetry not appearing in portal

1. **Wait longer**: Initial ingestion can take 1-3 minutes
2. **Check time filter**: Ensure portal is showing last 30 minutes
3. **Verify iKey**: Confirm instrumentation key is correct
4. **Check browser console**: Look for SDK errors
5. **Flush telemetry**: Call `appInsights.flush()` in tests

### SDK initialization fails

1. **Valid credentials**: Verify instrumentation key format
2. **CORS issues**: Ensure application is running on http/https (not file://)
3. **Browser compatibility**: Use modern browser (Chrome, Edge, Firefox)

### Missing custom properties

1. **Property name limits**: Check for truncation (8192 char limit)
2. **Reserved names**: Some property names are filtered (http.*, db.*, microsoft.*)
3. **Type preservation**: Ensure values are correct types (string, number, boolean)

## 📝 Adding New Test Scenarios

To add a new E2E test scenario:

1. **In SpanE2E.Tests.ts**:
   ```typescript
   this.testCase({
       name: "E2E: Your new scenario",
       test: () => {
           const span = this._ai.startSpan("E2E-YourScenario", {
               kind: eOTelSpanKind.CLIENT,
               attributes: {
                   "test.scenario": "your-scenario",
                   "custom.property": "value"
               }
           });
           
           if (span) {
               span.setStatus({ code: eOTelSpanStatusCode.OK });
               span.end();
           }
           
           this._ai.flush();
           Assert.ok(span, "Span created");
       }
   });
   ```

2. **In span-e2e-manual-test.html**:
   ```javascript
   function testYourScenario() {
       if (!appInsights) return;
       
       const span = appInsights.startSpan('E2E-Manual-YourScenario', {
           kind: 1, // CLIENT
           attributes: {
               'test.scenario': 'your-scenario',
               'custom.property': 'value'
           }
       });
       
       if (span) {
           span.setStatus({ code: 1 });
           span.end();
           log('✅ Your scenario sent', 'success');
       }
       appInsights.flush();
   }
   ```

## 🎯 Best Practices

1. **Use descriptive names**: Prefix test spans with "E2E-" or "Manual-"
2. **Include timestamps**: Add test.timestamp for filtering
3. **Add scenario tags**: Use test.scenario for grouping
4. **Flush after tests**: Always call `flush()` to send immediately
5. **Wait before checking**: Give telemetry 1-2 minutes to arrive
6. **Use unique identifiers**: Help distinguish between test runs
7. **Clean up regularly**: Archive or delete old test data

## 🔗 Resources

- [Application Insights Overview](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/trace/api/)
- [Azure Portal](https://portal.azure.com)
- [Application Insights SDK Documentation](../../../README.md)

## 🤝 Contributing

When adding new E2E tests:
1. Follow existing naming conventions (E2E-* prefix)
2. Include relevant custom properties
3. Document expected portal behavior
4. Update this README with new scenarios
5. Test manually before committing
