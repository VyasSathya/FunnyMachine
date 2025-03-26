import React, { useState, useEffect } from "react";
import "./App.css";
import libraryData from "./mockData/library";
import BlockComponent from "./components/BlockComponent";

// Finds the parent of the node with targetId
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

// Removes a node with targetId from its parent's children
function removeFromParent(root, targetId) {
  const parent = findParent(root, targetId);
  if (parent?.children) {
    parent.children = parent.children.filter(child => child.id !== targetId);
  }
}

// Computes the level (depth) of a node relative to the focus tree root
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

export default function App() {
  const [library, setLibrary] = useState([]);
  const [activeLibCategory, setActiveLibCategory] = useState("joke");
  const [focusItem, setFocusItem] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("joke");
  const [lastError, setLastError] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Initial load from localStorage
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
          let updatedLib;
          if (exists) {
            updatedLib = prevLibrary.map(item =>
              item.id === focusItem.id ? focusItem : item
            );
          } else {
            updatedLib = [...prevLibrary, focusItem];
          }
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
      setHistory(prev => [...prev.slice(-9), focusItem]); // Keep last 10 states
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

  // ─── Nesting Handler (for nesting dragged elements) ─────────────
  const handleDropIntoChild = (e, targetItem) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    
    // Clone the focus tree to avoid direct mutation
    const updatedFocus = structuredClone(focusItem);
    removeFromParent(updatedFocus, draggedItem.id);
    
    // Find the target node in the updated tree
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
    
    // Prevent circular references
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
    
    // Compute new level for the dragged item based on its intended parent
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

  // ─── Reorder Handler (for moving elements within the same container) ─────────────
  const handleReorder = (e, parentItem, dropIndex) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    
    // Clone the focus tree to work on
    const updatedFocus = structuredClone(focusItem);

    // Helper to find a node by id in the tree
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
    
    // Find the current index of the dragged item
    const currentIndex = targetParent.children.findIndex(child => child.id === draggedItem.id);
    if (currentIndex === -1) {
      setLastError("Item not found in the target container");
      setTimeout(() => setLastError(""), 3000);
      return;
    }

    // Remove the dragged item from its current position
    const [itemToMove] = targetParent.children.splice(currentIndex, 1);

    // Clamp the dropIndex to be within valid bounds
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

  const categories = ["special", "set", "bit", "joke", "idea"];

  // ─── Render for the Builder Tab ─────────────────────────────
  const renderBuilderTab = () => (
    focusItem ? (
      <div className="builder-area drop-zone">
        {/*
          BlockComponent is expected to render its children with appropriate
          drop zones for reordering and nesting. It will call handleReorder and
          handleDropIntoChild as needed.
        */}
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

  return (
    <div className="layout">
      <div className="left-panel">
        <h2>📚 Library</h2>
        <div className="tab-buttons">
          {categories.map(cat => (
            <button
              key={cat}
              className={cat === activeLibCategory ? "active" : ""}
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
              <div
                key={item.id}
                className="tab"
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => setFocusItem(structuredClone(item))}
              >
                {item.label || item.text}
              </div>
            ))}
        </div>
        <button className="refresh-btn" onClick={refreshLibrary}>
          🔄 Reset Library
        </button>
      </div>

      <div className="middle-panel">
        <div className="error-banner">
          {lastError && <div className="error-message">⚠️ {lastError}</div>}
        </div>
        
        <div 
          className="focus-bar drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFocusDrop}
        >
          <h3>🎯 Focused Material</h3>
          {focusItem ? (
            <div className="block" draggable onDragStart={(e) => handleDragStart(e, focusItem)}>
              <strong>{focusItem.label}</strong>
              <em>{focusItem.text}</em>
              <div>({focusItem.type})</div>
            </div>
          ) : (
            <div className="focus-placeholder">Drag item here to start building</div>
          )}
        </div>

        {/* Tab Buttons & Content */}
        <div className="middle-panel-tools">
          <div className="tab-buttons">
            {["builder", "text", "versions", "tags"].map(tab => (
              <button
                key={tab}
                className={tab === activeTab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {activeTab === "builder" && renderBuilderTab()}
            {activeTab === "text" && renderTextTab()}
            {activeTab === "versions" && <div>Versions for {focusItem?.label}</div>}
            {activeTab === "tags" && <div>Tags for {focusItem?.label}</div>}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <h2>➕ New Material</h2>
        <div className="input-section">
          <textarea
            className="transcription-box"
            placeholder="Paste/type new material here..."
            rows={6}
          />
          <div className="input-buttons" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button>🎙️ Record</button>
            <button>📁 Upload</button>
            <button className="blue-btn">✨ Organize</button>
          </div>
          <input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Enter item name"
          />
          <select
            value={newItemType}
            onChange={(e) => setNewItemType(e.target.value)}
          >
            {categories.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (newItemName.trim()) {
                setLibrary([...library, {
                  id: Math.random().toString(36).slice(2),
                  type: newItemType,
                  label: newItemName,
                  text: newItemName,
                  children: []
                }]);
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
