function ccCost(baseCost, lvl) {
  return Math.floor(baseCost * Math.pow(1.15, lvl));
}

window.mainUpgrades = [
  {
    id: "brainstorm",
    name: "Brainstorm (Main)",
    effectType: "perSecond",
    baseIncome: 1,
    increment: 1,
    costFunc: (lvl) => (10 + 40 * lvl * (lvl + 2)) * Math.pow(1.15, lvl),
    icon: ICONS.upgradeIcons.brainstorm,
    unlockAt: 0,
  },

  {
    id: "coffee_break",
    name: "Coffee Break",
    effectType: "perSecond",
    baseIncome: 0.1,
    increment: 0.1,
    baseCost: 15,
    costFunc: (lvl) => ccCost(15, lvl),
    icon: ICONS.upgradeIcons.coffee_break,
    unlockAt: 10,
  },
  {
    id: "junior_dev",
    name: "Junior Developer",
    effectType: "perSecond",
    baseIncome: 1,
    increment: 1,
    baseCost: 100,
    costFunc: (lvl) => ccCost(100, lvl),
    icon: ICONS.upgradeIcons.bootcamp,
    unlockAt: 70,
  },
  {
    id: "stack_overflow",
    name: "Stack Overflow",
    effectType: "perSecond",
    baseIncome: 8,
    increment: 8,
    baseCost: 1100,
    costFunc: (lvl) => ccCost(1100, lvl),
    icon: ICONS.upgradeIcons.debug_tools,
    unlockAt: 1000,
  },
  {
    id: "refactoring",
    name: "Refactoring",
    effectType: "perSecond",
    baseIncome: 47,
    increment: 47,
    baseCost: 12000,
    costFunc: (lvl) => ccCost(12000, lvl),
    icon: ICONS.upgradeIcons.refactoring,
    unlockAt: 10000,
  },
  {
    id: "automation_script",
    name: "Automation Script",
    effectType: "perSecond",
    baseIncome: 260,
    increment: 260,
    baseCost: 130000,
    costFunc: (lvl) => ccCost(130000, lvl),
    icon: ICONS.upgradeIcons.optimize_code,
    unlockAt: 100000,
  },
  {
    id: "ai_assistant",
    name: "AI Assistant",
    effectType: "perSecond",
    baseIncome: 1400,
    increment: 1400,
    baseCost: 1400000,
    costFunc: (lvl) => ccCost(1400000, lvl),
    icon: ICONS.upgradeIcons.ai_assistant,
    unlockAt: 1000000,
  },
  {
    id: "cloud_dc",
    name: "Cloud Data Center",
    effectType: "perSecond",
    baseIncome: 7800,
    increment: 7800,
    baseCost: 20000000,
    costFunc: (lvl) => ccCost(20000000, lvl),
    icon: ICONS.upgradeIcons.data_center,
    unlockAt: 15000000,
  },
  {
    id: "quantum_computer",
    name: "Quantum Computer",
    effectType: "perSecond",
    baseIncome: 44000,
    increment: 44000,
    baseCost: 330000000,
    costFunc: (lvl) => ccCost(330000000, lvl),
    icon: ICONS.upgradeIcons.quantum,
    unlockAt: 250000000,
  },
  {
    id: "nn_cluster",
    name: "Neural Network Cluster",
    effectType: "perSecond",
    baseIncome: 260000,
    increment: 260000,
    baseCost: 5100000000,
    costFunc: (lvl) => ccCost(5100000000, lvl),
    icon: ICONS.upgradeIcons.deep_learning,
    unlockAt: 4100000000,
  },
  {
    id: "open_source",
    name: "Open Source",
    effectType: "perSecond",
    baseIncome: 1600000,
    increment: 1600000,
    baseCost: 75000000000,
    costFunc: (lvl) => ccCost(75000000000, lvl),
    icon: ICONS.upgradeIcons.research_lab,
    unlockAt: 55000000000,
  },
  {
    id: "tech_singularity",
    name: "Tech Singularity",
    effectType: "perSecond",
    baseIncome: 10000000,
    increment: 10000000,
    baseCost: 1000000000000,
    costFunc: (lvl) => ccCost(1000000000000, lvl),
    icon: ICONS.upgradeIcons.brain_machine,
    unlockAt: 1000000000000,
  },
];

