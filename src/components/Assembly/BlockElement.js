import React from 'react';
import '../../styles/Block.css';

const BlockElement = ({ 
  type, 
  content, 
  onEdit, 
  draggable = true,
  selected = false,
  onSelect
}) => {
  return (
    <div 
      className={`block block-${type} ${selected ? 'selected' : ''}`}
      draggable={draggable}
      onClick={() => onSelect && onSelect()}
    >
      <div className="block-header">
        <span className="block-type">{type}</span>
        <div className="block-handle">⋮⋮</div>
      </div>
      <div className="block-content">
        {content}
      </div>
    </div>
  );
};

export default BlockElement;