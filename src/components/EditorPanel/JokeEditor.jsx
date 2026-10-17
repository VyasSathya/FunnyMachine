import React, { useState, useEffect } from 'react';

// This component is designed to live in the middle panel for focused editing
const JokeEditor = ({ joke, onSaveNew, onUpdate, onCancel }) => {
  // State holds the editable fields, initialized from the joke prop
  const [setup, setSetup] = useState('');
  const [punchline, setPunchline] = useState('');
  const [tags, setTags] = useState([]);
  const [tagsInput, setTagsInput] = useState('');

  // Effect to load data when the joke prop changes
  useEffect(() => {
    if (joke) {
      // Load from top-level fields (assumed to be latest)
      setSetup(joke.analysis?.structure?.setup || joke.text?.split('\n')[0] || '');
      setPunchline(joke.analysis?.structure?.punchline || joke.text?.split('\n').slice(1).join('\n') || '');
      const currentTags = joke.tags || [];
      setTags(currentTags);
      setTagsInput(currentTags.join(', '));
    } else {
      // Reset if joke becomes null (shouldn't normally happen while mounted)
      setSetup('');
      setPunchline('');
      setTags([]);
      setTagsInput('');
    }
  }, [joke]);

  // --- Handlers ---
  const handleTagsInputChange = (event) => {
    const inputVal = event.target.value;
    setTagsInput(inputVal);
    const updatedTags = inputVal.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setTags(updatedTags);
  };

  const handleSaveClick = () => {
    const now = new Date().toISOString();
    const saveData = {
      setup: setup,
      punchline: punchline,
      tags: tags,
      timestamp: now,
      // Attempt to get original snippet if stored in the temp object
      source_selection: joke?._originalSnippet || joke?.versions?.[0]?.source_selection || null 
    };

    // Check if the initial joke object passed in has an ID
    if (joke && joke.id) {
      // It's an existing joke - call the update handler
      if (typeof onUpdate === 'function') {
        saveData.jokeId = joke.id; // Ensure the ID is included
        console.log("JokeEditor: Calling onUpdate for ID:", joke.id);
        onUpdate(saveData);
      } else {
        console.error("JokeEditor Error: onUpdate handler is missing.");
      }
    } else {
      // It's a new joke (loaded from a suggestion) - call the save new handler
      if (typeof onSaveNew === 'function') {
        console.log("JokeEditor: Calling onSaveNew.");
        onSaveNew(saveData);
      } else {
        console.error("JokeEditor Error: onSaveNew handler is missing.");
      }
    }
  };

  // If no joke is provided, maybe show a message or loading
  if (!joke) {
    return <div style={{ padding: '20px' }}>No joke selected for editing.</div>;
  }

  // Update button text based on whether it's a new or existing joke
  const isNewJoke = !(joke && joke.id);

  return (
    <div className="joke-editor" style={{ padding: '20px' }}>
      <h3>{isNewJoke ? 'Create New Joke' : `Editing Joke: ${joke.label || '(Untitled)'}`}</h3>
      
      {/* Display Original Context if available (especially for new jokes from suggestions) */}
      {(joke?._originalSnippet) && (
         <div style={{ marginBottom: '10px', padding: '8px', background: '#e9ecef', borderRadius: '4px', fontSize: '0.9em' }}>
            <strong>Original Context:</strong>
            {/* You might want the formatter function here too */} 
            <div style={{ marginTop: '5px', fontStyle: 'italic', color: '#555' }}>
               {joke._originalSnippet}
            </div>
         </div>
      )}

      {/* Similar structure to JokeBuilder, but maybe styled for middle panel */}
      
      {/* Editable Setup */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="edit-setup-input" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Setup:</label>
        <textarea
          id="edit-setup-input"
          value={setup}
          onChange={(e) => setSetup(e.target.value)}
          placeholder="Enter joke setup..."
          rows={5} // Potentially more rows in middle panel
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
        />
      </div>

      {/* Editable Punchline */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="edit-punchline-input" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Punchline:</label>
        <textarea
          id="edit-punchline-input"
          value={punchline}
          onChange={(e) => setPunchline(e.target.value)}
          placeholder="Enter joke punchline..."
          rows={5} // Potentially more rows
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
        />
      </div>

      {/* Editable Tags */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="edit-tags-input" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tags (comma-separated):</label>
        <input
          id="edit-tags-input"
          type="text"
          value={tagsInput}
          onChange={handleTagsInputChange}
          placeholder="e.g., observation, relationship, work"
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
        />
        {tags.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map((tag, index) => (
                    <span key={index} style={{ background: '#ccc', color: '#333', padding: '3px 8px', borderRadius: '12px', fontSize: '0.9em' }}>
                        {tag}
                    </span>
                ))}
            </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-start' }}>
        <button 
          className="btn green-btn" 
          onClick={handleSaveClick}
          disabled={!setup.trim() && !punchline.trim()} 
        >
          {isNewJoke ? 'Save New Joke' : 'Save Changes'} 
        </button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default JokeEditor; 