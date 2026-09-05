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
const drawNumberBtn = document.getElementById('draw-number');
const classicResult = document.getElementById('classic-result');

const DEFAULT_INTERVALS = [
  [108, 177],
  [181, 219],
  [280, 299],
  [220, 259]
];

const ALL_NUMBERS = (() => {
  const numbers = new Set();
  DEFAULT_INTERVALS.forEach(([min, max]) => {
    for (let n = min; n <= max; n++) numbers.add(n);
  });
  return Array.from(numbers);
})();

let drawnNumbers = new Set();
let classicSpinning = false;

function spinClassicSuspense(chosen, onDone) {
  const TOTAL_DURATION = 7000;
  const UNITS_LOCK_AT = TOTAL_DURATION / 3;
  const TENS_LOCK_AT = (TOTAL_DURATION / 3) * 2;

  const finalHundreds = Math.floor(chosen / 100);
  const finalTens = Math.floor((chosen % 100) / 10);
  const finalUnits = chosen % 10;

  const locked = { hundreds: false, tens: false, units: false };
  const startTime = performance.now();
  const randomDigit = () => Math.floor(Math.random() * 10);

  function render(digits) {
    classicResult.innerHTML = `
      <span class="digits">
        <span class="digit${locked.hundreds ? ' locked' : ''}">${digits.hundreds}</span>
        <span class="digit${locked.tens ? ' locked' : ''}">${digits.tens}</span>
        <span class="digit${locked.units ? ' locked' : ''}">${digits.units}</span>
      </span>`;
  }

  const intervalId = setInterval(() => {
    const elapsed = performance.now() - startTime;

    if (elapsed >= UNITS_LOCK_AT) locked.units = true;
    if (elapsed >= TENS_LOCK_AT) locked.tens = true;

    if (elapsed >= TOTAL_DURATION) {
      clearInterval(intervalId);
      classicResult.innerHTML = `<span class="result-value">${chosen}</span>`;
      onDone();
      return;
    }

    render({
      hundreds: locked.hundreds ? finalHundreds : randomDigit(),
      tens: locked.tens ? finalTens : randomDigit(),
      units: locked.units ? finalUnits : randomDigit()
    });
  }, 70);
}

drawNumberBtn.addEventListener('click', () => {
  if (classicSpinning) return;

  let pool = ALL_NUMBERS.filter(n => !drawnNumbers.has(n));
  if (pool.length === 0) {
    classicResult.innerHTML = `<span class="result-placeholder">Todos os números já foram sorteados.</span>`;
    return;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];

  classicSpinning = true;
  drawNumberBtn.disabled = true;

  spinClassicSuspense(chosen, () => {
    drawnNumbers.add(chosen);
    classicSpinning = false;
    drawNumberBtn.disabled = false;
  });
});

// ==================================================
// MODO ROLETA
// ==================================================
const spinBtn = document.getElementById('spin-btn');
const roletaResult = document.getElementById('roleta-result');
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');

const COLORS = [
  '#2E3D19', '#921203', '#6F785E', '#B08D57',
  '#5F6358', '#A85C4D', '#7C8B99', '#8F9779'
];

const options = [
  'Débora', 'Jonas', 'Lucca', 'Mayza', 'Marcus',
  'Marcia', 'Gil', 'Maiara', 'Rennan', 'Yolanda',
  'Pedro', 'Fabíola', 'Luana', 'Hugo', 'Marcio',
  'Ludmila', 'Junior', 'Leia', 'Wayner', 'Tais'
];

let currentRotation = 0;
let spinning = false;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

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
  const fontSize = n > 14 ? 15 : n > 8 ? 18 : 22;
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
  spinBtn.disabled = false;
}

spinBtn.addEventListener('click', spin);

drawWheel();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => drawWheel());
}
