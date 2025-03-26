import React, { useState } from 'react';
import '../../styles/OrganizedMaterial.css';

const OrganizedMaterial = ({ organizedResult, onAddToLibrary }) => {
  const [expandedItems, setExpandedItems] = useState({});

  if (!organizedResult) {
    return null;
  }

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render a nested item in the organized structure
  const renderNestedItem = (item, depth = 0) => {
    const isExpanded = expandedItems[item.id] || false;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div 
        key={item.id} 
        className="org-item"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="org-item-header">
          {hasChildren && (
            <button 
              className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? '▼' : '►'}
            </button>
          )}
          
          <div className="org-item-type">{item.type}</div>
          <div className="org-item-title">{item.title || item.label || item.text}</div>
          
          <button 
            className="add-library-btn"
            onClick={() => onAddToLibrary(item)}
          >
            Add
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="org-item-children">
            {item.children.map(child => renderNestedItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Determine if the result is a single item or a nested structure
  const isSingleItem = !organizedResult.children || organizedResult.children.length === 0;

  return (
    <div className="organized-result">
      <h3>AI Analysis Result</h3>
      
      {isSingleItem ? (
        // Render a single item result (like just a joke)
        <div className="org-single-item">
          <div className="org-item-header">
            <div className="org-item-type">{organizedResult.type}</div>
            <div className="org-item-title">{organizedResult.title || organizedResult.label || organizedResult.text}</div>
          </div>
          
          {organizedResult.type === 'joke' && (
            <div className="org-joke-content">
              <div className="setup">
                <label>Setup:</label>
                <p>{organizedResult.setup}</p>
              </div>
              <div className="punchline">
                <label>Punchline:</label>
                <p>{organizedResult.punchline}</p>
              </div>
            </div>
          )}
          
          <div className="org-item-metrics">
            {organizedResult.technique && (
              <div className="metric">
                <label>Technique:</label>
                <span>{organizedResult.technique}</span>
              </div>
            )}
            
            {organizedResult.economy && (
              <div className="metric">
                <label>Word Economy:</label>
                <span>{organizedResult.economy}%</span>
              </div>
            )}
          </div>
          
          <div className="org-item-actions">
            <button 
              className="add-library-btn"
              onClick={() => onAddToLibrary(organizedResult)}
            >
              Add to Library
            </button>
            <button className="refine-btn">
              Refine
            </button>
          </div>
        </div>
      ) : (
        // Render a nested structure (bit with jokes, etc.)
        <div className="org-nested-structure">
          {renderNestedItem(organizedResult)}
        </div>
      )}
    </div>
  );
};

export default OrganizedMaterial;
