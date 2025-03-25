import React, { useState, useEffect } from "react";
import "./App.css";
import libraryData from "./mockData/library";
import BlockComponent from "./components/BlockComponent";

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

function calculateDepth(node, currentDepth = 0) {
  if (currentDepth >= 5) return currentDepth; // Hard limit
  if (!node.children || node.children.length === 0) return currentDepth;
  return Math.max(...node.children.map(child => 
    calculateDepth(child, currentDepth + 1)
  ));
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
  const [currentState, setCurrentState] = useState(null);

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

  // ─── Nesting Handler (used in the builder tab only) ─────────────
  const handleDropIntoChild = (e, targetItem) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    
    // Clone the focus tree so we don’t mutate state directly
    const updatedFocus = structuredClone(focusItem);
    removeFromParent(updatedFocus, draggedItem.id);
    
    // Find the target node
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
    
    const currentDepth = calculateDepth(actualNewParent);
    if (currentDepth >= 3 && draggedItem.type === 'bit') {
      setLastError("Maximum bit nesting depth (3) reached!");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    
    if (!actualNewParent.children) actualNewParent.children = [];
    actualNewParent.children.push(structuredClone(draggedItem));
    
    setFocusItem(updatedFocus);
  };

  // ─── Reorder Handler (used for reordering siblings) ─────────────
  const handleReorder = (e, parentItem, dropIndex) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    const updatedFocus = structuredClone(focusItem);

    // Find the parent node in the updated focus tree
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
    // Prevent reordering that accidentally nests: only allow same-level moves
    if (parentItem.id !== findParent(updatedFocus, draggedItem.id)?.id) {
      setLastError("Reordering must be within the same container");
      setTimeout(() => setLastError(""), 3000);
      return;
    }
    // Remove the dragged item and insert it at the new index
    const [itemToMove] = targetParent.children.splice(currentIndex, 1);
    if (dropIndex < 0 || dropIndex > targetParent.children.length) {
      targetParent.children.push(itemToMove);
    } else {
      targetParent.children.splice(dropIndex, 0, itemToMove);
    }
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

  // ─── Helper functions for tab content ─────────────────────────────
  const renderBuilderTab = () => (
    focusItem ? (
      <div className="builder-area drop-zone">
        {/*
          In your BlockComponent, add dedicated drop zones for reordering.
          For example, between each sibling block render an element that calls
          handleReorder with the parent and the intended drop index.
        */}
        <BlockComponent
          item={focusItem}
          level={0}
          onDropChild={handleDropIntoChild}
          onRemoveChild={handleRemoveChild}
          onDragStart={handleDragStart}
          onReorder={handleReorder} // Pass to allow reordering drop zones
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
  // ─────────────────────────────────────────────────────────────────────

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
        
        {/* 
          Restore the duplicate focus view exactly as before—this shows only the top-level block,
          with no nesting functionality.
        */}
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
          {/* Re-added and organized input buttons */}
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
