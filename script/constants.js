window.LS = {
  pc: "pc:pc",
  usd: "pc:usd",
  cpu: "pc:cpu",
  perClick: "pc:perClick",
  total: "pc:total",
  brain: "pc:brain",
  shop: "pc:shop",
  theme: "pc:theme",
  logo: "pc:logo",
  curr: "pc:curr",
  sfx: "pc:sfx",
  music: "pc:music",
};
window.formatNiceUpgrade = function (n) {
  if (!Number.isFinite(n)) n = 0;
  const abs = Math.abs(n);

  if (abs < 99000000) {
    const decimals = n < 1 ? 2 : n < 10 ? 1 : 0;
    return n
      .toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      .replace(/,/g, " ");
  }

  const short = formatCompact(n);
  const m = short.match(/^([0-9.]+)([A-Za-z]+)$/);
  if (m) {
    return m[1] + " " + m[2];
  }
  return short;
};
window.formatCompact = function (n) {
  const abs = Math.abs(n);
  if (abs < 1000) {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
  }

  const fixedUnits = [
    { s: "Dc", v: 1e33 },
    { s: "No", v: 1e30 },
    { s: "Oc", v: 1e27 },
    { s: "Sp", v: 1e24 },
    { s: "Sx", v: 1e21 },
    { s: "Qi", v: 1e18 },
    { s: "Qa", v: 1e15 },
    { s: "T", v: 1e12 },
    { s: "B", v: 1e9 },
    { s: "M", v: 1e6 },
    { s: "k", v: 1e3 },
  ];

  for (const u of fixedUnits) {
    if (abs >= u.v) {
      const v = n / u.v;
      const d = v < 10 ? 2 : v < 100 ? 1 : 0;
      const str = v.toFixed(d).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
      return str + u.s;
    }
  }

  const exp = Math.floor(Math.log10(abs));
  const tierIndex = Math.floor(exp / 3) - 1;
  const maxFixedTierIndex = (function () {
    const top = fixedUnits[0];
    const topExp = Math.floor(Math.log10(top.v));
    return Math.floor(topExp / 3) - 1;
  })();

  function makeProceduralSuffix(idx) {
    const upperBase = Math.floor(idx / 26);
    const lowerBase = idx % 26;
    const upperChar = String.fromCharCode("A".charCodeAt(0) + upperBase);
    const lowerChar = String.fromCharCode("a".charCodeAt(0) + lowerBase);
    return upperChar + lowerChar;
  }

  const proceduralTier = tierIndex - maxFixedTierIndex - 1;
  const suffix = makeProceduralSuffix(proceduralTier);
  const tierExp = (tierIndex + 1) * 3;
  const scale = Math.pow(10, tierExp);
  const val = n / scale;
  const decimals = val < 10 ? 2 : val < 100 ? 1 : 0;
  const valStr = val.toFixed(decimals).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
  return valStr + suffix;
};

