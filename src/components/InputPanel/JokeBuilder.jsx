import React, { useState, useEffect } from 'react';

const JokeBuilder = ({ initialData, onSave, onCancel }) => {
  // State to hold the editable joke parts, initialized from props
  const [setup, setSetup] = useState('');
  const [punchline, setPunchline] = useState('');
  const [tags, setTags] = useState([]); // Store tags as an array
  const [tagsInput, setTagsInput] = useState(''); // Input field string

  // Effect to update local state when initialData prop changes
  useEffect(() => {
    if (initialData) {
      setSetup(initialData.suggestedSetup || '');
      setPunchline(initialData.suggestedPunchline || '');
      const initialTags = initialData.suggestedTags || [];
      setTags(initialTags);
      setTagsInput(initialTags.join(', ')); // Initialize input field
    } else {
      // Reset if initialData becomes null (e.g., builder closed)
      setSetup('');
      setPunchline('');
      setTags([]);
      setTagsInput('');
    }
  }, [initialData]);

  // Update tags array when the tags input string changes
  const handleTagsInputChange = (event) => {
    const inputVal = event.target.value;
    setTagsInput(inputVal);
    // Basic split by comma, trim whitespace, remove empty strings
    const updatedTags = inputVal.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setTags(updatedTags);
  };

  // --- Helper function to format original text ---
  const formatOriginalText = (text) => {
    if (!text || typeof text !== 'string') return '';
    const words = text.trim().split(/\s+/); // Split by whitespace
    const wordCount = words.length;
    const snippetLength = 5; // Number of words to show at start/end

    if (wordCount <= snippetLength * 2) {
      return text; // If text is short, show all of it
    }

    const startWords = words.slice(0, snippetLength).join(' ');
    const endWords = words.slice(wordCount - snippetLength).join(' ');
    return `${startWords}...${endWords}`;
  };

  const handleSaveClick = () => {
    if (typeof onSave === 'function') {
      const now = new Date().toISOString();
      
      // Prepare data payload
      const saveData = {
        setup: setup,
        punchline: punchline,
        tags: tags,
        timestamp: now,
        source_selection: initialData?.originalSelection || null
      };

      // Check if we are editing an existing joke
      if (initialData?.originalJokeId) {
        saveData.jokeId = initialData.originalJokeId; // Add existing ID for update
        console.log("JokeBuilder: Saving update for joke ID:", saveData.jokeId);
      } else {
        console.log("JokeBuilder: Saving new joke.");
        // For new jokes, we might add the full initial version info directly
        // or let the App.js handler create it. Let's pass raw data for now.
      }
      
      onSave(saveData); // Pass the prepared data payload
    }
  };

  // If no initial data, don't render anything (or render loading/error)
  if (!initialData) {
    return null; 
  }

  return (
    <div className="joke-builder" style={{ marginTop: '15px', padding: '15px', border: '1px solid #007bff', borderRadius: '5px', background: '#f0f8ff' }}>
      <h4>Structure New Joke</h4>
      
      {/* Display original text for reference (Formatted) */}
      {initialData.originalSelection && (
          <div style={{ marginBottom: '10px', padding: '8px', background: '#e9ecef', borderRadius: '4px', fontSize: '0.9em' }}>
            <strong>Original Context:</strong>
            <div style={{ marginTop: '5px', fontStyle: 'italic', color: '#555' }}>
              {formatOriginalText(initialData.originalSelection)}
            </div>
          </div>
      )}

      {/* Editable Setup */}
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="setup-input" style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Setup:</label>
        <textarea
          id="setup-input"
          value={setup}
          onChange={(e) => setSetup(e.target.value)}
          placeholder="Enter joke setup..."
          rows={3}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      {/* Editable Punchline */}
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="punchline-input" style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Punchline:</label>
        <textarea
          id="punchline-input"
          value={punchline}
          onChange={(e) => setPunchline(e.target.value)}
          placeholder="Enter joke punchline..."
          rows={3}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      {/* Editable Tags */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="tags-input" style={{ display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Tags (comma-separated):</label>
        <input
          id="tags-input"
          type="text"
          value={tagsInput}
          onChange={handleTagsInputChange}
          placeholder="e.g., observation, relationship, work"
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        {/* Optionally display tags as pills */}
        {tags.length > 0 && (
            <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {tags.map((tag, index) => (
                    <span key={index} style={{ background: '#ccc', color: '#333', padding: '2px 6px', borderRadius: '10px', fontSize: '0.85em' }}>
                        {tag}
                    </span>
                ))}
            </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button 
          className="btn green-btn" 
          onClick={handleSaveClick}
          disabled={!setup.trim() && !punchline.trim()} // Basic validation
        >
          Save Joke to Library
        </button>
      </div>
    </div>
  );
};

export default JokeBuilder; 