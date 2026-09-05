// ---------- Tabs ----------
const tabButtons = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ==================================================
// MODO CLÁSSICO
// ==================================================
const intervalsList = document.getElementById('intervals-list');
const addIntervalBtn = document.getElementById('add-interval');
const allowRepeatCheckbox = document.getElementById('allow-repeat');
const drawNumberBtn = document.getElementById('draw-number');
const classicResult = document.getElementById('classic-result');
const classicHistoryEl = document.getElementById('classic-history');
const resetClassicBtn = document.getElementById('reset-classic');

let intervalRowId = 0;
let drawnNumbers = new Set();
let classicHistory = [];

function addIntervalRow(min = 1, max = 100) {
  const id = intervalRowId++;
  const row = document.createElement('div');
  row.className = 'interval-row';
  row.dataset.id = id;
  row.innerHTML = `
    <input type="number" class="min-input" value="${min}">
    <span class="sep">até</span>
    <input type="number" class="max-input" value="${max}">
    <button class="remove-x" title="Remover intervalo">✕</button>
  `;
  row.querySelector('.remove-x').addEventListener('click', () => {
    if (intervalsList.children.length > 1) {
      row.remove();
    }
  });
  intervalsList.appendChild(row);
}

addIntervalBtn.addEventListener('click', () => addIntervalRow());
addIntervalRow(); // linha inicial

function getAllNumbersFromIntervals() {
  const numbers = new Set();
  intervalsList.querySelectorAll('.interval-row').forEach(row => {
    let min = parseInt(row.querySelector('.min-input').value, 10);
    let max = parseInt(row.querySelector('.max-input').value, 10);
    if (isNaN(min) || isNaN(max)) return;
    if (min > max) [min, max] = [max, min];
    for (let n = min; n <= max; n++) numbers.add(n);
  });
  return Array.from(numbers);
}

function renderClassicHistory() {
  classicHistoryEl.innerHTML = '';
  classicHistory.slice().reverse().forEach(n => {
    const li = document.createElement('li');
    li.textContent = n;
    classicHistoryEl.appendChild(li);
  });
}