window.ICONS = {
  logoPresets: {
    PowerCoders: "assets/logo.png",
    HTML: "assets/logo_bolt.png",
    Understanding: "assets/logo_cube.png",
  },
  upgrades: "assets/upgrades.png",
  shop: "assets/shop.png",
  stats: "assets/stats.png",
  map: "assets/map.png",
  inventory: "assets/inventory.png",
  cpu: "assets/cpu.png",

  upgradeIcons: {
    brainstorm: "assets/brainstorm.png",
    focusing: "assets/focusing.png",
    coffee_break: "assets/coffee_break.png",
    study_algorithms: "assets/study_algorithms.png",
    refactoring: "assets/refactoring.png",
    debug_tools: "assets/debug_tools.png",
    bootcamp: "assets/bootcamp.png",
    hackathon: "assets/hackathon.png",
    optimize_code: "assets/optimize_code.png",
    ai_assistant: "assets/ai_assistant.png",
    quantum: "assets/quantum.png",
    deep_learning: "assets/deep_learning.png",
    brain_machine: "assets/brain_machine.png",
    crit_boost: "assets/crit_boost.png",
    double_click: "assets/double_click.png",
    triple_click: "assets/triple_click.png",
    crit_charm: "assets/crit_charm.png",
    golden_click: "assets/golden_click.png",
    cash_infusion: "assets/cash_infusion.png",
    cpu_overclock: "assets/cpu_overclock.png",
    usd_boost: "assets/usd_boost.png",
    network_boost: "assets/network_boost.png",
    tools: "assets/tools.png",
    time_machine: "assets/time_machine.png",
    design_skin: "assets/design_skin.png",
    music_pack: "assets/music_pack.png",
    usd_billionaire: "assets/usd_billionaire.png",
    cpu_factory: "assets/cpu_factory.png",
    resource_pack: "assets/resource_pack.png",
    unlock_shop: "assets/unlock_shop.png",
    server_room: "assets/server_room.png",
    research_lab: "assets/research_lab.png",
    data_center: "assets/data_center.png",
  },
};

window.STYLE_PRESETS = {
  PowerCoders: { logoKey: "PowerCoders", currency: "{P.}" },
  HTML: { logoKey: "HTML", currency: "</>" },
  Understanding: { logoKey: "Understanding", currency: "._." },
};

window.EXCHANGE_OFFERS = [
  {
    id: "pc_to_usd_1",
    type: "pc_to_usd",
    pc: 10000,
    usd: 1,
    label: "10k {P.} → $1",
  },
  {
    id: "pc_to_usd_10",
    type: "pc_to_usd",
    pc: 90000,
    usd: 10,
    label: "90k {P.} → $10",
  },
  {
    id: "pc_to_usd_100",
    type: "pc_to_usd",
    pc: 850000,
    usd: 100,
    label: "850k {P.} → $100",
  },

  {
    id: "usd_to_pc_1",
    type: "usd_to_pc",
    pc: 10000,
    usd: 1,
    label: "$1 → 10k {P.}",
  },
  {
    id: "usd_to_pc_10",
    type: "usd_to_pc",
    pc: 90000,
    usd: 10,
    label: "$10 → 90k {P.}",
  },
  {
    id: "usd_to_pc_100",
    type: "usd_to_pc",
    pc: 850000,
    usd: 100,
    label: "$100 → 850k {P.}",
  },

  {
    id: "pc_to_usd_pack",
    type: "pc_to_usd_pack",
    pc: 8000000,
    usd: 1000,
    label: "8M {P.} → $1 000",
  },

  {
    id: "pc_to_cpu_1",
    type: "pc_to_cpu",
    pc: 1000000,
    cpu: 1,
    label: "1M {P.} → 1 CPU",
  },
  {
    id: "pc_to_cpu_10",
    type: "pc_to_cpu",
    pc: 10000000,
    cpu: 10,
    label: "10M {P.} → 10 CPU",
  },
  {
    id: "pc_to_cpu_100",
    type: "pc_to_cpu",
    pc: 100000000,
    cpu: 100,
    label: "100M {P.} → 100 CPU",
  },
];

window.CITY_BUILDINGS = [
  {
    id: "institute",
    name: "Institute",
    max: 5,
    costType: "usd",
    baseCost: 10000,
    costGrow: 1.8,
    desc: "+5% PC/s per level (additive)",
  },
  {
    id: "office",
    name: "Office",
    max: 5,
    costType: "usd",
    baseCost: 20000,
    costGrow: 1.8,
    desc: "In development…",
  },

  {
    id: "datacenter",
    name: "Data Center",
    max: 5,
    costType: "cpu",
    baseCost: 100,
    costGrow: 1.6,
    desc: "In development…",
  },
  {
    id: "lab",
    name: "R&D Lab",
    max: 5,
    costType: "cpu",
    baseCost: 200,
    costGrow: 1.6,
    desc: "In development…",
  },
];
