// src/components/Analysis/AnalysisTabs.js
import React, { useState } from 'react';
import TextAnalysis from './TextAnalysis';
import PunchlineOptimizer from '../Tools/PunchlineOptimizer';
import JokeAnalysis from './JokeAnalysis';
import '../../styles/AnalysisTabs.css';

const AnalysisTabs = ({ focusItem, selectedAIModel, onModelChange, onJokeUpdate }) => {
  const [activeTab, setActiveTab] = useState('polish');

  const renderTabContent = () => {
    if (!focusItem) return <div className="empty-analysis">Select an item to analyze</div>;

    switch (activeTab) {
      case 'polish':
        // Maybe show TextAnalysis and PunchlineOptimizer side-by-side or conditionally?
        if (focusItem.type === 'joke') {
          return (
            <div>
              <TextAnalysis jokeText={focusItem.text} />
              <hr /> {/* Separator */}
              <PunchlineOptimizer joke={focusItem} /> {/* <-- Render Optimizer */}
            </div>
          );
        } else {
          return <div className="empty-analysis">Polish/Optimize is currently only available for jokes</div>;
        }
      
      case 'analysis':
        if (focusItem.type === 'joke') {
          return <JokeAnalysis jokeText={focusItem.text} />;
        } else {
          return <div className="empty-analysis">Joke Analysis is currently only available for jokes</div>;
        }

      case 'structure':
        return <div className="empty-analysis">Structure analysis coming soon</div>;
        
      case 'flow':
        return <div className="empty-analysis">Flow analysis coming soon</div>;
        
      case 'audience':
        return <div className="empty-analysis">Audience analysis coming soon</div>;
        
      default:
        return <div className="empty-analysis">Select an analysis tab</div>;
    }
  };

  return (
    <div className="analysis-tabs-container">
      <div className="analysis-tab-buttons">
        <button 
          className={activeTab === 'polish' ? 'active' : ''}
          onClick={() => setActiveTab('polish')}
        >
          Polish & Optimize
        </button>
        <button 
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          Joke Analysis
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