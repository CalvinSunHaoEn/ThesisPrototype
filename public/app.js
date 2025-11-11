const photoInput = document.getElementById('photoInput');
const analyzeButton = document.getElementById('analyzeButton');
const demoButton = document.getElementById('demoButton');
const uploadPreview = document.getElementById('uploadPreview');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsSection = document.getElementById('results');
const dominantEmotionEl = document.getElementById('dominantEmotion');
const summaryEl = document.getElementById('summary');
const intensityFill = document.getElementById('intensityFill');
const intensityLabel = document.getElementById('intensityLabel');
const intensityDescription = document.getElementById('intensityDescription');
const spectrumList = document.getElementById('spectrumList');
const paletteContainer = document.getElementById('colorPalette');
const recommendationsSection = document.getElementById('recommendations');
const recommendationList = document.getElementById('recommendationList');

let spectrumChart = null;
let imageDataUrl = null;

const DEMO_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2MDAnIGhlaWdodD0nODAwJyB2aWV3Qm94PScwIDAgNjAwIDgwMCc+CjxkZWZzPgogIDxsaW5lYXJHcmFkaWVudCBpZD0nZycgeDE9JzAlJyB5MT0nMCUnIHgyPScxMDAlJyB5Mj0nMTAwJSc+CiAgICA8c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjNjBBNUZBJy8+CiAgICA8c3RvcCBvZmZzZXQ9JzUwJScgc3RvcC1jb2xvcj0nIzM0RDM5OScvPgogICAgPHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjRkJCRjI0Jy8+CiAgPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cmVjdCB3aWR0aD0nNjAwJyBoZWlnaHQ9JzgwMCcgZmlsbD0ndXJsKCNnKScgcng9JzQ4Jy8+Cjx0ZXh0IHg9JzUwJScgeT0nNDUlJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyBmb250LXNpemU9JzY0JyBmaWxsPSd3aGl0ZScgZm9udC1mYW1pbHk9IlBvcHBpbnMsIHNhbnMtc2VyaWYiIG9wYWNpdHk9JzAuODUnPkRFTU88L3RleHQ+Cjx0ZXh0IHg9JzUwJScgeT0nNTUlJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyBmb250LXNpemU9JzI4JyBmaWxsPSd3aGl0ZScgZm9udC1mYW1pbHk9IlBvcHBpbnMsIHNhbnMtc2VyaWYiIG9wYWNpdHk9JzAuNzUnPk1vb2QgUHJldmlldzwvdGV4dD4KPC9zdmc+';

const DEMO_DATA = {
  dominantEmotion: '喜悅示範',
  confidence: 0.86,
  intensity: {
    level: '適中',
    score: 0.62,
    description: '放鬆的肩線與自然微笑呈現穩定的愉悅感。'
  },
  emotionalSpectrum: [
    {
      emotion: '喜悅',
      score: 0.86,
      description: '明亮的笑容與閃爍的眼神傳遞滿滿幸福。',
      color: '#FBBF24'
    },
    {
      emotion: '安心',
      score: 0.64,
      description: '肩膀下沉且呼吸平穩，呈現舒適感。',
      color: '#34D399'
    },
    {
      emotion: '期待',
      score: 0.42,
      description: '眼神專注向前，顯示對下一步的期待。',
      color: '#60A5FA'
    }
  ],
  colorPalette: [
    { name: '晨曦金', hex: '#FBBF24', purpose: '為畫面帶入陽光般的喜悅感。' },
    { name: '薄荷綠', hex: '#34D399', purpose: '維持呼吸般的放鬆節奏。' },
    { name: '天空藍', hex: '#60A5FA', purpose: '增加專注與前進的力量。' }
  ],
  summary: '整體表情自然且充滿活力，情緒穩定而愉快。',
  recommendations: [
    '利用這份好心情安排一個小小的慶祝儀式。',
    '記錄此刻的感受，作為未來激勵自己的素材。'
  ]
};

photoInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = reader.result;
    renderPreview(imageDataUrl);
    enableAnalyzeButton();
  };
  reader.readAsDataURL(file);
});

analyzeButton.addEventListener('click', async () => {
  if (!imageDataUrl) {
    return;
  }

  showLoading(true);
  toggleAnalyzeButton(false);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: imageDataUrl })
    });

    if (!response.ok) {
      throw new Error('分析失敗，請稍後再試。');
    }

    const data = await response.json();
    renderResults(data);
  } catch (error) {
    console.error(error);
    alert(error.message || '無法分析照片。');
  } finally {
    showLoading(false);
    toggleAnalyzeButton(true);
  }
});

if (demoButton) {
  demoButton.addEventListener('click', () => {
    imageDataUrl = DEMO_IMAGE;
    renderPreview(DEMO_IMAGE);
    renderResults(DEMO_DATA);
    toggleAnalyzeButton(false);
  });
}

