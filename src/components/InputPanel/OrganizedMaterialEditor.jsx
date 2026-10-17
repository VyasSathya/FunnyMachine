// src/components/InputPanel/OrganizedMaterialEditor.jsx
import React, { useState, useEffect } from 'react';

// NOTE: This is a basic structure. A real editor would need more robust state management,
// potentially using libraries like Immer for easier nested updates, and better UI controls.

const OrganizedMaterialEditor = ({ organizedResult, onSave, onCancel, typeColors }) => {
    // Keep local state for editing
    const [editedData, setEditedData] = useState(null);

    // Initialize local state when the prop changes
    useEffect(() => {
        // Deep clone the initial result to allow local modifications
        setEditedData(structuredClone(organizedResult));
    }, [organizedResult]);

    // Handler to update text (example for joke text)
    const handleJokeTextChange = (bitIndex, jokeIndex, newText) => {
        setEditedData(currentData => {
            if (!currentData || !currentData.bits || !currentData.bits[bitIndex]?.children) return currentData;
            // Create a deep copy to modify safely
            const newData = structuredClone(currentData);
            // Update the specific joke text
            if (newData.bits[bitIndex].children[jokeIndex]) {
                newData.bits[bitIndex].children[jokeIndex].text = newText;
            }
            return newData; // Return the modified copy
        });
    };

    // Handler to update bit label
     const handleBitLabelChange = (bitIndex, newLabel) => {
         setEditedData(currentData => {
            if (!currentData || !currentData.bits || !currentData.bits[bitIndex]) return currentData;
            const newData = structuredClone(currentData);
            newData.bits[bitIndex].label = newLabel;
            return newData;
         });
     };

    // Handler to remove a joke
    const handleRemoveJoke = (bitIndex, jokeIndex) => {
        if (!window.confirm("Remove this joke?")) return;
        setEditedData(currentData => {
             if (!currentData || !currentData.bits || !currentData.bits[bitIndex]?.children) return currentData;
             const newData = structuredClone(currentData);
             if (newData.bits[bitIndex].children[jokeIndex]) {
                 newData.bits[bitIndex].children.splice(jokeIndex, 1);
             }
             return newData;
        });
    };

    // Handler to remove a bit
    const handleRemoveBit = (bitIndex) => {
         if (!window.confirm("Remove this entire bit and its jokes?")) return;
         setEditedData(currentData => {
             if (!currentData || !currentData.bits || !currentData.bits[bitIndex]) return currentData;
             const newData = structuredClone(currentData);
             newData.bits.splice(bitIndex, 1);
             return newData;
         });
    };


    const handleSaveClick = () => {
        if (typeof onSave === 'function') {
            onSave(editedData); // Pass the current (potentially edited) state back
        }
    };

    const handleCancelClick = () => {
        if (typeof onCancel === 'function') { onCancel(); }
    }

    // Render logic using the local 'editedData' state
    if (!editedData || !Array.isArray(editedData.bits)) {
        return <div className="error-message">Error displaying organized data for review.</div>;
    }

    return (
        <div className="organized-material-review">
            <h4>Review & Edit Organized Content</h4>
            <p>Modify labels or text, or remove unwanted items before saving.</p>

             {/* Optional: AI Highlights */}
             {editedData.highlights && editedData.highlights.length > 0 && (
                 <div className="ai-highlights">{/* ... display highlights ... */}</div>
             )}

            {/* Editable Structure */}
            <div className="organized-editor">
                {editedData.bits.length > 0 ? (
                    editedData.bits.map((bit, bitIndex) => (
                        <div key={bit.id || `edit-bit-${bitIndex}`} className="review-bit" style={{ marginLeft: '0px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', padding: '10px', background: typeColors?.bit || '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    value={bit.label || `Bit ${bitIndex + 1}`}
                                    onChange={(e) => handleBitLabelChange(bitIndex, e.target.value)}
                                    style={{ fontWeight: 'bold', flexGrow: 1, marginRight: '10px', padding: '4px 6px' }}
                                />
                                <span className="type-label">bit</span>
                                <button onClick={() => handleRemoveBit(bitIndex)} title="Remove Bit" className="remove-button" style={{position: 'relative', top: 0, right: 0, opacity: 1}}>🗑️</button>
                            </div>
                            <div className="review-jokes" style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(bit.children || []).filter(item => item.type === 'joke').map((joke, jokeIndex) => (
                                    <div key={joke.id || `edit-joke-${bitIndex}-${jokeIndex}`} className="review-joke" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px', background: typeColors?.joke || '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                                        <span className="type-label">joke</span>
                                        <textarea
                                            value={joke.text || ''}
                                            onChange={(e) => handleJokeTextChange(bitIndex, jokeIndex, e.target.value)}
                                            rows={2}
                                            style={{ flexGrow: 1 }}
                                        />
                                        <button onClick={() => handleRemoveJoke(bitIndex, jokeIndex)} title="Remove Joke" className="remove-button" style={{position: 'relative', top: 0, right: 0, opacity: 1}}>🗑️</button>
                                    </div>
                                ))}
                                 {(bit.children || []).filter(item => item.type === 'joke').length === 0 && <p style={{fontSize: '0.9em', color: '#666'}}>No jokes in this bit.</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No bits/jokes were identified.</p>
                )}
            </div>

            <div className="review-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="btn blue-btn" onClick={handleSaveClick}>Save Changes to Library</button>
                <button className="btn" onClick={handleCancelClick}>Cancel</button>
            </div>
        </div>
    );
};

export default OrganizedMaterialEditor;