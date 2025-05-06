/**
* Advisory options influencing aggregation configuration parameters.
* @experimental
*/
export interface IMetricAdvice {
    /**
     * Hint the explicit bucket boundaries for SDK if the metric is been
     * aggregated with a HistogramAggregator.
     */
    explicitBucketBoundaries?: number[];
}
