/**
 * Bit Model
 * 
 * Represents a bit in the comedy construction system.
 * Bits are Level 2 structures composed of multiple jokes around a central premise.
 */

class Bit {
  constructor(data = {}) {
    this.id = data.id || `bit_${Math.random().toString(36).substring(2, 10)}`;
    this.title = data.title || 'Untitled Bit';
    this.description = data.description || '';
    this.joke_ids = data.joke_ids || [];
    this.segues = data.segues || [];
    this.metadata = {
      creation_date: data.metadata?.creation_date || new Date().toISOString(),
      last_modified: data.metadata?.last_modified || new Date().toISOString(),
      performance_count: data.metadata?.performance_count || 0,
      duration_seconds: data.metadata?.duration_seconds || 0,
      source: data.metadata?.source || {
        special_name: '',
        bit_index: 0
      }
    };
    this.analysis = {
      primary_technique: data.analysis?.primary_technique || 'universal_premise',
      techniques: data.analysis?.techniques || [],
      emotional_core: data.analysis?.emotional_core || 'neutral',
      vulnerability_level: data.analysis?.vulnerability_level || 'low',
      energy_profile: data.analysis?.energy_profile || 'medium',
      audience_journey: data.analysis?.audience_journey || []
    };
    this.creative_feedback = {
      emotional_truth: data.creative_feedback?.emotional_truth || 0.5,
      bit_cohesion: data.creative_feedback?.bit_cohesion || 0.5,
      improvements: data.creative_feedback?.improvements || []
    };
  }

  // Helper methods

  /**
   * Add a joke to this bit
   */
  addJoke(jokeId, position = -1) {
    if (!this.joke_ids.includes(jokeId)) {
      if (position >= 0 && position < this.joke_ids.length) {
        // Insert at specific position
        this.joke_ids.splice(position, 0, jokeId);
        
        // Add an empty segue if needed
        if (position < this.joke_ids.length - 1) {
          this.segues.splice(position, 0, '');
        }
      } else {
        // Add to the end
        this.joke_ids.push(jokeId);
      }
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a joke from this bit
   */
  removeJoke(jokeId) {
    const index = this.joke_ids.indexOf(jokeId);
    if (index !== -1) {
      // Remove the joke
      this.joke_ids.splice(index, 1);
      
      // Remove the segue if needed
      if (index < this.segues.length) {
        this.segues.splice(index, 1);
      }
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update a segue between jokes
   */
  updateSegue(index, text) {
    if (index >= 0 && index < this.joke_ids.length - 1) {
      // Ensure segues array is long enough
      while (this.segues.length < this.joke_ids.length - 1) {
        this.segues.push('');
      }
      
      this.segues[index] = text;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update the bit duration
   */
  updateDuration(durationSeconds) {
    this.metadata.duration_seconds = durationSeconds;
    this.metadata.last_modified = new Date().toISOString();
    return this;
  }

  /**
   * Update the emotional core of the bit
   */
  updateEmotionalCore(core) {
    const validCores = ['anger', 'joy', 'fear', 'sadness', 'disgust', 'surprise', 'neutral', 'confusion', 'frustration'];
    if (validCores.includes(core)) {
      this.analysis.emotional_core = core;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update the vulnerability level
   */
  updateVulnerabilityLevel(level) {
    const validLevels = ['low', 'moderate', 'high'];
    if (validLevels.includes(level)) {
      this.analysis.vulnerability_level = level;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update the energy profile
   */
  updateEnergyProfile(profile) {
    const validProfiles = ['low', 'medium', 'high'];
    if (validProfiles.includes(profile)) {
      this.analysis.energy_profile = profile;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Record a performance of this bit
   */
  recordPerformance() {
    this.metadata.performance_count += 1;
    this.metadata.last_modified = new Date().toISOString();
    return this;
  }

  /**
   * Get a plain object representation of the bit
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      joke_ids: this.joke_ids,
      segues: this.segues,
      metadata: this.metadata,
      analysis: this.analysis,
      creative_feedback: this.creative_feedback
    };
  }
}

module.exports = Bit;