drawNumberBtn.addEventListener('click', () => {
  const allowRepeat = allowRepeatCheckbox.checked;
  let pool = getAllNumbersFromIntervals();

  if (pool.length === 0) {
    classicResult.innerHTML = `<span class="result-placeholder">Defina ao menos um intervalo válido.</span>`;
    return;
  }

  if (!allowRepeat) {
    pool = pool.filter(n => !drawnNumbers.has(n));
    if (pool.length === 0) {
      classicResult.innerHTML = `<span class="result-placeholder">Todos os números já foram sorteados. Clique em "Limpar" para reiniciar.</span>`;
      return;
    }
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  if (!allowRepeat) drawnNumbers.add(chosen);
  classicHistory.push(chosen);

  classicResult.innerHTML = `<span class="result-value">${chosen}</span>`;
  renderClassicHistory();
});

resetClassicBtn.addEventListener('click', () => {
  drawnNumbers.clear();
  classicHistory = [];
  renderClassicHistory();
  classicResult.innerHTML = `<span class="result-placeholder">Aguardando sorteio…</span>`;
});

// ==================================================
// MODO ROLETA
// ==================================================
const optionInput = document.getElementById('option-input');
const addOptionBtn = document.getElementById('add-option');
const bulkInput = document.getElementById('bulk-input');
const addBulkBtn = document.getElementById('add-bulk');
const optionsListEl = document.getElementById('options-list');
const eliminateToggle = document.getElementById('eliminate-toggle');
const spinBtn = document.getElementById('spin-btn');
const roletaResult = document.getElementById('roleta-result');
const roletaHistoryEl = document.getElementById('roleta-history');
const resetRoletaBtn = document.getElementById('reset-roleta');
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');

const COLORS = [
  '#2E3D19', '#921203', '#6F785E', '#B08D57',
  '#5F6358', '#A85C4D', '#7C8B99', '#8F9779'
];

const DEFAULT_NAMES = [
  'Débora', 'Jonas', 'Lucca', 'Mayza', 'Marcus',
  'Marcia', 'Gil', 'Maiara', 'Rennan', 'Yolanda',
  'Pedro', 'Fabíola', 'Luana', 'Hugo', 'Marcio',
  'Ludmila', 'Junior', 'Leia', 'Wayner', 'Tais'
];

let options = [...DEFAULT_NAMES];
let roletaHistory = [];
let currentRotation = 0;
let spinning = false;

function renderOptionsList() {
  optionsListEl.innerHTML = '';
  if (options.length === 0) {
    optionsListEl.innerHTML = `<li class="empty-msg" style="justify-content:center;">Adicione nomes para montar a roleta</li>`;
  }
  options.forEach((name, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="swatch" style="background:${COLORS[i % COLORS.length]}"></span>
      <span class="name">${escapeHtml(name)}</span>
      <button class="remove-x" title="Remover">✕</button>
    `;
    li.querySelector('.remove-x').addEventListener('click', () => {
      options.splice(i, 1);
      renderOptionsList();
      drawWheel();
    });
    optionsListEl.appendChild(li);
  });
  spinBtn.disabled = options.length < 2;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function addOption(name) {
  name = name.trim();
  if (!name) return;
  options.push(name);
}

addOptionBtn.addEventListener('click', () => {
  addOption(optionInput.value);
  optionInput.value = '';
  renderOptionsList();
  drawWheel();
});

optionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addOption(optionInput.value);
    optionInput.value = '';
    renderOptionsList();
    drawWheel();
  }
});

addBulkBtn.addEventListener('click', () => {
  bulkInput.value.split('\n').forEach(line => addOption(line));
  bulkInput.value = '';
  renderOptionsList();
  drawWheel();
});

resetRoletaBtn.addEventListener('click', () => {
  options = [...DEFAULT_NAMES];
  roletaHistory = [];
  currentRotation = 0;
  roletaHistoryEl.innerHTML = '';
  roletaResult.innerHTML = `<span class="result-placeholder">Aguardando sorteio…</span>`;
  renderOptionsList();
  drawWheel();
});

function drawWheel() {
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) / 2 - 4;
  ctx.clearRect(0, 0, w, h);

  if (options.length === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FBF8F2';
    ctx.fill();
    return;
  }

  const n = options.length;
  const arc = (Math.PI * 2) / n;
  const fontSize = n > 14 ? 11 : n > 8 ? 13 : 16;
  const maxChars = n > 14 ? 10 : n > 8 ? 14 : 20;

  for (let i = 0; i < n; i++) {
    const startAngle = currentRotation + i * arc - Math.PI / 2;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#FAF5EC';
    ctx.lineWidth = 2;
    ctx.stroke();

    const midAngle = startAngle + arc / 2;
    let normalized = midAngle % (Math.PI * 2);
    if (normalized < 0) normalized += Math.PI * 2;
    const upsideDown = normalized > Math.PI / 2 && normalized < Math.PI * 1.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FBF8F2';
    ctx.font = `600 ${fontSize + 1}px Cormorant Garamond, Georgia, serif`;
    let label = options[i];
    if (label.length > maxChars) label = label.slice(0, maxChars - 1) + '…';
    if (upsideDown) {
      ctx.rotate(Math.PI);
      ctx.textAlign = 'left';
      ctx.fillText(label, -(radius - 12), 0);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(label, radius - 12, 0);
    }
    ctx.restore();
  }

  // hub
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#FBF8F2';
  ctx.fill();
  ctx.strokeStyle = '#6F785E';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spin() {
  if (spinning || options.length < 2) return;
  spinning = true;
  spinBtn.disabled = true;

  const n = options.length;
  const arc = (Math.PI * 2) / n;
  const winnerIndex = Math.floor(Math.random() * n);

  // rotation needed so winner segment center lands under the top pointer
  let targetRotation = -(winnerIndex * arc + arc / 2);
  // normalize and add extra full spins for effect
  const extraSpins = 6 + Math.floor(Math.random() * 3);
  while (targetRotation < currentRotation) targetRotation += Math.PI * 2;
  targetRotation += extraSpins * Math.PI * 2;

  const startRotation = currentRotation;
  const totalDelta = targetRotation - startRotation;
  const duration = 4200;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    currentRotation = startRotation + totalDelta * eased;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      currentRotation = targetRotation % (Math.PI * 2);
      finishSpin(winnerIndex);
    }
  }
  requestAnimationFrame(animate);
}

function finishSpin(winnerIndex) {
  spinning = false;
  const winner = options[winnerIndex];
  roletaResult.innerHTML = `<span class="result-value">${escapeHtml(winner)}</span>`;
  roletaHistory.push(winner);
  const li = document.createElement('li');
  li.textContent = winner;
  roletaHistoryEl.prepend(li);

  if (eliminateToggle.checked) {
    options.splice(winnerIndex, 1);
    currentRotation = 0;
    renderOptionsList();
    drawWheel();
  }

  spinBtn.disabled = options.length < 2;
}

spinBtn.addEventListener('click', spin);

renderOptionsList();
drawWheel();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => drawWheel());
}
