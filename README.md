# MT940 Parser

A React web app for parsing and viewing MT940 bank statement files. Everything runs in the browser; no file is sent to a server.

## Features

- Upload a statement via file picker or drag and drop (`.mt940`, `.mta`, `.sta`, `.txt`)
- Statement info: account number, bank code, currency, statement period, total transactions, reference
- Transaction list with filters (period, direction, amount, type), sorting and a daily balance chart
- Export of the parsed data as JSON
- Sample file download (`public/sample.mt940`)

## Getting started

```bash
npm install
npm start        # dev server at http://localhost:3000
npm test         # run the Jest tests
npm run build    # production build in build/
```

## Project structure

```
src/
  App.js              - main application component
  parser.js           - thin wrapper around @tripss/mt940js
  parser.test.js      - parser tests (Jest)
  components/         - React UI components
public/
  sample.mt940        - sample MT940 file
.github/workflows/
  ci.yml              - CI: runs tests and build
```

## Parsing

Parsing is done by the [`@tripss/mt940js`](https://www.npmjs.com/package/@tripss/mt940js) library. `src/parser.js` adapts its output to the shape the UI uses.

## CI

GitHub Actions runs the tests and a production build on every push and pull request.

## License

MIT, see [LICENSE](LICENSE).
