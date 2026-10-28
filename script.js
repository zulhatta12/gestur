/**
 * GestureBio - Finger Gesture Self-Introduction Logic
 * Powered by Google MediaPipe Hands
 * Ready for Vercel Deployment (100% Client-side)
 */

(() => {
  'use strict';

  // --- Profile Storage & Defaults ---
  const STORAGE_KEY = 'gesturebio_profile_data';
  const DEFAULT_PROFILE = {
    name: "M dzul hatta syukur",
    role: "Web Developer & AI Enthusiast",
    education: "Mahasiswa Teknik Informatika • Jakarta",
    skills: "JavaScript, Python, OpenCV, MediaPipe, HTML/CSS",
    hobbies: "Eksplorasi AI, Ngoding Kreatif, Gaming",
    greeting: "Halo semuanya! Senang bisa berkenalan dengan kalian semua.",
    contact: "Instagram: @fikripradipa | GitHub: fikripradipa"
  };

  let profile = loadProfile();

  function loadProfile() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("Gagal memuat profile dari localStorage:", e);
    }
    return { ...DEFAULT_PROFILE };
  }

  function saveProfile(newProfile) {
    profile = { ...newProfile };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage:", e);
    }
  }

  // --- DOM Elements ---
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('output_canvas');
  const canvasCtx = canvasElement.getContext('2d');
  const videoContainer = document.getElementById('videoContainer');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const cameraStatusBadge = document.getElementById('cameraStatusBadge');
  const cameraStatusText = document.getElementById('cameraStatusText');

  // HUD Elements
  const hudGestureName = document.getElementById('hudGestureName');
  const hudStatus = document.getElementById('hudStatus');
  const hudFps = document.getElementById('hudFps');
  const hudCount = document.getElementById('hudCount');
  const hudHandedness = document.getElementById('hudHandedness');
  const fingerPills = {
    thumb: document.querySelector('.finger-pill[data-finger="thumb"]'),
    index: document.querySelector('.finger-pill[data-finger="index"]'),
    middle: document.querySelector('.finger-pill[data-finger="middle"]'),
    ring: document.querySelector('.finger-pill[data-finger="ring"]'),
    pinky: document.querySelector('.finger-pill[data-finger="pinky"]')
  };

  // Card Elements
  const activeIntroCard = document.getElementById('activeIntroCard');
  const cardGestureIcon = document.getElementById('cardGestureIcon');
  const cardCategory = document.getElementById('cardCategory');
  const cardTitle = document.getElementById('cardTitle');
  const cardDesc = document.getElementById('cardDesc');
  const cardTags = document.getElementById('cardTags');

  // Controls & Modals
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const mirrorToggleBtn = document.getElementById('mirrorToggleBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const guideToggleBtn = document.getElementById('guideToggleBtn');
  const closeGuideBtn = document.getElementById('closeGuideBtn');
  const sidebarGuide = document.getElementById('sidebarGuide');
  const btnCapture = document.getElementById('btnCapture');
  const btnToggleHudStyle = document.getElementById('btnToggleHudStyle');
  const btnTrySimulation = document.getElementById('btnTrySimulation');

  const editProfileModal = document.getElementById('editProfileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const profileForm = document.getElementById('profileForm');
  const btnResetDefault = document.getElementById('btnResetDefault');

  const snapshotModal = document.getElementById('snapshotModal');
  const closeSnapshotModal = document.getElementById('closeSnapshotModal');
  const snapshotImg = document.getElementById('snapshotImg');
  const downloadSnapshotBtn = document.getElementById('downloadSnapshotBtn');

  // Form Inputs
  const inputName = document.getElementById('inputName');
  const inputRole = document.getElementById('inputRole');
  const inputEducation = document.getElementById('inputEducation');
  const inputSkills = document.getElementById('inputSkills');
  const inputHobbies = document.getElementById('inputHobbies');
  const inputGreeting = document.getElementById('inputGreeting');
  const inputContact = document.getElementById('inputContact');

  // --- Runtime State ---
  let isVoiceEnabled = true;
  let isMirrored = true;
  let totalDetections = 0;
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let currentFps = 0;
  let hudStyleMode = 'opencv'; // 'opencv' or 'clean'

  let activeGestureKey = null;
  let candidateGestureKey = null;
  let candidateCounter = 0;
  const STABILITY_THRESHOLD = 4; // Frames needed to stabilize gesture

  let cameraInstance = null;
  let handsModel = null;
  let isSimulationActive = false;

  // Set default mirror class
  videoContainer.classList.toggle('mirrored', isMirrored);

  // --- Gesture Definitions Map ---
  const GESTURE_DATA = {
    rock_love: {
      name: "I Love You / Rock",
      category: "Identitas Utama",
      icon: "🤟",
      getTitle: () => profile.name,
      getDesc: () => `${profile.role}. Selamat datang di website perkenalan interaktif saya!`,
      getTags: () => ["#Identitas", "#Perkenalan", "#WebDev"],
      speech: () => `Halo! Nama saya ${profile.name}, ${profile.role}.`
    },
    pointing: {
      name: "Satu Jari (Telunjuk)",
      category: "Pendidikan & Asal",
      icon: "☝️",
      getTitle: () => "Pendidikan & Asal",
      getDesc: () => profile.education,
      getTags: () => ["#Education", "#Origin", "#Informatika"],
      speech: () => `Latar belakang saya: ${profile.education}`
    },
    peace: {
      name: "Peace (Dua Jari)",
      category: "Keahlian & Tech Stack",
      icon: "✌️",
      getTitle: () => "Skill & Kemampuan",
      getDesc: () => `Teknologi yang dikuasai: ${profile.skills}`,
      getTags: () => profile.skills.split(',').map(s => `#${s.trim()}`).slice(0, 4),
      speech: () => `Keahlian dan teknologi saya adalah ${profile.skills}`
    },
    thumbs_up: {
      name: "Thumbs Up (Jempol)",
      category: "Hobi & Minat",
      icon: "👍",
      getTitle: () => "Hobi & Passion",
      getDesc: () => profile.hobbies,
      getTags: () => ["#Hobby", "#Passion", "#Interests"],
      speech: () => `Di waktu luang, hobi saya adalah ${profile.hobbies}`
    },
    open_palm: {
      name: "Telapak Terbuka (5 Jari)",
      category: "Salam Sambutan",
      icon: "🖐️",
      getTitle: () => "Salam Kenal!",
      getDesc: () => profile.greeting,
      getTags: () => ["#Greeting", "#Welcome", "#Hello"],
      speech: () => profile.greeting
    },
    ok_sign: {
      name: "OK / Pinch Sign",
      category: "Kontak & Medsos",
      icon: "👌",
      getTitle: () => "Mari Terhubung",
      getDesc: () => profile.contact,
      getTags: () => ["#Connect", "#SocialMedia", "#Contact"],
      speech: () => `Silakan terhubung dengan saya melalui ${profile.contact}`
    },
    fist: {
      name: "Kepalan Tangan (Fist)",
      category: "Status Siaga",
      icon: "✊",
      getTitle: () => "Status: Siap (Ready)",
      getDesc: () => "Tunjukkan salah satu gerakan jari di depan kamera untuk melihat bagian perkenalan diri.",
      getTags: () => ["#Standby", "#WaitingGesture"],
      speech: () => "Mode siaga. Silakan buat gerakan jari."
    }
  };

  // --- Voice / Speech Synthesis ---
  function speak(text) {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      // Look for Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
      if (idVoice) utterance.voice = idVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  // --- Update Profile Display Card ---
  function updateCardDisplay(gestureKey) {
    const data = GESTURE_DATA[gestureKey];
    if (!data) return;

    cardGestureIcon.textContent = data.icon;
    cardCategory.textContent = data.category;
    cardTitle.textContent = data.getTitle();
    cardDesc.textContent = data.getDesc();

    // Rebuild tags
    cardTags.innerHTML = '';
    const tags = data.getTags();
    tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      cardTags.appendChild(span);
    });

    // Re-trigger animation
    activeIntroCard.style.animation = 'none';
    activeIntroCard.offsetHeight; // force reflow
    activeIntroCard.style.animation = 'cardSlideUp 0.35s ease-out';

    // Highlight active item in sidebar
    document.querySelectorAll('.gesture-item').forEach(item => {
      item.classList.toggle('active', item.dataset.gestureKey === gestureKey);
    });

    // Speak announcement
    speak(data.speech());
  }

  // --- Finger Extension Detection Logic ---
  // Calculates whether fingers are extended relative to joints & wrist
  function analyzeFingers(landmarks, handedness) {
    // 21 Landmark points
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const indexMCP = landmarks[5];

    const middleTip = landmarks[12];
    const middlePIP = landmarks[10];
    const middleMCP = landmarks[9];

    const ringTip = landmarks[16];
    const ringPIP = landmarks[14];
    const ringMCP = landmarks[13];

    const pinkyTip = landmarks[20];
    const pinkyPIP = landmarks[18];
    const pinkyMCP = landmarks[17];

    function dist(p1, p2) {
      return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    // Index, Middle, Ring, Pinky: Tip higher than PIP (y coordinate is smaller) or distance from wrist is large
    const isIndexExtended = (indexTip.y < indexPIP.y) && (dist(wrist, indexTip) > dist(wrist, indexPIP) * 1.15);
    const isMiddleExtended = (middleTip.y < middlePIP.y) && (dist(wrist, middleTip) > dist(wrist, middlePIP) * 1.15);
    const isRingExtended = (ringTip.y < ringPIP.y) && (dist(wrist, ringTip) > dist(wrist, ringPIP) * 1.15);
    const isPinkyExtended = (pinkyTip.y < pinkyPIP.y) && (dist(wrist, pinkyTip) > dist(wrist, pinkyPIP) * 1.15);

    // Thumb extension: distance from index MCP and wrist
    const isThumbExtended = dist(thumbTip, indexMCP) > 0.15 && dist(wrist, thumbTip) > dist(wrist, thumbIP) * 1.1;

    // Pinch / OK sign: Thumb tip very close to Index tip
    const isPinch = dist(thumbTip, indexTip) < 0.07;

    return {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended,
      isPinch: isPinch,
      thumbTip, indexTip, middleTip, ringTip, pinkyTip, wrist
    };
  }

  // --- Determine Gesture Key ---
  function classifyGesture(f) {
    const { thumb, index, middle, ring, pinky, isPinch } = f;

    // 1. OK / Pinch Sign (Thumb & Index touch, middle + ring + pinky open)
    if (isPinch && middle && pinky) {
      return 'ok_sign';
    }

    // 2. I Love You / Rock Sign (Thumb + Index + Pinky UP, Middle & Ring DOWN) -> Exact match to user photo!
    if (index && pinky && !middle && !ring) {
      // Both thumb out or rock sign
      return 'rock_love';
    }

    // 3. Peace / Victory (Index + Middle UP, others down)
    if (index && middle && !ring && !pinky && !thumb) {
      return 'peace';
    }
    if (index && middle && !ring && !pinky) {
      return 'peace';
    }

    // 4. Pointing (Only Index UP)
    if (index && !middle && !ring && !pinky) {
      return 'pointing';
    }

    // 5. Thumbs Up (Thumb UP, all others DOWN)
    if (thumb && !index && !middle && !ring && !pinky) {
      return 'thumbs_up';
    }

    // 6. Open Palm (All 5 UP)
    if (thumb && index && middle && ring && pinky) {
      return 'open_palm';
    }

    // 7. Fist (All fingers DOWN)
    if (!index && !middle && !ring && !pinky) {
      return 'fist';
    }

    // Fallback: Check finger count if combinations slightly vary
    const count = (thumb?1:0) + (index?1:0) + (middle?1:0) + (ring?1:0) + (pinky?1:0);
    if (count === 1 && index) return 'pointing';
    if (count === 2 && index && middle) return 'peace';
    if (count === 5) return 'open_palm';
    if (count === 0) return 'fist';

    return null;
  }

  // --- Custom Skeleton Drawing (Mirip Foto Pengguna) ---
  function drawCustomSkeleton(landmarks, ctx, width, height) {
    if (!landmarks || landmarks.length === 0) return;

    // Hand connections defined in MediaPipe Hands
    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                               // Palm base
    ];

    // Draw connection lines (Clean crisp white / subtle glow)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    });

    // Draw landmark joint dots (Crimson Red with white inner core, matching photo)
    landmarks.forEach((p, index) => {
      const x = p.x * width;
      const y = p.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(index);
      const radius = isTip ? 6.5 : 5;

      // Outer Red Glow Dot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff2a5f";
      ctx.shadowColor = "#ff2a5f";
      ctx.shadowBlur = 10;
      ctx.fill();

      // Inner White Center
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.45, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
      ctx.fill();
    });

    ctx.shadowBlur = 0; // Reset shadow
  }

  // --- Main MediaPipe Results Handler ---
  function onResults(results) {
    // Hide initial loader
    loadingOverlay.classList.add('hidden');
    cameraStatusBadge.classList.add('active');
    cameraStatusText.textContent = "Kamera Aktif & AI Siap";

    // Update FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFrameTime >= 1000) {
      currentFps = Math.round((frameCount * 1000) / (now - lastFrameTime));
      hudFps.textContent = currentFps;
      frameCount = 0;
      lastFrameTime = now;
    }

    const width = canvasElement.width;
    const height = canvasElement.height;

    // Draw original video frame to canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(results.image, 0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      totalDetections++;
      hudCount.textContent = totalDetections;

      const landmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness && results.multiHandedness[0] 
        ? results.multiHandedness[0].label 
        : 'Tangan';

      hudHandedness.textContent = handedness === 'Left' ? 'Kiri' : 'Kanan';

      // Draw futuristic skeleton lines and red dots
      drawCustomSkeleton(landmarks, canvasCtx, width, height);

      // Analyze finger states
      const fingers = analyzeFingers(landmarks, handedness);

      // Update HUD finger pills
      fingerPills.thumb.classList.toggle('active', fingers.thumb);
      fingerPills.index.classList.toggle('active', fingers.index);
      fingerPills.middle.classList.toggle('active', fingers.middle);
      fingerPills.ring.classList.toggle('active', fingers.ring);
      fingerPills.pinky.classList.toggle('active', fingers.pinky);

      // Classify Gesture
      const detectedKey = classifyGesture(fingers);

      if (detectedKey) {
        hudStatus.textContent = "Tracking";
        hudStatus.style.color = "#34d399";

        // Stabilization filter
        if (detectedKey === candidateGestureKey) {
          candidateCounter++;
          if (candidateCounter >= STABILITY_THRESHOLD && detectedKey !== activeGestureKey) {
            activeGestureKey = detectedKey;
            hudGestureName.textContent = GESTURE_DATA[activeGestureKey].getTitle();
            updateCardDisplay(activeGestureKey);
          }
        } else {
          candidateGestureKey = detectedKey;
          candidateCounter = 1;
        }
      } else {
        hudStatus.textContent = "Searching Gesture...";
        hudStatus.style.color = "#fbbf24";
      }

    } else {
      // No hands in frame
      hudStatus.textContent = "Ready (Tunjukkan Tangan)";
      hudStatus.style.color = "#94a3b8";
      hudHandedness.textContent = "-";
      
      // Reset finger pills
      Object.values(fingerPills).forEach(pill => pill.classList.remove('active'));
    }

    canvasCtx.restore();
  }

  // --- Initialize Camera and MediaPipe Hands ---
  async function initCamera() {
    try {
      handsModel = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      handsModel.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
      });

      handsModel.onResults(onResults);

      // Setup Camera Utility
      cameraInstance = new Camera(videoElement, {
        onFrame: async () => {
          if (!isSimulationActive) {
            await handsModel.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720
      });

      // Match canvas internal resolution to video stream
      videoElement.addEventListener('loadedmetadata', () => {
        canvasElement.width = videoElement.videoWidth || 1280;
        canvasElement.height = videoElement.videoHeight || 720;
      });

      await cameraInstance.start();
    } catch (err) {
      console.error("Camera init error:", err);
      cameraStatusText.textContent = "Akses Kamera Terhalang";
      cameraStatusBadge.classList.remove('active');
      loadingOverlay.innerHTML = `
        <div class="loader-content">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #f43f5e; margin-bottom: 12px;"></i>
          <h3>Kamera Belum Diizinkan</h3>
          <p style="margin-bottom: 16px;">Mohon izinkan akses webcam pada browser atau coba jalankan Mode Simulasi di bawah ini:</p>
          <button class="btn btn-primary" id="btnFallbackSim">
            <i class="fa-solid fa-play"></i> Mulai Mode Simulasi Interaktif
          </button>
        </div>
      `;
      document.getElementById('btnFallbackSim')?.addEventListener('click', startSimulationMode);
    }
  }

  // --- Simulation Fallback Mode (Jika kamera mati / izin ditolak) ---
  function startSimulationMode() {
    isSimulationActive = true;
    loadingOverlay.classList.add('hidden');
    cameraStatusBadge.classList.add('active');
    cameraStatusText.textContent = "Mode Simulasi Aktif";
    
    // Draw synthetic animated background
    canvasElement.width = 1280;
    canvasElement.height = 720;

    let simAngle = 0;
    function renderSimulation() {
      if (!isSimulationActive) return;
      simAngle += 0.02;

      canvasCtx.fillStyle = '#060a12';
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

      // Grid effect
      canvasCtx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
      canvasCtx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvasElement.width; x += step) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, 0);
        canvasCtx.lineTo(x, canvasElement.height);
        canvasCtx.stroke();
      }
      for (let y = 0; y < canvasElement.height; y += step) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, y);
        canvasCtx.lineTo(canvasElement.width, y);
        canvasCtx.stroke();
      }

      // Animated glowing pulse
      const cx = canvasElement.width / 2;
      const cy = canvasElement.height / 2;
      const grad = canvasCtx.createRadialGradient(cx, cy, 20, cx, cy, 300);
      grad.addColorStop(0, 'rgba(0, 255, 136, 0.15)');
      grad.addColorStop(1, 'transparent');
      canvasCtx.fillStyle = grad;
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

      // Text note
      canvasCtx.fillStyle = '#38bdf8';
      canvasCtx.font = '22px "Outfit", sans-serif';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText("Mode Simulasi: Klik salah satu kartu gestur di sidebar kanan untuk mencoba!", cx, cy - 40);

      requestAnimationFrame(renderSimulation);
    }
    renderSimulation();

    // Default trigger
    updateCardDisplay('rock_love');
    hudGestureName.textContent = GESTURE_DATA['rock_love'].getTitle();
  }

  btnTrySimulation?.addEventListener('click', startSimulationMode);

  // --- Snapshot / Capture Feature ---
  btnCapture.addEventListener('click', () => {
    // Combine canvas with a watermark branding
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasElement.width;
    tempCanvas.height = canvasElement.height;
    const tCtx = tempCanvas.getContext('2d');

    // Draw main frame
    tCtx.drawImage(canvasElement, 0, 0);

    // Add Watermark Overlay
    tCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    tCtx.fillRect(30, tempCanvas.height - 110, 480, 80);
    tCtx.strokeStyle = '#00ff88';
    tCtx.lineWidth = 2;
    tCtx.strokeRect(30, tempCanvas.height - 110, 480, 80);

    tCtx.fillStyle = '#00ff88';
    tCtx.font = 'bold 24px "Outfit", sans-serif';
    tCtx.fillText(`GestureBio • ${profile.name}`, 50, tempCanvas.height - 65);

    tCtx.fillStyle = '#e2e8f0';
    tCtx.font = '16px "Outfit", sans-serif';
    tCtx.fillText(profile.role, 50, tempCanvas.height - 40);

    const dataUrl = tempCanvas.toDataURL('image/png');
    snapshotImg.src = dataUrl;
    downloadSnapshotBtn.href = dataUrl;
    snapshotModal.classList.add('open');
  });

  closeSnapshotModal.addEventListener('click', () => {
    snapshotModal.classList.remove('open');
  });

  // --- Profile Customization Modal Handlers ---
  function openProfileEditor() {
    inputName.value = profile.name || '';
    inputRole.value = profile.role || '';
    inputEducation.value = profile.education || '';
    inputSkills.value = profile.skills || '';
    inputHobbies.value = profile.hobbies || '';
    inputGreeting.value = profile.greeting || '';
    inputContact.value = profile.contact || '';
    editProfileModal.classList.add('open');
  }

  function closeProfileEditor() {
    editProfileModal.classList.remove('open');
  }

  editProfileBtn.addEventListener('click', openProfileEditor);
  closeProfileModal.addEventListener('click', closeProfileEditor);

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      name: inputName.value.trim() || DEFAULT_PROFILE.name,
      role: inputRole.value.trim() || DEFAULT_PROFILE.role,
      education: inputEducation.value.trim() || DEFAULT_PROFILE.education,
      skills: inputSkills.value.trim() || DEFAULT_PROFILE.skills,
      hobbies: inputHobbies.value.trim() || DEFAULT_PROFILE.hobbies,
      greeting: inputGreeting.value.trim() || DEFAULT_PROFILE.greeting,
      contact: inputContact.value.trim() || DEFAULT_PROFILE.contact
    };
    saveProfile(updated);
    closeProfileEditor();

    // Refresh current card
    if (activeGestureKey) {
      updateCardDisplay(activeGestureKey);
      hudGestureName.textContent = GESTURE_DATA[activeGestureKey].getTitle();
    }
  });

  btnResetDefault.addEventListener('click', () => {
    if (confirm("Kembalikan seluruh biodata ke profil default?")) {
      saveProfile(DEFAULT_PROFILE);
      openProfileEditor();
      if (activeGestureKey) updateCardDisplay(activeGestureKey);
    }
  });

  // --- Sidebar Guide Item Click (Interactive test trigger) ---
  document.querySelectorAll('.gesture-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.gestureKey;
      activeGestureKey = key;
      hudGestureName.textContent = GESTURE_DATA[key].getTitle();
      hudStatus.textContent = "Manual Selected";
      updateCardDisplay(key);
    });
  });

  // --- Other Toolbar Buttons ---
  soundToggleBtn.addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;
    soundToggleBtn.classList.toggle('active', isVoiceEnabled);
    soundToggleBtn.innerHTML = isVoiceEnabled 
      ? '<i class="fa-solid fa-volume-high"></i><span class="tooltip">Voice: ON</span>' 
      : '<i class="fa-solid fa-volume-xmark"></i><span class="tooltip">Voice: OFF</span>';
    
    if (!isVoiceEnabled && ('speechSynthesis' in window)) {
      window.speechSynthesis.cancel();
    }
  });
  soundToggleBtn.classList.add('active'); // Voice ON by default

  mirrorToggleBtn.addEventListener('click', () => {
    isMirrored = !isMirrored;
    videoContainer.classList.toggle('mirrored', isMirrored);
    mirrorToggleBtn.classList.toggle('active', isMirrored);
  });
  mirrorToggleBtn.classList.add('active'); // Mirror ON by default

  guideToggleBtn.addEventListener('click', () => {
    sidebarGuide.classList.toggle('open');
  });

  closeGuideBtn.addEventListener('click', () => {
    sidebarGuide.classList.remove('open');
  });

  btnToggleHudStyle.addEventListener('click', () => {
    const hud = document.getElementById('opencvHud');
    if (hudStyleMode === 'opencv') {
      hudStyleMode = 'minimal';
      hud.style.opacity = '0.35';
    } else {
      hudStyleMode = 'opencv';
      hud.style.opacity = '1';
    }
  });

  // Close modals on clicking backdrop
  [editProfileModal, snapshotModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      editProfileModal.classList.remove('open');
      snapshotModal.classList.remove('open');
      sidebarGuide.classList.remove('open');
    }
  });

  // Kickoff Default Display & Camera
  updateCardDisplay('rock_love');
  hudGestureName.textContent = GESTURE_DATA['rock_love'].getTitle();

  // Initialize camera when page is ready
  window.addEventListener('DOMContentLoaded', () => {
    initCamera();
  });

})();
