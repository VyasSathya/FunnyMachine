/**
 * Bit and Set Grouping Script
 * 
 * Takes processed joke data and groups them into bits and sets
 * based on the bit structure from the raw data.
 */

const fs = require('fs').promises;
const path = require('path');
const Bit = require('../models/bit-model');
const Set = require('../models/set-model');
const Special = require('../models/special-model');
const { processJokeData } = require('./process-jokes');

// Analyze bit for emotional content and techniques
const analyzeBit = (jokeModels) => {
  // Skip empty bits
  if (!jokeModels || jokeModels.length === 0) {
    return {
      primary_technique: 'universal_premise',
      techniques: [],
      emotional_core: 'neutral',
      vulnerability_level: 'low',
      energy_profile: 'medium',
      audience_journey: []
    };
  }

  // Count technique frequencies
  const techniqueCounts = {};
  jokeModels.forEach(joke => {
    const primaryTechnique = joke.analysis.primary_technique;
    techniqueCounts[primaryTechnique] = (techniqueCounts[primaryTechnique] || 0) + 1;
  });

  // Find most common technique
  let primaryTechnique = 'universal_premise';
  let maxCount = 0;
  for (const [technique, count] of Object.entries(techniqueCounts)) {
    if (count > maxCount) {
      maxCount = count;
      primaryTechnique = technique;
    }
  }

  // Detect emotional content based on keywords in jokes
  const emotionKeywords = {
    anger: ['angry', 'mad', 'rage', 'furious', 'hate', 'pissed'],
    joy: ['happy', 'joy', 'love', 'great', 'funny', 'awesome', 'wonderful'],
    fear: ['fear', 'scared', 'afraid', 'terrified', 'worry', 'anxious'],
    sadness: ['sad', 'depressed', 'upset', 'miserable', 'grief', 'disappointed'],
    disgust: ['disgust', 'gross', 'revolting', 'nasty'],
    surprise: ['surprise', 'shocked', 'amazed', 'unexpected'],
    confusion: ['confused', 'puzzled', 'weird', 'strange', 'odd'],
    frustration: ['frustration', 'annoying', 'frustrated']
  };

  // Count emotion keywords
  const emotionCounts = {};
  const allText = jokeModels.map(joke => joke.text.toLowerCase()).join(' ');
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    emotionCounts[emotion] = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = allText.match(regex);
      if (matches) {
        emotionCounts[emotion] += matches.length;
      }
    });
  }

  // Find primary emotion
  let primaryEmotion = 'neutral';
  maxCount = 0;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      primaryEmotion = emotion;
    }
  }

  // If no clear emotion is detected, check for personal pronouns to determine if it's self-focused
  if (maxCount === 0) {
    const personalPronounCount = (allText.match(/\\b(i|me|my|mine|myself)\\b/gi) || []).length;
    const totalWords = allText.split(/\\s+/).length;
    
    // If high percentage of personal pronouns, likely personal/vulnerable
    if (personalPronounCount > 0 && personalPronounCount / totalWords > 0.05) {
      primaryEmotion = 'frustration'; // Common emotion in personal comedy
    }
  }

  // Detect vulnerability level based on personal content
  let vulnerabilityLevel = 'low';
  const personalTopics = ['marriage', 'divorce', 'sex', 'childhood', 'parents', 'depression', 'failure', 'body'];
  let personalTopicCount = 0;

  personalTopics.forEach(topic => {
    if (allText.includes(topic)) {
      personalTopicCount++;
    }
  });

  if (personalTopicCount >= 3) {
    vulnerabilityLevel = 'high';
  } else if (personalTopicCount >= 1) {
    vulnerabilityLevel = 'moderate';
  }

  // Determine energy profile based on joke length, punctuation, and subject matter
  const averageJokeLength = jokeModels.reduce((sum, joke) => sum + joke.text.length, 0) / jokeModels.length;
  const exclamationCount = (allText.match(/!/g) || []).length;
  const questionCount = (allText.match(/\\?/g) || []).length;
  
  // Calculate energy score
  let energyScore = 0;
  if (averageJokeLength < 50) energyScore += 1; // Short jokes often higher energy
  energyScore += exclamationCount * 0.5; // Exclamations suggest higher energy
  
  // High energy emotions
  if (['anger', 'joy', 'surprise'].includes(primaryEmotion)) {
    energyScore += 2;
  }
  
  let energyProfile = 'medium';
  if (energyScore > 3) {
    energyProfile = 'high';
  } else if (energyScore < 1) {
    energyProfile = 'low';
  }

  // Simple audience journey (would be more sophisticated in a real implementation)
  const audienceJourney = ['setup', 'identification', primaryEmotion];

  // Map joke techniques to bit techniques (simplified mapping)
  const techniqueMapping = {
    'setup_subversion': 'universal_premise',
    'observational_deconstruction': 'universal_premise',
    'hyperbole_escalation': 'logical_escalation',
    'self_deprecation': 'emotional_truth',
    'status_play': 'anthropological_observation',
    'analogy_comparison': 'emotional_analogy',
    'wordplay_linguistic': 'breaking_sentiment'
  };

  // Collect all techniques with mapping to bit-level techniques
  const bitTechniques = [];
  jokeModels.forEach(joke => {
    const jokeTechnique = joke.analysis.primary_technique;
    const bitTechnique = techniqueMapping[jokeTechnique] || 'universal_premise';
    
    if (!bitTechniques.find(t => t.name === bitTechnique)) {
      bitTechniques.push({
        name: bitTechnique,
        confidence: 0.7 // Simplified confidence
      });
    }
  });

  return {
    primary_technique: techniqueMapping[primaryTechnique] || 'universal_premise',
    techniques: bitTechniques,
    emotional_core: primaryEmotion,
    vulnerability_level: vulnerabilityLevel,
    energy_profile: energyProfile,
    audience_journey: audienceJourney
  };
};

