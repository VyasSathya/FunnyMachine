/**
 * Joke Processing Script
 * 
 * Processes raw joke data from transcripts into the structured joke models
 * and performs basic analysis for joke classification.
 */

const fs = require('fs').promises;
const path = require('path');
const Joke = require('../models/joke-model');


// Technique classification logic
const classifyTechnique = (jokeText, laughter) => {
  // This is a very simplified classification system
  // In a real implementation, this would be much more sophisticated,
  // potentially using NLP and machine learning

  // Count word frequencies for common patterns
  const words = jokeText.toLowerCase().split(/\s+/);
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  // Check for specific patterns
  const hasQuestion = /\?/.test(jokeText);
  const hasSelfReference = /\b(i|me|my|mine|myself)\b/i.test(jokeText);
  const hasComparison = /\b(like|as|than)\b/i.test(jokeText);
  const hasExaggeration = /\b(all|every|always|never|nobody|everybody|forever|completely)\b/i.test(jokeText);
  const hasActOut = jokeText.includes('*') || jokeText.includes('[') || jokeText.includes('(');
  const hasNegation = /\b(not|don't|doesn't|can't|won't|never|no|none)\b/i.test(jokeText);
  const hasTaboo = /\b(sex|fuck|shit|ass|dick|pussy|gay|nigger|faggot|retard)\b/i.test(jokeText);
  const hasWordplay = words.some(word => {
    // Check for words that appear multiple times
    return wordFreq[word] > 1 && word.length > 3;
  });

  // Categorize based on patterns
  // This is a very simplistic approach that would be enhanced with ML
  if (hasTaboo && hasNegation) {
    return 'shock_taboo';
  }
  if (hasActOut) {
    return 'act_out_embodiment';
  }
  if (hasSelfReference && hasNegation) {
    return 'self_deprecation';
  }
  if (hasComparison) {
    return 'analogy_comparison';
  }
  if (hasExaggeration) {
    return 'hyperbole_escalation';
  }
  if (hasWordplay) {
    return 'wordplay_linguistic';
  }
  if (hasQuestion) {
    return 'observational_deconstruction';
  }
  
  // Default if no specific pattern is detected
  // In a real system, this would be more nuanced
  return 'setup_subversion';
};

// Split joke into setup and punchline
const splitJokeStructure = (jokeText) => {
  // This is a simplified approach to split joke text
  // A more advanced implementation would use NLP
  
  // Try to split on common punchline indicators
  const indicators = [' but ', '. ', '? ', '! ', '; ', '... ', ' - '];
  
  for (const indicator of indicators) {
    const parts = jokeText.split(indicator);
    if (parts.length > 1) {
      // Take the last part as the punchline
      const punchline = parts.pop();
      // Join the rest as setup
      const setup = parts.join(indicator);
      return { setup, punchline };
    }
  }
  
  // If no clear indicator, use character count
  if (jokeText.length > 20) {
    const midpoint = Math.floor(jokeText.length * 0.7); // 70/30 split
    return {
      setup: jokeText.substring(0, midpoint),
      punchline: jokeText.substring(midpoint)
    };
  }
  
  // Fallback for short jokes
  return {
    setup: jokeText,
    punchline: ''
  };
};

// Calculate word economy
const calculateWordEconomy = (jokeText) => {
  // Simple approach based on total words and essential words
  const words = jokeText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  // Fillers and common words that might be non-essential
  // This is a simplified approach - a real implementation would be more sophisticated
  const fillerWords = ['the', 'a', 'an', 'and', 'but', 'or', 'so', 'very', 'really', 'just'];
  
  // Count fillers
  const fillerCount = words.filter(word => 
    fillerWords.includes(word.toLowerCase())
  ).length;
  
  // Simple economy calculation
  const essentialWords = totalWords - fillerCount;
  const economy = essentialWords / totalWords;
  
  // Scale to 0-1 range
  return Math.min(1, Math.max(0, economy));
};

