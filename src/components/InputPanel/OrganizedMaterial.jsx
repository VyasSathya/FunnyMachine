// src/components/InputPanel/OrganizedMaterial.jsx
import React from 'react';
import BlockComponent from '../BlockComponent'; // To display the structure

// Receives the raw organized data { bits: [...], highlights: [...] }, callbacks for save/cancel, and colors
const OrganizedMaterial = ({ organizedResult, onSave, onCancel, typeColors }) => {

    // Basic check if the data structure is as expected
    if (!organizedResult || !Array.isArray(organizedResult.bits)) {
        console.error("Invalid organizedResult structure received:", organizedResult);
        return <div className="error-message">Error: Invalid data received for review.</div>;
    }

    const handleSaveClick = () => {
        if (typeof onSave === 'function') {
            // In a real editor, you'd pass back the potentially *edited* data.
            // For now, we pass back the original organized data.
            onSave(organizedResult);
        } else {
            console.error("onSave handler is missing from OrganizedMaterial props.");
        }
    };

    const handleCancelClick = () => {
        if (typeof onCancel === 'function') {
            onCancel();
        } else {
            console.error("onCancel handler is missing from OrganizedMaterial props.");
        }
    }

    return (
        <div className="organized-material-review">
            <h4>Review Organized Content</h4>
            <p>Review the bits and jokes identified by the AI. (Editing/Highlighting UI not implemented yet).</p>

             {/* Display AI highlights/suggestions if present */}
             {organizedResult.highlights && organizedResult.highlights.length > 0 && (
                 <div className="ai-highlights" style={{marginBottom: '15px', padding: '10px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '4px'}}>
                     <h5>AI Suggestions:</h5>
                     <ul style={{margin: 0, paddingLeft: '20px', fontSize: '0.9em'}}>
                        {organizedResult.highlights.map((h, i) => (
                            <li key={i}>Consider reviewing section near "{h.textSnippet || '...'}" (Reason: {h.reason || 'N/A'})</li>
                         ))}
                     </ul>
                 </div>
             )}

            {/* Display the structured bits using BlockComponent (non-interactive version) */}
            <div className="organized-preview">
                {organizedResult.bits.length > 0 ? (
                    organizedResult.bits.map(bit => (
                        <BlockComponent
                            key={bit.id || `review-bit-${Math.random()}`} // Use provided ID or generate temp key
                            item={bit}
                            level={0}
                            typeColors={typeColors}
                            // Pass empty/dummy handlers to disable DnD/Remove in preview
                            onDropChild={() => {}}
                            onRemoveChild={() => {}}
                            onDragStart={(e) => e.preventDefault()}
                            onReorder={() => {}}
                            parent={null}
                        />
                    ))
                ) : (
                    <p>No bits/jokes were identified in the text.</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="review-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="btn blue-btn" onClick={handleSaveClick}>
                    Save to Library
                </button>
                <button className="btn" onClick={handleCancelClick}>
                    Cancel / Discard
                </button>
            </div>
        </div>
    );
};

export default OrganizedMaterial;