import React, { useState } from 'react';

// Define a color for each type
const typeColors = {
  special: "#ffadad", // light red
  set: "#ffd6a5",     // light orange
  bit: "#fdffb6",     // light yellow
  joke: "#caffbf",    // light green
  idea: "#9bf6ff"     // light blue
};

const BlockComponent = ({ item, level, onDropChild, onRemoveChild, onDragStart, parent }) => {
  const [insertPosition, setInsertPosition] = useState(null);
  const blockBg = typeColors[item.type] || "#fff"; // Use color from mapping or fallback white

  // Determine drop indicator based on pointer vertical position
  const handleDragOver = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    if (offsetY < rect.height * 0.4) {
      setInsertPosition('before');
    } else if (offsetY > rect.height * 0.6) {
      setInsertPosition('after');
    } else {
      setInsertPosition('nest');
    }
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
        <div className="insert-indicator before">Drop here to move above</div>
      )}

      <div
        className="block"
        style={{ marginLeft: `${level * 24}px`, backgroundColor: blockBg }}
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
            Remove
          </button>
        </div>
        <div className="block-content">
          <em>{item.text}</em>
          <span className="type-label">({item.type})</span>
        </div>
      </div>

      {insertPosition === 'nest' && (
        <div className="insert-indicator nest">Drop here to nest</div>
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
        <div className="insert-indicator after">Drop here to move below</div>
      )}
    </div>
  );
};

export default BlockComponent;
