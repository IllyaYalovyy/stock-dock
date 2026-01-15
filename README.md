# Stock Dock

Stock Dock is a small GNOME Shell extension that rotates a handful of stock prices in the top bar. It keeps the UI compact, shows the daily change at a glance, and can alert you when a price crosses a threshold you care about.

## Why

I wanted a tiny, no-frills way to watch a few tickers without opening a full dashboard. This extension focuses on a single line of information that updates regularly and stays out of the way.

## Features

- Rotating ticker display in the top bar
- Color-coded gain/loss and up/down indicator
- Optional min/max price notifications per ticker
- Preferences UI built with libadwaita

## Data source

The default data source is the Stooq CSV endpoint. It is free and does not require an API key. If you need more frequent updates or different markets, you can swap in another provider by adjusting the fetcher logic.

## Install (local dev)

1. Link or copy the extension into GNOME Shell extensions:

```
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$(pwd)/stockdock@etf" ~/.local/share/gnome-shell/extensions/stockdock@etf
```

2. Compile schemas:

```
glib-compile-schemas stockdock@etf/schemas
```

3. Restart GNOME Shell (Alt+F2, type `r`, Enter) or log out/in.
4. Enable the extension in the Extensions app.

## Configuration

- `tickers`: comma-separated list
- `min-notify-map` / `max-notify-map`: per-ticker price thresholds (e.g. `aapl.us=120.5, msft.us=300`)
- `gain-color` / `loss-color`: CSS colors like `#2ecc71` / `#e74c3c`

## Development

Run tests that do not require GNOME Shell:

```
npm test
```

Static guard for common GJS/GObject pitfalls:

```
npm run check
```

More details live in `docs/DEVELOPMENT.md`.

## Project layout

```
stock-dock/
  README.md
  CONTRIBUTING.md
  LICENSE
  docs/
    DEVELOPMENT.md
  stockdock@etf/
    metadata.json
    extension.js
    prefs.js
    lib/
      quoteParser.js
      stockLogic.js
      thresholdMap.js
    stylesheet.css
    icons/
      stockdock-symbolic.svg
    schemas/
      org.gnome.shell.extensions.stockdock.gschema.xml
  tests/
    gjs-guard.test.js
    quoteParser.test.js
    stockLogic.test.js
    thresholdMap.test.js
```

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` for the workflow and expectations.

## License

This project is licensed under the GPL-3.0-or-later. See `LICENSE`.
