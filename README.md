[![Build Status](https://travis-ci.org/GoogleChromeLabs/pwacompat.svg?branch=master)](https://travis-ci.org/GoogleChromeLabs/pwacompat)

PWACompat is a library that brings the [Web App Manifest](https://developers.google.com/web/fundamentals/web-app-manifest/) to non-compliant browsers for better [Progressive Web Apps](https://en.wikipedia.org/wiki/Progressive_Web_Apps).
If you've created a `manifest.webmanifest` but want to have wide support everywhere else—through legacy HTML tags for icons and theming—look no further 👍

Just include this script (or bundle/serve it yourself) in your page:

```html
<link rel="manifest" href="manifest.webmanifest" />
<script async src="https://cdn.jsdelivr.net/npm/pwacompat@2.0.6/pwacompat.min.js"
    integrity="sha384-GOaSLecPIMCJksN83HLuYf9FToOiQ2Df0+0ntv7ey8zjUHESXhthwvq9hXAZTifA"
    crossorigin="anonymous"></script>
```

And you're done! 🎉📄

For more on the Web App Manifest, read 📖 [how to add a Web App Manifest and mobile-proof your site](https://medium.com/dev-channel/how-to-add-a-web-app-manifest-and-mobile-proof-your-site-450e6e485638), watch 📹 [theming as part of The Standard](https://www.youtube.com/watch?v=5fEMTxpA6BA), or check out 📬 [the Web Fundamentals post on PWACompat](https://developers.google.com/web/updates/2018/07/pwacompat).

<p align="center">
  <img src="https://storage.googleapis.com/hwhistlr.appspot.com/pwacompat-explainer.png" height="256" alt="PWACompat explainer" /><br />
  <small><em>PWACompat takes your regular manifest and enhances other browsers</em></small>
</p>

# Details

What does PWACompat actually do?
If you provide a Web App Manifest, PWACompat will update your page and:

* Create meta icon tags for all icons in the manifest (e.g., for a favicon, older browsers)
* Create fallback meta tags for various browsers (e.g., iOS, WebKit/Chromium forks etc) describing how a PWA should open
* Sets [the theme color](https://developers.google.com/web/updates/2014/11/Support-for-theme-color-in-Chrome-39-for-Android) based on the manifest

For Safari, PWACompat also:

* Sets `apple-mobile-web-app-capable` (opening without a browser chrome) for display modes `standalone`, `fullscreen` or `minimal-ui`
* Creates `apple-touch-icon` images, adding the manifest background to transparent icons: otherwise, iOS renders transparency as black
* Creates dynamic splash images, closely matching the splash images generated [for Chromium-based browsers](https://cs.chromium.org/chromium/src/chrome/android/java/src/org/chromium/chrome/browser/webapps/WebappSplashScreenController.java?type=cs&q=webappsplash&sq=package:chromium&g=0&l=70)

For PWAs on Windows with access to UWP APIs:

* Sets the titlebar color

Do you think PWACompat should support backfilling more HTML tags needed for older browsers?
[Let us know!](https://github.com/GoogleChromeLabs/pwacompat/issues)

## Best Practice

While PWACompat can generate most icons, meta tags etc that your PWA might need, it's best practice to include at least one `<link rel="icon" ... />`.
This is standardized and older browsers, along with search engines, may use it from your page to display an icon.
For example:

```html
<link rel="manifest" href="manifest.webmanifest" />
<script async src="path/to/pwacompat.min.js"></script>
<!-- include icon also from manifest -->
<link rel="icon" type="image/png" href="res/icon-128.png" sizes="128x128" />
```

## Demo

For a demo, try adding [Emojityper](https://emojityper.com/) or [the demo site](https://googlechromelabs.github.io/pwacompat/test/) to an iOS home screen (to see splash screens and icons).
You can also install Emojityper from the [Microsoft Store](https://www.microsoft.com/p/emojityper/9np2xx3sxmct) (where the titlebar color is automatically set the manifest's `theme_color`).

## Support

This is supported in most modern browsers (UC Browser, Safari, Firefox, Chrome, IE9+), and fails silenty when unsupported.
Mobile Safari arguably benefits the most from PWACompat, as generating [a large number of splash screens](https://google.com/search?q=ios%20webapp%20splash%20screens) manually is a complex task.

Note that v1 of PWACompat used to also provide a build-time dependency: that support has been removed in v2+.

# Web App Manifest

Your Web App Manifest is:

* normally named `manifest.webmanifest` (although some folks name it `manifest.json`)
* referenced from all pages on your site like `<link rel="manifest" href="path/to/manifest.webmanifest" />`
* and should look a bit like this:

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
There's also a number of [online generators](https://www.google.com/search?q=web+app+manifest+generator).

# Release

Compile code with [Closure Compiler](https://closure-compiler.appspot.com/home).

```
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name pwacompat.min.js
// ==/ClosureCompiler==

// code here
```
