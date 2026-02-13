# Pulse-Check-API Implementation Documentation

## Overview
This document provides a comprehensive overview of the implemented features for the **Pulse-Check-API** ("Watchdog" Sentinel) project. The implementation includes all core features from the user stories and a developer's choice feature for enhanced analytics.

---

## Architecture Diagram

![Pulse-Check-API Sequence Diagram](asset/amalitech%20sequence%20diagram.drawio%20(1).png)

---

## 1. Core Features Implementation

### 1.1 User Story 1: Registering a Monitor
**Status:** ✅ **Implemented**

**Endpoint:** `POST /monitors`

**Description:**  
Device administrators can register a new monitor for their devices. The system starts a countdown timer for the specified timeout duration.

**Implementation Details:**
- **File:** [src/controllers/monitor-controller.js](src/controllers/monitor-controller.js#L1-L26)
- **Function:** `createMonitor(req, res)`
- **Input Validation:**
  - Validates presence of `id`, `timeout`, and `alert_email`
  - Checks data types (string for `id` and `alert_email`, number for `timeout`)
- **Timeout Handling:**
  - Converts timeout to milliseconds
  - Adds a 5-second grace period to account for network latency in poor connectivity environments
- **Data Storage:**
  - Stores monitor details including status, email, and timestamp
  - Associates a JavaScript `setTimeout` reference for countdown management
- **Response:** `201 Created` with success message

**Example Request:**
```json
{
  "id": "device-123",
  "timeout": 60,
  "alert_email": "admin@critmon.com"
}
```

---

### 1.2 User Story 2: The Heartbeat (Reset)
**Status:** ✅ **Implemented**

**Endpoint:** `POST /monitors/{id}/heartbeat`

**Description:**  
Devices send periodic signals to reset their countdown timer and confirm they are still operational.

**Implementation Details:**
- **File:** [src/controllers/monitor-controller.js](src/controllers/monitor-controller.js#L28-L52)
- **Function:** `resetTimer(req, res)`
- **Logic Flow:**
  1. Retrieves monitor by ID from in-memory datastore
  2. Validates monitor existence (returns `404` if not found)
  3. Checks if timer has already expired (status = "DOWN")
  4. Clears existing timeout and restarts with original timeout duration
  5. Updates `lastUpdated` timestamp
- **Response:** `200 OK` with reset confirmation

**Key Feature:** Even if a device misses one heartbeat but recovers, it can resume normal operation by sending a heartbeat signal.

---

### 1.3 User Story 3: The Alert (Failure State)
**Status:** ✅ **Implemented**

**Description:**  
When a monitor's countdown reaches zero without receiving a heartbeat, an alert is triggered automatically.

**Implementation Details:**
- **Trigger Mechanism:** [src/helpers/trigger.js](src/helpers/trigger.js)
  - Executes when the countdown timer expires
  - Changes monitor status to "DOWN"
  - Logs alert to console with device ID and ISO timestamp
- **Alert Format:**
  ```json
  { 
    "ALERT": "Device <id> is down!",
    "time": "<ISO_TIMESTAMP>"
  }
  ```
- **Safety Check:** Does not trigger alert if monitor is in "PAUSED" status

---

### 1.4 Bonus User Story: Pause/Resume Functionality
**Status:** ✅ **Implemented**

**Endpoint:** `POST /monitors/{id}/pause`

**Description:**  
Maintenance technicians can pause monitoring during device repairs to prevent false alarms.

**Implementation Details:**
- **File:** [src/controllers/monitor-controller.js](src/controllers/monitor-controller.js#L54-L77)
- **Function:** `revertTimerState(req, res)`
- **State Machine:**
  - **ACTIVE → PAUSED:** Clears the timer, no alerts will fire
  - **PAUSED → ACTIVE:** Restarts the countdown with original timeout
  - **DOWN:** Cannot change state once expired
- **Functionality:**
  - Sending a heartbeat to a paused monitor automatically resumes it
  - Prevents false alerts during maintenance windows

---

## 2. Developer's Choice Feature: Analytics Dashboard

### 2.1 Feature Description
**Status:** ✅ **Implemented**

**Endpoint:** `GET /monitors`

**Purpose:**  
Provides a comprehensive view of all monitors with key analytics data, enabling support engineers and administrators to:
- Monitor the health of all devices at a glance
- Identify devices that need attention
- Track when devices were last updated (useful for troubleshooting)
- View the current operational status of all devices

### 2.2 Implementation Details
- **File:** [src/controllers/monitor-controller.js](src/controllers/monitor-controller.js#L79-L92)
- **Function:** `getAllMonitors(req, res)`
- **Data Returned:**
  - `id`: Device identifier
  - `status`: Current status (ACTIVE, PAUSED, or DOWN)
  - `createdAt`: Timestamp of monitor registration
  - `lastUpdated`: Timestamp of last heartbeat or state change
- **Response:** `200 OK` with array of all monitors

**Example Response:**
```json
{
  "data": [
    {
      "id": "device-123",
      "status": "ACTIVE",
      "createdAt": "2026-02-13T10:15:00.000Z",
      "lastUpdated": "2026-02-13T10:25:30.000Z"
    },
    {
      "id": "device-456",
      "status": "DOWN",
      "createdAt": "2026-02-13T09:45:00.000Z",
      "lastUpdated": "2026-02-13T10:05:45.000Z"
    }
  ]
}
```

### 2.3 Why This Feature?
**Business Value:**
- **Proactive Monitoring:** Administrators can identify patterns of device failures before they become critical
- **Analytics & Reporting:** Track device uptime, failure rates, and maintenance frequency
- **Quick Diagnostics:** The `lastUpdated` field helps identify devices that have gone silent
- **Resource Planning:** Data supports decisions about device deployment and maintenance scheduling

---

## 3. Architecture & Design Decisions

### 3.1 Data Storage
**Implementation:** In-Memory Map (JavaScript `Map` object)

**File:** [src/db/db.js](src/db/db.js)

**Rationale:**
- **Why In-Memory:** Simplicity for development and testing; meets the project requirements without complexity
- **Production Considerations:** For production environments, this would be replaced with:
  - **NoSQL Database (MongoDB):** Recommended for this use case
    - Flexible schema for monitor metadata
    - No complex relationship between entities
  - **Why Not SQL:** While SQL is reliable, this application doesn't require complex relationships between entities (no joins needed). We primarily query by single ID, making SQL overhead unnecessary

**Data Structure:**
```javascript
{
  id: string,              // Device identifier
  status: string,          // "ACTIVE", "PAUSED", or "DOWN"
  timeout: number,         // Timeout duration in milliseconds
  alert_email: string,     // Email for notifications
  timeRef: TimeoutHandle,  // JavaScript setTimeout reference
  createdAt: Date,         // Registration timestamp
  lastUpdated: Date        // Last activity timestamp
}
```

### 3.2 Timer Management
- Uses JavaScript `setTimeout()` for simplicity
- Timeout is cleared and restarted on each heartbeat
- Grace period of 5 seconds added to account for poor network connectivity

### 3.3 Error Handling
- Comprehensive input validation in `createMonitor`
- Proper HTTP status codes:
  - `201 Created`: Monitor successfully registered
  - `200 OK`: Operations completed successfully
  - `400 Bad Request`: Invalid input or operation failed
  - `404 Not Found`: Monitor not found

---

## 4. API Routes Summary

| Method | Endpoint | Function | Status |
|--------|----------|----------|--------|
| POST | `/api/monitors` | Create a new monitor | ✅ |
| POST | `/api/monitors/:id/heartbeat` | Reset countdown timer | ✅ |
| POST | `/api/monitors/:id/pause` | Pause/Resume monitoring | ✅ |
| GET | `/api/monitors` | Get all monitors with details | ✅ |

**Base URL:** `http://localhost:4000`

---

## 5. Implementation Assumptions

### 5.1 Authentication
**Assumption:** Authentication has already been implemented at an infrastructure or middleware level.

**Reasoning:**
- The task did not explicitly require authentication implementation
- In a production environment, the following would be required:
  - JWT or OAuth 2.0 token validation
  - Role-based access control (Admin, Technician, Viewer)
  - API key management for device communication

### 5.2 Data Persistence
**Assumption:** In-memory storage is acceptable for this implementation.

### 5.3 Alert Delivery
**Current Implementation:** Console logging only

**Production Strategy:**
- Email integration (using nodemailer or SendGrid)
- SMS alerts for critical devices
- Webhook callbacks to external monitoring systems
- Real-time notifications via WebSocket or Server-Sent Events

---


## 6. Getting Started

### Installation
```bash
npm install
```

### Running the Server
```bash
npm run dev       # Development mode with hot reload
npm start         # Production mode
```

### Example Usage
```bash
# Create a monitor
curl -X POST http://localhost:4000/api/monitors \
  -H "Content-Type: application/json" \
  -d '{"id": "device-001", "timeout": 60, "alert_email": "admin@example.com"}'

# Send heartbeat
curl -X POST http://localhost:4000/api/monitors/device-001/heartbeat

# Get all monitors
curl http://localhost:4000/api/monitors

# Pause monitoring
curl -X POST http://localhost:4000/api/monitors/device-001/pause
```

---

