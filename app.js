const apiKeyInput = document.querySelector("#apiKey");
const toggleKeyBtn = document.querySelector("#toggleKey");
const photoInput = document.querySelector("#photoInput");
const dropzone = document.querySelector(".dropzone");
const previewWrapper = document.querySelector("#previewWrapper");
const previewImage = document.querySelector("#previewImage");
const clearImageBtn = document.querySelector("#clearImage");
const analyzeBtn = document.querySelector("#analyzeBtn");
const resultsCard = document.querySelector("#resultsCard");
const dominantEmotion = document.querySelector("#dominantEmotion");
const confidenceLabel = document.querySelector("#confidenceLabel");
const colorPalette = document.querySelector("#colorPalette");
const barsRoot = document.querySelector("#emotionBars");
const summaryText = document.querySelector("#summaryText");
const signalList = document.querySelector("#signalList");
const actionsList = document.querySelector("#actionsList");
const barTemplate = document.querySelector("#barTemplate");
const listItemTemplate = document.querySelector("#listItemTemplate");

let imageDataUrl = "";

const FALLBACK_INSIGHTS = {
  dominantEmotion: "Centered",
  confidence: 0.62,
  palette: {
    primary: "#94a3ff",
    secondary: "#f5c0ff",
    accent: "#5debd7",
  },
  summary:
    "Soft eyes, relaxed shoulders, and warm lighting suggest a calm-yet-curious state. There is openness toward new ideas mixed with a hint of nostalgia.",
  emotionScores: [
    { label: "Calm", value: 0.82 },
    { label: "Joy", value: 0.67 },
    { label: "Focus", value: 0.55 },
    { label: "Tension", value: 0.28 },
    { label: "Fatigue", value: 0.21 },
  ],
  signals: [
    "Relaxed jaw + softened gaze -> parasympathetic dominance.",
    "Color temperature indicates golden-hour light, often tied to reflective moods.",
    "Slight tilt of the head shows receptiveness rather than defensiveness.",
  ],
  recommendedActions: [
    "Capture the feeling in a single sentence journal entry.",
    "Take a short walk to maintain the gentle energy curve.",
    "Share a grateful thought with someone to reinforce the warmth.",
  ],
};

const SYSTEM_PROMPT = `
You are Mood Prism, a gentle emotional analyst. Analyze a single user-provided image.
Return ONLY JSON, no prose outside JSON. Use this schema:
{
  "dominantEmotion": string (one or two descriptive words),
  "confidence": number between 0 and 1,
  "palette": {
    "primary": hex color,
    "secondary": hex color,
    "accent": hex color
  },
  "summary": concise sentence (<= 50 words),
  "emotionScores": [
    { "label": "Joy|Calm|Tension|Focus|Fatigue|Surprise|Nostalgia|Hope", "value": 0-1 },
    ...
  ],
  "signals": [ list of 2-4 bullet strings describing visual cues ],
  "recommendedActions": [ list of 2-4 supportive micro-actions ]
}
Focus on empathetic, non-judgmental language. If unsure, set confidence under 0.5 and explain uncertainty in summary.
`;

toggleKeyBtn?.addEventListener("click", () => {
  const isMasked = apiKeyInput.type === "password";
  apiKeyInput.type = isMasked ? "text" : "password";
  toggleKeyBtn.textContent = isMasked ? "Hide" : "Show";
});

photoInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await handleIncomingFile(file);
});

dropzone?.addEventListener("dragenter", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone?.addEventListener("dragleave", (event) => {
  if (!dropzone.contains(event.relatedTarget)) {
    dropzone.classList.remove("dragover");
  }
});

dropzone?.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragover");
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  await handleIncomingFile(file);

  if (window.DataTransfer) {
    const syncTransfer = new DataTransfer();
    syncTransfer.items.add(file);
    photoInput.files = syncTransfer.files;
  }
});

clearImageBtn?.addEventListener("click", () => {
  photoInput.value = "";
  previewWrapper.hidden = true;
  previewImage.removeAttribute("src");
  imageDataUrl = "";
});

