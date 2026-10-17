import React, { useState } from 'react';

const pastelColors = ["#d9f0ff", "#e3d9ff", "#d9ffec", "#ffe7d9", "#ffe5fa", "#fff4d9"];

const BlockComponent = ({ item, level, onDropChild, onRemoveChild, onDragStart, parent }) => {
  const [insertPosition, setInsertPosition] = useState(null);
  const bg = pastelColors[Math.min(level, pastelColors.length - 1)];

  // Determine drop indicator based on pointer position.
  const handleDragOver = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const pos = offsetY < rect.height / 3 
      ? 'before' 
      : offsetY > (rect.height * 2 / 3) 
        ? 'after' 
        : 'nest';
    setInsertPosition(pos);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDropChild(e, item, parent, insertPosition);
    setInsertPosition(null);
  };

  return (
    <div 
      className="block-container"
      onDragOver={handleDragOver}
      onDragLeave={() => setInsertPosition(null)}
      onDrop={handleDrop}
    >
      {insertPosition === 'before' && (
        <div className="insert-indicator before">Drop above</div>
      )}
      
      <div
        className="block"
        style={{ 
          backgroundColor: bg, 
          marginLeft: `${level * 24}px`,
          cursor: 'grab',
          minWidth: '300px'
        }}
        draggable
        onDragStart={(e) => onDragStart(e, item)}
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
      </div>
      
      {insertPosition === 'nest' && (
        <div className="insert-indicator nest">Drop to nest</div>
      )}
      
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
      
      {insertPosition === 'after' && (
        <div className="insert-indicator after">Drop below</div>
      )}
    </div>
  );
};

export default BlockComponent;
