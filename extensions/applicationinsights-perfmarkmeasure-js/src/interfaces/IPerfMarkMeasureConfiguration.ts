/**
* @copyright Microsoft 2021
*/

/**
  * PerfMarkMeasure Configuration
  */
export interface IPerfMarkMeasureConfiguration {

    /**
     * Should the Performance manager create and use window.performance.mark(), defaults to true
     */
    useMarks?: boolean;

    /**
     * Identifies the prefix for the mark, defaults to "ai.prfmrk.", the event name is appended for the mark
     */
    markPrefix?: string;

    /**
     * Make the marks and measures unique by appending a numeric value to the prefix value, defaults to false.
     * Marks and measure for the same perfEvent will be assigned the same unique numeric value
     */
    uniqueNames?: boolean;

    /**
     * Provides a mapping between the internal perf names and the value used to create the mark,
     * when a map is provided but no mapping is present that event will be ignored.
     *
     */
    markNameMap?: { [key: string]: string };

    /**
     * Should the Performance manager create a mark when the event is fired, defaults to false
     */
    useEndMarks?: boolean;

    /**
     * Identifies the prefix for the "end" mark of a perf event, defaults to "ai.prfmrk.end.", the event name is appended for the mark
     */
    markEndPrefix?: string;

    /**
     * Should the Performance manager create and use window.performance.measure(), defaults to true
     */
    useMeasures?: boolean;

    /**
     * Identifies the prefix for the mark, defaults to "ai.prfmsr.", the event name is appended for the measure name
     */
    measurePrefix?: string;
 
    /**
     * Provides a mapping between the internal perf names and the value used to create the measure,
     * when no measureNameMap is provided this will default to using the markNameMap and
     * when a map is provided but no mapping is present that event will be ignored.
     */
    measureNameMap?: { [key: string]: string };
  }
