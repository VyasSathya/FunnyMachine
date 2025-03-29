import React, { useState } from 'react';

function JokeAnalysis({ jokeText }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState('local'); // 'local' or 'ai'

  const analyzeJoke = async () => {
    setLoading(true);
    try {
      // Choose endpoint based on analysis method
      let endpoint = analysisMethod === 'ai' 
        ? '/api/analyze-jokes-batch' // Your existing AI endpoint
        : 'http://localhost:3001/api/analyze-joke-local';  // Your new local endpoint with explicit port
      
      // Choose payload format based on analysis method
      let body = analysisMethod === 'ai'
        ? { jokes: [{ text: jokeText }], selectedModel: 'gpt-4' }
        : { text: jokeText };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      
      // Handle different response formats
      setAnalysis(analysisMethod === 'ai' ? result.results[0] : result);
    } catch (error) {
      console.error('Error analyzing joke:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="joke-analysis">
      <div className="analysis-controls">
        <select 
          value={analysisMethod} 
          onChange={(e) => setAnalysisMethod(e.target.value)}
          className="analysis-method-select"
        >
          <option value="local">Quick Analysis (Local)</option>
          <option value="ai">Deep Analysis (AI)</option>
        </select>
        
        <button 
          onClick={analyzeJoke} 
          disabled={loading || !jokeText}
          className="analyze-button"
        >
          {loading ? 'Analyzing...' : 'Analyze Joke'}
        </button>
      </div>
      
      {loading && <div className="loading">Analyzing joke...</div>}
      
      {analysis && (
        <div className="analysis-results">
          <h3>Joke Analysis Results</h3>
          <div className="technique">
            <strong>Primary Technique:</strong> {analysis.analysis?.primary_technique || 'N/A'}
          </div>
          <div className="structure">
            <strong>Structure:</strong>
            <div className="setup">Setup: {analysis.analysis?.structure?.setup || 'N/A'}</div>
            <div className="punchline">Punchline: {analysis.analysis?.structure?.punchline || 'N/A'}</div>
          </div>
          <div className="metrics">
            <strong>Word Economy:</strong> {
              typeof analysis.analysis?.metrics?.word_economy === 'number' 
                ? (analysis.analysis.metrics.word_economy * 100).toFixed(0) + '%' 
                : 'N/A'
            }
          </div>
          
          {analysis.analysis?.techniques && (
            <div className="techniques">
              <strong>Detected Techniques:</strong>
              <ul>
                {analysis.analysis.techniques.map((tech, index) => (
                  <li key={index}>
                    {tech.name} ({(tech.confidence * 100).toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JokeAnalysis;