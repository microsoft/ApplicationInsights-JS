# Running multiple version in one session


If multiple instances of different versions of Application Insights are running on the same page, errors may occur. In this talbe, we have identified several common error messages that you might encounter.

| Script Ver | Snippet Context sdkversion | Microsoft.ai                                                              | ERROR MESSAGE                                                                                                          |   |
|------------|----------------------------|---------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|---|
| 2 -> 3     | 2                          | core utils, should be v2<br>Mod is all v2                                 | Uncaught TypeError: Cannot read properties of undefined (reading 'disabbleFetchTracking')                              |   |
| 3 -> 2     | 2                          | core utils, should be v2<br>Mod is all v2                             | TypeError: Cannot read properties of undefined (reading 'disabbleFetchTracking')                                       |   |
| 1 -> 3     | 3                          | m.ai.version = 1<br>Inside mode, only RequestHeaders: "---", all other v3 | Dynamic config change fail                                                                                             |   |
| 3 -> 1     | 3                          | Mod all v3,function location is 3                                         | Uncaught TypeError: Cannot assign to read only property 'CRITICAL' of object '#<Object>'<br><br>Dynamic config change fail |   |
| 1 -> 2     | 2                          | m.ai.version = 1, mod all v2                                              | TypeError: Cannot read properties of undefined (reading 'disabbleFetchTracking')                                       |   |
| 2 -> 1     | 2                          | core utils, should be v2<br>Mod is all v2                                 | Uncaught TypeError: Cannot read properties of undefined (reading 'disabbleFetchTracking')                              |   |


Typiocal Error in console log:
1. Uncaught TypeError: Cannot assign to read only property 'CRITICAL' of object '#<Object>'
2. When using Dynamic config, get error meesage:
Uncaught TypeError: Cannot set property config of #<AppInsightsSku> which has only a getter


