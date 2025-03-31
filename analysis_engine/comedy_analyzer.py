import re
import json
import sys
from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class AudienceReaction(Enum):
    LAUGHTER = "laughter"
    APPLAUSE = "applause"
    CHEERING = "cheering"
    MIXED = "mixed"  # For combined reactions

class ComedyTechnique(Enum):
    MISDIRECTION = "misdirection"
    CALLBACK = "callback"
    EXAGGERATION = "exaggeration"
    OBSERVATIONAL = "observational"
    SELF_DEPRECATION = "self_deprecation"
    WORDPLAY = "wordplay"
    SHOCK = "shock"
    PHYSICAL_COMEDY = "physical_comedy"
    SARCASM = "sarcasm"
    DARK_HUMOR = "dark_humor"
    ACT_OUT = "act_out"

@dataclass
class JokeComponent:
    text: str
    start_index: int
    end_index: int
    has_act_out: bool = False
    act_out_text: Optional[str] = None
    delivery_cues: List[str] = None
    
    def __post_init__(self):
        if self.delivery_cues is None:
            self.delivery_cues = []

@dataclass
class Joke:
    id: str
    setup: JokeComponent
    punchline: JokeComponent
    tags: List[JokeComponent]  # Additional punchlines/tags
    audience_reactions: List[Tuple[AudienceReaction, float]]  # (type, confidence)
    full_text: str
    source_lines: Tuple[int, int]
    has_crowd_work: bool = False
    crowd_work_text: Optional[str] = None
    techniques: Set[ComedyTechnique] = None
    callbacks_to: List[str] = None  # IDs of jokes this one calls back to
    
    def __post_init__(self):
        if self.techniques is None:
            self.techniques = set()
        if self.callbacks_to is None:
            self.callbacks_to = []

@dataclass
class Bit:
    id: str
    title: str  # Inferred topic/theme
    jokes: List[Joke]
    start_index: int
    end_index: int
    keywords: List[str]
    callbacks_within: List[Tuple[str, str]]  # (source_joke_id, callback_joke_id)
    theme_strength: float  # How strongly the jokes relate to the main theme (0-1)

def detect_act_outs(text: str) -> Tuple[bool, Optional[str]]:
    """
    Detect if a line contains an act-out based on common patterns.
    Returns (has_act_out, act_out_text if found).
    """
    # Common patterns indicating act-outs
    act_out_patterns = [
        r'\[.*acting.*\]',
        r'\[.*imitating.*\]',
        r'\[.*voice.*\]',
        r'\[.*gesture.*\]',
        r'\(.*acting.*\)',
        r'\(.*imitating.*\)',
        r'(?i)(?:Grrr|Waaah|Pfft|Ugh|Ahem)',  # Common sound effects
        r'(?i)(?:like|goes), ["\'].*["\']'  # Quoted speech with "like" or "goes"
    ]
    
    for pattern in act_out_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return True, match.group(0)
    
    # Check for quoted speech that might indicate character voices
    quotes = re.findall(r'"([^"]*)"', text)
    if quotes:
        return True, quotes[0]
    
    return False, None

def detect_delivery_cues(text: str) -> List[str]:
    """
    Detect delivery cues like shouting, whispering, singing, etc.
    """
    cues = []
    cue_patterns = {
        'shouting': r'\[(shout.*|yell.*)\]|\(shout.*|yell.*\)',
        'whispering': r'\[whisper.*\]|\(whisper.*\)',
        'singing': r'\[sing.*\]|\(sing.*\)',
        'pause': r'\[pause.*\]|\(pause.*\)',
        'angry': r'\[angry.*\]|\(angry.*\)',
        'nervous': r'\[nervous.*\]|\(nervous.*\)',
        'mocking': r'\[mock.*\]|\(mock.*\)'
    }
    
    for cue_type, pattern in cue_patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            cues.append(cue_type)
    
    return cues

def detect_audience_reaction(text: str) -> Tuple[Optional[AudienceReaction], float]:
    """
    Detect and classify audience reactions with confidence scores.
    """
    patterns = {
        AudienceReaction.LAUGHTER: r'\[Laughter\]',
        AudienceReaction.APPLAUSE: r'\[Applause\]',
        AudienceReaction.CHEERING: r'\[Cheer.*\]',
    }
    
    # Default confidence for now - could be based on reaction duration or intensity
    default_confidence = 0.7
    
    for reaction_type, pattern in patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            return reaction_type, default_confidence
            
    return None, 0.0

