/**
*  @copyright Microsoft 2020
*/

// Behavior enum values
export enum Behavior {
    UNDEFINED = 0,				// default, Undefined

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Page Experience [1-19]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    NAVIGATIONBACK = 1,          // Advancing to the previous index position within a webpage
    NAVIGATION = 2,              // Advancing to a specific index position within a webpage
    NAVIGATIONFORWARD = 3,       // Advancing to the next index position within a webpage
    APPLY = 4,					// Applying filter(s) or making selections
    REMOVE = 5,					// Applying filter(s) or removing selections
    SORT = 6,					// Sorting content
    EXPAND = 7,					// Expanding content or content container
    REDUCE = 8,					// Sorting content
    CONTEXTMENU = 9,             // Context Menu
    TAB = 10,                    // Tab control
    COPY = 11,                   // Copy the contents of a page
    EXPERIMENTATION = 12,        // Used to identify a third party experimentation event
    PRINT = 13,                  // User printed page
    SHOW = 14,                   //  Displaying an overlay
    HIDE = 15,                   //  Hiding an overlay
    MAXIMIZE = 16,               //  Maximizing an overlay
    MINIMIZE = 17,               // Minimizing an overlay
    BACKBUTTON = 18,             //  Clicking the back button

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Scenario Process [20-39]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    STARTPROCESS = 20,			// Initiate a web process unique to adopter
    PROCESSCHECKPOINT = 21,		// Represents a checkpoint in a web process unique to adopter
    COMPLETEPROCESS = 22,		// Page Actions that complete a web process unique to adopter
    SCENARIOCANCEL = 23, // Actions resulting from cancelling a process/scenario

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Download [40-59]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    DOWNLOADCOMMIT = 40,		    // Initiating an unmeasurable off-network download
    DOWNLOAD = 41,				// Initiating a download

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Search [60-79]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    SEARCHAUTOCOMPLETE = 60,	    // Auto-completing a search query during user input
    SEARCH = 61,				    // Submitting a search query
    SEARCHINITIATE = 62,			// Initiating a search query
    TEXTBOXINPUT = 63,   // Typing or entering text in the text box

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Commerce [80-99]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    VIEWCART = 82,               // Viewing the cart
    ADDWISHLIST = 83,            // Adding a physical or digital good or services to a wishlist
    FINDSTORE = 84,              // Finding a physical store
    CHECKOUT = 85,               // Before you fill in credit card info
    REMOVEFROMCART = 86,         // Remove an item from the cart
    PURCHASECOMPLETE = 87,       // Used to track the pageView event that happens when the CongratsPage or Thank You page loads after a successful purchase
    VIEWCHECKOUTPAGE = 88,       // View the checkout page
    VIEWCARTPAGE = 89,           // View the cart page
    VIEWPDP = 90,                // View a PDP
    UPDATEITEMQUANTITY = 91,     // Update an item's quantity
    INTENTTOBUY = 92,            // User has the intent to buy an item
    PUSHTOINSTALL = 93,          // User has selected the push to install option

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Authentication [100-119]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    SIGNIN = 100,				// User sign-in
    SIGNOUT = 101,				// User sign-out

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Social [120-139]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    SOCIALSHARE = 120,			// "Sharing" content for a specific social channel
    SOCIALLIKE = 121,			// "Liking" content for a specific social channel
    SOCIALREPLY = 122,			// "Replying" content for a specific social channel
    CALL = 123,                  // Click on a "call" link
    EMAIL = 124,                 // Click on an "email" link
    COMMUNITY = 125,             // Click on a "community" link

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Feedback [140-159]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    VOTE = 140,					// Rating content or voting for content
    SURVEYCHECKPOINT = 145,      // reaching the survey page/form

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Registration, Contact [160-179]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    REGISTRATIONINITIATE = 161,  // Initiating a registration process
    REGISTRATIONCOMPLETE = 162,  // Completing a registration process
    CANCELSUBSCRIPTION = 163,    // Canceling a subscription
    RENEWSUBSCRIPTION = 164,     // Renewing a subscription
    CHANGESUBSCRIPTION = 165,     // Changing a subscription
    REGISTRATIONCHECKPOINT = 166, // Reaching the registration page/form

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Chat [180-199]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    CHATINITIATE = 180,			// Initiating a chat experience
    CHATEND = 181,				// Ending a chat experience

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Trial [200-209]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    TRIALSIGNUP = 200,			// Signing-up for a trial
    TRIALINITIATE = 201,         // Initiating a trial

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Signup [210-219]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    SIGNUP = 210,			  // Signing-up for a notification or service
    FREESIGNUP = 211,         // Signing-up for a free service

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Referals [220-229]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    PARTNERREFERRAL = 220,		// Navigating to a partner's web property
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Intents [230-239]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    LEARNLOWFUNNEL = 230,       // Engaging in learning behavior on a commerce page (ex. "Learn more click")
    LEARNHIGHFUNNEL = 231,      // Engaging in learning behavior on a non-commerce page (ex. "Learn more click")
    SHOPPINGINTENT = 232,       // Shopping behavior prior to landing on a commerce page

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Video [240-259]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    VIDEOSTART = 240,			// Initiating a video
    VIDEOPAUSE = 241,			// Pausing a video
    VIDEOCONTINUE = 242,		    // Pausing or resuming a video.
    VIDEOCHECKPOINT = 243,		// Capturing predetermined video percentage complete.
    VIDEOJUMP = 244,			    // Jumping to a new video location.
    VIDEOCOMPLETE = 245,		    // Completing a video (or % proxy)
    VIDEOBUFFERING = 246,		// Capturing a video buffer event
    VIDEOERROR = 247,			// Capturing a video error
    VIDEOMUTE = 248,			    // Muting a video
    VIDEOUNMUTE = 249,			// Unmuting a video
    VIDEOFULLSCREEN = 250,		// Making a video full screen
    VIDEOUNFULLSCREEN = 251,	    // Making a video return from full screen to original size
    VIDEOREPLAY = 252,           // Making a video replay
    VIDEOPLAYERLOAD = 253,       // Loading the video player
    VIDEOPLAYERCLICK = 254,        //  Click on a button within the interactive player
    VIDEOVOLUMECONTROL = 255,       //  Click on video volume control
    VIDEOAUDIOTRACKCONTROL = 256,     // Click on audio control within a video
    VIDEOCLOSEDCAPTIONCONTROL = 257,    //  Click on the closed caption control
    VIDEOCLOSEDCAPTIONSTYLE = 258,     //  Click to change closed caption style
    VIDEORESOLUTIONCONTROL = 259,     //  Click to change resolution

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // 	Advertisement Engagement [280-299]
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ADBUFFERING = 283,           // Ad is buffering
    ADERROR = 284,               // Ad error
    ADSTART = 285,               // Ad start
    ADCOMPLETE = 286,            // Ad complete
    ADSKIP = 287,                // Ad skipped
    ADTIMEOUT = 288,             // Ad timed-out
    OTHER = 300					// Other
}
