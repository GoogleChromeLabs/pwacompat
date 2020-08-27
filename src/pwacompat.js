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

// WARNING
// Don't use this file directly in production! Please include `pwacompat.min.js`!
// WARNING
/**
 * @suppress {uselessCode}
 */
function unused() {
  // compiled out, but crashes IE11 early rather than within the code
  `Please don't use this file directly: include pwacompat.min.js instead!`;
}

(function() {
  // basic feature detection: from IE10+
  // also fallout on 'navigator.standalone', we _are_ an iOS PWA
  if (!('onload' in XMLHttpRequest.prototype) || navigator.standalone) {
    return;
  }

  const debug = false;

  const capableDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
  const defaultSplashColor = '#f8f9fa';
  const defaultSplashTextSize = 24;
  const defaultFontName = 'HelveticaNeue-CondensedBold';
  const idealSplashIconSize = 128;
  const minimumSplashIconSize = 48;
  const splashIconPadding = 20;
  const appleIconSizeMin = 120;

  const userAgent = navigator.userAgent || '';
  const isSafari = (navigator.vendor && navigator.vendor.indexOf('Apple') !== -1);
  const isSafariMobile = isSafari && (userAgent.indexOf('Mobile/') !== -1 || 'standalone' in navigator) || debug;
  const isIEOrEdge = Boolean(userAgent.match(/(MSIE |Edge\/|Trident\/)/));
  const isEdgePWA = (typeof Windows !== 'undefined');

  let manifestEl;  // we need this later, not just for JSON
  let internalStorage;
  try {
    internalStorage = sessionStorage;
  } catch (e) {}
  internalStorage = internalStorage || {};

  /**
   * Retrieves element in head if available, otherwise null
   * @param {string} selector CSS selector
   * @return {?Element}
   */
  function getElementInHead(selector) {
    // It's possible to pass "bad" attr or values here (originally from the manifest); just
    // return null if there's something wrong.
    try {
      return document.head.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {string} k
   * @param {string=} v
   * @return {string|undefined}
   */
  function store(k, v) {
    const key = '__pwacompat_' + k;
    if (v !== undefined) {
      internalStorage[key] = v;
    }
    return internalStorage[key];
  }

  function setup() {
    manifestEl = getElementInHead('link[rel="manifest"]');
    const manifestHref = manifestEl ? manifestEl.href : '';
    if (!manifestHref) {
      throw `can't find <link rel="manifest" href=".." />'`;
    }

    const hrefFactory = buildHrefFactory([manifestHref, location]);
    const storedResponse = store('manifest');
    if (storedResponse) {
      try {
        const data = /** @type {!Object<string, *>} */ (JSON.parse(storedResponse));
        process(data, hrefFactory);
      } catch (err) {
        console.warn('PWACompat error', err);
      }
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', manifestHref);

    // nb. use getAttribute for older brower safety
    xhr.withCredentials = (manifestEl.getAttribute('crossorigin') === 'use-credentials');

    // this is IE10+
    xhr.onload = () => {
      try {
        const data = /** @type {!Object<string, *>} */ (JSON.parse(xhr.responseText));
        store('manifest', xhr.responseText);
        process(data, hrefFactory);
      } catch (err) {
        console.warn('PWACompat error', err);
      }
    };
    xhr.send(null);
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
        return (part) => (new URL(part || '', opt)).toString();
      } catch (e) {}
    }
    return (part) => part || '';
  }

  /**
   * Adds an element in the <head> if it's not present already based on the passed check.
   * @param {string} localName tag name
   * @param {!Object<string>} attr key-value collection of attributes
   * @param {string} check to apply to the tag
   */
  function push(localName, attr, check) {
    if (getElementInHead(localName + check)) {
      return;
    }
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
      push('meta', {name, content}, `[name="${name}"]`);
    }
  }

  /**
   * Pre-process the icon sizes and purpose into a tuple and array.
   */
  function normalizeIcon(icon) {
    const parsedSizes = icon.sizes.split(/\s+/g).map((size) => {
      if (size === 'any') {
        return Infinity;
      }
      return parseInt(size, 10) || 0; // NaN is falsey
    });

    return {
      src: icon.src,
      type: icon.type,
      sizes: icon.sizes,
      // Get the largest size from a processed icon.
      largestSize: Math.max.apply(null, parsedSizes),
      purpose: icon.purpose ? icon.purpose.split(/\s+/g) : ['any'],
    };
  }

  /**
   * @param {!Object<string, (string|*)>} manifest
   * @param {function(string): string} urlFactory
   */
  function process(manifest, urlFactory) {
    // largest first
    const allIcons = (manifest['icons'] || [])
      .map(normalizeIcon)
      .sort((a, b) => b.largestSize - a.largestSize);

    const icons = allIcons.filter((icon) => icon.purpose.indexOf('any') > -1)
    const maskable = allIcons.filter((icon) => icon.purpose.indexOf('maskable') > -1);

    const appleTouchIcons = (maskable.length > 0 ? maskable : icons).map((icon) => {
      // create regular link icons as byproduct
      const attr = {'rel': 'icon', 'href': urlFactory(icon['src']), 'sizes': icon['sizes']};
      // This checks for matching "rel" and "sizes". We don't check for the same image file, as
      // it is used literally by ourselves (and could be set by users for another icon).
      const querySuffix = `[sizes="${icon['sizes']}"]`;
      push('link', attr, '[rel="icon"]' + querySuffix);
      if (!isSafariMobile) {
        return;
      }
      if (icon.largestSize < appleIconSizeMin) {
        return;
      }
      attr['rel'] = 'apple-touch-icon';

      // nb. we used to call `removeAttribute('sizes')` here, which crashed iOS 8
      // ... sizes has been supported since iOS 4.2 (!)
      return push('link', attr, '[rel="apple-touch-icon"]' + querySuffix);
    }).filter(Boolean);

    // nb. only for iOS, but watch for future CSS rule `@viewport { viewport-fit: cover; }`
    const metaViewport = getElementInHead('meta[name="viewport"]');
    const viewport = metaViewport && metaViewport.content || '';
    const viewportFitCover = Boolean(viewport.match(/\bviewport-fit\s*=\s*cover\b/));

    const display = manifest['display'];
    const isCapable = capableDisplayModes.indexOf(display) !== -1;
    meta('mobile-web-app-capable', isCapable);
    updateThemeColorRender(/** @type {string} */ (manifest['theme_color']) || 'black', viewportFitCover);

    if (isIEOrEdge) {
      // Pinned Sites, largely from https://technet.microsoft.com/en-us/windows/dn255024(v=vs.60)
      meta('application-name', manifest['short_name']);
      meta('msapplication-tooltip', manifest['description']);
      meta('msapplication-starturl', urlFactory(/** @type {string} */ (manifest['start_url']) || '.'));
      meta('msapplication-navbutton-color', manifest['theme_color']);

      const largest = icons[0];
      if (largest) {
        meta('msapplication-TileImage', urlFactory(largest['src']));
      }
      meta('msapplication-TileColor', manifest['background_color']);
    }

    meta('theme-color', manifest['theme_color']);

    if (!isSafariMobile) {
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

      return;  // the rest of this file is for Mobile Safari
    }

    const backgroundColor =
        /** @type {string} */ (manifest['background_color']) || defaultSplashColor;
    const backgroundIsLight = shouldUseLightForeground(backgroundColor);

    // Add related iTunes app from manifest.
    const itunes = findAppleId(manifest['related_applications']);
    itunes && meta('apple-itunes-app', `app-id=${itunes}`);

    // General iOS meta tags.
    meta('apple-mobile-web-app-capable', isCapable);
    meta('apple-mobile-web-app-title', manifest['short_name'] || manifest['name']);

    /**
     * @param {number} width
     * @param {number} height
     * @param {string} orientation
     * @param {?Image} icon
     * @return {function(): string}
     */
    function splashFor(width, height, orientation, icon) {
      const ratio = window.devicePixelRatio;
      const ctx = contextForCanvas({width: width * ratio, height: height * ratio});

      ctx.scale(ratio, ratio);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.translate(width / 2, (height - splashIconPadding) / 2);

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

      ctx.fillStyle = backgroundIsLight ? 'white' : 'black';
      ctx.font = `${defaultSplashTextSize}px ${defaultFontName}`;

      // Set the user-requested font; if it's invalid, the set will fail.
      const s = getComputedStyle(manifestEl);
      ctx.font = s.getPropertyValue('--pwacompat-splash-font'); // blank for old browsers

      const title = manifest['name'] || manifest['short_name'] || document.title;
      const measure = ctx.measureText(title);
      const textHeight = (measure.actualBoundingBoxAscent || defaultSplashTextSize);
      ctx.translate(0, textHeight);

      if (measure.width < width * 0.8) {
        // short-circuit, just draw entire string
        ctx.fillText(title, measure.width / -2, 0);
      } else {
        // longer wrap case, draw once we have >0.7 width accumulated
        const words = title.split(/\s+/g);
        for (let i = 1; i <= words.length; ++i) {
          const cand = words.slice(0, i).join(' ');
          const measureWidth = ctx.measureText(cand).width;
          if (i === words.length || measureWidth > width * 0.6) {
            // render accumulated words
            ctx.fillText(cand, measureWidth / -2, 0);
            ctx.translate(0, textHeight * 1.2);
            words.splice(0, i);
            i = 0;
          }
        }
      }

      return () => {
        const data = ctx.canvas.toDataURL();
        if (debug) {
          const img = document.createElement('img');
          img.src = data;
          document.body.append(img);
        }
        appendSplash(orientation, data);
        return data;
      };
    }

    /**
     * @param {string} orientation
     * @param {string} data
     */
    function appendSplash(orientation, data) {
      const generatedSplash = /** @type {!HTMLLinkElement} */ (document.createElement('link'));
      generatedSplash.setAttribute('rel', 'apple-touch-startup-image');
      generatedSplash.setAttribute('media', `(orientation: ${orientation})`);
      generatedSplash.setAttribute('href', data);
      document.head.appendChild(generatedSplash);
    }

    // fetch previous (session) iOS image updates
    const rendered = store('iOS');
    if (!debug && rendered) {
      try {
        const prev = /** @type {!Object<string, string>} */ (JSON.parse(rendered));
        appendSplash('portrait', prev['p']);
        appendSplash('landscape', prev['l']);
        appleTouchIcons.forEach((icon) => {
          const change = prev['i'][icon.href];
          if (change) {
            icon.href = change;
          }
        });
        return;
      } catch (e) {
        // ignore, some problem with the JSON
      }
    }
    const update = {'i': {}};

    /**
     * @param {?Image} applicationIcon
     * @param {function(): void} done
     */
    function renderBothSplash(applicationIcon, done) {
      const s = window.screen;
      const portrait = splashFor(s.width, s.height, 'portrait', applicationIcon);
      const landscape = splashFor(s.height, s.width, 'landscape', applicationIcon);

      // this is particularly egregious setTimeout use, but the .toDataURL() is one of the
      // "bottlenecks" of PWACompat, so don't elongate any single frame more than needed.

      setTimeout(() => {
        update['p'] = portrait();
        setTimeout(() => {
          update['l'] = landscape();
          done();
        }, 10);
      }, 10);
    }

    // fetches and redraws any remaining icons in appleTouchIcons (to have proper bg)
    function redrawRemainingIcons(done) {
      let left = appleTouchIcons.length + 1;
      const check = () => {
        if (!--left) {
          done();
        }
      };
      check();
      appleTouchIcons.forEach((icon) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onerror = check;
        img.onload = () => {
          img.onload = null;
          icon.href = updateTransparent(img, backgroundColor, true);
          update['i'][img.src] = icon.href;
          check();
        };
        img.src = icon.href;
      });
    }

    // write the update to sessionStorage
    function saveUpdate() {
      store('iOS', JSON.stringify(update));
    }

    // called repeatedly until a valid icon is found
    function fetchIconAndBuildSplash() {
      const icon = appleTouchIcons.shift();
      if (!icon) {
        renderBothSplash(null, saveUpdate);  // ran out of icons, render without one
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => void fetchIconAndBuildSplash();  // try again
      img.onload = () => {
        img.onload = null;  // iOS Safari might call this many times
        renderBothSplash(img, () => {
          // ... if the icon used for splash changed, redraw others too
          const redrawn = manifest['background_color'] && updateTransparent(img, backgroundColor);
          if (redrawn) {
            icon.href = redrawn;
            update['i'][img.src] = redrawn;
            redrawRemainingIcons(saveUpdate);
          } else {
            saveUpdate();
          }
        });
      };

      img.src = icon.href;  // trigger load
    }
    fetchIconAndBuildSplash();
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
    const prefix = String(v || '').substr(0, 3);
    return {'por': 'portrait', 'lan': 'landscape'}[prefix] || '';
  }

  /**
   * @param {string} color
   * @param {boolean} viewportFitCover
   */
  function updateThemeColorRender(color, viewportFitCover) {
    if (!(isSafariMobile || isEdgePWA)) {
      return;
    }

    const themeIsLight = shouldUseLightForeground(color);
    if (isSafariMobile) {
      // nb. Safari 11.3+ gives a deprecation warning about this meta tag.
      const content = viewportFitCover ? 'black-translucent' : (themeIsLight ? 'black' : 'default');
      meta('apple-mobile-web-app-status-bar-style', content);
    } else {
      // Edge PWA
      const t = getEdgeTitleBar();
      if (!t) {
        return;  // something went wrong, we had a UWP without titleBar
      }
      // Foreground is black if theme is light, otherwise white.
      const v = themeIsLight ? 255 : 0;
      t.foregroundColor = /** @type {WindowsColor} */ ({'r': v, 'g': v, 'b': v, 'a': 255});
      t.backgroundColor = colorToWindowsRGBA(color);
    }
  }

  /**
   * @return {!ApplicationViewTitleBar|undefined}
   */
  function getEdgeTitleBar() {
    try {
      return Windows.UI.ViewManagement.ApplicationView.getForCurrentView().titleBar;
    } catch (e) {
      // implicit return undefined
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
    return c.getImageData(0, 0, 1, 1).data || [];  // incase this fails for some reason
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
      if (imageData.data[3] === 255) {
        return;
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
