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
    const instituteLvl = city && city.institute ? city.institute : 0;
    passiveMult *= 1 + 0.05 * instituteLvl;
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

    baseManualClick = secretUnlocked ? 5 : 0;
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
    ],
    legend: [
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
    ],
  };

  const CASE_COST = {
    basic: 19999,
    pro: 199999,
    legend: 1999999,
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

    const pool = CASE_LOOT_TABLE[caseId] || [];
    if (!pool.length) return;

    const won = Object.assign(
      {},
      pool[Math.floor(Math.random() * pool.length)]
    );
    if (!tryAddToInventory(won)) return;

    if (typeof saveInv === "function") saveInv();
    if (typeof renderInventory === "function") renderInventory();
    if (typeof render === "function") render();
    if (typeof save === "function") save();
  };

  function generateDailyStock() {
    return [
      {
        id: "daily_hat_lucky",
        name: "Lucky Cap",
        desc: "+2% crit chance",
        price: 1200,
        grant: { type: "hat", crit: 0.02, name: "Lucky Cap", id: "lucky_cap" },
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
          id: "sprint_boots",
        },
      },
    ];
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
      ico.textContent = item.name;
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
