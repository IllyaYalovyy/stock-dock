import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const extensionPath = path.resolve('stockdock@etf/extension.js');
const source = fs.readFileSync(extensionPath, 'utf8');

// Guard against the GNOME Shell GType error by requiring GObject.registerClass
// for PanelMenu.Button subclasses.
const hasRegisterClass = /GObject\.registerClass\(/.test(source);
assert.ok(
  hasRegisterClass,
  'extension.js must use GObject.registerClass() for GObject subclasses'
);

const panelMenuSubclass = /class\s+\w+\s+extends\s+PanelMenu\.Button/.test(source);
assert.ok(
  !panelMenuSubclass || hasRegisterClass,
  'PanelMenu.Button subclass must be wrapped in GObject.registerClass()'
);

console.log('gjs-guard tests passed');
