import React, { useState, useRef } from 'react';

const RawTextImporter = ({ onAnalyzeFullText, suggestions, onSuggestionClick, isLoading }) => {
  const [rawText, setRawText] = useState('');
  const textAreaRef = useRef(null);

  const handleTextChange = (event) => {
    setRawText(event.target.value);
  };

  const handleProcessClick = () => {
    if (rawText.trim() && typeof onAnalyzeFullText === 'function') {
      onAnalyzeFullText(rawText);
    } else {
      console.warn('No text entered or onAnalyzeFullText not provided');
    }
  };

  const handleSuggestionItemClick = (suggestion) => {
    if (typeof onSuggestionClick === 'function') {
      onSuggestionClick(suggestion);
    }
  };

  return (
    <div className="raw-text-importer" style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px', background: '#f9f9f9' }}>
      <h4>Import & Parse Raw Text</h4>
      <p style={{ fontSize: '0.9em', color: '#555' }}>
        Paste your transcript or written material below. The AI will attempt to find joke structures.
      </p>
      <textarea
        ref={textAreaRef}
        value={rawText}
        onChange={handleTextChange}
        placeholder="Paste or type your comedy material here..."
        rows={10}
        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px' }}
      />
      <button 
        onClick={handleProcessClick} 
        className="btn blue-btn"
        disabled={!rawText.trim() || isLoading}
        title={rawText.trim() ? "Analyze the text above for potential jokes" : "Enter some text first"}
        style={{ marginTop: '5px' }}
      >
        {isLoading ? 'Analyzing...' : '🤖 Analyze Full Text for Jokes'}
      </button>
      
      {suggestions && suggestions.length > 0 && (
        <div className="suggestions-list" style={{ marginTop: '15px' }}>
          <h5>AI Suggestions ({suggestions.length}):</h5>
          <p style={{fontSize: '0.85em', color: '#666', margin: '0 0 8px 0'}}>Click a suggestion to load it into the editor.</p>
          <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', background: '#f0f0f0' }}>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                onClick={() => handleSuggestionItemClick(suggestion)} 
                style={{ 
                  padding: '12px', 
                  borderBottom: index < suggestions.length - 1 ? '1px solid #ddd' : 'none', 
                  cursor: 'pointer', 
                  background: '#fff'
                }}
                className="suggestion-item" 
                title="Click to load this suggestion into the editor"
              >
                <div style={{ marginBottom: '5px' }}>
                   <strong style={{ display: 'block', fontSize: '0.8em', color: '#555', marginBottom: '2px' }}>SETUP:</strong>
                   <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{suggestion.suggestedSetup || '-'}</p>
                </div>
                <div>
                   <strong style={{ display: 'block', fontSize: '0.8em', color: '#555', marginBottom: '2px' }}>PUNCHLINE:</strong>
                   <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{suggestion.suggestedPunchline || '-'}</p>
                </div>
                {suggestion.originalSnippet && (
                  <div style={{ fontSize: '0.8em', color: '#555', marginTop: '8px', borderLeft: '2px solid #ccc', paddingLeft: '6px' }}>
                    <em>Context: "{suggestion.originalSnippet.substring(0, 100)}{suggestion.originalSnippet.length > 100 ? '...' : ''}"</em>
                  </div>
                )}
                 {suggestion.suggestedTags && suggestion.suggestedTags.length > 0 && (
                     <div style={{ marginTop: '8px', fontSize: '0.85em' }}><strong>Tags:</strong> {suggestion.suggestedTags.join(', ')}</div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}
       {suggestions && suggestions.length === 0 && !isLoading && (
          <div style={{ marginTop: '15px', color: '#777' }}>No distinct joke structures found in the text.</div>
       )}
    </div>
  );
};

export default RawTextImporter; 