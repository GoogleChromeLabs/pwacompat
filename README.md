PWACompat is a library that brings the [Web App Manifest](https://developers.google.com/web/fundamentals/web-app-manifest/) to non-compliant browsers.
If you've created a `manifest.webmanifest` but want to have wide support everywhere else, look no further 👍

Just include this script (or bundle/serve it yourself) in your page-

```html
<link rel="manifest" href="manifest.webmanifest" />
<script async src="https://cdn.rawgit.com/GoogleChrome/pwacompat/v2.0.1/pwacompat.min.js"></script>
```

For more on the Web App Manifest, read 📖 [how to add a Web App Manifest and mobile-proof your site](https://medium.com/dev-channel/how-to-add-a-web-app-manifest-and-mobile-proof-your-site-450e6e485638) or watch 📹 [theming as part of The Standard](https://www.youtube.com/watch?v=5fEMTxpA6BA).

<p align="center">
  <img src="https://storage.googleapis.com/hwhistlr.appspot.com/pwacompat-explainer.png" height="256" alt="PWACompat explainer" /><br />
  <small><em>PWACompat takes your regular manifest and enhances other browsers</em></small>
</p>

# Details

What does PWACompat actually do?
If you provide a Web App Manifest, PWACompat will update your page and-

* Create meta icon tags for all icons in the manifest (e.g., for a favicon, older browsers)
* Create fallback meta tags for older devices (e.g., iOS, older WebKit/Chromium forks etc)

For Safari, PWACompat also-

* Sets `apple-mobile-web-app-capable` (opening without a browser chrome) for display modes `standalone`, `fullscreen` or `minimal-ui`
* Creates `apple-touch-icon` images, adding the manifest background to transparent icons: otherwise, iOS renders transparency as black
* Creates dynamic splash images, closely matching the splash images generated [for Chromium-based browsers](https://cs.chromium.org/chromium/src/chrome/android/java/src/org/chromium/chrome/browser/webapps/WebappSplashScreenController.java?type=cs&q=webappsplash&sq=package:chromium&g=0&l=70)

## Demo

For a demo, try adding [Emojityper](https://emojityper.app/) or [the demo site](https://googlechromelabs.github.io/pwacompat/test/) to your iOS home screen.

## Support

This is supported in most modern browsers (UC Browser, Safari, Firefox, Chrome, IE9+), fails silenty when unsupported, and provides the most value for your users on Mobile Safari.

Note that v1 of PWACompat used to also provide a build-time dependency: that support has been removed in v2+.

# Web App Manifest

Your Web App Manifest is normally named `manifest.webmanifest`, is referenced from all pages on your site like `<link rel="manifest" href="path/to/manifest.webmanifest" />`, and should look a bit like this-

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

For more information on the Web App Manifest, and how e.g., modern browsers will prompt engaged users to install your site to their home screen, check out [Web Fundamentals](https://developers.google.com/web/fundamentals/web-app-manifest/).

# Release

Compile code with [Closure Compiler](https://closure-compiler.appspot.com/home).

```
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name pwacompat.min.js
// ==/ClosureCompiler==

// code here
```
