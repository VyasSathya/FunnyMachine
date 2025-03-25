import React, { useState } from "react";
import "./App.css";

const mockLibrary = {
  joke: [
    { id: 1, label: "Airplane food", text: "Why is airplane food always the same?" }
  ],
  bit: [
    { id: 2, label: "Breakup sequence", text: "Breakups hurt more when they don't block you." }
  ],
  set: [
    { id: 3, label: "Open mic 3/21", text: "A mix of bits on dating, tech, and social anxiety." }
  ],
  idea: [
    { id: 4, label: "Gym loyalty", text: "Just fit enough to make loyalty meaningful." }
  ]
};

const mockNewMaterial = [
  { type: "joke", text: "Just thought of this one..." },
  { type: "segue", text: "Segue: Transition into breakup bit" }
];

export default function App() {
  const [activeTool, setActiveTool] = useState("builder");
  const [focusItem, setFocusItem] = useState(null);
  const [newMaterial, setNewMaterial] = useState(mockNewMaterial);
  const [activeLibTab, setActiveLibTab] = useState("joke");
  const [newMaterialName, setNewMaterialName] = useState("");

  const handleDropToFocus = (item) => {
    setFocusItem(item);
  };

  const handleSaveNewMaterial = () => {
    if (newMaterialName) {
      const newItem = { type: "joke", label: newMaterialName, text: newMaterialName };
      mockLibrary.joke.push(newItem);
      setNewMaterialName("");
    }
  };

  const renderFocusBar = () => (
    <div className="focus-bar">
      <h3>🎯 Focus</h3>
      {focusItem ? (
        <div className={`block block-${focusItem.type}`}>{focusItem.label || focusItem.text}</div>
      ) : (
        <div className="focus-placeholder">Drag an item here to focus</div>
      )}
    </div>
  );

  const renderToolTabs = () => {
    const toolMap = {
      builder: <div className="tool-desc">🧱 Reorder jokes, add segues, and build structure</div>,
      analysis: <div className="tool-desc">🧠 Analyze tone, rhythm, and emotional arcs</div>,
      versions: <div className="tool-desc">🕓 See past recordings, alternate takes, audio clips</div>,
      tags: <div className="tool-desc">🏷️ Auto-tags for theme, topic, emotion</div>
    };
    return (
      <div className="middle-panel-tools">
        <div className="tab-buttons">
          {Object.keys(toolMap).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTool(key)}
              className={activeTool === key ? "active" : ""}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        <div className="tab-content">{toolMap[activeTool]}</div>
      </div>
    );
  };

  return (
    <div className="layout">
      {/* Left Panel - Library */}
      <div className="left-panel">
        <h2 className="panel-header">📚 Library</h2>
        <div className="tab-buttons">
          {Object.keys(mockLibrary).map((key) => (
            <button
              key={key}
              onClick={() => setActiveLibTab(key)}
              className={activeLibTab === key ? "active" : ""}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        <div className="tabs">
          {mockLibrary[activeLibTab].map((item) => (
            <div
              key={item.id}
              className="tab"
              onClick={() => handleDropToFocus(item)}
              draggable
            >
              {item.label}
            </div>
          ))}
        </div>
        <div className="library-note">Drag into focus to explore, build, or analyze.</div>
      </div>

      {/* Middle Panel - Focus + Tools */}
      <div className="middle-panel">
        {renderFocusBar()}
        {renderToolTabs()}
      </div>

      {/* Right Panel - New Material */}
      <div className="right-panel">
        <h3 className="panel-header">🎤 New Material</h3>
        <div className="input-section">
          <input
            className="input"
            value={newMaterialName}
            onChange={(e) => setNewMaterialName(e.target.value)}
            placeholder="Type, record, or upload..."
          />
          <button title="Record">🎧</button>
          <button title="Upload">📁</button>
          <button title="Organize">🧠 Organize</button>
        </div>
        <div className="new-list">
          {newMaterial.map((block, i) => (
            <div
              key={i}
              className={`block block-${block.type}`}
              draggable
              onClick={() => handleDropToFocus(block)}
            >
              {block.type === "segue" ? <em>{block.text}</em> : block.text}
            </div>
          ))}
        </div>
        <button className="save-btn" onClick={handleSaveNewMaterial}>💾 Save to Library</button>
      </div>
    </div>
  );
}