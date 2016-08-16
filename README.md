pwacompat is a library to help your modern website be more progressive.
This takes a [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest), and, where possible, provides support to non-standard browsers such as Safari on iOS.

# Usage

## Drop-In

Drop-in the `pwacompat.min.js` script into your page directly to get its benefits.
Add this script tag anywhere after your manifest file is included, e.g., at the bottom of your page-

```html
<link rel="manifest" href="manifest.json" />
<script src="https://cdn.rawgit.com/GoogleChrome/pwacompat/v1.0.0/pwacompat.min.js"></script>
```

**Warning!** Don't use the `pwacompat.js` file directly, as it's written in ES6, which can't be run  natively in most browsers.

### Browsers

This is supported in most modern browsers (UC Browser, Safari, Firefox, Chrome, IE9+).

## Library

You can also use pwacompat as a library, where it will convert a manifest to HTML that can be inserted into your document's header.
Install with NPM-

```bash
$ npm install --save pwacompat
```

And then include as part of your build process to generate templates-

```js
const pwacompat = require('pwacompat');
const html = compat(require('./path/to/manifest.json'));
console.info(html);  // prints '<meta name="...">\n' and so on
```

# Details

pwacompat performs a few main tasks-

* Creates fallback meta tags for older devices (e.g., iOS, older WebKit/Chromium forks etc)
* Creates meta icon tags for all icons in the manifest

The drop-in version also provides JS that enhances webapps added to an [iOS homescreen](https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW2)-

* Ensures your webapp always starts at your `start_url`
* Fixes internal navigation so users stay within the webapp

# Web App Manifest

Your Web App Manifest is normally named `manifest.json`, is referenced from all pages on your site like `<link rel="manifest" href="path/to/manifest/manifest.json" />`, and should look a bit like this-

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

## License

Copyright 2015 Google, Inc.

Licensed under the [Apache License, Version 2.0](LICENSE) (the "License");
you may not use this file except in compliance with the License. You may
obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
