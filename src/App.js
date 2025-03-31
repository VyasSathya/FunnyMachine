import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import libraryData from "./mockData/library"; // Assuming './mockData/library.js' exists
import BlockComponent from "./components/BlockComponent.jsx";
import MediaUpload from "./components/MediaUpload.jsx";
import OrganizedMaterialEditor from "./components/InputPanel/OrganizedMaterialEditor.jsx"; // Renamed for clarity
import PunchlineOptimizer from './components/Tools/PunchlineOptimizer';
import JokeAnalysis from './components/Analysis/JokeAnalysis'; // Import the JokeAnalysis component
import RawTextImporter from './components/InputPanel/RawTextImporter.jsx'; // <-- Import the new component
import JokeBuilder from './components/InputPanel/JokeBuilder.jsx'; // <-- Import JokeBuilder
import JokeEditor from './components/EditorPanel/JokeEditor.jsx'; // <-- Import JokeEditor

// --- Constants ---
const availableModels = [ "gpt-4", "gpt-3.5-turbo", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "gemini-pro" ];
const improvementActionsConfig = {
  joke: ["Punchline Optimizer", "Joke Analysis", "Tag Generator"], // Added Joke Analysis
  bit: ["Flow Analyzer"],
};
const categories = ["special", "set", "bit", "joke", "idea"];
const typeColors = {
  special: "#fecaca", set: "#fed7aa", bit: "#fde68a",
  joke: "#bbf7d0", idea: "#bfdbfe", default: "#e5e7eb"
};
const validParentChildTypes = {
  special: ['set'], set: ['bit'], bit: ['joke', 'bit'], joke: ['idea'], idea: ['idea']
};

// --- Utility Functions ---
// Ensure these are complete and correct
function findParent(root, targetId, parent = null) { if (!root) return null; if (root.id === targetId) return parent; if (root.children) { for (const c of root.children) { const f = findParent(c, targetId, root); if (f) return f; } } return null; }
function removeFromParent(root, targetId) { if (!root) return false; if (root.children) { const l = root.children.length; root.children = root.children.filter(c => c.id !== targetId); if (root.children.length < l) return true; for (const c of root.children) { if (removeFromParent(c, targetId)) return true; } } return false; }
const findNode = (node, id) => { if (!node) return null; if (node.id === id) return node; if (node.children) { for (const c of node.children) { const f = findNode(c, id); if (f) return f; } } return null; };
function computeLevel(root, targetId, currentLevel = 0) { if (!root) return -1; if (root.id === targetId) return currentLevel; if (root.children) { for (const c of root.children) { const l = computeLevel(c, targetId, currentLevel + 1); if (l !== -1) return l; } } return -1; }
function canNest(pT, cT) { if (!pT) return false; const a = validParentChildTypes[pT]; if (!a || !a.includes(cT)) { console.warn(`Nesting Check Failed: ${cT} in ${pT}`); return false; } return true; }
const checkCircular = (n, tId) => { if (!n) return false; if (n.id === tId) return true; if (n.children) { return n.children.some(c => checkCircular(c, tId)); } return false; };
const generateId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// --- Component Definition ---
export default function App() {
  const defaultModel = availableModels.length > 0 ? availableModels[0] : "default-model-placeholder";
  // --- State ---
  const [library, setLibrary] = useState([]);
  const [activeLibCategory, setActiveLibCategory] = useState("all");
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [focusItem, setFocusItem] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState("builder");
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedAnalysisModel, setSelectedAnalysisModel] = useState(defaultModel);
  const [activeAiAction, setActiveAiAction] = useState(null);
  // Removed aiActionResults as results are handled within tools
  const [rightPanelTab, setRightPanelTab] = useState('import');
  const [transcriptionText, setTranscriptionText] = useState("");
  const [organizedResultForReview, setOrganizedResultForReview] = useState(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState("");
  const [lastError, setLastError] = useState("");
  const [isAnalyzingSelection, setIsAnalyzingSelection] = useState(false);
  const [jokeBuilderData, setJokeBuilderData] = useState(null);
  const [isParsingFullText, setIsParsingFullText] = useState(false);
  const [textSuggestions, setTextSuggestions] = useState(null);
  const [editingJokeItem, setEditingJokeItem] = useState(null);

  // --- Effects ---
   useEffect(() => { // Load initial data
     console.log("App initializing: Loading data...");
     const savedFocus = localStorage.getItem("comedyFocusItem");
     const savedLibrary = localStorage.getItem("comedyLibrary");
     try {
         if (savedFocus) { console.log("Found focus item"); setFocusItem(JSON.parse(savedFocus)); }
         setLibrary(savedLibrary ? JSON.parse(savedLibrary) : libraryData);
         console.log(`Lib loaded: ${savedLibrary ? JSON.parse(savedLibrary).length : libraryData.length} items.`);
     } catch (e) { console.error("Load Err",e);localStorage.clear();setLibrary(libraryData);setFocusItem(null); }
   }, []); // Runs only once on mount

   useEffect(() => { // Save library
       // console.log("Saving library to localStorage...");
       try { if (library && library.length >= 0) localStorage.setItem("comedyLibrary", JSON.stringify(library)); }
       catch(e){ console.error("Lib save error",e); setLastError("Lib Save Err"); }
   }, [library]);

   useEffect(() => { // Save focus item
     // console.log("Saving focus item to localStorage...");
     if (focusItem) {
       try {
         const data = JSON.stringify(focusItem);
         if (data.length > 4 * 1024 * 1024) { console.warn("Focus item too large."); setLastError("Warning: Item too large."); return; }
         localStorage.setItem("comedyFocusItem", data);
       } catch (e) { console.error("Focus save",e); setLastError("Focus Save Err"); }
     } else {
        // console.log("Clearing focus item from localStorage.");
        localStorage.removeItem("comedyFocusItem");
     }
   }, [focusItem]);

  useEffect(() => { // Reset analysis mode on focus change
    // console.log("Focus changed, reset analysis.");
    setAnalysisMode(false); setActiveAiAction(null);
  }, [focusItem]);

  // Auto-switch library tab based ONLY on focusItem change
  useEffect(() => {
    if (focusItem) {
        let childCategory = null;
        switch (focusItem.type) {
            case 'special': childCategory = 'set'; break;
            case 'set': childCategory = 'bit'; break;
            case 'bit': childCategory = 'joke'; break;
            case 'joke': childCategory = 'idea'; break;
            case 'idea': childCategory = 'idea'; break;
            default: childCategory = activeLibCategory;
        }
        if (childCategory && categories.includes(childCategory)) {
            if (childCategory !== activeLibCategory) { setActiveLibCategory(childCategory); }
        }
    }
  }, [focusItem]); // Only depends on focusItem

  // --- Handlers ---

  const handleDragStart = useCallback((e, item) => {
     console.log("DnD Start:", item?.id);
     try { const data = JSON.stringify(item); e.dataTransfer.setData("application/json", data); e.dataTransfer.effectAllowed = "move"; }
     catch (error) { console.error("Drag start error:", error); setLastError("Drag Err"); }
  }, []);

  const handleFocusDrop = useCallback((e) => {
     console.log("DnD Focus Drop");
     e.preventDefault();
     try { const data = e.dataTransfer.getData("application/json"); if (!data) { setLastError("Inv Drop"); return; }
        const droppedItem = JSON.parse(data); if (!focusItem || focusItem.id !== droppedItem.id) { setFocusItem(structuredClone(droppedItem)); setLastError(""); }
     } catch (error) { console.error("Focus drop error:", error); setLastError("Drop Err"); }
  }, [focusItem]);

  const handleDropIntoChild = useCallback((e, targetItem) => { // Nesting
      console.log(`DnD Nest Start: Drop ON target ${targetItem.id}`);
      e.preventDefault(); e.stopPropagation();
      if (!focusItem) { setLastError("No focus item."); return; }
      try {
          const draggedItemData = e.dataTransfer.getData("application/json"); if (!draggedItemData) { setLastError("Inv Nest Data"); return; }
          const draggedItem = JSON.parse(draggedItemData);
          console.log(`DnD Nest: Dragged ${draggedItem.id}`);
          if (draggedItem.id === targetItem.id) { setLastError("Cannot drop onto self."); setTimeout(() => setLastError(""), 3000); return; }
          if (checkCircular(draggedItem, targetItem.id)) { setLastError("Circular reference."); setTimeout(() => setLastError(""), 3000); return; }

          setFocusItem(currentFocus => {
              console.log("DnD Nest: Updating state...");
              if (!currentFocus) return null;
              const updatedFocus = structuredClone(currentFocus);
              const actualNewParent = findNode(updatedFocus, targetItem.id);
              if (!actualNewParent) { setLastError("Drop target node NF."); setTimeout(() => setLastError(""), 3000); return currentFocus; }

              if (!canNest(actualNewParent.type, draggedItem.type)) { setLastError(`Cannot nest '${draggedItem.type}' in '${actualNewParent.type}'.`); setTimeout(() => setLastError(""), 3000); return currentFocus; }
              const parentLevel = computeLevel(updatedFocus, actualNewParent.id);
              if (draggedItem.type === 'bit' && parentLevel >= 2) { setLastError("Max bit depth."); setTimeout(() => setLastError(""), 3000); return currentFocus; }

              const removed = removeFromParent(updatedFocus, draggedItem.id);
              console.log(`DnD Nest: remove ${draggedItem.id} result: ${removed}`);
              if (!removed) { console.warn(`Item ${draggedItem.id} NF for removal.`); }

              if (!actualNewParent.children) actualNewParent.children = [];
              const clonedDraggedItem = structuredClone(draggedItem);
              actualNewParent.children.push(clonedDraggedItem);
              console.log(`DnD Nest: Added ${clonedDraggedItem.id} to ${actualNewParent.id}. New children#: ${actualNewParent.children.length}`);

              setLastError(""); console.log("DnD Nest: Update success.");
              return updatedFocus;
          });
      } catch (error) { console.error("Drop into child error:", error); setLastError("Drop Err."); setTimeout(() => setLastError(""), 3000); }
  }, [focusItem]);

  const handleReorder = useCallback((e, targetParentItem, dropIndex) => { // Reordering
      console.log(`DnD Reorder Start: Target Parent ${targetParentItem.id}, Index ${dropIndex}`);
      e.preventDefault(); e.stopPropagation();
      if (!focusItem) { setLastError("No focus item."); return; }
      try {
          const draggedItemData = e.dataTransfer.getData("application/json"); if (!draggedItemData) { setLastError("Inv Reorder Data"); return; }
          const draggedItem = JSON.parse(draggedItemData);
          console.log(`DnD Reorder: Dragged ${draggedItem.id}`);
          if (draggedItem.id === targetParentItem.id && dropIndex === -1) { setLastError("Cannot reorder self."); return; }

          setFocusItem(currentFocus => {
              console.log("DnD Reorder: Updating state...");
              if (!currentFocus) return null;
              const updatedFocus = structuredClone(currentFocus);
              const actualTargetParent = findNode(updatedFocus, targetParentItem.id);
              if (!actualTargetParent) { setLastError("Reorder parent NF."); setTimeout(() => setLastError(""), 3000); return currentFocus; }
              if (!Array.isArray(actualTargetParent.children)) actualTargetParent.children = [];

              if (!canNest(actualTargetParent.type, draggedItem.type)) { setLastError(`Cannot place '${draggedItem.type}' in '${actualTargetParent.type}'.`); setTimeout(() => setLastError(""), 3000); return currentFocus; }
              const targetLevel = computeLevel(updatedFocus, actualTargetParent.id);
              if (draggedItem.type === 'bit' && targetLevel >= 2) { setLastError("Max bit depth target."); setTimeout(() => setLastError(""), 3000); return currentFocus; }

              const removed = removeFromParent(updatedFocus, draggedItem.id);
              console.log(`DnD Reorder: remove ${draggedItem.id} result: ${removed}`);
              if (!removed) { console.warn(`Item ${draggedItem.id} NF for removal reorder.`); }

              const itemToMove = structuredClone(draggedItem);
              const clampedIndex = Math.max(0, Math.min(dropIndex, actualTargetParent.children.length));
              actualTargetParent.children.splice(clampedIndex, 0, itemToMove);
              console.log(`DnD Reorder: Inserted ${itemToMove.id} into ${actualTargetParent.id} at ${clampedIndex}. New children#: ${actualTargetParent.children.length}`);

              setLastError(""); console.log("DnD Reorder: Update success.");
              return updatedFocus;
          });
      } catch (error) { console.error("Reorder error:", error); setLastError("Reorder Err."); setTimeout(() => setLastError(""), 3000); }
  }, [focusItem]);

   const handleRemoveChild = useCallback((target) => { // Removing item
     console.log(`Attempt remove: ${target.id}`);
     if (!focusItem) return;
     if (focusItem.id === target.id) { if (window.confirm(`⚠️ Remove focus item "${target.label||target.type}"?`)) { setFocusItem(null); setLastError("Focus removed."); setTimeout(()=>setLastError(""),3000); } return; }
     const nodeToRemove = findNode(focusItem, target.id);
     const childrenCount = nodeToRemove?.children?.length ?? 0;
     const msg = `Remove "${target.label||target.type}"${childrenCount > 0 ? ` and ${childrenCount} child(ren)` : ''}?`;
     if (window.confirm(msg)) {
         console.log(`Confirmed removal for ${target.id}`);
         setFocusItem(currentFocus => {
             if (!currentFocus) return null;
             const updated = structuredClone(currentFocus);
             const removed = removeFromParent(updated, target.id);
             if (removed) { console.log(`Removed ${target.id}`); setLastError(""); return updated; }
             else { console.error(`Failed remove ${target.id}`); setLastError("Not found to remove."); setTimeout(()=>setLastError(""),3000); return currentFocus; }
         });
     } else { console.log(`Removal cancelled for ${target.id}`); }
   }, [focusItem]);

  // Library & Input Handlers
  const refreshLibrary = () => { if(window.confirm("Reset library?")){ localStorage.clear(); setFocusItem(null); setLibrary(libraryData); setLastError("Lib Reset."); setTimeout(()=>setLastError(""),3000); }};
  const handleOrganizeText = async () => { if(!transcriptionText.trim()){setLastError("No text");return;} setLastError("Organizing..."); setIsOrganizing(true); setOrganizedResultForReview(null); try{ /* Call backend /api/organize */ await new Promise(r=>setTimeout(r,1000)); const d={bits:[{id:generateId('bit'),type:'bit',label:"AI Bit",children:[{id:generateId('joke'),type:'joke',text:`Joke from ${transcriptionText.substring(0,10)}...`,versions:[]}]}],highlights:[]}; setOrganizedResultForReview(d); setLastError(""); } catch(e){console.error(e);setLastError("Organize Fail"); setOrganizedResultForReview(null); } finally {setIsOrganizing(false);} };
  const handleSaveOrganized = async (editedData) => { if (!editedData?.bits){setLastError("No data");return;} console.log("Saving organized:", editedData); setLastError("Saving..."); try { await new Promise(r => setTimeout(r, 100)); setLibrary(currentLib => { let uL=[...currentLib]; let jA=[]; let bA=[]; const libMap=new Map(uL.map(i=>[i.id,i])); editedData.bits.forEach(b=>{ const bT={...structuredClone(b), children:[]}; (b.children||[]).forEach(jRef=>{ let jD=jRef; if(!jD.text&&jD.id){const fD=editedData.jokes?.find(j=>j.id===jD.id); if(fD)jD=fD; else{console.warn(`No data for joke ref ${jD.id}`); return;}} if(jD.type==='joke'&&jD.text){ let eId=null; try{ console.log(`Placeholder Sim Check: ${jD.text.substring(0,20)}`);/* Call /api/find-similar-joke */ } catch(e){console.error(e);} if(eId&&libMap.has(eId)){ console.log(`Found existing ${eId}`); const eJ=libMap.get(eId); const nV={id:generateId('ver'),text:jD.text,ts:new Date().toISOString()}; libMap.set(eId,{...eJ,versions:[...(eJ.versions||[]), nV]}); bT.children.push({id:eId,type:'joke'}); } else { const eNJ=jA.find(j=>j.text===jD.text); if(eNJ){ bT.children.push({id:eNJ.id,type:'joke'}); } else { const nJ={...jD,id:jD.id&&!jD.id.startsWith('review-')?jD.id:generateId('joke'),label:`Joke (${jD.text.substring(0,15)}...)`,versions:[]}; jA.push(nJ); libMap.set(nJ.id,nJ); bT.children.push({id:nJ.id,type:'joke'});}} } else if (jRef.type==='bit'){console.warn("Nested bits save NYI");}}); bA.push({...bT,id:bT.id&&!bT.id.startsWith('review-')?bT.id:generateId('bit')}); }); const finalLib=Array.from(libMap.values()); return [...finalLib, ...jA, ...bA]; }); setOrganizedResultForReview(null); setTranscriptionText(""); setLastError("Saved!"); setTimeout(()=>setLastError(""),3000); } catch(e){ console.error(e); setLastError("Save Err");}};
  const handleAddNewIdea = () => { if(!newIdeaText.trim()){setLastError("No idea text");return;} const nI={id:generateId('idea'),type:'idea',label:`Idea (${newIdeaText.substring(0,20)}...)`,text:newIdeaText,children:[]}; setLibrary(p=>[...p,nI]); setNewIdeaText(""); setLastError("Idea Added."); setTimeout(()=>setLastError(""),3000);};
  const handleTranscriptionUpload = (data, target) => { console.log("Upload:", data, "Target:", target); if(data?.transcription){ if (target === 'idea') { setNewIdeaText(p => p ? `${p}\n\n${data.transcription}`: data.transcription); } else { setTranscriptionText(p => p ? `${p}\n\n${data.transcription}`: data.transcription); } } setLastError("Upload Ok."); setTimeout(()=>setLastError(""),3000);};

  // Analysis Mode Handlers
  const enterAnalysisMode = () => { if(focusItem){setAnalysisMode(true);setActiveMainTab(null);setActiveAiAction(null);} };
  const exitAnalysisMode = () => { setAnalysisMode(false);setActiveMainTab('builder');setActiveAiAction(null);};
  const handleAiActionClick = (actionName) => { setActiveAiAction(actionName);};

  // Handler for analyzing selected text
  const handleAnalyzeSelection = useCallback(async (selectedText) => {
    if (!selectedText) return;
    console.log("App.js: Received selected text for analysis:", selectedText);
    setLastError('Analyzing selection...');
    setIsAnalyzingSelection(true);
    setJokeBuilderData(null); // Clear previous builder data

    try {
      // --- Call the new backend endpoint --- 
      const response = await fetch('http://localhost:3001/api/analyze-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: selectedText,
          // Optionally pass the selected model from UI state later
          // model: selectedAnalysisModel 
        }),
      });

      const analysisResult = await response.json();

      if (!response.ok) {
        throw new Error(analysisResult.error || `HTTP error! Status: ${response.status}`);
      }

      console.log("Backend analysis result:", analysisResult);

      // --- Open Joke Builder UI with real data --- 
      setJokeBuilderData(analysisResult); // Contains originalSelection, suggestedSetup, etc.
      setLastError('AI analysis complete. Review suggestions.');

    } catch (error) {
      console.error("Error analyzing selection:", error);
      setLastError(`Analysis failed: ${error.message}`);
      setJokeBuilderData(null);
    } finally {
      setIsAnalyzingSelection(false);
    }
  // TODO: Add selectedAnalysisModel to dependency array if used in fetch
  }, []); // Add dependencies like selectedAnalysisModel if needed

  // Handler for analyzing FULL text block (Populates focusItem with suggestions)
  const handleAnalyzeFullText = useCallback(async (fullText) => {
    if (!fullText) return;
    console.log("App.js: Analyzing full text block...");
    setLastError('Parsing text for jokes...');
    setIsParsingFullText(true);
    // setTextSuggestions(null); // No longer needed
    // setJokeBuilderData(null); // No longer needed
    setEditingJokeItem(null); // Ensure editor is closed
    setFocusItem(null); // Clear focus before loading suggestions

    try {
      const response = await fetch('http://localhost:3001/api/parse-text-for-jokes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: fullText }),
      });
      // ... check response, handle errors ...
      const result = await response.json();
      if (!response.ok) { throw new Error(result.error || `HTTP error! Status: ${response.status}`); }

      console.log("Backend parsing result:", result.suggestions);
      
      if (result.suggestions && result.suggestions.length > 0) {
        // Create temporary suggestion items
        const suggestionItems = result.suggestions.map((suggestion, index) => ({
          id: `suggestion-${Date.now()}-${index}`, // Temporary ID
          type: 'joke', // Treat as joke type for styling/logic
          status: 'suggestion', // Special status flag
          label: `Suggestion ${index + 1}`, // Temporary label
          text: `${suggestion.suggestedSetup || ''}\n${suggestion.suggestedPunchline || ''}`,
          analysis: {
            structure: {
              setup: suggestion.suggestedSetup || '',
              punchline: suggestion.suggestedPunchline || ''
            }
          },
          tags: suggestion.suggestedTags || [],
          _originalSnippet: suggestion.originalSnippet || null // Keep context
        }));

        // Create a temporary focus item to hold these suggestions
        const tempFocus = {
          id: 'suggestions-root',
          type: 'bit', // Represent the group as a temporary bit?
          label: 'Parsed Joke Suggestions',
          children: suggestionItems,
          // Add flag to indicate this is temporary?
          _isSuggestionRoot: true 
        };
        setFocusItem(tempFocus); // Set this temporary item as the focus
        setActiveMainTab('builder'); // Switch to builder view
        setLastError(`Found ${suggestionItems.length} suggestions. Review and Approve/Edit/Reject below.`);
      } else {
        setLastError('No distinct jokes found by AI.');
        setFocusItem(null); // Ensure focus is clear if no suggestions
      }

    } catch (error) {
      console.error("Error parsing full text:", error);
      setLastError(`Parsing failed: ${error.message}`);
      setFocusItem(null);
    } finally {
      setIsParsingFullText(false);
    }
  }, [/* dependencies */ setFocusItem, setLastError, setIsParsingFullText, setEditingJokeItem, setActiveMainTab]); // Added deps

  // --- RE-ADD: Handler for clicking a suggestion from the list ---
  const handleSuggestionClick = useCallback((suggestion) => {
    console.log("Suggestion clicked, loading middle panel editor:", suggestion);
    // Prepare data for the middle panel Editor (mark as new by omitting ID)
    const editorDataForNewJoke = {
      type: 'joke', 
      label: `New Joke from Suggestion...`, 
      analysis: { structure: { setup: suggestion.suggestedSetup || '', punchline: suggestion.suggestedPunchline || '' } },
      tags: suggestion.suggestedTags || [],
      _originalSnippet: suggestion.originalSnippet || null 
    };
    setEditingJokeItem(editorDataForNewJoke); // Set state for middle panel editor
    setTextSuggestions(null); // Hide suggestions list
    setLastError('Reviewing AI suggestion. Edit and save as new joke.');
  }, [setEditingJokeItem, setTextSuggestions, setLastError]); // Dependencies

  // --- UPDATED: Handler for edit request from BlockComponent ---
  // Renamed from handleEditJokeRequest
  const handleEditItem = useCallback((itemToEdit) => {
    console.log("App.js: Inline edit started for item:", itemToEdit.id);
    setLastError('Editing item inline...');
    setJokeBuilderData(null); 
    setTextSuggestions(null);
    // We actually don't need to set editingJokeItem here, BlockComponent handles its own state
  }, [setLastError, setJokeBuilderData, setTextSuggestions]);

  // --- NEW: Handler for starting edit on a SUGGESTION (optional, for notification) ---
  const handleEditSuggestion = useCallback((suggestionItem) => {
    console.log("App.js: Inline edit started for suggestion:", suggestionItem.id);
    setLastError('Editing suggestion inline...');
    setJokeBuilderData(null);
    setTextSuggestions(null);
  }, [setLastError, setJokeBuilderData, setTextSuggestions]);
  
  // --- Moved UP: Handler to save NEW joke (or merge into existing) ---
  const handleSaveJokeFromBuilder = useCallback((newJokePayload) => {
    const now = newJokePayload.timestamp || new Date().toISOString();
    const setup = newJokePayload.setup || '';
    const punchline = newJokePayload.punchline || '';
    const tags = newJokePayload.tags || [];
    const sourceSelection = newJokePayload.source_selection;

    const proposedText = `${setup}\n${punchline}`;
    const trimmedLowerProposedText = proposedText.trim().toLowerCase();

    // --- Similarity Check (using Canonical Text) --- 
    let existingJokeMatch = null;
    library.forEach(item => {
      if (item.type === 'joke' && item.canonicalText) {
        const trimmedLowerCanonical = item.canonicalText.trim().toLowerCase();
        if (trimmedLowerCanonical === trimmedLowerProposedText) {
          existingJokeMatch = item; // Found a canonical match
        }
      }
    });

    // --- Logic based on Match --- 
    if (existingJokeMatch) {
      console.log(`Canonical Match Found: Suggestion text matches canonical of existing joke ID: ${existingJokeMatch.id}`);
      
      setLibrary(currentLibrary => {
        const jokeIndex = currentLibrary.findIndex(item => item.id === existingJokeMatch.id);
        if (jokeIndex === -1) {
            console.error("Consistency Error: Matched joke not found in library state during update.");
            setLastError('Error: Could not update matched joke.');
            return currentLibrary; // Should not happen
        }

        const updatedLibrary = [...currentLibrary];
        const jokeToUpdate = structuredClone(updatedLibrary[jokeIndex]);
        const versions = jokeToUpdate.versions || [];
        let versionUpdated = false;

        // Check if an identical version already exists
        const existingVersionIndex = versions.findIndex(v => 
            (v.setup || '') === setup && 
            (v.punchline || '') === punchline
        );

        if (existingVersionIndex !== -1) {
            // Exact version text match found - update usageDates
            console.log(`Exact version text match found at index ${existingVersionIndex}. Updating usage dates.`);
            const updatedVersion = versions[existingVersionIndex];
            if (!Array.isArray(updatedVersion.usageDates)) {
                updatedVersion.usageDates = [];
            }
            // Only add date if not already present for this exact timestamp (unlikely but safe)
            if (!updatedVersion.usageDates.includes(now)) {
                 updatedVersion.usageDates.push(now);
                 updatedVersion.usageDates.sort((a, b) => new Date(b) - new Date(a)); // Keep sorted newest first
            }
            versions[existingVersionIndex] = updatedVersion;
            versionUpdated = true;
            setLastError(`Existing joke version updated with new usage date.`);

        } else {
            // No exact version match - create and add a new version
            console.log("No exact version text match found. Creating new version.");
            const newVersion = {
                id: `version-${now}-${Math.random().toString(16).slice(2)}`,
                timestamp: now,
                setup: setup,
                punchline: punchline,
                tags: tags,
                source_selection: sourceSelection, // Include source if available
                usageDates: [now] // Initialize usage dates
            };
            // Add to beginning (or end)
            versions.unshift(newVersion);
            versionUpdated = true;
            setLastError(`New version added to existing joke "${jokeToUpdate.label}".`);
        }

        // Update joke metadata and versions array
        jokeToUpdate.versions = versions;
        jokeToUpdate.metadata = {
            ...jokeToUpdate.metadata,
            last_modified: now
        };

        // Update the joke in the library
        updatedLibrary[jokeIndex] = jokeToUpdate;
        
        // Also update focus item if it's the one modified
        setFocusItem(currentFocus => {
            if (currentFocus && currentFocus.id === jokeToUpdate.id) {
                return structuredClone(jokeToUpdate);
            }
            return currentFocus;
        });
        
        return updatedLibrary;
      });
      setTimeout(() => setLastError(""), 4000);
      return; // Stop here, handled the match

    } else {
      // --- No Canonical Match - Create New Joke ---
      console.log("No canonical match found. Saving as new joke.");
      const firstVersion = {
        id: `version-${now}-${Math.random().toString(16).slice(2)}`,
        timestamp: now,
        setup: setup,
        punchline: punchline,
        tags: tags,
        source_selection: sourceSelection,
        usageDates: [now] // Add usageDates here too
      };
      const finalJoke = {
        id: `joke-${now}-${Math.random().toString(16).slice(2)}`,
        type: 'joke',
        label: `Joke (${(setup || punchline).substring(0, 15)}...)`,
        text: proposedText, 
        canonicalText: proposedText, // Set initial canonical text
        analysis: { structure: { setup: setup, punchline: punchline } },
        tags: tags,
        metadata: { creation_date: now, last_modified: now, is_starred: false },
        versions: [firstVersion]
      };
      console.log("Saving new joke:", finalJoke);
      setLibrary(currentLibrary => {
          if (currentLibrary.some(item => item.id === finalJoke.id)) {
              console.warn(`Joke ID ${finalJoke.id} collision.`);
              return currentLibrary;
          }
          return [...currentLibrary, finalJoke];
      });
      setLastError(`Joke "${finalJoke.label}" saved successfully!`);
      setActiveLibCategory('joke');
      setTimeout(() => setLastError(""), 4000);
    }
  }, [library, setLibrary, setFocusItem, setLastError, setActiveLibCategory]); // Added setFocusItem dependency

  // --- Handler to APPROVE a suggestion ---
  const handleApproveSuggestion = useCallback((suggestionData) => {
    console.log("App.js: Approving suggestion:", suggestionData);
    const jokePayload = {
        setup: suggestionData.setup || suggestionData.analysis?.structure?.setup || '',
        punchline: suggestionData.punchline || suggestionData.analysis?.structure?.punchline || '',
        tags: suggestionData.tags || [],
        timestamp: suggestionData.timestamp || new Date().toISOString(),
        source_selection: suggestionData._originalSnippet || null
    };
    // Calls the function defined above
    handleSaveJokeFromBuilder(jokePayload); 
    // Remove suggestion from the temporary focus list
    setFocusItem(currentFocus => {
        if (!currentFocus || !currentFocus._isSuggestionRoot) return currentFocus;
        const updatedChildren = (currentFocus.children || []).filter(child => child.id !== suggestionData.id);
        if (updatedChildren.length === 0) return null;
        return { ...currentFocus, children: updatedChildren };
    });
  // Now the dependency is defined before this function
  }, [handleSaveJokeFromBuilder, setFocusItem]); 

  // --- Handler to REJECT a suggestion ---
  const handleRejectSuggestion = useCallback((suggestionId) => {
    console.log("App.js: Rejecting suggestion:", suggestionId);
    setFocusItem(currentFocus => {
        if (!currentFocus || !currentFocus._isSuggestionRoot) return currentFocus;
        const updatedChildren = (currentFocus.children || []).filter(child => child.id !== suggestionId);
        if (updatedChildren.length === 0) return null;
        return { ...currentFocus, children: updatedChildren };
    });
    setLastError('Suggestion rejected.');
    setTimeout(() => setLastError(""), 2000);
  }, [setFocusItem, setLastError]);

  // Handler to UPDATE existing joke (from inline editor) 
  const handleUpdateItemInline = useCallback((updatedData) => {
    const { jokeId, setup, punchline, tags } = updatedData;
    console.log(`App.js: Updating joke ID from inline editor: ${jokeId}`);
    
    let finalUpdatedJoke = null; // Variable to hold the updated joke data

    setLibrary(currentLibrary => {
      const jokeIndex = currentLibrary.findIndex(item => item.id === jokeId && item.type === 'joke');
      if (jokeIndex === -1) { 
        console.error(`Update Error: Joke with ID ${jokeId} not found.`);
        setLastError('Failed to update: Joke not found.');
        return currentLibrary; 
      }

      const updatedLibrary = [...currentLibrary];
      const originalJoke = updatedLibrary[jokeIndex];
      const now = new Date().toISOString();

      // --- Create the new version --- 
      const newVersion = {
        id: `version-${now}-${Math.random().toString(16).slice(2)}`,
        timestamp: now, // Keep original creation timestamp for the edit event
        setup: setup || '', // Use updated data
        punchline: punchline || '', // Use updated data
        tags: tags || [], // Use updated data
        usageDates: [now] // Initialize usageDates with the creation time
      };

      // --- Create the updated joke object ---
      const updatedJoke = {
        ...originalJoke,
        text: `${setup || ''}\n${punchline || ''}`,
        analysis: { 
          ...originalJoke.analysis,
          structure: { setup: setup || '', punchline: punchline || '' }
        },
        tags: tags || [],
        metadata: {
          ...originalJoke.metadata,
          last_modified: now,
        },
        versions: [newVersion, ...(originalJoke.versions || [])]
      };

      // Store the result for focus update
      finalUpdatedJoke = updatedJoke; 

      updatedLibrary[jokeIndex] = updatedJoke;
      return updatedLibrary;
    });

    // Update focusItem AFTER library state update is processed
    // Use the 'finalUpdatedJoke' captured from the setLibrary update function
    if (finalUpdatedJoke) {
        setFocusItem(currentFocus => {
            if (currentFocus && currentFocus.id === jokeId) {
                // Return a clone of the directly updated joke data
                return structuredClone(finalUpdatedJoke); 
            }
            return currentFocus;
        });
    }

    setLastError(`Joke updated successfully!`);
    setTimeout(() => setLastError(""), 4000);
  // Dependencies remain the same, 'library' is no longer needed here for the focus update logic
  }, [setLibrary, setFocusItem, setLastError]); 

  // Handler to set the canonical text for a joke 
  const handleSetCanonicalText = useCallback((jokeId, versionText, versionTimestamp) => {
    if (!jokeId || typeof versionText !== 'string') return;

    console.log(`Setting canonical text for joke ${jokeId} from version ${versionTimestamp}`);
    
    setLibrary(currentLibrary => {
      const jokeIndex = currentLibrary.findIndex(item => item.id === jokeId && item.type === 'joke');
      if (jokeIndex === -1) {
        console.error(`Set Canonical Error: Joke with ID ${jokeId} not found.`);
        setLastError('Failed to set canonical text: Joke not found.');
        return currentLibrary; 
      }

      const updatedLibrary = [...currentLibrary];
      const originalJoke = updatedLibrary[jokeIndex];

      // Update only the canonicalText and last_modified
      const updatedJoke = {
        ...originalJoke,
        canonicalText: versionText,
        metadata: {
          ...originalJoke.metadata,
          last_modified: new Date().toISOString(), // Update modified time
        },
      };

      updatedLibrary[jokeIndex] = updatedJoke;
      return updatedLibrary;
    });

    // Optionally update focusItem if it's the one being changed
    setFocusItem(currentFocus => {
        if (currentFocus && currentFocus.id === jokeId) {
            return { ...currentFocus, canonicalText: versionText, metadata: { ...currentFocus.metadata, last_modified: new Date().toISOString() } };
        }
        return currentFocus;
    });

    setLastError(`Canonical text updated for joke.`);
    setTimeout(() => setLastError(""), 3000);

  }, [setLibrary, setFocusItem, setLastError]);

  // --- Render Functions ---
  const renderFilteredLibraryItems = () => {
    let items = library;

    // 1. Filter by Category (if not 'all')
    if (activeLibCategory !== "all") {
      items = items.filter(item => item.type === activeLibCategory);
    }

    // 2. Filter by Search Term (if any)
    if (librarySearchTerm.trim()) {
      const searchTermLower = librarySearchTerm.toLowerCase();
      items = items.filter(item => 
        (item.label && item.label.toLowerCase().includes(searchTermLower)) ||
        (item.text && item.text.toLowerCase().includes(searchTermLower)) ||
        (item.analysis?.structure?.setup && item.analysis.structure.setup.toLowerCase().includes(searchTermLower)) ||
        (item.analysis?.structure?.punchline && item.analysis.structure.punchline.toLowerCase().includes(searchTermLower))
      );
    }

    if (items.length === 0) {
       return <div className="library-empty">No items found{librarySearchTerm.trim() ? ' for "' + librarySearchTerm + '"' : ''}.</div>;
    }

    return items.map(item => ( 
      <button 
        key={item.id} 
        className={`btn library-item ${focusItem?.id === item.id ? 'focused' : ''}`} // Add focused class
        style={{ borderLeftColor: typeColors[item.type] || typeColors.default }} 
        draggable 
        onDragStart={(e) => handleDragStart(e, item)} 
        onClick={() => setFocusItem(structuredClone(item)) }
        title={item.label || '(Untitled)'}
      >
        {item.label || '(Untitled)'}
      </button> 
    ));
  };

  const renderTextTab = () => { if(!focusItem)return<div className="tool-desc">No item</div>; const l=[];const ex=(i)=>{if(!i)return; if(i.text&&(i.type==='joke'||i.type==='bit'))l.push(i.text); i.children?.forEach(ex);}; ex(focusItem); return<pre className="text-readout">{l.join("\n\n")||"(No text)"}</pre>;};

  // --- UPDATED: Render Versions Tab ---
  const renderVersionsTab = () => {
    if (!focusItem || !focusItem.versions || focusItem.versions.length === 0) {
      return <div className="tool-desc">No version history available for this item.</div>;
    }
    
    const sortedVersions = [...focusItem.versions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const currentCanonicalText = focusItem.canonicalText;

    return (
      <div className="versions-list" style={{ padding: '15px', overflowY: 'auto', height: 'calc(100% - 30px)' }}>
        <h4>Version History ({sortedVersions.length})</h4>
        <div style={{ marginBottom: '15px', padding: '10px', background: '#fff8dc', border: '1px solid #eee', borderRadius: '4px'}}>
            <strong style={{fontSize: '0.9em'}}>Canonical Text (for matching):</strong>
            <p style={{ margin: '5px 0 0 5px', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{currentCanonicalText || '(Not Set)'}</p>
        </div>

        {sortedVersions.map((version, index) => {
          const versionText = `${version.setup || ''}\n${version.punchline || ''}`;
          const isCanonical = versionText === currentCanonicalText;
          
          return (
            <div 
              key={version.id || `version-${index}`} 
              style={{
                marginBottom: '15px', 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '5px', 
                background: index === 0 ? '#f0fff0' : '#f9f9f9' // Highlight latest
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9em' }}>
                  Version {sortedVersions.length - index}
                  {index === 0 && <span style={{ marginLeft: '8px', color: 'green', fontWeight: 'bold' }}>(Latest)</span>}
                </strong>
                <span style={{ fontSize: '0.8em', color: '#555' }}>
                  {new Date(version.timestamp).toLocaleString()} 
                </span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85em' }}>Setup:</label>
                <p style={{ margin: '2px 0 0 5px', whiteSpace: 'pre-wrap' }}>{version.setup || '-'}</p>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85em' }}>Punchline:</label>
                <p style={{ margin: '2px 0 0 5px', whiteSpace: 'pre-wrap' }}>{version.punchline || '-'}</p>
              </div>
              {version.tags && version.tags.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '0.85em' }}>
                  <label style={{ fontWeight: '600'}}>Tags:</label>
                  <span style={{ marginLeft: '5px' }}>{version.tags.join(', ')}</span>
                </div>
              )}
              <div style={{ marginTop: '10px' }}>
                  <button 
                      className="btn btn-small" 
                      onClick={() => handleSetCanonicalText(focusItem.id, versionText, version.timestamp)}
                      disabled={isCanonical}
                      title={isCanonical ? "This version is the current canonical text" : "Set this version\'s text as the canonical version for matching"}
                  >
                      {isCanonical ? '✅ Is Canonical' : 'Set as Canonical Text'}
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- Main JSX ---
  return (
    <div className="layout">

      {/* Left Panel */}
      <div className="left-panel">
        <h2>📚 Library</h2>
        <div className="tab-buttons category-buttons">
           <button key="all" className={`btn btn-category ${activeLibCategory === 'all' ? "active" : ""}`} onClick={() => setActiveLibCategory('all')}>All</button>
           {categories.map(cat => ( <button key={cat} className={`btn btn-category ${cat === activeLibCategory ? "active" : ""}`} onClick={() => setActiveLibCategory(cat)}>{cat.charAt(0).toUpperCase() + cat.slice(1)}s</button> ))} 
        </div>
        <div className="library-search" style={{ padding: '5px 0 10px 0' }}>
            <input 
                type="text"
                placeholder={`Search ${activeLibCategory === 'all' ? 'all items' : activeLibCategory + 's'}...`}
                value={librarySearchTerm}
                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
        </div>
        <div className="library-items">
          {renderFilteredLibraryItems()}
        </div>
        <button className="btn refresh-btn" onClick={refreshLibrary}>🔄 Reset Library</button>
      </div>

      {/* Middle Panel */}
      <div className="middle-panel">
        {/* --- UPDATED Focus Bar --- */}
        <div className="focus-bar drop-zone" onDragOver={(e) => {e.preventDefault(); e.dataTransfer.dropEffect = "move";}} onDrop={handleFocusDrop}>
           <h3>🎯 {editingJokeItem ? 'Editing Joke' : 'Focused Material'}</h3>
           {editingJokeItem ? (
              // Show label of joke being edited
              <div className="focus-item-display"> 
                 <span><strong>{editingJokeItem.label || '(Untitled)'}</strong> ({editingJokeItem.type})</span>
              </div>
           ) : focusItem ? (
              // Original display for focused item
              <div className="focus-item-display"> 
                 <span><strong>{focusItem.label || '(Untitled)'}</strong> ({focusItem.type})</span> 
                 {!analysisMode && ( <button onClick={enterAnalysisMode} className="btn analyze-btn-global">Analyze ✨</button> )} 
              </div> 
           ) : (
              // Placeholder if nothing focused or editing 
              <div className="focus-placeholder">{analysisMode ? 'Analysis Mode' : 'Drag item here or select suggestion'}</div> 
           )}
        </div>

        {/* --- UPDATED Middle Panel Content --- */}
        <div className="middle-panel-content">
          {/* Always show TABS unless in Analysis Mode */} 
          {!analysisMode && (
              <div className="tab-buttons-container standard-tabs">
                  {["builder", "text", "versions"].map(tab => (
                      <button 
                          key={tab} 
                          className={`btn tab-btn ${activeMainTab === tab ? "active" : ""}`} 
                          onClick={() => {
                              setActiveMainTab(tab);
                              // If switching tabs while editing, cancel edit?
                              // Or keep editor active regardless of tab? For now, keep active.
                              // if (editingJokeItem) setEditingJokeItem(null); 
                          }}
                          // Disable other tabs while editing? Or allow switching?
                          // disabled={editingJokeItem && activeMainTab !== tab} 
                      >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                  ))}
              </div>
          )}

          {/* Main content area - renders Editor OR Tab Content OR Analysis */}
          <div className="tab-content" style={{ borderTop: !analysisMode ? '1px solid #ccc' : 'none', paddingTop: !analysisMode ? '15px' : '0' }}>
            {/* --- REMOVED Outer Editor Check --- */}
            {/* {editingJokeItem ? ( ... ) : ... } */} 
            
            {/* --- ALWAYS Render based on Tab (or Analysis Mode) --- */}
             {analysisMode ? (
                 <div className="analysis-view">
                     <div className="analysis-header"> <h3>Analyzing {focusItem?.type}: "{focusItem?.label || 'Untitled'}"</h3> <button onClick={exitAnalysisMode} className="btn back-btn">← Back</button> </div>
                     <div className="analysis-controls">
                         <label htmlFor="model-select">AI Model:</label>
                         <select id="model-select" value={selectedAnalysisModel} onChange={(e) => setSelectedAnalysisModel(e.target.value)} className="ai-model-select"> <optgroup label="OpenAI"><option value="gpt-4">GPT-4</option><option value="gpt-3.5-turbo">GPT-3.5-Turbo</option></optgroup> <optgroup label="Anthropic"><option value="claude-3-opus-20240229">Claude 3 Opus</option><option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option></optgroup> <optgroup label="Google"><option value="gemini-pro">Gemini Pro</option></optgroup> </select>
                     </div>
                     <div className="analysis-actions">
                         {(improvementActionsConfig[focusItem?.type] || []).map(actionName => ( <button key={actionName} className={`btn ai-action-btn ${activeAiAction === actionName ? 'active' : ''}`} onClick={() => handleAiActionClick(actionName)}>{actionName}</button> )) }
                         {(improvementActionsConfig[focusItem?.type] || []).length === 0 && <p>No analysis actions for '{focusItem?.type}'.</p>}
                     </div>
                     <div className="analysis-results-area">
                          {activeAiAction === 'Punchline Optimizer' && focusItem && ( <PunchlineOptimizer jokeItem={focusItem} selectedModel={selectedAnalysisModel} /> )}
                          {activeAiAction === 'Joke Analysis' && focusItem && (
                            <JokeAnalysis jokeText={focusItem.text} />
                          )}
                          {activeAiAction && activeAiAction !== 'Punchline Optimizer' && activeAiAction !== 'Joke Analysis' && ( <div>{activeAiAction} results using {selectedAnalysisModel}... (Tool Component Placeholder)</div> )}
                          {!activeAiAction && <div className="tool-desc">Select action above.</div>}
                     </div>
                 </div>
             ) : activeMainTab === 'builder' ? (
                 focusItem ? 
                   <div className="builder-area drop-zone">
                     <BlockComponent 
                       item={focusItem} 
                       level={0} 
                       parent={null} 
                       typeColors={typeColors}
                       // Pass ALL handlers down
                       onDropChild={handleDropIntoChild} 
                       onRemoveChild={handleRemoveChild} 
                       onDragStart={handleDragStart} 
                       onReorder={handleReorder} 
                       onEditItem={handleEditItem}           
                       onApproveSuggestion={handleApproveSuggestion}
                       onRejectSuggestion={handleRejectSuggestion}
                       onEditSuggestion={handleEditSuggestion} 
                       onUpdateItem={handleUpdateItemInline} // <-- Pass the update handler
                     />
                   </div> 
                 : <div className="tool-desc">Focus an item or parse text to view builder.</div> 
             ) : activeMainTab === 'text' ? (
                 renderTextTab()
             ) : activeMainTab === 'versions' ? (
                 renderVersionsTab()
             ) : null}
          </div>
        </div>
        {lastError && <div className="error-message" onClick={() => setLastError("")}>⚠️ {lastError}</div>}
      </div>

      {/* Right Panel - JokeBuilder should no longer be rendered */}
      <div className="right-panel">
        <h3>📥 Input / Tools</h3>
        <div className="tab-buttons">
          {/* Add the 'Import Text' tab button */}
          <button className={`btn ${rightPanelTab === 'import' ? 'active' : ''}`} onClick={() => { setRightPanelTab('import'); setOrganizedResultForReview(null); setTranscriptionText(""); }}>Import Text</button>
          <button className={`btn ${rightPanelTab === 'process' ? 'active' : ''}`} onClick={() => { setRightPanelTab('process'); setOrganizedResultForReview(null); }}>Process Media</button>
          <button className={`btn ${rightPanelTab === 'idea' ? 'active' : ''}`} onClick={() => setRightPanelTab('idea')}>Add Idea</button>
          {/* <button className={`btn ${rightPanelTab === 'settings' ? 'active' : ''}`} onClick={() => setRightPanelTab('settings')}>Settings</button> */}
        </div>

        <div className="right-panel-content">
          {/* Pass handleSuggestionClick to RawTextImporter */}
          {rightPanelTab === 'import' && !editingJokeItem && (
            <RawTextImporter 
              onAnalyzeFullText={handleAnalyzeFullText}
              suggestions={textSuggestions}
              onSuggestionClick={handleSuggestionClick}
              isLoading={isParsingFullText}
            />
          )}
          
          {/* JOKE BUILDER IS REMOVED FROM HERE */}
          {/* {jokeBuilderData && ( ... )} */}

          {rightPanelTab === 'process' && (
            <div className="process-tab-content">
              <MediaUpload onUploadComplete={(data) => handleTranscriptionUpload(data, 'process')} />
              {/* Existing process tab content */}
              <textarea value={transcriptionText} onChange={(e) => setTranscriptionText(e.target.value)} placeholder="Paste transcription here..." rows={8} style={{ width: '100%', marginTop: '10px' }} />
              <button className="btn blue-btn" onClick={handleOrganizeText} disabled={isOrganizing || !transcriptionText.trim()}>{isOrganizing ? 'Processing...' : '🤖 Organize Text'}</button>
              {organizedResultForReview && (
                <OrganizedMaterialEditor 
                    organizedResult={organizedResultForReview} 
                    onSave={handleSaveOrganized} 
                    onCancel={() => setOrganizedResultForReview(null)}
                    typeColors={typeColors}
                 />
              )}
            </div>
          )}

          {rightPanelTab === 'idea' && (
            <div className="add-idea-content">
              <textarea value={newIdeaText} onChange={(e) => setNewIdeaText(e.target.value)} placeholder="Jot down a quick idea..." rows={5} style={{ width: '100%', marginBottom: '10px' }} />
              <MediaUpload onUploadComplete={(data) => handleTranscriptionUpload(data, 'idea')} />
              <button className="btn blue-btn" onClick={handleAddNewIdea} disabled={!newIdeaText.trim()}>💡 Add as New Idea</button>
            </div>
          )}
        </div>
        {(isParsingFullText || isAnalyzingSelection) && <div className="status-loading">Analyzing...</div>}
        {lastError && <div className="status-error">{lastError}</div>}
      </div>

    </div> // End Layout
  );
} // End App Component