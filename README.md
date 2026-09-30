# KBC Hackathon: Signal-to-Action Realtime Experience

> **Realtime Intent Detection, Proactive Kate Assistant & Ecosystem Hyper-Personalization**  
> A proof-of-concept dual-view demo combining a client-facing mobile banking interface with a real-time event simulation cockpit.

---

## Project Overview

This project demonstrates a **Signal-to-Action** intelligence engine for modern banking. By analyzing transactional patterns and in-app interactions in real time, the platform detects client life moments (e.g., *First-Time Home Buyer*, *Freelance & Entrepreneurship*, *Wealth Accumulation*) and serves contextual, transparent recommendations across three core pillars:
1. **Banking** (mortgage simulators, business accounts, investments)
2. **Insurance** (home & fire coverage, guaranteed income, legal protection)
3. **Ecosystem Partners** (Immoweb property matching, notary coordination, accounting software)

### Key Features
- **Dual-View Experience**:
  - **Left**: Interactive KBC Mobile smartphone frame with the Kate AI assistant, tailored feed, and quick actions.
  - **Right**: Realtime Simulator cockpit to inject transactions, test life events, and inspect the engine's stage transitions.
- **Dynamic Intent Progression**: Watch client intent evolve from `exploring` → `active_decision` → `action_ready`.
- **Explainable AI & GDPR Art. 22**: Complete algorithmic transparency via the *"Why am I seeing this?"* drawer, revealing evaluated signals, confidence scores, and safety boundaries.
- **Instant Simulator Reset**: One-click demo state reset back to initial seed data.

---

## Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher) with `pip`

---

### Step 1: Install Dependencies

#### 1. Frontend & Node packages
```bash
npm install
```

#### 2. Python Backend Environment
```bash
# Create and activate virtual environment (if not already present)
python3 -m venv venv
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

---

### Step 2: Start the Backend (Port 8000)

Start the FastAPI inference engine:
```bash
source venv/bin/activate
python3 main.py
```
*Alternatively, you can run directly with uvicorn:*
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

> **Note:** A Node.js Express alternative backend is also available via `npm run server`. The default setup is configured to communicate with the FastAPI engine on port 8000.

---

### Step 3: Start the Frontend (Port 5173)

In a separate terminal, launch the Vite development server:
```bash
npm run dev
```

---

### Step 4: Open the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🎯 Demo Walkthrough (Jury Script)

Follow this 2-minute scenario to showcase the full signal-to-action loop:

1. **Select Thomas De Smet (Default)**:
   - Notice Thomas is currently in the **Exploring / Active Decision** stage (intent: *First-Time Home Buyer*).
   - In the mobile frame, observe Kate's welcome bubble and the 3 personalized cards (Banking capacity calculator, Insurance guide, Immoweb partnership).
2. **Inject the Climax Trigger Event**:
   - In the right-hand **Simulator Panel**, click **"Trigger Closing: Notary Fee (€750)"** (or select the Notary closing preset).
   - Watch the confidence jump and the stage advance to **ACTION READY**!
   - Kate updates her message immediately to congratulate Thomas on his home purchase, reordering cards to notary deeds and home insurance.
3. **Switch Persona to Sarah Alami (Freelancer)**:
   - Select **Sarah Alami** in the client switcher.
   - The entire mobile feed dynamically pivots to freelance entrepreneur solutions (business accounts, VAT accounting, guaranteed income protection).
4. **Inspect Explainable AI (GDPR Art. 22)**:
   - Click the **"Why am I seeing this?"** button in the mobile frame.
   - Review the real-time trigger signals, rationale, confidence distribution, and client privacy safeguards.
5. **Reset Demo**:
   - Click **"Reset Simulator Data"** in the top bar to return all files to pristine seed state.

---

## Project Structure

```text
.
├── data/                    # Active JSON database files (clients, transactions, interactions)
├── data_seed/               # Clean seed baseline used by the reset endpoint
├── src/
│   ├── components/
│   │   ├── KateWidget.jsx       # Floating Kate AI assistant dialog
│   │   ├── MobileFrame.jsx      # Mobile phone mock preview with dynamic action cards
│   │   └── SimulatorPanel.jsx   # Event injector, client picker & signal cockpit
│   ├── App.jsx              # Main dual-view dashboard state & event coordination
│   ├── main.jsx             # React entry point
│   └── styles.css           # Tailwind CSS styles
├── main.py                  # Primary FastAPI backend engine (REST API + Rule Engine)
├── server.js                # Alternative Express.js backend implementation
├── package.json             # Frontend dependencies & npm scripts
├── requirements.txt         # Python dependencies
└── vite.config.js           # Vite configuration with /api reverse proxy to port 8000
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/clients` | List all available demo clients |
| `GET` | `/api/clients/{id}` | Get client profile, intent prediction & proactive experience cards |
| `POST` | `/api/clients/{id}/events` | Inject a transaction or interaction event & trigger instant re-evaluation |
| `POST` | `/api/simulator/reset` | Restore demo data from `/data_seed` to initial state |
| `GET` | `/docs` | Interactive Swagger API documentation (when FastAPI is running) |

---

## Production Build

To test or verify the production bundle:
```bash
npm run build
npm run preview
```
