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
    return;
  } else if (document.readyState === 'complete') {
    setup();
  } else {
    window.addEventListener('load', setup);
  }

  const capableDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
  const defaultSplashColor = '#f8f9fa';
  const defaultSplashTextSize = 24;
  const idealSplashIconSize = 128;
  const minimumSplashIconSize = 48;
  const splashIconPadding = 32;

  const isSafari = (navigator.vendor && navigator.vendor.indexOf('Apple') !== -1);
  const isEdge = (navigator.userAgent && navigator.userAgent.indexOf('Edge') !== -1);

  function setup() {
    const manifestEl = document.head.querySelector('link[rel="manifest"]');
    const manifestHref = manifestEl ? manifestEl.href : '';

    Promise.resolve()
        .then(() => {
          if (!manifestHref) {
            throw `can't find <link rel="manifest" href=".." />'`;
          }
          return window.fetch(manifestHref);
        })
        .then((response) => response.json())
        .then((data) => process(data, manifestHref))
        .catch((err) => console.warn('pwacompat.js error', err));
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

  function process(manifest, href) {
    const icons = manifest['icons'] || [];
    icons.sort((a, b) => parseInt(b.sizes, 10) - parseInt(a.sizes, 10));  // largest first
    const appleTouchIcons = icons.map((icon) => {
      const attr = {'rel': 'icon', 'href': new URL(icon['src'], href), 'sizes': icon['sizes']};
      push('link', attr);
      if (isSafari) {
        attr['rel'] = 'apple-touch-icon';
        return push('link', attr);
      }
    });

    const isCapable = capableDisplayModes.indexOf(manifest['display']) !== -1;
    meta('mobile-web-app-capable', isCapable);

    if (isEdge) {
      meta('msapplication-starturl', manifest['start_url'] || '/');
      meta('msapplication-TileColor', manifest['theme_color']);
    }
    if (!isSafari) {
      return;  // the rest of this file is for Safari
    }

    const backgroundIsLight =
        shouldUseLightForeground(manifest['background_color'] || defaultSplashColor);
    const themeIsLight = shouldUseLightForeground(manifest['theme_color'] || 'black');
    const title = manifest['name'] || manifest['short_name'] || document.title;

    // Add related iTunes app from manifest.
    const itunes = findAppleId(manifest['related_applications']);
    itunes && meta('apple-itunes-app', `app-id=${itunes}`);

    // nb. Safari 11.3+ gives a deprecation warning about this meta tag.
    meta('apple-mobile-web-app-status-bar-style', themeIsLight ? 'default' : 'black');
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

  function shouldUseLightForeground(color) {
    const lightTestContext = contextForCanvas();
    lightTestContext.fillStyle = color;
    lightTestContext.fillRect(0, 0, 1, 1);
    const pixelData = lightTestContext.getImageData(0, 0, 1, 1).data;

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
}());
