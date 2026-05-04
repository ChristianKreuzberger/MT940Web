# MT940 Parser - React App

A modern, beautiful React web application for parsing and displaying MT940 bank statement files.

## ✨ Features

### 🎨 Modern Design
- **Dark theme** with gradient accents (indigo & pink)
- **Smooth animations** and transitions
- **Responsive layout** for desktop and mobile
- **Lucide icons** for visual polish
- **Glass morphism effects** and modern UI patterns

### 🔧 Functionality
- **Drag-and-drop file upload** or click to select
- **Real-time parsing** of MT940 files
- **Statement summary** showing account, balances, and period
- **Transaction cards** with color-coded debit/credit
- **JSON export** for data integration
- **Error handling** with user-friendly messages
- **Client-side processing** - no server required

### 📦 React Component Structure
```
src/
├── App.js                 # Main app component
├── App.css               # App styling
├── parser.js             # MT940 parsing logic
├── index.js              # React entry point
├── index.css             # Global styles
└── components/
    ├── FileUpload.js      # File upload component
    ├── StatementResults.js # Results container
    ├── StatementInfo.js    # Statement details
    ├── TransactionsList.js # Transactions grid
    └── TransactionCard.js  # Individual transaction
```

## 🚀 Getting Started

### Start Development Server
```bash
npm start
```
The app will open at `http://localhost:3000` (or the next available port)

### Build for Production
```bash
npm run build
```
Creates an optimized build in the `build/` directory.

### Test with Sample File
A sample MT940 file is included at `public/sample.mt940` - use the "Download Sample" button to load it.

## 🎯 Tech Stack

- **React 18** - UI framework
- **CSS3** - Styling with CSS variables and animations
- **Lucide React** - Icon library
- **create-react-app** - Development setup

## 🎨 Design Highlights

- **Dark theme** optimized for reading financial data
- **Gradient backgrounds** with radial overlays
- **Smooth animations** for all interactions
- **Hover effects** on cards for visual feedback
- **Color coding** for transactions (red for debit, green for credit)
- **Responsive grid layout** that adapts to screen size

## 📊 What Gets Parsed

The MT940 parser extracts:
- ✅ Account number and bank code
- ✅ Opening and closing balances
- ✅ Statement date range
- ✅ Currency information
- ✅ Transaction details (date, amount, type)
- ✅ Transaction descriptions and references

## 🔒 Privacy

All parsing happens client-side - files are never sent to any server.

## 📝 Sample Data Display

The app displays:
- **Statement Info**: 8 info cards with key account details
- **Transactions**: Beautiful card layout showing each transaction with:
  - Date and type (debit/credit)
  - Amount and currency
  - Transaction code and details
  - Sender/receiver information

Enjoy the sleek, modern interface! 🚀
