# Requirements Document

## Introduction

The StaffNet Attendance Module is a standalone React application (`staffnet-app/`) that provides attendance management for staff/patrons at an institution. It connects to the existing Express + PostgreSQL backend and presents a polished admin-facing UI with a fixed sidebar, stat cards, and data tables. A separate Class Rep Portal (no sidebar) allows class representatives to take attendance on their assigned sessions. The module replaces the placeholder "Money System" content in the StaffNet platform with full attendance management functionality.

## Glossary

- **StaffNet_App**: The new standalone React + Vite application at `staffnet-app/` that hosts the attendance module.
- **Backend**: The existing Express + PostgreSQL + Socket.io server at `backend/`, running on port 5000.
- **Staff_User**: An authenticated staff or patron user who accesses the full sidebar-based attendance views.
- **Class_Rep**: An authenticated class representative who accesses the rep-only portal to submit attendance.
- **Session**: A single attendance event for a class on a given date, identified by `class_id` and `session_date`.
- **Attendance_Record**: A per-student status entry (`present`, `late`, `absent`, `excused`) within a Session.
- **Sidebar**: The fixed 260px-wide left navigation panel present on all Staff_User pages.
- **TopBar**: The horizontal header bar present on all Class_Rep pages (no Sidebar).
- **StatCard**: A summary card displaying a single metric (e.g., count of absences). Hero variant uses dark navy background.
- **StatusBadge**: A colored inline label indicating an Attendance_Record status.
- **API_Client**: The Axios instance in `src/api/client.js` that attaches JWT Bearer tokens and handles 401 redirects.
- **JWT**: JSON Web Token stored in `localStorage`, used for authenticating all API requests.
- **Design_System**: The shared CSS variables, typography, and component styles defined in the Introduction and enforced across all pages.

---

## Requirements

### Requirement 1: Design System Compliance

**User Story:** As a staff user, I want the attendance module to look identical to the rest of the StaffNet platform, so that the experience feels cohesive and professional.

#### Acceptance Criteria

1. THE StaffNet_App SHALL apply the following CSS custom properties globally:
   `--primary: #1e3a5f`, `--primary-light: #2d5282`, `--accent-red: #e53e3e`, `--bg-main: #f0f4f8`, `--bg-card: #ffffff`, `--text-primary: #1a202c`, `--text-muted: #718096`, `--text-sidebar: #4a5568`, `--border: #e2e8f0`, `--shadow: 0 2px 8px rgba(0,0,0,0.08)`.
2. THE StaffNet_App SHALL use `Inter, system-ui, sans-serif` as the font stack.
3. THE StaffNet_App SHALL render Sidebar nav labels at 14px medium weight uppercase.
4. THE StaffNet_App SHALL render StatCard labels at 11px uppercase with `letter-spacing: 0.1em`.
5. THE StaffNet_App SHALL render StatCard hero values at 36px bold weight.
6. THE StaffNet_App SHALL render body text at 14px.
7. THE StaffNet_App SHALL render StatCards with white background, `border-radius: 16px`, and `box-shadow: var(--shadow)`.
8. THE StaffNet_App SHALL render the hero StatCard with `background: #1e3a5f`, white text, and a decorative circle overlay (300px diameter, bottom-right, `opacity: 0.3`).
9. THE StaffNet_App SHALL render status colors as: PRESENT `#276749`/`#f0fff4`, LATE `#b7791f`/`#fffff0`, ABSENT `#c53030`/`#fff5f5`, EXCUSED `#553c9a`/`#faf5ff`, PENDING `#4a5568`/`#edf2f7`, SUBMITTED `#2b6cb0`/`#ebf8ff`, CONFIRMED `#276749`/`#f0fff4`.

---

### Requirement 2: Sidebar Navigation Component

**User Story:** As a staff user, I want a persistent sidebar with clear navigation links, so that I can move between attendance views without losing context.

#### Acceptance Criteria

1. THE Sidebar SHALL be fixed to the left edge, 260px wide, and full viewport height on all Staff_User pages.
2. THE Sidebar SHALL display navigation items in order: Dashboard, Sessions, Absences, Late Arrivals, Reports.
3. THE Sidebar SHALL render the active navigation item with white text and `background: #1e3a5f` with `border-radius: 10px`.
4. THE Sidebar SHALL render inactive navigation items with `color: #4a5568`.
5. THE Sidebar SHALL display Lucide React icons alongside each navigation label.
6. THE Sidebar SHALL display a "Back" link at the bottom with muted color styling.
7. THE Sidebar SHALL display a "Logout" button at the bottom with `color: var(--accent-red)` styling.
8. WHEN the viewport width is less than 768px, THE Sidebar SHALL collapse and THE StaffNet_App SHALL render a bottom navigation bar instead.
9. THE Sidebar SHALL display the StaffNet logo or brand name at the top.

