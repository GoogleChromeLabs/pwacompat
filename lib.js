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

/**
 * @param {!Object} manifest Parsed JSON manifest.
 * @return {!Array<{name: string, attr: !Object}>}
 */
function parse(manifest) {
  const out = [];

  function createMeta(name, value) {
    if (!value) { return; }
    out.push({
      name: 'meta',
      attr: {
        'name': name,
        'content': value === true ? 'yes' : value,
      },
    });
  }

  const capable = ['standalone', 'fullscreen'].indexOf(manifest['display']) !== -1;
  createMeta('apple-mobile-web-app-capable', capable);
  createMeta('mobile-web-app-capable', capable);
  createMeta('apple-mobile-web-app-title', manifest['short_name'] || manifest['name']);
  createMeta('msapplication-starturl', manifest['start_url'] || '/');
  createMeta('msapplication-TileColor', manifest['theme_color']);

  // nb. pwacompat does _not_ create the meta 'theme-color', as browsers that support the manifest
  // file don't use its 'theme_color' when the webpage is just loaded in a normal browser (as of
  // July 2016). So be sure to set it yourself.

  // TODO(samthor): Set 'apple-mobile-web-app-status-bar-style' to 'black' for dark theme-color,
  // and use 'default' for light theme-color.

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

  // Parse the icons.
  const icons = manifest['icons'] || [];
  icons.sort((a, b) => {
    return parseInt(b.sizes, 10) - parseInt(a.sizes, 10);  // sort larger first
  });
  icons.forEach(icon => {
    out.push({
      name: 'link',
      attr: {
        'rel': 'icon',
        'href': icon.src,
        'sizes': icon.sizes,
      },
    });
    out.push({
      name: 'link',
      attr: {
        'rel': 'apple-touch-icon',
        'href': icon.src,
        'sizes': icon.sizes,
      },
    });
  });

  return out;
}

module.exports = parse;
