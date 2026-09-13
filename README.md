# 💊 NextGoli

### AI-Powered Voice-First Medicine Reader

> **Understand your medicine. Simply.**

NextGoli is an AI-powered medicine reader designed to help elderly, rural, and low-literacy users understand medicine information without struggling to read tiny labels on medicine strips and packages.

Users can simply take a photo of a medicine package. NextGoli uses Gemini's multimodal AI to identify and explain the medicine in simple English or Hindi, validates the expiry date using Python, and uses Gemini Text-to-Speech to read the information aloud.

---

## 🎯 Problem

Many people, especially elderly and rural users, face difficulties with:

- Reading tiny medicine labels
- Understanding medicine names and active ingredients
- Understanding what a medicine is commonly used for
- Checking medicine expiry dates
- Understanding precautions
- Accessing medicine information in their preferred language

NextGoli aims to make this information easier to access through **image understanding, simple language, and voice interaction**.

---

# 💡 Solution

The user takes a photo of a medicine strip or package.

NextGoli then:

1. 📷 Accepts the medicine image
2. 🤖 Uses Gemini multimodal AI to understand the medicine package
3. 💊 Extracts medicine name, active ingredient, strength and expiry date
4. 🧠 Generates simple explanations
5. 🐍 Uses Python to deterministically validate the expiry date
6. 🇬🇧 Supports English
7. 🇮🇳 Supports Hindi
8. 🔊 Uses Gemini Text-to-Speech to read the information aloud

---

# ✨ Key Features

### 📷 Medicine Image Scanning

Upload or capture a photo of a medicine strip, blister pack, or medicine box.

### 🤖 AI Medicine Recognition

Gemini multimodal AI analyzes the medicine image and extracts relevant information.

### 💊 Medicine Information

Displays:

- Medicine / Brand Name
- Active Ingredient
- Strength
- Expiry Date
- Common Purpose / Use
- How to Take
- Precautions

### ⚠️ Expiry Validation

The expiry date is read by Gemini, but the actual expiry decision is performed using deterministic Python logic.

Possible statuses:

- ✅ VALID
- ⚠️ EXPIRING SOON
- ❌ EXPIRED
- ❓ UNKNOWN

### 🌐 Bilingual Experience

Users can switch between:

- 🇬🇧 English
- 🇮🇳 Hindi

### 🔊 Voice Accessibility

Users can listen to medicine information instead of reading it.

Gemini Text-to-Speech generates the voice output.

---

# 🤖 Gemini API Usage

Gemini is a core part of NextGoli.

## 1. Medicine Image Analysis

### Model

```text
gemini-3.5-flash-lite
```

Used to analyze the uploaded medicine image and extract:

- Medicine / Brand Name
- Active Ingredient
- Strength
- Expiry Date
- Purpose
- How to Take
- Precautions

## 2. Text-to-Speech

### Model

```text
gemini-3.1-flash-tts-preview
```
Used to convert the final medicine information into speech.

Gemini + Python

Gemini extracts the expiry date, while Python performs the actual expiry calculation.

Gemini
  ↓
Extract expiry date

Python
  ↓
Calculate expiry status

---

# 🏗️ Architecture

```text
┌───────────────────────┐
│    Next.js Frontend   │
│                       │
│ Image Upload          │
│ Language Selection    │
│ Medicine Results      │
│ Voice Button          │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    FastAPI Backend    │
│                       │
│ /analyze              │
│ /speak                │
│ Expiry Validation     │
└───────────┬───────────┘
            │
            ▼
┌──────────────────────────┐
│  Gemini 3.5 Flash-Lite   │
│  Multimodal Analysis     │
└───────────┬──────────────┘
            │
            ▼
      Structured Data
            │
            ▼
┌───────────────────────┐
│   Python Validation   │
│   Expiry Calculation  │
└───────────┬───────────┘
            │
            ▼
      Next.js Result
            │
            ▼
┌─────────────────────────────┐
│ Gemini 3.1 Flash TTS        │
│ Text → Speech               │
└──────────────┬──────────────┘
               │
               ▼
          🔊 Audio
```

---

# 🛠️ Tech Stack

| Layer               | Technology                 |
| ------------------- | -------------------------- |
| Frontend            | Next.js, React, TypeScript |
| Styling             | Tailwind CSS               |
| Backend             | Python, FastAPI            |
| Validation          | Pydantic, Python           |
| AI                  | Google Gemini API          |
| Text-to-Speech      | Gemini TTS                 |
| API Documentation   | Swagger                    |
| Version Control     | Git, GitHub                |
| Frontend Deployment | Vercel                     |
| Backend Deployment  | Render                     |

---

# 📁 Project Structure

```text
NextGoli/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   └── tsconfig.json
│
├── README.md
├── .gitignore
└── LICENSE
```text

---

#  ⚙️ Setup & Installation

Prerequisites

Make sure you have:

- Node.js
- npm
- Python 3.10+
- Git
- Gemini API Key

1. Clone Repository

```text
git clone https://github.com/SurBhi9Otaku/NextGoli.git
cd NextGoli
```

2. Backend Setup

```text
cd backend
```
Create a virtual environment.

Windows:
```text
python -m venv venv
venv\Scripts\activate
```
macOS / Linux:
```text
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```text
pip install -r requirements.txt
```

3. Backend Environment Variables

Create:
```text
backend/.env
```
Add:
```text
GEMINI_API_KEY=your_gemini_api_key
```

4. Start Backend
   
```text
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend:
```text
http://localhost:8000
```

Swagger:
```text
http://localhost:8000/docs
```

5. Frontend Setup

Open a new terminal:
```text
cd frontend
```

Install dependencies:
```text
npm install
```

Create:
```text
frontend/.env.local
```
Add:
```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:
```text
npm run dev
```

Frontend:
```text
http://localhost:3000
```

---

# 🔌 API Endpoints

| Method | Endpoint   | Purpose                |
| ------ | ---------- | ---------------------- |
| GET    | `/`        | Backend status         |
| GET    | `/health`  | Health check           |
| POST   | `/analyze` | Analyze medicine image |
| POST   | `/speak`   | Generate speech        |

---

# 🚀 Deployment

Frontend

Deployed using Vercel.

Backend

Deployed using Render.

Production Architecture
```text
Vercel
  │
  ▼
Next.js Frontend
  │
  ▼
Render
  │
  ▼
FastAPI Backend
  │
  ▼
Google Gemini API
```

---

# 🔗 Project Links

- **GitHub:** https://github.com/SurBhi9Otaku/NextGoli
- **Live Demo:** https://frontend-eight-self-43.vercel.app/
- **API Documentation:** https://nextgoli-backend.onrender.com/docs

---

# ❤️ NextGoli

> **See it. Understand it. Hear it.**


