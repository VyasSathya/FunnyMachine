/**
 * Special Model
 * 
 * Represents a special in the comedy construction system.
 * Specials are Level 4 structures that represent complete artistic statements.
 */

class Special {
  constructor(data = {}) {
    this.id = data.id || `special_${Math.random().toString(36).substring(2, 10)}`;
    this.title = data.title || 'Untitled Special';
    this.description = data.description || '';
    this.set_ids = data.set_ids || [];
    this.metadata = {
      creation_date: data.metadata?.creation_date || new Date().toISOString(),
      last_modified: data.metadata?.last_modified || new Date().toISOString(),
      status: data.metadata?.status || 'in_development',
      target_duration_minutes: data.metadata?.target_duration_minutes || 60
    };
    this.thematic_elements = {
      primary_theme: data.thematic_elements?.primary_theme || '',
      secondary_themes: data.thematic_elements?.secondary_themes || [],
      throughlines: data.thematic_elements?.throughlines || []
    };
    this.production_elements = {
      opening_style: data.production_elements?.opening_style || 'direct_address',
      closing_style: data.production_elements?.closing_style || 'callback_to_opening',
      staging_notes: data.production_elements?.staging_notes || '',
      tone_shifts: data.production_elements?.tone_shifts || []
    };
    this.analysis = {
      narrative_arc: data.analysis?.narrative_arc || {
        stages: []
      },
      identity_evolution: data.analysis?.identity_evolution || {
        starting_persona: '',
        transformation_points: [],
        ending_persona: ''
      },
      cultural_positioning: data.analysis?.cultural_positioning || {
        zeitgeist_relevance: 0.5,
        target_demographics: [],
        cultural_references: []
      }
    };
    this.creative_feedback = {
      artistic_cohesion: data.creative_feedback?.artistic_cohesion || 0.5,
      pacing_assessment: data.creative_feedback?.pacing_assessment || 0.5,
      thematic_clarity: data.creative_feedback?.thematic_clarity || 0.5,
      suggestions: data.creative_feedback?.suggestions || []
    };
  }

  // Helper methods

  /**
   * Add a set to this special
   */
  addSet(setId, position = -1) {
    if (!this.set_ids.includes(setId)) {
      if (position >= 0 && position < this.set_ids.length) {
        // Insert at specific position
        this.set_ids.splice(position, 0, setId);
      } else {
        // Add to the end
        this.set_ids.push(setId);
      }
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a set from this special
   */
  removeSet(setId) {
    const index = this.set_ids.indexOf(setId);
    if (index !== -1) {
      this.set_ids.splice(index, 1);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update the special's status
   */
  updateStatus(status) {
    const validStatuses = ['idea', 'in_development', 'rehearsing', 'performing', 'recording_ready', 'recorded', 'released'];
    if (validStatuses.includes(status)) {
      this.metadata.status = status;
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a theme to the special
   */
  addSecondaryTheme(theme) {
    if (theme && theme.trim() && !this.thematic_elements.secondary_themes.includes(theme)) {
      this.thematic_elements.secondary_themes.push(theme);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a throughline to the special
   */
  addThroughline(concept, manifestations = []) {
    if (concept && concept.trim()) {
      this.thematic_elements.throughlines.push({
        concept,
        manifestations: manifestations || []
      });
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a narrative arc stage
   */
  addNarrativeStage(position, stage) {
    if (position >= 0 && position <= 1 && stage && stage.trim()) {
      this.analysis.narrative_arc.stages.push({ position, stage });
      // Sort by position
      this.analysis.narrative_arc.stages.sort((a, b) => a.position - b.position);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Add a tone shift
   */
  addToneShift(position, tone) {
    if (position >= 0 && position <= 1 && tone && tone.trim()) {
      this.production_elements.tone_shifts.push({ position, tone });
      // Sort by position
      this.production_elements.tone_shifts.sort((a, b) => a.position - b.position);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Update identity evolution information
   */
  updateIdentityEvolution(startingPersona, endingPersona) {
    if (startingPersona && startingPersona.trim()) {
      this.analysis.identity_evolution.starting_persona = startingPersona;
    }
    if (endingPersona && endingPersona.trim()) {
      this.analysis.identity_evolution.ending_persona = endingPersona;
    }
    this.metadata.last_modified = new Date().toISOString();
    return this;
  }

  /**
   * Add a transformation point
   */
  addTransformationPoint(position, realization) {
    if (position >= 0 && position <= 1 && realization && realization.trim()) {
      this.analysis.identity_evolution.transformation_points.push({ position, realization });
      // Sort by position
      this.analysis.identity_evolution.transformation_points.sort((a, b) => a.position - b.position);
      this.metadata.last_modified = new Date().toISOString();
    }
    return this;
  }

  /**
   * Get a plain object representation of the special
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      set_ids: this.set_ids,
      metadata: this.metadata,
      thematic_elements: this.thematic_elements,
      production_elements: this.production_elements,
      analysis: this.analysis,
      creative_feedback: this.creative_feedback
    };
  }
}

module.exports = Special;
