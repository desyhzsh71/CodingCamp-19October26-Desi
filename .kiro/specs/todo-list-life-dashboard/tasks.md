# Implementation Plan: Todo List Life Dashboard

## Overview

Implement a single-page dashboard using plain HTML5, CSS3, and Vanilla JavaScript (ES6+) with no build tools or backend. The app is composed of four widgets — Greeting, Focus Timer, Task Manager, and Quick Links — all wired together in three files (`index.html`, `css/styles.css`, `js/app.js`) with `localStorage` as the sole persistence layer.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` with semantic markup for all four widget sections
  - Add `<link>` to `css/styles.css` and `<script>` to `js/app.js`
  - Include all required DOM ids: `#theme-toggle`, `#greeting-message`, `#greeting-date`, `#greeting-time`, `#greeting-name-input`, `#greeting-name-save`, `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#task-input`, `#task-add-btn`, `#task-list`, `#task-error`, `#link-label-input`, `#link-url-input`, `#link-add-btn`, `#links-list`, `#link-label-error`, `#link-url-error`
  - Place `#theme-toggle` button prominently (e.g., top-right of page)
  - Create `css/styles.css` and `js/app.js` as empty files to be filled in subsequent tasks
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 8.1, 9.1_

- [x] 2. Implement StorageHelper and base CSS layout
  - [x] 2.1 Implement `StorageHelper` in `js/app.js`
    - Write `load(key)`: wraps `localStorage.getItem` + `JSON.parse` in try/catch; returns `[]` on missing key, parse error, or `SecurityError`
    - Write `save(key, data)`: wraps `JSON.stringify` + `localStorage.setItem` in try/catch; silently absorbs all exceptions
    - Storage keys used: `"tasks"` and `"links"`
    - _Requirements: 5.1, 5.2, 5.3, 5.6_
  - [x] 2.2 Write base CSS layout in `css/styles.css`
    - Define page layout (grid or flexbox) that arranges the four widget cards
    - Apply clear visual separation between widget sections, readable typography, and sufficient text/background contrast
    - _Requirements: 6.2, 6.3_

