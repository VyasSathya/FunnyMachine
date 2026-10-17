import React, { useState, useEffect } from 'react';
import '../../styles/Analysis.css';

const TextAnalysis = ({ jokeText }) => {
  const [analyzedText, setAnalyzedText] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (jokeText) {
      analyzeJokeText(jokeText);
    }
  }, [jokeText]);

  const analyzeJokeText = async (text) => {
    setIsAnalyzing(true);
    
    try {
      // For demo purposes, we'll use a simple analysis that you can replace with AI later
      // In a real implementation, you would call an API for natural language analysis
      const words = text.split(/\s+/);
      const result = [];
      
      // Simple demo analysis - in real implementation this would be much more sophisticated
      let inSetup = true;
      
      // Pre-process to identify phrases and patterns that should be preserved
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const repeatPatterns = findRepeatPatterns(text);
      const hesitations = findHesitationPatterns(text);
      
      words.forEach((word, index) => {
        // For demo: analyze based on word position and some simple rules
        
        // Arbitrary rules for demo:
        // - First 70% of words are setup
        // - Last 30% are punchline
        const setupThreshold = Math.floor(words.length * 0.7);
        const isSetup = index < setupThreshold;
        const isPunchline = !isSetup;
        
        // Words that might be unnecessary in some contexts
        const potentialFillerWords = ['the', 'a', 'an', 'and', 'but', 'or', 'so', 'very', 'really', 'just'];
        
        // Check if this word is part of a repeating pattern (comedic device)
        const isPartOfRepetition = repeatPatterns.some(pattern => 
          pattern.includes(word.toLowerCase()) && 
          words.slice(Math.max(0, index - 5), index).some(w => pattern.includes(w.toLowerCase()))
        );
        
        // Check if word is a hesitation that adds authenticity
        const isAuthenticHesitation = hesitations.includes(word.toLowerCase());
        
        // Check if word adds perspective or voice
        const isPerspectiveWord = isPerspectiveMarker(word, index, words);
        
        // Now determine if it's truly unnecessary
        const isLowValue = potentialFillerWords.includes(word.toLowerCase()) && 
                          !(index === 0 || index === setupThreshold) &&
                          !isPartOfRepetition && 
                          !isAuthenticHesitation && 
                          !isPerspectiveWord;
        
        let category;
        // Be more conservative about marking things as unnecessary
        if (isLowValue && consecutiveFillers(index, words).length > 2) {
          // Only mark as unnecessary if we have multiple filler words in sequence
          category = 'unnecessary';
        } else if (isSetup) {
          // Within setup, identify strong vs acceptable parts
          if (isPartOfRepetition || isPerspectiveWord) {
            category = 'strong-setup'; // Repetition and perspective are valuable in setup
          } else {
            category = Math.random() > 0.5 ? 'strong-setup' : 'acceptable-setup';
          }
        } else if (isPunchline) {
          // Words closer to the end have higher chance of being strong punchline
          const punchlinePosition = (index - setupThreshold) / (words.length - setupThreshold);
          if (isPartOfRepetition || word.length > 5) {
            category = 'strong-punchline'; // Callbacks and distinctive words strengthen punchlines
          } else {
            category = punchlinePosition > 0.5 ? 'strong-punchline' : 'acceptable-punchline';
          }
        }
        
        result.push({
          word,
          category
        });
      });
      
      setAnalyzedText(result);
    } catch (error) {
      console.error('Error analyzing joke text:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Helper functions
  function findRepeatPatterns(text) {
    // Simple pattern detection
    const words = text.toLowerCase().split(/\s+/);
    const patterns = [];
    
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i] === words[i+2] || words[i] === words[i+1]) {
        patterns.push([words[i]]);
      }
    }
    
    return patterns;
  }
  
  function findHesitationPatterns(text) {
    // Common hesitations that add authenticity
    return ['um', 'uh', 'like', 'you know', 'well', 'so'];
  }
  
  function isPerspectiveMarker(word, index, words) {
    // Words that indicate perspective or voice - valuable for comedy
    const perspectiveWords = ['I', 'me', 'my', 'mine', 'myself', 
                            'think', 'feel', 'believe', 'know',
                            'always', 'never', 'actually'];
    
    return perspectiveWords.includes(word.toLowerCase());
  }
  
  function consecutiveFillers(index, words) {
    // Check for sequence of filler words
    const fillers = ['the', 'a', 'an', 'and', 'but', 'or', 'so'];
    const consecutiveWords = [];
    
    let i = index;
    while (i >= 0 && fillers.includes(words[i].toLowerCase())) {
      consecutiveWords.unshift(words[i]);
      i--;
    }
    
    i = index + 1;
    while (i < words.length && fillers.includes(words[i].toLowerCase())) {
      consecutiveWords.push(words[i]);
      i++;
    }
    
    return consecutiveWords;
  }

  if (isAnalyzing) {
    return <div className="analyzing">Analyzing joke structure...</div>;
  }

  if (!analyzedText.length) {
    return <div className="empty-analysis">Select a joke to analyze its text structure</div>;
  }

  return (
    <div className="text-analysis">
      <h3>Joke Text Analysis</h3>
      
      <div className="color-legend">
        <div className="legend-item"><span className="color-box unnecessary"></span> Unnecessary</div>
        <div className="legend-item"><span className="color-box acceptable-setup"></span> Acceptable Setup</div>
        <div className="legend-item"><span className="color-box strong-setup"></span> Strong Setup</div>
        <div className="legend-item"><span className="color-box acceptable-punchline"></span> Acceptable Punchline</div>
        <div className="legend-item"><span className="color-box strong-punchline"></span> Strong Punchline</div>
      </div>
      
      <div className="analyzed-text">
        {analyzedText.map((item, index) => (
          <span 
            key={index} 
            className={`word ${item.category}`}
            title={item.category.replace('-', ' ')}
          >
            {item.word}{' '}
          </span>
        ))}
      </div>
      
      <div className="analysis-summary">
        <h4>Joke Structure Summary</h4>
        <div className="metrics">
          <div className="metric">
            <span>Setup Words:</span>
            <span>{analyzedText.filter(i => i.category.includes('setup')).length}</span>
          </div>
          <div className="metric">
            <span>Punchline Words:</span>
            <span>{analyzedText.filter(i => i.category.includes('punchline')).length}</span>
          </div>
          <div className="metric">
            <span>Unnecessary Words:</span>
            <span>{analyzedText.filter(i => i.category === 'unnecessary').length}</span>
          </div>
          <div className="metric">
            <span>Word Economy:</span>
            <span>
              {Math.round(
                (analyzedText.filter(i => i.category !== 'unnecessary').length / 
                analyzedText.length) * 100
              )}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnalysis;