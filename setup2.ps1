# PowerShell Script to set up the Comedy Construction Engine project structure

# Create directory structure
$directories = @(
    "public",
    "src",
    "src/components",
    "src/components/JokeLevel",
    "src/components/BitLevel",
    "src/components/SetLevel",
    "src/components/SpecialLevel",
    "src/components/Library",
    "src/components/Input",
    "src/components/Analysis",
    "src/components/shared",
    "src/hooks",
    "src/utils",
    "src/styles"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "Created directory: $dir"
    } else {
        Write-Host "Directory already exists: $dir"
    }
}

# Create package.json
$packageJson = @'
{
  "name": "comedy-construction-engine",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
'@

# Create index.html
$indexHtml = @'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Comedy Construction Engine - Tool for analyzing and building comedy material" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Comedy Construction Engine</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
'@

# Create README.md
$readmeContent = @'
# Comedy Construction Engine

A tool for building and analyzing comedy material across multiple levels:
- Level 1: Jokes - atomic humor units
- Level 2: Bits - collections of related jokes
- Level 3: Sets - arranged bits with transitions
- Level 4: Specials - complete themed performances

## Features
- Block-based assembly interface
- Text analysis with color-coded feedback
- Audio analysis with laugh detection
- Drag-and-drop organization tools

## Installation

npm install
npm start


## Usage
1. Input your comedy material via text or audio
2. Analyze the structure and effectiveness
3. Organize into hierarchical components
4. Refine based on analysis feedback
'@

# Create .gitignore
$gitignoreContent = @'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# audio files
*.mp3
*.wav
*.ogg

# editor specific
.vscode/
.idea/
*.swp
*.swo
'@

# Create index.js
$indexJs = @'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
'@

# Create App.js with modular structure
$appJs = @'
import React, { useState, useRef } from 'react';
import './App.css';
import LibraryPanel from './components/Library/LibraryPanel';
import InputPanel from './components/Input/InputPanel';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import JokeAssembly from './components/JokeLevel/JokeAssembly';
import BitAssembly from './components/BitLevel/BitAssembly';
import SetAssembly from './components/SetLevel/SetAssembly';
import SpecialAssembly from './components/SpecialLevel/SpecialAssembly';

const App = () => {
  // Refs for drag and drop
  const dragItem = useRef();
  const dragOverItem = useRef();
  
  // State management
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentLibraryTab, setCurrentLibraryTab] = useState('jokes');
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Sample data states (these will be moved to context later)
  const [jokes, setJokes] = useState([
    { id: 1, title: 'Eyebrows Joke', technique: 'Wordplay', time: 12, economy: 85, 
      setup: 'I told my wife she was drawing her eyebrows too high.', 
      punchline: 'She looked surprised.' },
    { id: 2, title: 'Dating App Joke', technique: 'Self-Deprecation', time: 18, economy: 91, 
      setup: 'I tried a new dating app where you have to be honest about yourself.',
      punchline: "I've been single for 3 months now." },
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
  
  // Selected items
  const [selectedJoke, setSelectedJoke] = useState(null);
  const [selectedBit, setSelectedBit] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedSpecial, setSelectedSpecial] = useState(null);
  
  // Input material handling
  const [inputText, setInputText] = useState('');
  
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

  // Handlers
  const handleLevelChange = (level) => {
    setCurrentLevel(level);
    setShowAnalysis(false);
  };
  
  const handleLibraryTabChange = (tab) => {
    setCurrentLibraryTab(tab);
  };
  
  const handleAnalyzeClick = () => {
    setShowAnalysis(!showAnalysis);
  };
  
  // Render assembly area based on current level
  const renderAssemblyArea = () => {
    switch(currentLevel) {
      case 1: // Jokes
        return (
          <JokeAssembly 
            selectedJoke={selectedJoke} 
            setSelectedJoke={setSelectedJoke}
          />
        );
      case 2: // Bits
        return (
          <BitAssembly
            selectedBit={selectedBit}
            setSelectedBit={setSelectedBit}
            jokes={jokes}
            bits={bits}
            setBits={setBits}
            dragItem={dragItem}
            dragOverItem={dragOverItem}
          />
        );
      case 3: // Sets
        return (
          <SetAssembly
            selectedSet={selectedSet}
            setSelectedSet={setSelectedSet}
            bits={bits}
            sets={sets}
            setSets={setSets}
            dragItem={dragItem}
            dragOverItem={dragOverItem}
          />
        );
      case 4: // Specials
        return (
          <SpecialAssembly
            selectedSpecial={selectedSpecial}
            setSelectedSpecial={setSelectedSpecial}
            sets={sets}
            specials={specials}
            setSpecials={setSpecials}
            dragItem={dragItem}
            dragOverItem={dragOverItem}
          />
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
      <InputPanel 
        inputText={inputText}
        setInputText={setInputText}
        jokes={jokes}
        setJokes={setJokes}
      />
      
      {/* Middle Section (Library and Assembly) */}
      <div className="middle-section">
        {/* Library */}
        <LibraryPanel
          currentLibraryTab={currentLibraryTab}
          handleLibraryTabChange={handleLibraryTabChange}
          jokes={jokes}
          bits={bits}
          sets={sets}
          specials={specials}
          setJokes={setJokes}
          setBits={setBits}
          setSets={setSets}
          setSpecials={setSpecials}
          setSelectedJoke={setSelectedJoke}
          setSelectedBit={setSelectedBit}
          setSelectedSet={setSelectedSet}
          setSelectedSpecial={setSelectedSpecial}
          dragItem={dragItem}
        />
        
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
      <AnalysisPanel
        showAnalysis={showAnalysis}
        handleAnalyzeClick={handleAnalyzeClick}
        selectedJoke={selectedJoke}
        currentLevel={currentLevel}
      />
    </div>
  );
};
  
export default App;
'@

# Create component template for LibraryPanel
$libraryPanelJs = @'
import React from 'react';
import '../../styles/Library.css';

const LibraryPanel = ({ 
  currentLibraryTab, 
  handleLibraryTabChange,
  jokes,
  bits,
  sets,
  specials,
  setJokes,
  setBits,
  setSets,
  setSpecials,
  setSelectedJoke,
  setSelectedBit,
  setSelectedSet,
  setSelectedSpecial,
  dragItem
}) => {
  // Handlers
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

  // Handler for drag start
  const handleDragStart = (e, position, item) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.5";
    e.dataTransfer.setData("itemData", JSON.stringify(item));
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    dragItem.current = null;
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

  return (
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
  );
};

export default LibraryPanel;
'@

# Create component template for JokeAssembly
$jokeAssemblyJs = @'
import React from 'react';
import '../../styles/JokeAssembly.css';

const JokeAssembly = ({ selectedJoke, setSelectedJoke }) => {
  return (
    <div className="level1-assembly">
      {selectedJoke ? (
        <>
          <div className="joke-setup">
            <label>SETUP</label>
            <div 
              className="setup-box" 
              contentEditable 
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                setSelectedJoke({
                  ...selectedJoke,
                  setup: e.target.innerText
                });
              }}
            >
              {selectedJoke.setup}
            </div>
          </div>
          <div className="joke-punchline">
            <label>PUNCHLINE</label>
            <div 
              className="punchline-box" 
              contentEditable 
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                setSelectedJoke({
                  ...selectedJoke,
                  punchline: e.target.innerText
                });
              }}
            >
              {selectedJoke.punchline}
            </div>
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
};

export default JokeAssembly;
'@

# Create component template for InputPanel
$inputPanelJs = @'
import React from 'react';
import '../../styles/InputPanel.css';

const InputPanel = ({ inputText, setInputText, jokes, setJokes }) => {
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  
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

  return (
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
  );
};

export default InputPanel;
'@

# Create component template for AnalysisPanel
$analysisPanelJs = @'
import React, { useState } from 'react';
import '../../styles/AnalysisPanel.css';
import TextAnalysis from '../Analysis/TextAnalysis';

const AnalysisPanel = ({ showAnalysis, handleAnalyzeClick, selectedJoke, currentLevel }) => {
  const [currentAnalysisTab, setCurrentAnalysisTab] = useState('technique');
  
  const handleAnalysisTabChange = (tab) => {
    setCurrentAnalysisTab(tab);
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
      case 'text':
        return <TextAnalysis jokeText={selectedJoke ? `${selectedJoke.setup} ${selectedJoke.punchline}` : ''} />;
      case 'audience':
        return (
          <div className="analysis-content">
            <h3>Audience Analysis</h3>
            <p>Demographic appeal: General adult audience</p>
            <p>Potential sensitivities: Low</p>
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

  return (
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
              className={`analysis-tab ${currentAnalysisTab === 'text' ? 'active' : ''}`}
              onClick={() => handleAnalysisTabChange('text')}
            >
              Text Analysis
            </button>
            <button 
              className={`analysis-tab ${currentAnalysisTab === 'audience' ? 'active' : ''}`}
              onClick={() => handleAnalysisTabChange('audience')}
            >
              Audience
            </button>
          </div>
          <div className="analysis-content-container">
            {renderAnalysisContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
'@

# Create index.css
$indexCss = @'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
'@

# Create reportWebVitals.js
$reportWebVitalsJs = @'
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
'@

# Create style files
$appCss = @'
/* Comedy Construction Engine App Styles */

/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f7f9fc;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
}

h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
}

h3 {
  font-size: 1.1rem;
  font-weight: 500;
}

h4 {
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 5px;
}

/* Container */
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  gap: 15px;
}

/* Level Selection */
.level-selection {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.level-button {
  padding: 10px 15px;
  border-radius: 5px;
  background-color: #e1e5f0;
  color: #4a5568;
  font-weight: 500;
  transition: all 0.2s ease;
}

.level-button:hover {
  background-color: #d1d7e3;
}

.level-button.active {
  background-color: #4285f4;
  color: white;
}

/* Middle Section (Library and Assembly) */
.middle-section {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

/* Assembly */
.assembly {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.assembly-header {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.assembly-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

/* Empty Assembly States */
.empty-assembly {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  color: #a0aec0;
}

/* Drag and Drop */
.drag-over {
  background-color: #edf2fd !important;
  border-color: #4285f4 !important;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .middle-section {
    flex-direction: column;
  }
  
  .library {
    flex: 0 0 auto;
  }
  
  .library-content {
    max-height: 200px;
  }
}
'@

# Create Library.css
$libraryCss = @'
/* Library Styles */
.library {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.library-header {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.library-tabs {
  display: flex;
  gap: 5px;
  margin: 10px 0;
}

.library-tab {
  padding: 6px 12px;
  border-radius: 5px;
  color: #4a5568;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.library-tab:hover {
  background-color: #f1f5f9;
}

.library-tab.active {
  background-color: #edf2fd;
  color: #4285f4;
}

.create-new-button {
  display: block;
  width: 100%;
  padding: 8px;
  border: 1px dashed #cbd5e0;
  border-radius: 5px;
  color: #4285f4;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
}

.create-new-button:hover {
  background-color: #f8fafc;
  border-color: #a0aec0;
}

.library-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.library-item {
  position: relative;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: #f8fafc;
  cursor: grab;
  transition: all 0.2s ease;
}

.library-item:hover {
  background-color: #edf2fd;
  border-color: #d1ddfd;
  box-shadow: 0 2px 5px rgba(66, 133, 244, 0.1);
}

.library-item p {
  font-size: 0.85rem;
  color: #718096;
}

.item-drag-handle {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.85rem;
  color: #a0aec0;
}
'@

# Create InputPanel.css
$inputPanelCss = @'
/* Input Panel Styles */
.input-material {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.input-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input-button {
  padding: 8px 15px;
  border-radius: 5px;
  background-color: #edf2fd;
  color: #4285f4;
  font-weight: 500;
  transition: all 0.2s ease;
}

.input-button:hover {
  background-color: #d8e5fc;
}

.analyze-button {
  margin-left: auto;
  padding: 8px 15px;
  border-radius: 5px;
  background-color: #4285f4;
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;
}

.analyze-button:hover {
  background-color: #3b77db;
}

.input-text {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
}
'@

# Create JokeAssembly.css
$jokeAssemblyCss = @'
/* Joke Assembly Styles */
.level1-assembly {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.joke-setup, .joke-punchline {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.joke-setup label, .joke-punchline label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
}

.setup-box, .punchline-box {
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background-color: #f8fafc;
  min-height: 60px;
  font-size: 0.95rem;
  outline: none;
}

.setup-box:focus, .punchline-box:focus {
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.joke-metrics {
  margin-top: 20px;
}

.joke-metrics p {
  font-size: 0.9rem;
  color: #4a5568;
  margin-bottom: 8px;
}

.economy-bar {
  height: 10px;
  background-color: #e2e8f0;
  border-radius: 5px;
  overflow: hidden;
}

.economy-fill {
  height: 100%;
  background: linear-gradient(to right, #4285f4, #34a853);
  border-radius: 5px;
}
'@

# Create AnalysisPanel.css
$analysisPanelCss = @'
/* Analysis Panel Styles */
.analysis {
  border: 1px solid #e2e8f0;
  border-radius: 8px 8px 0 0;
  background-color: white;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}

.analysis-toggle {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #e2e8f0;
}

.analysis-toggle h2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
}

.analysis.expanded {
  flex: 0 0 300px;
}

.analysis-panel {
  display: flex;
  flex-direction: column;
  height: 300px;
}

.analysis-tabs {
  display: flex;
  overflow-x: auto;
  padding: 0 15px;
  border-bottom: 1px solid #e2e8f0;
}

.analysis-tab {
  padding: 10px 15px;
  color: #4a5568;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.analysis-tab:hover {
  color: #4285f4;
}

.analysis-tab.active {
  color: #4285f4;
  border-bottom-color: #4285f4;
}

.analysis-content-container {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.analysis-content h3 {
  margin-bottom: 15px;
  color: #4a5568;
}

.analysis-content p {
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: #4a5568;
}

.technique-breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.technique-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.technique-item span {
  flex: 0 0 120px;
  font-size: 0.85rem;
}

.meter {
  flex: 1;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(to right, #4285f4, #34a853);
  border-radius: 4px;
}
'@

# Create BitAssembly.js template
$bitAssemblyJs = @'
import React from 'react';
import '../../styles/BitAssembly.css';

const BitAssembly = ({
  selectedBit,
  setSelectedBit,
  jokes,
  bits,
  setBits,
  dragItem,
  dragOverItem
}) => {
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
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    
    if (!selectedBit) return;
    
    const draggedItemData = JSON.parse(e.dataTransfer.getData("itemData"));
    
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
  };

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
            onDrop={handleDrop} 
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
};

export default BitAssembly;
'@

# Create BitAssembly.css
$bitAssemblyCss = @'
/* Bit Assembly Styles */
.level2-assembly {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bit-header {
  margin-bottom: 20px;
}

.bit-header h3 {
  font-size: 1.2rem;
  margin-bottom: 5px;
  outline: none;
}

.bit-header h3:focus {
  border-bottom: 2px solid #4285f4;
}

.bit-header p {
  font-size: 0.9rem;
  color: #718096;
}

.bit-jokes-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bit-joke-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bit-joke {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: grab;
}

.joke-handle {
  margin-right: 15px;
  color: #a0aec0;
  cursor: grab;
}

.joke-content {
  flex: 1;
}

.joke-content h4 {
  margin-bottom: 5px;
}

.joke-content p {
  font-size: 0.85rem;
  color: #718096;
}

.joke-remove {
  font-size: 1.1rem;
  color: #e53e3e;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.joke-remove:hover {
  opacity: 1;
}

.bit-segue {
  padding-left: 30px;
}

.bit-segue textarea {
  width: 100%;
  height: 60px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  resize: none;
  font-family: inherit;
  font-size: 0.9rem;
}

.bit-drop-zone {
  margin-top: 20px;
  padding: 20px;
  border: 2px dashed #cbd5e0;
  border-radius: 6px;
  text-align: center;
  color: #718096;
  transition: all 0.2s ease;
}

.bit-drop-zone.drag-over {
  background-color: #edf2fd;
  border-color: #4285f4;
}
'@

# Create SetAssembly.js template
$setAssemblyJs = @'
import React from 'react';
import '../../styles/SetAssembly.css';

const SetAssembly = ({
  selectedSet,
  setSelectedSet,
  bits,
  sets,
  setSets,
  dragItem,
  dragOverItem
}) => {
  // Add your implementation here similar to BitAssembly
  
  return (
    <div className="level3-assembly">
      {selectedSet ? (
        <div className="empty-assembly">
          <p>Set Assembly implementation coming soon</p>
        </div>
      ) : (
        <div className="empty-assembly">
          <p>Select a set from the library or drag one here</p>
        </div>
      )}
    </div>
  );
};

export default SetAssembly;
'@

# Create SpecialAssembly.js template
$specialAssemblyJs = @'
import React from 'react';
import '../../styles/SpecialAssembly.css';

const SpecialAssembly = ({
  selectedSpecial,
  setSelectedSpecial,
  sets,
  specials,
  setSpecials,
  dragItem,
  dragOverItem
}) => {
  // Add your implementation here similar to BitAssembly
  
  return (
    <div className="level4-assembly">
      {selectedSpecial ? (
        <div className="empty-assembly">
          <p>Special Assembly implementation coming soon</p>
        </div>
      ) : (
        <div className="empty-assembly">
          <p>Select a special from the library or drag one here</p>
        </div>
      )}
    </div>
  );
};

export default SpecialAssembly;
'@

# Create placeholder CSS files
$setAssemblyCss = @'
/* Set Assembly Styles - To be implemented */
.level3-assembly {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
'@

$specialAssemblyCss = @'
/* Special Assembly Styles - To be implemented */
.level4-assembly {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
'@

# File creation mapping for new components and styles
$componentFiles = @{
    "src/App.js" = $appJs
    "src/index.js" = $indexJs
    "src/reportWebVitals.js" = $reportWebVitalsJs
    "src/index.css" = $indexCss
    "src/App.css" = $appCss
    "src/components/Library/LibraryPanel.js" = $libraryPanelJs
    "src/components/JokeLevel/JokeAssembly.js" = $jokeAssemblyJs
    "src/components/Input/InputPanel.js" = $inputPanelJs
    "src/components/Analysis/AnalysisPanel.js" = $analysisPanelJs
    "src/components/BitLevel/BitAssembly.js" = $bitAssemblyJs
    "src/components/SetLevel/SetAssembly.js" = $setAssemblyJs
    "src/components/SpecialLevel/SpecialAssembly.js" = $specialAssemblyJs
    "src/styles/Library.css" = $libraryCss
    "src/styles/JokeAssembly.css" = $jokeAssemblyCss
    "src/styles/InputPanel.css" = $inputPanelCss
    "src/styles/AnalysisPanel.css" = $analysisPanelCss
    "src/styles/BitAssembly.css" = $bitAssemblyCss
    "src/styles/SetAssembly.css" = $setAssemblyCss
    "src/styles/SpecialAssembly.css" = $specialAssemblyCss
}

# Create each component file
foreach ($file in $componentFiles.Keys) {
    $filePath = $file
    $content = $componentFiles[$file]
    
    # Create directory if it doesn't exist
    $directory = Split-Path $filePath
    if ($directory -and -not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
        Write-Host "Created directory: $directory"
    }
    
    # Create file
    Set-Content -Path $filePath -Value $content -Force
    Write-Host "Created file: $filePath"
}

# Copy existing TextAnalysis.js if it exists
$textAnalysisSource = "src/components/Analysis/TextAnalysis.js"
if (Test-Path $textAnalysisSource) {
    Write-Host "TextAnalysis.js exists, leaving it as is"
} else {
    # Create placeholder TextAnalysis.js if it doesn't exist
    $textAnalysisJs = @'
import React, { useState, useEffect } from 'react';
import '../../styles/Analysis.css';

const TextAnalysis = ({ jokeText }) => {
  const [analyzedText, setAnalyzedText] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (jokeText) {
      analyzeJokeText(jokeText);
    }
  }, [jokeText]);

  const analyzeJokeText = async (text) => {
    setIsAnalyzing(true);
    
    try {
      // Simple demo analysis - to be enhanced later
      const words = text.split(/\s+/);
      const result = [];
      
      words.forEach((word, index) => {
        // Simplified analysis based on position
        const setupThreshold = Math.floor(words.length * 0.7);
        const isSetup = index < setupThreshold;
        
        let category;
        if (isSetup) {
          category = Math.random() > 0.5 ? 'strong-setup' : 'acceptable-setup';
        } else {
          category = Math.random() > 0.5 ? 'strong-punchline' : 'acceptable-punchline';
        }
        
        // Mark some words as unnecessary
        if (['the', 'a', 'an', 'and', 'but'].includes(word.toLowerCase()) && Math.random() > 0.7) {
          category = 'unnecessary';
        }
        
        result.push({ word, category });
      });
      
      setAnalyzedText(result);
    } catch (error) {
      console.error('Error analyzing joke text:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <div className="analyzing">Analyzing joke structure...</div>;
  }

  if (!analyzedText.length) {
    return <div className="empty-analysis">Select a joke to analyze its text structure</div>;
  }

  return (
    <div className="text-analysis">
      <h3>Joke Text Analysis</h3>
      
      <div className="color-legend">
        <div className="legend-item"><span className="color-box unnecessary"></span> Unnecessary</div>
        <div className="legend-item"><span className="color-box acceptable-setup"></span> Acceptable Setup</div>
        <div className="legend-item"><span className="color-box strong-setup"></span> Strong Setup</div>
        <div className="legend-item"><span className="color-box acceptable-punchline"></span> Acceptable Punchline</div>
        <div className="legend-item"><span className="color-box strong-punchline"></span> Strong Punchline</div>
      </div>
      
      <div className="analyzed-text">
        {analyzedText.map((item, index) => (
          <span 
            key={index} 
            className={`word ${item.category}`}
            title={item.category.replace('-', ' ')}
          >
            {item.word}{' '}
          </span>
        ))}
      </div>
      
      <div className="analysis-summary">
        <h4>Joke Structure Summary</h4>
        <div className="metrics">
          <div className="metric">
            <span>Setup Words:</span>
            <span>{analyzedText.filter(i => i.category.includes('setup')).length}</span>
          </div>
          <div className="metric">
            <span>Punchline Words:</span>
            <span>{analyzedText.filter(i => i.category.includes('punchline')).length}</span>
          </div>
          <div className="metric">
            <span>Unnecessary Words:</span>
            <span>{analyzedText.filter(i => i.category === 'unnecessary').length}</span>
          </div>
          <div className="metric">
            <span>Word Economy:</span>
            <span>
              {Math.round(
                (analyzedText.filter(i => i.category !== 'unnecessary').length / 
                analyzedText.length) * 100
              )}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnalysis;
'@
    
    Set-Content -Path $textAnalysisSource -Value $textAnalysisJs -Force
    Write-Host "Created file: $textAnalysisSource"
}

# Create Analysis.css
$analysisCss = @'
/* Analysis Styles */
.text-analysis {
    padding: 15px;
}
  
.analyzing {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #718096;
    font-style: italic;
}
  
.empty-analysis {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #718096;
}
  
.color-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
}
  
.legend-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
}
  
.color-box {
    width: 16px;
    height: 16px;
    margin-right: 6px;
    border-radius: 3px;
}
  
.color-box.unnecessary {
    background-color: #fc8181; /* Red */
}
  
.color-box.acceptable-setup {
    background-color: #90cdf4; /* Light Blue */
}
  
.color-box.strong-setup {
    background-color: #3182ce; /* Dark Blue */
}
  
.color-box.acceptable-punchline {
    background-color: #9ae6b4; /* Light Green */
}
  
.color-box.strong-punchline {
    background-color: #38a169; /* Dark Green */
}
  
.analyzed-text {
    padding: 15px;
    line-height: 1.8;
    background-color: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 20px;
    min-height: 100px;
}
  
.word {
    display: inline;
    padding: 2px 0;
    border-radius: 3px;
    cursor: default;
    transition: background-color 0.3s ease;
}
  
.word.unnecessary {
    background-color: #fc8181; /* Red */
    color: #fff;
}
  
.word.acceptable-setup {
    background-color: #90cdf4; /* Light Blue */
}
  
.word.strong-setup {
    background-color: #3182ce; /* Dark Blue */
    color: #fff;
}
  
.word.acceptable-punchline {
    background-color: #9ae6b4; /* Light Green */
}
  
.word.strong-punchline {
    background-color: #38a169; /* Dark Green */
    color: #fff;
}
  
.analysis-summary {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 15px;
}
  
.analysis-summary h4 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1rem;
}
  
.metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
  
.metric {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
}
'@

Set-Content -Path "src/styles/Analysis.css" -Value $analysisCss -Force
Write-Host "Created file: src/styles/Analysis.css"

# Create BlockElement component and related files
$blockElementJs = @'
import React from 'react';
import '../../styles/Block.css';

const BlockElement = ({ 
  type, 
  content, 
  onEdit, 
  draggable = true,
  selected = false,
  onSelect
}) => {
  return (
    <div 
      className={`block block-${type} ${selected ? 'selected' : ''}`}
      draggable={draggable}
      onClick={() => onSelect && onSelect()}
    >
      <div className="block-header">
        <span className="block-type">{type}</span>
        <div className="block-handle">⋮⋮</div>
      </div>
      <div className="block-content">
        {content}
      </div>
    </div>
  );
};

export default BlockElement;
'@

$blockCss = @'
/* Block Element Styles */
.block {
  position: relative;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: #f8fafc;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.block.selected {
  border-color: #4285f4;
  box-shadow: 0 0 0 1px rgba(66, 133, 244, 0.5);
}

.block:hover {
  background-color: #edf2fd;
  border-color: #d1ddfd;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.block-type {
  font-size: 0.7rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block-handle {
  cursor: grab;
  color: #a0aec0;
  font-size: 0.8rem;
}

.block-content {
  padding: 5px 0;
}

.block-setup .block-content {
  color: #2b6cb0;
}

.block-punchline .block-content {
  color: #2f855a;
  font-weight: 500;
}

.block-transition .block-content {
  color: #805ad5;
  font-style: italic;
}
'@

# Create directory if it doesn't exist
$blockElementDir = "src/components/shared"
if ($blockElementDir -and -not (Test-Path $blockElementDir)) {
    New-Item -ItemType Directory -Path $blockElementDir -Force | Out-Null
    Write-Host "Created directory: $blockElementDir"
}

Set-Content -Path "src/components/shared/BlockElement.js" -Value $blockElementJs -Force
Write-Host "Created file: src/components/shared/BlockElement.js"

Set-Content -Path "src/styles/Block.css" -Value $blockCss -Force
Write-Host "Created file: src/styles/Block.css"

