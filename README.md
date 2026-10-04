# MT940 Parser

A React web app for parsing and viewing MT940 bank statement files. Everything runs in the browser; no file is sent to a server.

## Features

- Upload a statement via file picker or drag and drop (`.mt940`, `.mta`, `.sta`, `.txt`)
- Statement info: account number, bank code, currency, statement period, total transactions, reference
- Transaction list with filters (period, direction, amount, type), sorting and a daily balance chart
- Export of the parsed data as JSON, or of all / only the filtered transactions as CSV
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

## CSV export

Columns: `date;amount;currency;type;code;counterparty;iban;bic;reference;description`.

- Delimiter is `;` (what Excel with European regional settings expects). The file starts with a UTF-8 BOM so Excel reads umlauts and `€` correctly. Lines end with CRLF.
- Amounts are plain signed numbers with a `.` decimal separator (`-250.5`), dates are `YYYY-MM-DD`, independent of the browser locale. Excel with a decimal-comma locale may treat the amount column as text; use the import wizard with `.` as decimal separator in that case.
- Text cells that start with `=`, `+`, `-`, `@`, tab or CR get a leading `'` so spreadsheets do not run them as formulas (the data comes from untrusted files). Amounts are never altered.

## CI

GitHub Actions runs the tests and a production build on every push and pull request.

## License

MIT, see [LICENSE](LICENSE).
