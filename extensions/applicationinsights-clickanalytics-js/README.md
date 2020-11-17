# Microsoft Application Insights JavaScript SDK - Click Analytics Plugin

Click Analytics Plugin for the Application Insights Javascript SDK, enables automatic tracking of the click events on web pages based on `data-\*` meta tags.
This plugin uses the `data-\*` global attributes to capture the click events and populate telemetry data.

## Some insights to effectively use the plugin

1.  If the clicked HTML element donot have the `data-\*` attribute and if the `useDefaultContentName` flag is set to true, the plugin captures the `id` and the standard HTML attribute for contentName.
2.  `customDataPrefix` provided by user should always start with `data-`, for example `data-sample-`. The reasoning behind this is that, in HTML the `data-\*` global attributes form a class of attributes called custom data attributes, that allow proprietary information to be exchanged between the HTML and its DOM representation by scripts.
    The \* may be replaced by any name following the [production rule of XML names](https://www.w3.org/TR/REC-xml/#NT-Name) with the following restrictions:

        - the name must not start with xml, whatever case is used for these letters;
        - the name must not contain any semicolon (U+003A);
        - the name must not contain capital letters.

## Getting Started

## NPM Setup (ignore if using Snippet Setup)

Install npm package:

```bash
npm install --save @microsoft/applicationinsights-clickanalytics-js @microsoft/applicationinsights-web
```

```js
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { DebugPlugin } from " @microsoft/applicationinsights-clickanalytics-js";

const clickPluginInstance = new ClickAnalyticsPlugin();
// Click Analytics configuration
const clickPluginConfig = {
  autoCapture: true,
};
// Application Insights Configuration
const configObj = {
  instrumentationKey: "YOUR INSTRUMENTATION KEY",
  extensions: [clickPluginInstance],
  extensionConfig: {
    [clickPluginInstance.identifier]: clickPluginConfig,
  },
};

const appInsights = new ApplicationInsights({ config: configObj });
appInsights.loadAppInsights();
```

## Consuming via the CDN using the Snippet Setup (Ignore if using NPM Setup)

```html
<script
  type="text/javascript"
  src="https://js.monitor.azure.com/scripts/b/ai.2.min.js"
></script>
<script type="text/javascript" src="cdnPathToCLickAnalyticsJS"></script>

<script type="text/javascript">
  var clickPluginInstance = new Microsoft.ApplicationInsights.ClickAnalyticsPlugin();
  // Click Analytics configuration
  var clickPluginConfig = {
    autoCapture: true,
  };
  // Application Insights Configuration
  var configObj = {
    instrumentationKey: "YOUR INSTRUMENTATION KEY",
    extensions: [clickPluginInstance],
    extensionConfig: {
      [clickPluginInstance.identifier]: clickPluginConfig,
    },
  };

  var appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({
    config: configObj,
  });
  appInsights.loadAppInsights();
</script>
```

## Configuration

| Name                  | Type               | Default | Description                                                                                                                              |
| --------------------- | ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| autoCapture           | boolean            | true    | Automatic capture configuration.                                                                                                         |
| callback              | IValueCallback     | null    | Callbacks configuration                                                                                                                  |
| pageTags              | string             | null    | Page tags                                                                                                                                |
| dataTags              | ICustomDataTags    | null    | Custom Data Tags provided to ovverride default tags used to capture click data.                                                          |
| urlCollectHash        | boolean            | false   | Enables the logging of values after a "#" character of the URL.                                                                          |
| urlCollectQuery       | boolean            | false   | Enables the logging of the query string of the URL.                                                                                      |
| behaviorValidator     | Function           | null    | Callback function to use for the `data-\*-bhvr` value validation. For more information click [here](#behaviorValidator)                  |
| defaultRightClickBhvr | string (or) number | ''      | Default Behavior value when Right Click event has occured. This value will be overriden if the element has the `data-\*-bhvr` attribute. |

## IValueCallback

| Name               | Type     | Default | Description                                                                             |
| ------------------ | -------- | ------- | --------------------------------------------------------------------------------------- |
| pageName           | Function | null    | Function to override the default pageName capturing behavior.                           |
| pageActionPageTags | Function | null    | A callback function to augument the default pageTags collected during pageAction event. |
| contentName        | Function | null    | A callback function to populate customized contentName.                                 |

## ICustomDataTags

| Name                      | Type    | Default   | Description                                                                                                                                                                              |
| ------------------------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| useDefaultContentName     | boolean | false     | When a particular element is not tagged with default customDataPrefix or customDataPrefix is not provided by user, this flag is used to collect standard HTML attribute for contentName. |
| customDataPrefix          | string  | `data-`   | Automatic capture content name and value of elements which are tagged with provided prefix.                                                                                              |
| aiBlobAttributeTag        | string  | `ai-blob` | Plugin supports a JSON blob content meta data tagging instead of individual `data-\*` attributes.                                                                                        |
| metaDataPrefix            | string  | null      | Automatic capture HTML Head's meta element name and content with provided prefix.                                                                                                        |
| captureAllMetaDataContent | string  | null      | Automatic capture all HTML Head's meta element names and content. Default is false. If enabled this will override provided metaDataPrefix.                                               |
| parentDataTag             | string  | null      | Stop traversing up the DOM to capture content name and value of elements when encountered with this tag.                                                                                 |
| dntDataTag                | string  | `ai-dnt`  | HTML elements with this attribute will be ignored by the plugin for capturing telemetry data.                                                                                            |

## behaviorValidator

There are three different behaviorValidator callback functions exposed as part of this extension. Users can also bring their own callback functions if the exposed functions donot solve their requirements. The basic idea is to bring your own behaviors datastructure and plugin uses this validator function while extracting the behaviors from the data tags.

| Name                   | Description                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| BehaviorValueValidator | Use this callback function if your behaviours datastructure is an array of strings. |
| BehaviorMapValidator   | Use this callback function if your behaviours datastructure is a dictionary.        |
| BehaviorEnumValidator  | Use this callback function if your behaviours datastructure is an Enum.             |

### Sample Usage with behaviorValidator

```js

var clickPlugin = Microsoft.ApplicationInsights.ClickAnalyticsPlugin;
var clickPluginInstance = new clickPlugin();

// Behavior enum values
var behaviorMap = {
  UNDEFINED: 0, // default, Undefined

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Page Experience [1-19]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  NAVIGATIONBACK: 1, // Advancing to the previous index position within a webpage
  NAVIGATION: 2, // Advancing to a specific index position within a webpage
  NAVIGATIONFORWARD: 3, // Advancing to the next index position within a webpage
  APPLY: 4, // Applying filter(s) or making selections
  REMOVE: 5, // Applying filter(s) or removing selections
  SORT: 6, // Sorting content
  EXPAND: 7, // Expanding content or content container
  REDUCE: 8, // Sorting content
  CONTEXTMENU: 9, // Context Menu
  TAB: 10, // Tab control
  COPY: 11, // Copy the contents of a page
  EXPERIMENTATION: 12, // Used to identify a third party experimentation event
  PRINT: 13, // User printed page
  SHOW: 14, //  Displaying an overlay
  HIDE: 15, //  Hiding an overlay
  MAXIMIZE: 16, //  Maximizing an overlay
  MINIMIZE: 17, // Minimizing an overlay
  BACKBUTTON: 18, //  Clicking the back button

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Scenario Process [20-39]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  STARTPROCESS: 20, // Initiate a web process unique to adopter
  PROCESSCHECKPOINT: 21, // Represents a checkpoint in a web process unique to adopter
  COMPLETEPROCESS: 22, // Page Actions that complete a web process unique to adopter
  SCENARIOCANCEL: 23, // Actions resulting from cancelling a process/scenario

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Download [40-59]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  DOWNLOADCOMMIT: 40, // Initiating an unmeasurable off-network download
  DOWNLOAD: 41, // Initiating a download

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Search [60-79]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  SEARCHAUTOCOMPLETE: 60, // Auto-completing a search query during user input
  SEARCH: 61, // Submitting a search query
  SEARCHINITIATE: 62, // Initiating a search query
  TEXTBOXINPUT: 63, // Typing or entering text in the text box

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Commerce [80-99]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  VIEWCART: 82, // Viewing the cart
  ADDWISHLIST: 83, // Adding a physical or digital good or services to a wishlist
  FINDSTORE: 84, // Finding a physical store
  CHECKOUT: 85, // Before you fill in credit card info
  REMOVEFROMCART: 86, // Remove an item from the cart
  PURCHASECOMPLETE: 87, // Used to track the pageView event that happens when the CongratsPage or Thank You page loads after a successful purchase
  VIEWCHECKOUTPAGE: 88, // View the checkout page
  VIEWCARTPAGE: 89, // View the cart page
  VIEWPDP: 90, // View a PDP
  UPDATEITEMQUANTITY: 91, // Update an item's quantity
  INTENTTOBUY: 92, // User has the intent to buy an item
  PUSHTOINSTALL: 93, // User has selected the push to install option

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Authentication [100-119]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  SIGNIN: 100, // User sign-in
  SIGNOUT: 101, // User sign-out

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Social [120-139]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  SOCIALSHARE: 120, // "Sharing" content for a specific social channel
  SOCIALLIKE: 121, // "Liking" content for a specific social channel
  SOCIALREPLY: 122, // "Replying" content for a specific social channel
  CALL: 123, // Click on a "call" link
  EMAIL: 124, // Click on an "email" link
  COMMUNITY: 125, // Click on a "community" link

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Feedback [140-159]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  VOTE: 140, // Rating content or voting for content
  SURVEYCHECKPOINT: 145, // reaching the survey page/form

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Registration, Contact [160-179]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  REGISTRATIONINITIATE: 161, // Initiating a registration process
  REGISTRATIONCOMPLETE: 162, // Completing a registration process
  CANCELSUBSCRIPTION: 163, // Canceling a subscription
  RENEWSUBSCRIPTION: 164, // Renewing a subscription
  CHANGESUBSCRIPTION: 165, // Changing a subscription
  REGISTRATIONCHECKPOINT: 166, // Reaching the registration page/form

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Chat [180-199]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  CHATINITIATE: 180, // Initiating a chat experience
  CHATEND: 181, // Ending a chat experience

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Trial [200-209]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  TRIALSIGNUP: 200, // Signing-up for a trial
  TRIALINITIATE: 201, // Initiating a trial

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Signup [210-219]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  SIGNUP: 210, // Signing-up for a notification or service
  FREESIGNUP: 211, // Signing-up for a free service

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Referals [220-229]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  PARTNERREFERRAL: 220, // Navigating to a partner's web property

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Intents [230-239]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  LEARNLOWFUNNEL: 230, // Engaging in learning behavior on a commerce page (ex. "Learn more click")
  LEARNHIGHFUNNEL: 231, // Engaging in learning behavior on a non-commerce page (ex. "Learn more click")
  SHOPPINGINTENT: 232, // Shopping behavior prior to landing on a commerce page

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Video [240-259]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  VIDEOSTART: 240, // Initiating a video
  VIDEOPAUSE: 241, // Pausing a video
  VIDEOCONTINUE: 242, // Pausing or resuming a video.
  VIDEOCHECKPOINT: 243, // Capturing predetermined video percentage complete.
  VIDEOJUMP: 244, // Jumping to a new video location.
  VIDEOCOMPLETE: 245, // Completing a video (or % proxy)
  VIDEOBUFFERING: 246, // Capturing a video buffer event
  VIDEOERROR: 247, // Capturing a video error
  VIDEOMUTE: 248, // Muting a video
  VIDEOUNMUTE: 249, // Unmuting a video
  VIDEOFULLSCREEN: 250, // Making a video full screen
  VIDEOUNFULLSCREEN: 251, // Making a video return from full screen to original size
  VIDEOREPLAY: 252, // Making a video replay
  VIDEOPLAYERLOAD: 253, // Loading the video player
  VIDEOPLAYERCLICK: 254, //  Click on a button within the interactive player
  VIDEOVOLUMECONTROL: 255, //  Click on video volume control
  VIDEOAUDIOTRACKCONTROL: 256, // Click on audio control within a video
  VIDEOCLOSEDCAPTIONCONTROL: 257, //  Click on the closed caption control
  VIDEOCLOSEDCAPTIONSTYLE: 258, //  Click to change closed caption style
  VIDEORESOLUTIONCONTROL: 259, //  Click to change resolution

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // 	Advertisement Engagement [280-299]
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ADBUFFERING: 283, // Ad is buffering
  ADERROR: 284, // Ad error
  ADSTART: 285, // Ad start
  ADCOMPLETE: 286, // Ad complete
  ADSKIP: 287, // Ad skipped
  ADTIMEOUT: 288, // Ad timed-out
  OTHER: 300, // Other
};

// Application Insights Configuration
var configObj = {
    instrumentationKey: "YOUR INSTRUMENTATION KEY",
    extensions: [
      clickPluginInstance
    ],
    extensionConfig: {
        [clickPluginInstance.identifier] : {
            behaviorValidator : Microsoft.ApplicationInsights.BehaviorMapValidator(behaviorMap),
            defaultRightClickBhvr: 9
        } 
    }
  };
  var appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({ config: configObj });
  appInsights.loadAppInsights();
```
## Sample App

[Simple Web App with Click Analytics Plugin Enabled](https://github.com/kryalama/application-insights-clickanalytics-demo)

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## License

[MIT](LICENSE)