---

### Requirement 3: API Client and Authentication

**User Story:** As a user of the system, I want all API requests to be authenticated automatically, so that I never have to manually attach tokens or handle redirects.

#### Acceptance Criteria

1. THE API_Client SHALL set `baseURL` from the `VITE_API_URL` environment variable, defaulting to `http://localhost:5000/api`.
2. THE API_Client SHALL attach an `Authorization: Bearer <token>` header to every outgoing request by reading the JWT from `localStorage`.
3. WHEN the Backend returns HTTP 401, THE API_Client SHALL clear the JWT from `localStorage` and redirect the browser to the appropriate login page.
4. THE API_Client SHALL support two token storage keys: one for Staff_User sessions and one for Class_Rep sessions.
5. THE StaffNet_App SHALL provide a `useAttendance` hook that encapsulates data fetching, loading state, and error state for attendance-related API calls.

---

### Requirement 4: Staff Authentication Flow

**User Story:** As a staff user, I want to log in with my credentials and access the full attendance dashboard, so that I can monitor attendance across all classes.

#### Acceptance Criteria

1. WHEN a Staff_User submits valid credentials to `POST /api/auth/login`, THE StaffNet_App SHALL store the returned JWT in `localStorage` under a staff-specific key.
2. WHEN a Staff_User submits invalid credentials, THE StaffNet_App SHALL display an inline error message without navigating away.
3. WHEN a Staff_User is not authenticated and attempts to access a protected Staff_User route, THE StaffNet_App SHALL redirect to the staff login page.
4. WHEN a Staff_User clicks Logout, THE StaffNet_App SHALL call `POST /api/auth/logout`, clear the JWT from `localStorage`, and redirect to the staff login page.
5. THE StaffNet_App SHALL persist the Staff_User session across page refreshes using `localStorage`.

---

### Requirement 5: Class Rep Authentication Flow

**User Story:** As a class representative, I want to log in through a dedicated portal, so that I can access only my assigned sessions without seeing the full staff dashboard.

#### Acceptance Criteria

1. THE RepLogin page SHALL be rendered at `/rep-login` with no Sidebar, centered on a dark navy gradient background.
2. THE RepLogin page SHALL display a white card containing the StaffNet logo, a shield icon, the title "Class Rep Portal", email and password inputs, and a login button.
3. WHEN a Class_Rep submits valid credentials to `POST /api/auth/login`, THE StaffNet_App SHALL store the returned JWT in `localStorage` under a rep-specific key and redirect to `/rep/sessions`.
4. WHEN a Class_Rep submits invalid credentials, THE RepLogin page SHALL display an inline error message.
5. WHEN a Class_Rep is not authenticated and attempts to access a `/rep/*` route, THE StaffNet_App SHALL redirect to `/rep-login`.
6. WHEN a Class_Rep clicks Sign Out, THE StaffNet_App SHALL clear the rep JWT from `localStorage` and redirect to `/rep-login`.

---

### Requirement 6: Attendance Dashboard Page

**User Story:** As a staff user, I want a dashboard overview of today's attendance, so that I can quickly assess the current state across all classes.

#### Acceptance Criteria

1. THE Dashboard page SHALL be rendered at `/attendance` with the Sidebar active on "Dashboard".
2. THE Dashboard page SHALL display three StatCards at the top: "TODAY'S SESSIONS" (hero navy variant), "ABSENT TODAY" (value in `--accent-red`), and "LATE ARRIVALS" (value in amber `#b7791f`).
3. THE Dashboard page SHALL display an "ATTENDANCE OVERVIEW" section showing today's sessions with StatusBadges.
4. WHEN the Dashboard page mounts, THE StaffNet_App SHALL fetch data from `GET /api/staffnet/dashboard` and `GET /api/staffnet/attendance/today`.
5. THE Dashboard page SHALL automatically re-fetch data every 60 seconds.
6. WHILE data is loading, THE Dashboard page SHALL display skeleton placeholder elements in place of StatCards and the overview list.
7. WHEN no sessions exist for today, THE Dashboard page SHALL display a green checkmark icon and the message "All students are present and on time!".
8. WHEN the Backend returns an error, THE Dashboard page SHALL display an error message with a retry option.

---

### Requirement 7: Absences Page

**User Story:** As a staff user, I want to see a list of all absent students today, so that I can take action and notify relevant parties.

#### Acceptance Criteria

