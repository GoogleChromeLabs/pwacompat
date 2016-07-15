#!/usr/bin/env node
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

/**
 * @fileoverview Command-line Node script to build the pwacompat.min.js output.
 */

'use strict';

const browserify = require('browserify');
const compile = require('google-closure-compiler-js').compile;
const fs = require('fs');
const process = require('process');

browserify('./pwacompat.js').bundle((err, buffer) => {
  if (err) {
    throw new Error(err);
  }

  // TODO(samthor): Some of this should be done in google-closure-compiler-js.
  const externs = [
    {source: 'function require(x) {};\n'},
  ];
  const externsPath = 'node_modules/google-closure-compiler-js/externs/browser';
  fs.readdirSync(externsPath).forEach(name => {
    externs.push({
      source: fs.readFileSync(externsPath + '/' + name, 'UTF-8'),
      name: name,
    });
  });

  const source = buffer.toString();
  const opts = {
    jsCode: [{name: 'pwacompat.js', source}],
    externs,
    compilationLevel: 'ADVANCED',
    warningLevel: 'VERBOSE',
  };
  const out = compile(opts);
  function log(error) {
    process.stderr.write(JSON.stringify(error) + '\n');
  }
  out.errors.forEach(log);
  out.warnings.forEach(log);
  if (out.errors.length) {
    throw new Error(`got ${out.errors.length} errors, ${out.warnings.length} warnings`);
  }
  process.stdout.write(out.compiledCode);
});
