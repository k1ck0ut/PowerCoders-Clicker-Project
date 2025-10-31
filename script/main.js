(function () {
  window.initGame = function () {
    applyTheme();
    applyIcons();
    applyCurrency();
    populateSettings();
    recomputeDerived();
    recalcTotals();
    render();
    closeAllPanels();
    setInterval(() => {
      if (pcps > 0) {
        pc += pcps;
        render();
        save();
      }
    }, 1000);
    renderAchievements();
    checkAchievements();
    if (window.musicEnabled) {
      playBackgroundMusic();
    }

    document.addEventListener(
      "click",
      function () {
        resumeMusicIfNeeded();
      },
      { once: true }
    );
  };

  if (document.readyState !== "loading") {
    initGame();
  } else {
    document.addEventListener("DOMContentLoaded", initGame);
  }
})();
