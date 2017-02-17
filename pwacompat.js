/*
 * Copyright 2016 Google Inc. All rights reserved.
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
  const compat = !!navigator.serviceWorker;
  const hasAnyIcon = document.head.querySelector('link[type|="icon"]');
  // if we have any icon, and are already compatible (have service worker), then fail out
  if (hasAnyIcon && compat) { return; }

  const storageKey = 'pwacompat.js';
  const manifestEl = document.head.querySelector('link[rel="manifest"]');
  if (!manifestEl || !manifestEl.href) {
    console.warn('pwacompat.js can\'t operate: no <link rel="manifest" ... /> found');
    return;  // no manifest
  }

  // see: https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API
  const isNormalLoad = (window.performance && window.performance.navigation.type !== 1);
  fetchManifest(processManifest, navigator['standalone'] || isNormalLoad);

  function fetchManifest(callback, preferSkip) {
    if (preferSkip) {  // avoid performing XHR
      let manifest;
      try {
        manifest = JSON.parse(window.localStorage[storageKey]);
      } catch (e) {
        // ignore
      }
      if (manifest) {
        callback(manifest);
        return;
      }
    }
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const manifest = JSON.parse(xhr.responseText);
      try {
        window.localStorage[storageKey] = xhr.responseText;
      } catch (e) {
        // can't save, maybe out of space or private mode, ignore
      }
      callback(manifest);
    };
    xhr.open('GET', manifestEl.href);
    xhr.send();
  }

  function processManifest(manifest) {
    const parse = require('./lib');
    parse(manifest, compat).forEach(tag => {
      const node = document.createElement(tag.name);
      for (const k in tag.attr) {
        node.setAttribute(k, tag.attr[k]);
      }
      document.head.appendChild(node);
    });

    // If this is a standalone iOS ATHS app, perform setup actions.
    if (navigator['standalone']) {
      iosStandalone(manifest);
    }
  }

  function iosStandalone(manifest) {
    // Intercept clicks, and if they're on the same domain, keep them in the window by updating
    // the location rather than following the link proper.
    document.addEventListener('click', ev => {
      if (ev.target.tagName !== 'A') { return; }
      const linkedUrl = new URL(ev.target.href);  // computes target domain/origin for us
      if (linkedUrl.origin !== location.origin) {
        // do nothing, this will open in a new tab
        window.localStorage[storageKey + ':out'] = location.href;
      } else {
        // local navigation, prevent page load
        ev.preventDefault();
        window.location = ev.target.href;
      }
    });

    if (!window.sessionStorage || window.sessionStorage['loaded']) { return; }
    window.sessionStorage['loaded'] = true;

    // If this is the first page load, load 'start_url' from the manifest file.
    const startUrl = window.localStorage[storageKey + ':out'] || manifest['start_url'];
    delete window.localStorage[storageKey + ':out'];
    const ours = window.location.href + window.location.search;
    if (!startUrl || startUrl == ours) {
      // no start_url or return url available
    } else if (startUrl.replace(/#.*$/, '') == ours) {
      window.location.hash = startUrl.substr(startUrl.indexOf('#'));  // same, different hash
    } else {
      window.location = startUrl;
    }
  }

})();

