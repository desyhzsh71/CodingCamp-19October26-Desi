// app.js — Life Dashboard
// Single JavaScript file for all four widgets.
// Controllers: ThemeController, GreetingController, TimerController,
//              TaskController, LinkController
// Helpers:     StorageHelper, getGreeting, formatTime, formatTimer,
//              validateTask, validateLink

// ─── StorageHelper ────────────────────────────────────────────────────────────
// Thin wrapper around localStorage for array-type data (tasks and links).
// All access is guarded so that SecurityError, missing keys, and corrupt JSON
// never propagate as uncaught exceptions to the rest of the application.
//
// Storage keys managed here:
//   "tasks"  — array of Task objects
//   "links"  — array of Link objects
//
// Note: scalar keys ("theme", "userName") are accessed directly via
// localStorage in their respective controllers, not through StorageHelper.

const StorageHelper = {
  /**
   * Reads the value stored at `key` from localStorage, parses it as JSON,
   * and returns the resulting array.
   *
   * Returns [] when:
   *   - the key does not exist (getItem returns null)
   *   - the stored string cannot be parsed as valid JSON
   *   - localStorage throws a SecurityError (e.g. private-browsing restriction)
   *   - any other unexpected exception occurs
   *
   * @param {string} key - localStorage key to read
   * @returns {any[]}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return [];
      }
      return JSON.parse(raw);
    } catch (_err) {
      // Catches SecurityError, SyntaxError from JSON.parse, and anything else.
      return [];
    }
  },

  /**
   * Serialises `data` to JSON and writes it to localStorage under `key`.
   * Silently absorbs all exceptions (SecurityError, QuotaExceededError, etc.).
   * The in-memory state remains authoritative for the current session if the
   * write fails.
   *
   * @param {string} key  - localStorage key to write
   * @param {any[]}  data - array to serialise and store
   * @returns {void}
   */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_err) {
      // Silently absorbed — storage failure must not crash the application.
    }
  },
};

// ─── ThemeController ──────────────────────────────────────────────────────────
// Manages light/dark theme switching via a `data-theme` attribute on <html>.
// All theme colours are implemented as CSS custom properties; this controller
// never touches inline styles.
//
// localStorage key: "theme"  (scalar — accessed directly, not via StorageHelper)
//
// Public API:
//   ThemeController.init()        — reads saved theme, applies it, wires button
//   ThemeController.toggle()      — flips theme and persists
//   ThemeController.apply(theme)  — sets data-theme attribute (internal + reusable)

const ThemeController = {
  /** @type {'light'|'dark'} */
  state: { current: 'light' },

  /**
   * Sets the `data-theme` attribute on the root <html> element.
   * Never mutates inline styles.
   *
   * @param {'light'|'dark'} theme
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  /**
   * Reads the persisted theme from localStorage (key "theme").
   * Defaults to "light" if the key is absent or localStorage throws.
   * Applies the theme immediately (before other widgets init) to prevent
   * a flash of the wrong theme on load.
   * Attaches the click listener to #theme-toggle.
   */
  init() {
    let saved = 'light';
    try {
      const raw = localStorage.getItem('theme');
      if (raw === 'light' || raw === 'dark') {
        saved = raw;
      }
    } catch (_err) {
      // SecurityError or similar — fall back to default "light"
    }

    this.state.current = saved;
    this.apply(saved);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  },

  /**
   * Flips the current theme between "light" and "dark", persists the new
   * value to localStorage, and applies it to the document.
   */
  toggle() {
    const next = this.state.current === 'light' ? 'dark' : 'light';
    this.state.current = next;
    try {
      localStorage.setItem('theme', next);
    } catch (_err) {
      // Silently absorbed — in-memory state is still updated
    }
    this.apply(next);
  },
};

// ─── Greeting helpers ─────────────────────────────────────────────────────────

