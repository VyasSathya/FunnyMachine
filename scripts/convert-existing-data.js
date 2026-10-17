// scripts/convert-existing-data.js
const fs = require('fs').promises;
const path = require('path');
const Joke = require('../models/joke-model');
const Bit = require('../models/bit-model');
const Set = require('../models/set-model');
const Special = require('../models/special-model');

async function convertExistingData(inputFile) {
  try {
    console.log(`Processing file: ${inputFile}`);
    
    // Read the raw data file
    const dataPath = path.join(__dirname, '..', inputFile);
    const rawData = await fs.readFile(dataPath, 'utf8');
    const jokes = rawData.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error('Error parsing line:', line.substring(0, 50) + '...');
          return null;
        }
      })
      .filter(Boolean);
    
    console.log(`Found ${jokes.length} jokes in the file`);
    
    // Group jokes by special, bit
    const specialsMap = {};
    
    // Process each joke
    jokes.forEach(joke => {
      const specialName = joke.special_name;
      const bitTitle = joke.bit_title;
      const bitIndex = joke.bit_index;
      
      // Ensure special exists
      if (!specialsMap[specialName]) {
        specialsMap[specialName] = {
          id: `special_${specialName.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`,
          title: specialName,
          bits: {}
        };
      }
      
      // Ensure bit exists
      const bitKey = `${bitIndex}_${bitTitle.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`;
      if (!specialsMap[specialName].bits[bitKey]) {
        specialsMap[specialName].bits[bitKey] = {
          id: `bit_${specialName.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}_${bitIndex}`,
          title: bitTitle,
          jokes: []
        };
      }
      
      // Add joke to bit
      const jokeModel = new Joke({
        id: joke.tempId || `joke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: joke.text,
        tags: [joke.ai_analysis?.subject, joke.ai_analysis?.tone].filter(Boolean),
        metadata: {
          creation_date: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          performance_count: 1,
          duration_seconds: joke.laughter?.duration || 0
        },
        analysis: {
          primary_technique: mapTechnique(joke.ai_analysis?.techniques?.[0] || ""),
          techniques: (joke.ai_analysis?.techniques || []).map(tech => ({
            name: mapTechnique(tech),
            confidence: 0.8
          })),
          structure: {
            setup: joke.ai_analysis?.structure?.setup || "",
            punchline: joke.ai_analysis?.structure?.punchline || "",
            act_out: joke.ai_analysis?.actOut
          },
          metrics: {
            word_economy: calculateWordEconomy(joke.text),
            strength_score: mapStrength(joke.ai_analysis?.strengthAssessment),
            laugh_data: joke.laughter ? [{
              timestamp: new Date().toISOString(),
              duration: joke.laughter.duration || 0,
              intensity: joke.laughter.confidence || 0.5
            }] : []
          }
        },
        source: {
          special_name: joke.special_name,
          bit_title: joke.bit_title,
          bit_index: joke.bit_index,
          joke_index: joke.joke_index
        }
      });
      
      specialsMap[specialName].bits[bitKey].jokes.push(jokeModel);
    });
    
    // Build full hierarchy
    const processedJokes = [];
    const processedBits = [];
    const processedSets = [];
    const processedSpecials = [];
    
    // For each special
    for (const [specialName, specialData] of Object.entries(specialsMap)) {
      const bitIds = [];
      
      // Sort bits by index
      const sortedBits = Object.entries(specialData.bits)
        .sort(([keyA], [keyB]) => {
          const indexA = parseInt(keyA.split('_')[0]);
          const indexB = parseInt(keyB.split('_')[0]);
          return indexA - indexB;
        });
      
      // For each bit in the special
      for (const [bitKey, bitData] of sortedBits) {
        const jokeIds = [];
        
        // Sort jokes by index
        bitData.jokes.sort((a, b) => a.source.joke_index - b.source.joke_index);
        
        // For each joke in the bit
        bitData.jokes.forEach(joke => {
          processedJokes.push(joke);
          jokeIds.push(joke.id);
        });
        
        // Create segues
        const segues = [];
        for (let i = 0; i < jokeIds.length - 1; i++) {
          segues.push({
            from_joke_id: jokeIds[i],
            to_joke_id: jokeIds[i+1],
            text: "",
            strength: 0.5
          });
        }
        
        // Calculate bit techniques
        const bitTechniques = analyzeJokesForBitTechniques(bitData.jokes);
        
        // Create bit
        const bit = new Bit({
          id: bitData.id,
          title: bitData.title,
          description: `${bitData.title} from ${specialName}`,
          joke_ids: jokeIds,
          segues: segues,
          metadata: {
            creation_date: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            performance_count: 1,
            duration_seconds: bitData.jokes.reduce((sum, joke) => sum + (joke.metadata.duration_seconds || 0), 0),
            source: {
              special_name: specialName,
              bit_index: parseInt(bitKey.split('_')[0])
            }
          },
          analysis: {
            primary_technique: bitTechniques[0]?.name || "universal_premise",
            techniques: bitTechniques,
            emotional_core: determineEmotionalCore(bitData.jokes),
            vulnerability_level: determineVulnerabilityLevel(bitData.jokes),
            energy_profile: determineEnergyProfile(bitData.jokes),
            audience_journey: ["recognition", determineEmotionalCore(bitData.jokes), "insight"]
          },
          creative_feedback: {
            emotional_truth: 0.7,
            bit_cohesion: 0.7,
            improvements: [
              "Consider adding stronger transitions between jokes",
              "The bit could benefit from a more defined emotional arc"
            ]
          }
        });
        
        processedBits.push(bit);
        bitIds.push(bit.id);
      }
      
      // Create transitions
      const transitions = [];
      for (let i = 0; i < bitIds.length - 1; i++) {
        transitions.push({
          from_bit_id: bitIds[i],
          to_bit_id: bitIds[i+1],
          text: "",
          strength: 0.5
        });
      }
      
      // Create set (one per special in this basic mapping)
      const set = new Set({
        id: `set_${specialName.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`,
        title: specialName,
        description: `Complete set from ${specialName}`,
        bit_ids: bitIds,
        transitions: transitions,
        metadata: {
          creation_date: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          venues_performed: ["Comedy Club"],
          duration_minutes: Math.ceil(processedBits.reduce((sum, bit) => sum + (bit.metadata.duration_seconds || 0), 0) / 60)
        },
        analysis: {
          primary_technique: "thematic_threading",
          energy_mapping: generateEnergyMapping(processedBits),
          callback_opportunities: [],
          audience_journey: {
            opening_emotion: "curiosity",
            peak_emotion: "recognition",
            closing_emotion: "satisfaction"
          },
          venue_compatibility: {
            club: 0.9,
            corporate: 0.5,
            theater: 0.8
          }
        },
        creative_feedback: {
          flow_assessment: 0.7,
          energy_balance: 0.7,
          technique_variety: 0.6,
          improvements: [
            "Consider varying the energy levels more throughout the set",
            "Look for opportunities to create callbacks between bits"
          ]
        }
      });
      
      processedSets.push(set);
      
      // Create special
      const special = new Special({
        id: specialData.id,
        title: specialName,
        description: `${specialName} comedy special`,
        set_ids: [set.id],
        metadata: {
          creation_date: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          status: "released",
          target_duration_minutes: Math.ceil(processedSets.reduce((sum, set) => sum + (set.metadata.duration_minutes || 0), 0))
        },
        thematic_elements: {
          primary_theme: "stand-up",
          secondary_themes: ["comedy", "humor"],
          throughlines: [
            {
              concept: "comedy",
              manifestations: ["jokes", "bits", "sets"]
            }
          ]
        },
        production_elements: {
          opening_style: "direct_address",
          closing_style: "callback_to_opening",
          staging_notes: "Standard comedy club setup",
          tone_shifts: [
            {"position": 0.2, "tone": "observational"},
            {"position": 0.5, "tone": "confessional"},
            {"position": 0.8, "tone": "philosophical"}
          ]
        }
      });
      
      processedSpecials.push(special);
    }
    
    // Save to processed directory
    const outputDir = path.join(__dirname, '../data/processed');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
    
    await fs.writeFile(
      path.join(outputDir, 'jokes.json'),
      JSON.stringify(processedJokes.map(joke => joke.toJSON()), null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'bits.json'),
      JSON.stringify(processedBits.map(bit => bit.toJSON()), null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'sets.json'),
      JSON.stringify(processedSets.map(set => set.toJSON()), null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'specials.json'),
      JSON.stringify(processedSpecials.map(special => special.toJSON()), null, 2)
    );
    
    console.log(`Converted data: ${processedJokes.length} jokes, ${processedBits.length} bits, ${processedSets.length} sets, ${processedSpecials.length} specials`);
    return { processedJokes, processedBits, processedSets, processedSpecials };
  } catch (error) {
    console.error('Error converting data:', error);
    throw error;
  }
}

// Helper functions for mapping between formats
function mapTechnique(technique) {
  const techniqueMap = {
    'Misdirection': 'setup_subversion',
    'Exaggeration': 'hyperbole_escalation',
    'Act-out': 'act_out_embodiment',
    'Self-deprecation': 'self_deprecation',
    'Shock humor': 'shock_taboo',
    'Wordplay': 'wordplay_linguistic',
    'Observational': 'observational_deconstruction',
    'One-liner': 'unexpected_specificity',
    'Anecdotal': 'observational_deconstruction',
    'Physical Comedy': 'act_out_embodiment',
    'Dialogue': 'status_play',
    'Repetition': 'callback_pattern',
    'Non-joke': 'setup_subversion',
    'Character': 'status_play'
  };
  
  return techniqueMap[technique] || 'setup_subversion';
}

function mapStrength(strength) {
  if (!strength) return 'medium';
  
  if (typeof strength === 'string') {
    if (strength.toLowerCase().includes('high') || 
        strength.toLowerCase().includes('strong')) {
      return 'high';
    } else if (strength.toLowerCase().includes('low') || 
               strength.toLowerCase().includes('weak')) {
      return 'low';
    } else {
      return 'medium';
    }
  }
  
  return 'medium';
}

function calculateWordEconomy(text) {
  if (!text) return 0.5;
  
  // Simple word economy calculation
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  if (totalWords === 0) return 1;
  
  const fillerWords = ['the', 'a', 'an', 'and', 'but', 'or', 'so', 'very', 'really', 'just'];
  const fillerCount = words.filter(word => fillerWords.includes(word.toLowerCase())).length;
  
  return Math.max(0, Math.min(1, 1 - (fillerCount / totalWords)));
}

function analyzeJokesForBitTechniques(jokes) {
  // Count techniques
  const techniqueCounts = {};
  
  jokes.forEach(joke => {
    const technique = joke.analysis.primary_technique;
    techniqueCounts[technique] = (techniqueCounts[technique] || 0) + 1;
  });
  
  // Map joke techniques to bit techniques
  const bitTechniqueMap = {
    'setup_subversion': 'breaking_sentiment',
    'observational_deconstruction': 'universal_premise',
    'hyperbole_escalation': 'logical_escalation',
    'self_deprecation': 'vulnerability_performance',
    'status_play': 'anthropological_observation',
    'analogy_comparison': 'emotional_analogy',
    'act_out_embodiment': 'vulnerability_performance',
    'logical_fallacy': 'logical_escalation',
    'shock_taboo': 'breaking_sentiment',
    'wordplay_linguistic': 'breaking_sentiment',
    'unexpected_specificity': 'emotional_truth',
    'callback_pattern': 'self_awareness_paradox'
  };
  
  // Create bit techniques with confidence
  return Object.entries(techniqueCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3)
    .map(([technique, count]) => ({
      name: bitTechniqueMap[technique] || 'universal_premise',
      confidence: Math.min(1, count / jokes.length)
    }));
}

function determineEmotionalCore(jokes) {
  // Count tones
  const toneCounts = {};
  
  jokes.forEach(joke => {
    const tags = joke.tags || [];
    tags.forEach(tag => {
      if (tag) {
        toneCounts[tag.toLowerCase()] = (toneCounts[tag.toLowerCase()] || 0) + 1;
      }
    });
  });
  
  // Map tones to emotional cores
  const emotionMap = {
    'aggressive': 'anger',
    'angry': 'anger',
    'rude': 'anger',
    'dark': 'anger',
    'happy': 'joy',
    'light-hearted': 'joy',
    'appreciative': 'joy',
    'scared': 'fear',
    'nervous': 'fear',
    'anxious': 'fear',
    'sad': 'sadness',
    'disappointed': 'sadness',
    'depressed': 'sadness',
    'confused': 'confusion',
    'observational': 'curiosity',
    'provocative': 'frustration',
    'self-deprecating': 'frustration',
    'surprise': 'surprise',
    'shocked': 'surprise'
  };
  
  // Find most common tone
  let mostCommonTone = 'neutral';
  let maxCount = 0;
  
  for (const [tone, count] of Object.entries(toneCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonTone = tone;
    }
  }
  
  return emotionMap[mostCommonTone] || 'neutral';
}

function determineVulnerabilityLevel(jokes) {
  // Count self-referential jokes
  let selfReferences = 0;
  let personalTopicCount = 0;
  
  const personalTopics = ['marriage', 'divorce', 'sex', 'childhood', 'parents', 'depression', 'failure', 'body'];
  
  jokes.forEach(joke => {
    // Check for first-person pronouns
    if (/\b(I|me|my|mine|myself)\b/i.test(joke.text)) {
      selfReferences++;
    }
    
    // Check for personal topics
    personalTopics.forEach(topic => {
      if (joke.text.toLowerCase().includes(topic)) {
        personalTopicCount++;
      }
    });
  });
  
  const selfReferenceRatio = selfReferences / jokes.length;
  const personalTopicRatio = personalTopicCount / jokes.length;
  
  if (selfReferenceRatio > 0.7 && personalTopicRatio > 0.3) {
    return 'high';
  } else if (selfReferenceRatio > 0.3 || personalTopicRatio > 0.1) {
    return 'moderate';
  } else {
    return 'low';
  }
}

function determineEnergyProfile(jokes) {
  // Check for high energy indicators
  let highEnergyCount = 0;
  
  jokes.forEach(joke => {
    // Count exclamations, questions, all caps
    if (/[!?]/.test(joke.text) || /[A-Z]{3,}/.test(joke.text)) {
      highEnergyCount++;
    }
    
    // Check for laugh duration
    const laughData = joke.analysis.metrics.laugh_data;
    if (laughData && laughData.length > 0) {
      if (laughData[0].duration > 2.0) {
        highEnergyCount++;
      }
    }
  });
  
  const energyRatio = highEnergyCount / jokes.length;
  
  if (energyRatio > 0.7) {
    return 'high';
  } else if (energyRatio > 0.3) {
    return 'medium';
  } else {
    return 'low';
  }
}

function generateEnergyMapping(bits) {
  const mapping = [];
  
  const energyScores = {
    'high': 0.8,
    'medium': 0.5, 
    'low': 0.2
  };
  
  bits.forEach((bit, index) => {
    const position = index / (bits.length - 1 || 1);
    mapping.push({
      position,
      level: bit.analysis.energy_profile
    });
  });
  
  return mapping;
}

// Running from command line
if (require.main === module) {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Please provide an input file path');
    process.exit(1);
  }
  
  convertExistingData(inputFile)
    .then(() => console.log('Conversion complete'))
    .catch(err => console.error('Conversion failed:', err));
}

module.exports = { convertExistingData };