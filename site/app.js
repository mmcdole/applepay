(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const app = $('app');
  const sheet = $('settingsDialog');
  const help = $('fullscreenHelp');
  const canvas = $('particles');
  const ctx = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'tapToCashPrankSettings';
  let settings = { amount: 25, delay: 0, sound: true };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.amount) && saved.amount >= .01 && saved.amount <= 2000 && [0, 3, 5, 8].includes(saved.delay) && typeof saved.sound === 'boolean') settings = saved;
  } catch { /* Storage is optional. */ }

  let state = 'ready';
  let timer;
  let frame;
  let generation = 0;
  let audioContext;
  let soundBuffer;
  let decoding;
  let source;
  let previewGeneration = 0;
  let animationStart = 0;
  let particles = [];
  let width = 0;
  let height = 0;
  const audioBytes = fetch('payment-success-ios.wav').then(r => {
    if (!r.ok) throw new Error('Sound download failed');
    return r.arrayBuffer();
  }).catch(() => null);

  function setState(next) {
    state = next;
    app.dataset.state = next;
    document.querySelector('.ready-screen').hidden = next !== 'ready';
    document.querySelector('.armed-screen').hidden = next !== 'armed';
    $('receiveScreen').hidden = next !== 'receiving' && next !== 'success';
    $('settingsButton').disabled = next === 'receiving';
    $('doneButton').disabled = next !== 'success';
  }
  function stopSound() { if (source) { try { source.stop(); } catch { /* Already stopped. */ } source = null; } }
  async function prepareSound() {
    // Resume synchronously inside the user gesture before fetching or decoding.
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const resumed = audioContext.state !== 'running' ? audioContext.resume() : Promise.resolve();
    decoding ||= audioBytes.then(bytes => {
      if (!bytes) throw new Error('Sound unavailable');
      return audioContext.decodeAudioData(bytes.slice(0));
    }).then(buffer => { soundBuffer = buffer; return buffer; }).catch(error => { decoding = null; throw error; });
    await Promise.all([resumed, decoding]);
    if (audioContext.state !== 'running') throw new Error('Audio is paused');
  }
  function playSound() {
    if (!soundBuffer || audioContext?.state !== 'running') return;
    stopSound();
    source = audioContext.createBufferSource();
    source.buffer = soundBuffer;
    source.connect(audioContext.destination);
    source.start();
  }
  function reset() {
    generation++;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    stopSound();
    ctx?.clearRect(0, 0, width, height);
    $('startButton').disabled = false;
    $('startButton').textContent = 'Continue';
    setState('ready');
  }
  async function start() {
    if (state !== 'ready' || $('startButton').disabled) return;
    const run = ++generation;
    $('audioStatus').textContent = '';
    $('startButton').disabled = true;
    if (settings.sound) {
      $('startButton').textContent = 'Preparing…';
      try { await prepareSound(); }
      catch {
        if (run !== generation) return;
        $('audioStatus').textContent = 'Sound could not load. Try again, or turn sound off in Settings.';
        $('startButton').disabled = false;
        $('startButton').textContent = 'Continue';
        return;
      }
    }
    if (run !== generation) return;
    $('startButton').disabled = false;
    $('startButton').textContent = 'Continue';
    setState('armed');
    if (settings.delay) timer = setTimeout(receive, settings.delay * 1000);
  }
  const money = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);

  function createParticles() {
    if (!ctx) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const label = $('receivedAmount');
    const groupBox = label.parentElement.getBoundingClientRect();
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(width); mask.height = Math.ceil(height);
    const mc = mask.getContext('2d', { willReadFrequently: true });
    const style = getComputedStyle(label);
    mc.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    mc.letterSpacing = style.letterSpacing;
    mc.textAlign = 'center'; mc.textBaseline = 'middle';
    mc.fillText(label.textContent, width / 2, groupBox.top - bounds.top + label.offsetTop + label.offsetHeight / 2);
    const pixels = mc.getImageData(0, 0, mask.width, mask.height).data;
    particles = [];
    for (let y = 0; y < mask.height; y += 3) {
      for (let x = 0; x < mask.width; x += 3) {
        if (pixels[(y * mask.width + x) * 4 + 3] < 100) continue;
        const random = ((x * 37 + y * 71) % 997) / 997;
        particles.push({ x, y, startX: width / 2 + (random - .5) * width * .55, startY: -40 - random * 240, delay: random * 320, size: .4 + random * .65, bend: Math.sin(x + y) * 45, color: ['#c3dce3', '#e5dbcf', '#c3d1c4', '#ddd2e3'][Math.round(random * 23) % 4] });
      }
    }
  }
  function drawParticles(now) {
    const elapsed = now - animationStart;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      const t = Math.max(0, Math.min(1, (elapsed - p.delay) / 1150));
      if (!t) continue;
      const ease = 1 - Math.pow(1 - t, 3);
      const x = p.startX + (p.x - p.startX) * ease + Math.sin(t * Math.PI * 2) * p.bend * (1 - t);
      const y = p.startY + (p.y - p.startY) * ease;
      const fade = elapsed > 1100 ? Math.max(0, 1 - (elapsed - 1100) / 750) : Math.min(1, t * 5);
      ctx.globalAlpha = fade * .85;
      ctx.fillStyle = p.color;
      ctx.fillRect(x, y, p.size, p.size + (1 - t) * 3);
    }
    ctx.globalAlpha = 1;
    if (elapsed < 1900 && (state === 'receiving' || state === 'success')) frame = requestAnimationFrame(drawParticles);
    else ctx.clearRect(0, 0, width, height);
  }
  function receive() {
    if (state !== 'armed' || sheet.open || help.open) return;
    clearTimeout(timer);
    const run = generation;
    const label = $('receivedAmount');
    label.textContent = money(settings.amount);
    label.style.fontSize = '';
    setState('receiving');
    // Long amounts must remain within the phone at narrow widths.
    const maxWidth = app.clientWidth - 44;
    let fontSize = parseFloat(getComputedStyle(label).fontSize);
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `600 ${fontSize}px ${getComputedStyle(label).fontFamily}`;
    if (measure.measureText(label.textContent).width > maxWidth) {
      fontSize *= maxWidth / measure.measureText(label.textContent).width;
      label.style.fontSize = `${Math.floor(fontSize)}px`;
    }
    if (!reducedMotion.matches && ctx) {
      createParticles(); animationStart = performance.now(); frame = requestAnimationFrame(drawParticles);
    }
    timer = setTimeout(() => {
      if (run !== generation || state !== 'receiving') return;
      setState('success');
      if (settings.sound) playSound();
      navigator.vibrate?.([25, 45, 35]);
    }, reducedMotion.matches ? 180 : 1450);
  }

  const standalone = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  function syncFullscreenLabel() {
    $('fullscreenButton').querySelector('span').textContent = document.fullscreenElement ? 'Exit full screen' : standalone() ? 'Already full screen' : document.fullscreenEnabled ? 'Open full screen' : 'Add to Home Screen';
  }
  function openSettings() {
    if (state === 'receiving') return;
    clearTimeout(timer);
    if (state === 'armed') reset();
    $('amountInput').value = String(settings.amount);
    $('amountInput').style.width = `${Math.max(2, $('amountInput').value.length)}ch`;
    $('delaySelect').value = String(settings.delay);
    $('soundInput').checked = settings.sound;
    $('amountError').hidden = true;
    $('soundStatus').textContent = 'Use your phone’s media volume to adjust the sound.';
    syncFullscreenLabel();
    sheet.showModal();
    $('closeSettingsButton').focus({ preventScroll: true });
  }
  $('amountInput').addEventListener('input', () => { $('amountInput').style.width = `${Math.max(2, Math.min(10, $('amountInput').value.length))}ch`; });
  $('settingsForm').addEventListener('submit', event => {
    event.preventDefault();
    const raw = $('amountInput').value.trim();
    const amount = Number(raw);
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw) || amount < .01 || amount > 2000) {
      $('amountError').hidden = false; $('amountInput').setAttribute('aria-invalid', 'true'); $('amountInput').focus(); return;
    }
    $('amountInput').removeAttribute('aria-invalid');
    settings = { amount: Math.round(amount * 100) / 100, delay: Number($('delaySelect').value), sound: $('soundInput').checked };
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Optional persistence. */ }
    sheet.close();
  });
  $('previewSoundButton').addEventListener('click', async () => {
    const run = ++previewGeneration;
    $('soundStatus').textContent = 'Loading sound…';
    try {
      await prepareSound();
      if (run !== previewGeneration || !sheet.open) return;
      playSound(); $('soundStatus').textContent = 'Playing iOS payment sound. Adjust your media volume.';
    } catch { $('soundStatus').textContent = 'Sound could not load. Check your connection and try again.'; }
  });
  sheet.addEventListener('close', () => { previewGeneration++; stopSound(); });
  $('fullscreenButton').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); syncFullscreenLabel(); return; }
      if (standalone()) { sheet.close(); return; }
      if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen(); sheet.close(); return;
      }
    } catch { /* Offer installation instructions if fullscreen is denied. */ }
    sheet.close(); help.showModal();
  });
  $('startButton').addEventListener('click', start);
  $('triggerButton').addEventListener('click', receive);
  // The whole armed view is a touch target, except navigation and Cancel.
  document.querySelector('.armed-screen').addEventListener('click', event => { if (!event.target.closest('#cancelButton')) receive(); });
  $('cancelButton').addEventListener('click', reset);
  $('resetButton').addEventListener('click', reset);
  $('doneButton').addEventListener('click', reset);
  $('settingsButton').addEventListener('click', openSettings);
  $('closeSettingsButton').addEventListener('click', () => sheet.close());
  $('helpDoneButton').addEventListener('click', () => help.close());
  document.addEventListener('keydown', event => {
    if (sheet.open || help.open) return;
    if (event.key === 'Escape') reset();
    if (event.code === 'Space' && state === 'armed') { event.preventDefault(); receive(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state === 'armed' || state === 'receiving')) reset();
  });
})();
