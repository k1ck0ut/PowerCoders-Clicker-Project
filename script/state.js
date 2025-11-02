(function () {
  window.baseCritChance = 0;
  window.critFromUpgrades = +localStorage.getItem("pc:critFromUpgrades") || 0;
  window.critFromItems = +localStorage.getItem("pc:critFromItems") || 0;
  window.critFromBonuses = +localStorage.getItem("pc:critFromBonuses") || 0;
  window.critMultiplier = +localStorage.getItem("pc:critMultiplier") || 2;
  window.bonusClickFromPassive =
    localStorage.getItem("pc:bonusClickFromPassive") === "1";

  window.pc = +localStorage.getItem(LS.pc) || 0;
  window.usd = +localStorage.getItem(LS.usd) || 0;
  window.cpu = +localStorage.getItem(LS.cpu) || 0;

  window.perClick = +localStorage.getItem(LS.perClick) || 1;
  window.totalClicks = +localStorage.getItem(LS.total) || 0;
  window.brainLvl = +localStorage.getItem(LS.brain) || 0;
  window.shopUnlocked = localStorage.getItem(LS.shop) === "1";
  window.pcps = +localStorage.getItem("pc:pcps") || 0;

  window.theme = localStorage.getItem(LS.theme) || "dark";
  window.logoKey = localStorage.getItem(LS.logo) || "PowerCoders";
  window.curr =
    localStorage.getItem(LS.curr) ||
    (STYLE_PRESETS[window.logoKey]
      ? STYLE_PRESETS[window.logoKey].currency
      : "{P.}");

  window.sfx = localStorage.getItem(LS.sfx) !== "0";
  window.music = localStorage.getItem(LS.music) === "1";

  window.musicEnabled = true;
  const savedMusic = localStorage.getItem("pc:music");
  if (savedMusic !== null) window.musicEnabled = savedMusic === "1";
  window.musicVolume = 0.0055;
  const savedVol = localStorage.getItem("pc:musicVol");
  if (savedVol !== null) {
    const v = parseFloat(savedVol);
    if (!Number.isNaN(v)) window.musicVolume = Math.min(Math.max(v, 0), 1);
  }

  window.sfxEnabled = true;
  const savedSfx = localStorage.getItem("pc:sfx");
  if (savedSfx !== null) window.sfxEnabled = savedSfx === "1";

  window.rebirthCount = +localStorage.getItem("pc:rebirths") || 0;
  window.secretUnlocked = localStorage.getItem("pc:secret") === "1";

  window.upgradeLevels = {};
  window.specialOwned = {};
  window.achievementsUnlocked = {};
  window.perClickMult = 1;
  window.buyMode = 1;

  window.refineData =
    JSON.parse(localStorage.getItem("pc:refineData") || "{}") || {};
  window.globalIncomeMult = +localStorage.getItem("pc:globalIncomeMult") || 1;

  window.upgradeClickPower =
    JSON.parse(localStorage.getItem("pc:upClickPower") || "{}") || {};
  window.upgradePassivePower =
    JSON.parse(localStorage.getItem("pc:upPassivePower") || "{}") || {};

  window.baseManualClick =
    +localStorage.getItem("pc:baseManualClick") || window.perClick || 1;

  window.basePassivePS =
    +localStorage.getItem("pc:basePassivePS") || window.pcps || 0;

  window.equipManualClick = 0;
  window.equipPassivePS = 0;
  window.passiveToClickPercent =
    +localStorage.getItem("pc:passiveToClick") || 0;

  window.perClick = baseManualClick;
  window.pcps = basePassivePS;

  try {
    window.notifications =
      JSON.parse(localStorage.getItem("pc:notifications") || "{}") || {};
  } catch (e) {
    window.notifications = {};
  }
  window.unseenNotificationCount =
    Object.values(window.notifications).filter(function (v) {
      return !!v;
    }).length || 0;

  window.lastRefineEvent = null;
  window.effectsEnabled = true;
  const savedEff = localStorage.getItem("pc:effects");
  if (savedEff !== null) {
    window.effectsEnabled = savedEff === "1";
  }
})();
