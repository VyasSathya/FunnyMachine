// src/App.js

import React, { useState, useEffect } from "react";
import "./App.css";
import libraryData from "./mockData/library";

function containsItem(root, targetId) {
  if (root.id === targetId) return true;
  if (!root.children) return false;
  for (const child of root.children) {
    if (containsItem(child, targetId)) return true;
  }
  return false;
}

const pastelColors = ["#d9f0ff", "#e3d9ff", "#d9ffec", "#ffe7d9", "#ffe5fa", "#fff4d9"];

function renderBlock(item, level, onDropChild) {
  const bg = pastelColors[Math.min(level, pastelColors.length - 1)];

  return (
    <div
      key={item.id}
      className="block"
      style={{ backgroundColor: bg, marginLeft: `${level * 24}px` }}
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
      <strong>{item.label}</strong>
      <br />
      <em style={{ fontSize: "0.85rem" }}>{item.text}</em>
      <div style={{ fontSize: "0.7rem", color: "#888" }}>({item.type})</div>
      {Array.isArray(item.children) && item.children.length > 0 && (
        <div className="nested-blocks">
          {item.children.map((child) => renderBlock(child, level + 1, onDropChild))}
        </div>
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

  useEffect(() => {
    const saved = localStorage.getItem("comedyFocusItem");
    if (saved) {
      setFocusItem(JSON.parse(saved));
    }
    const savedLibrary = localStorage.getItem("comedyLibrary");
    if (savedLibrary) {
      setLibrary(JSON.parse(savedLibrary));
    } else {
      setLibrary(libraryData);
    }
  }, []);

  useEffect(() => {
    if (focusItem) {
      localStorage.setItem("comedyFocusItem", JSON.stringify(focusItem));
      // Update library with modified focus item
      setLibrary((prevLib) => {
        const updated = prevLib.map((item) => (item.id === focusItem.id ? focusItem : item));
        localStorage.setItem("comedyLibrary", JSON.stringify(updated));
        return updated;
      });
    }
  }, [focusItem]);

  function handleDragStart(e, item) {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  }
  function handleFocusDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    if (focusItem && focusItem.id === data.id) return;
    setFocusItem(structuredClone(data));
  }
  function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }
  function handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }
  function handleDropIntoChild(e, parent) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    if (!parent.children) parent.children = [];
    if (containsItem(parent, data.id)) return;
    parent.children.push(structuredClone(data));
    setFocusItem({ ...focusItem });
  }

  function renderBuilderTab() {
    if (!focusItem) {
      return <div className="tool-desc">No item in focus. Drag/click from library to focus.</div>;
    }
    if (["bit", "set", "special"].includes(focusItem.type) && !focusItem.children) {
      focusItem.children = [];
    }
    return (
      <div
        className="builder-area drop-zone"
        onDragOver={allowDrop}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("drag-over");
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          if (!focusItem.children) focusItem.children = [];
          if (containsItem(focusItem, data.id)) return;
          focusItem.children.push(structuredClone(data));
          setFocusItem({ ...focusItem });
        }}
      >
        {renderBlock(focusItem, 0, handleDropIntoChild)}
      </div>
    );
  }

  function renderTextTab() {
    if (!focusItem) return <div className="tool-desc">No focus item. Drag/click from library.</div>;
    let lines = [];
    function printItem(it, depth = 0) {
      const prefix = "  ".repeat(depth);
      lines.push(prefix + (it.text || it.label));
      if (it.children && it.children.length > 0) {
        for (const c of it.children) {
          printItem(c, depth + 1);
        }
      }
    }
    printItem(focusItem, 0);
    return <pre style={{ padding: "8px", background: "#f9f9f9", borderRadius: 4 }}>{lines.join("\n")}</pre>;
  }

  const categories = ["idea", "joke", "bit", "set", "special"];
  const filteredLib = library.filter((item) => item.type === activeLibCategory);

  const tabContentMap = {
    builder: renderBuilderTab(),
    text: renderTextTab(),
    versions: <div className="tool-desc">Versions for {focusItem?.label}</div>,
    tags: <div className="tool-desc">Tags for {focusItem?.label}</div>
  };

  return (
    <div className="layout">
      <div className="left-panel">
        <h2 className="panel-header">📚 Library</h2>
        <div className="tab-buttons">
          {categories.map((cat) => (
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
          {filteredLib.map((item) => (
            <div
              key={item.id}
              className="tab"
              draggable
              style={{ cursor: "grab" }}
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => setFocusItem(structuredClone(item))}
            >
              {item.label || item.text}
            </div>
          ))}
        </div>
      </div>

      <div className="middle-panel">
        <div
          className="focus-bar drop-zone"
          onDragOver={allowDrop}
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
              <strong>{focusItem.label}</strong>
              <br />
              <em style={{ fontSize: "0.85rem" }}>{focusItem.text}</em>
              <div style={{ fontSize: "0.7rem", color: "#777" }}>({focusItem.type})</div>
            </div>
          ) : (
            <div className="focus-placeholder">Drag/click something here to focus</div>
          )}
        </div>

        <div className="middle-panel-tools">
          <div className="tab-buttons">
            {Object.keys(tabContentMap).map((tabKey) => (
              <button
                key={tabKey}
                className={tabKey === activeTab ? "active" : ""}
                onClick={() => setActiveTab(tabKey)}
              >
                {tabKey}
              </button>
            ))}
          </div>
          <div className="tab-content" style={{ overflow: "auto", flex: "1" }}>
            {tabContentMap[activeTab]}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <h2 className="panel-header">New Material</h2>
        <div className="input-section" style={{ marginBottom: "8px" }}>
          <button>Text</button>
          <button>Record</button>
          <button>Upload</button>
          <button>Organize</button>
        </div>
        <div>
          <input
            placeholder="New item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            style={{ marginBottom: "4px", padding: "4px" }}
          />
          <button
            onClick={() => {
              if (!newItemName.trim()) return;
              const newObj = {
                id: Math.random().toString(36).slice(2),
                type: "joke",
                label: newItemName,
                text: newItemName
              };
              setLibrary([...library, newObj]);
              setNewItemName("");
            }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}