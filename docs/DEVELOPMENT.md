# Development notes

## Running the extension

- Link the extension directory to `~/.local/share/gnome-shell/extensions/stockdock@etf`.
- Compile schemas with `glib-compile-schemas stockdock@etf/schemas`.
- Restart GNOME Shell (Alt+F2, `r`) or log out/in.

## Updating schemas

If you change `stockdock@etf/schemas/org.gnome.shell.extensions.stockdock.gschema.xml`, re-run `glib-compile-schemas` before testing in GNOME Shell.

## Tests

The unit tests are pure Node.js and avoid GNOME Shell dependencies:

```
npm test
```

There is also a lightweight static guard to catch a common GJS subclassing issue:

```
npm run check
```

## Data sources

`stockdock@etf/extension.js` fetches Stooq CSV by default. If you switch to another provider, keep the parsing logic in `stockdock@etf/lib` so the core data formatting and notification rules remain testable.
