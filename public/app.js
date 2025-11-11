// app.js
// Front-end logic for handling form submissions and visualizing emotion results.

const tabButtons = document.querySelectorAll('.tab-button');
const forms = document.querySelectorAll('.form');
const loadingSection = document.getElementById('loading-state');
const resultCard = document.getElementById('result-card');
const emotionNameEl = document.getElementById('emotion-name');
const emotionSummaryEl = document.getElementById('emotion-summary');
const emotionEmojiEl = document.getElementById('emotion-emoji');
const resetButton = document.getElementById('reset-button');
const emotionCanvas = document.getElementById('emotion-visual');
const ctx = emotionCanvas.getContext('2d');

const emotionColorMap = {
  happy: '#facc15',
  calm: '#38bdf8',
  sad: '#94a3b8',
  angry: '#f87171',
  excited: '#fb923c',
  surprised: '#34d399',
  anxious: '#a855f7',
  neutral: '#60a5fa'
};

const emotionEmojiMap = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  angry: '😡',
  excited: '🤩',
  surprised: '😲',
  anxious: '😰',
  neutral: '🙂'
};

// Update UI to show active tab.
function switchTab(targetId) {
  forms.forEach((form) => form.classList.toggle('active', form.id === targetId));
  tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.target === targetId));
  hideResult();
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.target));
});

resetButton.addEventListener('click', () => {
  forms.forEach((form) => form.reset());
  hideResult();
  switchTab('text-form');
});

function hideResult() {
  resultCard.hidden = true;
  loadingSection.hidden = true;
}

function showLoading() {
  resultCard.hidden = true;
  loadingSection.hidden = false;
}

function showResult(data) {
  loadingSection.hidden = true;
  resultCard.hidden = false;

  const emotionKey = (data.emotion || 'calm').toLowerCase();
  const color = emotionColorMap[emotionKey] || '#38bdf8';
  const emoji = emotionEmojiMap[emotionKey] || '🙂';

  emotionNameEl.textContent = emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1);
  emotionSummaryEl.textContent = data.summary || 'Here is what we felt from your submission.';
  emotionEmojiEl.textContent = emoji;

  drawEmotionCircle(color, data.score || 5);
}

function drawEmotionCircle(color, score) {
  const maxScore = 10;
  const normalized = Math.min(Math.max(score, 1), maxScore) / maxScore;
  const centerX = emotionCanvas.width / 2;
  const centerY = emotionCanvas.height / 2;
  const radius = Math.min(centerX, centerY) - 12;

  ctx.clearRect(0, 0, emotionCanvas.width, emotionCanvas.height);

  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Foreground arc representing intensity.
  ctx.beginPath();
  ctx.arc(
    centerX,
    centerY,
    radius,
    -Math.PI / 2,
    -Math.PI / 2 + normalized * Math.PI * 2,
    false
  );
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 14;
  ctx.stroke();
}

async function handleTextForm(event) {
  event.preventDefault();
  const form = event.target;
  const text = form.text.value.trim();

  if (!text) return;

  showLoading();

  try {
    const response = await fetch('/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to analyze text.');

    showResult(data);
  } catch (error) {
    showResult({ emotion: 'neutral', score: 5, summary: error.message });
  }
}

async function handleFileForm(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const mediaInput = form.querySelector("input[type='file']");

  if (!mediaInput?.files?.length) {
    alert('Please select a file to upload.');
    return;
  }

  formData.append('mediaType', form.dataset.type || 'media');

  showLoading();

  try {
    const response = await fetch('/analyze-file', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to analyze the media upload.');

    showResult(data);
  } catch (error) {
    showResult({ emotion: 'neutral', score: 5, summary: error.message });
  }
}

// Attach event listeners to each form.
document.getElementById('text-form').addEventListener('submit', handleTextForm);
['photo-form', 'video-form', 'audio-form'].forEach((id) => {
  document.getElementById(id).addEventListener('submit', handleFileForm);
});

// Initialize canvas with a default state so the UI never appears empty.
drawEmotionCircle('#38bdf8', 5);