/**
 * Returns the appropriate greeting string for the given hour of the day.
 *
 * Time bands (24-hour):
 *   Morning   05–11  →  "Good Morning"
 *   Afternoon 12–17  →  "Good Afternoon"
 *   Evening   18–20  →  "Good Evening"
 *   Night     21–04  →  "Good Night"
 *
 * @param {number} hour - Integer hour value (0–23)
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) {
    return 'Good Morning';
  } else if (hour >= 12 && hour <= 17) {
    return 'Good Afternoon';
  } else if (hour >= 18 && hour <= 20) {
    return 'Good Evening';
  } else {
    // Covers 21–23 and 0–4 (night / late night)
    return 'Good Night';
  }
}

/**
 * Formats a Date object as a zero-padded HH:MM:SS string (24-hour clock).
 *
 * Example: new Date with hours=9, minutes=4, seconds=2  →  "09:04:02"
 *
 * @param {Date} date - A Date object to format
 * @returns {string}
 */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ─── TimerController helpers ──────────────────────────────────────────────────

/**
 * Formats a duration given in whole seconds as a zero-padded MM:SS string.
 *
 * Formula:
 *   minutes = Math.floor(seconds / 60)
 *   secs    = seconds % 60
 *   Both parts are zero-padded to 2 digits with String.padStart(2, '0').
 *
 * Examples:
 *   formatTimer(1500) → "25:00"
 *   formatTimer(90)   → "01:30"
 *   formatTimer(65)   → "01:05"
 *   formatTimer(0)    → "00:00"
 *
 * Requirements: 2.1, 2.3
 *
 * @param {number} seconds - total seconds remaining (non-negative integer)
 * @returns {string} formatted time string in MM:SS format
 */
function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// ─── validateTask (pure helper) ───────────────────────────────────────────────
// Validates a task description before it is added or saved during an edit.
// All validation rules are applied in order; the first failing rule returns
// its error message and subsequent rules are skipped.
//
// @param {string}      text      - raw input string from the user
// @param {Object[]}    tasks     - current tasks array (used for duplicate check)
// @param {string|undefined} currentId - id of the task being edited; when
//                                       provided the duplicate check excludes
//                                       that task so a task is not flagged as
//                                       a duplicate of itself.
// @returns {string|null} - error message string, or null when the input is valid
//
// Validation rules (applied in order):
//   1. Empty / whitespace-only  → "Task description cannot be empty."
//   2. Trimmed length > 500     → "Task description must be 500 characters or fewer."
//   3. Duplicate (add mode)     → tasks.some(t => t.text.toLowerCase() === trimmed.toLowerCase())
//   3. Duplicate (edit mode)    → tasks.some(t => t.id !== currentId && …)
//      Both duplicate paths     → "A task with this description already exists."
//
// Requirements: 3.2, 3.3, 3.3a, 3.5, 3.6, 3.6a, 10.1, 10.2, 10.3, 10.4, 10.5

/**
 * Validates a task description string.
 *
 * @param {string}            text      - raw (un-trimmed) input from the user
 * @param {Array<{id: string, text: string}>} tasks - current tasks array
 * @param {string} [currentId]          - id of the task being edited (omit for add)
 * @returns {string|null}               - validation error message, or null if valid
 */
function validateTask(text, tasks, currentId) {
  const trimmed = text.trim();

  // Rule 1: empty or whitespace-only
  if (trimmed.length === 0) {
    return 'Task description cannot be empty.';
  }

  // Rule 2: exceeds maximum length
  if (trimmed.length > 500) {
    return 'Task description must be 500 characters or fewer.';
  }

  // Rule 3: duplicate check (case-insensitive, trimmed comparison)
  const lowerTrimmed = trimmed.toLowerCase();
  const isDuplicate = currentId === undefined
    // Add mode — compare against all existing tasks
    ? tasks.some(t => t.text.toLowerCase() === lowerTrimmed)
    // Edit mode — exclude the task being edited from the comparison
    : tasks.some(t => t.id !== currentId && t.text.toLowerCase() === lowerTrimmed);

  if (isDuplicate) {
    return 'A task with this description already exists.';
  }

  // All checks passed — input is valid
  return null;
}

// ─── validateLink (pure helper) ───────────────────────────────────────────────
// Validates a link label and URL before a Link is saved.
// Each field is validated independently; both errors can be returned at once.
//
// Validation rules — label:
//   1. Empty / whitespace-only  → "Link label cannot be empty."
//   2. Trimmed length > 50      → "Link label must be 50 characters or fewer."
//
// Validation rules — url:
//   1. Empty / whitespace-only  → "URL cannot be empty."
//   2. Trimmed length > 2048    → "URL must be 2048 characters or fewer."
//   3. Does not start with http:// or https://
//                               → "URL must begin with http:// or https://."
//
// @param {string} label - raw label input from the user
// @param {string} url   - raw URL input from the user
// @returns {{ labelError: string|null, urlError: string|null }}
//
// Requirements: 4.1, 4.2, 4.3, 4.4

