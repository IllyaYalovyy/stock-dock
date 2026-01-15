import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import {formatThresholdMap, parseThresholdMapText} from './lib/thresholdMap.js';

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.stockdock';

export default class StockDockPreferences {
  constructor(metadata) {
    this._settings = this._loadSettings(metadata);
  }

  getSettings() {
    return this._settings;
  }

  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    window._settings = settings;

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({
      title: 'Stocks',
      description: 'Configure tickers, thresholds, and colors.',
    });

    const tickerRow = new Adw.ActionRow({
      title: 'Tickers',
      subtitle: 'Comma-separated list (e.g. aapl.us, msft.us)',
    });
    const tickerEntry = new Gtk.Entry({
      hexpand: true,
      text: settings.get_strv('tickers').join(', '),
    });
    tickerEntry.connect('changed', () => {
      const value = tickerEntry.text
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      settings.set_strv('tickers', value);
    });
    tickerRow.add_suffix(tickerEntry);
    tickerRow.activatable_widget = tickerEntry;

    const minRow = new Adw.ActionRow({
      title: 'Min notify map',
      subtitle: 'Comma-separated pairs (e.g. aapl.us=120.5, msft.us=300)',
    });
    const minEntry = new Gtk.Entry({hexpand: true});
    minEntry.text = this._mapToEntryText(settings.get_value('min-notify-map'));
    minEntry.connect('changed', () => {
      const map = this._entryTextToMap(minEntry.text);
      settings.set_value('min-notify-map', map);
    });
    minRow.add_suffix(minEntry);
    minRow.activatable_widget = minEntry;

    const maxRow = new Adw.ActionRow({
      title: 'Max notify map',
      subtitle: 'Comma-separated pairs (e.g. aapl.us=200, msft.us=450)',
    });
    const maxEntry = new Gtk.Entry({hexpand: true});
    maxEntry.text = this._mapToEntryText(settings.get_value('max-notify-map'));
    maxEntry.connect('changed', () => {
      const map = this._entryTextToMap(maxEntry.text);
      settings.set_value('max-notify-map', map);
    });
    maxRow.add_suffix(maxEntry);
    maxRow.activatable_widget = maxEntry;

    const gainRow = new Adw.ActionRow({
      title: 'Gain color',
      subtitle: 'CSS color (e.g. #2ecc71)',
    });
    const gainEntry = new Gtk.Entry({
      hexpand: true,
    });
    settings.bind('gain-color', gainEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
    gainRow.add_suffix(gainEntry);
    gainRow.activatable_widget = gainEntry;

    const lossRow = new Adw.ActionRow({
      title: 'Loss color',
      subtitle: 'CSS color (e.g. #e74c3c)',
    });
    const lossEntry = new Gtk.Entry({
      hexpand: true,
    });
    settings.bind('loss-color', lossEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
    lossRow.add_suffix(lossEntry);
    lossRow.activatable_widget = lossEntry;

    group.add(tickerRow);
    group.add(minRow);
    group.add(maxRow);
    group.add(gainRow);
    group.add(lossRow);
    page.add(group);
    window.add(page);
  }

  _loadSettings(metadata) {
    const schemaDir = metadata.dir.get_child('schemas').get_path();
    const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
      schemaDir,
      Gio.SettingsSchemaSource.get_default(),
      false
    );
    const schema = schemaSource.lookup(SETTINGS_SCHEMA, true);
    if (!schema) {
      throw new Error(`Schema ${SETTINGS_SCHEMA} not found in ${schemaDir}`);
    }
    return new Gio.Settings({settings_schema: schema});
  }

  _mapToEntryText(variant) {
    const map = variant.deep_unpack();
    return formatThresholdMap(map);
  }

  _entryTextToMap(text) {
    const entries = parseThresholdMapText(text);
    return new GLib.Variant('a{sd}', entries);
  }
}
