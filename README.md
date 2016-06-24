pwacompat is a drop-in JS companion library to help your modern website be more progressive.
This takes a `manifest.json` file and, where possible, provides support to non-standard browsers such as Safari on iOS and UC Browser.

# Usage

Drop-in the `pwacompat.min.js` script into your page directly to get its benefits.
Add this script tag anywhere after your manifest file is included, e.g., at the bottom of your page-

```html
<script src="https://example.com/TODO/pwacompat.min.js"></script>
```

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
  "background_color": "#102a48"
}
```

For more information on Web App Manifest, and how e.g., modern browsers will prompt engaged users to install your site to their home screen, check out [Google Developers](https://developers.google.com/web/updates/2014/11/Support-for-installable-web-apps-with-webapp-manifest-in-chrome-38-for-Android).
To learn about how to be more progressive with your features, supporting all your users, check out [Always Be Progressive](https://samthor.github.io/AlwaysBeProgressive/).

## Browsers

This is supported in all modern browsers (UC Browser, Safari, Firefox, Chrome, IE9+).
