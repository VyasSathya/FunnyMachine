/**
 * Joke Model
 * 
 * Represents a single joke in the comedy construction system.
 * Jokes are the atomic units (Level 1) of comedy.
 */

class Joke {
  constructor(data = {}) {
    this.id = data.id || `joke_${Math.random().toString(36).substring(2, 10)}`;
    this.text = data.text || '';
    this.tags = data.tags || [];
    this.metadata = {
      creation_date: data.metadata?.creation_date || new Date().toISOString(),
      last_modified: data.metadata?.last_modified || new Date().toISOString(),
      performance_count: data.metadata?.performance_count || 0,
      duration_seconds: data.metadata?.duration_seconds || 0
    };
    this.analysis = {
      primary_technique: data.analysis?.primary_technique || 'observational_deconstruction',
      techniques: data.analysis?.techniques || [],
      structure: {
        setup: data.analysis?.structure?.setup || '',
        punchline: data.analysis?.structure?.punchline || '',
        act_out: data.analysis?.structure?.act_out || null
      },
      metrics: {
        word_economy: data.analysis?.metrics?.word_economy || 0.5,
        strength_score: data.analysis?.metrics?.strength_score || 'medium',
        laugh_data: data.analysis?.metrics?.laugh_data || []
      }
    };
    this.source = data.source || {
      special_name: '',
      bit_title: '',
      bit_index: 0,
      joke_index: 0
    };
    this.creative_feedback = {
      strengths: data.creative_feedback?.strengths || [],
      improvement_areas: data.creative_feedback?.improvement_areas || [],
      suggestions: data.creative_feedback?.suggestions || []
    };
  }

  // Helper methods

  /**
   * Calculate the average laughter duration for this joke
   */
  getAverageLaughterDuration() {
    const laughData = this.analysis.metrics.laugh_data;
    if (!laughData || laughData.length === 0) return 0;
    
    return laughData.reduce((sum, laugh) => sum + (laugh.duration || 0), 0) / laughData.length;
  }

  /**
   * Calculate the total word count
   */
  getWordCount() {
    return this.text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Update the joke text and recalculate related metrics
   */
  updateText(newText) {
    // Store old text for comparison
    const oldText = this.text;
    
    // Update text
    this.text = newText;
    
    // Update timestamps
    this.metadata.last_modified = new Date().toISOString();
    
    // Here you would typically call analysis services to update metrics
    // For now, we'll just update word count related metrics
    const oldWordCount = oldText.split(/\s+/).filter(w => w.length > 0).length;
    const newWordCount = this.getWordCount();
    
    // Simple adjustment of word economy based on word count difference
    if (oldWordCount > 0 && newWordCount < oldWordCount) {
      // Improved word economy
      this.analysis.metrics.word_economy = Math.min(
        1, 
        this.analysis.metrics.word_economy * (oldWordCount / newWordCount)
      );
    } else if (newWordCount > oldWordCount) {
      // Decreased word economy
      this.analysis.metrics.word_economy = this.analysis.metrics.word_economy * 
        (oldWordCount / newWordCount);
    }
    
    return this;
  }

  /**
   * Add a new laughter data point
   */
  addLaughterData(duration, intensity = 0.7) {
    const newLaughData = {
      timestamp: new Date().toISOString(),
      duration: duration,
      intensity: intensity
    };
    
    this.analysis.metrics.laugh_data.push(newLaughData);
    
    // Update performance count
    this.metadata.performance_count += 1;
    
    return this;
  }

  /**
   * Update the joke's strength score based on new analysis
   */
  updateStrengthScore(newScore) {
    if (['low', 'medium', 'high'].includes(newScore)) {
      this.analysis.metrics.strength_score = newScore;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a tag to the joke
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a tag from the joke
   */
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.metadata.last_modified = new Date().toISOString();
    return this;
  }

  /**
   * Get a plain object representation of the joke
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      tags: this.tags,
      metadata: this.metadata,
      analysis: this.analysis,
      source: this.source,
      creative_feedback: this.creative_feedback
    };
  }
}

module.exports = Joke;
