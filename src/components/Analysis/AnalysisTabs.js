import React, { useState } from 'react';
import TextAnalysis from './TextAnalysis';
import '../../styles/AnalysisTabs.css';

const AnalysisTabs = ({ focusItem, selectedAIModel, onModelChange, onJokeUpdate }) => {
  const [activeTab, setActiveTab] = useState('polish');

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    if (!focusItem) return <div className="empty-analysis">Select an item to analyze</div>;

    // Content for different tabs
    switch (activeTab) {
      case 'polish':
        if (focusItem.type === 'joke') {
          return (
            <TextAnalysis
              jokeText={focusItem.text || `${focusItem.setup || ''} ${focusItem.punchline || ''}`}
              joke={focusItem}
              selectedModel={selectedAIModel}
              onModelChange={onModelChange}
              onJokeUpdate={onJokeUpdate}
            />
          );
        } else {
          return <div className="empty-analysis">Polish is currently only available for jokes</div>;
        }
      
      case 'structure':
        return (
          <div className="structure-analysis">
            <h3>Structure Analysis</h3>
            <p>This will analyze how your material is structured based on the four levels of comedy.</p>
            {focusItem.type === 'joke' && (
              <div className="joke-structure">
                <h4>Joke Structure</h4>
                <div className="structure-metric">
                  <span>Misdirection Strength:</span>
                  <div className="meter">
                    <div className="meter-fill" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="structure-metric">
                  <span>Setup-Punchline Balance:</span>
                  <div className="meter">
                    <div className="meter-fill" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="structure-suggestions">
                  <h4>Structural Suggestions</h4>
                  <ul>
                    <li>Your setup has good length for misdirection</li>
                    <li>Consider adding more specificity to strengthen the misdirection</li>
                  </ul>
                </div>
              </div>
            )}
            {focusItem.type === 'bit' && (
              <div className="bit-structure">
                <h4>Bit Structure</h4>
                <p>Bit analysis coming soon...</p>
              </div>
            )}
          </div>
        );
      
      case 'flow':
        return (
          <div className="flow-analysis">
            <h3>Flow Analysis</h3>
            <p>This will analyze the energy flow and transitions in your material.</p>
            <div className="flow-chart">
              {/* Placeholder for flow visualization */}
              <div className="flow-placeholder">Flow visualization coming soon</div>
            </div>
          </div>
        );
      
      case 'audience':
        return (
          <div className="audience-analysis">
            <h3>Audience Response Analysis</h3>
            <p>Upload recordings of your performances to analyze audience response.</p>
            <button className="upload-recording-btn" disabled>Upload Recording (Coming Soon)</button>
          </div>
        );
      
      default:
        return <div className="empty-analysis">Select an analysis type</div>;
    }
  };

  return (
    <div className="analysis-tabs-container">
      <div className="analysis-tab-buttons">
        <button 
          className={activeTab === 'polish' ? 'active' : ''}
          onClick={() => setActiveTab('polish')}
        >
          Polish
        </button>
        <button 
          className={activeTab === 'structure' ? 'active' : ''}
          onClick={() => setActiveTab('structure')}
        >
          Structure
        </button>
        <button 
          className={activeTab === 'flow' ? 'active' : ''}
          onClick={() => setActiveTab('flow')}
        >
          Flow
        </button>
        <button 
          className={activeTab === 'audience' ? 'active' : ''}
          onClick={() => setActiveTab('audience')}
        >
          Audience
        </button>
      </div>
      
      <div className="analysis-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AnalysisTabs;
