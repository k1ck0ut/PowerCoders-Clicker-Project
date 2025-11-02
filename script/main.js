(function () {
  window.initGame = function () {
    applyTheme();
    applyIcons();
    applyCurrency();
    populateSettings();
    recomputeDerived();
    recalcTotals();
    render();
    try {
      const last = +localStorage.getItem("pc:lastActive") || 0;
      const now = Date.now();
      const secs = Math.floor((now - last) / 1000);
      const MAX_SECS = 600;
      if (last && secs > 5) {
        const capped = Math.min(secs, MAX_SECS);
        const earn = Math.floor((pcps || 0) * capped);
        if (earn > 0) {
          const fmtTime = (s) => {
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const parts = [];
            if (h) parts.push(h + "h");
            if (m) parts.push(m + "m");
            if (!parts.length) parts.push(s + "s");
            return parts.join(" ");
          };

          const msg =
            "While you were away for " +
            fmtTime(capped) +
            ", your generators produced <b>" +
            formatCompact(earn) +
            " " +
            curr +
            "</b>.";

          if (typeof showDialog === "function") {
            showDialog({
              title: "Offline earnings",
              message: msg,
              okText: "Grab",
              cancelText: "Ignore",
              onOk: function () {
                pc += earn;
                save();
                if (typeof render === "function") render();
              },
              onCancel: function () {
                try {
                  // still update lastActive so dialog won't reappear
                  localStorage.setItem("pc:lastActive", Date.now());
                } catch (e) {}
              },
            });
          } else {
            // fallback to confirm
            const ok = confirm(
              "You were away for " +
                fmtTime(capped) +
                ". Collect " +
                formatCompact(earn) +
                " " +
                curr +
                "?"
            );
            if (ok) {
              pc += earn;
              save();
              if (typeof render === "function") render();
            } else {
              try {
                localStorage.setItem("pc:lastActive", Date.now());
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {}
    closeAllPanels();
    setInterval(() => {
      if (pcps > 0) {
        pc += pcps;
        render();
        save();
      }
    }, 1000);
    try {
      window.addEventListener("beforeunload", function () {
        if (typeof save === "function") save();
      });
    } catch (e) {}
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
