import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import libraryData from "./mockData/library"; // Assuming './mockData/library.js' exists
import BlockComponent from "./components/BlockComponent.jsx";
import MediaUpload from "./components/MediaUpload.jsx";
import OrganizedMaterialEditor from "./components/InputPanel/OrganizedMaterialEditor.jsx"; // Renamed for clarity
import PunchlineOptimizer from './components/Tools/PunchlineOptimizer';
import JokeAnalysis from './components/Analysis/JokeAnalysis'; // Import the JokeAnalysis component

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
  const [activeLibCategory, setActiveLibCategory] = useState("joke");
  const [focusItem, setFocusItem] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState("builder");
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedAnalysisModel, setSelectedAnalysisModel] = useState(defaultModel);
  const [activeAiAction, setActiveAiAction] = useState(null);
  // Removed aiActionResults as results are handled within tools
  const [rightPanelTab, setRightPanelTab] = useState('process');
  const [transcriptionText, setTranscriptionText] = useState("");
  const [organizedResultForReview, setOrganizedResultForReview] = useState(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState("");
  const [lastError, setLastError] = useState("");

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

  // --- Render Functions ---
  const renderTextTab = () => { if(!focusItem)return<div className="tool-desc">No item</div>; const l=[];const ex=(i)=>{if(!i)return; if(i.text&&(i.type==='joke'||i.type==='bit'))l.push(i.text); i.children?.forEach(ex);}; ex(focusItem); return<pre className="text-readout">{l.join("\n\n")||"(No text)"}</pre>;};

  // --- Main JSX ---
  return (
    <div className="layout">

      {/* Left Panel */}
      <div className="left-panel">
        <h2>📚 Library</h2>
        <div className="tab-buttons category-buttons"> {categories.map(cat => ( <button key={cat} className={`btn btn-category ${cat === activeLibCategory ? "active" : ""}`} onClick={() => setActiveLibCategory(cat)}>{cat.charAt(0).toUpperCase() + cat.slice(1)}s</button> ))} </div>
        <div className="library-items">
          {library.filter(item => item.type === activeLibCategory).map(item => ( <button key={item.id} className="btn library-item" style={{ borderLeftColor: typeColors[item.type] || typeColors.default }} draggable onDragStart={(e) => handleDragStart(e, item)} onClick={() => setFocusItem(structuredClone(item)) }>{item.label || '(Untitled)'}</button> )) }
          {library.filter(item => item.type === activeLibCategory).length === 0 && ( <div className="library-empty">No {activeLibCategory}s.</div> )}
        </div>
        <button className="btn refresh-btn" onClick={refreshLibrary}>🔄 Reset Library</button>
      </div>

      {/* Middle Panel */}
      <div className="middle-panel">
        <div className="focus-bar drop-zone" onDragOver={(e) => {e.preventDefault(); e.dataTransfer.dropEffect = "move";}} onDrop={handleFocusDrop}>
           <h3>🎯 Focused Material</h3>
           {focusItem ? ( <div className="focus-item-display"> <span><strong>{focusItem.label || '(Untitled)'}</strong> ({focusItem.type})</span> {!analysisMode && ( <button onClick={enterAnalysisMode} className="btn analyze-btn-global">Analyze ✨</button> )} </div> ) : ( <div className="focus-placeholder">Drag item here</div> )}
        </div>
        <div className="middle-panel-content">
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
          ) : (
            <>
              <div className="tab-buttons-container standard-tabs"> {["builder", "text", "versions"].map(tab => ( <button key={tab} className={`btn tab-btn ${activeMainTab === tab ? "active" : ""}`} onClick={() => setActiveMainTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>))} </div>
              <div className="tab-content">
                  {/* Ensure ALL necessary props including handlers and typeColors are passed down */}
                  {activeMainTab === 'builder' && ( focusItem ? <div className="builder-area drop-zone"><BlockComponent item={focusItem} level={0} onDropChild={handleDropIntoChild} onRemoveChild={handleRemoveChild} onDragStart={handleDragStart} onReorder={handleReorder} parent={null} typeColors={typeColors} /></div> : <div className="tool-desc">Focus an item</div> )}
                  {activeMainTab === 'text' && renderTextTab()}
                  {activeMainTab === 'versions' && <div className="tool-desc">Versions (placeholder)</div>}
              </div>
            </>
          )}
        </div>
        {lastError && <div className="error-message" onClick={() => setLastError("")}>⚠️ {lastError}</div>}
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <h2>➕ Input / New</h2>
        <div className="tab-buttons input-tabs"> <button className={`btn ${rightPanelTab==='process'?'active':''}`} onClick={()=>setRightPanelTab('process')}>Process</button> <button className={`btn ${rightPanelTab==='idea'?'active':''}`} onClick={()=>setRightPanelTab('idea')}>Quick Idea</button> </div>
        {rightPanelTab === 'process' && (
            <div className="input-section process-section">
              <textarea className="transcription-box" placeholder="Paste transcription or type full text..." rows={8} value={transcriptionText} onChange={(e)=>setTranscriptionText(e.target.value)} />
              <div className="input-buttons"> <button className="btn">🎙️ Record</button> <MediaUpload onUploadComplete={(d)=>handleTranscriptionUpload(d, 'process')} /> <button className="btn blue-btn" onClick={handleOrganizeText} disabled={!transcriptionText.trim()||isOrganizing}>{isOrganizing?'Organizing...':'✨ Organize'}</button> </div>
              {organizedResultForReview && ( <OrganizedMaterialEditor organizedResult={organizedResultForReview} onSave={handleSaveOrganized} onCancel={()=>setOrganizedResultForReview(null)} typeColors={typeColors} /> )}
            </div>
        )}
        {rightPanelTab === 'idea' && (
             <div className="input-section idea-section">
                 <h3>Add Quick Idea</h3>
                 <textarea className="idea-input-box" placeholder="Jot down premise, observation, punchline, tag..." rows={6} value={newIdeaText} onChange={(e)=>setNewIdeaText(e.target.value)} />
                 {/* Add Upload/Record to Idea Tab */}
                 <div className="input-buttons idea-buttons">
                     <button className="btn">🎙️ Record Idea</button>
                     <MediaUpload onUploadComplete={(d)=>handleTranscriptionUpload(d, 'idea')} />
                 </div>
                 <button className="btn" onClick={handleAddNewIdea} disabled={!newIdeaText.trim()}>Add Idea</button>
             </div>
        )}
      </div>

    </div> // End Layout
  );
} // End App Component