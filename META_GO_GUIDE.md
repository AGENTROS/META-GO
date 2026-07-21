# MetaGo Universal Platform - Quickstart Guide

This guide explains how to run the MetaGo architecture locally. Since the platform connects real Game Engines with a Web Dashboard, multiple local servers must run simultaneously.

## 1. Start the MetaGo Backend (FastAPI)
The backend manages WebSockets, Auth, and Identity synchronization.

**Terminal 1:**
```bash
# Navigate to the project folder
cd "META GO"

# Activate Python Virtual Environment
.\.venv\Scripts\Activate.ps1

# Run the FastAPI server
uvicorn backend.server:app --host 127.0.0.1 --port 8001 --reload
```

## 2. Start the MetaGo Dashboard (Next.js)
The frontend dashboard where users view their Metaverse Footprint.

**Terminal 2:**
```bash
# Navigate to the frontend folder
cd "META GO\frontend"

# Start the Next.js server on port 3005
npm run dev -- -p 3005
```
*Open your browser and visit: `http://localhost:3005/dashboard`*

---

## 3. Connecting Game Engines (Local Preview)

Since we have not purchased LAND on the Decentraland Mainnet to deploy our code globally, we must test the integration using the local SDK preview.

### A. Decentraland (DCL)
**Terminal 3:**
```bash
# Navigate to the DCL Scene folder
cd "META GO\sdk\decentraland\scene"

# Start the local Decentraland Engine
npm run start
```
*Open your browser and visit the exact URL provided in the console, usually:*
`http://127.0.0.1:8000?position=0%2C0&SCENE_DEBUG_PANEL`

**How it works:** 
1. When you enter this specific local scene, the `index.ts` script executes.
2. It fetches your actual Decentraland Avatar (Wearables) data.
3. It opens a WebSocket connection to `127.0.0.1:8001` (Backend).
4. The Backend pushes this data to `127.0.0.1:3005` (Frontend Dashboard).

### B. Unity (Coming Soon)
For Unity, import the package located at `sdk/unity/`. Add the MetaGo Prefab to your scene, which natively connects to the WebSocket backend using C#.

---

> **Note on "Original" vs "Local":** 
> You cannot see MetaGo data by simply visiting `play.decentraland.org` (Genesis Plaza) because we do not own that land, and we cannot inject our WebSocket code into their servers. The data sync only happens when a player walks into a LAND parcel where our MetaGo script has been officially deployed.
