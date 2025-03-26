import React, { useState, useEffect } from "react";
import "./App.css";
import libraryData from "./mockData/library";
import BlockComponent from "./components/BlockComponent";

// Utility functions for tree operations
function findParent(root, targetId, parent = null) {
  if (root.id === targetId) return parent;
  if (root.children) {
    for (const child of root.children) {
      const result = findParent(child, targetId, root);
      if (result) return result;
    }
  }
  return null;
}

function removeFromParent(root, targetId) {
  const parent = findParent(root, targetId);
  if (parent?.children) {
    parent.children = parent.children.filter(child => child.id !== targetId);
  }
}

function computeLevel(root, targetId, currentLevel = 0) {
  if (root.id === targetId) return currentLevel;
  if (root.children) {
    for (const child of root.children) {
      const level = computeLevel(child, targetId, currentLevel + 1);
      if (level !== -1) return level;
    }
  }
  return -1;
}

const validParentChildTypes = {
  special: ['set'],
  set: ['bit'],
  bit: ['joke', 'bit'],
  joke: ['idea'],
  idea: ['idea']
};

function canNest(parentType, childType) {
  if (childType === 'idea') return true;
  return validParentChildTypes[parentType]?.includes(childType) ?? false;
}

const typeColors = {
  special: "#ffadad",
  set: "#ffd6a5",
  bit: "#fdffb6",
  joke: "#caffbf",
  idea: "#9bf6ff"
};

// Define improvement buttons for each type
const improvementButtonsByType = {
  joke: ["Polish", "Tweak", "Revamp", "Boost"],
  bit: ["Enhance", "Refine", "Energize", "Spark"],
  set: ["Elevate", "Optimize", "Augment", "Inspire"],
  special: ["Enrich", "Amplify", "Refine", "Ignite"],
  idea: ["Polish", "Tweak", "Revamp", "Boost"]
};

