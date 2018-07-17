#!/usr/bin/env node
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

// TODO(samthor): This file exists so we can serve test resources over HTTP for CI. Should break
// into a helper, this seems like a common problem folks need to solve.

const childProcess = require('child_process');
const handler = require('serve-handler');
const http = require('http');

const port = 9223;
const server = http.createServer(handler);

server.listen(port, () => {
  const cmd = 'mocha-headless-chrome';
  const args = ['-f', `http://localhost:${port}/suite.html`];
  if (process.env.CI) {
    args.push(
      '-a', 'no-sandbox',
      '-a', 'disable-setuid-sandbox',
    );
  }

  const p = childProcess.spawn(cmd, args, {cwd: '.'});
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  p.on('close', (code) => process.exit(code));
});
