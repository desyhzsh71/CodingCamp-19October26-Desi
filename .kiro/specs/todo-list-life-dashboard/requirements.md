# Requirements Document

## Introduction

The Todo List Life Dashboard is a lightweight, client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub accessible from any modern browser without installation or backend setup. The dashboard combines a live greeting display, a Pomodoro-style focus timer, a persistent task manager, and a quick-access link launcher — all stored locally in the browser using the Local Storage API.

## Glossary

- **Dashboard**: The single-page web application that hosts all four feature widgets.
- **Greeting_Widget**: The UI section that displays the current date, time, and a time-of-day greeting message.
- **Focus_Timer**: The countdown timer widget set to 25 minutes, used to manage focused work sessions.
- **Task_Manager**: The widget that allows the user to add, edit, complete, and delete tasks.
- **Task**: A single to-do item consisting of a text description and a completion status.
- **Quick_Links**: The widget that displays user-defined shortcut buttons that open external URLs.
- **Link**: A Quick Links entry consisting of a label and a URL.
- **Local_Storage**: The browser's built-in client-side key-value store used to persist data between sessions.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari in a version released within the last two years.
- **Theme**: The visual color scheme of the Dashboard, either "light" or "dark", controlled via CSS custom properties.
- **UserName**: The user-entered personal name stored in Local_Storage and displayed in the greeting.

---

## Requirements

### Requirement 1: Live Greeting Display

**User Story:** As a user, I want to see the current date, time, and a contextual greeting when I open the dashboard, so that I am immediately oriented to the time of day.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local system time in HH:MM:SS (24-hour) format, updated every second using the local system clock.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Wednesday, October 22, 2026").
3. WHEN the local system time is between 05:00:00 and 11:59:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local system time is between 12:00:00 and 17:59:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local system time is between 18:00:00 and 20:59:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local system time is between 21:00:00 and 04:59:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHEN the Dashboard page loads, THE Greeting_Widget SHALL render the current time, date, and greeting within 1 second of page load completion.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL initialize to a duration of 25 minutes (1500 seconds) and display "25:00".
2. WHEN the user activates the start control while the Focus_Timer is in a stopped or paused state, THE Focus_Timer SHALL begin counting down one second per real second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the stop control while the Focus_Timer is counting down, THE Focus_Timer SHALL pause the countdown at the current remaining time.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL display 00:00 and provide a visual or textual indication that the session has ended.
8. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the start control to prevent duplicate timers.
9. WHILE the Focus_Timer is paused, reset, or has never been started, THE Focus_Timer SHALL disable the stop control.
10. WHEN the user activates the start control while the Focus_Timer is in a paused state, THE Focus_Timer SHALL resume the countdown from the current remaining time, not from 25:00.

---

### Requirement 3: Task Management

**User Story:** As a user, I want to add, edit, mark as complete, and delete tasks that persist between browser sessions, so that I can track my to-do items reliably.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an input field (maximum 500 characters) and a submit control for adding new tasks.
2. WHEN the user submits a task description containing at least one non-whitespace character and no more than 500 characters, THE Task_Manager SHALL trim leading and trailing whitespace, add a new Task with a completion status of incomplete, and display it in the task list.
3. IF the user submits an empty, whitespace-only, or greater-than-500-character task description, THEN THE Task_Manager SHALL reject the submission and display an inline validation message indicating the specific reason for rejection.
3a. IF the user submits a task description that, after trimming and case-insensitive comparison, matches the text of any existing Task in the list, THEN THE Task_Manager SHALL reject the submission and display an inline validation message: "A task with this description already exists."
4. WHEN the user activates the edit control on a Task, THE Task_Manager SHALL allow the user to modify the task description inline.
5. WHEN the user confirms an edit with a description containing at least one non-whitespace character and no more than 500 characters, THE Task_Manager SHALL trim whitespace, update the Task text, and exit edit mode.
6. IF the user confirms an edit with an empty, whitespace-only, or greater-than-500-character description, THEN THE Task_Manager SHALL reject the update and display an inline validation message indicating the specific reason for rejection.
6a. IF the user confirms an edit with a description that, after trimming and case-insensitive comparison, matches the text of any other existing Task in the list, THEN THE Task_Manager SHALL reject the update and display an inline validation message: "A task with this description already exists."
7. WHEN the user activates the complete control on an incomplete Task, THE Task_Manager SHALL mark the Task as complete and apply strikethrough style to the task text.
8. WHEN the user activates the complete control on a completed Task, THE Task_Manager SHALL mark the Task as incomplete and remove the strikethrough style.
9. WHEN the user activates the delete control on a Task, THE Task_Manager SHALL remove the Task from the list.
10. WHEN a Task is added, edited, completed, uncompleted, or deleted, THE Task_Manager SHALL write the updated task list to Local_Storage.
11. WHEN the Dashboard loads and a valid task list exists in Local_Storage, THE Task_Manager SHALL read the task list from Local_Storage and display all previously saved tasks.
12. IF Local_Storage is unavailable or the stored task data cannot be parsed as valid JSON, THEN THE Task_Manager SHALL display an empty task list and show an inline message indicating that saved tasks could not be loaded.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and launch shortcut buttons for my favorite websites, so that I can access them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an input field for a link label (maximum 50 characters) and an input field for a URL (maximum 2048 characters), along with an add control, and SHALL accept at most 20 saved links in total.
2. WHEN the user submits a label and a URL where both fields contain at least one non-whitespace character, the label is 50 characters or fewer, and the URL is 2048 characters or fewer and begins with "http://" or "https://", THE Quick_Links widget SHALL trim leading and trailing whitespace from both fields, add a new Link, display it as a clickable button, and clear both input fields.
3. IF the user submits a label or URL that is empty or contains only whitespace, or if either field exceeds its maximum length, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message adjacent to the offending field indicating the requirement that was violated.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message adjacent to the URL field indicating the URL format requirement.
5. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
6. WHEN the user activates the delete control on a Link, THE Quick_Links widget SHALL remove the Link from the list.
7. WHEN a Link is added or deleted, THE Quick_Links widget SHALL write the updated link list to Local_Storage.
8. WHEN the Dashboard loads, THE Quick_Links widget SHALL read the link list from Local_Storage and display all previously saved links; IF Local_Storage is unavailable or the read operation fails, THEN THE Quick_Links widget SHALL display an empty link list and show an inline error message indicating that saved links could not be loaded.
9. IF the user attempts to add a Link when 20 links are already saved, THEN THE Quick_Links widget SHALL reject the submission and display an inline message indicating that the maximum number of links has been reached.