export default function App() {
  // Library and focus states
  const [library, setLibrary] = useState([]);
  const [activeLibCategory, setActiveLibCategory] = useState("joke");
  const [focusItem, setFocusItem] = useState(null);

  // Tab state; initial active tab is "builder"
  const [activeTab, setActiveTab] = useState("builder");

  // New material state
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("joke");

  const [lastError, setLastError] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // AI-related state
  // selectedModel: when empty (""), no model is selected.
  // We also control the visibility of the dropdown via a flag.
  const [selectedModel, setSelectedModel] = useState("");
  const [showAIDropdown, setShowAIDropdown] = useState(true); // true initially

  // When focus item changes, reset AI state and default to showing dropdown.
  useEffect(() => {
    if (focusItem) {
      setActiveTab("builder");
      setSelectedModel("");
      setShowAIDropdown(true);
    }
  }, [focusItem]);

  // Initial load
  useEffect(() => {
    const savedFocus = localStorage.getItem("comedyFocusItem");
    const savedLibrary = localStorage.getItem("comedyLibrary");
    if (savedFocus) setFocusItem(JSON.parse(savedFocus));
    setLibrary(savedLibrary ? JSON.parse(savedLibrary) : libraryData);
  }, []);

  // Sync focus item to localStorage and update library
  useEffect(() => {
    if (focusItem) {
      try {
        const data = JSON.stringify(focusItem);
        if (data.length > 500000) {
          localStorage.removeItem("comedyFocusItem");
          window.location.reload();
          return;
        }
        localStorage.setItem("comedyFocusItem", data);
        setLibrary(prevLibrary => {
          const exists = prevLibrary.some(item => item.id === focusItem.id);
          const updatedLib = exists
            ? prevLibrary.map(item => (item.id === focusItem.id ? focusItem : item))
            : [...prevLibrary, focusItem];
          localStorage.setItem("comedyLibrary", JSON.stringify(updatedLib));
          return updatedLib;
        });
      } catch (error) {
        localStorage.removeItem("comedyFocusItem");
        window.location.reload();
      }
    }
  }, [focusItem]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleFocusDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    if (!focusItem || focusItem.id !== data.id) {
      setFocusItem(structuredClone(data));
    }
  };

  useEffect(() => {
    if (focusItem) {
      setHistory(prev => [...prev.slice(-9), focusItem]);
      setFuture([]);
    }
  }, [focusItem]);

  const undo = () => {
    setHistory(prev => {
      if (prev.length < 2) return prev;
      const newHistory = [...prev.slice(0, -1)];
      setFuture(prevFuture => [prev[prev.length - 1], ...prevFuture]);
      setFocusItem(prev[prev.length - 2]);
      return newHistory;
    });
  };

  const redo = () => {
    if (future.length === 0) return;
    setFocusItem(future[0]);
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, future[0]]);
  };

  // Handler for nesting dragged elements
  const handleDropIntoChild = (e, targetItem) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    const updatedFocus = structuredClone(focusItem);
    removeFromParent(updatedFocus, draggedItem.id);
    const findNode = (node, id) => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    const actualNewParent = findNode(updatedFocus, targetItem.id);
    if (!actualNewParent) {
      setLastError("Invalid drop target");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    if (!canNest(actualNewParent.type, draggedItem.type)) {
      setLastError(`${draggedItem.type} cannot nest in ${actualNewParent.type}`);
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    const checkCircular = (node, id) => {
      if (node.id === id) return true;
      if (node.children) {
        return node.children.some(child => checkCircular(child, id));
      }
      return false;
    };
    if (checkCircular(draggedItem, actualNewParent.id)) {
      setLastError("Circular references not allowed!");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    const parentLevel = computeLevel(updatedFocus, actualNewParent.id);
    const newChildLevel = parentLevel + 1;
    if (draggedItem.type === 'bit' && newChildLevel > 3) {
      setLastError("Maximum bit nesting depth (3) reached!");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    if (!actualNewParent.children) actualNewParent.children = [];
    actualNewParent.children.push(structuredClone(draggedItem));
    setFocusItem(updatedFocus);
  };

  // Handler for reordering elements
  const handleReorder = (e, parentItem, dropIndex) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    const updatedFocus = structuredClone(focusItem);
    const findNode = (node, id) => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    const targetParent = findNode(updatedFocus, parentItem.id);
    if (!targetParent || !Array.isArray(targetParent.children)) {
      setLastError("Invalid reorder target");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    const currentIndex = targetParent.children.findIndex(child => child.id === draggedItem.id);
    if (currentIndex === -1) {
      setLastError("Item not found in the target container");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    const [itemToMove] = targetParent.children.splice(currentIndex, 1);
    const clampedIndex = Math.max(0, Math.min(dropIndex, targetParent.children.length));
    targetParent.children.splice(clampedIndex, 0, itemToMove);
    setFocusItem(updatedFocus);
  };

  const handleRemoveChild = (target) => {
    const updated = structuredClone(focusItem);
    const recurseRemove = (node) => {
      node.children = node.children?.filter(child => child.id !== target.id);
      node.children?.forEach(recurseRemove);
    };
    recurseRemove(updated);
    setFocusItem(updated);
  };

  const refreshLibrary = () => {
    localStorage.removeItem("comedyFocusItem");
    localStorage.removeItem("comedyLibrary");
    setFocusItem(null);
    setLibrary(libraryData);
  };

  // Library category buttons
  const categories = ["special", "set", "bit", "joke", "idea"];

  // Render functions for tab content
  const renderBuilderTab = () => (
    focusItem ? (
      <div className="builder-area drop-zone">
        <BlockComponent
          item={focusItem}
          level={0}
          onDropChild={handleDropIntoChild}
          onRemoveChild={handleRemoveChild}
          onDragStart={handleDragStart}
          onReorder={handleReorder}
        />
      </div>
    ) : (
      <div className="tool-desc">Drag/click from library to focus</div>
    )
  );

  const renderTextTab = () => {
    if (!focusItem) return <div className="tool-desc">No focus item</div>;
    const lines = [];
    const printItem = (it, depth) => {
      lines.push("  ".repeat(depth) + "- " + (it.text || it.label));
      it.children?.forEach(child => printItem(child, depth + 1));
    };
    printItem(focusItem, 0);
    return <pre className="bit-text-readout">{lines.join("\n")}</pre>;
  };

  // Determine which improvement buttons to show based on focus item type.
  const improvementButtons = focusItem && improvementButtonsByType[focusItem.type]
    ? improvementButtonsByType[focusItem.type]
    : ["Polish", "Tweak", "Revamp", "Boost"];

  return (
    <div className="layout">
      {/* Left Panel: Library */}
      <div className="left-panel">
        <h2>📚 Library</h2>
        <div className="tab-buttons">
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-category ${cat === activeLibCategory ? "active" : ""}`}
              onClick={() => setActiveLibCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="tabs">
          {library
            .filter(item => item.type === activeLibCategory)
            .map(item => (
              <button
                key={item.id}
                className="btn tab"
                style={{ backgroundColor: typeColors[item.type] || "#fff" }}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => setFocusItem(structuredClone(item))}
              >
                {item.label || item.text}
              </button>
            ))}
        </div>
        <button className="btn refresh-btn" onClick={refreshLibrary}>
          🔄 Reset Library
        </button>
      </div>

      {/* Middle Panel: Focused Material & Tab Controls */}
      <div className="middle-panel">
        <div
          className="focus-bar drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFocusDrop}
        >
          <h3>🎯 Focused Material</h3>
          {focusItem ? (
            <div
              className="block"
              draggable
              onDragStart={(e) => handleDragStart(e, focusItem)}
            >
              <strong>{focusItem.label}</strong>
              <em>{focusItem.text}</em>
              <div>({focusItem.type})</div>
            </div>
          ) : (
            <div className="focus-placeholder">
              Drag item here to start building
            </div>
          )}
        </div>
        {/* Tab Buttons & AI Controls */}
        <div className="middle-panel-tools">
          <div className="tab-buttons-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="tab-buttons-left">
              {["builder", "text", "versions"].map(tab => (
                <button
                  key={tab}
                  className={tab === activeTab ? "active" : ""}
                  onClick={() => {
                    setActiveTab(tab);
                    // Reset AI state when switching tabs.
                    setSelectedModel("");
                    setShowAIDropdown(true);
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              {/* Render the Analyze button only if activeTab is not "analyze" */}
              {activeTab !== "analyze" && (
                <button
                  onClick={() => {
                    // When Analyze is clicked, auto-select "Deepseek"
                    setActiveTab("analyze");
                    setSelectedModel("Deepseek");
                    setShowAIDropdown(false);
                  }}
                >
                  Analyze
                </button>
              )}
            </div>
            <div className="tab-buttons-right">
              {/* In the initial state (when activeTab is not analyze), show the AI dropdown */}
              {activeTab !== "analyze" && showAIDropdown && (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ padding: "0.5rem", fontSize: "1rem" }}
                >
                  <option value="">Select Model</option>
                  <option value="Deepseek">Deepseek</option>
                  <option value="O1">O1</option>
                </select>
              )}
              {/* When activeTab is "analyze" and a model is selected, show improvement buttons */}
              {activeTab === "analyze" && selectedModel && (
                improvementButtons.map(action => (
                  <button
                    key={action}
                    className={activeTab === action ? "active" : ""}
                    onClick={() => {
                      alert(`${action} feature not implemented yet`);
                      setActiveTab(action);
                    }}
                  >
                    {action}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="tab-content">
            {activeTab === "builder" && renderBuilderTab()}
            {activeTab === "text" && renderTextTab()}
            {activeTab === "versions" && <div>Versions for {focusItem?.label}</div>}
            {activeTab === "analyze" && (
              <div className="ai-placeholder">
                {/* AI analysis content can be integrated here */}
              </div>
            )}
            {["Polish", "Tweak", "Revamp", "Boost", "Enhance", "Refine", "Energize", "Spark", "Elevate", "Optimize", "Augment", "Inspire", "Enrich", "Amplify", "Ignite"].includes(activeTab) && (
              <div className="ai-placeholder">
                {/* AI improvement content can be integrated here */}
              </div>
            )}
          </div>
        </div>
        {lastError && <div className="error-message">⚠️ {lastError}</div>}
      </div>

      {/* Right Panel: New Material */}
      <div className="right-panel">
        <h2>➕ New Material</h2>
        <div className="input-section">
          <textarea
            className="transcription-box"
            placeholder="Paste/type new material here..."
            rows={6}
          />
          <div className="input-buttons" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button className="btn">🎙️ Record</button>
            <button className="btn">📁 Upload</button>
            <button className="btn blue-btn">✨ Organize</button>
          </div>
          <input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Enter item name"
          />
          <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
            {categories.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <button
            className="btn"
            onClick={() => {
              if (newItemName.trim()) {
                setLibrary([
                  ...library,
                  {
                    id: Math.random().toString(36).slice(2),
                    type: newItemType,
                    label: newItemName,
                    text: newItemName,
                    children: [],
                  },
                ]);
                setNewItemName("");
              }
            }}
          >
            Add to Library
          </button>
        </div>
      </div>
    </div>
  );
}