def detect_crowd_work(text: str) -> Tuple[bool, Optional[str]]:
    """
    Detect if a segment contains crowd work/audience interaction.
    """
    crowd_work_patterns = [
        r'\[addressing audience\]',
        r'\[to audience member\]',
        r'(?i)(?:anybody|anyone) here\b',
        r'(?i)how many of you',
        r'(?i)raise your hands?\b',
        # Removed the "you know" pattern as it's too common in normal speech
    ]
    
    for pattern in crowd_work_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return True, text[match.start():match.end()]
    
    return False, None

def detect_comedy_techniques(joke: Joke, previous_jokes: List[Joke]) -> Set[ComedyTechnique]:
    """
    Detect comedy techniques used in a joke.
    Enhanced callback detection for theme-based bits.
    """
    techniques = set()
    setup_text = joke.setup.text.lower()
    punchline_text = joke.punchline.text.lower()
    full_text = (setup_text + " " + punchline_text).lower()
    
    # Detect self-deprecation
    self_deprecation_patterns = [
        r"(?i)i(?:\'m| am).*(?:stupid|dumb|idiot|fat|ugly|afraid)",
        r"(?i)i can\'?t.*",
        r"(?i)i (?:suck|fail).*",
        r"(?i)my.*(?:stupid|dumb|bad).*"
    ]
    if any(re.search(pattern, full_text) for pattern in self_deprecation_patterns):
        techniques.add(ComedyTechnique.SELF_DEPRECATION)
    
    # Detect observational humor
    observational_patterns = [
        r"(?i)(?:ever notice|you know|why do|what\'s the deal|isn\'t it)",
        r"(?i)(?:have you seen|when you|when people)"
    ]
    if any(re.search(pattern, setup_text) for pattern in observational_patterns):
        techniques.add(ComedyTechnique.OBSERVATIONAL)
    
    # Detect exaggeration
    exaggeration_patterns = [
        r"(?i)(?:always|never|every single|literally|absolutely|completely)",
        r"(?i)(?:million|billion|trillion|infinity|forever)",
        r"(?i)(?:worst|best|most|least).*(?:ever|in history|in the world)"
    ]
    if any(re.search(pattern, full_text) for pattern in exaggeration_patterns):
        techniques.add(ComedyTechnique.EXAGGERATION)
    
    # Detect wordplay (fixed the regex)
    wordplay_patterns = [
        r"(?i)(\w+).*\1",  # Simple word repetition
        r"(?i)(\w+).*(?:rhymes?|sounds?) like.*(\w+)",  # Rhyming or sound-alike references
    ]
    if any(re.search(pattern, full_text) for pattern in wordplay_patterns):
        techniques.add(ComedyTechnique.WORDPLAY)
    
    # Detect physical comedy through act-outs
    if joke.setup.has_act_out or joke.punchline.has_act_out:
        techniques.add(ComedyTechnique.PHYSICAL_COMEDY)
        techniques.add(ComedyTechnique.ACT_OUT)
    
    # Detect dark humor
    dark_patterns = [
        r"(?i)(?:death|die|kill|dead|murder)",
        r"(?i)(?:suicide|depression|anxiety)",
        r"(?i)(?:funeral|grave|cemetery)",
        r"(?i)(?:fuck|shit|dick|cock|suck)",  # Adult/explicit content
        r"(?i)(?:faggot|gay)"  # Potentially offensive terms
    ]
    if any(re.search(pattern, full_text) for pattern in dark_patterns):
        techniques.add(ComedyTechnique.DARK_HUMOR)
        techniques.add(ComedyTechnique.SHOCK)
    
    # Detect sarcasm
    sarcasm_patterns = [
        r"(?i)(?:yeah.*right|sure.*thing|obviously|clearly)",
        r'(?i)(?:air quotes|".*")',
        r"(?i)(?:whatever|like that\'s|right\?)"
    ]
    if any(re.search(pattern, punchline_text) for pattern in sarcasm_patterns):
        techniques.add(ComedyTechnique.SARCASM)
    
    # Enhanced callback detection
    strong_callback_words = {'faggot', 'gay', 'dick', 'suck'}  # Add other strong theme words
    current_strong_words = set(re.findall(r'\b\w+\b', full_text.lower())) & strong_callback_words
    
    for prev_joke in previous_jokes:
        prev_text = prev_joke.full_text.lower()
        prev_strong_words = set(re.findall(r'\b\w+\b', prev_text)) & strong_callback_words
        
        # If either joke has strong theme words and there's overlap
        if (current_strong_words or prev_strong_words) and (current_strong_words & prev_strong_words):
            techniques.add(ComedyTechnique.CALLBACK)
            if prev_joke.id not in joke.callbacks_to:
                joke.callbacks_to.append(prev_joke.id)
        else:
            # Fall back to regular word overlap check
            prev_keywords = set(re.findall(r'\w+', prev_text))
            current_keywords = set(re.findall(r'\w+', full_text))
            overlap = prev_keywords.intersection(current_keywords)
            if len(overlap) >= 3:
                techniques.add(ComedyTechnique.CALLBACK)
                if prev_joke.id not in joke.callbacks_to:
                    joke.callbacks_to.append(prev_joke.id)
    
    return techniques