1. THE Absences page SHALL be rendered at `/attendance/absences` with the Sidebar active on "Absences".
2. THE Absences page SHALL display three StatCards: "ABSENT TODAY" (hero navy variant), "CLASSES AFFECTED", and "NOTIFIED".
3. THE Absences page SHALL display a table with columns: Name, ID, Class, Session, Subject, Time, Actions.
4. WHEN the Absences page mounts, THE StaffNet_App SHALL fetch data from `GET /api/attendance/absentees` with a `date` query parameter set to today's date.
5. THE Absences page SHALL automatically re-fetch data every 60 seconds.
6. WHILE data is loading, THE Absences page SHALL display skeleton placeholder rows in the table.
7. WHEN no absences exist for today, THE Absences page SHALL display a green checkmark icon and the message "All students are present and on time!".
8. THE Absences page SHALL support filtering absentees by class using a `classId` query parameter.

---

### Requirement 8: Late Arrivals Page

**User Story:** As a staff user, I want to see a list of all late students today, so that I can track punctuality patterns.

#### Acceptance Criteria

1. THE LateArrivals page SHALL be rendered at `/attendance/late` with the Sidebar active on "Late Arrivals".
2. THE LateArrivals page SHALL display three StatCards: "LATE TODAY" (hero navy variant), "AVERAGE DELAY", and "ON TIME".
3. THE LateArrivals page SHALL display a table with the same column structure as the Absences page table.
4. WHEN the LateArrivals page mounts, THE StaffNet_App SHALL fetch data from `GET /api/attendance/absentees` with `status=late` and today's date as query parameters.
5. WHILE data is loading, THE LateArrivals page SHALL display skeleton placeholder rows in the table.
6. WHEN no late arrivals exist for today, THE LateArrivals page SHALL display a green checkmark icon and the message "All students are present and on time!".

---

### Requirement 9: Sessions Page

**User Story:** As a staff user, I want to browse sessions by date and class, so that I can review attendance for any given day.

#### Acceptance Criteria

1. THE Sessions page SHALL be rendered at `/attendance/sessions` with the Sidebar active on "Sessions".
2. THE Sessions page SHALL display a date picker and a class filter dropdown above the session grid.
3. THE Sessions page SHALL display sessions in a 2-column card grid.
4. EACH session card SHALL display: subject, class name, room, time, teacher name, a StatusBadge, an attendance progress bar, and a "View Details" button.
5. WHEN the Sessions page mounts or the date/class filter changes, THE StaffNet_App SHALL fetch data from `GET /api/attendance/today` with the selected date and class as query parameters.
6. WHILE data is loading, THE Sessions page SHALL display skeleton placeholder cards.
7. WHEN no sessions match the current filter, THE Sessions page SHALL display an appropriate empty state message.

---

### Requirement 10: Class Rep Sessions Page

**User Story:** As a class representative, I want to see my assigned sessions for today, so that I know which ones require attendance to be taken.

#### Acceptance Criteria

1. THE RepSessions page SHALL be rendered at `/rep/sessions` with a TopBar only (no Sidebar).
2. THE TopBar SHALL display the StaffNet logo, "Class Rep Portal" label, the Class_Rep's name, their assigned class name, and a "Sign Out" button.
3. THE RepSessions page SHALL display today's sessions as a list of cards.
4. EACH session card SHALL display a "Take Attendance →" button only when the session status is PENDING.
5. WHEN a Class_Rep clicks "Take Attendance →", THE StaffNet_App SHALL navigate to `/rep/sessions/:id`.
6. WHEN the RepSessions page mounts, THE StaffNet_App SHALL fetch sessions from `GET /api/attendance/today` filtered to the Class_Rep's assigned class.

---

### Requirement 11: Class Rep Attendance Form

**User Story:** As a class representative, I want to mark each student's attendance status for a session, so that the record is submitted accurately to the system.

#### Acceptance Criteria

1. THE RepAttendanceForm page SHALL be rendered at `/rep/sessions/:id` with a TopBar and a back button.
2. THE RepAttendanceForm page SHALL display a student roster where each row shows: an index circle, student full name, student ID, and four status buttons (Present, Late, Absent, Excused).
3. WHEN a Class_Rep selects "Late" for a student, THE RepAttendanceForm page SHALL display an inline time picker for that student's arrival time.
4. THE RepAttendanceForm page SHALL display a sticky bottom bar showing a summary count of each status and a "Submit" button.
5. WHEN a Class_Rep clicks "Submit", THE RepAttendanceForm page SHALL display a confirmation modal warning that email notifications will be sent for absent and late students.
6. WHEN a Class_Rep confirms submission in the modal, THE StaffNet_App SHALL call `POST /api/attendance` with the session date and all student records.
7. WHEN the submission succeeds, THE StaffNet_App SHALL navigate back to `/rep/sessions` and display a success message.
8. IF the submission fails, THE RepAttendanceForm page SHALL display an inline error message and keep the form data intact.
9. THE RepAttendanceForm page SHALL default all student statuses to PENDING before the Class_Rep makes a selection.
10. THE Submit button SHALL be disabled until all students have a status other than PENDING.

