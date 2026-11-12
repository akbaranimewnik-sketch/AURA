// ========================================================
// AURA — NEUMORPHIC HUB INTERACTIVE SCRIPT
// Features: Theme Switch, Web Audio Synthesis, Rotary Dial,
// Pomodoro Timer, Dynamic Sliders & Device Controls
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------
  // 1. THEME TOGGLE (LIGHT / DARK NEUMORPHISM)
  // --------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const htmlRoot = document.documentElement;

  // Restore saved theme or default
  const savedTheme = localStorage.getItem('aura-theme') || 'light';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlRoot.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  });

  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('aura-theme', theme);
    if (theme === 'dark') {
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    } else {
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    }
  }


  // --------------------------------------------------------
  // 2. WEB AUDIO SYNTHESIZER & AMBIENT PLAYER
  // --------------------------------------------------------
  let audioCtx = null;
  let isPlaying = false;
  let currentSoundType = 'rain';
  let ambientNoiseNode = null;
  let synthInterval = null;
  let gainNode = null;

  const vinylDisc = document.getElementById('vinylDisc');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const soundChips = document.querySelectorAll('.sound-chip');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeVal = document.getElementById('volumeVal');
  const muteBtn = document.getElementById('muteBtn');
  const progressTrack = document.getElementById('progressTrack');
  const progressFill = document.getElementById('progressFill');
  const progressThumb = document.getElementById('progressThumb');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');

  let currentTrackIndex = 0;
  const playlist = [
    { title: "Lofi Neon Reverie", artist: "Aura Ambient Soundlab", duration: 225 },
    { title: "Velvet Midnight Echoes", artist: "Neumorph Beats", duration: 198 },
    { title: "Tokyo Rain Reflections", artist: "Chillwave Studio", duration: 242 },
  ];

  let currentSeconds = 84;
  let playbackTimer = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = volumeSlider.value / 100 * 0.2;
      gainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startAmbientAudio() {
    initAudioContext();
    stopAmbientAudio();

    if (currentSoundType === 'rain') {
      // Pink/White Noise for rain
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to create warm rain sound
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      whiteNoise.start(0);
      ambientNoiseNode = whiteNoise;

    } else if (currentSoundType === 'breeze') {
      // Soft wind swell
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.2;
      }

      const pinkNoise = audioCtx.createBufferSource();
      pinkNoise.buffer = noiseBuffer;
      pinkNoise.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 450;
      filter.Q.value = 1.2;

      pinkNoise.connect(filter);
      filter.connect(gainNode);
      pinkNoise.start(0);
      ambientNoiseNode = pinkNoise;

    } else if (currentSoundType === 'lofi') {
      // Chill pentatonic chord arpeggios
      const notes = [261.63, 329.63, 392.00, 493.88, 523.25]; // C major 7th / chill
      let noteIdx = 0;

      synthInterval = setInterval(() => {
        if (!isPlaying) return;
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[noteIdx % notes.length];
        noteIdx++;

        noteGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

        osc.connect(noteGain);
        noteGain.connect(gainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      }, 700);
    }
  }

  function stopAmbientAudio() {
    if (ambientNoiseNode) {
      try { ambientNoiseNode.stop(); } catch(e){}
      ambientNoiseNode = null;
    }
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      vinylDisc.classList.add('playing');
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      startAmbientAudio();
      startProgressTimer();
    } else {
      vinylDisc.classList.remove('playing');
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      stopAmbientAudio();
      clearInterval(playbackTimer);
    }
  }

  playBtn.addEventListener('click', togglePlay);

  function startProgressTimer() {
    clearInterval(playbackTimer);
    playbackTimer = setInterval(() => {
      const activeTrack = playlist[currentTrackIndex];
      currentSeconds++;
      if (currentSeconds > activeTrack.duration) {
        currentSeconds = 0;
        switchTrack(1);
      }
      updateProgressBar();
    }, 1000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateProgressBar() {
    const activeTrack = playlist[currentTrackIndex];
    currentTimeEl.textContent = formatTime(currentSeconds);
    totalTimeEl.textContent = formatTime(activeTrack.duration);
    const pct = (currentSeconds / activeTrack.duration) * 100;
    progressFill.style.width = `${pct}%`;
    progressThumb.style.left = `${pct}%`;
  }

  function switchTrack(direction) {
    currentTrackIndex = (currentTrackIndex + direction + playlist.length) % playlist.length;
    const track = playlist[currentTrackIndex];
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    currentSeconds = 0;
    updateProgressBar();
    if (isPlaying) {
      startAmbientAudio();
    }
  }

  document.getElementById('nextTrackBtn').addEventListener('click', () => switchTrack(1));
  document.getElementById('prevTrackBtn').addEventListener('click', () => switchTrack(-1));

  // Sound chip selector
  soundChips.forEach(chip => {
    chip.addEventListener('click', () => {
      soundChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentSoundType = chip.getAttribute('data-sound');
      if (isPlaying) {
        startAmbientAudio();
      }
    });
  });

  // Progress bar click to seek
  progressTrack.addEventListener('click', (e) => {
    const rect = progressTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const activeTrack = playlist[currentTrackIndex];
    currentSeconds = Math.floor(pct * activeTrack.duration);
    updateProgressBar();
  });

  // Volume slider
  volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    volumeVal.textContent = `${val}%`;
    if (gainNode) {
      gainNode.gain.value = (val / 100) * 0.25;
    }
  });

  // Mute button
  let prevVol = 70;
  muteBtn.addEventListener('click', () => {
    if (volumeSlider.value > 0) {
      prevVol = volumeSlider.value;
      volumeSlider.value = 0;
    } else {
      volumeSlider.value = prevVol;
    }
    volumeSlider.dispatchEvent(new Event('input'));
  });

  updateProgressBar();


  // --------------------------------------------------------
  // 3. SMART CLIMATE & ROTARY DIAL
  // --------------------------------------------------------
  let temperature = 22.5;
  const tempDisplay = document.getElementById('tempDisplay');
  const tempDownBtn = document.getElementById('tempDownBtn');
  const tempUpBtn = document.getElementById('tempUpBtn');
  const dialKnob = document.getElementById('dialKnob');
  const dialModeButtons = document.querySelectorAll('.neu-segment');
  const lightSlider = document.getElementById('lightSlider');
  const lightLevelText = document.getElementById('lightLevelText');
  const humidityVal = document.getElementById('humidityVal');

  function updateTemp(newTemp) {
    temperature = Math.max(16, Math.min(32, Math.round(newTemp * 10) / 10));
    tempDisplay.innerHTML = `${temperature.toFixed(1)}<span class="deg">°C</span>`;

    // Rotate dial knob indicator
    // 16°C is -90deg, 32°C is 90deg (range 16°C -> 180deg)
    const deg = ((temperature - 16) / (32 - 16)) * 180 - 90;
    dialKnob.style.transform = `rotate(${deg}deg)`;

    // Slight dynamic humidity reaction
    const hum = Math.round(55 - (temperature - 20) * 1.5);
    humidityVal.textContent = `${hum}%`;
  }

  tempDownBtn.addEventListener('click', () => updateTemp(temperature - 0.5));
  tempUpBtn.addEventListener('click', () => updateTemp(temperature + 0.5));

  // Climate Modes (Cool, Heat, Breeze, Eco)
  dialModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dialModeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      if (mode === 'cool') updateTemp(20.0);
      else if (mode === 'heat') updateTemp(25.5);
      else if (mode === 'breeze') updateTemp(22.0);
      else if (mode === 'eco') updateTemp(23.5);
    });
  });

  // Light Dimmer Slider
  lightSlider.addEventListener('input', (e) => {
    lightLevelText.textContent = `${e.target.value}%`;
  });

  updateTemp(temperature);


  // --------------------------------------------------------
  // 4. POMODORO FOCUS TIMER
  // --------------------------------------------------------
  let timerSeconds = 25 * 60;
  let timerRunning = false;
  let pomodoroInterval = null;

  const timerDigits = document.getElementById('timerDigits');
  const startTimerBtn = document.getElementById('startTimerBtn');
  const timerBtnText = document.getElementById('timerBtnText');
  const resetTimerBtn = document.getElementById('resetTimerBtn');

  function updateTimerDisplay() {
    const m = Math.floor(timerSeconds / 60);
    const s = Math.floor(timerSeconds % 60);
    timerDigits.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  startTimerBtn.addEventListener('click', () => {
    timerRunning = !timerRunning;
    if (timerRunning) {
      timerBtnText.textContent = "Pauza";
      startTimerBtn.classList.add('active');
      pomodoroInterval = setInterval(() => {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(pomodoroInterval);
          timerRunning = false;
          timerBtnText.textContent = "Boshlash";
          startTimerBtn.classList.remove('active');
          alert("🎉 Fokus vaqti tugadi! 5 daqiqa dam oling.");
          timerSeconds = 25 * 60;
          updateTimerDisplay();
        }
      }, 1000);
    } else {
      clearInterval(pomodoroInterval);
      timerBtnText.textContent = "Davom etish";
      startTimerBtn.classList.remove('active');
    }
  });

  resetTimerBtn.addEventListener('click', () => {
    clearInterval(pomodoroInterval);
    timerRunning = false;
    timerSeconds = 25 * 60;
    timerBtnText.textContent = "Boshlash";
    startTimerBtn.classList.remove('active');
    updateTimerDisplay();
  });

  updateTimerDisplay();


  // --------------------------------------------------------
  // 5. DEVICE SWITCHES & TASKS
  // --------------------------------------------------------
  const toggleWifi = document.getElementById('toggleWifi');
  const wifiState = document.getElementById('wifiState');
  toggleWifi.addEventListener('change', () => {
    wifiState.textContent = toggleWifi.checked ? "Faol • 1.2 Gb/s" : "O'chirilgan";
  });

  const togglePurifier = document.getElementById('togglePurifier');
  const purifierState = document.getElementById('purifierState');
  togglePurifier.addEventListener('change', () => {
    purifierState.textContent = togglePurifier.checked ? "Jim rejim • 24dB" : "Kutish rejimi";
  });

  const toggleDiffuser = document.getElementById('toggleDiffuser');
  const diffuserState = document.getElementById('diffuserState');
  toggleDiffuser.addEventListener('change', () => {
    diffuserState.textContent = toggleDiffuser.checked ? "Lavanda ifori • Faol" : "O'chiq";
  });

  // Task Checkboxes
  const taskCheckboxes = document.querySelectorAll('.neu-checkbox');
  const taskCount = document.getElementById('taskCount');

  function updateTaskCounter() {
    const total = taskCheckboxes.length;
    let completed = 0;
    taskCheckboxes.forEach(cb => {
      const textSpan = cb.closest('.task-item').querySelector('.task-text');
      if (cb.checked) {
        completed++;
        textSpan.classList.add('done');
      } else {
        textSpan.classList.remove('done');
      }
    });
    taskCount.textContent = `${completed}/${total}`;
  }

  taskCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateTaskCounter);
  });

  updateTaskCounter();
});

