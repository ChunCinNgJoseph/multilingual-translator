let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const UI_TEXT = {
  en: {
    identifyTitle: "🧑‍💻 Identify Me via Face",
    inputMethod: "🧭 Choose Input Method",
    speak: "🎤 Speak",
    type: "⌨️ Type",
    submitText: "Submit Text",
    submitVoice: "Submit Voice",
    outputLang: "🌐 Choose Output Language",
    output: "📤 Output",
    submit: "✅ Submit",
    register: "🆕 New user? Register here",
    news: "📰 Latest News",
    newsLabel: "How many news items to display:",
    btnRefreshNews: "🔄 Refresh News",
    btnReadNews: "🗣 Read News",
    youSaid: "You said:",
    noSubmission: "No submission yet.",
    noneText: "(none)",
    optionSelectPrompt: "-- Select --"
  },
  es: {
    identifyTitle: "🧑‍💻 Identifícate con tu rostro",
    inputMethod: "🧭 Elige método de entrada",
    speak: "🎤 Hablar",
    type: "⌨️ Escribir",
    submitText: "Enviar texto",
    submitVoice: "Enviar voz",
    outputLang: "🌐 Elige idioma de salida",
    output: "📤 Salida",
    submit: "✅ Enviar",
    register: "🆕 ¿Nuevo usuario? Regístrate aquí",
    news: "📰 Noticias recientes",
    newsLabel: "Cuántas noticias mostrar:",
    btnRefreshNews: "🔄 Actualizar noticias",
    btnReadNews: "🗣 Leer noticias",
    youSaid: "Dijiste:",
    noSubmission: "Nada enviado aún.",
    noneText: "(ninguno)",
    optionSelectPrompt: "-- Seleccionar --"
  },
  fr: {
    identifyTitle: "🧑‍💻 Identifiez-vous par visage",
    inputMethod: "🧭 Choisir la méthode d'entrée",
    speak: "🎤 Parler",
    type: "⌨️ Taper",
    submitText: "Soumettre le texte",
    submitVoice: "Soumettre la voix",
    outputLang: "🌐 Choisir la langue de sortie",
    output: "📤 Résultat",
    submit: "✅ Soumettre",
    register: "🆕 Nouvel utilisateur ? Inscrivez-vous ici",
    news: "📰 Dernières nouvelles",
    newsLabel: "Nombre de nouvelles à afficher:",
    btnRefreshNews: "🔄 Actualiser",
    btnReadNews: "🗣 Lire les nouvelles",
    youSaid: "Vous avez dit :",
    noSubmission: "Aucune soumission encore.",
    noneText: "(aucun)",
    optionSelectPrompt: "-- Choisir --"
  },
  de: {
    identifyTitle: "🧑‍💻 Gesichtserkennung zur Anmeldung",
    inputMethod: "🧭 Eingabemethode wählen",
    speak: "🎤 Sprechen",
    type: "⌨️ Schreiben",
    submitText: "Text senden",
    submitVoice: "Sprache senden",
    outputLang: "🌐 Ausgabesprache wählen",
    output: "📤 Ausgabe",
    submit: "✅ Senden",
    register: "🆕 Neuer Benutzer? Hier registrieren",
    news: "📰 Neueste Nachrichten",
    newsLabel: "Anzahl der anzuzeigenden Nachrichten:",
    btnRefreshNews: "🔄 Nachrichten aktualisieren",
    btnReadNews: "🗣 Nachrichten vorlesen",
    youSaid: "Du hast gesagt:",
    noSubmission: "Noch keine Eingabe.",
    noneText: "(keine)",
    optionSelectPrompt: "-- Wählen --"
  },
  zh: {
    identifyTitle: "🧑‍💻 面部识别登录",
    inputMethod: "🧭 选择输入方式",
    speak: "🎤 语音输入",
    type: "⌨️ 文字输入",
    submitText: "提交文本",
    submitVoice: "提交语音",
    outputLang: "🌐 选择输出语言",
    output: "📤 输出内容",
    submit: "✅ 提交",
    register: "🆕 新用户？点此注册",
    news: "📰 最新新闻",
    newsLabel: "显示的新闻条数：",
    btnRefreshNews: "🔄 刷新新闻",
    btnReadNews: "🗣 播报新闻",
    youSaid: "你说了：",
    noSubmission: "尚未提交。",
    noneText: "(无)",
    optionSelectPrompt: "-- 请选择 --"
  }
};

