(function () {
  function capBig() {
    const CAP = 1e90;
    if (pc > CAP) pc = CAP;
    if (usd > CAP) usd = CAP;
    if (cpu > CAP) cpu = CAP;
    if (pcps > CAP) pcps = CAP;
    if (perClick > CAP) perClick = CAP;
    if (globalIncomeMult > CAP) globalIncomeMult = CAP;
  }

  function initRefineDataFor(id) {
    if (!window.refineData[id]) {
      window.refineData[id] = {
        mult: 1,
        tiersUnlocked: 0,
      };
    }
    if (!window.upgradeClickPower[id]) window.upgradeClickPower[id] = 0;
    if (!window.upgradePassivePower[id]) window.upgradePassivePower[id] = 0;
  }

  function milestoneTierForLevel(lvl) {
    if (lvl > 0 && lvl <= 100) {
      if (lvl % 10 === 0) {
        return lvl / 10;
      }
      return 0;
    }
    if (lvl > 100 && (lvl - 100) % 50 === 0) {
      return 10 + (lvl - 100) / 50;
    }
    return 0;
  }

  function checkMilestonesAndRefine(uId, newLvl) {
    initRefineDataFor(uId);

    const tier = milestoneTierForLevel(newLvl);
    if (!tier) return;

    const data = refineData[uId];
    if (data.tiersUnlocked >= tier) return;

    data.mult *= 2;

    if (!Number.isFinite(globalIncomeMult) || globalIncomeMult <= 0) {
      globalIncomeMult = 1;
    }
    globalIncomeMult += 0.05;

    data.tiersUnlocked = tier;

    window.lastRefineEvent = {
      upgradeId: uId,
      tier: tier,
      level: newLvl,
    };

    capBig();
  }

  function recalcUpgradeContribution(uId) {
    initRefineDataFor(uId);
    const u = mainUpgrades.find((it) => it.id === uId);
    if (!u) return;
    const lvl = upgradeLevels[uId] || 0;
    const mult = refineData[uId].mult || 1;
    const perLevel = u.baseIncome || u.increment || 0;
    const totalFromThisUpgrade = lvl * perLevel * mult;
    if (u.effectType === "perClick") {
      upgradeClickPower[uId] = totalFromThisUpgrade;
    } else if (u.effectType === "perSecond") {
      upgradePassivePower[uId] = totalFromThisUpgrade;
    }
  }

  function recalcTotals() {
    if (typeof window.baseManualClick === "undefined")
      window.baseManualClick = 0;
    if (typeof window.basePassivePS === "undefined") window.basePassivePS = 0;
    if (typeof window.equipManualClick === "undefined")
      window.equipManualClick = 0;
    if (typeof window.equipPassivePS === "undefined") window.equipPassivePS = 0;

    if (!Number.isFinite(globalIncomeMult) || globalIncomeMult <= 0) {
      globalIncomeMult = 1;
    }

    let clickSum = 0;
    Object.keys(upgradeClickPower).forEach((id) => {
      const v = upgradeClickPower[id] || 0;
      if (Number.isFinite(v)) clickSum += v;
    });

    let passiveSum = 0;
    Object.keys(upgradePassivePower).forEach((id) => {
      const v = upgradePassivePower[id] || 0;
      if (Number.isFinite(v)) passiveSum += v;
    });

    perClick =
      (baseManualClick + equipManualClick + clickSum) *
      globalIncomeMult *
      (perClickMult || 1);

    pcps =
      (basePassivePS + equipPassivePS + passiveSum) *
      globalIncomeMult *
      (window.passiveMult || 1);

    if (!Number.isFinite(perClick) || perClick < 0) perClick = 0;
    if (!Number.isFinite(pcps) || pcps < 0) pcps = 0;

    capBig();
  }

  window.recomputeDerived = function () {
    critFromUpgrades = 0;
    perClickMult = 1;
    window.passiveMult = 1;

    if (specialOwned.crit_boost) critFromUpgrades += 0.05;
    if (specialOwned.crit_charm) critFromUpgrades += 0.1;

    if (specialOwned.double_click) perClickMult *= 2;
    if (specialOwned.triple_click) perClickMult *= 3;

    if (specialOwned.network_boost) passiveMult *= 2;
    if (specialOwned.tools) perClickMult *= 1.1;
  };

  window.getPerClick = function () {
    let base = perClick * perClickMult;
    if (bonusClickFromPassive) {
      base += pcps * 0.05;
    }
    if (window.passiveToClickPercent) {
      base += (pcps || 0) * window.passiveToClickPercent;
    }

    return base;
  };

  window.brainCost = function (n) {
    const lvl = typeof n === "number" ? n : brainLvl;
    return 10 + 20 * lvl * (lvl + 1);
  };

  window.shopCost = function () {
    return brainCost(10) * 2;
  };

  window.totalCritChance = function () {
    return Math.min(
      baseCritChance + critFromUpgrades + critFromItems + critFromBonuses,
      1
    );
  };

  window.totalCostFor = function (u, lvl, n) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += u.costFunc ? u.costFunc(lvl + i) : u.cost || 0;
    }
    return sum;
  };

  window.maxAffordable = function (u, lvl, budget) {
    let n = 0;
    while (true) {
      const c = u.costFunc ? u.costFunc(lvl + n) : u.cost || 0;
      if (budget >= c) {
        budget -= c;
        n++;
      } else break;
    }
    return n;
  };

  window.purchaseMain = function (id, qty) {
    const u = mainUpgrades.find((it) => it.id === id);
    if (!u) return;
    initRefineDataFor(id);
    const lvl0 = upgradeLevels[id] || 0;
    let n;
    const mode = typeof qty !== "undefined" ? qty : buyMode;
    if (mode === "max") {
      n = maxAffordable(u, lvl0, pc);
    } else {
      n = Number(mode) || 1;
      n = Math.max(1, Math.floor(n));
      const maxN = maxAffordable(u, lvl0, pc);
      if (n > maxN) n = maxN;
    }
    if (n <= 0) {
      const btnNoMoney = document.querySelector(
        'button[data-buy="' + id + '"]'
      );
      if (btnNoMoney && typeof bump === "function") bump(btnNoMoney);
      return;
    }
    const cost = totalCostFor(u, lvl0, n);
    if (pc < cost) {
      const btnNoMoney = document.querySelector(
        'button[data-buy="' + id + '"]'
      );
      if (btnNoMoney && typeof bump === "function") bump(btnNoMoney);
      return;
    }
    pc -= cost;
    for (let i = 0; i < n; i++) {
      const newLvl = (upgradeLevels[id] || 0) + 1;
      upgradeLevels[id] = newLvl;
      if (id === "brainstorm") {
        brainLvl = newLvl;
        if (brainLvl % 5 === 0) usd += brainLvl;
        if (brainLvl % 7 === 0) cpu += Math.ceil(brainLvl / 10);
      }
      checkMilestonesAndRefine(id, newLvl);
      recalcUpgradeContribution(id);
    }
    recalcTotals();
    if (typeof render === "function") render();
    if (typeof save === "function") save();
  };

  window.purchaseSpecial = function (id) {
    const s = specialUpgrades.find((it) => it.id === id);
    if (!s || specialOwned[id]) return;
    const cost = s.costFunc ? s.costFunc() : s.cost || 0;
    if (pc >= cost) {
      pc -= cost;
      specialOwned[id] = true;
      if (
        !["crit_boost", "crit_charm", "double_click", "triple_click"].includes(
          id
        )
      ) {
        if (typeof s.effect === "function") s.effect();
      }
      localStorage.setItem("pc:sp:" + id, "1");
      recomputeDerived();
      recalcTotals();
      if (typeof render === "function") render();
      if (typeof save === "function") save();
    } else {
      const btn = document.querySelector(`button[data-buy="${id}"]`);
      if (btn && typeof bump === "function") bump(btn);
    }
  };

  window.sellSpecial = function (id) {
    const s = specialUpgrades.find((it) => it.id === id);
    if (!s) return;
    if (!specialOwned[id]) return;
    if (!s.sellable) return;
    const cost = s.costFunc ? s.costFunc() : s.cost || 0;
    const refund = Math.floor(cost * 0.75);
    if (typeof reverseSpecialEffect === "function") reverseSpecialEffect(id);
    specialOwned[id] = false;
    pc += refund;
    recomputeDerived();
    recalcTotals();
    if (typeof render === "function") render();
    if (typeof save === "function") save();
  };

  window.reverseSpecialEffect = function (id) {
    switch (id) {
      case "crit_boost":
        critFromUpgrades -= 0.05;
        break;

      case "crit_charm":
        critFromUpgrades -= 0.1;
        break;

      case "double_click":
        break;

      case "triple_click":
        break;

      case "tools":
        break;

      case "golden_click":
        if (typeof baseManualClick === "undefined") baseManualClick = 0;
        baseManualClick -= 100;
        if (baseManualClick < 1) baseManualClick = 1;
        localStorage.setItem("pc:baseManualClick", baseManualClick);
        break;

      case "passive_click_1pct":
        try {
          window.passiveToClickPercent = Math.max(
            0,
            (window.passiveToClickPercent || 0) - 0.01
          );
          try {
            localStorage.setItem(
              "pc:passiveToClick",
              window.passiveToClickPercent
            );
          } catch (e) {}
        } catch (e) {}
        break;

      case "network_boost":
        break;

      default:
        break;
    }

    if (critFromUpgrades < 0) critFromUpgrades = 0;

    if (typeof recalcTotals === "function") recalcTotals();
  };

  window.save = function () {
    localStorage.setItem(LS.pc, pc);
    localStorage.setItem(LS.usd, usd);
    localStorage.setItem(LS.cpu, cpu);

    localStorage.setItem(LS.perClick, perClick);
    localStorage.setItem(LS.total, totalClicks);

    localStorage.setItem(LS.brain, brainLvl);
    localStorage.setItem(LS.shop, shopUnlocked ? "1" : "0");

    localStorage.setItem(LS.theme, theme);
    localStorage.setItem(LS.logo, logoKey);
    localStorage.setItem(LS.curr, curr);

    localStorage.setItem(LS.sfx, sfx ? "1" : "0");
    localStorage.setItem(LS.music, music ? "1" : "0");

    localStorage.setItem("pc:critFromItems", critFromItems);
    localStorage.setItem("pc:critFromBonuses", critFromBonuses);
    localStorage.setItem("pc:critMultiplier", critMultiplier);

    localStorage.setItem("pc:rebirths", rebirthCount);
    localStorage.setItem("pc:secret", secretUnlocked ? "1" : "0");
    localStorage.setItem(
      "pc:bonusClickFromPassive",
      bonusClickFromPassive ? "1" : "0"
    );

    localStorage.setItem("pc:pcps", pcps);

    mainUpgrades.forEach((u) => {
      const lv = upgradeLevels[u.id] || 0;
      localStorage.setItem("pc:up:" + u.id, lv);
    });

    specialUpgrades.forEach((s) => {
      const owned = specialOwned[s.id] ? "1" : "0";
      localStorage.setItem("pc:sp:" + s.id, owned);
    });

    Object.keys(achievementsUnlocked).forEach((aid) => {
      localStorage.setItem(
        "pc:ach:" + aid,
        achievementsUnlocked[aid] ? "1" : "0"
      );
    });

    localStorage.setItem("pc:refineData", JSON.stringify(refineData));
    localStorage.setItem("pc:globalIncomeMult", globalIncomeMult);

    localStorage.setItem("pc:upClickPower", JSON.stringify(upgradeClickPower));
    localStorage.setItem(
      "pc:upPassivePower",
      JSON.stringify(upgradePassivePower)
    );

    localStorage.setItem("pc:baseManualClick", baseManualClick || 0);
    localStorage.setItem("pc:basePassivePS", basePassivePS || 0);
    localStorage.setItem("pc:effects", window.effectsEnabled ? "1" : "0");
    try {
      localStorage.setItem("pc:lastActive", Date.now());
    } catch (e) {}
  };
  window.clearUpgradeDiscoveryFlags = function () {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("pc:unlockedUpg:") || k.startsWith("pc:seenUpg:")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  };

  window.resetGame = function () {
    if (pc >= 1000) {
      rebirthCount += 1;
      localStorage.setItem("pc:rebirths", rebirthCount);
      if (!secretUnlocked && rebirthCount >= 10) {
        secretUnlocked = true;
        localStorage.setItem("pc:secret", "1");
        baseManualClick = (baseManualClick || 0) + 5;
      }
    }

    pc = 0;
    usd = 0;
    cpu = 0;

    brainLvl = 0;

    Object.keys(upgradeLevels).forEach((k) => (upgradeLevels[k] = 0));
    Object.keys(specialOwned).forEach((k) => (specialOwned[k] = false));

    refineData = {};
    globalIncomeMult = 1;

    upgradeClickPower = {};
    upgradePassivePower = {};

    baseManualClick = secretUnlocked ? 5 : 1;
    basePassivePS = 0;

    equipManualClick = 0;
    equipPassivePS = 0;

    pcps = 0;

    critFromUpgrades = 0;
    critFromItems = 0;
    critFromBonuses = 0;
    critMultiplier = 2;

    perClickMult = 1;

    totalClicks = 0;

    perClick = baseManualClick;
    pcps = basePassivePS;

    clearUpgradeDiscoveryFlags();

    recomputeDerived();
    recalcTotals();

    save();

    if (typeof render === "function") render();
    if (typeof checkAchievements === "function") checkAchievements();
  };

  window.recalcUpgradeContribution = recalcUpgradeContribution;
  window.recalcTotals = recalcTotals;
  const CASE_LOOT_TABLE = {
    basic: [
      {
        id: "cap_basic",
        name: "Basic Cap",
        type: "hat",
        crit: 0.02,
        rarity: "common",
      },
      {
        id: "tee_cotton",
        name: "Cotton Tee",
        type: "shirt",
        perClick: 0.5,
        rarity: "common",
      },
      {
        id: "jeans_blue",
        name: "Blue Jeans",
        type: "pants",
        perSecond: 0.2,
        rarity: "rare",
      },
      {
        id: "cap_trucker",
        name: "Trucker Cap",
        type: "hat",
        crit: 0.01,
        rarity: "common",
      },
      {
        id: "tee_graphic",
        name: "Graphic Tee",
        type: "shirt",
        perClick: 0.4,
        rarity: "common",
      },
      {
        id: "boots_work",
        name: "Work Boots",
        type: "boots",
        perClick: 0.15,
        rarity: "common",
      },
      {
        id: "ring_tin",
        name: "Tin Band",
        type: "ring",
        crit: 0.01,
        rarity: "common",
      },
      {
        id: "jewel_chipped",
        name: "Chipped Crystal",
        type: "jewel",
        perSecond: 0.05,
        rarity: "common",
      },
      {
        id: "pants_cargo",
        name: "Cargo Pants",
        type: "pants",
        perSecond: 0.15,
        rarity: "rare",
      },
      {
        id: "boots_trail",
        name: "Trail Boots",
        type: "boots",
        perClick: 0.25,
        rarity: "rare",
      },
      {
        id: "visor_basic",
        name: "Basic Visor",
        type: "hat",
        crit: 0.02,
        rarity: "rare",
      },
      {
        id: "hoodie_reinf",
        name: "Reinforced Hoodie",
        type: "shirt",
        perClick: 0.7,
        rarity: "rare",
      },
      {
        id: "ring_bronze",
        name: "Bronze Signet",
        type: "ring",
        crit: 0.03,
        rarity: "rare",
      },
      {
        id: "jewel_azure",
        name: "Azure Shard",
        type: "jewel",
        perSecond: 0.15,
        rarity: "rare",
      },
    ],

    pro: [
      {
        id: "boots_brown",
        name: "Brown Boots",
        type: "boots",
        perClick: 0.2,
        rarity: "rare",
      },
      {
        id: "ring_lucky",
        name: "Lucky Ring",
        type: "ring",
        crit: 0.05,
        rarity: "epic",
      },
      {
        id: "gem_green",
        name: "Green Jewel",
        type: "jewel",
        perSecond: 0.5,
        rarity: "epic",
      },
      {
        id: "boots_tactical",
        name: "Tactical Boots",
        type: "boots",
        perClick: 0.4,
        rarity: "rare",
      },
      {
        id: "jersey_power",
        name: "Power Jersey",
        type: "shirt",
        perClick: 0.6,
        rarity: "rare",
      },
      {
        id: "visor_holo",
        name: "Holo Visor",
        type: "hat",
        crit: 0.06,
        rarity: "epic",
      },
      {
        id: "pants_kinetic",
        name: "Kinetic Greaves",
        type: "pants",
        perSecond: 0.6,
        rarity: "epic",
      },
      {
        id: "boots_dash",
        name: "Dash Boots",
        type: "boots",
        perClick: 0.6,
        rarity: "epic",
      },
      {
        id: "ring_quantum",
        name: "Quantum Loop",
        type: "ring",
        crit: 0.07,
        rarity: "epic",
      },
      {
        id: "jewel_cobalt",
        name: "Cobalt Core",
        type: "jewel",
        perSecond: 0.8,
        rarity: "epic",
      },
    ],

    legendary: [
      {
        id: "ring_lucky+",
        name: "Lucky Ring+",
        type: "ring",
        crit: 0.1,
        rarity: "legendary",
      },
      {
        id: "boots_brown+",
        name: "Sprint Boots",
        type: "boots",
        perClick: 1.0,
        rarity: "legendary",
      },
      {
        id: "crown_sparks",
        name: "Crown of Sparks",
        type: "hat",
        crit: 0.12,
        rarity: "legendary",
      },
      {
        id: "suit_overclock",
        name: "Overclocked Suit",
        type: "shirt",
        perClick: 1.3,
        rarity: "legendary",
      },
      {
        id: "pants_void",
        name: "Voidweave Pants",
        type: "pants",
        perSecond: 1.2,
        rarity: "legendary",
      },
      {
        id: "jewel_prismatic",
        name: "Prismatic Heart",
        type: "jewel",
        perSecond: 1.6,
        rarity: "legendary",
      },
      {
        id: "ring_entropy",
        name: "Entropy Band",
        type: "ring",
        crit: 0.15,
        rarity: "legendary",
      },
      {
        id: "boots_phase",
        name: "Phase Striders",
        type: "boots",
        perClick: 1.4,
        rarity: "legendary",
      },
    ],
  };

  const CASE_COST = {
    basic: 19999,
    pro: 199999,
    legendary: 1999999,
  };
  window.buyCase = function (caseId) {
    const cost = CASE_COST[caseId] || 0;
    if (pc < cost) {
      showDialog({
        title: "Not enough {P.}",
        message: "You don't have enough points to buy this case.",
        okText: "OK",
      });
      return;
    }

    pc -= cost;
    if (typeof render === "function") render();

    const pool = CASE_LOOT_TABLE[caseId] || [];
    if (!pool.length) return;
    const won = { ...pool[Math.floor(Math.random() * pool.length)] };
    const STRIP_MIN = 500;
    const stripLength = Math.max(STRIP_MIN, pool.length * 50);
    const items = [];
    for (let i = 0; i < stripLength; i++) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      items.push({ ...pick });
    }

    const TAIL_ITEMS = 14;
    const winIndex = Math.max(40, items.length - (TAIL_ITEMS + 1));
    items[winIndex] = { ...won };

    const overlay = document.createElement("div");
    overlay.className = "case-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "9999",
      background: "rgba(0,0,0,0.6)",
    });

    const modal = document.createElement("div");
    modal.className = "case-modal";
    Object.assign(modal.style, {
      width: "90vw",
      maxWidth: "1200px",
      height: "220px",
      background:
        "linear-gradient(180deg, rgba(20,20,24,0.95), rgba(6,6,8,0.95))",
      border: "1px solid rgba(255,255,255,0.04)",
      borderRadius: "10px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      padding: "12px 16px",
      color: "#fff",
      fontWeight: "700",
    });
    header.textContent = "Opening Case...";
    modal.appendChild(header);

    const scrollerWrap = document.createElement("div");
    Object.assign(scrollerWrap.style, {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      padding: "8px 0 20px 0",
      overflow: "hidden",
    });

    const scroller = document.createElement("div");
    scroller.className = "case-scroller";
    Object.assign(scroller.style, {
      display: "flex",
      alignItems: "center",
      willChange: "transform",
      padding: "8px 40px",
      boxSizing: "border-box",
    });

    const RARITY_COL = {
      common: "rgba(255,255,255,0.04)",
      rare: "rgba(85,150,255,0.18)",
      epic: "rgba(160,50,255,0.18)",
      legendary: "rgba(255,200,60,0.22)",
    };

    items.forEach((it) => {
      const cell = document.createElement("div");
      cell.className = "case-item";
      Object.assign(cell.style, {
        width: "110px",
        height: "110px",
        margin: "0 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.02)",
        boxSizing: "border-box",
        userSelect: "none",
        boxShadow: `0 4px 18px ${RARITY_COL[it.rarity] || RARITY_COL.common}`,
      });

      const imgWrap = document.createElement("div");
      Object.assign(imgWrap.style, {
        width: "64px",
        height: "64px",
        borderRadius: "10px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.08)",
      });

      const img = document.createElement("img");
      img.src =
        it.icon ||
        (it.id
          ? "assets/icons/" + it.id + ".png"
          : "assets/icons/case_basic.png");
      img.alt = it.name || "item";
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",
      });
      imgWrap.appendChild(img);

      const name = document.createElement("div");
      name.textContent = it.name || "Item";
      Object.assign(name.style, {
        fontSize: "12px",
        color: "#ddd",
        marginTop: "6px",
        textAlign: "center",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        width: "100%",
      });

      cell.appendChild(imgWrap);
      cell.appendChild(name);
      scroller.appendChild(cell);
    });

    scrollerWrap.appendChild(scroller);

    const pointer = document.createElement("div");
    pointer.className = "case-pointer";
    Object.assign(pointer.style, {
      position: "absolute",
      top: "0",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: "6px",
      pointerEvents: "none",
    });
    const stick = document.createElement("div");
    Object.assign(stick.style, {
      height: "100%",
      width: "6px",
      margin: "auto",
      background: "linear-gradient(180deg,#ffffff, #c6c6ff)",
      borderRadius: "6px",
      boxShadow: "0 0 18px rgba(255,255,255,0.06)",
    });
    pointer.appendChild(stick);

    modal.appendChild(scrollerWrap);
    modal.appendChild(pointer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const SCROLL_MS = 7000;

    requestAnimationFrame(() => {
      scroller.style.transition = "none";
      scroller.style.transform = "translate3d(0,0,0)";
      scroller.offsetWidth;

      const modalRect = modal.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const chosenNode = scroller.children[winIndex];
      if (!chosenNode) return;

      const chosenCenter =
        scrollerRect.left + chosenNode.offsetLeft + chosenNode.offsetWidth / 2;
      const modalCenter = modalRect.left + modalRect.width / 2;

      let targetOffset = chosenCenter - modalCenter;
      if (targetOffset < 0) targetOffset = 0;

      scroller.style.transition = `transform ${SCROLL_MS}ms cubic-bezier(0.2,0.9,0.05,1)`;
      scroller.style.transform = `translate3d(${-targetOffset}px,0,0)`;

      const onEnd = (ev) => {
        if (!ev || !String(ev.propertyName || "").includes("transform")) return;
        scroller.removeEventListener("transitionend", onEnd);

        const resultCard = document.createElement("div");
        resultCard.className = "case-result";
        Object.assign(resultCard.style, {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.98), rgba(20,20,26,0.98))",
          padding: "16px",
          borderRadius: "10px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          color: "#fff",
          minWidth: "320px",
          textAlign: "center",
        });

        const title = document.createElement("div");
        title.textContent = `Congratulations! You got ${won.name}!`;
        Object.assign(title.style, { fontWeight: "700", marginBottom: "8px" });
        resultCard.appendChild(title);

        const ico = document.createElement("img");
        ico.src =
          won.icon ||
          (won.id
            ? "assets/icons/" + won.id + ".png"
            : "assets/icons/case_basic.png");
        Object.assign(ico.style, {
          width: "80px",
          height: "80px",
          objectFit: "contain",
        });
        resultCard.appendChild(ico);

        const btnRow = document.createElement("div");
        Object.assign(btnRow.style, {
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginTop: "12px",
        });

        const sellBtn = document.createElement("button");
        sellBtn.textContent = "Sell";
        Object.assign(sellBtn.style, {
          background: "#2ecc71",
          border: "none",
          color: "#042",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
        });

        const claimBtn = document.createElement("button");
        claimBtn.textContent = "Claim";
        Object.assign(claimBtn.style, {
          background: "#2f8fff",
          border: "none",
          color: "#042",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
        });

        btnRow.appendChild(sellBtn);
        btnRow.appendChild(claimBtn);
        resultCard.appendChild(btnRow);
        modal.appendChild(resultCard);

        sellBtn.addEventListener("click", function () {
          showDialog({
            title: "Sell Item",
            message: "Are you sure you want to sell this item?",
            okText: "Yes, sell",
            cancelText: "Cancel",
            onOk: function () {
              const refund = Math.floor((CASE_COST[caseId] || 0) / 4);
              pc += refund;
              if (typeof render === "function") render();
              if (typeof save === "function") save();
              pushNotification(
                "shop",
                "Item Sold",
                `${won.name} sold for ${refund} ${curr}`
              );
              overlay.remove();
            },
          });
        });

        claimBtn.addEventListener("click", function () {
          showDialog({
            title: "Claim Item",
            message: "Are you sure you want to claim this item?",
            okText: "Yes, claim",
            cancelText: "Cancel",
            onOk: function () {
              const ok = tryAddToInventory({ ...won });
              if (ok) {
                if (typeof saveInv === "function") saveInv();
                if (typeof renderInventory === "function") renderInventory();
                if (typeof render === "function") render();
                if (typeof save === "function") save();
                pushNotification(
                  "inventory",
                  "Item Claimed",
                  `You received ${won.name}`
                );
                overlay.remove();
              }
            },
          });
        });
      };

      scroller.addEventListener("transitionend", onEnd);
    });
  };

  function generateDailyStock() {
    const base = [
      {
        id: "daily_hat_lucky",
        name: "Lucky Cap",
        desc: "+2% crit chance",
        price: 1200,
        grant: {
          type: "hat",
          crit: 0.02,
          name: "Lucky Cap",
          id: "cap_basic",
          rarity: "common",
        },
      },
      {
        id: "daily_boots_speed",
        name: "Sprint Boots",
        desc: "+0.5 /click",
        price: 3000,
        grant: {
          type: "boots",
          perClick: 0.5,
          name: "Sprint Boots",
          id: "boots_brown",
          rarity: "rare",
        },
      },
    ];
    function pickRandomFromCases(n) {
      const pool = [];
      Object.keys(CASE_LOOT_TABLE).forEach((k) => {
        const arr = CASE_LOOT_TABLE[k] || [];
        arr.forEach((it) => {
          if (it.rarity === "common" || it.rarity === "rare") pool.push(it);
        });
      });
      const usedIds = new Set(
        base.map((b) => b.grant && b.grant.id).filter(Boolean)
      );
      const filtered = pool.filter((p) => !usedIds.has(p.id));
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
      return filtered.slice(0, n).map((it) => {
        const grant = {
          type: it.type,
          name: it.name,
          id: it.id,
          rarity: it.rarity,
        };
        if (it.perClick) grant.perClick = it.perClick;
        if (it.perSecond) grant.perSecond = it.perSecond;
        if (it.crit) grant.crit = it.crit;
        return { item: it, grant };
      });
    }

    function priceByRarity(r) {
      switch (r) {
        case "common":
          return 25000;
        case "rare":
          return 350000;
        case "epic":
          return 650000;
        case "legendary":
          return 2500000000;
        default:
          return 999999999999;
      }
    }

    const randoms = pickRandomFromCases(2).map(({ item, grant }) => ({
      id: "daily_rand_" + item.id,
      name: item.name,
      desc: "From Cases",
      price: priceByRarity(item.rarity),
      grant,
    }));

    return base.concat(randoms);
  }

  window.loadDailyShop = function () {
    const todayKey = new Date().toISOString().slice(0, 10);
    const savedStr = localStorage.getItem("pc:dailyShop");
    let parsed = null;
    try {
      parsed = JSON.parse(savedStr);
    } catch (e) {}
    if (!parsed || parsed.date !== todayKey) {
      parsed = {
        date: todayKey,
        items: generateDailyStock(),
      };
      localStorage.setItem("pc:dailyShop", JSON.stringify(parsed));
    }
    window.dailyShopData = parsed;
    renderDailyShopUI();
  };

  window.buyDailyItem = function (itemId) {
    if (!window.dailyShopData) return;
    const item = window.dailyShopData.items.find((it) => it.id === itemId);
    if (!item) return;
    if (pc < item.price) {
      console.warn("Not enough PC for daily item", itemId);
      return;
    }
    pc -= item.price;

    const grant = Object.assign({}, item.grant);
    if (!tryAddToInventory(grant)) return;

    if (typeof saveInv === "function") saveInv();
    if (typeof renderInventory === "function") renderInventory();
    if (typeof render === "function") render();
    if (typeof save === "function") save();
  };

  window.renderDailyShopUI = function () {
    const wrap = document.getElementById("dailyItems");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!window.dailyShopData) return;

    window.dailyShopData.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "shop-item";

      const ico = document.createElement("div");
      ico.className = "shop-item-ico";
      const iconId = (item.grant && item.grant.id) || item.id || "";
      const rarity =
        (item.grant && item.grant.rarity) ||
        (item.item && item.item.rarity) ||
        "common";
      const img = document.createElement("img");
      img.src = "assets/icons/" + iconId + ".png";
      img.alt = item.name;
      img.style.width = "48px";
      img.style.height = "48px";
      img.style.display = "block";
      img.style.margin = "0 auto";
      ico.appendChild(img);
      const RARITY_GLOW = {
        common: "0 0 8px rgb(66, 66, 66)",
        rare: "0 0 12px rgb(85, 150, 255)",
        epic: "0 0 14px rgb(159, 50, 255)",
        legendary: "0 0 18px rgb(255, 200, 60)",
      };
      if (RARITY_GLOW[rarity]) {
        ico.style.boxShadow = RARITY_GLOW[rarity];
        ico.style.borderRadius = "6px";
      }
      row.appendChild(ico);

      const body = document.createElement("div");
      body.className = "shop-item-body";

      const nm = document.createElement("div");
      nm.className = "shop-item-name";
      nm.textContent = item.name;
      body.appendChild(nm);

      const desc = document.createElement("div");
      desc.className = "shop-item-desc";
      desc.textContent = item.desc;
      body.appendChild(desc);

      const price = document.createElement("div");
      price.className = "shop-item-price";
      price.innerHTML = '<span class="pSym">{P.}</span> ' + item.price;
      body.appendChild(price);

      const btn = document.createElement("button");
      btn.className = "btn small buy-daily";
      btn.textContent = "Buy";
      btn.addEventListener("click", function () {
        buyDailyItem(item.id);
      });
      body.appendChild(btn);

      row.appendChild(body);
      wrap.appendChild(row);
    });
  };
})();
