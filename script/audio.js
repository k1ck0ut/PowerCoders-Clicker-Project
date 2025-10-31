(function () {
  function scaledVolumeFromSlider(v) {
    return 0.0001 + Math.pow(v / 100, 2) * 0.0999;
  }

  window.getSavedMusicSliderValue = function () {
    const raw = localStorage.getItem("pc:musicVol");
    if (raw === null) {
      const firstVol = 20;
      localStorage.setItem("pc:musicVol", String(firstVol));
      return firstVol;
    }
    const savedVol = parseFloat(raw);
    if (Number.isFinite(savedVol)) return savedVol;
    return 20;
  };

  window.setMusicVolumeSliderValue = function (sliderValue0to100) {
    if (!window.bgMusic) return;
    window.bgMusic.volume = scaledVolumeFromSlider(sliderValue0to100);
    localStorage.setItem("pc:musicVol", String(sliderValue0to100));
  };

  window.playBeep = function () {
    if (!window.sfxEnabled) return;
    try {
      const ctx = new window.AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const clickSounds = [
    new Audio("assets/sfx/click1.wav"),
    new Audio("assets/sfx/click2.wav"),
    new Audio("assets/sfx/click3.wav"),
    new Audio("assets/sfx/click4.wav"),
    new Audio("assets/sfx/click5.wav"),
  ];

  window.playClickSound = function () {
    if (!window.sfxEnabled) return;
    const s = clickSounds[Math.floor(Math.random() * clickSounds.length)];
    try {
      s.pause();
      s.currentTime = 0;
      s.play();
    } catch (e) {}
  };

  window.bgMusic = null;

  window.playBackgroundMusic = function () {
    if (!window.musicEnabled) return;

    if (!window.bgMusic) {
      window.bgMusic = new Audio("assets/music/cascade.mp3");
      window.bgMusic.loop = true;

      const sliderVal = window.getSavedMusicSliderValue();
      window.bgMusic.volume = scaledVolumeFromSlider(sliderVal);
    }

    try {
      window.bgMusic.play();
    } catch (e) {}
  };

  window.stopBackgroundMusic = function () {
    if (window.bgMusic) {
      window.bgMusic.pause();
      window.bgMusic.currentTime = 0;
    }
  };

  window.resumeMusicIfNeeded = function () {
    if (!window.musicEnabled) return;
    if (!window.bgMusic) return;
    if (window.bgMusic.paused) {
      try {
        window.bgMusic.play();
      } catch (e) {}
    }
  };
})();
