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
const CONTEXT_MENU_VERSION = 'Version: 0.1.1';

const StockIndicator = GObject.registerClass(
class StockIndicator extends PanelMenu.Button {
  constructor(extension, settings) {
    super(0.0, 'Stock Dock', true);
    log('Stock Dock: indicator constructed');

    this._extension = extension;
    this._settings = settings;
    this._session = new Soup.Session();
    this._timeoutId = 0;
    this._index = 0;
    this._updateToken = 0;
    this._isDestroyed = false;
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
    this._initContextMenu();

    this._start();
  }

  destroy() {
    this._isDestroyed = true;
    this._updateToken += 1;
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = 0;
    }
    if (this._session) {
      this._session.abort();
      this._session = null;
    }
    if (this._menuManager && this._contextMenu) {
      this._menuManager.removeMenu(this._contextMenu);
      this._menuManager = null;
    }
    if (this._contextMenu) {
      this._contextMenu.destroy();
      this._contextMenu = null;
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

  vfunc_event(event) {
    const type = event.type();
    if (type === Clutter.EventType.BUTTON_PRESS) {
      const button = event.get_button();
      if (button === Clutter.BUTTON_PRIMARY) {
        if (this._contextMenu?.isOpen) {
          this._contextMenu.close();
        }
        this._update();
        return Clutter.EVENT_STOP;
      }
      if (button === Clutter.BUTTON_SECONDARY) {
        this._contextMenu?.toggle();
        return Clutter.EVENT_STOP;
      }
    }

    if (type === Clutter.EventType.BUTTON_RELEASE) {
      const button = event.get_button();
      if (button === Clutter.BUTTON_PRIMARY || button === Clutter.BUTTON_SECONDARY) {
        return Clutter.EVENT_STOP;
      }
    }

    return super.vfunc_event(event);
  }

  _initContextMenu() {
    this._contextMenu = new PopupMenu.PopupMenu(this, 0.5, St.Side.TOP);
    Main.uiGroup.add_child(this._contextMenu.actor);
    this._contextMenu.actor.hide();

    this._menuManager = new PopupMenu.PopupMenuManager(this);
    this._menuManager.addMenu(this._contextMenu);

    const preferencesItem = new PopupMenu.PopupMenuItem('Preferences');
    preferencesItem.connect('activate', () => this._openPreferences());
    this._contextMenu.addMenuItem(preferencesItem);

    this._contextMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this._contextMenu.addMenuItem(
      new PopupMenu.PopupMenuItem(CONTEXT_MENU_VERSION, {
        reactive: false,
        can_focus: false,
      })
    );
  }

  async _update() {
    if (this._isDestroyed) {
      return;
    }
    const updateToken = ++this._updateToken;
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
      if (!this._canApplyUpdate(updateToken)) {
        return;
      }
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
      if (!this._canApplyUpdate(updateToken)) {
        return;
      }
      logError(error, 'Stock Dock update failed');
      this._setLabel(`${ticker.toUpperCase()} err`);
      this._clearStyle();
    }
  }

  _canApplyUpdate(updateToken) {
    return !this._isDestroyed && updateToken === this._updateToken;
  }

  _openPreferences() {
    if (this._contextMenu?.isOpen) {
      this._contextMenu.close();
    }
    this._extension.openPreferences().catch((error) => {
      logError(error, 'Stock Dock preferences failed to open');
    });
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
      if (!this._session) {
        reject(new Error('HTTP session unavailable'));
        return;
      }
      const session = this._session;
      const message = Soup.Message.new('GET', url);
      session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
        (_session, result) => {
          try {
            const bytes = session.send_and_read_finish(result);
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
