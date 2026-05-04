import React, { useState } from 'react';
import { MT940Parser } from './parser';
import FileUpload from './components/FileUpload';
import StatementResults from './components/StatementResults';
import AppHeader from './components/AppHeader';
import HelpModal from './components/HelpModal';
import ParseReportModal from './components/ParseReportModal';
import './App.css';
import { Upload } from 'lucide-react';

function App() {
  const [statementData, setStatementData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [parseReport, setParseReport] = useState(null); // { result, error, fileName }

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError('');
    setStatementData(null);

    try {
      const content = await file.text();
      const parser = new MT940Parser();
      const data = parser.parse(content);
      setStatementData(data);
      setParseReport({ result: data, error: null, fileName: file.name });
    } catch (err) {
      setError(err.message);
      setParseReport({ result: null, error: err.message, fileName: file.name });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setStatementData(null);
    setError('');
  };

  const handleExport = () => {
    if (!statementData) return;

    const dataStr = JSON.stringify(statementData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mt940-statement-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <AppHeader onHelpOpen={() => setHelpOpen(true)} />
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {parseReport && (
        <ParseReportModal
          result={parseReport.result}
          error={parseReport.error}
          fileName={parseReport.fileName}
          onClose={() => setParseReport(null)}
        />
      )}
      <div className="app-content">
        <header>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              💳
            </div>
          </div>
          <h1>MT940 Parser</h1>
          <p>Smart bank statement parsing, powered by React</p>
          <div className="badge-group">
            <span className="badge">
              <Upload size={16} />
              Drag &amp; Drop
            </span>
            <span className="badge">
              ⚡ Instant Parse
            </span>
            <span className="badge">
              🔒 Client-side
            </span>
            <span className="badge">
              📊 Export JSON
            </span>
          </div>
        </header>

        <main>
          {!statementData ? (
            <FileUpload
              onFileUpload={handleFileUpload}
              error={error}
              loading={loading}
            />
          ) : (
            <StatementResults
              data={statementData}
              onClear={handleClear}
              onExport={handleExport}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
