# Multilingual Voice Assistant for Aged Care

**Early-stage prototype** — Flask web app combining voice interaction, AI chat, and multilingual translation, originally conceived as an accessibility tool for aged care settings.

---

## Background

This project began as an exploration into how voice-based AI could help elderly residents in aged care facilities stay connected — through news, conversation, and communication across language barriers — without needing to navigate complex interfaces. The original concept combined voice input, a conversational chatbot, multilingual text-to-speech, and face-based user recognition so a shared device could greet and respond to different residents in their preferred language.

The scope was later narrowed for a Computing Science Honours research project, which became a focused investigation into [voice anti-spoofing using CLAP embeddings](https://github.com/ChunCinNgJoseph/voice-antispoofing-clap). This repository remains as the original prototype — functional, but not production-ready.

---

## What It Does

- **Voice input** — users speak into the browser; audio is transcribed using OpenAI's Whisper model, with automatic language detection
- **Conversational AI** — transcribed (or typed) input is sent to an LLM via OpenRouter, which responds in the same language
- **Multilingual text-to-speech** — chatbot replies are converted to spoken audio using Microsoft Edge's neural TTS voices, across English, Spanish, French, German, and Mandarin
- **Live news, translated and read aloud** — fetches current headlines and reads them back in the user's selected language
- **Face-based user recognition** — a registered user can be identified by their face, automatically loading their preferred language

---

## Tech Stack

- **Flask** — web server and routing
- **OpenAI Whisper** — speech-to-text transcription
- **OpenRouter API** (Mistral 7B Instruct) — conversational responses
- **edge-tts** — neural text-to-speech across multiple languages
- **face_recognition** (dlib-based) — face encoding and matching
- **python-dotenv** — environment variable management for API keys

---

## Setup

### Requirements

```bash
pip install -r requirements.txt
```

> **Note:** `face_recognition` depends on `dlib`, which can be difficult to build on Windows. If installation fails, look into pre-built wheels for your Python version, or use Windows Subsystem for Linux (WSL).

### Environment Variables

Create a `.env` file in the project root with your own API keys:

```
OPENROUTER_API_KEY=your_openrouter_key_here
NEWSAPI_API_KEY=your_newsapi_key_here
```

- Get an OpenRouter key at [openrouter.ai](https://openrouter.ai)
- Get a NewsAPI key at [newsapi.org](https://newsapi.org)

### Run

```bash
python app.py
```

The app will be available at `http://localhost:5000`.

---

## Known Limitations

This was an early prototype, not a finished product:

- No user authentication beyond face matching — not suitable for handling sensitive data as-is
- Face encodings are stored in a local JSON file rather than a proper database
- No automated tests
- Error handling is minimal; some endpoints fail silently on malformed input
- Translation endpoint (`translate_text`) expects a local LibreTranslate instance running on `localhost:5005`, which is not included in this repository
- Not deployed; intended for local development and demonstration only

---

## Why This Approach

The project intentionally avoided commercial cloud TTS/STT services in favour of more accessible or self-hostable alternatives (Whisper for transcription, edge-tts for speech synthesis) to explore what a low-cost, privately-run version of this kind of assistant could look like — relevant in aged care contexts where ongoing subscription costs and data privacy are real constraints.
