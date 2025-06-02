from flask import Flask, render_template, request, jsonify
import whisper
import requests
import os
import uuid
import asyncio
import edge_tts
import face_recognition
import numpy as np
import json
from flask import render_template

app = Flask(__name__)
model = whisper.load_model("base")

LANG_VOICE_MAP = {
    "en": "en-US-AriaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "zh": "zh-CN-XiaoxiaoNeural"
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/submit", methods=["POST"])
def submit():
    try:
        if request.content_type == "application/json":
            data = request.get_json()
            user_input = data["text"]
            lang = data["lang"]  # use selected language for typed input
        else:
            # --- Voice input ---
            file = request.files["audio"]
            file.save("uploaded.wav")
            result = model.transcribe("uploaded.wav", language=None)
            user_input = result["text"]
            lang = result.get("language", "en")  # detected language

        # --- Step 1: Chatbot response in the same language ---
        system_prompt = f"You are a helpful assistant. Respond in {lang}."

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        chat_data = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ]
        }

        chat_response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=chat_data,
            timeout=30
        )
        chat_response.raise_for_status()
        chatbot_reply = chat_response.json()["choices"][0]["message"]["content"]

        # --- Step 2: Text-to-speech output in that language ---
        tts_filename = ""
        if lang in LANG_VOICE_MAP:
            tts_filename = f"{uuid.uuid4().hex}.mp3"
            output_path = os.path.join("static", tts_filename)
            asyncio.run(generate_tts_edge(chatbot_reply, LANG_VOICE_MAP[lang], output_path))
        else:
            chatbot_reply += " (TTS not available)"

        return jsonify({
            "translated": chatbot_reply,
            "audio_filename": tts_filename,
            "lang": lang,
            "user_input": user_input  # <- add this
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"translated": "[Error occurred]", "audio_filename": ""})

    except Exception as e:
        print("Error:", e)
        return jsonify({"translated": "[Error occurred]", "audio_filename": ""})

def translate_text(text, source="en", target="de"):
    try:
        response = requests.post(
            "http://localhost:5005/translate",
            json={
                "q": text,
                "source": source,
                "target": target,
                "format": "text"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        response.raise_for_status()
        return response.json()['translatedText']
    except Exception as e:
        print("Translation error:", e)
        return "[Translation failed]"

async def generate_tts_edge(text, voice, output_file):
    try:
        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(output_file)
    except Exception as e:
        print("Edge TTS error:", e)

@app.route("/news", methods=["POST"])
def news():
    try:
        data = request.get_json()
        lang = data.get("lang", "en")
        count = int(data.get("count", 3))

        news_response = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={"country": "us", "apiKey": "ca9d39a2181b45b6b3dbea092726d5ba"}
        )
        news_data = news_response.json()
        selected_articles = news_data["articles"][:count]

        translated_headlines = []
        for article in selected_articles:
            translated_title = translate_text(article["title"], target=lang)
            translated_headlines.append({
                "title": translated_title,
                "url": article["url"]
            })

        return jsonify({"headlines": translated_headlines})

    except Exception as e:
        print("News fetch error:", e)
        return jsonify({"headlines": []})
    
@app.route("/read-news", methods=["POST"])
def read_news():
    try:
        data = request.get_json()
        lang = data.get("lang", "en")
        count = int(data.get("count", 3))

        news_response = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={"country": "us", "apiKey": "ca9d39a2181b45b6b3dbea092726d5ba"}
        )
        news_data = news_response.json()
        selected_articles = news_data["articles"][:count]

        headlines_text = ""
        for idx, article in enumerate(selected_articles, start=1):
            translated = translate_text(article["title"], target=lang)
            headlines_text += f"News {idx}: {translated}. "

        tts_filename = ""
        if lang in LANG_VOICE_MAP:
            tts_filename = f"{uuid.uuid4().hex}_news.mp3"
            output_path = os.path.join("static", tts_filename)
            asyncio.run(generate_tts_edge(headlines_text, LANG_VOICE_MAP[lang], output_path))
        else:
            return jsonify({"audio_filename": ""})

        return jsonify({"audio_filename": tts_filename})
    except Exception as e:
        print("Read news error:", e)
        return jsonify({"audio_filename": ""})

    
OPENROUTER_API_KEY = "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"

@app.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        user_msg = request.json.get("message", "")

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "mistralai/mistral-7b-instruct",  # free, fast, accurate
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_msg}
            ]
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )

        print("Status Code:", response.status_code)
        print("Response Body:", response.text)

        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"]

        return jsonify({"response": reply})
    except Exception as e:
        print("Chatbot error:", e)
        return jsonify({"response": "Chatbot failed to respond."})

FACE_DB = "faces.json"

def load_faces():
    if not os.path.exists(FACE_DB):
        return {}
    with open(FACE_DB, "r") as f:
        return json.load(f)

def save_faces(data):
    with open(FACE_DB, "w") as f:
        json.dump(data, f)

@app.route("/identify", methods=["POST"])
def identify():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image uploaded"}), 400

        file = request.files["image"]
        img = face_recognition.load_image_file(file)
        face_encodings = face_recognition.face_encodings(img)

        if not face_encodings:
            return jsonify({"success": False, "message": "No face found"})

        # Load known faces
        with open("faces.json", "r") as f:
            known_faces = json.load(f)

        known_encodings = [np.array(v["face_encoding"]) for v in known_faces.values()]
        known_names = list(known_faces.keys())

        matches = face_recognition.compare_faces(known_encodings, face_encodings[0])
        if True in matches:
            idx = matches.index(True)
            name = known_names[idx]
            lang = known_faces[name]["language"]
            return jsonify({"success": True, "user": name, "lang": lang})
        else:
            return jsonify({"success": False, "message": "Face not recognized."})
    except Exception as e:
        print("🔴 IDENTIFY ERROR:", e)
        return jsonify({"success": False, "message": "Server error"}), 500

@app.route("/register-face", methods=["POST"])
def register_face():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image uploaded"}), 400

        name = request.form.get("name")
        lang = request.form.get("lang", "en")

        if not name:
            return jsonify({"success": False, "message": "Missing name"}), 400

        file = request.files["image"]
        img = face_recognition.load_image_file(file)
        encodings = face_recognition.face_encodings(img)

        if not encodings:
            return jsonify({"success": False, "message": "No face found"}), 400

        encoding = encodings[0]

        # Load existing database
        if os.path.exists("faces.json"):
            with open("faces.json", "r") as f:
                face_data = json.load(f)
        else:
            face_data = {}

        face_data[name] = {
            "language": lang,
            "face_encoding": encoding.tolist()
        }

        with open("faces.json", "w") as f:
            json.dump(face_data, f)

        return jsonify({"success": True, "message": f"{name} registered with {lang}."})

    except Exception as e:
        print("🔴 REGISTER ERROR:", e)
        return jsonify({"success": False, "message": "Registration failed."}), 500

@app.route("/register")
def register():
    return render_template("register.html")


if __name__ == "__main__":
    app.run(debug=True)