/**
 * Validates a link label and URL.
 *
 * @param {string} label - raw (un-trimmed) label from the user
 * @param {string} url   - raw (un-trimmed) URL from the user
 * @returns {{ labelError: string|null, urlError: string|null }}
 */
function validateLink(label, url) {
  let labelError = null;
  let urlError = null;

  // — Label validation —
  const trimmedLabel = label.trim();
  if (trimmedLabel.length === 0) {
    labelError = 'Link label cannot be empty.';
  } else if (trimmedLabel.length > 50) {
    labelError = 'Link label must be 50 characters or fewer.';
  }

  // — URL validation —
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    urlError = 'URL cannot be empty.';
  } else if (trimmedUrl.length > 2048) {
    urlError = 'URL must be 2048 characters or fewer.';
  } else if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    urlError = 'URL must begin with http:// or https://.';
  }

  return { labelError, urlError };
}

// ─── GreetingController ───────────────────────────────────────────────────────
// Manages the live clock, date string, time-of-day greeting, and optional
// custom user name display. A 1-second interval drives the live updates.
//
// localStorage key: "userName"  (scalar — accessed directly, not via StorageHelper)
//
// Public API:
//   GreetingController.init()          — reads userName, renders immediately,
//                                        then schedules setInterval(tick, 1000)
//   GreetingController.tick()          — reads current time and updates DOM
//   GreetingController.saveName(name)  — trims, persists, refreshes display
//
// DOM targets:
//   #greeting-message    — e.g. "Good Morning" or "Good Morning, Alex"
//   #greeting-time       — e.g. "09:14:32"
//   #greeting-date       — e.g. "Wednesday, October 22, 2026"
//   #greeting-name-input — text input pre-populated with saved name
//   #greeting-name-save  — save button
//
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1, 9.2, 9.3, 9.4, 9.5

const GreetingController = {
  /** @type {string} */
  userName: '',

  /**
   * Reads the current time and date, builds the greeting string (with optional
   * name), and pushes values into the DOM.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.2, 9.3
   */
  tick() {
    const now = new Date();
    const greetingBase = getGreeting(now.getHours());
    const greeting = this.userName
      ? `${greetingBase}, ${this.userName}`
      : greetingBase;

    const msgEl = document.getElementById('greeting-message');
    const dateEl = document.getElementById('greeting-date');
    const timeEl = document.getElementById('greeting-time');

    if (msgEl) msgEl.textContent = greeting;
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    if (timeEl) timeEl.textContent = formatTime(now);
  },

  /**
   * Trims and persists (or removes) the user name, then refreshes the greeting.
   *
   * @param {string} name - raw value from the name input
   *
   * Requirements: 9.2, 9.3
   */
  saveName(name) {
    const trimmed = name.trim();
    if (trimmed) {
      try {
        localStorage.setItem('userName', trimmed);
      } catch (_err) { /* silently absorbed */ }
      this.userName = trimmed;
    } else {
      try {
        localStorage.removeItem('userName');
      } catch (_err) { /* silently absorbed */ }
      this.userName = '';
    }
    this.tick();
  },

  /**
   * Bootstraps the greeting widget: loads saved name, starts the 1-second
   * interval, and wires the Save button and Enter key on the name input.
   *
   * Requirements: 1.7, 9.4, 9.5
   */
  init() {
    // Load persisted name
    try {
      const saved = localStorage.getItem('userName');
      if (saved) {
        this.userName = saved;
        const nameInput = document.getElementById('greeting-name-input');
        if (nameInput) nameInput.value = saved;
      }
    } catch (_err) { /* SecurityError — no name loaded */ }

    // Run immediately then every second
    this.tick();
    setInterval(() => this.tick(), 1000);

    // Wire Save button
    const saveBtn = document.getElementById('greeting-name-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('greeting-name-input');
        this.saveName(input ? input.value : '');
      });
    }

    // Wire Enter key on name input
    const nameInput = document.getElementById('greeting-name-input');
    if (nameInput) {
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveName(nameInput.value);
        }
      });
    }
  },
};