function renderPreview(dataUrl) {
  uploadPreview.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = '已選擇的照片';
  uploadPreview.appendChild(img);
}

function enableAnalyzeButton() {
  analyzeButton.classList.add('enabled');
  analyzeButton.disabled = false;
  analyzeButton.setAttribute('aria-disabled', 'false');
}

function toggleAnalyzeButton(enable) {
  analyzeButton.disabled = !enable;
  analyzeButton.classList.toggle('enabled', enable);
  analyzeButton.setAttribute('aria-disabled', String(!enable));
}

function showLoading(isLoading) {
  loadingOverlay.hidden = !isLoading;
}

function renderResults(data) {
  const {
    dominantEmotion,
    confidence,
    intensity,
    emotionalSpectrum,
    colorPalette,
    summary,
    recommendations
  } = data;

  const confidenceValue = typeof confidence === 'number' ? confidence : 0;
  dominantEmotionEl.textContent = `${dominantEmotion ?? '未知情緒'} · ${(
    confidenceValue * 100
  ).toFixed(0)}%`;
  summaryEl.textContent = summary ?? '';

  if (intensity) {
    const { score = 0, level = '', description = '' } = intensity;
    const boundedScore = Math.min(Math.max(score, 0), 1);
    intensityFill.style.width = `${Math.round(boundedScore * 100)}%`;
    intensityLabel.textContent = `${level.toUpperCase()} · ${(
      boundedScore * 100
    ).toFixed(0)}%`;
    intensityDescription.textContent = description;
  }

  renderSpectrum(emotionalSpectrum ?? []);
  renderPalette(colorPalette ?? []);
  renderRecommendations(recommendations ?? []);

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderSpectrum(spectrum) {
  spectrumList.innerHTML = '';
  const labels = [];
  const data = [];
  const colors = [];
  const chartCanvas = document.getElementById('spectrumChart');

  if (spectrumChart) {
    spectrumChart.destroy();
    spectrumChart = null;
  }

  if (!spectrum?.length) {
    if (chartCanvas) {
      chartCanvas.hidden = true;
    }
    return;
  }

  if (chartCanvas) {
    chartCanvas.hidden = false;
  }

  spectrum.forEach((item) => {
    const li = document.createElement('li');

    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.gap = '4px';

    const label = document.createElement('div');
    label.className = 'spectrum-label';

    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = normalizeHex(item.color || '#6366f1');

    const title = document.createElement('strong');
    title.textContent = item.emotion;

    label.appendChild(swatch);
    label.appendChild(title);

    leftColumn.appendChild(label);

    if (item.description) {
      const description = document.createElement('small');
      description.textContent = item.description;
      description.style.color = 'rgba(248, 250, 252, 0.7)';
      leftColumn.appendChild(description);
    }

    const value = document.createElement('span');
    value.className = 'spectrum-value';
    value.textContent = `${Math.round((item.score ?? 0) * 100)}%`;

    li.appendChild(leftColumn);
    li.appendChild(value);
    spectrumList.appendChild(li);

    labels.push(item.emotion);
    data.push(Math.round((item.score ?? 0) * 100));
    colors.push(normalizeHex(item.color || '#6366f1'));
  });

  if (!chartCanvas) return;

  spectrumChart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '情緒比例 (%)',
          data,
          backgroundColor: colors,
          borderRadius: 12,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: 'rgba(248, 250, 252, 0.7)' },
          grid: { color: 'rgba(148, 163, 184, 0.2)' }
        },
        x: {
          ticks: { color: 'rgba(248, 250, 252, 0.7)' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderPalette(palette) {
  paletteContainer.innerHTML = '';

  palette.forEach((color) => {
    const card = document.createElement('div');
    card.className = 'color-card';

    const sample = document.createElement('div');
    sample.className = 'color-sample';
    sample.style.background = normalizeHex(color.hex || '#334155');

    const name = document.createElement('span');
    name.textContent = color.name || '情緒色彩';

    const meta = document.createElement('span');
    meta.className = 'color-meta';
    meta.textContent = color.purpose || normalizeHex(color.hex || '#334155');

    card.appendChild(sample);
    card.appendChild(name);
    card.appendChild(meta);
    paletteContainer.appendChild(card);
  });
}

function renderRecommendations(list) {
  if (!list.length) {
    recommendationsSection.hidden = true;
    recommendationList.innerHTML = '';
    return;
  }

  recommendationList.innerHTML = '';
  list.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    recommendationList.appendChild(li);
  });
  recommendationsSection.hidden = false;
}

function normalizeHex(hex) {
  if (!hex) return '#6366f1';
  return hex.startsWith('#') ? hex : `#${hex}`;
}
