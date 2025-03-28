// src/components/Analysis/AnalysisTabs.js
import React, { useState } from 'react';
import TextAnalysis from './TextAnalysis';
import PunchlineOptimizer from '../Tools/PunchlineOptimizer'; // <-- Import new component
import '../../styles/AnalysisTabs.css';

// ... (rest of the component)

const AnalysisTabs = ({ focusItem, selectedAIModel, onModelChange, onJokeUpdate }) => {
  const [activeTab, setActiveTab] = useState('polish'); // Or maybe 'optimizer' as default?

  const renderTabContent = () => {
    if (!focusItem) return <div className="empty-analysis">Select an item to analyze</div>;

    switch (activeTab) {
      case 'polish':
        // Maybe show TextAnalysis and PunchlineOptimizer side-by-side or conditionally?
        if (focusItem.type === 'joke') {
          return (
            <div>
              <TextAnalysis /* props */ />
              <hr /> {/* Separator */}
              <PunchlineOptimizer joke={focusItem} /> {/* <-- Render Optimizer */}
            </div>
          );
        } else {
          return <div className="empty-analysis">Polish/Optimize is currently only available for jokes</div>;
        }
      
      // Add a new case for 'optimizer' if making it a separate tab
      // case 'optimizer':
      //    return <PunchlineOptimizer joke={focusItem} />

      // ... (other cases: structure, flow, audience)
    }
  };

  return (
    <div className="analysis-tabs-container">
      <div className="analysis-tab-buttons">
        <button 
          className={activeTab === 'polish' ? 'active' : ''}
          onClick={() => setActiveTab('polish')}
        >
          Polish & Optimize {/* Renamed tab? */}
        </button>
        {/* Add new button if separate tab:
        <button 
          className={activeTab === 'optimizer' ? 'active' : ''}
          onClick={() => setActiveTab('optimizer')}
        >
          Optimizer 
        </button>
        */}
        {/* ... other buttons */}
      </div>
      
      <div className="analysis-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AnalysisTabs;