// Estimate joke strength based on laugh data and text features
const estimateStrength = (jokeText, laughData) => {
  // Basic indicators of strong jokes
  const hasSpecificity = /\d/.test(jokeText) || /\b(specific|exactly|precisely)\b/i.test(jokeText);
  const hasEmotionalWords = /\b(love|hate|fear|angry|sad|happy|feel|emotion|heart)\b/i.test(jokeText);
  const hasSurpriseElement = /\b(suddenly|unexpected|surprise|but then|turns out)\b/i.test(jokeText);
  
  // Calculate score based on features and laugh data
  let score = 0;
  
  // Text-based scoring
  if (hasSpecificity) score += 0.2;
  if (hasEmotionalWords) score += 0.15;
  if (hasSurpriseElement) score += 0.25;
  
  // Laugh-based scoring
  if (laughData && laughData.duration) {
    if (laughData.duration > 3) score += 0.3;
    else if (laughData.duration > 1.5) score += 0.2;
    else score += 0.1;
  }
  
  // Categorize
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
};

// Process a single joke
const processJoke = (jokeData, specialName, bitTitle, bitIndex, jokeIndex) => {
  const { text, laughter } = jokeData;
  
  // Skip if no text
  if (!text) return null;

  // Perform analysis
  const technique = classifyTechnique(text, laughter);
  const structure = splitJokeStructure(text);
  const wordEconomy = calculateWordEconomy(text);
  const strengthScore = estimateStrength(text, laughter);
  
  // Create laugh data entry if available
  const laughData = laughter ? [{
    timestamp: new Date().toISOString(),
    duration: laughter.duration || 0,
    intensity: laughter.confidence || 0.5
  }] : [];
  
  // Create the joke model
  const joke = new Joke({
    id: `joke_${specialName.replace(/\s+/g, '_').toLowerCase()}_${bitIndex}_${jokeIndex}`,
    text,
    tags: [], // Tags would be added in a more advanced implementation
    metadata: {
      creation_date: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      performance_count: 1,
      duration_seconds: laughter ? (laughter.end - laughter.start) : 5 // Estimate
    },
    analysis: {
      primary_technique: technique,
      techniques: [{
        name: technique,
        confidence: 0.8 // Simplified confidence score
      }],
      structure: {
        setup: structure.setup,
        punchline: structure.punchline,
        act_out: null // Would be identified in a more advanced implementation
      },
      metrics: {
        word_economy: wordEconomy,
        strength_score: strengthScore,
        laugh_data: laughData
      }
    },
    source: {
      special_name: specialName,
      bit_title: bitTitle,
      bit_index: bitIndex,
      joke_index: jokeIndex
    }
  });
  
  return joke;
};

// Main processing function
const processJokeData = async () => {
  try {
    // Path to raw data
    const dataPath = path.join(__dirname, '../data/raw/jokes_with_ai_analysis.jsonl');
    
    // Read data
    const rawData = await fs.readFile(dataPath, 'utf8');
    const jokeData = JSON.parse(rawData);
    
    // Process all jokes
    const processedJokes = [];
    
    // Group jokes by bit
    const jokesGroupedByBit = {};
    
    jokeData.forEach((joke) => {
      // Extract bit info
      const specialName = 'Chewed Up'; // Hardcoded for this example
      const bitInfo = joke.original_joke_data || {};
      const bitTitle = bitInfo.bit_title || 'Unknown Bit';
      const bitIndex = bitInfo.bit_index || 0;
      const jokeIndex = bitInfo.joke_index || 0;
      
      // Create bit group if it doesn't exist
      if (!jokesGroupedByBit[bitIndex]) {
        jokesGroupedByBit[bitIndex] = {
          title: bitTitle,
          jokes: []
        };
      }
      
      // Process the joke
      const processedJoke = processJoke(joke, specialName, bitTitle, bitIndex, jokeIndex);
      if (processedJoke) {
        processedJokes.push(processedJoke);
        jokesGroupedByBit[bitIndex].jokes.push(processedJoke);
      }
    });
    
    // Save processed jokes
    const outputPath = path.join(__dirname, '../data/processed');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(outputPath, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
    
    // Save all processed jokes
    await fs.writeFile(
      path.join(outputPath, 'jokes.json'),
      JSON.stringify(processedJokes, null, 2)
    );
    
    // Save grouped structure for bit processing
    await fs.writeFile(
      path.join(outputPath, 'jokes_by_bit.json'),
      JSON.stringify(jokesGroupedByBit, null, 2)
    );
    
    console.log(`Processed ${processedJokes.length} jokes from ${Object.keys(jokesGroupedByBit).length} bits`);
    return { processedJokes, jokesGroupedByBit };
  } catch (error) {
    console.error('Error processing joke data:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  processJokeData()
    .then(() => console.log('Joke processing complete'))
    .catch(err => console.error('Joke processing failed:', err));
}

module.exports = { processJokeData };