# Project TODO List

This file tracks ongoing development tasks and future plans for the FunnyMachine project.

## Immediate Tasks

- [ ] **Git:** Manually resolve push failure for the monorepo conversion commit (likely network/timeout issue).
- [ ] **Git:** Manually move remaining Python scripts (`process_and_analyze.py`, `process_remaining_specials.py`) into `analysis_engine/` directory and commit the change.
- [x] **Refactor:** Rename `core_app` to `analysis_engine/comedy_analyzer.py`.
- [x] **Refactor:** Consolidate Python analysis scripts into `analysis_engine/` directory.
- [x] **Frontend:** Fix joke saving logic (`handleSaveNewJoke`, `handleApproveSuggestion`).
- [x] **Frontend:** Fix drag-and-drop persistence (`handleDropIntoChild`, `handleReorder`).
- [x] **Frontend:** Fix joke versioning for minor variations (using Jaccard similarity).
- [x] **Frontend:** Fix `handleRejectSuggestion is not defined` error.
- [ ] **Backend:** Implement real joke detection endpoint (`/api/parse-text-for-jokes` in `comedy-construction-engine/server.js`) by calling `analysis_engine/comedy_analyzer.py`.

## Medium-Term Goals

- [ ] **Backend:** Refactor analysis logic - potentially move the call to `comedy_analyzer.py` from `comedy-construction-engine/server.js` to the main `api/` backend for better separation.
- [ ] **Backend:** Implement backend semantic similarity check for joke versioning (using `llama-models/` or cloud AI) with user confirmation UI.
- [ ] **Mobile App:** Plan core features (library viewing, basic interaction with API).
- [ ] **Mobile App:** Start foundational Flutter development (connect to API, UI layout).
- [ ] **Data:** Define process for importing/analyzing data from `specials/` directory.

## Long-Term / Future Goals

- [ ] **Mobile App:** Implement recording pipeline (record -> upload -> transcribe -> analyze).
- [ ] **AI:** Integrate custom pre-trained models from `llama-models/` into the backend analysis pipeline.
- [ ] **AI:** Explore advanced AI features (e.g., punchline suggestions, style analysis).

*(Feel free to update and reorder this list)* 