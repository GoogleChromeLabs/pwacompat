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

const parse = require('./lib');
const escapeHTML = require('escape-html');

module.exports = function(manifest) {
  const tags = parse(manifest);
  const text = tags.map(tag => {
    const attrs = Object.keys(tag.attr).map(name => {
      const v = tag.attr[name];
      return `${name}="${escapeHTML(v)}"`
    });
    return `<${tag.name} ${attrs.join(' ')}/>`
  });
  return text.join('\n');
};