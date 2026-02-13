# Customer-Facing SDKStats

## Owner

* [Leighton Chen](mailto:lechen@microsoft.com)

## Approvers

* [Hector Hernandez Guzman](mailto:hectorh@microsoft.com)
* [Jackson Weber](mailto:jacksonweber@microsoft.com)
* [Jeremy Voss](mailto:jeremyvoss@microsoft.com)
* [Rajkumar Rangaraj](mailto:rajkumar.rangaraj@microsoft.com)
* [Ram Thiru](mailto:Ram.Thiru@microsoft.com)

## Status

Stable

<details>
<summary>Table of Contents</summary>

<!-- toc -->

- [Customer-Facing SDKStats](#customer-facing-sdkstats)
  - [Owner](#owner)
  - [Approvers](#approvers)
  - [Status](#status)
  - [Overview](#overview)
  - [Specifications](#specifications)
    - [Key metrics](#key-metrics)
    - [Top-level fields](#top-level-fields)
      - [iKey](#ikey)
      - [SDKVersion](#sdkversion)
    - [Item success count](#item-success-count)
    - [Item dropped count](#item-dropped-count)
    - [Item retry count](#item-retry-count)
  - [Getting started](#getting-started)
  - [Environment Variable configurations](#environment-variable-configurations)
  - [Future considerations](#future-considerations)
    - [Include `cloud.*` fields as part of `customDimensions`](#include-cloud-fields-as-part-of-customdimensions)
  - [TBD](#tbd)
  - [Reference](#reference)

<!-- tocstop -->-

</details>

## Overview

SDKStats has proven to be valuable by providing insights into RP integration growth, tracking feature/instrumentation adoption, and monitoring success/failure counts for Application Insights SDKs across languages.
Recognizing the importance of sharing these metrics with customers, our leadership team aims to provide customers with access to specific network SDKStats metrics in their Application Insights resources,
enhancing their self-service experience.

To enable this functionality, we have decided to emit SDKStats as custom metrics to customers' resources.

Customers have the option to access these metrics either through the metric explorer on the portal or creating alerts based on Kusto query.

Customer-facing SDKStats metrics are uniquely identified by metrics' names as shown below.
Ingestion service can determine the type of SDKStats being sent based on metric names. These metrics are ingested into the customer's Application Insights resources.

## Specifications

### Key metrics

Metrics names should follow the OpenTelemetry Specification, more info in the [OpenTelemetry metrics API specification](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/metrics/api.md#instrument).

<!-- markdownlint-disable MD033 -->
| Metrics                                   | Description                                                       | Frequency | Required |
| ----------------------------------------- | ----------------------------------------------------------------- | --------- | -------- |
| [Item Success Count](#item-success-count) | Count of successful telemetry items sent to Application Insights. | *Short    | Yes      |
| [Item Dropped Count](#item-dropped-count) | Count of dropped telemetry items sent to Application Insights.    | *Short    | Yes      |
| [Item Retry Count](#item-retry-count)     | Count of retried telemetry items.                                 | *Short    | Yes      |
<!-- markdownlint-enable MD033 -->

*Short interval is once every 15 minutes.

**Note:** These metrics were chosen as the minimal set to send to customers. This is to reduce confusion while maintaining the necessary information to maximize the likelihood of customers' being able to troubleshoot telemetry
problems themselves (and reduce icm cases opened).

**Note:** `Item Success Count` and `Item Dropped Count` should theoretically add up to the total amount of telemetry items that are actually sent to the backend.

### Top-level fields

Almost all top-level fields of customer SDKStats metrics are automatically populated by ingestion and are the same as that of [Application Insights custom metric](https://msazure.visualstudio.com/One/_git/CommonSchema?path=/v4.0/Mappings/AzureMonitor-AI.md&_a=preview&anchor=microsoft.applicationinsights.metric).
The only exception is that of `sdkVersion`, `iKey`, `cloudRoleInstance` and `cloudRole` which need to be populated by the SDK itself.

**Note** that since we are trying to keep the payload as minimal as possible, we do not include any `operation.*` fields, as that information is not as relevant in terms of SDKStats analysis.
We can include `cloud.*` fields since there will be no PII violations when sending metrics to customers' own resource. These are also fields that enable customers to identify issues with specific apps or VMs, helping with targeted problem-solving.

#### iKey

This represents the instrumentation key of the customers' Application Insights resource this SDKStats telemetry is being sent to.

#### SDKVersion

[sdkVersion](../sdk_version_name.md) is crucial to include as part of SDKStats, as it allows us to identify
RP, Attach type, operating system, language, language version, SDK and SDK version from an encoded string. It
is currently used to filter out sdk name and sdk version for BI reports. `sdkVersion` has an inconsistent format and specifications have only been properly created for OpenTelemetry-based SDKs.

Therefore, it is crucial to have other indicators for language and version (such as the `customDimensions` defined for each Metric Type below).

### Item success count

This metric represents the cumulative item success count during the collection interval. A high and persistent item success count will help increase customers' confidence in using our products and services.

We send telemetry items in batches. Each batch can contain an array of metrics, logs, and traces. When Breeze returns a 200 status code, the SDK counts the number of telemetry items in the batch and accumulates it using the `Item Success Count` metric.

<!-- markdownlint-disable MD033 -->
| Telemetry Name       | Metric Name          | Unit  | customDimensions                                                                                                                                                                                                                                                                                                                        |
| -------------------- | -------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Item Success Count` | `Item_Success_Count` | Count | **compute.type**: The type of compute (aks, appsvc, functions, springcloud, vm, unknown) that the customer's application is running in <br> **language**: application insights SDK/Agent name <br> **version**: version of the application insights SDK/Agent <br> **telemetry_type**: Type of telemetry that this metric was counting. |
<!-- markdownlint-enable MD033 -->

\* **telemetry_type**

The `telemetry_type` field provides clarity on what kinds of data were dropped or ingested, aiding troubleshooting and system insights. The possible values correspond with table names in Application Insights. Below is a list of known values for `telemetry_type`:

`AVAILABILITY`
`CUSTOM_EVENT`
`CUSTOM_METRIC`
`DEPENDENCY`
`EXCEPTION`
`PAGE_VIEW`
`PERFORMANCE_COUNTER`
`REQUEST`
`TRACE`

This example shows 3000 item success count from a customer who uses the Java Distro 3.5.1 running Java 17.

```json
{
  "ver": 1,
  "name": "Item Success Count",
  "time": "2024-05-14T22:51:46.406Z",
  "iKey": "<CUSTOMER_INSTRUMENTATION_KEY>",
  "tags": {
    "ai.internal.sdkVersion": "java:3.5.1",
    "ai.cloud.roleInstance": "<CLOUD_ROLE_INSTANCE>",
    "ai.cloud.role": "<CLOUD_ROLE_NAME>"
  },
  "data": {
    "baseType": "MetricData",
    "baseData": {
      "ver": 2,
      "metrics": [
        {
          "name": "Item_Success_Count",
          "value": 3000.0
        }
      ],
      "properties": {
        "language": "java",
        "version": "3.5.1",
        "computeType": "unknown",
        "telemetry_type": "DEPENDENCY"
      }
    }
  }
}
```

### Item dropped count

This metric provides insights into the reasons for data loss, enabling customers, SDK teams, and the Ingestion service team to investigate the returned status codes and identify opportunities for reducing data loss.

We send telemetry items in batches. Each batch can contain an array of metrics, logs, and traces. When Breeze returns a [non-retryable](./sdkstats.md#retry-counts) status code or an exception is thrown while sending the telemetry, the SDK counts the number of telemetry items in the batch and accumulates it using the `Item Dropped Count` metric.

<!-- markdownlint-disable MD033 -->
| Telemetry Name       | Metric Name          | Unit  | customDimensions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Item Dropped Count` | `Item_Dropped_Count` | Count | **compute.type**: The type of compute (aks, appsvc, functions, springcloud, vm, unknown) that the customer's application is running in <br> **language**: application insights SDK/Agent name <br> **version**: version of the application insights SDK/Agent <br> **drop.code** <br> **drop.reason** <br> **telemetry_type**: Type of telemetry that this metric was counting. <br> **telemetry_success**: Boolean value indicating whether the tracked customer DEPENDENCY or REQUEST telemetry succeeded (true) or failed (false). Only applicable for DEPENDENCY and REQUEST telemetry types. |
<!-- markdownlint-enable MD033 -->

\* **drop.code** table below lists the drop codes for different situations that result in dropped items.

<!-- markdownlint-disable MD033 -->
| drop.code | Description |
| --------- | ----------- |
| CLIENT_EXCEPTION | items dropped due to exceptions thrown or when a response is not returned from Breeze |
| CLIENT_READONLY | items dropped due to READONLY filesystem |
| CLIENT_PERSISTENCE_CAPACITY | items dropped due to disk persistence capacity exceeds |
| CLIENT_STORAGE_DISABLED | items that would have been retried but are dropped since client has local storage disabled |
| `*NON_RETRYABLE_STATUS_CODE` | items dropped when breeze returns a [non-retryable](./sdkstats.md#retry-counts) status code |
<!-- markdownlint-enable MD033 -->

*NON_RETRYABLE_STATUS_CODE will be the actual value of the non-retryable status code that was returned (i.e. 401, 403, etc.).

\* **drop.reason** can be populated if `CLIENT_EXCEPTION` or a status code is the `drop.code`. Describes a informative, low-cardinality description of the exception or reason why the status code was returned. For `CLIENT_EXCEPTION`, the drop reason uses well known exception categories rather than raw exception messages. Categories include specific types (storage, timeout, etc.) with a generic fallback for unknown exceptions. The table below lists current well known exception categories:

| drop.reason       |
| ----------------- |
| Timeout exception |
| Network exception |
| Storage exception |
| Client exception  |

\* **telemetry_type**

The `telemetry_type` field provides clarity on what kinds of data were dropped or ingested, aiding troubleshooting and system insights. The possible values correspond with table names in Application Insights. Below is a list of known values for `telemetry_type`:

`AVAILABILITY`
`CUSTOM_EVENT`
`CUSTOM_METRIC`
`DEPENDENCY`
`EXCEPTION`
`PAGE_VIEW`
`PERFORMANCE_COUNTER`
`REQUEST`
`TRACE`

The below example shows 6 item drop count when a customer reaches their daily quota (status code 402).

```json

{
  "ver": 1,
  "name": "Item Dropped Count",
  "time": "<TIMESTAMP>",
  "iKey": "<CUSTOMER_INSTRUMENTATION_KEY>",
  "tags": {
    "ai.internal.sdkVersion": "java:3.5.1",
    "ai.cloud.roleInstance": "<CLOUD_ROLE_INSTANCE>",
    "ai.cloud.role": "<CLOUD_ROLE_NAME>"
  },
  "data": {
    "baseType": "MetricData",
    "baseData": {
      "ver": 2,
      "metrics": [
        {
          "name": "Item_Dropped_Count",
          "value": 6.0
        }
      ],
      "properties": {
        "language": "java",
        "version": "3.5.1",
        "computeType": "<COMPUTE_TYPE>",
        "drop.code": "402",
        "drop.reason": "Exceeded daily quota",
        "telemetry_type": "DEPENDENCY",
        "telemetry_success": false
      }
    }
  }
}
```

Here is another example that shows a 12 item drop count when a customer encounters a storage exception.

```json

{
  "ver": 1,
  "name": "Item Dropped Count",
  "time": "<TIMESTAMP>",
  "iKey": "<CUSTOMER_INSTRUMENTATION_KEY>",
  "tags": {
    "ai.internal.sdkVersion": "python:3.11.9",
    "ai.cloud.roleInstance": "<CLOUD_ROLE_INSTANCE>",
    "ai.cloud.role": "<CLOUD_ROLE_NAME>"
  },
  "data": {
    "baseType": "MetricData",
    "baseData": {
      "ver": 2,
      "metrics": [
        {
          "name": "Item_Dropped_Count",
          "value": 12.0
        }
      ],
      "properties": {
        "language": "python",
        "version": "3.11.9",
        "computeType": "<COMPUTE_TYPE>",
        "drop.code": "CLIENT_EXCEPTION",
        "drop.reason": "Storage exception",
        "telemetry_type": "DEPENDENCY",
      }
    }
  }
}
```

### Item retry count

This metric represents the cumulative item retry count during the collection interval.
Customers can benefit from this metric by gaining a better understanding of why the retry item count is high. For example, if they experience a high retry count of unauthorized (401) or forbidden (403) status codes, they might need to double-check their access permissions. Similarly, if they encounter a high retry count of too many requests (429), it could be an opportunity for them to evaluate their system for an upgrade to handle more requests.

<!-- markdownlint-disable MD033 -->
| Telemetry Name     | Metric Name        | Unit  | customDimensions                                                                                                                                                                                           |
| ------------------ | ------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Item Retry Count` | `Item_Retry_Count` | Count | **compute.type** (aks, appsvc, functions, springcloud, vm, unknown), language, version <br> **retry.code** <br> **retry.reason** <br> **telemetry_type**: Type of telemetry that this metric was counting. |
<!-- markdownlint-enable MD033 -->

**retry.code table below lists the retry codes for different situations that result in dropped items.

<!-- markdownlint-disable MD033 -->
| retry.code | Description |
| ---------- | ----------- |
| CLIENT_EXCEPTION | items to be retried when there is a runtime exception, like network failure, DNS name lookup failure excluding timeout exceptions that result in retryable scenarios. |
| CLIENT_TIMEOUT | items to be retried when there is a timeout exception |
| `*RETRYABLE_STATUS_CODE` | items to be retried when when breeze returns a [retryable](./sdkstats.md#retry-counts) status code |
<!-- markdownlint-enable MD033 -->

*RETRYABLE_STATUS_CODE will be the actual value of the retryable status code that was returned.

\* **retry.reason** can be populated if `CLIENT_EXCEPTION` or a status code is the `retry.code`. Describes a informative, low-cardinality description of the exception. For `CLIENT_EXCEPTION`, the exception categorization outlined in the [Item Dropped Count](#item-dropped-count) section is applied here as well to ensure uniformity across metrics.

\* **telemetry_type**

The `telemetry_type` field provides clarity on what kinds of data were dropped or ingested, aiding troubleshooting and system insights. The possible values correspond with table names in Application Insights. Below is a list of known values for `telemetry_type`:

`AVAILABILITY`
`CUSTOM_EVENT`
`CUSTOM_METRIC`
`DEPENDENCY`
`EXCEPTION`
`PAGE_VIEW`
`PERFORMANCE_COUNTER`
`REQUEST`
`TRACE`

Here is an example that shows 20 retry counts when Breeze returns a status code 429 (too many requests) for a customer using the Java distro 3.5.1 on AKS running Java 21.

```json
{
  "ver": 1,
  "name": "Item Retry Count",
  "time": "2024-05-14T22:51:46.406Z",
  "iKey": "<CUSTOMER_INSTRUMENTATION_KEY>",
  "tags": {
    "ai.internal.sdkVersion": "java:3.5.1",
    "ai.cloud.roleInstance": "<CLOUD_ROLE_INSTANCE>",
    "ai.cloud.role": "<CLOUD_ROLE_NAME>"
  },
  "data": {
    "baseType": "MetricData",
    "baseData": {
      "ver": 2,
      "metrics": [
        {
          "name": "Item_Retry_Count",
          "value": 20.0
        }
      ],
      "properties": {
        "language": "java",
        "version": "3.5.1",
        "computeType": "aks",
        "retry.code": "429",
        "retry.reason": "Too many requests"
      }
    }
  }
}
```

Here is another example that shows 20 retry counts when a TimeoutException happens on the client side using the Java distro 3.5.1 on AKS running Java 21.

```json
{
  "ver": 1,
  "name": "Item Retry Count",
  "time": "2024-05-14T22:51:46.406Z",
  "iKey": "<CUSTOMER_INSTRUMENTATION_KEY>",
  "tags": {
    "ai.internal.sdkVersion": "java:3.5.1",
    "ai.cloud.roleInstance": "<CLOUD_ROLE_INSTANCE>",
    "ai.cloud.role": "<CLOUD_ROLE_NAME>"
  },
  "data": {
    "baseType": "MetricData",
    "baseData": {
      "ver": 2,
      "metrics": [
        {
          "name": "Item_Retry_Count",
          "value": 20.0
        }
      ],
      "properties": {
        "language": "java",
        "version": "3.5.1",
        "computeType": "aks",
        "retry.code": "CLIENT_TIMEOUT",
        "exception.message": "TimeoutException: timeout while sending telemetry"
      }
    }
  }
}
```

## Getting started

Customers can access the success count, item drop count and item retry count metrics through the Application Insights portal by navigating to their Application Insights resource, which contains a dedicated dashboard for easier access and analysis.

![Where to find the customer sdk stats dashboard on Application Insights resource](../../Media/customer-sdk-stats-dashboard.png)

## Environment Variable configurations

`Enabled`

Currently, all customer sdk stats [metrics](#key-metrics) are on-by-default. In order to stop sending these metrics, users can disable this feature by setting environment variable `APPLICATIONINSIGHTS_SDKSTATS_DISABLED` to `true`.

`shortInterval`

* SDKs MAY provide users an optional configuration for changing the short export interval, which currently defaults to 15 minutes/900 seconds.
* Configured through `APPLICATIONINSIGHTS_SDKSTATS_EXPORT_INTERVAL` in seconds

## Migrations for existing implementations

- For implementations that supported these metrics as opt-in and are deciding to move to on=by-default, backwards compatabilty does NOT have to be maintained for the old environment variable `APPLICATIONINSIGHTS_SDKSTATS_ENABLED_PREVIEW`. The new environment variable will also ALWAYS take priority over the opt-in environment variable. Newer versions of the SDK that support on-by-default can also ignore the `APPLICATIONINSIGHTS_SDKSTATS_ENABLED_PREVIEW` environment variable moving forward.

- For SDK implementations that supported the old `preview.*` naming conventions, SDKs MUST start sending the new metric names if deciding to move this feature to on-by-default. The old naming conventions will be aggregated together with the new names in the dashboards.

## Future considerations

### Include `cloud.*` fields as part of `customDimensions`

The fields `cloud_RoleName` and `cloud_RoleInstance` are already queryable in logs. In the future, we may consider adding these as custom dimensions, which will be mapped to metrics dimensions in MDM for enhanced querying and alerts. This is not as high of a priority since customers are already able to do this today with log querying.

## TBD

1. To enable or disable this feature, we will provide customers with configuration options such as:

- Allow configuration of which SDKStats metrics to collect by default
- Kill switch configuration in Control Plane

## Reference

[Status codes from Breeze](../sdk_behavior_breeze.md)
[Internal SDKStats spec](./sdkstats.md)