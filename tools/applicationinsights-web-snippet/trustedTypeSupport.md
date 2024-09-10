# Trust Type Support

We offer two methods for implementing Trusted Type policy checks. Choose the one that best suits your needs.

## Method 1: Using require-trusted-types-for 'script'
If your page utilizes require-trusted-types-for 'script' to enforce script injection policies, configure your snippet as follows:
### Configuration Options
```js
    /**
     * Custom optional value to specify whether to enable the trusted type policy check on snippet
     */
    pl?: boolean;
    /**
     * Custom optional value to specify the name of the trusted type policy that would be implemented on the snippet, default is '1ds-default'
     */
    pn?: string;
    /*
    * Custom optional value to specify the trusted type policy that would be applied on the snippet src
    */
    ttp?: TrustedTypePolicy;
```
### Automatic Policy Creation
To have the policy automatically created, set pl to true. You can optionally specify a policy name with pn.
Example usage:
```html
<script>
    !(function (cfg) ....)({
        src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
        pl: true,
        pn: "1ds",
        cfg: {
            connectionString: ""
        }
    });
</script>
```
### Using a Custom Trusted Type Policy
If you prefer to pass your own Trusted Type Policy, create it and then apply it using the ttp option.

Example:
```html
<script>
    const myTrustedTypePolicy = trustedTypes.createPolicy('myTrustedTypePolicy', {
        createScriptURL: (url) => {
            console.log('Trusted Type Policy: myTrustedTypePolicy called with URL:', url);
            return url;
        }
    });
    !(function (cfg) ....)({
        src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
        pl: true,
        ttp: myTrustedTypePolicy,
        cfg: {
            connectionString: ""
        }
    });
</script>
```
### Test
Your could also check our [test](./Tests/manual/cspUsePolicyTest.html)

## Method 2: Using Nonce Tag and script-src
