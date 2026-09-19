(() => {
  'use strict';
  const app = document.getElementById('app');
  const settingsDialog = document.getElementById('settingsDialog');
  const form = document.getElementById('settingsForm');
  const fullscreenHelp = document.getElementById('fullscreenHelp');
  const amountInput = document.getElementById('amountInput');
  const delaySelect = document.getElementById('delaySelect');
  const soundInput = document.getElementById('soundInput');
  const amountLabel = document.getElementById('receivedAmount');
  const particleField = document.getElementById('particleField');
  for (let i = 0; i < 72; i++) {
    const particle = document.createElement('i');
    const spread = ((i * 47) % 100) / 100;
    particle.style.setProperty('--x', `${12 + spread * 76}%`);
    particle.style.setProperty('--y', `${8 + ((i * 31) % 75)}%`);
    particle.style.setProperty('--delay', `${(i * 17) % 68}ms`);
    particle.style.setProperty('--duration', `${720 + ((i * 43) % 780)}ms`);
    particle.style.setProperty('--drift', `${-28 + ((i * 19) % 56)}px`);
    particleField.appendChild(particle);
  }
  const delayCopy = document.getElementById('delayCopy');
  const armedStatus = document.getElementById('armedStatus');
  let timer = null;
  let audioContext = null;
  let audioBuffer = null;
  let audioReady = null;
  const audioBytes = fetch('payment-chime.mp3').then(response => { if (!response.ok) throw new Error('Audio unavailable'); return response.arrayBuffer(); }).catch(() => null);
  let settings = { amount: 25, delay: 0, sound: true };

  try {
    const saved = JSON.parse(localStorage.getItem('tapToCashPrankSettings') || 'null');
    if (saved && Number.isFinite(saved.amount) && saved.amount >= .01 && saved.amount <= 2000 && [0, 3, 5, 8].includes(saved.delay) && typeof saved.sound === 'boolean') settings = saved;
  } catch (_) { /* Storage may be unavailable in private browsing. */ }

  amountInput.value = settings.amount.toFixed(2);
  delaySelect.value = String(settings.delay);
  soundInput.checked = settings.sound;

  const money = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const clearTimer = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };
  const setState = state => { app.dataset.state = state; };

  function unlockAudio() {
    if (!settings.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      audioReady ||= audioBytes.then(bytes => bytes ? audioContext.decodeAudioData(bytes.slice(0)) : null).then(buffer => { audioBuffer = buffer; return buffer; }).catch(() => null);
    } catch (_) { /* Audio support varies by browser. */ }
  }

  function ding() {
    if (!settings.sound) return;
    unlockAudio();
    const play = () => {
      if (!audioBuffer || !audioContext || audioContext.state !== 'running' || app.dataset.state !== 'success') return;
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      const gain = audioContext.createGain();
      gain.gain.value = .9;
      source.connect(gain); gain.connect(audioContext.destination);
      source.start();
    };
    if (audioBuffer) play();
    else audioReady?.then(play);
  }

  function succeed() {
    if (app.dataset.state !== 'armed') return;
    clearTimer(); amountLabel.textContent = money(settings.amount);
    setState('success'); ding();
    if (navigator.vibrate) navigator.vibrate([30, 45, 60]);
  }
  function reset() { clearTimer(); setState('ready'); }
  function start() {
    clearTimer(); unlockAudio();
    delayCopy.textContent = settings.delay ? ` — it will also play in ${settings.delay} seconds.` : '.';
    armedStatus.textContent = settings.delay ? `Playing in ${settings.delay} seconds · or tap now` : 'Waiting for your tap';
    setState('armed');
    if (settings.delay) timer = setTimeout(succeed, settings.delay * 1000);
  }
  function openSettings() {
    if (typeof settingsDialog.showModal === 'function') settingsDialog.showModal();
    else settingsDialog.setAttribute('open', '');
  }
  document.getElementById('startButton').addEventListener('click', start);
  document.getElementById('tapOverlay').addEventListener('click', succeed);
  document.getElementById('tapOverlay').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); succeed(); } });
  document.getElementById('doneButton').addEventListener('click', reset);
  document.getElementById('resetButton').addEventListener('click', reset);
  document.getElementById('cancelButton').addEventListener('click', reset);
  document.getElementById('settingsButton').addEventListener('click', openSettings);
  document.getElementById('fullscreenButton').addEventListener('click', async () => {
    if (document.fullscreenElement || window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) { settingsDialog.close(); return; }
    if (document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); settingsDialog.close(); return; } catch (_) { /* iOS Safari does not expose this API. */ }
    }
    settingsDialog.close(); fullscreenHelp.showModal();
  });
  document.getElementById('helpDoneButton').addEventListener('click', () => fullscreenHelp.close());
  form.addEventListener('submit', event => {
    if (event.submitter?.value !== 'save') return;
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount < .01 || amount > 2000) { event.preventDefault(); amountInput.reportValidity(); return; }
    settings = { amount: Math.round(amount * 100) / 100, delay: Number(delaySelect.value), sound: soundInput.checked };
    amountInput.value = settings.amount.toFixed(2);
    try { localStorage.setItem('tapToCashPrankSettings', JSON.stringify(settings)); } catch (_) { /* Optional persistence. */ }
  });
  document.addEventListener('keydown', event => {
    if (settingsDialog.open || fullscreenHelp.open) return;
    if (event.key === 'Escape') reset();
    if (event.code === 'Space' && app.dataset.state === 'armed' && event.target !== document.getElementById('tapOverlay')) { event.preventDefault(); succeed(); }
  });
})();
