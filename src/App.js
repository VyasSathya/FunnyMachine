import React, { useState, useEffect } from "react";
import "./App.css";
import libraryData from "./mockData/library"; // A big library array you showed

const pastelColors = ["#d9f0ff", "#e3d9ff", "#d9ffec", "#ffe7d9", "#ffe5fa"];

export default function App() {
  // In-memory library (like jokes/bits/sets) from library.js
  const [library, setLibrary] = useState([]);
  
  // A local state for newly created items, so we can drag them around
  const [newMaterial, setNewMaterial] = useState([]);
  const [newMaterialName, setNewMaterialName] = useState("");

  // The single item we are focusing on
  const [focusItem, setFocusItem] = useState(null);

  // The current tab in the middle panel (builder, analysis, etc.)
  const [activeTab, setActiveTab] = useState("builder");

  // The library category we are showing on the left (idea, joke, bit, set, special)
  const [activeLibCategory, setActiveLibCategory] = useState("joke");
  
  // Load from libraryData once
  useEffect(() => {
    setLibrary(libraryData);
  }, []);

  // The categories we want to display in the left library panel
  const libCategories = ["idea", "joke", "bit", "set", "special"];

  // DRAG HANDLERS
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  // When dropping onto the Focus bar
  const handleFocusDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    
    // If we already are focusing on this same item, skip
    if (focusItem && focusItem.id === data.id) return;
    
    // If there's a new item, copy it to focus
    setFocusItem(structuredClone(data));
  };

  // Pastel color for nesting levels
  const getPastelColor = (level) => {
    return pastelColors[Math.min(level, pastelColors.length - 1)];
  };

  // RENDER RECURSIVE BLOCK
  const renderBlock = (item, level = 0) => {
    const bgColor = getPastelColor(level);

    return (
      <div
        key={item.id || Math.random()}
        className="block"
        style={{ backgroundColor: bgColor, marginLeft: `${level * 24}px` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDropInsideItem(e, item)}
      >
        <strong>{item.label}</strong> <br />
        <em>{item.text}</em>

        {Array.isArray(item.children) && item.children.length > 0 && (
          <div className="nested-blocks">
            {item.children.map((child) => renderBlock(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Dropping *inside* an item that has children
  const handleDropInsideItem = (e, parentItem) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const data = JSON.parse(e.dataTransfer.getData("application/json"));

    // If this item or any nested child has the same ID, skip (avoid duplicates).
    if (containsItem(parentItem, data.id)) {
      return;
    }

    // Ensure parentItem has children
    if (!parentItem.children) {
      // Only certain types can have children
      if (["bit", "set", "special"].includes(parentItem.type)) {
        parentItem.children = [];
      } else {
        // If it's a joke or idea, maybe we do nothing or add anyway?
        // Let's do nothing to be safe
        return;
      }
    }

    parentItem.children.push(structuredClone(data));
    // re-render
    setFocusItem({ ...focusItem });
  };

  // HELPER: see if some item already includes that ID in its subtree
  const containsItem = (root, targetId) => {
    if (root.id === targetId) return true;
    if (!root.children) return false;
    for (const child of root.children) {
      if (containsItem(child, targetId)) return true;
    }
    return false;
  };

  // BUILDER TAB => show the focused item if it can nest children
  const renderBuilder = () => {
    if (!focusItem) {
      return <div className="tool-desc">No item is focused. Drag/click a library item to Focus.</div>;
    }
    // If it's a bit, set, or special, let's ensure it has children array
    if (["bit","set","special"].includes(focusItem.type) && !focusItem.children) {
      focusItem.children = [];
    }
    // Render the item itself in nested form
    return (
      <div
        className="builder-area drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e)=>{
          e.preventDefault();
          e.currentTarget.classList.remove("drag-over");
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          
          // If this item or any nested child has the same ID, skip duplicates
          if (containsItem(focusItem, data.id)) {
            return;
          }

          if (!focusItem.children && ["bit","set","special"].includes(focusItem.type)) {
            focusItem.children = [];
          }
          if (focusItem.children) {
            focusItem.children.push(structuredClone(data));
          }
          setFocusItem({ ...focusItem });
        }}
      >
        {renderBlock(focusItem, 0)}
      </div>
    );
  };

  // TABS
  const toolTabs = {
    builder: renderBuilder(),
    analysis: <div className="tool-desc">Analysis Tools for {focusItem?.label}</div>,
    versions: <div className="tool-desc">Versions or Past Recordings for {focusItem?.label}</div>,
    tags: <div className="tool-desc">Tag Suggestions for {focusItem?.label}</div>
  };

  // RENDER
  return (
    <div className="layout">
      {/* LEFT: Library Panel */}
      <div className="left-panel">
        <h2 className="panel-header">📚 Library</h2>
        <div className="tab-buttons">
          {libCategories.map((cat) => (
            <button
              key={cat}
              className={cat === activeLibCategory ? "active" : ""}
              onClick={() => setActiveLibCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="tabs">
          {library
            .filter((x) => x.type === activeLibCategory)
            .map((item) => (
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
      </div>

      {/* Middle Panel */}
      <div className="middle-panel">
        {/* FOCUS BAR */}
        <div
          className="focus-bar drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFocusDrop}
        >
          <h3>🎯 Focus</h3>
          {focusItem ? (
            <div
              className="block"
              style={{ backgroundColor: pastelColors[0] }}
              draggable
              onDragStart={(e) => handleDragStart(e, focusItem)}
            >
              <strong>{focusItem.label}</strong> <br/>
              <em>{focusItem.text}</em>
            </div>
          ) : (
            <div className="focus-placeholder">Drag or click something to focus</div>
          )}
        </div>

        {/* Tool Tabs (Builder, Analysis, Versions, Tags) */}
        <div className="middle-panel-tools">
          <div className="tab-buttons">
            {Object.keys(toolTabs).map((key) => (
              <button
                key={key}
                className={activeTab === key ? "active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <div className="tab-content">{toolTabs[activeTab]}</div>
        </div>
      </div>

      {/* RIGHT: New Material */}
      <div className="right-panel">
        <h2 className="panel-header">New Material</h2>
        <p>Drag from here or create new items</p>
        {newMaterial.map((nm, i) => (
          <div
            key={nm.type + nm.text + i}
            className="tab block"
            draggable
            onDragStart={(e) => handleDragStart(e, nm)}
            onClick={() => setFocusItem(structuredClone(nm))}
          >
            {nm.type === "segue" ? <em>{nm.text}</em> : nm.text}
          </div>
        ))}
        <div style={{ margin: "1rem 0" }}>
          <input
            placeholder="New item name"
            value={newMaterialName}
            onChange={(e) => setNewMaterialName(e.target.value)}
          />
          <button
            onClick={() => {
              if (!newMaterialName.trim()) return;
              const newItem = {
                id: Math.random().toString(36).slice(2),
                type: "joke",
                label: newMaterialName,
                text: newMaterialName
              };
              setNewMaterial([...newMaterial, newItem]);
              setNewMaterialName("");
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

