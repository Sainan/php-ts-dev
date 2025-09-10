# php-ts-dev

An ergonomic script for developing websites that use PHP and TS.

Specifically, you might be running 2 processes like this:

- `tsc --watch`
- `php -S 0.0.0.0:8080`

Instead, you can simply run `php-ts-dev` to unify this with the added benefit of automatic refreshing when you modify files.

CLI options (defaults): `--port 8080 --dirs .`
