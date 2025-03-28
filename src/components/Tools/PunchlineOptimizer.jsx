// src/components/Tools/PunchlineOptimizer.jsx
import React, { useState, useEffect } from 'react';

// Receives the joke being analyzed and the selected AI model
const PunchlineOptimizer = ({ jokeItem, selectedModel }) => {
    // Initialize state based on the jokeItem prop
    const [setup, setSetup] = useState('');
    const [punchline, setPunchline] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Update local state when the jokeItem prop changes (e.g., user selects different joke)
    useEffect(() => {
        if (jokeItem && jokeItem.type === 'joke') {
            const currentText = jokeItem.text || '';
            // Attempt to split text into setup/punchline if not explicitly provided
            // This is a basic guess - might need refinement or rely on user input
            const midPoint = Math.floor(currentText.length / 2); // Simple midpoint split
            const currentSetup = jokeItem.setup || currentText.substring(0, midPoint);
            const currentPunchline = jokeItem.punchline || currentText.substring(midPoint);

            setSetup(currentSetup);
            setPunchline(currentPunchline);
        } else {
            // Reset if item is not a joke
            setSetup('');
            setPunchline('');
        }
        // Clear results when joke changes
        setSuggestions([]);
        setError('');
    }, [jokeItem]); // Re-run effect if jokeItem changes

    // Function to call the backend API
    const handleOptimize = async () => {
        if (!punchline.trim()) {
            setError("Please enter a punchline to optimize.");
            return;
        }
        if (!selectedModel) {
            setError("Please select an AI model first."); // Should be selected in Analysis view
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestions([]);

        console.log(`Optimizing punchline with model: ${selectedModel}`);
        console.log(`Setup: ${setup}`);
        console.log(`Punchline: ${punchline}`);

        try {
            const response = await fetch('http://localhost:3001/api/optimize-punchline', { // Ensure port matches backend
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({
                    setup: setup, // Send current setup text
                    punchline: punchline, // Send current punchline text
                    selectedModel: selectedModel // Send the chosen AI model
                }),
            });

            if (!response.ok) { // Check for HTTP errors (like 404, 500)
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json(); // Try to get error message from backend response
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* Ignore if response body is not JSON */ }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            setSuggestions(data.suggestions || []); // Update state with suggestions from response

        } catch (err) {
            console.error("Failed to fetch punchline suggestions:", err);
            // Display a user-friendly error based on the caught error
            setError(`Failed to get suggestions: ${err.message}. Is the backend running correctly?`);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render ---
    return (
        <div className="punchline-optimizer tool-panel">
            <h4>Punchline Optimizer</h4>
            {/* Removed jokeItem label as it's shown in AnalysisView header */}
            <p>Using Model: <strong>{selectedModel}</strong></p>

            <div className="optimizer-input">
                <label htmlFor="setup-input">Setup:</label>
                <textarea
                    id="setup-input"
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    rows={3}
                    placeholder="Enter joke setup (provides context for the AI)"
                />
                <label htmlFor="punchline-input">Current Punchline:</label>
                <textarea
                    id="punchline-input"
                    value={punchline}
                    onChange={(e) => setPunchline(e.target.value)}
                    rows={4}
                    placeholder="Enter punchline to optimize"
                />
            </div>
            <button onClick={handleOptimize} disabled={isLoading || !punchline.trim()} className="btn ai-action-btn">
                {isLoading ? 'Optimizing...' : `Optimize Punchline`}
            </button>

            {isLoading && <p>Loading suggestions...</p>}
            {error && <p className="error-message" style={{marginTop: '15px'}}>{error}</p>}

            {suggestions.length > 0 && (
                <div className="optimizer-results">
                    <h5>Suggestions:</h5>
                    <ul>
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PunchlineOptimizer;