// Generate feedback for bit
const generateBitFeedback = (jokeModels, bitAnalysis) => {
  // Skip empty bits
  if (!jokeModels || jokeModels.length === 0) {
    return {
      emotional_truth: 0.5,
      bit_cohesion: 0.5,
      improvements: ["Add jokes to this bit"]
    };
  }

  // Analyze joke strength distribution
  const strengthCounts = {
    low: 0,
    medium: 0,
    high: 0
  };

  jokeModels.forEach(joke => {
    const strength = joke.analysis.metrics.strength_score;
    strengthCounts[strength]++;
  });

  // Calculate average joke strength
  const totalJokes = jokeModels.length;
  const strengthScore = (
    (strengthCounts.low * 0.3) + 
    (strengthCounts.medium * 0.6) + 
    (strengthCounts.high * 0.9)
  ) / totalJokes;

  // Assess technique variety
  const techniques = new Set(jokeModels.map(joke => joke.analysis.primary_technique));
  const techniqueVariety = techniques.size / totalJokes;

  // Assess emotional truth based on vulnerability and emotion consistency
  const emotionalTruth = bitAnalysis.vulnerability_level === 'high' ? 
    0.8 : (bitAnalysis.vulnerability_level === 'moderate' ? 0.6 : 0.4);

  // Assess bit cohesion based on topic consistency
  const bitCohesion = techniqueVariety < 0.7 ? 0.8 : 0.5; // Less variety often means more cohesion

  // Generate improvement suggestions
  const improvements = [];

  if (strengthCounts.low > totalJokes * 0.3) {
    improvements.push("Consider strengthening or removing weaker jokes");
  }

  if (techniqueVariety < 0.3) {
    improvements.push("Add more variety in joke techniques");
  } else if (techniqueVariety > 0.8) {
    improvements.push("Consider focusing the bit with more consistent techniques");
  }

  if (emotionalTruth < 0.6) {
    improvements.push("Increase emotional truth by adding more vulnerability");
  }

  if (bitCohesion < 0.6) {
    improvements.push("Improve cohesion by tightening the theme of the bit");
  }

  if (improvements.length === 0) {
    improvements.push("This bit has good structure and balance");
  }

  return {
    emotional_truth: emotionalTruth,
    bit_cohesion: bitCohesion,
    improvements
  };
};