function switchLanguage(lang) {
  const t = UI_TEXT[lang] || UI_TEXT.en;

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };

  set("identifyTitle", t.identifyTitle);
  set("labelInputMethod", t.inputMethod);
  set("btnSubmitText", t.submitText);
  set("btnSubmitVoice", t.submitVoice);
  set("labelOutputLang", t.outputLang);
  set("submitBtn", t.submit);
  set("registerLink", t.register);
  set("newsTitle", t.news);
  set("newsLabel", t.newsLabel);
  set("btnRefreshNews", t.btnRefreshNews);
  set("btnReadNews", t.btnReadNews);
  set("userSpeechLabel", t.youSaid);
  set("outputLabel", t.output);
  set("output", t.noSubmission);

  const selectPrompt = document.getElementById("optionSelectPrompt");
  if (selectPrompt) selectPrompt.textContent = t.optionSelectPrompt;

  const speak = document.getElementById("optionSpeak");
  if (speak) speak.textContent = t.speak;

  const type = document.getElementById("optionType");
  if (type) type.textContent = t.type;

  const none = document.getElementById("userSpeech");
  if (none && (none.textContent === "(none)" || none.innerText === "(none)")) {
    none.textContent = t.noneText || "(none)";
  }
}

async function startFacePreview() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById("facePreview");
    if (video) {
      video.srcObject = stream;
    }
  } catch (e) {
    console.error("Camera preview failed:", e);
    alert("⚠️ Could not access camera for preview.");
  }
}

async function toggleRecording() {
  const recordBtn = document.getElementById("recordBtn");

  if (!isRecording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      document.getElementById("playback").src = URL.createObjectURL(blob);
      document.audioBlob = blob;
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.innerText = "⏹ Stop Recording";
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.innerText = "🎤 Start Recording";
  }
}

async function submitText() {
  const typedText = document.getElementById("manualInput").value.trim();
  const outputText = document.getElementById("output");
  const lang = document.getElementById("targetLang").value;
  const audioPlayer = document.getElementById("ttsPlayback");

  outputText.innerText = "Processing...";

  try {
    const res = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: typedText, lang: lang })
    });
    const data = await res.json();
    console.log("Detected or selected language:", data.lang);
    outputText.innerText = data.translated;
    if (data.audio_filename) {
      audioPlayer.src = "/static/" + data.audio_filename;
      audioPlayer.play();
    }
  } catch (e) {
    outputText.innerText = "❌ Something went wrong.";
  }
}

async function submitVoice() {
  const outputText = document.getElementById("output");
  const lang = document.getElementById("targetLang").value;
  const audioPlayer = document.getElementById("ttsPlayback");

  if (!document.audioBlob) {
    outputText.innerText = "❌ No voice recording available.";
    return;
  }

  outputText.innerText = "Processing voice...";

  try {
    const formData = new FormData();
    formData.append("audio", document.audioBlob, "speech.wav");
    formData.append("lang", lang);

    const res = await fetch("/submit", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    document.getElementById("userSpeech").innerText = data.user_input || "(unavailable)";
    outputText.innerText = data.translated;
        if (data.audio_filename) {
      audioPlayer.src = "/static/" + data.audio_filename;
      audioPlayer.play();
    }
  } catch (e) {
    outputText.innerText = "❌ Something went wrong.";
  }
}

async function getNews() {
  const lang = document.getElementById("targetLang").value;
  const count = document.getElementById("count").value;  // ✅ define it first
  console.log("Requested count:", count);

  const newsList = document.getElementById("newsList");
  newsList.innerHTML = "Loading news...";

  try {
    const res = await fetch("/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: lang, count: parseInt(count) })
    });
    const data = await res.json();
    newsList.innerHTML = "";

    data.headlines.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${item.url}" target="_blank">${item.title}</a>`;
      newsList.appendChild(li);
    });
  } catch (e) {
    newsList.innerHTML = "Failed to fetch news.";
  }
}

