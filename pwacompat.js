/*
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

(function() {
  if (!('fetch' in window)) {
    return;  // basic feature detection: from Mobile Safari 10.3+
  }

  const capableDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
  const defaultSplashColor = '#f8f9fa';
  const defaultSplashTextSize = 24;
  const idealSplashIconSize = 128;
  const minimumSplashIconSize = 48;
  const splashIconPadding = 32;

  const isSafari = (navigator.vendor && navigator.vendor.indexOf('Apple') !== -1);
  const isEdge = (navigator.userAgent && navigator.userAgent.indexOf('Edge') !== -1);
  const isEdgePWA = (typeof Windows !== 'undefined');

  function setup() {
    const manifestEl = document.head.querySelector('link[rel="manifest"]');
    const manifestHref = manifestEl ? manifestEl.href : '';
    const hrefFactory = buildHrefFactory([manifestHref, window.location]);

    Promise.resolve()
        .then(() => {
          if (!manifestHref) {
            throw `can't find <link rel="manifest" href=".." />'`;
          }
          const opts = /** @type {!RequestInit} */ ({});
          if (manifestHref.crossOrigin === 'use-credentials') {
            opts.credentials = 'include';
          }
          return window.fetch(manifestHref, opts);
        })
        .then((response) => response.json())
        .then((data) => process(data, hrefFactory))
        .catch((err) => console.warn('pwacompat.js error', err));
  }

  /**
   * @param {!Array<string>} options
   * @return {function(string): string}
   */
  function buildHrefFactory(options) {
    for (let i = 0; i < options.length; ++i) {
      const opt = options[i];
      try {
        new URL('', opt);
        return (part) => (new URL(part, opt)).toString();
      } catch (e) {}
    }
    return (part) => part;
  }

  function push(localName, attr) {
    const node = document.createElement(localName);
    for (const k in attr) {
      node.setAttribute(k, attr[k]);
    }
    document.head.appendChild(node);
    return node;
  }

  function meta(name, content) {
    if (content) {
      if (content === true) {
        content = 'yes';
      }
      push('meta', {name, content});
    }
  }

  /**
   * @param {!Object<string, (string|*)>} manifest
   * @param {function(string): string} urlFactory
   */
  function process(manifest, urlFactory) {
    const icons = manifest['icons'] || [];
    icons.sort((a, b) => parseInt(b.sizes, 10) - parseInt(a.sizes, 10));  // largest first
    const appleTouchIcons = icons.map((icon) => {
      // create icons as byproduct
      const attr = {'rel': 'icon', 'href': urlFactory(icon['src']), 'sizes': icon['sizes']};
      push('link', attr);
      if (isSafari) {
        attr['rel'] = 'apple-touch-icon';
        return push('link', attr);
      }
    });

    const display = manifest['display'];
    const isCapable = capableDisplayModes.indexOf(display) !== -1;
    meta('mobile-web-app-capable', isCapable);
    updateThemeColorRender(/** @type {string} */ (manifest['theme_color']) || 'black');

    if (isEdge) {
      meta('msapplication-starturl', manifest['start_url'] || '/');
      meta('msapplication-TileColor', manifest['theme_color']);
    }

    // nb: we check, but this won't override any _earlier_ (in DOM order) theme-color
    if (!document.head.querySelector('[name="theme-color"]')) {
      meta('theme-color', manifest['theme_color']);
    }

    // TODO(samthor): We don't detect QQ or UC, we just set the vars anyway.
    const orientation = simpleOrientationFor(manifest['orientation']);
    meta('x5-orientation', orientation);      // QQ
    meta('screen-orientation', orientation);  // UC
    if (display === 'fullscreen') {
      meta('x5-fullscreen', 'true');  // QQ
      meta('full-screen', 'yes');     // UC
    } else if (isCapable) {
      meta('x5-page-mode', 'app');         // QQ
      meta('browsermode', 'application');  // UC
    }

    if (!isSafari) {
      return;  // the rest of this file is for Safari
    }

    const backgroundIsLight = shouldUseLightForeground(
        /** @type {string} */ (manifest['background_color']) || defaultSplashColor);
    const title = manifest['name'] || manifest['short_name'] || document.title;

    // Add related iTunes app from manifest.
    const itunes = findAppleId(manifest['related_applications']);
    itunes && meta('apple-itunes-app', `app-id=${itunes}`);

    // General iOS meta tags.
    meta('apple-mobile-web-app-capable', isCapable);
    meta('apple-mobile-web-app-title', title);

    function splashFor({width, height}, orientation, icon) {
      const ratio = window.devicePixelRatio;
      const ctx = contextForCanvas({width: width * ratio, height: height * ratio});

      ctx.scale(ratio, ratio);
      ctx.fillStyle = manifest['background_color'] || defaultSplashColor;
      ctx.fillRect(0, 0, width, height);
      ctx.translate(width / 2, (height - splashIconPadding) / 2);

      ctx.font = `${defaultSplashTextSize}px HelveticaNeue-CondensedBold`;
      ctx.fillStyle = backgroundIsLight ? 'white' : 'black';
      const textWidth = ctx.measureText(title).width;

      if (icon) {
        // nb: on Chrome, we need the image >=48px, use the big layout >=80dp, ideal is >=128dp
        let iconWidth = (icon.width / ratio);
        let iconHeight = (icon.height / ratio);
        if (iconHeight > idealSplashIconSize) {
          // clamp to 128px height max
          iconWidth /= (iconHeight / idealSplashIconSize);
          iconHeight = idealSplashIconSize;
        }

        if (iconWidth >= minimumSplashIconSize && iconHeight >= minimumSplashIconSize) {
          ctx.drawImage(icon, iconWidth / -2, iconHeight / -2, iconWidth, iconHeight);
          ctx.translate(0, iconHeight / 2 + splashIconPadding);
        }
      }
      ctx.fillText(title, textWidth / -2, 0);

      const generatedSplash = document.createElement('link');
      generatedSplash.setAttribute('rel', 'apple-touch-startup-image');
      generatedSplash.setAttribute('media', `(orientation: ${orientation})`);
      generatedSplash.setAttribute('href', ctx.canvas.toDataURL());

      return generatedSplash;
    }

    const previous = new Set();
    function updateSplash(applicationIcon) {
      const portrait = splashFor(window.screen, 'portrait', applicationIcon);
      const landscape = splashFor({
        width: window.screen.height,
        height: window.screen.width,
      }, 'landscape', applicationIcon);

      previous.forEach((prev) => prev.remove());

      document.head.appendChild(portrait);
      document.head.appendChild(landscape);
      previous.add(portrait);
      previous.add(landscape);
    }
    updateSplash(null);

    // fetch the largest icon to generate a splash screen
    if (!appleTouchIcons.length) {
      return;
    }
    const icon = appleTouchIcons[0];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      updateSplash(img);

      // also check and redraw icon
      if (!manifest['background_color']) {
        return;
      }
      const redrawn = updateTransparent(img, manifest['background_color']);
      if (redrawn === null) {
        return;  // the rest probably aren't interesting either
      }
      icon.href = redrawn;

      // fetch and fix all remaining icons
      appleTouchIcons.slice(1).forEach((icon) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const redrawn = updateTransparent(img, manifest['background_color'], true);
          icon.href = redrawn;
        };
        img.src = icon.href;
      });

    };
    img.src = icon.href;
  }

  function findAppleId(related) {
    let itunes;
    (related || [])
        .filter((app) => app['platform'] === 'itunes')
        .forEach((app) => {
          if (app['id']) {
            itunes = app['id'];
          } else {
            const match = app['url'].match(/id(\d+)/);
            if (match) {
              itunes = match[1];
            }
          }
        });
    return itunes;
  }

  function simpleOrientationFor(v) {
    v = String(v || '');
    const prefix = v.substr(0, 3);
    if (prefix === 'por') {
      return 'portrait';
    } else if (prefix === 'lan') {
      return 'landscape';
    }
    return '';
  }

  /**
   * @param {string} color
   */
  function updateThemeColorRender(color) {
    if (!(isSafari || isEdgePWA)) {
      return;
    }

    const themeIsLight = shouldUseLightForeground(color);
    if (isSafari) {
      // nb. Safari 11.3+ gives a deprecation warning about this meta tag.
      // TODO(samthor): Potentially set black-translucent in 'fullscreen'.
      meta('apple-mobile-web-app-status-bar-style', themeIsLight ? 'black' : 'default');
    } else {
      // Edge PWA
      const t = getEdgeTitleBar();
      if (t === null) {
        console.debug('UWP no titleBar')
        return;
      }
      t.foregroundColor = colorToWindowsRGBA(themeIsLight ? 'black' : 'white');
      t.backgroundColor = colorToWindowsRGBA(color);
    }
  }

  /**
   * @return {?ApplicationViewTitleBar}
   */
  function getEdgeTitleBar() {
    try {
      return Windows.UI.ViewManagement.ApplicationView.getForCurrentView().titleBar;
    } catch (e) {
      return null;
    }
  }

  /**
   * The Windows titlebar APIs expect an object of {r, g, b, a}.
   *
   * @param {string} color
   * @return {WindowsColor}
   */
  function colorToWindowsRGBA(color) {
    const data = readColor(color);
    return /** @type {WindowsColor} */ ({
      'r': data[0],
      'g': data[1],
      'b': data[2],
      'a': data[3],
    });
  }

  /**
   * @param {string} color
   * @return {!Uint8ClampedArray}
   */
  function readColor(color) {
    const c = contextForCanvas();
    c.fillStyle = color;
    c.fillRect(0, 0, 1, 1);
    return c.getImageData(0, 0, 1, 1).data;
  }

  /**
   * @param {string} color
   * @return {boolean}
   */
  function shouldUseLightForeground(color) {
    const pixelData = readColor(color);

    // From https://cs.chromium.org/chromium/src/chrome/android/java/src/org/chromium/chrome/browser/util/ColorUtils.java
    const data = pixelData.map((v) => {
      const f = v / 255;
      return (f < 0.03928) ? f / 12.92 : Math.pow((f + 0.055) / 1.055, 2.4);
    });
    const lum = 0.2126 * data[0] + 0.7152 * data[1] + 0.0722 * data[2];
    const contrast = Math.abs((1.05) / (lum + 0.05));
    return contrast > 3;
  }

  function updateTransparent(image, background, force=false) {
    const context = contextForCanvas(image);
    context.drawImage(image, 0, 0);

    // look for transparent pixel in top-left
    // TODO: Chrome actually checks the four corners for some cases.
    if (!force) {
      const imageData = context.getImageData(0, 0, 1, 1);
      if (imageData.data[3] == 255) {
        return null;
      }
    }

    context.globalCompositeOperation = 'destination-over';  // only replace transparent areas
    context.fillStyle = background;
    context.fillRect(0, 0, image.width, image.height);
    return context.canvas.toDataURL();
  }

  function contextForCanvas({width, height} = {width: 1, height: 1}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
  }

  // actually run PWACompat here
  if (document.readyState === 'complete') {
    setup();
  } else {
    window.addEventListener('load', setup);
  }
}());
