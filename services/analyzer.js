/**
 * Comedy Analyzer Service
 * 
 * Provides analysis functions for jokes, bits, sets, and specials using the primary
 * categorization system (Analysis Engine) and the more nuanced feedback system (Creative Assistant).
 */

// Load technique definitions
const fs = require('fs').promises;
const path = require('path');

// Cached technique data
let techniqueData = {
  jokeCategories: null,
  bitCategories: null,
  setCategories: null,
  specialCategories: null
};

// Load technique categories
const loadTechniqueCategories = async () => {
  if (techniqueData.jokeCategories) return techniqueData;
  
  try {
    const jokeDataPath = path.join(__dirname, '../data/reference/techniques/level1_techniques.json');
    const bitDataPath = path.join(__dirname, '../data/reference/techniques/level2_techniques.json');
    const setDataPath = path.join(__dirname, '../data/reference/techniques/level3_techniques.json');
    const specialDataPath = path.join(__dirname, '../data/reference/techniques/level4_techniques.json');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(path.join(__dirname, '../data/reference/techniques'), { recursive: true });
    } catch (err) {
      // Directory already exists
    }
    
    // Check if files exist, if not, create with default data
    try {
      const jokeData = await fs.readFile(jokeDataPath, 'utf8');
      techniqueData.jokeCategories = JSON.parse(jokeData);
    } catch (err) {
      // Create default joke techniques
      techniqueData.jokeCategories = {
        joke_techniques: [
          "setup_subversion",
          "observational_deconstruction", 
          "hyperbole_escalation",
          "unexpected_specificity",
          "self_deprecation",
          "status_play",
          "analogy_comparison",
          "callback_pattern",
          "act_out_embodiment",
          "logical_fallacy",
          "shock_taboo",
          "wordplay_linguistic"
        ]
      };
      
      await fs.writeFile(jokeDataPath, JSON.stringify(techniqueData.jokeCategories, null, 2));
    }
    
    // Same for bits
    try {
      const bitData = await fs.readFile(bitDataPath, 'utf8');
      techniqueData.bitCategories = JSON.parse(bitData);
    } catch (err) {
      techniqueData.bitCategories = {
        bit_techniques: [
          "universal_premise",
          "emotional_analogy",
          "acknowledging_gravity",
          "emotional_truth",
          "gradual_self_reveal",
          "breaking_sentiment",
          "self_awareness_paradox",
          "logical_escalation",
          "anthropological_observation",
          "vulnerability_performance"
        ]
      };
      
      await fs.writeFile(bitDataPath, JSON.stringify(techniqueData.bitCategories, null, 2));
    }
    
    // Same for sets
    try {
      const setData = await fs.readFile(setDataPath, 'utf8');
      techniqueData.setCategories = JSON.parse(setData);
    } catch (err) {
      techniqueData.setCategories = {
        set_techniques: [
          "strategic_opener",
          "energy_mapping",
          "thematic_threading",
          "vulnerability_progression",
          "callback_architecture",
          "trust_calibration",
          "tension_release_cycle",
          "seamless_transition",
          "perspective_hierarchy",
          "opening_closing_symmetry"
        ]
      };
      
      await fs.writeFile(setDataPath, JSON.stringify(techniqueData.setCategories, null, 2));
    }
    
    // Same for specials
    try {
      const specialData = await fs.readFile(specialDataPath, 'utf8');
      techniqueData.specialCategories = JSON.parse(specialData);
    } catch (err) {
      techniqueData.specialCategories = {
        special_techniques: [
          "thematic_throughline",
          "narrative_arc",
          "tonal_orchestration",
          "identity_evolution",
          "controversy_management",
          "theatrical_integration",
          "audience_relationship",
          "conceptual_scaffolding",
          "premise_transformation",
          "emotional_punctuation"
        ]
      };
      
      await fs.writeFile(specialDataPath, JSON.stringify(techniqueData.specialCategories, null, 2));
    }
    
    return techniqueData;
  } catch (error) {
    console.error('Error loading technique categories:', error);
    throw error;
  }
};

// Analysis Engine - Primary categorization

/**
 * Analyze a joke to determine its primary technique
 * This is the core classification functionality of the Analysis Engine
 */