// Analyze a set of bits
const analyzeSet = (bitModels) => {
  // Skip empty sets
  if (!bitModels || bitModels.length === 0) {
    return {
      primary_technique: 'thematic_threading',
      energy_mapping: [],
      callback_opportunities: [],
      audience_journey: {
        opening_emotion: 'curiosity',
        peak_emotion: 'recognition',
        closing_emotion: 'satisfaction'
      },
      venue_compatibility: {
        club: 0.5,
        corporate: 0.5,
        theater: 0.5
      }
    };
  }

  // Analyze energy flow
  const energyMapping = bitModels.map((bit, index) => {
    const position = index / (bitModels.length - 1 || 1);
    return {
      position,
      level: bit.analysis.energy_profile
    };
  });

  // Determine primary technique (simplified)
  let primaryTechnique = 'thematic_threading';
  
  // Look for narrative flow
  const hasStrongOpening = bitModels[0] && bitModels[0].analysis.energy_profile === 'high';
  const hasStrongClosing = bitModels[bitModels.length - 1] && 
    bitModels[bitModels.length - 1].analysis.energy_profile === 'high';
  
  if (hasStrongOpening && hasStrongClosing) {
    primaryTechnique = 'opening_closing_symmetry';
  }
  
  // Look for vulnerability progression
  const vulnerabilityLevels = bitModels.map(bit => {
    if (bit.analysis.vulnerability_level === 'high') return 2;
    if (bit.analysis.vulnerability_level === 'moderate') return 1;
    return 0;
  });
  
  const vulnProgression = vulnerabilityLevels.slice(1).map((level, i) => 
    level - vulnerabilityLevels[i]
  );
  
  const hasVulnProgression = vulnProgression.reduce((sum, diff) => sum + diff, 0) > 0;
  
  if (hasVulnProgression) {
    primaryTechnique = 'vulnerability_progression';
  }

  // Determine audience journey
  const emotions = bitModels.map(bit => bit.analysis.emotional_core);
  const openingEmotion = emotions[0] || 'curiosity';
  const closingEmotion = emotions[emotions.length - 1] || 'satisfaction';
  
  // Find the most intense emotion for peak
  const emotionIntensity = {
    'anger': 8,
    'joy': 7,
    'fear': 8,
    'surprise': 9,
    'disgust': 7,
    'sadness': 6,
    'frustration': 7,
    'confusion': 5,
    'neutral': 3
  };
  
  let peakEmotion = openingEmotion;
  let maxIntensity = emotionIntensity[openingEmotion] || 0;
  
  emotions.forEach(emotion => {
    const intensity = emotionIntensity[emotion] || 0;
    if (intensity > maxIntensity) {
      maxIntensity = intensity;
      peakEmotion = emotion;
    }
  });

  // Simple venue compatibility assessment
  const hasTabooContent = bitModels.some(bit => 
    bit.title.toLowerCase().includes('sex') || 
    bit.title.toLowerCase().includes('fuck') ||
    bit.title.toLowerCase().includes('shit')
  );
  
  const hasComplexThemes = bitModels.some(bit => 
    bit.analysis.vulnerability_level === 'high' ||
    ['sadness', 'fear', 'disgust'].includes(bit.analysis.emotional_core)
  );
  
  const venue_compatibility = {
    club: hasTabooContent ? 0.9 : 0.7,
    corporate: hasTabooContent ? 0.3 : (hasComplexThemes ? 0.5 : 0.8),
    theater: hasComplexThemes ? 0.9 : 0.7
  };

  return {
    primary_technique: primaryTechnique,
    energy_mapping: energyMapping,
    callback_opportunities: [], // Would identify callbacks in a full implementation
    audience_journey: {
      opening_emotion: openingEmotion,
      peak_emotion: peakEmotion,
      closing_emotion: closingEmotion
    },
    venue_compatibility
  };
};

