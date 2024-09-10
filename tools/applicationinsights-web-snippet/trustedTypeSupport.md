# Trusted Type Policy Support

We provide two methods for implementing Trusted Type policy checks. Choose the one that best aligns with your application's security requirements.

## Case 1: Enforcing Trusted Types with require-trusted-types-for 'script'
If your page enforces script injection policies using the require-trusted-types-for 'script' directive, configure the snippet with the following options.

### Configuration Options
```js
    /**
     * Custom optional value to specify whether to enable the trusted type policy check on snippet
     */
    pl?: boolean;
    /**
     * Custom optional value to specify the name of the trusted type policy that would be implemented on the snippet, default is 'aiPolicy'
     */
    pn?: string;
    /*
    * Custom optional value to specify the trusted type policy that would be applied on the snippet src
    */
    ttp?: TrustedTypePolicy;
```
### Automatic Policy Creation
To automatically create and apply a Trusted Type policy, set pl to true. Optionally, you can specify a custom policy name using the pn parameter.
Example:
```html
<script>
    !(function (cfg) ....)({
        src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
        pl: true,
        pn: "aiPolicy",
        cfg: {
            connectionString: ""
        }
    });
</script>
```
### Using a Custom Trusted Type Policy
If you prefer to use your own Trusted Type policy, you can create and pass it using the ttp option.
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
You can test the Trusted Type policy implementation by using our [test example](./Tests/manual/cspUsePolicyTest.html)

## Method 2: Enforcing Script Policies with Nonce and script-src
If your page enforces script injection policies via the script-src 'self' directive, you can configure the snippet to use a nonce value.
Example:
```html
<script>
    !(function (cfg) ....)({
        src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
        nt: "randomNonceValue",
        cfg: {
            connectionString: ""
        }
    });
</script>
```
When the Application Insights script is added to your page, the provided nonce value will be tagged appropriately.
Notice: Make sure to include the nonce value in your Content Security Policy (CSP) directive as follows:
```html
script-src 'self' 'nonce-randomNonceValue'
```