window.specialUpgrades = [
  {
    id: "unlock_shop",
    name: "Unlock Shop",
    desc: "Unlocks the Shop tab. (Once you buy it, it's yours forever)",
    costFunc: () => shopCost(),
    sellable: false,
    icon: ICONS.shop,
    effect: function () {
      shopUnlocked = true;
      localStorage.setItem(LS.shop, "1");

      const shopTab = document.querySelector('.tab[data-panel="shop"]');
      if (shopTab) {
        shopTab.disabled = false;
      }

      if (typeof save === "function") save();
    },
    condition: () => !shopUnlocked,
  },
  {
    id: "crit_boost",
    name: "Critical Thinker",
    desc: "+5% critical chance",
    cost: 5799,
    sellable: true,
    icon: ICONS.upgradeIcons?.crit_boost,
    effect: function () {
      critFromUpgrades += 0.05;
      if (typeof recalcTotals === "function") recalcTotals();
    },
    condition: () => true,
  },
  {
    id: "crit_charm",
    name: "Lucky Charm",
    desc: "+10% critical chance",
    cost: 15000,
    sellable: true,
    icon: ICONS.upgradeIcons?.crit_charm,
    effect: function () {
      critFromUpgrades += 0.1;
      if (typeof recalcTotals === "function") recalcTotals();
    },
    condition: () => true,
  },
  {
    id: "golden_click",
    name: "Golden Fingers",
    desc: "+100 per click",
    cost: 5000,
    sellable: true,
    icon: ICONS.upgradeIcons.golden_click,
    effect: function () {
      if (typeof baseManualClick === "undefined") baseManualClick = 0;
      baseManualClick += 100;
      if (typeof recalcTotals === "function") recalcTotals();
    },
    condition: () => true,
  },
  {
    id: "cash_infusion",
    name: "Cash Infusion",
    desc: "+10000 PC instantly (1 time per Rebirth)",
    cost: 5000,
    sellable: false,
    icon: ICONS.upgradeIcons.cash_infusion,
    effect: function () {
      pc += 10000;
    },
    condition: () => true,
  },
  {
    id: "network_boost",
    name: "Network Boost",
    desc: "Doubles passive income",
    cost: 30000000,
    sellable: false,
    icon: ICONS.upgradeIcons.network_boost,
    effect: function () {},
    condition: () => true,
  },

  {
    id: "time_machine",
    name: "Time Machine",
    desc: "Gain 1,000,000 PC instantly (Go and buy some bitcoins)",
    cost: 100000,
    sellable: false,
    icon: ICONS.upgradeIcons.time_machine,
    effect: function () {
      pc += 1000000;
    },
    condition: () => true,
  },
  {
    id: "double_click",
    name: "Double Clicker",
    desc: "Doubles your per click permanently",
    cost: 1000000,
    sellable: true,
    icon: ICONS.upgradeIcons.double_click,
    effect: function () {
      perClickMult = perClickMult * 2;
      if (typeof recalcTotals === "function") recalcTotals();
    },
    condition: () => true,
  },
  {
    id: "triple_click",
    name: "Triple Clicker",
    desc: "Triples your per click permanently",
    cost: 20000000,
    sellable: true,
    icon: ICONS.upgradeIcons.triple_click,
    effect: function () {
      perClickMult = perClickMult * 3;
      if (typeof recalcTotals === "function") recalcTotals();
    },
    condition: () => true,
  },
  {
    id: "click_from_passive",
    name: "Synergy Engine",
    desc: "Each click gives +10% of current income per second. (Once you buy it, it's yours forever)",
    cost: 1000000000,
    sellable: false,
    icon: ICONS.upgradeIcons.server_room,
    effect: function () {
      bonusClickFromPassive = true;
      if (typeof recalcTotals === "function") recalcTotals();
    },
    condition: () => !bonusClickFromPassive,
  },
  {
    id: "design_skin",
    name: "UI Redesign",
    desc: "Unlocks a new skin",
    cost: 20000,
    sellable: false,
    icon: ICONS.upgradeIcons.design_skin,
    effect: function () {
      theme = "neon";
      if (typeof applyTheme === "function") {
        applyTheme();
      }
      if (typeof themeSel !== "undefined" && themeSel) {
        themeSel.value = "neon";
      }
      localStorage.setItem(LS.theme, theme);
    },
    condition: () => true,
  },
  {
    id: "music_pack",
    name: "Lo-Fi Pack",
    desc: "Unlocks music theme",
    cost: 15000,
    sellable: false,
    icon: ICONS.upgradeIcons.music_pack,
    effect: function () {
      music = true;
    },
    condition: () => true,
  },
  {
    id: "usd_boost",
    name: "Insider Trading",
    desc: "+100 USD instantly",
    cost: 15000,
    sellable: false,
    icon: ICONS.upgradeIcons.usd_boost,
    effect: function () {
      usd += 100;
    },
    condition: () => true,
  },
  {
    id: "usd_billionaire",
    name: "Millionaire Package",
    desc: "+1,000,000 USD instantly",
    cost: 50000000,
    sellable: false,
    icon: ICONS.upgradeIcons.usd_billionaire,
    effect: function () {
      usd += 1000000;
    },
    condition: () => true,
  },
  {
    id: "cpu_overclock",
    name: "CPU Overclock",
    desc: "+10 CPU",
    cost: 20000,
    sellable: false,
    icon: ICONS.upgradeIcons.cpu_overclock,
    effect: function () {
      cpu += 10;
    },
    condition: () => true,
  },
  {
    id: "cpu_factory",
    name: "CPU Factory",
    desc: "+100 CPU",
    cost: 100000,
    sellable: false,
    icon: ICONS.upgradeIcons.cpu_factory,
    effect: function () {
      cpu += 100;
    },
    condition: () => true,
  },
  {
    id: "resource_pack",
    name: "Resource Pack",
    desc: "+100 CPU, +1,000 USD, +10,000 PC instantly",
    cost: 250000,
    sellable: false,
    icon: ICONS.upgradeIcons.resource_pack,
    effect: function () {
      cpu += 100;
      usd += 1000;
      pc += 10000;
    },
    condition: () => true,
  },
];