async function sendMessage() {
  const input = document.getElementById("chatInput").value.trim();
  const responsePara = document.getElementById("chatResponse");

  if (!input) {
    responsePara.innerText = "Please enter a message.";
    return;
  }

  responsePara.innerText = "Thinking...";

  try {
    const res = await fetch("/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    const data = await res.json();
    responsePara.innerText = "🤖 " + data.response;
  } catch (e) {
    responsePara.innerText = "❌ Failed to contact the chatbot.";
  }
}

async function readNews() {
  const lang = document.getElementById("targetLang").value;
  const count = document.getElementById("count").value;
  const newsAudio = document.getElementById("newsAudio");

  try {
    const res = await fetch("/read-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: lang, count: parseInt(count) })
    });
    const data = await res.json();

    if (data.audio_filename) {
      newsAudio.src = "/static/" + data.audio_filename;
      newsAudio.play();
    } else {
      alert("🛑 Could not generate news audio.");
    }
  } catch (e) {
    alert("❌ Failed to fetch or play news.");
  }
}

// Webcam capture and face recognition
async function captureAndIdentify() {
  const video = document.getElementById("facePreview");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Let camera warm up briefly
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture image from video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop stream after capture
    stream.getTracks().forEach(track => track.stop());

    // Convert to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
    const formData = new FormData();
    formData.append("image", blob, "snapshot.jpg");

    // Send to /identify
    const res = await fetch("/identify", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert(`Welcome back, ${data.user}! Language set to ${data.lang}.`);

      // Update language dropdown
      document.getElementById("targetLang").value = data.lang;

      // 🔁 Switch UI text
      switchLanguage(data.lang);

      // 🧹 Hide face ID card
      const card = document.getElementById("identifyCard");
      if (card) card.style.display = "none";

      // Stop preview if still active
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    } else {
      alert(data.message || "Face not recognized.");
    }

  } catch (e) {
    console.error("Camera error or fetch failed:", e);
    alert("⚠️ Unable to access camera or identify.");
  }
}

function toggleInputMode() {
  const mode = document.getElementById("inputMode").value;
  const voiceDiv = document.getElementById("voiceInput");
  const textDiv = document.getElementById("textInput");

  if (mode === "voice") {
    voiceDiv.style.display = "block";
    textDiv.style.display = "none";
  } else if (mode === "text") {
    voiceDiv.style.display = "none";
    textDiv.style.display = "block";
  } else {
    voiceDiv.style.display = "none";
    textDiv.style.display = "none";
  }
}

function openModal() {
  document.getElementById("registerModal").style.display = "flex";

  // Start webcam for registration
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    document.getElementById("regPreview").srcObject = stream;
  }).catch(err => {
    alert("Camera access denied for registration.");
  });
}

function closeModal() {
  document.getElementById("registerModal").style.display = "none";

  // Stop webcam
  const stream = document.getElementById("regPreview").srcObject;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

async function submitRegistration() {
  const name = document.getElementById("regName").value.trim();
  const lang = document.getElementById("regLang").value;
  const video = document.getElementById("regPreview");

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
  const formData = new FormData();
  formData.append("image", blob, "snapshot.jpg");
  formData.append("name", name);
  formData.append("lang", lang);

  const res = await fetch("/register-face", {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  alert(data.message);

  if (data.success) {
    closeModal();
  }
}

window.onload = () => {
  startFacePreview();
};