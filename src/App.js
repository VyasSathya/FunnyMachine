import React, { useState, useRef } from 'react';
import './App.css';

const App = () => {
  // Refs for drag and drop
  const dragItem = useRef();
  const dragOverItem = useRef();
  
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentLibraryTab, setCurrentLibraryTab] = useState('jokes');
  const [currentAnalysisTab, setCurrentAnalysisTab] = useState('technique');
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Sample data for all levels
  const [jokes, setJokes] = useState([
    { id: 1, title: 'Eyebrows Joke', technique: 'Wordplay', time: 12, economy: 85, 
      setup: 'I told my wife she was drawing her eyebrows too high.', 
      punchline: 'She looked surprised.' },
    { id: 2, title: 'Dating App Joke', technique: 'Self-Deprecation', time: 18, economy: 91, 
      setup: 'I tried a new dating app where you have to be honest about yourself.',
      punchline: 'I\'ve been single for 3 months now.' },
    { id: 3, title: 'Airport Security Joke', technique: 'Observational', time: 22, economy: 76, 
      setup: 'Airport security asked me if I had any liquids over 3 ounces.',
      punchline: 'I said no, but my anxiety is definitely over the limit.' }
  ]);
  
  const [bits, setBits] = useState([
    { id: 1, title: 'Dating in Your 30s', technique: 'Self-deprecation, Wordplay', time: 165, 
      vulnerability: 'Moderate', energy: 'Medium', jokeIds: [2, 1], 
      segues: ['Speaking of dating disasters, my wife and I...'] },
    { id: 2, title: 'Technology Frustrations', technique: 'Observational, Anger', time: 200, 
      vulnerability: 'Low', energy: 'High', jokeIds: [3], 
      segues: [] }
  ]);
  
  const [sets, setSets] = useState([
    { id: 1, title: 'Modern Life Struggles', time: 930, theme: 'External Frustrations', 
      bitIds: [2, 1], transitions: ['These modern conveniences are supposed to make life easier, but dating sure isn\'t...'] }
  ]);
  
  const [specials, setSpecials] = useState([
    { id: 1, title: 'Life in Progress', time: 3385, theme: 'Growing self-awareness', 
      setIds: [1] }
  ]);
  
  // Input material handling
  const [inputText, setInputText] = useState('');
  
  // Assembly areas for each level
  const [selectedJoke, setSelectedJoke] = useState(null);
  const [selectedBit, setSelectedBit] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedSpecial, setSelectedSpecial] = useState(null);

  // Drag and drop handlers
  const handleDragStart = (e, position, item) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.5";
    e.dataTransfer.setData("itemData", JSON.stringify(item));
  };
  
  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
    e.target.classList.add('drag-over');
  };
  
  const handleDragLeave = (e) => {
    e.target.classList.remove('drag-over');
  };
  
  const handleDrop = (e, dropTarget) => {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    
    const draggedItemData = JSON.parse(e.dataTransfer.getData("itemData"));
    
    // Handle drops based on the current level and target
    switch(currentLevel) {
      case 2: // Adding jokes to bits
        if (dropTarget === 'bit-assembly' && selectedBit) {
          const updatedBits = [...bits];
          const bitIndex = updatedBits.findIndex(bit => bit.id === selectedBit.id);
          
          // Add the joke to the bit
          if (bitIndex !== -1) {
            if (!updatedBits[bitIndex].jokeIds.includes(draggedItemData.id)) {
              updatedBits[bitIndex].jokeIds.push(draggedItemData.id);
              updatedBits[bitIndex].segues.push("");
              setBits(updatedBits);
              setSelectedBit(updatedBits[bitIndex]);
            }
          }
        }
        break;
      
      case 3: // Adding bits to sets
        if (dropTarget === 'set-assembly' && selectedSet) {
          const updatedSets = [...sets];
          const setIndex = updatedSets.findIndex(set => set.id === selectedSet.id);
          
          // Add the bit to the set
          if (setIndex !== -1) {
            if (!updatedSets[setIndex].bitIds.includes(draggedItemData.id)) {
              updatedSets[setIndex].bitIds.push(draggedItemData.id);
              updatedSets[setIndex].transitions.push("");
              setSets(updatedSets);
              setSelectedSet(updatedSets[setIndex]);
            }
          }
        }
        break;
      
      case 4: // Adding sets to specials
        if (dropTarget === 'special-assembly' && selectedSpecial) {
          const updatedSpecials = [...specials];
          const specialIndex = updatedSpecials.findIndex(special => special.id === selectedSpecial.id);
          
          // Add the set to the special
          if (specialIndex !== -1) {
            if (!updatedSpecials[specialIndex].setIds.includes(draggedItemData.id)) {
              updatedSpecials[specialIndex].setIds.push(draggedItemData.id);
              setSpecials(updatedSpecials);
              setSelectedSpecial(updatedSpecials[specialIndex]);
            }
          }
        }
        break;
        
      default:
        break;
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  // Function to reorder elements
  const handleReorder = (array, sourceIndex, destinationIndex, setter, selectedSetter, selectedItem) => {
    if (sourceIndex === destinationIndex) return;
    
    const items = [...array];
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);
    
    setter(items);
    
    // Update selected item if needed
    if (selectedItem && selectedItem.id === reorderedItem.id) {
      selectedSetter(reorderedItem);
    }
  };
  
  // UI rendering helpers
  const getLevelName = (level) => {
    switch(level) {
      case 1: return 'Jokes';
      case 2: return 'Bits';
      case 3: return 'Sets';
      case 4: return 'Specials';
      default: return '';
    }
  };

  // Input material analysis
  const handleAnalyzeInput = () => {
    if (!inputText.trim()) return;
    
    // Simulate AI analysis - in a real app, this would call an AI service
    const analyzedJoke = {
      id: jokes.length + 1,
      title: `Joke ${jokes.length + 1}`,
      technique: Math.random() > 0.5 ? 'Wordplay' : 'Observational',
      time: Math.floor(Math.random() * 20) + 10,
      economy: Math.floor(Math.random() * 20) + 75,
      setup: inputText.split('\n')[0] || inputText,
      punchline: inputText.split('\n')[1] || "..."
    };
    
    setJokes([...jokes, analyzedJoke]);
    setInputText('');
    
    // Show a notification - in a real app this would be more sophisticated
    alert('Input analyzed and added to jokes library!');
  };

  // Handlers
  const handleLevelChange = (level) => {
    setCurrentLevel(level);
    setShowAnalysis(false);
  };
  
  const handleLibraryTabChange = (tab) => {
    setCurrentLibraryTab(tab);
  };
  
  const handleAnalysisTabChange = (tab) => {
    setCurrentAnalysisTab(tab);
  };
  
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  
  const handleAnalyzeClick = () => {
    setShowAnalysis(!showAnalysis);
  };
  
  const handleItemSelect = (item, type) => {
    switch(type) {
      case 'joke':
        setSelectedJoke(item);
        break;
      case 'bit':
        setSelectedBit(item);
        break;
      case 'set':
        setSelectedSet(item);
        break;
      case 'special':
        setSelectedSpecial(item);
        break;
      default:
        break;
    }
  };
  
  const handleCreateNew = () => {
    switch(currentLibraryTab) {
      case 'jokes':
        const newJoke = { 
          id: jokes.length + 1, 
          title: 'New Joke', 
          technique: '', 
          time: 0, 
          economy: 0,
          setup: '',
          punchline: ''
        };
        setJokes([...jokes, newJoke]);
        break;
      case 'bits':
        const newBit = {
          id: bits.length + 1,
          title: 'New Bit',
          technique: '',
          time: 0,
          vulnerability: 'Low',
          energy: 'Medium',
          jokeIds: [],
          segues: []
        };
        setBits([...bits, newBit]);
        break;
      case 'sets':
        const newSet = {
          id: sets.length + 1,
          title: 'New Set',
          time: 0,
          theme: '',
          bitIds: [],
          transitions: []
        };
        setSets([...sets, newSet]);
        break;
      case 'specials':
        const newSpecial = {
          id: specials.length + 1,
          title: 'New Special',
          time: 0,
          theme: '',
          setIds: []
        };
        setSpecials([...specials, newSpecial]);
        break;
      default:
        break;
    }
  };

  // Helper to get library content based on current tab
  const renderLibraryContent = () => {
    switch(currentLibraryTab) {
      case 'jokes':
        return jokes.map((joke, index) => (
          <div 
            key={joke.id} 
            className="library-item"
            draggable
            onDragStart={(e) => handleDragStart(e, index, joke)}
            onDragEnd={handleDragEnd}
            onClick={() => handleItemSelect(joke, 'joke')}
          >
            <h4>{joke.title}</h4>
            <p>{joke.technique} | {joke.time} sec | Word Economy: {joke.economy}%</p>
            <div className="item-drag-handle">⋮⋮</div>
          </div>
        ));
      case 'bits':
        return bits.map((bit, index) => (
          <div 
            key={bit.id} 
            className="library-item"
            draggable
            onDragStart={(e) => handleDragStart(e, index, bit)}
            onDragEnd={handleDragEnd}
            onClick={() => handleItemSelect(bit, 'bit')}
          >
            <h4>{bit.title}</h4>
            <p>{bit.technique} | {Math.floor(bit.time / 60)}:{bit.time % 60 < 10 ? '0' + bit.time % 60 : bit.time % 60}</p>
            <p>Energy: {bit.energy} | Vulnerability: {bit.vulnerability}</p>
            <div className="item-drag-handle">⋮⋮</div>
          </div>
        ));
      case 'sets':
        return sets.map((set, index) => (
          <div 
            key={set.id} 
            className="library-item"
            draggable
            onDragStart={(e) => handleDragStart(e, index, set)}
            onDragEnd={handleDragEnd}
            onClick={() => handleItemSelect(set, 'set')}
          >
            <h4>{set.title}</h4>
            <p>{Math.floor(set.time / 60)}:{set.time % 60 < 10 ? '0' + set.time % 60 : set.time % 60} | {set.theme}</p>
            <div className="item-drag-handle">⋮⋮</div>
          </div>
        ));
      case 'specials':
        return specials.map((special, index) => (
          <div 
            key={special.id} 
            className="library-item"
            draggable
            onDragStart={(e) => handleDragStart(e, index, special)}
            onDragEnd={handleDragEnd}
            onClick={() => handleItemSelect(special, 'special')}
          >
            <h4>{special.title}</h4>
            <p>{Math.floor(special.time / 60)}:{special.time % 60 < 10 ? '0' + special.time % 60 : special.time % 60} | {special.theme}</p>
            <div className="item-drag-handle">⋮⋮</div>
          </div>
        ));
      default:
        return null;
    }
  };

  // Render analysis panel content based on current tab
  const renderAnalysisContent = () => {
    switch(currentAnalysisTab) {
      case 'technique':
        return (
          <div className="analysis-content">
            <h3>Technique Analysis</h3>
            <p>Primary technique: {selectedJoke ? selectedJoke.technique : 'N/A'}</p>
            <div className="technique-breakdown">
              <div className="technique-item">
                <span>Misdirection/Surprise</span>
                <div className="meter">
                  <div className="meter-fill" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="technique-item">
                <span>Wordplay</span>
                <div className="meter">
                  <div className="meter-fill" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div className="technique-item">
                <span>Self-Deprecation</span>
                <div className="meter">
                  <div className="meter-fill" style={{ width: '27%' }}></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'structure':
        return (
          <div className="analysis-content">
            <h3>Structure Analysis</h3>
            <p>Setup to punchline ratio: 70% / 30%</p>
            <p>Timing estimate: {selectedJoke ? selectedJoke.time : 'N/A'} seconds</p>
          </div>
        );
      case 'audience':
        return (
          <div className="analysis-content">
            <h3>Audience Analysis</h3>
            <p>Demographic appeal: General adult audience</p>
            <p>Potential sensitivities: Low</p>
          </div>
        );
      case 'psychology':
        return (
          <div className="analysis-content">
            <h3>Psychological Analysis</h3>
            <p>Cognitive dissonance level: Medium</p>
            <p>Recognition factor: High</p>
          </div>
        );
      case 'language':
        return (
          <div className="analysis-content">
            <h3>Language Analysis</h3>
            <p>Word economy: {selectedJoke ? selectedJoke.economy : 'N/A'}%</p>
            <p>Rhythm and cadence: Natural</p>
          </div>
        );
      case 'flow':
        return (
          <div className="analysis-content">
            <h3>Flow Analysis</h3>
            <p>Energy trajectory: Builds gradually</p>
            <p>Transition strength: Medium</p>
          </div>
        );
      case 'themes':
        return (
          <div className="analysis-content">
            <h3>Thematic Analysis</h3>
            <p>Primary themes: Relationships, Self-image</p>
            <p>Theme development: Sequential</p>
          </div>
        );
      case 'callbacks':
        return (
          <div className="analysis-content">
            <h3>Callback Opportunities</h3>
            <p>Potential callback elements: 3 identified</p>
            <p>Callback integration: Moderate potential</p>
          </div>
        );
      case 'vision':
        return (
          <div className="analysis-content">
            <h3>Artistic Vision Analysis</h3>
            <p>Thematic cohesion: Strong central message</p>
            <p>Cultural positioning: Contemporary relevance</p>
          </div>
        );
      case 'impact':
        return (
          <div className="analysis-content">
            <h3>Impact Analysis</h3>
            <p>Emotional resonance: Medium-High</p>
            <p>Memorability factors: Visual imagery, relatable premise</p>
          </div>
        );
      default:
        return (
          <div className="analysis-content">
            <h3>Analysis</h3>
            <p>Select an analysis type from the tabs above.</p>
          </div>
        );
    }
  };

  // Render assembly area based on current level
  const renderAssemblyArea = () => {
    switch(currentLevel) {
      case 1: // Jokes
        return (
          <div className="level1-assembly">
            {selectedJoke ? (
              <>
                <div className="joke-setup">
                  <label>SETUP</label>
                  <div className="setup-box" contentEditable suppressContentEditableWarning={true}>{selectedJoke.setup}</div>
                </div>
                <div className="joke-punchline">
                  <label>PUNCHLINE</label>
                  <div className="punchline-box" contentEditable suppressContentEditableWarning={true}>{selectedJoke.punchline}</div>
                </div>
                <div className="joke-metrics">
                  <p>Word Economy Score: {selectedJoke.economy}%</p>
                  <div className="economy-bar">
                    <div className="economy-fill" style={{ width: `${selectedJoke.economy}%` }}></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-assembly">
                <p>Select a joke from the library or drag one here</p>
              </div>
            )}
          </div>
        );
      case 2: // Bits
        return (
          <div className="level2-assembly">
            {selectedBit ? (
              <>
                <div className="bit-header">
                  <h3 contentEditable suppressContentEditableWarning={true}>{selectedBit.title}</h3>
                  <p>Estimated Time: {Math.floor(selectedBit.time / 60)}:{selectedBit.time % 60 < 10 ? '0' + selectedBit.time % 60 : selectedBit.time % 60}</p>
                </div>
                <div className="bit-jokes-container">
                  {selectedBit.jokeIds.map((jokeId, index) => {
                    const joke = jokes.find(j => j.id === jokeId);
                    return joke ? (
                      <div key={joke.id} 
                           className="bit-joke-wrapper"
                           draggable
                           onDragStart={(e) => handleDragStart(e, index, joke)}
                           onDragEnter={(e) => handleDragEnter(e, index)}
                           onDragLeave={handleDragLeave}
                           onDragEnd={handleDragEnd}
                           onDragOver={handleDragOver}
                           onDrop={(e) => {
                             // Handle reordering jokes in bit
                             if (dragItem.current !== null && dragOverItem.current !== null) {
                               const newJokeIds = [...selectedBit.jokeIds];
                               const newSegues = [...selectedBit.segues];
                               
                               const [movedJokeId] = newJokeIds.splice(dragItem.current, 1);
                               newJokeIds.splice(dragOverItem.current, 0, movedJokeId);
                               
                               if (dragItem.current < selectedBit.segues.length) {
                                 const [movedSegue] = newSegues.splice(dragItem.current, 1);
                                 if (dragOverItem.current <= newSegues.length) {
                                   newSegues.splice(dragOverItem.current, 0, movedSegue);
                                 }
                               }
                               
                               const updatedBits = bits.map(b => 
                                 b.id === selectedBit.id 
                                   ? {...b, jokeIds: newJokeIds, segues: newSegues} 
                                   : b
                               );
                               
                               setBits(updatedBits);
                               setSelectedBit({...selectedBit, jokeIds: newJokeIds, segues: newSegues});
                             }
                           }}
                      >
                        <div className="bit-joke">
                          <div className="joke-handle">☰</div>
                          <div className="joke-content">
                            <h4>{index + 1}. {joke.title}</h4>
                            <p>{joke.technique} | {joke.time} sec</p>
                          </div>
                          <div className="joke-remove" onClick={() => {
                            // Remove joke from bit
                            const newJokeIds = [...selectedBit.jokeIds];
                            const newSegues = [...selectedBit.segues];
                            const idx = newJokeIds.indexOf(jokeId);
                            
                            if (idx !== -1) {
                              newJokeIds.splice(idx, 1);
                              if (idx < newSegues.length) {
                                newSegues.splice(idx, 1);
                              }
                              
                              const updatedBits = bits.map(b => 
                                b.id === selectedBit.id 
                                  ? {...b, jokeIds: newJokeIds, segues: newSegues} 
                                  : b
                              );
                              
                              setBits(updatedBits);
                              setSelectedBit({...selectedBit, jokeIds: newJokeIds, segues: newSegues});
                            }
                          }}>✕</div>
                        </div>
                        {index < selectedBit.jokeIds.length - 1 && (
                          <div className="bit-segue">
                            <textarea 
                              placeholder="Add segue..." 
                              value={selectedBit.segues[index] || ""}
                              onChange={(e) => {
                                const newSegues = [...selectedBit.segues];
                                newSegues[index] = e.target.value;
                                
                                const updatedBits = bits.map(b => 
                                  b.id === selectedBit.id 
                                    ? {...b, segues: newSegues} 
                                    : b
                                );
                                
                                setBits(updatedBits);
                                setSelectedBit({...selectedBit, segues: newSegues});
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
                <div 
                  className="bit-drop-zone" 
                  onDrop={(e) => handleDrop(e, 'bit-assembly')} 
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => e.target.classList.add('drag-over')}
                  onDragLeave={(e) => e.target.classList.remove('drag-over')}
                >
                  <p>Drag jokes here to add to bit</p>
                </div>
              </>
            ) : (
              <div className="empty-assembly">
                <p>Select a bit from the library or drag one here</p>
              </div>
            )}
          </div>
        );
      case 3: // Sets
        return (
          <div className="level3-assembly">
            {selectedSet ? (
              <>
                <div className="set-header">
                  <h3 contentEditable suppressContentEditableWarning={true}>{selectedSet.title}</h3>
                  <p>Estimated Time: {Math.floor(selectedSet.time / 60)}:{selectedSet.time % 60 < 10 ? '0' + selectedSet.time % 60 : selectedSet.time % 60}</p>
                </div>
                <div className="set-energy-map">
                  <div className="energy-labels">
                    <span>HIGH</span>
                    <span>MEDIUM</span>
                    <span>LOW</span>
                  </div>
                  <div className="energy-grid">
                    {selectedSet.bitIds.map((bitId, index) => {
                      const bit = bits.find(b => b.id === bitId);
                      return bit ? (
                        <div key={bit.id}
                             className="set-bit-wrapper"
                             draggable
                             onDragStart={(e) => handleDragStart(e, index, bit)}
                             onDragEnter={(e) => handleDragEnter(e, index)}
                             onDragLeave={handleDragLeave}
                             onDragEnd={handleDragEnd}
                             onDragOver={handleDragOver}
                             onDrop={(e) => {
                               // Handle reordering bits in set
                               if (dragItem.current !== null && dragOverItem.current !== null) {
                                 const newBitIds = [...selectedSet.bitIds];
                                 const newTransitions = [...selectedSet.transitions];
                                 
                                 const [movedBitId] = newBitIds.splice(dragItem.current, 1);
                                 newBitIds.splice(dragOverItem.current, 0, movedBitId);
                                 
                                 if (dragItem.current < selectedSet.transitions.length) {
                                   const [movedTransition] = newTransitions.splice(dragItem.current, 1);
                                   if (dragOverItem.current <= newTransitions.length) {
                                     newTransitions.splice(dragOverItem.current, 0, movedTransition);
                                   }
                                 }
                                 
                                 const updatedSets = sets.map(s => 
                                   s.id === selectedSet.id 
                                     ? {...s, bitIds: newBitIds, transitions: newTransitions} 
                                     : s
                                 );
                                 
                                 setSets(updatedSets);
                                 setSelectedSet({...selectedSet, bitIds: newBitIds, transitions: newTransitions});
                               }
                             }}
                        >
                          <div 
                            className={`set-bit energy-${bit.energy.toLowerCase()}`}
                            style={{ left: `${index * 150 + 20}px` }}
                          >
                            <div className="bit-handle">☰</div>
                            <div className="bit-content">
                              <h4>{bit.title}</h4>
                              <p>{Math.floor(bit.time / 60)}:{bit.time % 60 < 10 ? '0' + bit.time % 60 : bit.time % 60}</p>
                            </div>
                            <div className="bit-remove" onClick={() => {
                              // Remove bit from set
                              const newBitIds = [...selectedSet.bitIds];
                              const newTransitions = [...selectedSet.transitions];
                              const idx = newBitIds.indexOf(bitId);
                              
                              if (idx !== -1) {
                                newBitIds.splice(idx, 1);
                                if (idx < newTransitions.length) {
                                  newTransitions.splice(idx, 1);
                                }
                                
                                const updatedSets = sets.map(s => 
                                  s.id === selectedSet.id 
                                    ? {...s, bitIds: newBitIds, transitions: newTransitions} 
                                    : s
                                );
                                
                                setSets(updatedSets);
                                setSelectedSet({...selectedSet, bitIds: newBitIds, transitions: newTransitions});
                              }
                            }}>✕</div>
                          </div>
                          {index < selectedSet.bitIds.length - 1 && (
                            <div className="set-transition" style={{ left: `${index * 150 + 130}px` }}>
                              <textarea 
                                placeholder="Add transition..." 
                                value={selectedSet.transitions[index] || ""}
                                onChange={(e) => {
                                  const newTransitions = [...selectedSet.transitions];
                                  newTransitions[index] = e.target.value;
                                  
                                  const updatedSets = sets.map(s => 
                                    s.id === selectedSet.id 
                                      ? {...s, transitions: newTransitions} 
                                      : s
                                  );
                                  
                                  setSets(updatedSets);
                                  setSelectedSet({...selectedSet, transitions: newTransitions});
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div 
                  className="set-drop-zone" 
                  onDrop={(e) => handleDrop(e, 'set-assembly')} 
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => e.target.classList.add('drag-over')}
                  onDragLeave={(e) => e.target.classList.remove('drag-over')}
                  >
                    <p>Drag bits here to add to set</p>
                  </div>
                </>
              ) : (
                <div className="empty-assembly">
                  <p>Select a set from the library or drag one here</p>
                </div>
              )}
            </div>
          );
        case 4: // Specials
          return (
            <div className="level4-assembly">
              {selectedSpecial ? (
                <>
                  <div className="special-header">
                    <h3 contentEditable suppressContentEditableWarning={true}>{selectedSpecial.title}</h3>
                    <p>Estimated Time: {Math.floor(selectedSpecial.time / 60)}:{selectedSpecial.time % 60 < 10 ? '0' + selectedSpecial.time % 60 : selectedSpecial.time % 60}</p>
                  </div>
                  <div className="narrative-arc">
                    <div className="arc-labels">
                      <span>OPENING</span>
                      <span>CLOSING</span>
                    </div>
                    <div className="arc-visualization" 
                         onDrop={(e) => handleDrop(e, 'special-assembly')} 
                         onDragOver={handleDragOver}
                         onDragEnter={(e) => e.target.classList.add('drag-over')}
                         onDragLeave={(e) => e.target.classList.remove('drag-over')}>
                      <svg width="100%" height="150">
                        <path d="M50,120 Q150,50 250,100 Q350,150 450,30 Q550,10 650,50" 
                          stroke="#4285f4" strokeWidth="3" fill="none" />
                        
                        {selectedSpecial.setIds.map((setId, index) => {
                          const set = sets.find(s => s.id === setId);
                          // Position sets along the arc
                          const xPos = 50 + index * 200; 
                          const yPos = 120 - index * 30; 
                          
                          return set ? (
                            <g key={set.id}>
                              <rect 
                                x={xPos - 40} 
                                y={yPos - 30} 
                                width="80" 
                                height="60" 
                                rx="3" 
                                fill="#e6f2ff" 
                                stroke="#4285f4"
                                cursor="grab"
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleDragStart(e, index, set);
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation();
                                  handleDragEnd(e);
                                }}
                              />
                              <text x={xPos} y={yPos - 10} textAnchor="middle" fill="#333" fontSize="10">{set.title}</text>
                              <text x={xPos} y={yPos + 10} textAnchor="middle" fill="#666" fontSize="8">
                                {Math.floor(set.time / 60)}:{set.time % 60 < 10 ? '0' + set.time % 60 : set.time % 60}
                              </text>
                              <circle 
                                cx={xPos + 30} 
                                cy={yPos - 25} 
                                r="8" 
                                fill="#f44336" 
                                stroke="#fff"
                                cursor="pointer"
                                onClick={() => {
                                  // Remove set from special
                                  const newSetIds = [...selectedSpecial.setIds];
                                  const idx = newSetIds.indexOf(setId);
                                  
                                  if (idx !== -1) {
                                    newSetIds.splice(idx, 1);
                                    
                                    const updatedSpecials = specials.map(s => 
                                      s.id === selectedSpecial.id 
                                        ? {...s, setIds: newSetIds} 
                                        : s
                                    );
                                    
                                    setSpecials(updatedSpecials);
                                    setSelectedSpecial({...selectedSpecial, setIds: newSetIds});
                                  }
                                }}
                              />
                              <text x={xPos + 30} y={yPos - 22} textAnchor="middle" fill="#fff" fontSize="10">×</text>
                            </g>
                          ) : null;
                        })}
                      </svg>
                    </div>
                  </div>
                  <div 
                    className="special-drop-zone" 
                    onDrop={(e) => handleDrop(e, 'special-assembly')} 
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => e.target.classList.add('drag-over')}
                    onDragLeave={(e) => e.target.classList.remove('drag-over')}
                  >
                    <p>Drag sets here to add to special</p>
                  </div>
                </>
              ) : (
                <div className="empty-assembly">
                  <p>Select a special from the library or drag one here</p>
                </div>
              )}
            </div>
          );
        default:
          return null;
      }
    };
    
    return (
      <div className="app-container">
        {/* Level Selection */}
        <div className="level-selection">
          {[1, 2, 3, 4].map(level => (
            <button 
              key={level}
              className={`level-button ${currentLevel === level ? 'active' : ''}`}
              onClick={() => handleLevelChange(level)}
            >
              Level {level}: {getLevelName(level)}
            </button>
          ))}
        </div>
        
        {/* Input Material */}
        <div className="input-material">
          <div className="input-controls">
            <button className="input-button">Text</button>
            <button className="input-button">Voice</button>
            <button className="input-button">Upload</button>
            <button className="analyze-button" onClick={handleAnalyzeInput}>Analyze</button>
          </div>
          <textarea 
            className="input-text" 
            placeholder="Enter or paste your material here..."
            value={inputText}
            onChange={handleInputChange}
          ></textarea>
        </div>
        
        {/* Middle Section (Library and Assembly) */}
        <div className="middle-section">
          {/* Library */}
          <div className="library">
            <div className="library-header">
              <h2>Library</h2>
              <div className="library-tabs">
                <button 
                  className={`library-tab ${currentLibraryTab === 'jokes' ? 'active' : ''}`}
                  onClick={() => handleLibraryTabChange('jokes')}
                >
                  Jokes
                </button>
                <button 
                  className={`library-tab ${currentLibraryTab === 'bits' ? 'active' : ''}`}
                  onClick={() => handleLibraryTabChange('bits')}
                >
                  Bits
                </button>
                <button 
                  className={`library-tab ${currentLibraryTab === 'sets' ? 'active' : ''}`}
                  onClick={() => handleLibraryTabChange('sets')}
                >
                  Sets
                </button>
                <button 
                  className={`library-tab ${currentLibraryTab === 'specials' ? 'active' : ''}`}
                  onClick={() => handleLibraryTabChange('specials')}
                >
                  Specials
                </button>
              </div>
              <button className="create-new-button" onClick={handleCreateNew}>+ New</button>
            </div>
            <div className="library-content">
              {renderLibraryContent()}
            </div>
          </div>
          
          {/* Assembly */}
          <div className="assembly">
            <div className="assembly-header">
              <h2>Assembly - {getLevelName(currentLevel)}</h2>
            </div>
            <div className="assembly-content">
              {renderAssemblyArea()}
            </div>
          </div>
        </div>
        
        {/* Analysis */}
        <div className={`analysis ${showAnalysis ? 'expanded' : ''}`}>
          <div className="analysis-toggle" onClick={handleAnalyzeClick}>
            <h2>Analysis {showAnalysis ? '▼' : '▲'}</h2>
          </div>
          {showAnalysis && (
            <div className="analysis-panel">
              <div className="analysis-tabs">
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'technique' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('technique')}
                >
                  Technique
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'structure' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('structure')}
                >
                  Structure
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'audience' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('audience')}
                >
                  Audience
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'psychology' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('psychology')}
                >
                  Psychology
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'language' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('language')}
                >
                  Language
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'flow' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('flow')}
                >
                  Flow
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'themes' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('themes')}
                >
                  Themes
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'callbacks' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('callbacks')}
                >
                  Callbacks
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'vision' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('vision')}
                >
                  Vision
                </button>
                <button 
                  className={`analysis-tab ${currentAnalysisTab === 'impact' ? 'active' : ''}`}
                  onClick={() => handleAnalysisTabChange('impact')}
                >
                  Impact
                </button>
              </div>
              <div className="analysis-content-container">
                {renderAnalysisContent()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default App;