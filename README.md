[![Build Status](https://travis-ci.org/GoogleChromeLabs/pwacompat.svg?branch=master)](https://travis-ci.org/GoogleChromeLabs/pwacompat)

PWACompat is a library that brings the [Web App Manifest](https://developers.google.com/web/fundamentals/web-app-manifest/) to non-compliant browsers for better [Progressive Web Apps](https://en.wikipedia.org/wiki/Progressive_Web_Apps).
This mostly means creating splash screens and icons for Mobile Safari, as well as supporting IE/Edge's Pinned Sites feature.

So, if you've created a `manifest.webmanifest` but want to have wide support everywhere else—through legacy HTML tags for icons and theming—look no further.
We recommend including it from a CDN to get the latest version, or [bundling it yourself](https://npmjs.com/package/pwacompat):

```html
<link rel="manifest" href="manifest.webmanifest" />
<script async src="https://unpkg.com/pwacompat" crossorigin="anonymous"></script>
```

And you're done^! 🎉📄

For more on the Web App Manifest, read 📖 [how to add a Web App Manifest and mobile-proof your site](https://medium.com/dev-channel/how-to-add-a-web-app-manifest-and-mobile-proof-your-site-450e6e485638), watch 📹 [theming as part of The Standard](https://www.youtube.com/watch?v=5fEMTxpA6BA), or check out 📬 [the Web Fundamentals post on PWACompat](https://developers.google.com/web/updates/2018/07/pwacompat).

<p align="center">
  <img src="https://storage.googleapis.com/hwhistlr.appspot.com/pwacompat-explainer.png" height="256" alt="PWACompat explainer" /><br />
  <small><em>PWACompat takes your regular manifest and enhances other browsers</em></small>
</p>

# ^Best Practice &amp; Caveats

While PWACompat can generate most icons, meta tags etc that your PWA might need, it's best practice to include at least one `<link rel="icon" ... />`.
This is standardized and older browsers, along with search engines, may use it from your page to display an icon.
For example:

```html
<link rel="manifest" href="manifest.webmanifest" />
<script async src="path/to/pwacompat.min.js"></script>
<!-- include icon also from manifest -->
<link rel="icon" type="image/png" href="res/icon-128.png" sizes="128x128" />
```

You should also consider only loading PWACompat after your site is loaded, as adding your site to a homescreen is a pretty rare operation.
This is the approach taken on [v8.dev](https://github.com/v8/v8.dev/pull/310/files) and [Emojityper](https://github.com/emojityper/emojityper/blob/master/src/loader.js#L8).

## iOS

PWACompat looks for a viewport tag which includes `viewport-fit=cover`, such as `<meta name="viewport" content="viewport-fit=cover">`.
If this tag is detected, PWACompat will generate a meta tag that makes your PWA load in fullscreen mode—this is particularly useful for devices with a notch.

You can customize the generated splash screen's font by using a CSS Variable.
For example:

```html
<style>
  link[rel="manifest"] {
     --pwacompat-splash-font: 24px Verdana;
  }
</style>
```

This is set directly as a [canvas font](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font), so you must as a minimum include size _and_ family.
The default value is "24px HelveticaNeue-CondensedBold".

⚠️ PWACompat won't wait for your fonts to load, so if you're using custom fonts, be sure to only load the library after they're ready.

### Old Versions

Prior [to iOS 12.2](https://twitter.com/mhartington/status/1089293403089784832), Mobile Safari opens external sites in the regular browser, meaning that flows like Oauth won't complete correctly.
This [isn't a problem with PWACompat](https://github.com/GoogleChromeLabs/pwacompat/issues/15), but is an issue with PWAs on iOS generally.

## Session Storage

PWACompat uses `window.sessionStorage` to cache your site's manifest (and on iOS, any updated icons and generated splash screens).
This expires after a user navigates away from your page or closes their tab.

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

For IE and Edge:

* Adds meta tags for the [Pinned Sites](https://blogs.msdn.microsoft.com/jennifer/2011/04/20/ie-pinned-sites-part-1-what-are-pinned-sites/) feature

For PWAs on Windows with access to UWP APIs:

* Sets the titlebar color

Do you think PWACompat should support backfilling more HTML tags needed for older browsers?
[Let us know!](https://github.com/GoogleChromeLabs/pwacompat/issues)

## Demo

For a demo, try adding [Emojityper](https://emojityper.com/) or [the demo site](https://googlechromelabs.github.io/pwacompat/demo/) to an iOS home screen (to see splash screens and icons).
You can also install Emojityper from the [Microsoft Store](https://www.microsoft.com/p/emojityper/9np2xx3sxmct) (where the titlebar color is automatically set the manifest's `theme_color`).

## Support

This is supported in most modern browsers (UC Browser, Safari, Firefox, Chrome, IE10+), and fails silenty when unsupported.
Mobile Safari benefits the most from PWACompat, as generating [a large number of splash screens](https://google.com/search?q=ios%20webapp%20splash%20screens) manually is a complex task.

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
    {
      "src": "res/icon-256.png",
      "sizes": "256x256"
    },
    {
      "src": "res/icon-128.png",
      "sizes": "128x128"
    }
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