def detect_bit_theme(jokes: List[Joke]) -> Tuple[str, List[str], float]:
    """
    Detect the common theme among a group of jokes.
    Returns (theme_title, keywords, confidence).
    """
    # Combine all joke texts
    all_text = " ".join(joke.full_text for joke in jokes)
    
    # Extract potential keywords (simple approach)
    words = re.findall(r'\b\w+\b', all_text.lower())
    word_freq = defaultdict(int)
    for word in words:
        if len(word) > 3:  # Skip very short words
            word_freq[word] += 1
    
    # Get top keywords
    keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    keywords = [k for k, _ in keywords]
    
    # Create a simple theme title from top keywords
    theme_title = " ".join(keywords[:2]).title()
    
    # Calculate theme strength based on keyword density
    total_words = len(words)
    theme_word_count = sum(word_freq[k] for k in keywords)
    theme_strength = min(1.0, theme_word_count / total_words)
    
    return theme_title, keywords, theme_strength

def detect_bits_from_jokes(jokes: List[Joke], similarity_threshold: float = 0.15) -> List[Bit]:
    """
    Group jokes into bits based on thematic similarity and structural cues.
    Uses a lower similarity threshold and stronger callback-based grouping.
    """
    if not jokes:
        return []
    
    bits = []
    current_bit_jokes = []
    vectorizer = TfidfVectorizer(stop_words='english')
    
    # Pre-process to identify strong callback chains
    callback_groups = defaultdict(list)
    for i, joke in enumerate(jokes):
        # Get all unique keywords from the joke
        joke_words = set(re.findall(r'\b\w+\b', joke.full_text.lower()))
        
        # Check for strong theme words (like "faggot" in this case)
        strong_themes = {'faggot', 'gay', 'dick', 'suck'}  # Add other strong theme words as needed
        if joke_words & strong_themes:
            for theme_word in (joke_words & strong_themes):
                callback_groups[theme_word].append(i)
    
    # Helper function to create a bit from accumulated jokes
    def create_bit(joke_group: List[Joke], bit_index: int) -> Bit:
        theme_title, keywords, theme_strength = detect_bit_theme(joke_group)
        
        # Find callbacks within this bit
        callbacks = []
        for i, joke in enumerate(joke_group):
            for callback_id in joke.callbacks_to:
                # Only include if the callback source is also in this bit
                source_jokes = [j for j in joke_group[:i] if j.id == callback_id]
                if source_jokes:
                    callbacks.append((callback_id, joke.id))
        
        # Boost theme strength if we have callbacks
        if callbacks:
            theme_strength = min(1.0, theme_strength * 1.5)
        
        return Bit(
            id=f"bit_{bit_index}",
            title=theme_title,
            jokes=joke_group,
            start_index=joke_group[0].source_lines[0],
            end_index=joke_group[-1].source_lines[1],
            keywords=keywords,
            callbacks_within=callbacks,
            theme_strength=theme_strength
        )
    
    # First, try to group by strong callback chains
    used_jokes = set()
    for theme_word, joke_indices in callback_groups.items():
        if len(joke_indices) > 2:  # If we have a significant chain
            # Get all jokes in this chain
            chain_jokes = [jokes[i] for i in joke_indices]
            # Add any jokes between these that might be related
            min_idx = min(joke_indices)
            max_idx = max(joke_indices)
            for i in range(min_idx, max_idx + 1):
                if i not in joke_indices:
                    # Check if this joke is related to the theme
                    joke_text = jokes[i].full_text.lower()
                    if any(word in joke_text for word in strong_themes):
                        chain_jokes.append(jokes[i])
            
            if chain_jokes and all(j.id not in used_jokes for j in chain_jokes):
                bits.append(create_bit(sorted(chain_jokes, key=lambda x: jokes.index(x)), len(bits)))
                used_jokes.update(j.id for j in chain_jokes)
    
    # Process remaining jokes sequentially
    current_bit_jokes = []
    for i, joke in enumerate(jokes):
        if joke.id in used_jokes:
            continue
            
        current_bit_jokes.append(joke)
        used_jokes.add(joke.id)
        
        # If this is the last joke or we need to check for a bit boundary
        if i == len(jokes) - 1 or should_split_bit(current_bit_jokes, jokes[i + 1], vectorizer, similarity_threshold):
            if current_bit_jokes:
                # Try to merge with previous bit if similar
                if bits and len(current_bit_jokes) <= 2:
                    prev_bit_text = " ".join(j.full_text for j in bits[-1].jokes)
                    current_text = " ".join(j.full_text for j in current_bit_jokes)
                    try:
                        tfidf_matrix = vectorizer.fit_transform([prev_bit_text, current_text])
                        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                        if similarity > similarity_threshold:
                            # Add to previous bit instead
                            bits[-1].jokes.extend(current_bit_jokes)
                            bits[-1].end_index = current_bit_jokes[-1].source_lines[1]
                            current_bit_jokes = []
                            continue
                    except:
                        pass
                
                bits.append(create_bit(current_bit_jokes, len(bits)))
                current_bit_jokes = []
    
    return bits

