import React, { useState, useRef, useEffect } from 'react';

// Define default colors locally - Ensure these match App.js
const defaultTypeColors = {
  special: "#fecaca", set: "#fed7aa", bit: "#fde68a",
  joke: "#bbf7d0", idea: "#bfdbfe", default: "#e5e7eb"
};

// Accept typeColors as a prop, falling back to the local default
const BlockComponent = ({
    item, level, onDropChild, onRemoveChild, onDragStart, onReorder, parent, typeColors = defaultTypeColors,
    onEditItem,
    onApproveSuggestion,
    onRejectSuggestion,
    onEditSuggestion,
    onUpdateItem
}) => {
    const [isOver, setIsOver] = useState(false);
    const [insertPosition, setInsertPosition] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editSetup, setEditSetup] = useState('');
    const [editPunchline, setEditPunchline] = useState('');
    const [editTagsInput, setEditTagsInput] = useState('');
    const blockRef = useRef(null);
    const isSuggestion = item?.status === 'suggestion';
    const isSuggestionRoot = item?._isSuggestionRoot === true;

    // --- Debugging Log (Uncomment if needed)---
    // useEffect(() => { console.log(`Block Lvl ${level} ID: ${item?.id} Children:`, item?.children?.map(c => c.id)); }, [item, level]);

    if (!item) return null;

    // --- Handlers ---
    const handleDragStartInternal = (e) => { if (isSuggestion || isSuggestionRoot || e.target.closest('button, textarea, input')) { e.preventDefault(); return; } e.stopPropagation(); if (typeof onDragStart === 'function') { onDragStart(e, item); try { e.dataTransfer.effectAllowed = "move"; } catch(err) {} } else { console.warn("onDragStart missing"); } };
    const handleDragOver = (e) => { if (isSuggestion || isSuggestionRoot) { e.preventDefault(); e.stopPropagation(); return; } e.preventDefault(); e.stopPropagation(); setIsOver(true); try { e.dataTransfer.dropEffect = "move"; } catch(err) {} if (blockRef.current) { const rect = blockRef.current.getBoundingClientRect(); const dY = e.clientY; const mY = rect.top + rect.height/2; const buf = rect.height*0.20; if (dY<mY-buf) setInsertPosition('top'); else if (dY>mY+buf) setInsertPosition('bottom'); else setInsertPosition(null); } };
    const handleDragLeave = (e) => { if (isSuggestion || isSuggestionRoot) { e.preventDefault(); e.stopPropagation(); return; } e.preventDefault(); e.stopPropagation(); const rel = e.relatedTarget; if (!blockRef.current || !blockRef.current.contains(rel)) { setIsOver(false); setInsertPosition(null); }};
    const handleDrop = (e) => { if (isSuggestion || isSuggestionRoot) { e.preventDefault(); e.stopPropagation(); return; } e.preventDefault(); e.stopPropagation(); const pos = insertPosition; setIsOver(false); setInsertPosition(null); if (pos && parent && typeof onReorder === 'function') { const idx = (parent.children || []).findIndex(c => c.id === item.id); if (idx !== -1) { const dropIdx = pos === 'top' ? idx : idx + 1; console.log(`Block Drop: Reorder intent idx ${dropIdx}`); onReorder(e, parent, dropIdx); } else { console.error("Reorder idx fail"); if (typeof onDropChild === 'function') onDropChild(e, item); } } else if (typeof onDropChild === 'function') { console.log(`Block Drop: Nest intent onto ${item.id}`); onDropChild(e, item); } else { console.warn("No drop handler."); } };
    const handleRemoveClick = (e) => { e.stopPropagation(); if (typeof onRemoveChild === 'function') { onRemoveChild(item); } };

    // --- NEW: Handler for Edit Button ---
    const handleEditClick = (e) => {
      e.stopPropagation(); // Prevent drag start or other parent events
      if (typeof onEditItem === 'function') {
        onEditItem(item); // Pass the current item up to the parent
      }
    };

    // --- Suggestion Button Handlers ---
    const handleApproveClick = (e) => { e.stopPropagation(); onApproveSuggestion && onApproveSuggestion(item); };
    const handleRejectClick = (e) => { e.stopPropagation(); onRejectSuggestion && onRejectSuggestion(item.id); };
    const handleEditSuggestionClick = (e) => { e.stopPropagation(); startEditing(true); };

    // --- Inline Edit Handlers ---
    const startEditing = (isSuggestionEdit = false) => {
        // Load current data into edit state
        setEditSetup(item.analysis?.structure?.setup || item.text?.split('\n')[0] || '');
        setEditPunchline(item.analysis?.structure?.punchline || item.text?.split('\n').slice(1).join('\n') || '');
        setEditTagsInput((item.tags || []).join(', '));
        setIsEditing(true);
        // Optionally call onEditSuggestion if needed, though state change handles UI
        if (isSuggestionEdit && onEditSuggestion) onEditSuggestion(item); 
        else if (!isSuggestionEdit && onEditItem) onEditItem(item); // Call original for normal edits
    };
    const handleCancelEdit = () => { setIsEditing(false); };
    const handleSaveEdit = () => {
        const tags = editTagsInput.split(',').map(t => t.trim()).filter(Boolean);
        const saveData = {
            setup: editSetup,
            punchline: editPunchline,
            tags: tags,
            timestamp: new Date().toISOString(),
        };
        
        if (isSuggestion) {
            // If editing a suggestion, approving it saves it as NEW
            if (onApproveSuggestion) {
                // Pass the edited data along with the original item for context
                onApproveSuggestion({ ...item, ...saveData, label: `Joke (${saveData.setup.substring(0,10)}...)` });
            } else console.error("Missing onApproveSuggestion handler for edited suggestion.");
        } else {
            // If editing a normal joke, call the update handler
            if (onUpdateItem) {
                onUpdateItem({ ...saveData, jokeId: item.id });
            } else console.error("Missing onUpdateItem handler for saving inline edits!");
        }
        setIsEditing(false); 
    };

    // --- Style & Indent ---
    const isDraggable = !isEditing && !isSuggestion && !isSuggestionRoot;
    const baseBackgroundColor = isSuggestion ? '#e9ecef' : (typeColors[item.type] || typeColors.default);
    const backgroundColor = isEditing ? '#fff' : baseBackgroundColor;
    const indent = level * 24;

    // Don't render the suggestion root block itself, only its children
    if (isSuggestionRoot) {
       return (
          <div className="block-children suggestion-root">
              {item.children?.map((child) => ( <BlockComponent key={child.id} item={child} level={level} parent={item} typeColors={typeColors} {...{onDropChild, onRemoveChild, onDragStart, onReorder, onEditItem, onApproveSuggestion, onRejectSuggestion, onEditSuggestion, onUpdateItem}} /> ))}
          </div>
       );
    }

    return (
        <div ref={blockRef} className={`block-container level-${level} ${isOver ? 'drag-over' : ''} ${isSuggestion ? 'suggestion-block' : ''} ${isEditing ? 'editing-block' : ''}`} style={{ marginLeft: `${indent}px`, position: 'relative' }} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {/* Indicators */}
            {isOver && insertPosition === 'top' && <div className="insert-indicator top" />}
            {isOver && insertPosition === 'bottom' && <div className="insert-indicator bottom" />}
            {/* Content */}
            <div className="block-content" style={{ backgroundColor: backgroundColor, border: isEditing ? '1px dashed #007bff' : 'none', padding: isEditing ? '15px' : '8px 10px' }} draggable={isDraggable} onDragStart={handleDragStartInternal}>
               {isEditing ? (
                   // --- INLINE EDITING VIEW (for Jokes and Suggestions) ---
                   <div className="inline-editor-container">
                       <h5 style={{marginTop: 0, marginBottom: '10px'}}>{isSuggestion ? 'Edit Suggestion' : 'Edit Joke'}</h5>
                       <div style={{ marginBottom: '10px' }}>
                           <label>Setup:</label>
                           <textarea 
                               value={editSetup} 
                               onChange={(e) => setEditSetup(e.target.value)} 
                               rows={3} 
                               className="inline-edit-setup"
                           />
                       </div>
                       <div style={{ marginBottom: '10px' }}>
                           <label>Punchline:</label>
                           <textarea 
                               value={editPunchline} 
                               onChange={(e) => setEditPunchline(e.target.value)} 
                               rows={3} 
                               className="inline-edit-punchline"
                           />
                       </div>
                       <div style={{ marginBottom: '10px' }}>
                           <label>Tags (comma-separated):</label>
                           <input 
                               type="text" 
                               value={editTagsInput} 
                               onChange={(e) => setEditTagsInput(e.target.value)} 
                               className="inline-edit-tags"
                            />
                       </div>
                       <div className="inline-editor-actions" style={{ textAlign: 'right' }}>
                           <button className="btn btn-small" onClick={handleCancelEdit} style={{marginRight: '5px'}}>Cancel</button>
                           <button className="btn btn-small green-btn" onClick={handleSaveEdit}>Save {isSuggestion ? '& Approve' : 'Changes'}</button>
                       </div>
                   </div>
               ) : isSuggestion ? (
                   // --- SUGGESTION VIEW ---
                   <div className="suggestion-details">
                       <div style={{ marginBottom: '5px' }}>
                           <strong style={{ display: 'block', fontSize: '0.8em', color: '#555', marginBottom: '2px' }}>SETUP:</strong>
                           <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.analysis?.structure?.setup || '-'}</p>
                       </div>
                       <div>
                           <strong style={{ display: 'block', fontSize: '0.8em', color: '#555', marginBottom: '2px' }}>PUNCHLINE:</strong>
                           <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.analysis?.structure?.punchline || '-'}</p>
                       </div>
                       {item._originalSnippet && <em style={{fontSize: '0.8em', color: '#666'}}> (Context: {item._originalSnippet.substring(0,40)}...)</em>}
                       <div className="suggestion-actions" style={{ textAlign: 'right', marginTop: '8px' }}>
                           <button className="btn btn-small green-btn" title="Approve suggestion as new joke" onClick={handleApproveClick} style={{marginRight: '5px'}}>✅ Approve</button>
                           <button className="btn btn-small" title="Edit suggestion before approving" onClick={handleEditSuggestionClick} style={{marginRight: '5px'}}>✏️ Edit</button>
                           <button className="btn btn-small red-btn" title="Reject this suggestion" onClick={handleRejectClick}>❌ Reject</button>
                       </div>
                   </div>
               ) : (
                   // --- NORMAL BLOCK VIEW ---
                   <>
                       <strong className="block-label">{item.label || '(Untitled)'}</strong>
                       <span className="type-label">{item.type}</span>
                       {item.type === 'joke' && typeof onEditItem === 'function' && (
                           <button className="edit-button" onClick={() => startEditing(false)} title="Edit Joke">✏️</button>
                       )}
                       <button className="remove-button" onClick={handleRemoveClick} title="Remove">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                       </button>
                   </>
               )}
            </div>
            {/* Children */}
            {!isEditing && item.children && item.children.length > 0 && (
                <div className="block-children">
                    {item.children.map((child) => ( <BlockComponent key={child.id} item={child} level={level + 1} parent={item} typeColors={typeColors} {...{onDropChild, onRemoveChild, onDragStart, onReorder, onEditItem, onApproveSuggestion, onRejectSuggestion, onEditSuggestion, onUpdateItem}} /> ))}
                </div>
            )}
        </div>
    );
};
export default BlockComponent;