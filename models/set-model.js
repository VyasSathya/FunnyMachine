/**
 * Set Model
 * 
 * Represents a set in the comedy construction system.
 * Sets are Level 3 structures composed of multiple bits organized for performance.
 */

class Set {
  constructor(data = {}) {
    this.id = data.id || `set_${Math.random().toString(36).substring(2, 10)}`;
    this.title = data.title || 'Untitled Set';
    this.description = data.description || '';
    this.bit_ids = data.bit_ids || [];
    this.transitions = data.transitions || [];
    this.metadata = {
      creation_date: data.metadata?.creation_date || new Date().toISOString(),
      last_modified: data.metadata?.last_modified || new Date().toISOString(),
      venues_performed: data.metadata?.venues_performed || [],
      duration_minutes: data.metadata?.duration_minutes || 0
    };
    this.analysis = {
      primary_technique: data.analysis?.primary_technique || 'thematic_threading',
      energy_mapping: data.analysis?.energy_mapping || [],
      callback_opportunities: data.analysis?.callback_opportunities || [],
      audience_journey: data.analysis?.audience_journey || {
        opening_emotion: 'curiosity',
        peak_emotion: 'recognition',
        closing_emotion: 'satisfaction'
      },
      venue_compatibility: data.analysis?.venue_compatibility || {
        club: 0.8,
        corporate: 0.5,
        theater: 0.7
      }
    };
    this.creative_feedback = {
      flow_assessment: data.creative_feedback?.flow_assessment || 0.5,
      energy_balance: data.creative_feedback?.energy_balance || 0.5,
      technique_variety: data.creative_feedback?.technique_variety || 0.5,
      improvements: data.creative_feedback?.improvements || []
    };
  }

  // Helper methods

  /**
   * Add a bit to this set
   */
  addBit(bitId, position = -1) {
    if (!this.bit_ids.includes(bitId)) {
      if (position >= 0 && position < this.bit_ids.length) {
        // Insert at specific position
        this.bit_ids.splice(position, 0, bitId);
        
        // Add an empty transition if needed
        if (position < this.bit_ids.length - 1) {
          this.transitions.splice(position, 0, '');
        }
      } else {
        // Add to the end
        this.bit_ids.push(bitId);
      }
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a bit from this set
   */
  removeBit(bitId) {
    const index = this.bit_ids.indexOf(bitId);
    if (index !== -1) {
      // Remove the bit
      this.bit_ids.splice(index, 1);
      
      // Remove the transition if needed
      if (index < this.transitions.length) {
        this.transitions.splice(index, 1);
      }
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update a transition between bits
   */
  updateTransition(index, text) {
    if (index >= 0 && index < this.bit_ids.length - 1) {
      // Ensure transitions array is long enough
      while (this.transitions.length < this.bit_ids.length - 1) {
        this.transitions.push('');
      }
      
      this.transitions[index] = text;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update the set duration
   */
  updateDuration(durationMinutes) {
    this.metadata.duration_minutes = durationMinutes;
    this.metadata.last_modified = new Date().toISOString();
    return this;
  }

  /**
   * Record a venue where this set was performed
   */
  addVenuePerformed(venue) {
    if (venue && venue.trim() && !this.metadata.venues_performed.includes(venue)) {
      this.metadata.venues_performed.push(venue);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update venue compatibility scores
   */
  updateVenueCompatibility(venueType, score) {
    const validVenues = ['club', 'corporate', 'theater', 'podcast', 'tv'];
    if (validVenues.includes(venueType) && score >= 0 && score <= 1) {
      this.analysis.venue_compatibility[venueType] = score;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add an energy mapping point
   */
  addEnergyPoint(position, level) {
    if (position >= 0 && position <= 1 && ['low', 'medium', 'high', 'medium-low', 'medium-high'].includes(level)) {
      this.analysis.energy_mapping.push({ position, level });
      // Sort by position
      this.analysis.energy_mapping.sort((a, b) => a.position - b.position);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a callback opportunity
   */
  addCallbackOpportunity(fromJokeId, toPotentialLocations) {
    if (fromJokeId && Array.isArray(toPotentialLocations) && toPotentialLocations.length > 0) {
      this.analysis.callback_opportunities.push({
        from_joke_id: fromJokeId,
        to_potential_locations: toPotentialLocations
      });
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Get a plain object representation of the set
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      bit_ids: this.bit_ids,
      transitions: this.transitions,
      metadata: this.metadata,
      analysis: this.analysis,
      creative_feedback: this.creative_feedback
    };
  }
}

module.exports = Set;
