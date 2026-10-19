# CI failure exercise (Lab 30)

## Failed run
- Run: [CI #7](<URL красного запуска>)
- Commit: `c8143b0` — Break CI: remove closing parenthesis in app.js
- Failed step: **Check JavaScript syntax**
- Log message: `SyntaxError: <текст из лога>` in `app/app.js`

## Cause
I removed the closing `)` of the `app.pg.query('SELECT * FROM quotes')` call
in `labs/20-containerized-node-app/app/app.js`. The file was no longer valid
JavaScript, so `node --check app.js` failed. The following steps
(Docker build, smoke test) were skipped, so the broken code never reached
the image.

## Fix
- Run: [CI #8](<URL зелёного запуска>)
- Commit: `<SHA фикса>` — Fix CI: restore closing parenthesis in app.js

Restoring the parenthesis makes `app.js` valid JavaScript again, so
`node --check` passes and the rest of the pipeline (Docker build and
`/health` smoke test) runs green. The syntax check itself was not removed
or bypassed.