---

### Requirement 12: Real-Time Updates via Socket.io

**User Story:** As a staff user, I want the dashboard to reflect attendance submissions in real time, so that I always see the latest data without manually refreshing.

#### Acceptance Criteria

1. THE StaffNet_App SHALL establish a Socket.io connection to the Backend on mount for authenticated Staff_User sessions.
2. WHEN the Backend emits an `attendance:submitted` event, THE StaffNet_App SHALL update the Dashboard and Absences page data without a full page reload.
3. WHEN the Socket.io connection is lost, THE StaffNet_App SHALL attempt to reconnect automatically.
4. WHEN the Staff_User logs out, THE StaffNet_App SHALL disconnect the Socket.io connection.

---

### Requirement 13: Routing and Application Shell

**User Story:** As a developer, I want a well-structured React Router setup, so that all pages are reachable at their defined paths with correct auth guards.

#### Acceptance Criteria

1. THE StaffNet_App SHALL use React Router DOM to define the following routes: `/attendance` (Dashboard), `/attendance/absences` (Absences), `/attendance/late` (LateArrivals), `/attendance/sessions` (Sessions), `/rep-login` (RepLogin), `/rep/sessions` (RepSessions), `/rep/sessions/:id` (RepAttendanceForm).
2. THE StaffNet_App SHALL protect all `/attendance/*` routes so that unauthenticated Staff_Users are redirected to the staff login page.
3. THE StaffNet_App SHALL protect all `/rep/*` routes so that unauthenticated Class_Reps are redirected to `/rep-login`.
4. THE StaffNet_App SHALL redirect the root path `/` to `/attendance`.
5. THE StaffNet_App SHALL render a 404 page for any unmatched route.

---

### Requirement 14: New Backend Routes for StaffNet

**User Story:** As a developer, I want dedicated StaffNet API routes that aggregate data across all classes, so that the staff dashboard can display institution-wide attendance metrics.

#### Acceptance Criteria

1. THE Backend SHALL expose `GET /api/staffnet/dashboard` returning today's session count, absent count, late count, and on-time count.
2. THE Backend SHALL expose `GET /api/staffnet/attendance/today` returning all sessions for today with their status, class name, subject, room, teacher, and per-session attendance summary.
3. THE Backend SHALL expose `GET /api/staffnet/attendance/absentees` returning all absent students for a given date with name, student ID, class, session, subject, and time.
4. THE Backend SHALL expose `GET /api/staffnet/attendance/late` returning all late students for a given date with the same fields as absentees plus arrival time.
5. ALL `/api/staffnet/*` routes SHALL require a valid JWT and SHALL verify the caller has staff-level access.
6. THE Backend SHALL add a `staffnet` route file and register it in `server.js` under `/api/staffnet`.

---

### Requirement 15: Project Scaffolding and Build Configuration

**User Story:** As a developer, I want the staffnet-app to be a properly configured Vite + React project, so that it can be developed and built independently from classrep-app.

#### Acceptance Criteria

1. THE StaffNet_App SHALL be scaffolded as a new Vite + React project at `staffnet-app/` in the repository root.
2. THE StaffNet_App SHALL include a `.env.example` file with `VITE_API_URL=http://localhost:5000/api`.
3. THE StaffNet_App SHALL list the following production dependencies: `react`, `react-dom`, `react-router-dom`, `axios`, `lucide-react`, `socket.io-client`.
4. THE StaffNet_App SHALL include the following source files: `src/App.jsx`, `src/main.jsx`, `src/index.css`, `src/api/client.js`, `src/hooks/useAttendance.js`, `src/components/Sidebar.jsx`, `src/components/StatCard.jsx`, `src/components/StatusBadge.jsx`, `src/components/StudentRow.jsx`, `src/components/TopBar.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Absences.jsx`, `src/pages/LateArrivals.jsx`, `src/pages/Sessions.jsx`, `src/pages/RepLogin.jsx`, `src/pages/RepSessions.jsx`, `src/pages/RepAttendanceForm.jsx`.
5. THE StaffNet_App main content area SHALL start at `margin-left: 260px` and use `padding: 32px` on desktop viewports.