---

### Requirement 5: Data Persistence and Storage

**User Story:** As a user, I want all my tasks and quick links to be automatically saved and restored across browser sessions, so that I never lose my data by closing the tab.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser Local_Storage API as the sole data persistence mechanism.
2. THE Dashboard SHALL store Task data under the Local_Storage key `"tasks"`.
3. THE Dashboard SHALL store Link data under the Local_Storage key `"links"`.
4. WHEN the Dashboard initializes, THE Dashboard SHALL read the Task and Link data from their respective Local_Storage keys and populate the in-memory data structures before rendering any tasks or links.
5. WHEN a Task or Link is created, updated, or deleted, THE Dashboard SHALL write the complete updated list for that data type to its respective Local_Storage key before the operation is considered complete.
6. IF the value retrieved from a Local_Storage key is absent or cannot be parsed as valid JSON, THEN THE Dashboard SHALL initialize the corresponding data structure to an empty list without displaying an error message to the user or throwing an uncaught exception.

---

### Requirement 6: Layout and Visual Design

**User Story:** As a user, I want a clean, readable dashboard layout that is visually organized, so that I can find and use each widget without confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL organize all widgets within a single HTML page using one CSS file located in the `css/` directory.
2. THE Dashboard SHALL apply a clear visual hierarchy that distinguishes widget sections from one another.
3. THE Dashboard SHALL use readable typography with sufficient contrast between text and background colors.
4. THE Dashboard SHALL be implemented using one JavaScript file located in the `js/` directory.
5. THE Dashboard SHALL load and render all widgets without requiring a network request to a backend server.

---

### Requirement 7: Browser Compatibility

**User Story:** As a user, I want the dashboard to work correctly in any modern browser, so that I can use it regardless of my preferred browser.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in current versions of Chrome, Firefox, Edge, and Safari without browser-specific polyfills or plugins.
2. THE Dashboard SHALL use only standard HTML5, CSS3, and ECMAScript 2015 (ES6) or later language features that are natively supported across all four Modern_Browsers.

---

### Requirement 8: Light/Dark Mode Theme Toggle

**User Story:** As a user, I want to toggle between a light and dark visual theme, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a theme toggle control visible on the page.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL switch between light and dark themes by toggling a CSS class or data attribute on the root `<html>` or `<body>` element.
3. THE Dashboard SHALL implement both themes exclusively using CSS custom properties (variables), such that switching the theme does not require any inline style changes in JavaScript.
4. WHEN the theme is toggled, THE Dashboard SHALL write the new theme value ("light" or "dark") to Local_Storage under the key `"theme"`.
5. WHEN the Dashboard loads, THE Dashboard SHALL read the `"theme"` key from Local_Storage and apply the saved theme before first render, preventing a flash of the wrong theme.
6. IF the `"theme"` key is absent from Local_Storage, THEN THE Dashboard SHALL apply the light theme as the default.

---

### Requirement 9: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting message includes it personally, so that the dashboard feels customized to me.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide an input field where the user can type their name.
2. WHEN the user submits a non-empty name (at least one non-whitespace character), THE Greeting_Widget SHALL trim the name, save it to Local_Storage under the key `"userName"`, and display the greeting in the format "Good [Time], [Name]" (e.g., "Good Morning, Sha").
3. WHEN the user clears the name input and saves an empty value, THE Greeting_Widget SHALL remove the name from the greeting and display only "Good [Time]" (e.g., "Good Morning").
4. WHEN the Dashboard loads, THE Greeting_Widget SHALL read the `"userName"` key from Local_Storage and pre-populate the name input and greeting display with the saved name, if any.
5. IF the `"userName"` key is absent or empty in Local_Storage, THEN THE Greeting_Widget SHALL display the greeting without a name (e.g., "Good Morning").

---

### Requirement 10: Duplicate Task Prevention

**User Story:** As a user, I want the dashboard to prevent me from adding or saving duplicate tasks, so that my task list stays clean and unambiguous.

#### Acceptance Criteria

1. WHEN the user submits a task description that, after trimming and case-insensitive comparison, matches the text of any existing Task in the list, THE Task_Manager SHALL reject the submission.
2. WHEN a duplicate task submission is rejected, THE Task_Manager SHALL display an inline validation message: "A task with this description already exists."
3. WHEN the user confirms a task edit with a description that, after trimming and case-insensitive comparison, matches the text of any other Task in the list, THE Task_Manager SHALL reject the update and display the same inline validation message.
4. THE duplicate check SHALL be case-insensitive (e.g., "Buy milk" and "buy milk" are considered duplicates).
5. THE duplicate check SHALL compare trimmed values (leading and trailing whitespace is stripped before comparison).