- [x] 3. Implement ThemeController
  - [x] 3.1 Implement `ThemeController` in `js/app.js`
    - Write `apply(theme)`: sets `data-theme` attribute on `<html>` element; no inline style changes
    - Write `init()`: reads `localStorage.getItem("theme")`; defaults to `"light"` if absent or throws; calls `apply()` immediately — this runs before all other widget inits to prevent theme flash
    - Write `toggle()`: flips `current` between `"light"` and `"dark"`; writes to `localStorage.setItem("theme", current)`; calls `apply()`
    - Attach click listener to `#theme-toggle` that calls `toggle()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 3.2 Add CSS theme variables to `css/styles.css`
    - Define all color and background values as CSS custom properties
    - Add `html[data-theme="light"]` block with light palette variables
    - Add `html[data-theme="dark"]` block with dark palette variables
    - Ensure all existing widget colors reference these variables (no hard-coded colors)
    - _Requirements: 8.2, 8.3_

- [x] 4. Implement GreetingController
  - [x] 4.1 Extract pure helper functions `getGreeting(hour)` and `formatTime(date)`
    - `getGreeting(hour)`: returns correct string for all four time bands (Morning: 5–11, Afternoon: 12–17, Evening: 18–20, Night: 21–4)
    - `formatTime(date)`: returns `HH:MM:SS` zero-padded string from a `Date` object
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_
  - [x] 4.2 Implement `GreetingController.init()` and `tick()`
    - `init()`: calls `tick()` immediately, then schedules `setInterval(tick, 1000)`
    - `tick()`: reads `new Date()`, calls helpers, updates `#greeting-message`, `#greeting-date`, `#greeting-time`
    - Date display format: "Wednesday, October 22, 2026" using `toLocaleDateString` with `{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }`
    - _Requirements: 1.1, 1.2, 1.7_
  - [x] 4.3 Implement `GreetingController.saveName()` and name input wiring
    - Add `userName` state (default `""`) to GreetingController
    - `init()` reads `localStorage.getItem("userName")`, pre-populates `#greeting-name-input`, sets `userName` state
    - `saveName(name)`: trims; if non-empty → `localStorage.setItem("userName", trimmed)`, update state; if empty → `localStorage.removeItem("userName")`, clear state; call `tick()` to refresh greeting immediately
    - Update `tick()` to build greeting as `"Good [Time], [UserName]"` when `userName` is non-empty, else `"Good [Time]"`
    - Attach click listener to `#greeting-name-save` that calls `saveName(#greeting-name-input.value)`
    - Add Enter keypress listener on `#greeting-name-input`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Implement TimerController
  - [x] 5.1 Extract pure helper `formatTimer(seconds)`
    - Returns `MM:SS` zero-padded string; e.g., 1500 → "25:00", 90 → "01:30", 0 → "00:00"
    - _Requirements: 2.1, 2.3_
  - [x] 5.2 Implement `TimerController` state machine (`init`, `start`, `stop`, `reset`, `countdown`, `render`)
    - State object: `{ remaining, status: 'idle'|'running'|'paused'|'finished', intervalId }`
    - `init()`: sets `remaining=1500`, `status='idle'`, calls `render()`
    - `start()`: guard — no-op if already `running`; starts `setInterval(countdown, 1000)`; sets `status='running'`; calls `render()`
    - `stop()`: guard — no-op if not `running`; clears interval; sets `status='paused'`; calls `render()`
    - `reset()`: clears interval; resets to `{remaining:1500, status:'idle', intervalId:null}`; calls `render()`
    - `countdown()`: decrements `remaining`; if `0`, clears interval, sets `status='finished'`; calls `render()`
    - `render()`: formats `remaining` with `formatTimer`; updates `#timer-display`; toggles `disabled` on `#timer-start`, `#timer-stop`, `#timer-reset` per the button-state table
    - Timer state is NOT persisted to `localStorage` (session-only by design)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 6. Implement TaskController
  - [x] 6.1 Extract pure helper `validateTask(text, currentId?)`
    - Returns `null` for valid input
    - Returns `"Task description cannot be empty."` for empty or whitespace-only input after trim
    - Returns `"Task description must be 500 characters or fewer."` for trimmed length > 500
    - Optional `currentId` parameter provides edit context — duplicate check excludes the task with that id
    - Duplicate check for add: `tasks.some(t => t.text.toLowerCase() === trimmed.toLowerCase())`
    - Duplicate check for edit: `tasks.some(t => t.id !== currentId && t.text.toLowerCase() === trimmed.toLowerCase())`
    - Returns `"A task with this description already exists."` on duplicate match
    - _Requirements: 3.2, 3.3, 3.3a, 3.5, 3.6, 3.6a, 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 6.2 Implement `TaskController` (`init`, `add`, `edit`, `toggleComplete`, `remove`, `render`)
    - `init()`: calls `StorageHelper.load("tasks")`; on `SecurityError` or corrupt data (empty array returned by helper), shows message per requirement 3.12; calls `render()`
    - `add(description)`: validates with `validateTask(text)` (no currentId); on error writes message to `#task-error` and returns; on success creates `{ id: crypto.randomUUID(), text: trimmed, completed: false }`, pushes to array, calls `StorageHelper.save("tasks", tasks)`, clears `#task-error`, calls `render()`
    - `edit(id, newText)`: validates with `validateTask(newText, id)` (passes currentId for duplicate exclusion); on error shows inline message; on success updates task text, persists, re-renders
    - `toggleComplete(id)`: flips `completed` flag, persists, re-renders
    - `remove(id)`: filters out task by id, persists, re-renders
    - `render()`: clears `#task-list`; rebuilds `<li>` elements each with complete toggle, edit, delete controls; applies strikethrough class when `completed===true`
    - Attach event listener to `#task-add-btn` click and `#task-input` Enter keypress
    - _Requirements: 3.1, 3.2, 3.3, 3.3a, 3.4, 3.5, 3.6, 3.6a, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 7. Implement LinkController
  - [x] 7.1 Extract pure helper `validateLink(label, url)`
    - Validates label: non-empty after trim → `"Link label cannot be empty."`; trimmed length > 50 → `"Link label must be 50 characters or fewer."`
    - Validates url: non-empty after trim → `"URL cannot be empty."`; trimmed length > 2048 → `"URL must be 2048 characters or fewer."`; does not start with `http://` or `https://` → `"URL must begin with http:// or https://."`
    - Returns `{ labelError: string|null, urlError: string|null }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 7.2 Implement `LinkController` (`init`, `add`, `remove`, `render`)
    - `init()`: calls `StorageHelper.load("links")`; on failure shows inline message per requirement 4.8; calls `render()`
    - `add(label, url)`: checks count < 20 (else writes max-links message and returns); validates with `validateLink`; on error writes per-field messages to `#link-label-error` / `#link-url-error` and returns; on success creates `{ id: crypto.randomUUID(), label: trimmedLabel, url: trimmedUrl }`, pushes to array, persists, clears inputs and errors, re-renders
    - `remove(id)`: filters out link by id, persists, re-renders
    - `render()`: clears `#links-list`; rebuilds link `<button>` elements (open URL in new tab via `window.open(url, '_blank')`) each with a delete control
    - Attach event listener to `#link-add-btn` click
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [x] 8. Wire everything together in `init()` and complete CSS
  - [x] 8.1 Implement `init()` bootstrap function in `js/app.js`
    - Wrap in `DOMContentLoaded` listener
    - Call in order: `ThemeController.init()` first (prevents theme flash), then `StorageHelper` (no init needed), `GreetingController.init()`, `TimerController.init()`, `TaskController.init()`, `LinkController.init()`
    - Attach all remaining event listeners for timer controls (`#timer-start`, `#timer-stop`, `#timer-reset`)
    - _Requirements: 5.4, 6.5, 8.5_
  - [x] 8.2 Complete CSS styling for all widget states
    - Task: strikethrough style for completed tasks; inline edit mode styles; error message styles for `#task-error`
    - Timer: visual/textual completion indicator when `status==='finished'`; button disabled states
    - Links: button styles for link items; per-field error message styles
    - Ensure all four widgets are visually distinct sections with clear hierarchy
    - _Requirements: 3.7, 2.7, 6.2, 6.3_

## Notes

- Timer state is session-only and is intentionally not persisted to `localStorage`
- `crypto.randomUUID()` is available in all target Modern_Browsers; fall back to `Date.now().toString()` if needed
- `ThemeController.init()` must be called before all other widget inits to prevent theme flash

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.2", "4.1", "5.1", "6.1", "7.1"] },
    { "id": 2, "tasks": ["4.2", "5.2", "6.2", "7.2"] },
    { "id": 3, "tasks": ["4.3"] },
    { "id": 4, "tasks": ["8.1", "8.2"] }
  ]
}
```
