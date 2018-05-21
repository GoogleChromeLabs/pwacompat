PWACompat is a library that brings the Web App Manifest to non-compliant browsers.
If you've created a `manifest.json` but want to have wide support everywhere else, look no further 👍

[Learn more about the Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) or [watch a video on modern theming!](https://www.youtube.com/watch?v=5fEMTxpA6BA)

<div style="text-align: center">
  <img src="explainer.png" with="256" height="96" alt="pwacompat explainer" />
</div>

# Tasks

If you provide a Web App Manifest, PWACompat will perform the following tasks-

* Creates meta icon tags for all icons in the manifest
* Creates fallback meta tags for older devices (e.g., iOS, older WebKit/Chromium forks etc)

For Safari, PWACompat also-

* Creates `apple-touch-icon` images, adding the manifest background to transparent icons: otherwise, iOS renders transparency as black
* Creates dynamic splash images, closely matching the splash images generated [for Chromium-based browsers](https://cs.chromium.org/chromium/src/chrome/android/java/src/org/chromium/chrome/browser/webapps/WebappSplashScreenController.java?type=cs&q=webappsplash&sq=package:chromium&g=0&l=70)

# Usage

Drop-in the `pwacompat.min.js` script into your page after your manifest, from a CDN or include it from your own host-

```html
<link rel="manifest" href="manifest.json" />
<script async src="https://cdn.rawgit.com/GoogleChrome/pwacompat/v2.0.0/pwacompat.min.js"></script>
```

## Support

This is supported in most modern browsers (UC Browser, Safari, Firefox, Chrome, IE9+), fails silenty when unsupported, and provides the most value for Mobile Safari.

Note that PWACompat used to be available (at v1.0.3) as a build-time dependency: that support has been removed in v2+.

# Web App Manifest

Your Web App Manifest is normally named `manifest.json`, is referenced from all pages on your site like `<link rel="manifest" href="path/to/manifest.json" />`, and should look a bit like this-

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

## Other

This is not an official Google product.
Released under [Apache 2.0](LICENSE).
