# Parking Management System

A multi-component repository for the enterprise Parking Management System, split into distinct Frontend and Backend folders.

## Repository Structure

- [frontend/](file:///c:/Users/Raj/Desktop/parking-management-system/frontend) - React 19 + Vite + Tailwind CSS application.
- [backend/](file:///c:/Users/Raj/Desktop/parking-management-system/backend) - Node.js + Express REST API server.

---

## Workspace Quick Start

You can manage both frontend and backend directly from the workspace root directory using the root-level scripts.

### 1. Install Dependencies
To install dependencies for both the frontend and backend in one command:
```bash
npm run install:all
```

### 2. Run in Development Mode
To start both the backend API server and the Vite dev server concurrently:
```bash
npm run dev
```

---

## Frontend Component

- **Stack**: React 19, Vite, Tailwind CSS, React Router DOM, React Icons.
- **Root File**: [frontend/index.html](file:///c:/Users/Raj/Desktop/parking-management-system/frontend/index.html)
- **Source Code**: [frontend/src/](file:///c:/Users/Raj/Desktop/parking-management-system/frontend/src)
- **Mock Data**: [frontend/src/data/parkingData.json](file:///c:/Users/Raj/Desktop/parking-management-system/frontend/src/data/parkingData.json) (Parking records, dashboard metrics, and parking slot details are generated from here).

To run the frontend alone:
```bash
npm run dev:frontend
```

---

## Backend Component

- **Stack**: Node.js, Express, CORS, Dotenv, Nodemon.
- **Entrypoint**: [backend/server.js](file:///c:/Users/Raj/Desktop/parking-management-system/backend/server.js)
- **Port**: `5000` (Health Check: `http://localhost:5000/api/health`)

To run the backend alone:
```bash
npm run dev:backend
```
