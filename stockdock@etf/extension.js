import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {parseStooqCsv} from './lib/quoteParser.js';
import {evaluateNotifications, formatQuoteLabel} from './lib/stockLogic.js';

const FETCH_INTERVAL_SECONDS = 60;

const StockIndicator = GObject.registerClass(
class StockIndicator extends PanelMenu.Button {
  constructor(extension, settings) {
    super(0.0, 'Stock Dock');
    log('Stock Dock: indicator constructed');

    this._extension = extension;
    this._settings = settings;
    this._session = new Soup.Session();
    this._timeoutId = 0;
    this._index = 0;
    this._notifyState = new Map();

    this._box = new St.BoxLayout({style_class: 'stockdock-box'});
    this._icon = new St.Icon({
      icon_name: 'go-up-symbolic',
      style_class: 'system-status-icon',
    });
    this._label = new St.Label({
      text: 'Loading...',
      y_align: Clutter.ActorAlign.CENTER,
    });

    this._box.add_child(this._icon);
    this._box.add_child(this._label);
    this.add_child(this._box);

    this._menuItem = new PopupMenu.PopupMenuItem('Preferences');
    this._menuItem.connect('activate', () => {
      this._extension.openPreferences().catch((error) => {
        logError(error, 'Stock Dock preferences failed to open');
      });
    });
    this.menu.addMenuItem(this._menuItem);

    this._start();
  }

  destroy() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = 0;
    }
    super.destroy();
  }

  _start() {
    this._update();
    this._timeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      FETCH_INTERVAL_SECONDS,
      () => {
        this._update();
        return GLib.SOURCE_CONTINUE;
      }
    );
  }

  async _update() {
    const tickers = this._settings
      .get_strv('tickers')
      .filter((ticker) => typeof ticker === 'string' && ticker.trim().length > 0);
    if (!tickers.length) {
      this._setLabel('No tickers');
      this._clearStyle();
      return;
    }

    const ticker = tickers[this._index % tickers.length];
    this._index = (this._index + 1) % tickers.length;

    try {
      const quote = await this._fetchQuote(ticker);
      if (!quote) {
        this._setLabel(`${ticker.toUpperCase()} --`);
        this._clearStyle();
        return;
      }

      const {open, close} = quote;
      const formatted = formatQuoteLabel(ticker, open, close);
      if (!formatted) {
        this._setLabel(`${ticker.toUpperCase()} --`);
        this._clearStyle();
        return;
      }

      const color = formatted.isGain
        ? this._settings.get_string('gain-color')
        : this._settings.get_string('loss-color');

      this._icon.icon_name = formatted.iconName;
      this._setStyle(color);
      this._setLabel(formatted.label);

      this._checkNotifications(ticker, close);
    } catch (error) {
      logError(error, 'Stock Dock update failed');
      this._setLabel(`${ticker.toUpperCase()} err`);
      this._clearStyle();
    }
  }

  _setLabel(text) {
    this._label.text = text;
  }

  _setStyle(color) {
    this._icon.set_style(`color: ${color};`);
    this._label.set_style(`color: ${color};`);
  }

  _clearStyle() {
    this._icon.set_style('');
    this._label.set_style('');
  }

  _checkNotifications(ticker, price) {
    const minMap = this._settings.get_value('min-notify-map').deep_unpack();
    const maxMap = this._settings.get_value('max-notify-map').deep_unpack();
    const minNotify = Number.isFinite(minMap[ticker]) ? minMap[ticker] : null;
    const maxNotify = Number.isFinite(maxMap[ticker]) ? maxMap[ticker] : null;
    const state = this._notifyState.get(ticker) || {min: false, max: false};

    const result = evaluateNotifications({
      ticker,
      price,
      minThreshold: minNotify,
      maxThreshold: maxNotify,
      previousState: state,
    });

    result.notifications.forEach((note) => {
      Main.notify(note.title, note.body);
    });

    this._notifyState.set(ticker, result.state);
  }

  async _fetchQuote(ticker) {
    const symbol = ticker.toLowerCase();
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
    const data = await this._fetchText(url);
    return parseStooqCsv(data);
  }

  async _fetchText(url) {
    return new Promise((resolve, reject) => {
      const message = Soup.Message.new('GET', url);
      this._session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
        (_session, result) => {
          try {
            const bytes = this._session.send_and_read_finish(result);
            if (message.get_status() !== Soup.Status.OK) {
              reject(new Error(`HTTP ${message.get_status()}`));
              return;
            }
            const decoder = new TextDecoder('utf-8');
            resolve(decoder.decode(bytes.get_data()));
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

});

export default class StockDockExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._indicator = new StockIndicator(this, this._settings);
    Main.panel.addToStatusArea('stockdock', this._indicator, 1, 'right');
    log('Stock Dock: enabled');
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
    this._settings = null;
  }
}
