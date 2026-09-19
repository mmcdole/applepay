(() => {
  'use strict';
  const app = document.getElementById('app');
  const settingsDialog = document.getElementById('settingsDialog');
  const form = document.getElementById('settingsForm');
  const amountInput = document.getElementById('amountInput');
  const delaySelect = document.getElementById('delaySelect');
  const soundInput = document.getElementById('soundInput');
  const amountLabel = document.getElementById('receivedAmount');
  const delayCopy = document.getElementById('delayCopy');
  const armedStatus = document.getElementById('armedStatus');
  let timer = null;
  let audioContext = null;
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
    } catch (_) { /* A missing audio API should not stop the animation. */ }
  }

  function ding() {
    if (!settings.sound || !audioContext || audioContext.state !== 'running') return;
    const now = audioContext.currentTime;
    const notes = [
      { freq: 880, start: 0, duration: .48, volume: .15 },
      { freq: 1318.51, start: .1, duration: .55, volume: .12 },
      { freq: 1760, start: .1, duration: .38, volume: .04 }
    ];
    notes.forEach(({ freq, start, duration, volume }) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(.001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + .015);
      gain.gain.exponentialRampToValueAtTime(.001, now + start + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(now + start); oscillator.stop(now + start + duration + .01);
    });
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
  document.getElementById('readySettingsButton').addEventListener('click', openSettings);
  form.addEventListener('submit', event => {
    if (event.submitter?.value !== 'save') return;
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount < .01 || amount > 2000) { event.preventDefault(); amountInput.reportValidity(); return; }
    settings = { amount: Math.round(amount * 100) / 100, delay: Number(delaySelect.value), sound: soundInput.checked };
    amountInput.value = settings.amount.toFixed(2);
    try { localStorage.setItem('tapToCashPrankSettings', JSON.stringify(settings)); } catch (_) { /* Optional persistence. */ }
  });
  document.addEventListener('keydown', event => {
    if (settingsDialog.open) return;
    if (event.key === 'Escape') reset();
    if (event.code === 'Space' && app.dataset.state === 'armed' && event.target !== document.getElementById('tapOverlay')) { event.preventDefault(); succeed(); }
  });
})();