// Generate feedback for a set
const generateSetFeedback = (bitModels, setAnalysis) => {
  // Skip empty sets
  if (!bitModels || bitModels.length === 0) {
    return {
      flow_assessment: 0.5,
      energy_balance: 0.5,
      technique_variety: 0.5,
      improvements: ["Add bits to this set"]
    };
  }

  // Assess energy flow
  const energyLevels = bitModels.map(bit => {
    if (bit.analysis.energy_profile === 'high') return 1;
    if (bit.analysis.energy_profile === 'low') return -1;
    return 0;
  });
  
  // Look for good energy variation (not just uniform or chaotic)
  let energyDiffs = 0;
  for (let i = 1; i < energyLevels.length; i++) {
    energyDiffs += Math.abs(energyLevels[i] - energyLevels[i-1]);
  }
  
  // Normalized to 0-1 scale
  const energyBalance = energyDiffs > 0 && energyDiffs < bitModels.length ? 
    0.7 + (0.3 * (1 - (Math.abs(energyDiffs - bitModels.length/2) / (bitModels.length/2)))) : 
    0.5;
  
  // Assess technique variety
  const techniques = new Set(bitModels.map(bit => bit.analysis.primary_technique));
  const techniqueVariety = Math.min(1, techniques.size / 3); // Normalize to 0-1 scale

  // Assess flow
  const vulnerabilityProgression = bitModels.every((bit, i, arr) => {
    if (i === 0) return true;
    // Check if vulnerability increases or stays the same
    const vulnMap = { 'low': 0, 'moderate': 1, 'high': 2 };
    const currVuln = vulnMap[bit.analysis.vulnerability_level] || 0;
    const prevVuln = vulnMap[arr[i-1].analysis.vulnerability_level] || 0;
    return currVuln >= prevVuln;
  });
  
  const flowAssessment = vulnerabilityProgression ? 0.8 : 0.6;

  // Generate improvement suggestions
  const improvements = [];

  if (energyBalance < 0.6) {
    improvements.push("Improve energy variation between bits");
  }

  if (techniqueVariety < 0.5) {
    improvements.push("Add more variety in bit techniques");
  }

  if (!vulnerabilityProgression) {
    improvements.push("Consider reordering bits for smoother vulnerability progression");
  }

  if (bitModels.length < 3) {
    improvements.push("Consider adding more bits for a more complete set");
  } else if (bitModels.length > 8) {
    improvements.push("Consider splitting into multiple sets for better focus");
  }

  if (improvements.length === 0) {
    improvements.push("This set has good structure and balance");
  }

  return {
    flow_assessment: flowAssessment,
    energy_balance: energyBalance,
    technique_variety: techniqueVariety,
    improvements
  };
};

