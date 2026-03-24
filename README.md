# PolicyPilot 🛡️

PolicyPilot is an AI-powered government scheme discovery and application platform designed to help citizens navigates complex policy frameworks in their native language.

##  Features

- **🌍 Multilingual UI:** Support for English, Hindi, Gujarati, Marathi, and Bengali.
- **🎙️ Voice-to-Text Search:** Real-time transcription using **Speechmatics** (aware of selected language).
- **🤖 AI Analysis:** Intelligent eligibility checking and conflict detection across 30+ government schemes.
- **📱 Progressive Web App:** Enhanced caching with a focus on offline reliability.
- **🔄 Local Storage:** Automatic queuing of forms for background sync when internet returns.

## Tech Stack

- **Frontend:** React + Vite + Vanilla CSS
- **Backend:** Python + FastAPI (handling PDF ingestion and AI analysis)
- **Voice:** Speechmatics Real-Time WebSocket API

##  Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python 3.9+
- Speechmatics API Key

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Server runs on http://localhost:8000
```

### 3. Setup Frontend
1. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_SPEECHMATICS_API_KEY=your_key_here
   ```
2. Install dependencies and start:
   ```bash
   cd frontend
   npm install
   npm run dev
   # App runs on http://localhost:5173
   ``




## 📂 Project Structure
- `/frontend`: React application and translation logic.
- `/backend`: FastAPI server and scheme ingestion.
- `/streamlit-app`: Legacy/Alternative interface.

## 📄 License
This project is licensed under the MIT License.