// ─── TimerController ──────────────────────────────────────────────────────────
// Manages the 25-minute Pomodoro countdown timer.
// Timer state is session-only and intentionally NOT persisted to localStorage.
//
// State machine:
//   idle → running → paused → running (resume)
//                → finished (when remaining reaches 0)
//   Any state → idle (reset)
//
// Public API:
//   TimerController.init()      — sets initial state and renders
//   TimerController.start()     — starts or resumes countdown
//   TimerController.stop()      — pauses countdown
//   TimerController.reset()     — stops and resets to 25:00
//   TimerController.countdown() — internal: decrements remaining each second
//   TimerController.render()    — updates DOM and button disabled states
//
// Button-state table:
//   idle     → Start enabled,  Stop disabled, Reset enabled
//   running  → Start disabled, Stop enabled,  Reset enabled
//   paused   → Start enabled,  Stop disabled, Reset enabled
//   finished → Start enabled,  Stop disabled, Reset enabled
//
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10

const TimerController = {
  state: {
    remaining: 1500,
    /** @type {'idle'|'running'|'paused'|'finished'} */
    status: 'idle',
    intervalId: null,
  },

  /**
   * Updates the display and button disabled states to match current state.
   *
   * Requirements: 2.1, 2.3, 2.7, 2.8, 2.9
   */
  render() {
    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (display) {
      const timeText = formatTimer(this.state.remaining);
      // Visual indication that the session ended (requirement 2.7)
      if (this.state.status === 'finished') {
        display.textContent = timeText + ' — Session complete!';
        display.classList.add('timer-finished');
      } else {
        display.textContent = timeText;
        display.classList.remove('timer-finished');
      }
    }

    // Button-state table:
    //   idle     → start enabled,  stop disabled,  reset enabled
    //   running  → start disabled, stop enabled,   reset enabled
    //   paused   → start enabled,  stop disabled,  reset enabled
    //   finished → start enabled,  stop disabled,  reset enabled
    const { status } = this.state;
    if (startBtn) startBtn.disabled = status === 'running';
    if (stopBtn)  stopBtn.disabled  = status !== 'running';
    if (resetBtn) resetBtn.disabled = false;
  },

  /**
   * Decrements remaining by 1; stops automatically at 0.
   *
   * Requirements: 2.3, 2.6, 2.7
   */
  countdown() {
    this.state.remaining -= 1;
    if (this.state.remaining <= 0) {
      this.state.remaining = 0;
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
      this.state.status = 'finished';
    }
    this.render();
  },

  /**
   * Starts (or resumes) the countdown. No-op if already running.
   *
   * Requirements: 2.2, 2.8, 2.10
   */
  start() {
    if (this.state.status === 'running') return;
    this.state.intervalId = setInterval(() => this.countdown(), 1000);
    this.state.status = 'running';
    this.render();
  },

  /**
   * Pauses the countdown. No-op if not currently running.
   *
   * Requirements: 2.4, 2.9
   */
  stop() {
    if (this.state.status !== 'running') return;
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
    this.state.status = 'paused';
    this.render();
  },

  /**
   * Stops any active countdown and resets to the initial 25-minute state.
   *
   * Requirements: 2.5
   */
  reset() {
    clearInterval(this.state.intervalId);
    this.state.remaining = 1500;
    this.state.status = 'idle';
    this.state.intervalId = null;
    this.render();
  },

  /**
   * Initialises the timer to its default state and renders the display.
   * Does NOT attach button event listeners — those are wired in the global
   * DOMContentLoaded handler (task 8.1).
   *
   * Requirements: 2.1
   */
  init() {
    this.state.remaining = 1500;
    this.state.status = 'idle';
    this.state.intervalId = null;
    this.render();
  },
};

// ─── TaskController ───────────────────────────────────────────────────────────
// Manages the Task Manager widget: add, edit, toggle-complete, delete, and
// render. All mutations persist through StorageHelper.
//
// Task object shape:  { id: string, text: string, completed: boolean }
// localStorage key: "tasks"  (managed via StorageHelper)
//
// Public API:
//   TaskController.init()                — loads tasks, renders, wires inputs
//   TaskController.add(description)      — validates and adds a new task
//   TaskController.edit(id, newText)     — validates and updates task text
//   TaskController.toggleComplete(id)    — flips completed flag
//   TaskController.remove(id)            — removes a task by id
//   TaskController.render()              — rebuilds #task-list from tasks array
//
// Requirements: 3.1, 3.2, 3.3, 3.3a, 3.4, 3.5, 3.6, 3.6a, 3.7, 3.8, 3.9,
//               3.10, 3.11, 3.12

