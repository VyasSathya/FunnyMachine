import React, { useState, useRef, useEffect } from 'react';

// Define default colors locally - Ensure these match App.js
const defaultTypeColors = {
  special: "#fecaca", set: "#fed7aa", bit: "#fde68a",
  joke: "#bbf7d0", idea: "#bfdbfe", default: "#e5e7eb"
};

// Accept typeColors as a prop, falling back to the local default
const BlockComponent = ({
    item, level, onDropChild, onRemoveChild, onDragStart, onReorder, parent, typeColors = defaultTypeColors
}) => {
    const [isOver, setIsOver] = useState(false);
    const [insertPosition, setInsertPosition] = useState(null);
    const blockRef = useRef(null);

    // --- Debugging Log (Uncomment if needed)---
    // useEffect(() => { console.log(`Block Lvl ${level} ID: ${item?.id} Children:`, item?.children?.map(c => c.id)); }, [item, level]);

    if (!item) return null;

    // --- Handlers ---
    const handleDragStartInternal = (e) => { if (e.target.closest('button')) { e.preventDefault(); return; } e.stopPropagation(); if (typeof onDragStart === 'function') { onDragStart(e, item); try { e.dataTransfer.effectAllowed = "move"; } catch(err) {} } else { console.warn("onDragStart missing"); } };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsOver(true); try { e.dataTransfer.dropEffect = "move"; } catch(err) {} if (blockRef.current) { const rect = blockRef.current.getBoundingClientRect(); const dY = e.clientY; const mY = rect.top + rect.height/2; const buf = rect.height*0.20; if (dY<mY-buf) setInsertPosition('top'); else if (dY>mY+buf) setInsertPosition('bottom'); else setInsertPosition(null); } };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); const rel = e.relatedTarget; if (!blockRef.current || !blockRef.current.contains(rel)) { setIsOver(false); setInsertPosition(null); }};
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); const pos = insertPosition; setIsOver(false); setInsertPosition(null); if (pos && parent && typeof onReorder === 'function') { const idx = (parent.children || []).findIndex(c => c.id === item.id); if (idx !== -1) { const dropIdx = pos === 'top' ? idx : idx + 1; console.log(`Block Drop: Reorder intent idx ${dropIdx}`); onReorder(e, parent, dropIdx); } else { console.error("Reorder idx fail"); if (typeof onDropChild === 'function') onDropChild(e, item); } } else if (typeof onDropChild === 'function') { console.log(`Block Drop: Nest intent onto ${item.id}`); onDropChild(e, item); } else { console.warn("No drop handler."); } };
    const handleRemoveClick = (e) => { e.stopPropagation(); if (typeof onRemoveChild === 'function') { onRemoveChild(item); } };

    // --- Style & Indent ---
    const backgroundColor = typeColors[item.type] || typeColors.default;
    const indent = level * 24;

    return (
        <div ref={blockRef} className={`block-container level-${level} ${isOver ? 'drag-over' : ''}`} style={{ marginLeft: `${indent}px`, position: 'relative' }} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {/* Indicators */}
            {isOver && insertPosition === 'top' && <div className="insert-indicator top" />}
            {isOver && insertPosition === 'bottom' && <div className="insert-indicator bottom" />}
            {/* Content */}
            <div className="block-content" style={{ backgroundColor: backgroundColor }} draggable="true" onDragStart={handleDragStartInternal} title={`Type: ${item.type} | Drag`}>
                <strong className="block-label">{item.label || '(Untitled)'}</strong>
                <span className="type-label">{item.type}</span>
                <button className="remove-button" onClick={handleRemoveClick} title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                </button>
            </div>
            {/* Children */}
            {item.children && item.children.length > 0 && (
                <div className="block-children">
                    {item.children.map((child) => ( <BlockComponent key={child.id} item={child} level={level + 1} parent={item} typeColors={typeColors} {...{onDropChild, onRemoveChild, onDragStart, onReorder}} /> ))}
                </div>
            )}
        </div>
    );
};
export default BlockComponent;