// Main function to group jokes into bits and sets
const groupJokesIntoBitsAndSets = async () => {
  try {
    // Get processed joke data or process it if needed
    let processed;
    try {
      // Try to read processed data
      const jokesPath = path.join(__dirname, '../data/processed/jokes.json');
      const jokesGroupedPath = path.join(__dirname, '../data/processed/jokes_by_bit.json');
      
      const jokesData = await fs.readFile(jokesPath, 'utf8');
      const groupedData = await fs.readFile(jokesGroupedPath, 'utf8');
      
      processed = {
        processedJokes: JSON.parse(jokesData),
        jokesGroupedByBit: JSON.parse(groupedData)
      };
      
      console.log('Using existing processed joke data');
    } catch (err) {
      // Process the data if files don't exist
      console.log('Processing raw joke data...');
      processed = await processJokeData();
    }
    
    const { processedJokes, jokesGroupedByBit } = processed;
    
    // Create output directory
    const outputPath = path.join(__dirname, '../data/processed');
    try {
      await fs.mkdir(outputPath, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
    
    // Convert jokes to joke models for analysis
    const jokeModels = processedJokes.map(joke => new Joke(joke));
    
    // Create bits
    const bits = [];
    
    for (const [bitIndexStr, bitData] of Object.entries(jokesGroupedByBit)) {
      const bitIndex = parseInt(bitIndexStr, 10);
      const bitTitle = bitData.title;
      const bitJokes = bitData.jokes;
      
      // Skip if no jokes
      if (!bitJokes || bitJokes.length === 0) continue;
      
      // Get joke IDs
      const jokeIds = bitJokes.map(joke => joke.id);
      
      // Get joke models for analysis
      const jokeModelsForBit = jokeIds.map(id => 
        jokeModels.find(model => model.id === id)
      ).filter(Boolean);
      
      // Analyze the bit
      const bitAnalysis = analyzeBit(jokeModelsForBit);
      
      // Generate feedback
      const bitFeedback = generateBitFeedback(jokeModelsForBit, bitAnalysis);
      
      // Create bit model
      const bit = new Bit({
        id: `bit_chewed_up_${bitIndex}`,
        title: bitTitle,
        description: `Bit about ${bitTitle.toLowerCase()}`,
        joke_ids: jokeIds,
        segues: Array(jokeIds.length - 1).fill(''), // Empty segues
        metadata: {
          creation_date: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          performance_count: 1,
          duration_seconds: jokeModelsForBit.reduce(
            (sum, joke) => sum + (joke.metadata.duration_seconds || 5), 
            0
          ),
          source: {
            special_name: 'Chewed Up',
            bit_index: bitIndex
          }
        },
        analysis: bitAnalysis,
        creative_feedback: bitFeedback
      });
      
      bits.push(bit);
    }
    
    // Save bits
    await fs.writeFile(
      path.join(outputPath, 'bits.json'),
      JSON.stringify(bits.map(bit => bit.toJSON()), null, 2)
    );
    
    // Create set
    const setModel = new Set({
      id: 'set_chewed_up_complete',
      title: 'Chewed Up',
      description: 'Louis C.K. 2008 comedy special',
      bit_ids: bits.map(bit => bit.id),
      transitions: Array(bits.length - 1).fill(''), // Empty transitions
      metadata: {
        creation_date: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        venues_performed: ['Beacon Theater'],
        duration_minutes: Math.ceil(
          bits.reduce(
            (sum, bit) => sum + (bit.metadata.duration_seconds || 0), 
            0
          ) / 60
        )
      },
      analysis: analyzeSet(bits),
      creative_feedback: generateSetFeedback(bits, {})
    });
    
    // Save set
    await fs.writeFile(
      path.join(outputPath, 'sets.json'),
      JSON.stringify([setModel.toJSON()], null, 2)
    );
    
    // Create special
    const specialModel = new Special({
      id: 'special_chewed_up',
      title: 'Chewed Up',
      description: 'Louis C.K. 2008 comedy special exploring personal frustrations and social observations',
      set_ids: [setModel.id],
      metadata: {
        creation_date: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        status: 'released',
        target_duration_minutes: 60
      },
      thematic_elements: {
        primary_theme: 'personal_frustration',
        secondary_themes: ['parenting', 'aging', 'relationships', 'social_taboos'],
        throughlines: [
          {
            concept: 'honesty',
            manifestations: ['self_criticism', 'social_commentary', 'taboo_language']
          }
        ]
      },
      production_elements: {
        opening_style: 'direct_address',
        closing_style: 'callback_to_opening',
        staging_notes: 'Black t-shirt, minimal staging, spotlight',
        tone_shifts: [
          {position: 0.0, tone: 'self_deprecating'},
          {position: 0.3, tone: 'observational'},
          {position: 0.6, tone: 'confessional'},
          {position: 0.9, tone: 'philosophical'}
        ]
      }
    });
    
    // Save special
    await fs.writeFile(
      path.join(outputPath, 'specials.json'),
      JSON.stringify([specialModel.toJSON()], null, 2)
    );
    
    console.log(`Created ${bits.length} bits, 1 set, and 1 special`);
    return { bits, set: setModel, special: specialModel };
  } catch (error) {
    console.error('Error grouping jokes into bits and sets:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  groupJokesIntoBitsAndSets()
    .then(() => console.log('Bit and set grouping complete'))
    .catch(err => console.error('Bit and set grouping failed:', err));
}

module.exports = { groupJokesIntoBitsAndSets };