analyzeBtn?.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    alert("Add your OpenAI API key first.");
    return;
  }

  if (!imageDataUrl) {
    alert("Upload a photo to analyze.");
    return;
  }

  setLoading(true);
  try {
    const insights = await fetchInsights(apiKey, imageDataUrl);
    renderInsights(insights);
  } catch (error) {
    console.error(error);
    alert(
      "Could not reach OpenAI right now. Showing sample data so you can preview the UI."
    );
    renderInsights(FALLBACK_INSIGHTS);
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeBtn.textContent = isLoading ? "Analyzing..." : "Analyze emotion";
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function handleIncomingFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    return;
  }

  try {
    imageDataUrl = await fileToDataUrl(file);
    previewImage.src = imageDataUrl;
    previewWrapper.hidden = false;
  } catch (error) {
    console.error("Failed to read the selected file", error);
    alert("We couldn't read that file. Please try another image.");
  }
}

async function fetchInsights(apiKey, imageUrl) {
  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT.trim() },
      {
        role: "user",
        content: [
          { type: "text", text: "Please respond with JSON only." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "OpenAI error");
  }

  const data = await response.json();
  const rawText = extractTextContent(data);
  const parsed = safeParse(rawText);
  if (!parsed) {
    throw new Error("Model returned unparseable payload");
  }

  return normalizeInsights(parsed);
}

function extractTextContent(responseJson) {
  const content = responseJson.choices?.[0]?.message?.content;
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (typeof chunk === "string") return chunk;
        if (chunk.type === "text" || chunk.type === "output_text") return chunk.text ?? "";
        return "";
      })
      .join("\n")
      .trim();
  }
  return String(content);
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    const trimmed = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn("JSON parse failed:", error);
    return null;
  }
}

function normalizeInsights(payload) {
  const normalizedScores = (payload.emotionScores ?? [])
    .filter((item) => typeof item?.value === "number")
    .map((item) => ({
      label: item.label ?? "Emotion",
      value: clamp(item.value, 0, 1),
    }))
    .slice(0, 5);

  return {
    dominantEmotion: payload.dominantEmotion ?? "Balanced",
    confidence: clamp(payload.confidence ?? 0.5, 0, 1),
    palette: {
      primary: payload.palette?.primary ?? "#7c3aed",
      secondary: payload.palette?.secondary ?? "#f472b6",
      accent: payload.palette?.accent ?? "#5eead4",
    },
    summary:
      payload.summary ??
      "Cannot parse the insight payload. Showing a placeholder message.",
    emotionScores:
      normalizedScores.length > 0
        ? normalizedScores
        : [
            { label: "Calm", value: 0.5 },
            { label: "Focus", value: 0.42 },
            { label: "Tension", value: 0.33 },
          ],
    signals:
      payload.signals && payload.signals.length > 0
        ? payload.signals
        : ["No signals received from the model."],
    recommendedActions:
      payload.recommendedActions && payload.recommendedActions.length > 0
        ? payload.recommendedActions
        : ["Take a mindful breath.", "Journal a short reflection."],
  };
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function renderInsights(data) {
  resultsCard.classList.remove("hidden");
  dominantEmotion.textContent = data.dominantEmotion;
  confidenceLabel.textContent = `Confidence ${(data.confidence * 100).toFixed(0)}%`;

  updatePalette(data.palette);
  updateBars(data.emotionScores);
  updateList(signalList, data.signals);
  updateList(actionsList, data.recommendedActions);

  summaryText.textContent = data.summary;
}

function updatePalette(palette) {
  const entries = [
    ["primary", palette.primary],
    ["secondary", palette.secondary],
    ["accent", palette.accent],
  ];

  entries.forEach(([role, colorHex]) => {
    const slot = colorPalette.querySelector(`[data-role="${role}"]`);
    if (!slot) return;
    slot.querySelector(".swatch-dot").style.background = colorHex;
    slot.querySelector(".hex").textContent = colorHex.toUpperCase();
  });

  resultsCard.style.background = `linear-gradient(160deg, ${palette.primary}1f, ${palette.secondary}0f), var(--card)`;
  document.documentElement.style.setProperty("--accent", palette.accent);
}

function updateBars(scores) {
  barsRoot.innerHTML = "";
  scores.forEach((score) => {
    const node = barTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".label-text").textContent = score.label;
    node.querySelector(".value-text").textContent = `${Math.round(score.value * 100)}%`;
    node.querySelector(".bar-fill").style.width = `${score.value * 100}%`;
    node.querySelector(".bar-fill").style.background = `linear-gradient(90deg, var(--accent), ${scores[0]?.label === score.label ? "#f472b6" : "#818cf8"})`;
    barsRoot.appendChild(node);
  });
}

function updateList(target, items) {
  target.innerHTML = "";
  items.forEach((text) => {
    const node = listItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("span").textContent = text;
    target.appendChild(node);
  });
}
