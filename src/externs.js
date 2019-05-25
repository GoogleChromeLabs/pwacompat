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

/**
 * @externs
 */

var Windows;

Windows.UI;

Windows.UI.ViewManagement;

Windows.UI.ViewManagement.ApplicationView;

/**
 * @return {{titleBar: ApplicationViewTitleBar}}
 */
Windows.UI.ViewManagement.ApplicationView.getForCurrentView = function() {};

/**
 * @typedef {{
 *   r: number,
 *   g: number,
 *   b: number,
 *   a: number,
 * }}
 */
var WindowsColor;

/**
 * @typedef {{
 *   foregroundColor: WindowsColor,
 *   backgroundColor: WindowsColor,
 *   buttonForegroundColor: WindowsColor,
 *   buttonBackgroundColor: WindowsColor,
 *   buttonHoverForegroundColor: WindowsColor,
 *   buttonHoverBackgroundColor: WindowsColor,
 *   inactiveForegroundColor: WindowsColor,
 *   inactiveBackgroundColor: WindowsColor,
 *   buttonInactiveForegroundColor: WindowsColor,
 *   buttonInactiveBackgroundColor: WindowsColor,
 *   buttonInactiveHoverForegroundColor: WindowsColor,
 *   buttonInactiveHoverBackgroundColor: WindowsColor,
 *   buttonPressedForegroundColor: WindowsColor,
 *   buttonPressedBackgroundColor: WindowsColor,
 * }}
 */
var ApplicationViewTitleBar;