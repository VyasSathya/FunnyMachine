import React, { useState, useEffect } from "react";
import "./App.css";
import libraryData from "./mockData/library";

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
  if (parent && parent.children) {
    parent.children = parent.children.filter(child => child.id !== targetId);
  }
}

function calculateDepth(node, currentDepth = 0) {
  if (!node.children || node.children.length === 0) return currentDepth;
  return Math.max(...node.children.map(child => 
    calculateDepth(child, currentDepth + 1)
  ));
}

const pastelColors = ["#d9f0ff", "#e3d9ff", "#d9ffec", "#ffe7d9", "#ffe5fa", "#fff4d9"];

const validParentChildTypes = {
  special: ['set'],
  set: ['bit'],
  bit: ['joke', 'bit'],
  joke: ['idea'],
  idea: ['idea']
};

function canNest(parentType, childType) {
  if (childType === 'idea') return true;
  return validParentChildTypes[parentType]?.includes(childType) || false;
}

function renderBlock(item, level, onDropChild, onRemoveChild, onDragStart) {
  const bg = pastelColors[Math.min(level, pastelColors.length - 1)];
  return (
    <div
      key={item.id}
      className="block"
      style={{ 
        backgroundColor: bg, 
        marginLeft: `${level * 24}px`,
        cursor: level === 0 ? 'move' : 'grab'
      }}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("drag-over");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("drag-over");
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");
        onDropChild(e, item);
      }}
    >
      <div className="block-header">
        <strong>{item.label}</strong>
        <button className="remove-btn" onClick={() => onRemoveChild(item)}>🗑️</button>
      </div>
      <em style={{ fontSize: "0.9rem", fontFamily: "Georgia, serif" }}>{item.text}</em>
      <div style={{ fontSize: "0.75rem", color: "#666" }}>({item.type})</div>
      {Array.isArray(item.children) && item.children.length > 0 && (
        <div className="nested-blocks">
          {item.children.map((child) =>
            renderBlock(child, level + 1, onDropChild, onRemoveChild, onDragStart)
          )}
        </div>
      )}
      {level >= 3 && (
        <div className="depth-warning">Maximum nesting depth reached</div>
      )}
    </div>
  );
}

export default function App() {
  const [library, setLibrary] = useState([]);
  const [activeLibCategory, setActiveLibCategory] = useState("joke");
  const [focusItem, setFocusItem] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("joke");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("comedyFocusItem");
    if (saved) setFocusItem(JSON.parse(saved));
    const savedLibrary = localStorage.getItem("comedyLibrary");
    setLibrary(savedLibrary ? JSON.parse(savedLibrary) : libraryData);
  }, []);

  useEffect(() => {
    if (focusItem) {
      localStorage.setItem("comedyFocusItem", JSON.stringify(focusItem));
      const updatedLib = library.map((item) => item.id === focusItem.id ? focusItem : item);
      localStorage.setItem("comedyLibrary", JSON.stringify(updatedLib));
      setLibrary(updatedLib);
    }
  }, [focusItem]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleFocusDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    if (!focusItem || focusItem.id !== data.id) setFocusItem(structuredClone(data));
  };

  const handleDropIntoChild = (e, newParent) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData("application/json"));
    
    // Clone the entire focus item structure
    const updatedFocus = structuredClone(focusItem);
    
    // Remove the dragged item from its previous location
    removeFromParent(updatedFocus, draggedItem.id);
    
    // Find the new parent in the cloned structure
    function findNode(root, targetId) {
      if (root.id === targetId) return root;
      if (root.children) {
        for (const child of root.children) {
          const found = findNode(child, targetId);
          if (found) return found;
        }
      }
      return null;
    }
    
    const actualNewParent = findNode(updatedFocus, newParent.id);
    
    // Validation checks
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
    
    if (draggedItem.id === actualNewParent.id || findNode(draggedItem, actualNewParent.id)) {
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
    
    // Add to new parent
    if (!actualNewParent.children) actualNewParent.children = [];
    actualNewParent.children.push(structuredClone(draggedItem));
    
    // Update state
    setFocusItem(updatedFocus);
  };

  const handleRemoveChild = (target) => {
    const updated = structuredClone(focusItem);
    const recurseRemove = (node) => {
      if (node.children) {
        node.children = node.children.filter(child => child.id !== target.id);
        node.children.forEach(recurseRemove);
      }
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

  const renderBuilderTab = () => (
    focusItem ? (
      <div className="builder-area drop-zone">
        {renderBlock(focusItem, 0, handleDropIntoChild, handleRemoveChild, handleDragStart)}
      </div>
    ) : <div className="tool-desc">Drag/click from library to focus</div>
  );

  const renderTextTab = () => {
    if (!focusItem) return <div className="tool-desc">No focus item</div>;
    const lines = [];
    const printItem = (it, depth) => {
      lines.push("  ".repeat(depth) + "- " + (it.text || it.label));
      it.children?.forEach(c => printItem(c, depth + 1));
    };
    printItem(focusItem, 0);
    return <pre className="bit-text-readout">{lines.join("\n")}</pre>;
  };

  const categories = ["special", "set", "bit", "joke", "idea"];

  return (
    <div className="layout">
      <div className="left-panel">
        <h2>📚 Library</h2>
        <div className="tab-buttons">
          {categories.map(cat => (
            <button key={cat} className={cat === activeLibCategory ? "active" : ""} 
              onClick={() => setActiveLibCategory(cat)}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="tabs">
          {library.filter(item => item.type === activeLibCategory).map(item => (
            <div key={item.id} className="tab" draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => setFocusItem(structuredClone(item))}
              style={{ backgroundColor: pastelColors[categories.indexOf(item.type)] }}>
              {item.label || item.text}
            </div>
          ))}
        </div>
        <button className="refresh-btn" onClick={refreshLibrary}>🔄 Reset</button>
      </div>

      <div className="middle-panel">
        <div className="error-banner">
          {lastError && <div className="error-message">⚠️ {lastError}</div>}
        </div>
        <div className="focus-bar drop-zone" onDrop={handleFocusDrop}>
          <h3>🎯 Focus</h3>
          {focusItem ? (
            <div className="block" draggable onDragStart={(e) => handleDragStart(e, focusItem)}>
              <strong>{focusItem.label}</strong>
              <em>{focusItem.text}</em>
              <div>({focusItem.type})</div>
            </div>
          ) : <div className="focus-placeholder">Drag item here</div>}
        </div>

        <div className="middle-panel-tools">
          <div className="tab-buttons">
            {["builder", "text", "versions", "tags"].map(tab => (
              <button key={tab} className={tab === activeTab ? "active" : ""} 
                onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {{
              builder: renderBuilderTab(),
              text: renderTextTab(),
              versions: <div>Versions for {focusItem?.label}</div>,
              tags: <div>Tags for {focusItem?.label}</div>
            }[activeTab]}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <h2>New Material</h2>
        <textarea className="transcription-box" placeholder="Transcript..." />
        <div className="input-section">
          <button>🎙️ Record</button>
          <button>📁 Upload</button>
          <button>✨ Organize</button>
        </div>
        <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} 
          placeholder="New item name" />
        <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
          {categories.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <button onClick={() => {
          if (newItemName.trim()) {
            setLibrary([...library, {
              id: Math.random().toString(36).slice(2),
              type: newItemType,
              label: newItemName,
              text: newItemName
            }]);
            setNewItemName("");
          }
        }}>+ Add</button>
      </div>
    </div>
  );
}