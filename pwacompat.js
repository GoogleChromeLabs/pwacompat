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
  if (navigator.serviceWorker) { return; }

  const storageKey = 'progressr.js';
  const manifestEl = document.head.querySelector('link[rel="manifest"]');
  if (!manifestEl || !manifestEl.href) {
    console.warn('progressr.js can\'t operate: no <link rel="manifest" ... /> found');
    return;  // no manifest
  }

  fetchManifest(processManifest, navigator['standalone']);

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
    /**
     * @param {string} name
     * @param {string|boolean|null} value
     */
    function createMeta(name, value) {
      if (!value) { return; }
      const tag = document.createElement('meta');
      tag.setAttribute('name', name);
      tag.setAttribute('content', value === true ? 'yes' : value);
      document.head.appendChild(tag);
    }

    const capable = ['standalone', 'fullscreen'].indexOf(manifest['display']) !== -1;
    createMeta('apple-mobile-web-app-capable', capable);
    createMeta('mobile-web-app-capable', capable);
    createMeta('apple-mobile-web-app-title', manifest['short_name'] || manifest['name']);
    createMeta('msapplication-starturl', manifest['start_url'] || '/');
    createMeta('msapplication-TileColor', manifest['theme_color']);
    createMeta('theme-color', manifest['theme_color']);

    let itunes;
    (manifest['related_applications'] || [])
        .filter(app => app['platform'] == 'itunes')
        .forEach(app => {
          if (app['id']) {
            itunes = app['id'];
          } else {
            const match = app['url'].match(/id(\d+)/);
            if (match) {
              itunes = match[1];
            }
          }
        });
    if (itunes) {
      createMeta('apple-itunes-app', `app-id=${itunes}`)
    }

    // nb. this doesn't set 'apple-mobile-web-app-status-bar-style', as using 'black-translucent'
    // moves the page up behind the status bar.
    // TODO(samthor): Use white for a bright theme-color, black for a dark one.

    // Parse the icons.
    const icons = manifest['icons'] || [];
    icons.sort((a, b) => {
      // sort larger first
      return parseInt(b.sizes, 10) - parseInt(a.sizes, 10);
    });
    icons.forEach(icon => {
      const iconEl = document.createElement('link');
      iconEl.setAttribute('rel', 'apple-touch-icon');
      iconEl.setAttribute('href', icon.src);
      iconEl.setAttribute('sizes', icon.sizes);
      document.head.appendChild(iconEl);
    });

    if (navigator['standalone']) {
      iosStandalone(manifest);
    }
  }

  function iosStandalone(manifest) {
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

    if (sessionStorage['loaded']) { return; }
    sessionStorage['loaded'] = true;

    const startUrl = window.localStorage[storageKey + ':out'] || manifest['start_url'];
    delete window.localStorage[storageKey + ':out'];
    const ours = window.location.href + window.location.search;
    if (!startUrl || startUrl == ours) {
      return;  // no start_url or return url available
    }

    if (startUrl.replace(/#.*$/, '') == ours) {
      window.location.hash = startUrl.substr(startUrl.indexOf('#'));  // same, different hash
    } else {
      window.location = startUrl;
      throw new Error('stop, changed url');  // should never get here
    }
  }

})();

