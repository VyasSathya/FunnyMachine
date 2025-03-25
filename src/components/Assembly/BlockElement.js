// Create a new BlockComponent.jsx file
import React, { useState } from 'react';

const pastelColors = ["#d9f0ff", "#e3d9ff", "#d9ffec", "#ffe7d9", "#ffe5fa", "#fff4d9"];

const BlockComponent = ({ item, level, onDropChild, onRemoveChild, onDragStart, parent }) => {
  const [insertPosition, setInsertPosition] = useState(null);
  const bg = pastelColors[Math.min(level, pastelColors.length - 1)];

  return (
    <div
      className="block-container"
      onDragOver={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const isTopHalf = e.clientY - rect.top < rect.height / 2;
        setInsertPosition(isTopHalf ? 'before' : 'after');
      }}
      onDragLeave={() => setInsertPosition(null)}
    >
      {insertPosition === 'before' && <div className="insert-indicator" />}
      
      <div
        className="block"
        style={{ 
          backgroundColor: bg, 
          marginLeft: `${level * 24}px`,
          cursor: 'grab'
        }}
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        onDrop={(e) => {
          e.preventDefault();
          setInsertPosition(null);
          onDropChild(e, item, parent, insertPosition);
        }}
      >
        <div className="block-header">
          <strong>{item.label}</strong>
          <button 
            className="remove-btn" 
            onClick={() => onRemoveChild(item)}
            aria-label="Remove item"
          >
            🗑️
          </button>
        </div>
        <em>{item.text}</em>
        <div className="type-label">({item.type})</div>
        
        {item.children?.map((child) => (
          <BlockComponent
            key={child.id}
            item={child}
            level={level + 1}
            onDropChild={onDropChild}
            onRemoveChild={onRemoveChild}
            onDragStart={onDragStart}
            parent={item}
          />
        ))}
      </div>
      
      {insertPosition === 'after' && <div className="insert-indicator" />}
    </div>
  );
};

export default BlockComponent;