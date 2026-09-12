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

## 1. Gemini Multimodal Vision

### Model

```text
gemini-3.5-flash-lite