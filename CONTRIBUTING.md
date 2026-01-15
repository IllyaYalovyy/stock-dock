# Contributing

Thanks for taking a look. Small, focused contributions are the easiest to review.

## Before you start

- Search existing issues or open a new one to discuss larger changes.
- Keep GNOME Shell version compatibility in mind (currently 47+).

## Development workflow

1. Fork and create a topic branch.
2. Make your changes with clear, minimal diffs.
3. Run tests:

```
npm test
npm run check
```

4. Open a PR with a short summary and any screenshots if UI changes are involved.

## Code style

- Prefer small helper modules in `stockdock@etf/lib` for business logic.
- Keep GNOME Shell integration code in `stockdock@etf/extension.js`.
- Favor readable code over cleverness.

## Reporting bugs

Please include:

- GNOME Shell version
- Extension version
- Steps to reproduce
- Any relevant logs from Looking Glass (`Alt+F2`, `lg`)