const TaskController = {
  /** @type {Array<{id: string, text: string, completed: boolean}>} */
  tasks: [],

  // ── Initialisation ────────────────────────────────────────────────────────

  /**
   * Loads tasks from localStorage, shows an error if the load fails (returns
   * an empty array due to corrupt / unavailable data), wires input controls,
   * and performs the initial render.
   *
   * Requirements: 3.1, 3.11, 3.12
   */
  init() {
    const loaded = StorageHelper.load('tasks');

    // StorageHelper returns [] both for "empty list" and "corrupt/unavailable".
    // We distinguish them by checking whether the raw localStorage value exists
    // and is non-null — if it exists but load() still returned [], the data
    // was corrupt. If the key was simply absent, we silently start with [].
    let storageError = false;
    try {
      const raw = localStorage.getItem('tasks');
      if (raw !== null && loaded.length === 0) {
        // Raw value present but produced empty array → likely corrupt JSON
        storageError = true;
      }
    } catch (_err) {
      // SecurityError — localStorage inaccessible
      storageError = true;
    }

    this.tasks = loaded;

    const errorEl = document.getElementById('task-error');
    if (storageError && errorEl) {
      errorEl.textContent = 'Saved tasks could not be loaded.';
    }

    // Wire Add button
    const addBtn = document.getElementById('task-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const input = document.getElementById('task-input');
        this.add(input ? input.value : '');
      });
    }

    // Wire Enter key on task input
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
      taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.add(taskInput.value);
        }
      });
    }

    this.render();
  },

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Validates `description`, creates a new task, persists, and re-renders.
   * Writes a validation message to #task-error on failure.
   *
   * Requirements: 3.2, 3.3, 3.3a, 3.10
   *
   * @param {string} description - raw value from the task input field
   */
  add(description) {
    const errorEl = document.getElementById('task-error');
    const error = validateTask(description, this.tasks);

    if (error) {
      if (errorEl) errorEl.textContent = error;
      return;
    }

    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString();

    this.tasks.push({ id, text: description.trim(), completed: false });
    StorageHelper.save('tasks', this.tasks);

    if (errorEl) errorEl.textContent = '';

    const taskInput = document.getElementById('task-input');
    if (taskInput) taskInput.value = '';

    this.render();
  },

  /**
   * Validates `newText` for the task identified by `id`, updates the task,
   * persists, and re-renders. Shows an inline error near the edit input on
   * failure.
   *
   * Requirements: 3.5, 3.6, 3.6a, 3.10
   *
   * @param {string} id      - id of the task being edited
   * @param {string} newText - raw value from the inline edit input
   */
  edit(id, newText) {
    const error = validateTask(newText, this.tasks, id);

    if (error) {
      // Show inline error adjacent to the edit input for this task
      const editErrorEl = document.getElementById(`task-edit-error-${id}`);
      if (editErrorEl) editErrorEl.textContent = error;
      return;
    }

    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.text = newText.trim();
    }

    StorageHelper.save('tasks', this.tasks);
    this.render();
  },

  /**
   * Flips the `completed` boolean for the task with the given id, persists,
   * and re-renders.
   *
   * Requirements: 3.7, 3.8, 3.10
   *
   * @param {string} id - id of the task to toggle
   */
  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
    StorageHelper.save('tasks', this.tasks);
    this.render();
  },

  /**
   * Removes the task with the given id, persists, and re-renders.
   *
   * Requirements: 3.9, 3.10
   *
   * @param {string} id - id of the task to remove
   */
  remove(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    StorageHelper.save('tasks', this.tasks);
    this.render();
  },

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Clears #task-list and rebuilds it from the current tasks array.
   * Each <li> contains:
   *   - a complete-toggle checkbox
   *   - task text (with strikethrough when completed)
   *   - an Edit button that switches the item to inline edit mode
   *   - a Delete button
   *
   * Requirements: 3.4, 3.7, 3.8
   */
  render() {
    const list = document.getElementById('task-list');
    if (!list) return;

    list.innerHTML = '';

    this.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;

      // ── Complete toggle checkbox ──────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
      checkbox.addEventListener('change', () => this.toggleComplete(task.id));

      // ── Task text span ────────────────────────────────────────────────────
      const textSpan = document.createElement('span');
      textSpan.className = task.completed ? 'task-text task-completed' : 'task-text';
      textSpan.textContent = task.text;

      // ── Edit button ───────────────────────────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary task-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
      editBtn.addEventListener('click', () => this._enterEditMode(li, task));

      // ── Delete button ─────────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger task-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
      deleteBtn.addEventListener('click', () => this.remove(task.id));

      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  },

  // ── Internal helpers ──────────────────────────────────────────────────────

  /**
   * Replaces the normal task row content with an inline edit form.
   * The form contains a pre-filled text input, a Save button, a Cancel
   * button, and a per-task error element.
   *
   * Requirement: 3.4
   *
   * @param {HTMLLIElement}                          li   - the list item to transform
   * @param {{id: string, text: string, completed: boolean}} task - the task being edited
   */
  _enterEditMode(li, task) {
    // Clear existing children
    li.innerHTML = '';
    li.classList.add('task-item--editing');

    // Pre-filled text input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'text-input task-edit-input';
    editInput.value = task.text;
    editInput.maxLength = 500;
    editInput.setAttribute('aria-label', `Edit description for task: ${task.text}`);

    // Inline error element (referenced by edit() via id)
    const editError = document.createElement('p');
    editError.className = 'error-message task-edit-error';
    editError.id = `task-edit-error-${task.id}`;
    editError.setAttribute('role', 'alert');
    editError.setAttribute('aria-live', 'assertive');

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary task-edit-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.setAttribute('aria-label', 'Save task edit');
    saveBtn.addEventListener('click', () => this.edit(task.id, editInput.value));

    // Allow Enter key to save
    editInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.edit(task.id, editInput.value);
    });

    // Cancel button — re-renders to exit edit mode without saving
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary task-edit-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel task edit');
    cancelBtn.addEventListener('click', () => this.render());

    li.appendChild(editInput);
    li.appendChild(editError);
    li.appendChild(saveBtn);
    li.appendChild(cancelBtn);

    // Focus the input so the user can start typing immediately
    editInput.focus();
    // Place cursor at end of existing text
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  },
};

