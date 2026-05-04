# MT940 Parser

A simple web application for parsing and displaying MT940 bank statement files.

## About MT940

MT940 is a standardized format for electronic bank statements used by financial institutions worldwide. It contains details about:
- Account information
- Opening and closing balances
- Transaction details with dates, amounts, and descriptions

## Features

- 📄 **File Upload**: Upload MT940 files via file picker or drag-and-drop
- 📊 **Statement Overview**: Display account information, balances, and statement period
- 💳 **Transaction Display**: View all transactions with dates, amounts, and details
- 💾 **Export**: Export parsed data as JSON for further processing
- 🎨 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Parsing**: Client-side parsing - no server required

## Usage

1. Open `index.html` in a web browser
2. Upload an MT940 file by:
   - Clicking the upload area to select a file
   - Or dragging and dropping a file into the upload area
3. Click "Parse File" to process the statement
4. View the parsed results:
   - Statement information (account, dates, balances)
   - List of all transactions
5. Optionally export the results as JSON

## File Structure

```
src/
  App.js            - Main application component
  parser.js         - MT940 parsing logic
  components/       - React UI components
public/
  sample.mt940      - Sample MT940 file for testing
parser.js           - Standalone parser (Node.js)
test_parser.js      - Parser tests
```

## MT940 Format Overview

The MT940 format consists of tags (field identifiers) and their values:

- `:20:` - Transaction Reference Number
- `:25:` - Account Identification
- `:28:` - Statement Number
- `:60:` - Opening Balance
- `:61:` - Transaction Details
- `:62:` - Closing Balance
- `:86:` - Transaction Details/Description (continuation)

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

Then visit http://localhost:3000

## Example MT940 File

The `sample.mt940` file included demonstrates the basic format:
```
:20:STARTUMSEINS
:25:DEUTDEDE/12345678
:28:0000000001/001
:60:F060101EUR1000,00
:61:060101C100,00NMSCTEST///REF001
:86:TEST TRANSACTION 1
:61:060102D250,50NMSCTEST///REF002
:86:TEST TRANSACTION 2
:62:F060131EUR1349,50
-
```

## Supported Features

✅ Account number and bank code extraction
✅ Opening and closing balance parsing
✅ Statement period extraction
✅ Transaction date and amount parsing
✅ Credit/Debit transaction classification
✅ Transaction details and descriptions
✅ Currency detection
✅ JSON export functionality

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- This parser handles basic MT940 format; complex variants may require additional customization
- Dates are automatically converted from YYMMDD format to YYYY-MM-DD for consistency
- Amounts are properly formatted with currency symbols
- The application runs entirely in the browser with no backend required

## License

MIT License - Feel free to use and modify as needed.