def should_split_bit(current_jokes: List[Joke], next_joke: Joke, vectorizer, threshold: float) -> bool:
    """
    Determine if we should end the current bit before this joke.
    """
    if not current_jokes:
        return False
    
    # Get the text of the current bit and the next joke
    current_text = " ".join(joke.full_text for joke in current_jokes)
    next_text = next_joke.full_text
    
    # Calculate similarity
    try:
        tfidf_matrix = vectorizer.fit_transform([current_text, next_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except:
        similarity = 0
    
    # Check for explicit segues or topic shifts
    segue_patterns = [
        r"(?i)anyway",
        r"(?i)moving on",
        r"(?i)speaking of",
        r"(?i)but that\'s not",
        r"(?i)on (?:a|another) (?:different|related) note"
    ]
    
    has_segue = any(re.search(pattern, next_joke.setup.text) for pattern in segue_patterns)
    
    # Split if similarity is low or there's an explicit segue
    return similarity < threshold or has_segue

def detect_jokes_from_transcript(transcript_text: str) -> List[Joke]:
    """
    Enhanced joke detection that considers act-outs, tags, and audience interaction.
    """
    jokes = []
    lines = transcript_text.strip().split('\n')
    current_lines = []
    last_marker_index = -1
    potential_tags = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        reaction, confidence = detect_audience_reaction(line)
        
        if reaction:
            if current_lines:
                # Process the accumulated lines as a joke
                joke_text = "\n".join(current_lines)
                
                # Find the last non-empty line for punchline
                punchline_idx = len(current_lines) - 1
                while punchline_idx >= 0 and not current_lines[punchline_idx].strip():
                    punchline_idx -= 1
                
                if punchline_idx >= 0:
                    # If we only have one line, try to split it into setup and punchline
                    if punchline_idx == 0:
                        text_parts = current_lines[0].split('  ')  # Look for double spaces
                        if len(text_parts) > 1:
                            setup_text = text_parts[0]
                            punchline_text = '  '.join(text_parts[1:])
                        else:
                            # Try to split on common conjunction words
                            for split_word in ['but', 'and', 'because', 'so']:
                                if f" {split_word} " in current_lines[0].lower():
                                    parts = current_lines[0].split(f" {split_word} ", 1)
                                    if len(parts) == 2:
                                        setup_text = parts[0]
                                        punchline_text = f"{split_word} {parts[1]}"
                                        break
                            else:
                                # If no split found, use the whole line as punchline
                                setup_text = ""
                                punchline_text = current_lines[0]
                    else:
                        # Multiple lines - use last line as punchline
                        punchline_text = current_lines[punchline_idx]
                        setup_text = "\n".join(current_lines[:punchline_idx])
                    
                    # Check for act-outs and delivery cues
                    has_act_out, act_out_text = detect_act_outs(punchline_text)
                    delivery_cues = detect_delivery_cues(punchline_text)
                    
                    punchline = JokeComponent(
                        text=punchline_text,
                        start_index=last_marker_index + punchline_idx,
                        end_index=last_marker_index + punchline_idx + 1,
                        has_act_out=has_act_out,
                        act_out_text=act_out_text,
                        delivery_cues=delivery_cues
                    )
                    
                    has_act_out, act_out_text = detect_act_outs(setup_text)
                    delivery_cues = detect_delivery_cues(setup_text)
                    
                    setup = JokeComponent(
                        text=setup_text,
                        start_index=last_marker_index + 1,
                        end_index=last_marker_index + punchline_idx,
                        has_act_out=has_act_out,
                        act_out_text=act_out_text,
                        delivery_cues=delivery_cues
                    )
                    
                    # Check for crowd work
                    has_crowd_work, crowd_work_text = detect_crowd_work(joke_text)
                    
                    # Create the joke object
                    joke = Joke(
                        id=f"joke_{len(jokes)}",
                        setup=setup,
                        punchline=punchline,
                        tags=[],  # We'll add tags after checking the next lines
                        audience_reactions=[(reaction, confidence)],
                        full_text=joke_text,
                        source_lines=(last_marker_index + 1, i),
                        has_crowd_work=has_crowd_work,
                        crowd_work_text=crowd_work_text
                    )
                    
                    # Detect comedy techniques (comparing with previous jokes)
                    joke.techniques = detect_comedy_techniques(joke, jokes)
                    
                    jokes.append(joke)
            
            last_marker_index = i
            current_lines = []
        else:
            # If this line follows immediately after a reaction, it might be a tag
            if last_marker_index == i - 1 and jokes:
                has_act_out, act_out_text = detect_act_outs(line)
                delivery_cues = detect_delivery_cues(line)
                
                tag = JokeComponent(
                    text=line,
                    start_index=i,
                    end_index=i + 1,
                    has_act_out=has_act_out,
                    act_out_text=act_out_text,
                    delivery_cues=delivery_cues
                )
                
                # Only add as tag if it's different from the punchline
                if jokes[-1].punchline.text != line:
                    jokes[-1].tags.append(tag)
            current_lines.append(line)
    
    return jokes

# --- Helper function to convert Joke object to dictionary ---
# (Similar to the one previously in __main__, but reusable)
def joke_to_dict(joke: Joke) -> Dict:
    # Convert Enum sets/lists to lists of strings
    techniques_list = [tech.value for tech in joke.techniques] if joke.techniques else []
    audience_reactions_list = [
        [reaction.value, conf] for reaction, conf in joke.audience_reactions
    ] if joke.audience_reactions else []
    
    # Use asdict for nested dataclasses, then manually handle Enums/Sets
    joke_dict = asdict(joke)
    joke_dict['techniques'] = techniques_list
    joke_dict['audience_reactions'] = audience_reactions_list
    # Ensure setup/punchline/tags also handle their enums if they have any (like delivery_cues)
    # Assuming JokeComponent doesn't have enums directly in this example
    # If JokeComponent had enums, we'd need to convert them within setup/punchline/tags fields too
    
    # Example for nested conversion if JokeComponent had enums:
    # joke_dict['setup'] = component_to_dict(joke.setup)
    # joke_dict['punchline'] = component_to_dict(joke.punchline)
    # joke_dict['tags'] = [component_to_dict(tag) for tag in joke.tags]

    return joke_dict

# --- Main execution block --- 
if __name__ == "__main__":
    # Read transcript text from standard input
    transcript_text = sys.stdin.read()

    if not transcript_text:
        print(json.dumps({"error": "No input text received"}), file=sys.stderr)
        sys.exit(1)

    try:
        # Detect individual jokes from the input text
        detected_jokes = detect_jokes_from_transcript(transcript_text)
        
        # Convert jokes to JSON serializable format
        output_jokes = [joke_to_dict(joke) for joke in detected_jokes]
        
        # Print the JSON output to standard output
        print(json.dumps(output_jokes, indent=2))
        
    except Exception as e:
        # Print any errors to stderr
        print(json.dumps({"error": f"Error during analysis: {str(e)}"}), file=sys.stderr)
        sys.exit(1) 