const analyzeJokeTechnique = async (jokeText, laughData = null) => {
  // Ensure technique data is loaded
  await loadTechniqueCategories();
  
  // Initialize score tracker
  const scores = {};
  techniqueData.jokeCategories.joke_techniques.forEach(technique => {
    scores[technique] = 0;
  });
  
  // Text analysis patterns
  const patterns = {
    setup_subversion: {
      regex: /\b(but|however|actually|surprisingly|turns out|except)\b/i,
      signals: ['?', '!', '...'],
      points: 1
    },
    observational_deconstruction: {
      regex: /\b(why|what if|ever notice|ever think about|you know how|we all|people always)\b/i,
      signals: ['?'],
      points: 1
    },
    hyperbole_escalation: {
      regex: /\b(all|every|always|never|nobody|everybody|forever|completely|worst|best)\b/i,
      signals: ['!'],
      points: 1
    },
    unexpected_specificity: {
      regex: /\d+/,
      signals: [','],
      points: 1
    },
    self_deprecation: {
      regex: /\b(i'?m|i am|i was|my)\b.*\b(stupid|dumb|fat|ugly|idiot|fool|mess|failure|bad)\b/i,
      signals: [],
      points: 1
    },
    status_play: {
      regex: /\b(rich|poor|boss|employee|king|peasant|high|low|better than|worse than)\b/i,
      signals: [],
      points: 1
    },
    analogy_comparison: {
      regex: /\b(like|as|compared to|similar to)\b/i,
      signals: [],
      points: 1
    },
    callback_pattern: {
      // Hard to detect without context, would need reference to other jokes
      regex: /\b(remember|earlier|before|mentioned|talking about)\b/i,
      signals: [],
      points: 1
    },
    act_out_embodiment: {
      regex: /[*\[\(]/,  // Markers like *, [, or ( often indicate an act out
      signals: [],
      points: 1
    },
    logical_fallacy: {
      regex: /\b(because|therefore|so|thus|hence|if|then)\b/i,
      signals: [],
      points: 1
    },
    shock_taboo: {
      regex: /\b(sex|fuck|shit|ass|dick|pussy|gay|nigger|faggot|retard|kill|die|death|murder)\b/i,
      signals: ['!'],
      points: 1
    },
    wordplay_linguistic: {
      // Look for word repetition with slight variations
      regex: /\b(\w+)[^\.\?\!]+ \1\b/i,
      signals: [],
      points: 1
    }
  };
  
  // Apply each pattern
  Object.entries(patterns).forEach(([technique, pattern]) => {
    // Check regex patterns
    if (pattern.regex.test(jokeText)) {
      scores[technique] += pattern.points;
    }
    
    // Check signal markers
    pattern.signals.forEach(signal => {
      if (jokeText.includes(signal)) {
        scores[technique] += 0.5;
      }
    });
  });
  
  // Special case handling
  
  // Short jokes (less than 10 words) are often wordplay
  if (jokeText.split(/\s+/).length < 10) {
    scores.wordplay_linguistic += 0.7;
  }
  
  // Jokes with lots of personal pronouns are often self-deprecation
  const personalPronounCount = (jokeText.match(/\b(i|me|my|mine|myself)\b/gi) || []).length;
  if (personalPronounCount > 2) {
    scores.self_deprecation += 0.8;
  }
  
  // Jokes with contrast words are often setup_subversion
  if (/\b(but|however|instead|although|though)\b/i.test(jokeText)) {
    scores.setup_subversion += 0.9;
  }
  
  // Incorporate laugh data if available
  if (laughData && laughData.duration) {
    // Longer laughs often indicate shock_taboo or hyperbole_escalation
    if (laughData.duration > 3) {
      scores.shock_taboo += 0.7;
      scores.hyperbole_escalation += 0.6;
    }
  }
  
  // Find the highest scoring technique
  let highestScore = 0;
  let primaryTechnique = 'setup_subversion'; // Default
  
  Object.entries(scores).forEach(([technique, score]) => {
    if (score > highestScore) {
      highestScore = score;
      primaryTechnique = technique;
    }
  });
  
  // Calculate confidence scores for top techniques
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const techniques = Object.entries(scores)
    .map(([technique, score]) => ({
      name: technique,
      confidence: totalScore > 0 ? score / totalScore : 0
    }))
    .filter(t => t.confidence > 0.1) // Only include techniques with some confidence
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  
  return {
    primary_technique: primaryTechnique,
    techniques: techniques.slice(0, 3) // Top 3 techniques
  };
};

/**
 * Analyze a joke's structure (setup/punchline split)
 */
const analyzeJokeStructure = (jokeText) => {
  // Simple approach - more sophisticated would use NLP
  
  // Common punchline indicators
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

/**
 * Analyze a joke's word economy
 */
const analyzeWordEconomy = (jokeText) => {
  // Words commonly considered filler
  const fillerWords = ['the', 'a', 'an', 'and', 'but', 'or', 'so', 'very', 'really', 'just', 'like', 'um', 'uh'];
  
  // Split into words and clean
  const words = jokeText.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 0); // Remove empty strings
  
  const totalWords = words.length;
  if (totalWords === 0) return 1; // Empty joke (shouldn't happen)
  
  // Count filler words
  const fillerCount = words.filter(word => fillerWords.includes(word)).length;
  
  // Calculate economy score
  return Math.max(0, Math.min(1, 1 - (fillerCount / totalWords)));
};

/**
 * Analyze a bit to determine its primary technique and emotional content
 */
const analyzeBitTechnique = async (bitTitle, jokeTexts, jokeTechniques) => {
  // Ensure technique data is loaded
  await loadTechniqueCategories();
  
  // Initialize score tracker
  const scores = {};
  techniqueData.bitCategories.bit_techniques.forEach(technique => {
    scores[technique] = 0;
  });
  
  // All text combined for pattern matching
  const allText = jokeTexts.join(' ').toLowerCase();
  
  // Detect technique based on patterns
  const patterns = {
    universal_premise: {
      // Universal premises often discuss common experiences
      regex: /\b(everyone|everybody|we all|people|you know how|always|never)\b/i,
      signals: ['?'],
      points: 1
    },
    emotional_analogy: {
      // Analogies make emotional comparisons
      regex: /\b(like|as if|feels like|similar to|compared to)\b/i,
      signals: [],
      points: 1
    },
    acknowledging_gravity: {
      // Serious topics acknowledged before humor
      regex: /\b(serious|real|honestly|truth|tragedy|sad|painful|difficult)\b/i,
      signals: [],
      points: 1
    },
    emotional_truth: {
      // Raw emotional honesty
      regex: /\b(feel|felt|feeling|emotion|heart|soul|deep|inside|truth)\b/i,
      signals: [],
      points: 1
    },
    gradual_self_reveal: {
      // Personal revelations
      regex: /\b(confession|admit|confess|tell you|secret|private|personal)\b/i,
      signals: [],
      points: 1
    },
    breaking_sentiment: {
      // Preventing sentimental moments
      regex: /\b(actually|anyway|but then|turns out|plot twist)\b/i,
      signals: [],
      points: 1
    },
    self_awareness_paradox: {
      // Self-aware commentary
      regex: /\b(realize|aware|conscious|know myself|self|aware)\b/i,
      signals: [],
      points: 1
    },
    logical_escalation: {
      // Building absurdity logically
      regex: /\b(therefore|so|thus|which means|leads to|eventually|finally)\b/i,
      signals: [],
      points: 1
    },
    anthropological_observation: {
      // Social observation from distance
      regex: /\b(society|culture|humans|species|civilization|social|observe)\b/i,
      signals: [],
      points: 1
    },
    vulnerability_performance: {
      // Performing vulnerability
      regex: /\b(embarrassing|ashamed|humiliating|awkward|vulnerable|exposed)\b/i,
      signals: [],
      points: 1
    }
  };
  
  // Apply each pattern
  Object.entries(patterns).forEach(([technique, pattern]) => {
    // Check regex patterns
    if (pattern.regex.test(allText)) {
      scores[technique] += pattern.points;
    }
    
    // Check signal markers
    pattern.signals.forEach(signal => {
      if (allText.includes(signal)) {
        scores[technique] += 0.5;
      }
    });
  });
  
  // Map joke techniques to bit techniques
  const techniqueMapping = {
    'setup_subversion': 'breaking_sentiment',
    'observational_deconstruction': 'universal_premise',
    'hyperbole_escalation': 'logical_escalation',
    'self_deprecation': 'vulnerability_performance',
    'status_play': 'anthropological_observation',
    'analogy_comparison': 'emotional_analogy',
    'act_out_embodiment': 'vulnerability_performance',
    'logical_fallacy': 'logical_escalation',
    'shock_taboo': 'breaking_sentiment',
    'wordplay_linguistic': 'breaking_sentiment'
  };
  
  // Incorporate joke techniques
  (jokeTechniques || []).forEach(technique => {
    const mappedTechnique = techniqueMapping[technique] || 'universal_premise';
    scores[mappedTechnique] += 0.8;
  });
  
  // Check bit title for clues
  const titleLower = bitTitle.toLowerCase();
  
  // Personal topics often involve vulnerability
  if (/\b(my|i|me|mine|myself|personal)\b/i.test(titleLower)) {
    scores.vulnerability_performance += 0.9;
    scores.gradual_self_reveal += 0.7;
  }
  
  // Social topics often involve anthropological observation
  if (/\b(people|society|culture|they|them|those|these)\b/i.test(titleLower)) {
    scores.anthropological_observation += 0.9;
    scores.universal_premise += 0.7;
  }
  
  // Find the highest scoring technique
  let highestScore = 0;
  let primaryTechnique = 'universal_premise'; // Default
  
  Object.entries(scores).forEach(([technique, score]) => {
    if (score > highestScore) {
      highestScore = score;
      primaryTechnique = technique;
    }
  });
  
  // Calculate confidence scores for top techniques
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const techniques = Object.entries(scores)
    .map(([technique, score]) => ({
      name: technique,
      confidence: totalScore > 0 ? score / totalScore : 0
    }))
    .filter(t => t.confidence > 0.1) // Only include techniques with some confidence
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  
  // Detect emotional core
  const emotionPatterns = {
    'anger': /\b(angry|mad|rage|furious|hate|pissed|fuck|shit|damn)\b/i,
    'joy': /\b(happy|joy|love|great|good|wonderful|awesome|amazing)\b/i,
    'fear': /\b(scared|afraid|terrified|worried|anxious|fear|fright)\b/i,
    'sadness': /\b(sad|depressed|upset|miserable|grief|disappointed)\b/i,
    'disgust': /\b(disgusting|gross|revolting|nasty|sick|eww|ugh)\b/i,
    'surprise': /\b(surprised|shocked|amazed|astonished|unexpected|wow)\b/i,
    'confusion': /\b(confused|puzzled|weird|strange|odd|what)\b/i,
    'frustration': /\b(frustrating|annoying|irritating|bothers|pisses|annoyed)\b/i
  };
  
  let emotionalCore = 'neutral';
  let maxEmotionMatches = 0;
  
  Object.entries(emotionPatterns).forEach(([emotion, pattern]) => {
    const matches = (allText.match(pattern) || []).length;
    if (matches > maxEmotionMatches) {
      maxEmotionMatches = matches;
      emotionalCore = emotion;
    }
  });
  
  // Detect vulnerability level
  const personalKeywords = /\b(i|me|my|mine|myself)\b/gi;
  const confessionalKeywords = /\b(admit|confess|secret|truth|honest|really|actually)\b/gi;
  const tabooKeywords = /\b(sex|relationship|marriage|divorce|doctor|therapy|depression|addiction)\b/gi;
  
  const personalCount = (allText.match(personalKeywords) || []).length;
  const confessionalCount = (allText.match(confessionalKeywords) || []).length;
  const tabooCount = (allText.match(tabooKeywords) || []).length;
  
  let vulnerabilityLevel = 'low';
  const vulnerabilityScore = (personalCount * 0.5) + (confessionalCount * 1) + (tabooCount * 1.5);
  
  if (vulnerabilityScore > 10) {
    vulnerabilityLevel = 'high';
  } else if (vulnerabilityScore > 5) {
    vulnerabilityLevel = 'moderate';
  }
  
  // Determine energy profile
  const highEnergyKeywords = /[!?]|\b(fuck|shit|damn|crazy|insane|amazing|wow|oh my god|omg)\b/gi;
  const highEnergyCount = (allText.match(highEnergyKeywords) || []).length;
  
  let energyProfile = 'medium';
  if (highEnergyCount > jokeTexts.length * 1.5) {
    energyProfile = 'high';
  } else if (highEnergyCount < jokeTexts.length * 0.5) {
    energyProfile = 'low';
  }
  
  return {
    primary_technique: primaryTechnique,
    techniques: techniques.slice(0, 3), // Top 3 techniques
    emotional_core: emotionalCore,
    vulnerability_level: vulnerabilityLevel,
    energy_profile: energyProfile,
    audience_journey: ['recognition', emotionalCore, 'insight'] // Simplified journey
  };
};

/**
 * Analyze a set to determine its primary technique and structural elements
 */
const analyzeSetTechnique = async (setTitle, bitAnalyses) => {
  // Ensure technique data is loaded
  await loadTechniqueCategories();
  
  // Initialize score tracker
  const scores = {};
  techniqueData.setCategories.set_techniques.forEach(technique => {
    scores[technique] = 0;
  });
  
  // Skip if no bits
  if (!bitAnalyses || bitAnalyses.length === 0) {
    return {
      primary_technique: 'thematic_threading',
      techniques: [{ name: 'thematic_threading', confidence: 1 }],
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
  
  // Check for specific structural patterns
  
  // Energy mapping - check for deliberate energy variation
  const energyMapping = bitAnalyses.map((bitAnalysis, index) => {
    return {
      position: index / (bitAnalyses.length - 1 || 1),
      level: bitAnalysis.energy_profile || 'medium'
    };
  });
  
  // Check energy variation - good sets usually have energy variation
  const energyLevels = energyMapping.map(em => em.level);
  let energyChanges = 0;
  for (let i = 1; i < energyLevels.length; i++) {
    if (energyLevels[i] !== energyLevels[i-1]) {
      energyChanges++;
    }
  }
  
  if (energyChanges >= bitAnalyses.length / 2) {
    scores.energy_mapping += 2;
  }
  
  // Check for strong opener
  if (bitAnalyses.length > 0 && bitAnalyses[0].energy_profile === 'high') {
    scores.strategic_opener += 2;
  }
  
  // Check for vulnerability progression
  const vulnerabilityLevels = bitAnalyses.map(ba => {
    if (ba.vulnerability_level === 'high') return 2;
    if (ba.vulnerability_level === 'moderate') return 1;
    return 0;
  });
  
  let vulnerabilityIncreases = 0;
  for (let i = 1; i < vulnerabilityLevels.length; i++) {
    if (vulnerabilityLevels[i] > vulnerabilityLevels[i-1]) {
      vulnerabilityIncreases++;
    }
  }
  
  if (vulnerabilityIncreases >= bitAnalyses.length / 3) {
    scores.vulnerability_progression += 2;
  }
  
  // Check for opening-closing symmetry
  if (bitAnalyses.length >= 2) {
    const firstBit = bitAnalyses[0];
    const lastBit = bitAnalyses[bitAnalyses.length - 1];
    
    // Check for similar energy levels
    if (firstBit.energy_profile === lastBit.energy_profile) {
      scores.opening_closing_symmetry += 1;
    }
    
    // Check for similar emotional cores
    if (firstBit.emotional_core === lastBit.emotional_core) {
      scores.opening_closing_symmetry += 1;
    }
    
    // Check for similar techniques
    if (firstBit.primary_technique === lastBit.primary_technique) {
      scores.opening_closing_symmetry += 1;
    }
  }
  
  // Check for thematic threading
  const emotionalCores = new Set(bitAnalyses.map(ba => ba.emotional_core));
  if (emotionalCores.size <= bitAnalyses.length / 2) {
    // Fewer unique emotions suggests thematic consistency
    scores.thematic_threading += 1.5;
  }
  
  // Most sets use thematic threading
  scores.thematic_threading += 1;
  
  // Find the highest scoring technique
  let highestScore = 0;
  let primaryTechnique = 'thematic_threading'; // Default
  
  Object.entries(scores).forEach(([technique, score]) => {
    if (score > highestScore) {
      highestScore = score;
      primaryTechnique = technique;
    }
  });
  
  // Calculate confidence scores for top techniques
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const techniques = Object.entries(scores)
    .map(([technique, score]) => ({
      name: technique,
      confidence: totalScore > 0 ? score / totalScore : 0
    }))
    .filter(t => t.confidence > 0.1) // Only include techniques with some confidence
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  
  // Audience journey
  const openingEmotion = bitAnalyses.length > 0 ? bitAnalyses[0].emotional_core : 'curiosity';
  const closingEmotion = bitAnalyses.length > 0 ? 
    bitAnalyses[bitAnalyses.length - 1].emotional_core : 'satisfaction';
  
  // Find peak emotion - usually the most intense emotion
  const emotionIntensity = {
    'anger': 8,
    'joy': 7,
    'fear': 8,
    'sadness': 6,
    'disgust': 7,
    'surprise': 9,
    'confusion': 5,
    'frustration': 7,
    'neutral': 3
  };
  
  let peakEmotion = 'recognition';
  let maxIntensity = 0;
  
  bitAnalyses.forEach(ba => {
    const emotion = ba.emotional_core;
    const intensity = emotionIntensity[emotion] || 0;
    if (intensity > maxIntensity) {
      maxIntensity = intensity;
      peakEmotion = emotion;
    }
  });
  
  // Venue compatibility based on content
  // Check for explicit content and complexity
  const vulnerabilityCount = bitAnalyses.filter(ba => ba.vulnerability_level === 'high').length;
  const tabooEmotions = bitAnalyses.filter(ba => 
    ['anger', 'disgust', 'fear'].includes(ba.emotional_core)
  ).length;
  
  const clubCompatibility = 0.7 + (tabooEmotions / bitAnalyses.length) * 0.3;
  const corporateCompatibility = 0.9 - (tabooEmotions / bitAnalyses.length) * 0.6 - (vulnerabilityCount / bitAnalyses.length) * 0.3;
  const theaterCompatibility = 0.6 + (vulnerabilityCount / bitAnalyses.length) * 0.4;
  
  return {
    primary_technique: primaryTechnique,
    techniques: techniques.slice(0, 3), // Top 3 techniques
    energy_mapping: energyMapping,
    callback_opportunities: [], // Would require more sophisticated analysis
    audience_journey: {
      opening_emotion: openingEmotion,
      peak_emotion: peakEmotion,
      closing_emotion: closingEmotion
    },
    venue_compatibility: {
      club: Math.max(0, Math.min(1, clubCompatibility)),
      corporate: Math.max(0, Math.min(1, corporateCompatibility)),
      theater: Math.max(0, Math.min(1, theaterCompatibility))
    }
  };
};

// Creative Assistant - Detailed feedback generation

/**
 * Generate detailed feedback for a joke
 */
const generateJokeFeedback = (jokeText, jokeAnalysis) => {
  const strengths = [];
  const improvements = [];
  const suggestions = [];
  
  // Analyze based on primary technique
  const technique = jokeAnalysis.primary_technique;
  
  // Check word economy
  const economy = jokeAnalysis.metrics?.word_economy || 0.5;
  if (economy > 0.8) {
    strengths.push("Excellent word economy");
  } else if (economy < 0.6) {
    improvements.push("Could be more concise");
    
    // Suggest removing filler words
    const fillerWords = ['just', 'very', 'really', 'actually', 'basically', 'literally'];
    let hasFiller = false;
    fillerWords.forEach(word => {
      if (jokeText.toLowerCase().includes(` ${word} `)) {
        hasFiller = true;
      }
    });
    
    if (hasFiller) {
      suggestions.push("Consider removing filler words like 'just', 'very', 'really'");
    }
  }
  
  // Check joke structure
  const structure = jokeAnalysis.structure || {};
  if (structure.setup && structure.punchline) {
    // Good - has distinct setup and punchline
    if (structure.setup.length > structure.punchline.length * 3) {
      improvements.push("Setup might be too long compared to punchline");
      suggestions.push("Try tightening the setup to create more impact");
    } else if (structure.punchline.length > structure.setup.length) {
      improvements.push("Punchline might be unnecessarily long");
      suggestions.push("Consider making the punchline more concise for greater impact");
    } else {
      strengths.push("Good setup-to-punchline balance");
    }
  } else if (!structure.punchline) {
    improvements.push("Missing clear punchline");
    suggestions.push("Try adding a more distinct punchline to create a clearer payoff");
  }
  
  // Technique-specific feedback
  switch (technique) {
    case 'setup_subversion':
      strengths.push("Effectively creates and subverts expectations");
      
      if (!jokeText.includes(' but ') && !jokeText.includes('. ')) {
        improvements.push("Subversion could be more distinct");
        suggestions.push("Consider using clearer setup/twist structure with a strong pivot");
      }
      break;
      
    case 'observational_deconstruction':
      strengths.push("Strong observational insight");
      
      if (!jokeText.includes('?')) {
        suggestions.push("Consider using a questioning format to highlight the observation");
      }
      break;
      
    case 'hyperbole_escalation':
      strengths.push("Effective use of exaggeration");
      
      if (jokeText.split(/\s+/).length < 15) {
        suggestions.push("Consider building more escalation before the final punchline");
      }
      break;
      
    case 'self_deprecation':
      strengths.push("Authentic self-deprecating perspective");
      
      if (!jokeText.toLowerCase().includes('i') && !jokeText.toLowerCase().includes('my')) {
        improvements.push("Could more clearly establish personal perspective");
      }
      break;
      
    case 'analogy_comparison':
      strengths.push("Creative comparison/analogy");
      
      if (!jokeText.includes('like') && !jokeText.includes(' as ')) {
        improvements.push("Analogy could be more explicit");
        suggestions.push("Consider using 'like' or 'as' to strengthen the comparison");
      }
      break;
      
    case 'wordplay_linguistic':
      strengths.push("Clever wordplay");
      
      // Check for repeated words
      const words = jokeText.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      
      if (uniqueWords.size === words.length) {
        improvements.push("Could strengthen the wordplay");
        suggestions.push("Consider repeating key words with different meanings for stronger wordplay");
      }
      break;
      
    // Add more technique-specific feedback as needed
  }
  
  // Check for unexplored potential
  const otherHighConfidenceTechniques = (jokeAnalysis.techniques || [])
    .filter(t => t.name !== technique && t.confidence > 0.3)
    .map(t => t.name);
  
  if (otherHighConfidenceTechniques.length > 0) {
    suggestions.push(`This joke shows potential for ${otherHighConfidenceTechniques.join(', ')} techniques that could be explored further`);
  }
  
  return {
    strengths,
    improvement_areas: improvements,
    suggestions
  };
};

/**
 * Generate detailed feedback for a bit
 */
const generateBitFeedback = (bitTitle, jokeTexts, bitAnalysis) => {
  // Default values
  let emotionalTruth = 0.5;
  let bitCohesion = 0.5;
  const improvements = [];
  
  // Skip if no jokes
  if (!jokeTexts || jokeTexts.length === 0) {
    return {
      emotional_truth: emotionalTruth,
      bit_cohesion: bitCohesion,
      improvements: ["Add jokes to this bit"]
    };
  }
  
  // Analyze emotional truth based on vulnerability and consistency
  if (bitAnalysis.vulnerability_level === 'high') {
    emotionalTruth = 0.8;
    improvements.push("Strong emotional vulnerability - maintain this authenticity");
  } else if (bitAnalysis.vulnerability_level === 'moderate') {
    emotionalTruth = 0.6;
    improvements.push("Consider deepening the emotional vulnerability for greater impact");
  } else {
    emotionalTruth = 0.4;
    improvements.push("This bit could benefit from more emotional vulnerability and personal perspective");
  }
  
  // Analyze joke consistency and thematic cohesion
  const allText = jokeTexts.join(' ').toLowerCase();
  
  // Check for consistent theme
  const bitWords = bitTitle.toLowerCase().split(/\s+/);
  let themeConsistency = 0;
  
  bitWords.forEach(word => {
    if (word.length > 3) { // Skip short words
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = (allText.match(regex) || []).length;
      themeConsistency += matches;
    }
  });
  
  if (themeConsistency > jokeTexts.length) {
    bitCohesion = 0.8;
    improvements.push("Strong thematic cohesion - jokes connect well to the central premise");
  } else if (themeConsistency > jokeTexts.length / 2) {
    bitCohesion = 0.6;
    improvements.push("Consider tightening the connection between jokes and the main premise");
  } else {
    bitCohesion = 0.4;
    improvements.push("Jokes could be more clearly connected to a central theme or premise");
  }
  
  // Check for logical progression (beginning, middle, end)
  if (jokeTexts.length >= 3) {
    // Check if vulnerability or intensity increases
    const intensityProgression = bitAnalysis.audience_journey && 
      bitAnalysis.audience_journey.length > 2 &&
      bitAnalysis.audience_journey[0] !== bitAnalysis.audience_journey[bitAnalysis.audience_journey.length - 1];
      
    if (!intensityProgression) {
      improvements.push("Consider creating a clearer emotional arc from beginning to end");
    }
  }
  
  // Technique-specific feedback
  switch (bitAnalysis.primary_technique) {
    case 'universal_premise':
      if (jokeTexts.length > 0 && !jokeTexts[0].toLowerCase().includes('you know') && 
          !jokeTexts[0].toLowerCase().includes('ever')) {
        improvements.push("Consider establishing the universal premise more clearly at the beginning");
      }
      break;
      
    case 'emotional_analogy':
      if (!allText.includes('like') && !allText.includes(' as ')) {
        improvements.push("The emotional analogy could be strengthened with more explicit comparisons");
      }
      break;
      
    case 'logical_escalation':
      if (jokeTexts.length >= 3) {
        // Check if there's clear escalation
        const shouldHaveProgression = true; // Simplified check
        
        if (!shouldHaveProgression) {
          improvements.push("The logical escalation could be stronger - consider increasing absurdity systematically");
        }
      }
      break;
      
    // Add other technique-specific feedback as needed
  }
  
  // Add more improvements if needed
  if (improvements.length < 2) {
    if (jokeTexts.length < 3) {
      improvements.push("Consider adding more jokes to develop the premise more fully");
    } else if (jokeTexts.length > 8) {
      improvements.push("Consider tightening the bit by removing weaker jokes");
    }
  }
  
  return {
    emotional_truth: emotionalTruth,
    bit_cohesion: bitCohesion,
    improvements
  };
};

/**
 * Generate detailed feedback for a set
 */
const generateSetFeedback = (setTitle, bitTitles, setAnalysis) => {
  // Default values
  let flowAssessment = 0.5;
  let energyBalance = 0.5;
  let techniqueVariety = 0.5;
  const improvements = [];
  
  // Skip if no bits
  if (!bitTitles || bitTitles.length === 0) {
    return {
      flow_assessment: flowAssessment,
      energy_balance: energyBalance,
      technique_variety: techniqueVariety,
      improvements: ["Add bits to this set"]
    };
  }
  
  // Analyze flow based on energy mapping
  const energyMapping = setAnalysis.energy_mapping || [];
  if (energyMapping.length >= 2) {
    let energyChanges = 0;
    for (let i = 1; i < energyMapping.length; i++) {
      if (energyMapping[i].level !== energyMapping[i-1].level) {
        energyChanges++;
      }
    }
    
    // Good flow has some changes but not too chaotic
    if (energyChanges === 0) {
      flowAssessment = 0.4;
      improvements.push("Consider varying energy levels more throughout the set");
    } else if (energyChanges > energyMapping.length * 0.7) {
      flowAssessment = 0.5;
      improvements.push("Energy changes may be too frequent - consider longer sequences at consistent energy");
    } else {
      flowAssessment = 0.8;
      improvements.push("Good energy flow through the set");
    }
    
    // Check for strong opener and closer
    if (energyMapping[0].level !== 'high') {
      improvements.push("Consider a higher energy opener to engage the audience immediately");
    }
    
    if (energyMapping[energyMapping.length - 1].level === 'low') {
      improvements.push("The closing bit could have more energy for a stronger finish");
    }
  }
  
  // Analyze energy balance
  const energyCounts = {
    'high': 0,
    'medium': 0,
    'low': 0
  };
  
  energyMapping.forEach(em => {
    energyCounts[em.level] = (energyCounts[em.level] || 0) + 1;
  });
  
  // Calculate energy balance - good balance has a mix
  const totalBits = energyMapping.length;
  if (totalBits > 0) {
    const highPct = energyCounts.high / totalBits;
    const mediumPct = energyCounts.medium / totalBits;
    const lowPct = energyCounts.low / totalBits;
    
    // Ideal distribution: ~30% high, ~50% medium, ~20% low
    const deviation = Math.abs(highPct - 0.3) + Math.abs(mediumPct - 0.5) + Math.abs(lowPct - 0.2);
    energyBalance = Math.max(0, Math.min(1, 1 - deviation));
    
    if (energyBalance < 0.6) {
      if (highPct < 0.2) {
        improvements.push("Add more high-energy bits to create peaks in the set");
      } else if (highPct > 0.5) {
        improvements.push("Too many high-energy bits may exhaust the audience - add more medium moments");
      }
      
      if (lowPct < 0.1) {
        improvements.push("Consider adding quieter moments to provide contrast and breathing room");
      } else if (lowPct > 0.3) {
        improvements.push("Be careful of too many low-energy segments which might lose momentum");
      }
    }
  }
  
  // Analyze technique variety
  if (bitTitles.length > 0) {
    // In a real implementation, we would analyze the actual techniques
    // This is a simplified approach
    techniqueVariety = Math.min(1, bitTitles.length * 0.2);
    
    if (techniqueVariety < 0.6 && bitTitles.length >= 3) {
      improvements.push("Consider incorporating more diverse comedic approaches across bits");
    }
  }
  
  // Analyze audience journey
  const audienceJourney = setAnalysis.audience_journey || {};
  if (audienceJourney.opening_emotion === audienceJourney.closing_emotion && 
      bitTitles.length > 2) {
    improvements.push("Consider creating a more distinct emotional journey from beginning to end");
  }
  
  // Add more improvements if needed
  if (improvements.length < 2) {
    if (bitTitles.length < 3) {
      improvements.push("Add more bits to create a more complete set");
    } else if (bitTitles.length > 10) {
      improvements.push("Consider splitting into multiple sets for better focus");
    }
  }
  
  return {
    flow_assessment: flowAssessment,
    energy_balance: energyBalance,
    technique_variety: techniqueVariety,
    improvements
  };
};

// Export all analyzer functions
module.exports = {
  // Analysis Engine - primary categorization
  analyzeJokeTechnique,
  analyzeJokeStructure,
  analyzeWordEconomy,
  analyzeBitTechnique,
  analyzeSetTechnique,
  
  // Creative Assistant - detailed feedback
  generateJokeFeedback,
  generateBitFeedback,
  generateSetFeedback,
  
  // Utilities
  loadTechniqueCategories
};