(function () {
  window.elPC = document.getElementById("pc");
  window.elUSD = document.getElementById("usd");
  window.elCPU = document.getElementById("cpu");
  window.elPerClick = document.getElementById("perClick");
  window.elTotal = document.getElementById("totalClicks");
  window.clicker = document.getElementById("clicker");
  window.clickLogo = document.getElementById("clickLogo");
  window.playfield = document.getElementById("playfield");
  window.btnBrain = document.getElementById("buyBrainstorm");
  window.spanBrainCost = document.getElementById("brainCost");
  window.miniBrainX = document.getElementById("miniBrainX");
  window.miniBrainIco = document.getElementById("miniBrainIco");
  window.unlockShopCard = document.getElementById("unlockShopCard");
  window.btnShop = document.getElementById("buyShop");
  window.spanShopCost = document.getElementById("shopCost");
  window.tabButtons = Array.from(document.querySelectorAll(".tab"));
  window.tabShopBtn = window.tabButtons.find((b) => b.dataset.panel === "shop");
  window.icoUpg = document.getElementById("ico-upgrades");
  window.icoShop = document.getElementById("ico-shop");
  window.icoStats = document.getElementById("ico-stats");
  window.icoMap = document.getElementById("ico-map");
  window.icoInventory = document.getElementById("ico-inventory");
  window.icoCPU = document.getElementById("ico-cpu");
  window.openSettingsBtn = document.getElementById("openSettings");
  window.themeSel = document.getElementById("themeSel");
  window.styleSel = document.getElementById("styleSel");
  window.pSym = document.getElementById("pSym");
  window.pSymInline3 = document.getElementById("pSymInline3");
  window.centerSymbol = document.getElementById("centerSymbol");
  window.pSymInline4 = document.getElementById("pSymInline4");
  window.elPerSecond = document.getElementById("perSecond");
  window.upgradeTabMain = document.getElementById("upgradeTabMain");
  window.upgradeTabSpecial = document.getElementById("upgradeTabSpecial");
  window.upgradeListMain = document.getElementById("upgradeListMain");
  window.upgradeListSpecial = document.getElementById("upgradeListSpecial");
  window.buyQty1 = document.getElementById("buyQty1");
  window.buyQty5 = document.getElementById("buyQty5");
  window.buyQty10 = document.getElementById("buyQty10");
  window.buyQtyMax = document.getElementById("buyQtyMax");

  window.panels = {
    upgrades: document.getElementById("panel-upgrades"),
    shop: document.getElementById("panel-shop"),
    stats: document.getElementById("panel-stats"),
    map: document.getElementById("panel-map"),
    settings: document.getElementById("panel-settings"),
    inventory: document.getElementById("panel-inventory"),
    city: document.getElementById("panel-city"),
  };
  window.closeBtn = document.getElementById("closePanels");
  window.rebirthBtn = document.getElementById("rebirth");
  window.sfxToggle = document.getElementById("sfxToggle");
  window.musicToggle = document.getElementById("musicToggle");
  if (upgradeListSpecial) upgradeListSpecial.classList.add("hidden");

  if (Array.isArray(mainUpgrades)) {
    mainUpgrades.forEach((u) => {
      if (u.id === "brainstorm") {
        upgradeLevels[u.id] = brainLvl;
      } else {
        const stored = localStorage.getItem("pc:up:" + u.id);
        upgradeLevels[u.id] = stored ? +stored : 0;
      }
    });
  }
  if (Array.isArray(specialUpgrades)) {
    specialUpgrades.forEach((s) => {
      if (s.id === "unlock_shop") {
        specialOwned[s.id] = shopUnlocked;
      } else {
        specialOwned[s.id] = localStorage.getItem("pc:sp:" + s.id) === "1";
      }
    });
  }
  if (Array.isArray(achievements)) {
    achievements.forEach((a) => {
      achievementsUnlocked[a.id] =
        localStorage.getItem("pc:ach:" + a.id) === "1";
    });
  }

  if (sfxToggle) sfxToggle.checked = sfx;
  if (musicToggle) musicToggle.checked = music;

  if (closeBtn) {
    closeBtn.addEventListener("click", closeAllPanels);
  }
  function setBuyMode(m) {
    buyMode = m;
    [buyQty1, buyQty5, buyQty10, buyQtyMax].forEach(
      (b) => b && b.classList.remove("selected")
    );
    if (m === 1 && buyQty1) buyQty1.classList.add("selected");
    if (m === 5 && buyQty5) buyQty5.classList.add("selected");
    if (m === 10 && buyQty10) buyQty10.classList.add("selected");
    if (m === "max" && buyQtyMax) buyQtyMax.classList.add("selected");
    if (typeof renderUpgrades === "function") renderUpgrades();
  }

  if (buyQty1) buyQty1.addEventListener("click", () => setBuyMode(1));
  if (buyQty5) buyQty5.addEventListener("click", () => setBuyMode(5));
  if (buyQty10) buyQty10.addEventListener("click", () => setBuyMode(10));
  if (buyQtyMax) buyQtyMax.addEventListener("click", () => setBuyMode("max"));

  setBuyMode(1);

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.panel;
      if (btn.disabled) return;
      openPanel(name);
    });
  });

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => openPanel("settings"));
  }

  if (themeSel) {
    themeSel.addEventListener("change", () => {
      theme = themeSel.value;
      applyTheme();
      save();
    });
  }

  if (styleSel) {
    styleSel.addEventListener("change", () => {
      const k = styleSel.value;
      const s = STYLE_PRESETS[k];
      if (!s) return;
      logoKey = s.logoKey;
      curr = s.currency;
      applyIcons();
      applyCurrency();
      render();
      save();
    });
  }

  if (sfxToggle) {
    sfxToggle.addEventListener("change", () => {
      sfx = sfxToggle.checked;
      save();
    });
  }

  if (musicToggle) {
    musicToggle.addEventListener("change", () => {
      music = musicToggle.checked;
      save();
    });
  }

  if (clicker) {
    clicker.addEventListener("click", (e) => {
      if (typeof playClickSound === "function") playClickSound();
      const isCrit = Math.random() < totalCritChance();
      const gain = getPerClick() * (isCrit ? critMultiplier : 1);
      pc += gain;
      totalClicks += 1;
      showPlus(gain, isCrit, e);

      render();
      save();
      spawnRain(isCrit ? 8 : 4);
      clicker.classList.add(isCrit ? "critical" : "click-boost");
      setTimeout(
        () => clicker.classList.remove("critical", "click-boost"),
        2500
      );
      if (centerSymbol) {
        centerSymbol.classList.add("boost");
        setTimeout(() => centerSymbol.classList.remove("boost"), 850);
      }
    });
  }

  if (btnBrain) {
    btnBrain.addEventListener("click", () => {
      const cost = brainCost();
      if (pc >= cost) {
        pc -= cost;
        brainLvl += 1;
        if (typeof baseManualClick === "undefined") baseManualClick = 0;
        baseManualClick += 1;
        if (brainLvl % 5 === 0) usd += brainLvl;
        if (brainLvl % 7 === 0) cpu += Math.ceil(brainLvl / 10);
        recalcTotals();
        render();
        save();
      }
    });
  }

  if (btnShop) {
    btnShop.addEventListener("click", () => {
      const cost = shopCost();
      if (!shopUnlocked && pc >= cost) {
        pc -= cost;
        shopUnlocked = true;
        render();
        save();
        openPanel("shop");
      } else {
        bump(btnShop);
      }
    });
  }

  if (upgradeListMain) {
    upgradeListMain.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-buy]");
      if (!btn) return;
      const id = btn.dataset.buy;
      purchaseMain(id);
    });
  }
  if (upgradeListSpecial) {
    upgradeListSpecial.addEventListener("click", function (e) {
      const sell = e.target.closest("button[data-sell]");
      if (sell) {
        const id = sell.dataset.sell;
        sellSpecial(id);
        return;
      }
      const btn = e.target.closest("button[data-buy]");
      if (!btn) return;
      const id = btn.dataset.buy;
      purchaseSpecial(id);
    });
  }

  if (upgradeTabMain && upgradeTabSpecial) {
    upgradeTabMain.addEventListener("click", () => {
      upgradeTabMain.classList.add("selected");
      upgradeTabSpecial.classList.remove("selected");
      if (upgradeListMain) upgradeListMain.classList.remove("hidden");
      if (upgradeListSpecial) upgradeListSpecial.classList.add("hidden");
    });
    upgradeTabSpecial.addEventListener("click", () => {
      upgradeTabSpecial.classList.add("selected");
      upgradeTabMain.classList.remove("selected");
      if (upgradeListSpecial) upgradeListSpecial.classList.remove("hidden");
      if (upgradeListMain) upgradeListMain.classList.add("hidden");
    });
  }
  const upgradesTabButton = tabButtons.find(
    (b) => b.dataset.panel === "upgrades"
  );
  if (
    upgradesTabButton &&
    upgradeTabMain &&
    upgradeTabSpecial &&
    upgradeListMain &&
    upgradeListSpecial
  ) {
    upgradesTabButton.addEventListener("click", () => {
      upgradeTabMain.classList.add("selected");
      upgradeTabSpecial.classList.remove("selected");
      upgradeListMain.classList.remove("hidden");
      upgradeListSpecial.classList.add("hidden");
    });
  }

  if (rebirthBtn) {
    rebirthBtn.addEventListener("click", () => {
      if (pc < 1000) return;
      const confirmed = window.confirm(
        "Resetting the game will erase your progress.\nYou will start over but keep any secret bonuses. Continue?"
      );
      if (confirmed) {
        resetGame();
      }
    });
  }
  (function initShopTabs() {
    const tabBtns = Array.from(document.querySelectorAll(".shop-tab"));
    const views = {
      cases: document.getElementById("shopCases"),
      daily: document.getElementById("shopDaily"),
      exchange: document.getElementById("shopExchange"),
      styles: document.getElementById("shopStyles"),
      gambling: document.getElementById("shopGambling"),
    };

    function openShopSubtab(name) {
      tabBtns.forEach((b) => {
        const key = b.getAttribute("data-shop-tab");
        if (key === name) {
          if (b.disabled) return;
          b.classList.add("selected");
        } else {
          b.classList.remove("selected");
        }
        if (name === "exchange") {
          if (typeof renderExchange === "function") renderExchange();
        }
      });

      Object.keys(views).forEach((k) => {
        const el = views[k];
        if (!el) return;
        el.classList.toggle("active", k === name);
      });
      if (name === "daily") {
        if (typeof loadDailyShop === "function") {
          loadDailyShop();
        }
      }
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-shop-tab");
        if (btn.disabled) return;
        openShopSubtab(target);
      });
    });
    openShopSubtab("cases");
  })();
  (function initCaseButtons() {
    function wireCaseButtons() {
      document.querySelectorAll(".buy-case").forEach((btn) => {
        btn.addEventListener("click", function () {
          const caseId = this.getAttribute("data-case");
          if (typeof buyCase === "function") {
            buyCase(caseId);
          }
        });
      });
    }
    wireCaseButtons();
  })();

  (function hookOpenPanelForShop() {
    const _openPanelOld = window.openPanel;
    window.openPanel = function (name) {
      _openPanelOld && _openPanelOld(name);

      if (name === "shop") {
        if (typeof loadDailyShop === "function") {
          loadDailyShop();
        }
      }
    };
  })();
})();