// ─── LinkController ───────────────────────────────────────────────────────────
// Manages the Quick Links widget: adding, removing, and rendering link buttons.
//
// Link object shape: { id: string, label: string, url: string }
//
// Storage key: "links"  (array — accessed via StorageHelper)
//
// Public API:
//   LinkController.init()           — loads from storage, renders, wires button
//   LinkController.add(label, url)  — validates and adds a new link
//   LinkController.remove(id)       — removes a link by id, persists, re-renders
//   LinkController.render()         — rebuilds the #links-list DOM
//
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9

const LinkController = {
  /** @type {Array<{id: string, label: string, url: string}>} */
  links: [],

  /**
   * Initialises the controller:
   * - Loads persisted links from localStorage.
   * - On load failure (SecurityError or corrupt JSON), shows an inline error
   *   message in #link-label-error per requirement 4.8.
   * - Renders the current link list.
   * - Attaches a click listener to #link-add-btn.
   *
   * Requirements: 4.8, 5.4
   */
  init() {
    // We read localStorage directly (not via StorageHelper) so we can
    // distinguish a SecurityError / corrupt-data failure from a genuinely
    // empty saved list.
    let loadError = false;
    try {
      const raw = localStorage.getItem('links');
      if (raw !== null) {
        // Key exists — parse it; if this throws it means corrupt data.
        this.links = JSON.parse(raw);
      }
      // raw === null means no data saved yet — empty list is expected, no error.
    } catch (_err) {
      // SecurityError (storage blocked) or SyntaxError (corrupt JSON)
      this.links = [];
      loadError = true;
    }

    if (loadError) {
      const labelErrEl = document.getElementById('link-label-error');
      if (labelErrEl) {
        labelErrEl.textContent = 'Saved links could not be loaded.';
      }
    }

    this.render();

    const addBtn = document.getElementById('link-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const labelInput = document.getElementById('link-label-input');
        const urlInput   = document.getElementById('link-url-input');
        this.add(
          labelInput ? labelInput.value : '',
          urlInput   ? urlInput.value   : ''
        );
      });
    }
  },

  /**
   * Adds a new link after validating the label and URL.
   *
   * Steps:
   *   1. Enforce 20-link maximum (requirement 4.9).
   *   2. Validate with validateLink(); display per-field errors and return on failure.
   *   3. Create link object, push, persist, clear inputs/errors, re-render.
   *
   * @param {string} label - raw label from the input field
   * @param {string} url   - raw URL from the input field
   *
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.9
   */
  add(label, url) {
    const labelErrEl = document.getElementById('link-label-error');
    const urlErrEl   = document.getElementById('link-url-error');

    // Step 1: enforce maximum link count (requirement 4.9)
    if (this.links.length >= 20) {
      if (labelErrEl) labelErrEl.textContent = 'Maximum of 20 links reached.';
      return;
    }

    // Step 2: validate fields
    const { labelError, urlError } = validateLink(label, url);

    if (labelError || urlError) {
      if (labelErrEl) labelErrEl.textContent = labelError || '';
      if (urlErrEl)   urlErrEl.textContent   = urlError   || '';
      return;
    }

    // Step 3: create link, persist, clear UI, re-render
    const trimmedLabel = label.trim();
    const trimmedUrl   = url.trim();

    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString();

    this.links.push({ id, label: trimmedLabel, url: trimmedUrl });
    StorageHelper.save('links', this.links);

    // Clear inputs
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';

    // Clear error messages
    if (labelErrEl) labelErrEl.textContent = '';
    if (urlErrEl)   urlErrEl.textContent   = '';

    this.render();
  },

  /**
   * Removes the link with the given id, persists the updated list, and
   * re-renders the links list.
   *
   * @param {string} id - id of the link to remove
   *
   * Requirements: 4.6, 4.7
   */
  remove(id) {
    this.links = this.links.filter(link => link.id !== id);
    StorageHelper.save('links', this.links);
    this.render();
  },

  /**
   * Rebuilds the #links-list container from the current links array.
   *
   * For each link, creates:
   *   - A wrapper <div class="link-item">
   *   - A <button class="link-btn"> displaying the label; clicking it calls
   *     window.open(url, '_blank') to open in a new tab (requirement 4.5).
   *   - A <button class="link-delete-btn"> labelled "✕"; clicking it calls
   *     remove(id) (requirement 4.6).
   *
   * Requirements: 4.5, 4.6
   */
  render() {
    const list = document.getElementById('links-list');
    if (!list) return;

    // Clear existing content
    list.innerHTML = '';

    this.links.forEach(link => {
      // Wrapper
      const item = document.createElement('div');
      item.className = 'link-item';
      item.dataset.id = link.id;

      // Link launch button — opens URL in new tab (requirement 4.5)
      const linkBtn = document.createElement('button');
      linkBtn.className = 'link-btn';
      linkBtn.textContent = link.label;
      linkBtn.setAttribute('aria-label', `Open ${link.label}`);
      linkBtn.addEventListener('click', () => {
        window.open(link.url, '_blank');
      });

      // Delete button (requirement 4.6)
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.textContent = '✕';
      deleteBtn.setAttribute('aria-label', `Delete link ${link.label}`);
      deleteBtn.addEventListener('click', () => {
        this.remove(link.id);
      });

      item.appendChild(linkBtn);
      item.appendChild(deleteBtn);
      list.appendChild(item);
    });
  },
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Initialises all controllers after the DOM is ready.
// ThemeController is called first to prevent a flash of the wrong theme.
//
// Requirements: 5.4, 6.5, 8.5

document.addEventListener('DOMContentLoaded', function () {
  // 1. Theme first — prevents flash of wrong theme
  ThemeController.init();

  // 2. Widget controllers
  GreetingController.init();
  TimerController.init();
  TaskController.init();
  LinkController.init();

  // 3. Timer button event listeners
  const startBtn = document.getElementById('timer-start');
  const stopBtn  = document.getElementById('timer-stop');
  const resetBtn = document.getElementById('timer-reset');
  if (startBtn) startBtn.addEventListener('click', () => TimerController.start());
  if (stopBtn)  stopBtn.addEventListener('click',  () => TimerController.stop());
  if (resetBtn) resetBtn.addEventListener('click', () => TimerController.reset());
});