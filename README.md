pwacompat is a drop-in JS companion library to help your modern website be more progressive.
This takes a `manifest.json` file and, where possible, provides support to non-standard browsers such as Safari on iOS.

# Usage

Drop-in the `pwacompat.min.js` script into your page directly to get its benefits.
Add this script tag anywhere after your manifest file is included, e.g., at the bottom of your page-

```html
<script src="https://cdn.rawgit.com/GoogleChrome/pwacompat/v1.0.0/pwacompat.min.js"></script>
```

**Warning!** Don't use the `pwacompat.js` file directly, as it's written in ES6, which can't be run  natively in most browsers.

# Details

pwacompat performs a few main tasks-

* Creates fallback meta tags for older devices (e.g., iOS, older WebKit/Chromium forks etc)
* Creates meta icon tags for all icons in the manifest
* For webapps added to an [iOS homescreen](https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW2)-
  * Ensures your webapp always starts at your `start_url`
  * Fixes internal navigation so users stay within the webapp

# Requirements

If your site has a [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest), you're good to go.
Your `<head>` tag should contain-
  
```html
<link rel="manifest" href="manifest.json" />
```

And the `manifest.json` file itself should look a bit like-

```js
{
  "name": "Always Be Progressive",
  "short_name": "Progressive!",
  "display": "browser",
  "start_url": "/",
  "background_color": "#102a48",
  "icons": [
    "src": "res/icon-128.png",
    "sizes": "128x128"
  ]
}
```

For more information on Web App Manifest, and how e.g., modern browsers will prompt engaged users to install your site to their home screen, check out [Google Developers](https://developers.google.com/web/updates/2014/11/Support-for-installable-web-apps-with-webapp-manifest-in-chrome-38-for-Android).
To learn about how to be more progressive with your features, supporting all your users, check out [Always Be Progressive](https://samthor.github.io/AlwaysBeProgressive/).

## Browsers

This is supported in most modern browsers (UC Browser, Safari, Firefox, Chrome, IE9+).

# Release

Compile code with [Closure Compiler](https://closure-compiler.appspot.com/home).

```
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name pwacompat.min.js
// ==/ClosureCompiler==

// code here
```