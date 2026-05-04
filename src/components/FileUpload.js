import React, { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import './FileUpload.css';

function FileUpload({ onFileUpload, error, loading }) {
  const fileInputRef = useRef(null);
  const uploadCardRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="file-upload">
      <div
        ref={uploadCardRef}
        className={`upload-card ${isDragOver ? 'drag-over' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mt940,.mta,.txt"
          onChange={handleFileSelect}
          disabled={loading}
        />

        <div className="upload-content">
          <div className="upload-icon">
            {loading ? '⏳' : '📄'}
          </div>
          <div className="upload-text">
            <h2>{loading ? 'Parsing...' : 'Upload MT940 File'}</h2>
            <p>
              {loading
                ? 'Processing your statement...'
                : 'Drag and drop your file here, or click to browse'}
            </p>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={handleClick}
          disabled={loading}
        >
          <Upload size={18} />
          Choose File
        </button>
        <a href="/sample.mt940" download className="btn btn-secondary">
          📥 Download Sample
        </a>
      </div>

      {error && (
        <div className="error-box">
          <div className="error-box-header">
            <AlertCircle size={20} />
            Parse Error
          </div>
          <div className="error-box-message">{error}</div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
