window.achievements = [
  {
    id: "first_click",
    name: "First Click",
    desc: "Make your very first click.",
    condition: () => totalClicks >= 1,
    reward: () => {
      try {
        pc = (pc || 0) + 1;
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
  },
  {
    id: "click_master",
    name: "Click Master",
    desc: "Reach 1000 total clicks.",
    condition: () => totalClicks >= 1000,
  },

  {
    id: "brainiac",
    name: "Brainiac",
    desc: "Level up Brainstorm 20 times.",
    condition: () => (upgradeLevels.brainstorm || brainLvl || 0) >= 20,
  },
  {
    id: "brainiac_2",
    name: "Brainiac II",
    desc: "Level up Brainstorm 25 times.",
    condition: () => (upgradeLevels.brainstorm || brainLvl || 0) >= 25,
    reward: () => {
      try {
        pc = (pc || 0) + 1000000;
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
  },
  {
    id: "brainiac_3",
    name: "Brainiac III",
    desc: "Level up Brainstorm 30 times.",
    condition: () => (upgradeLevels.brainstorm || brainLvl || 0) >= 30,
    reward: () => {
      try {
        pc = (pc || 0) + 5000000;
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
  },
  {
    id: "brainstorm_god",
    name: "Brainstorm God",
    desc: "Reach Brainstorm level 100.",
    condition: () => (upgradeLevels.brainstorm || brainLvl || 0) >= 100,
  },
  {
    id: "mk1_refine",
    name: "First Refinement",
    desc: "Unlock any Refining Mk1.",
    condition: () => {
      if (!window.refineData) return false;
      return Object.values(refineData).some((d) => d.tiersUnlocked >= 1);
    },
  },
  {
    id: "mk2_refine",
    name: "Senior Optimizer",
    desc: "Unlock any Refining Mk2.",
    condition: () => {
      if (!window.refineData) return false;
      return Object.values(refineData).some((d) => d.tiersUnlocked >= 2);
    },
  },
  {
    id: "overclocker",
    name: "Overclocker",
    desc: "Reach level 100 in any upgrade.",
    condition: () => {
      return Object.keys(upgradeLevels).some(
        (k) => (upgradeLevels[k] || 0) >= 100
      );
    },
  },
  {
    id: "system_architect",
    name: "System Architect",
    desc: "Reach +5% global performance boost.",
    condition: () => {
      return (globalIncomeMult || 1) >= 1.05;
    },
  },
  {
    id: "reset_novice",
    name: "Reset Novice",
    desc: "Reset the game 5 times with 1000 {P.}.",
    condition: () => rebirthCount >= 5,
  },
  {
    id: "secret_reset",
    name: "Secret Rebooter",
    desc: "Reset 10 times with 1000 {P.}. Gain +5 per click!",
    condition: () => secretUnlocked,
    reward: () => {},
  },

  {
    id: "passive_relay_user",
    name: "Relay Operator",
    desc: "Purchase the Passive Relay upgrade (+1% passive->click).",
    condition: () => (window.passiveToClickPercent || 0) >= 0.01,
  },
  {
    id: "upgrade_collector",
    name: "Upgrade Collector",
    desc: "Own at least 5 different main upgrades.",
    condition: () => {
      try {
        return (
          Object.keys(upgradeLevels).filter((k) => (upgradeLevels[k] || 0) > 0)
            .length >= 5
        );
      } catch (e) {
        return false;
      }
    },
    reward: () => {
      try {
        pc = (pc || 0) + 250;
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
  },
  {
    id: "special_collector",
    name: "Collector of Specials",
    desc: "Own 3 special upgrades.",
    condition: () => {
      try {
        return (
          Object.keys(specialOwned).filter((k) => specialOwned[k]).length >= 3
        );
      } catch (e) {
        return false;
      }
    },
    reward: () => {
      try {
        pc = (pc || 0) + 200;
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
  },
  {
    id: "wealthy",
    name: "Wealthy",
    desc: "Accumulate 10k {P.}.",
    condition: () => pc >= 10000,
    reward: () => {
      try {
        if (typeof baseManualClick === "undefined")
          baseManualClick = perClick || 1;
        baseManualClick += 1;
        try {
          localStorage.setItem("pc:baseManualClick", baseManualClick);
        } catch (e) {}
        if (typeof recalcTotals === "function") recalcTotals();
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
  },
  {
    id: "pcps_1000",
    name: "Power Plant",
    desc: "Reach 1,000 {P.} per second.",
    condition: () => (pcps || 0) >= 1000,
  },
  {
    id: "clicks_10000",
    name: "Clickstorm",
    desc: "Accumulate 10,000 total clicks.",
    condition: () => totalClicks >= 10000,
  },
  {
    id: "shop_unlocked",
    name: "Shopaholic",
    desc: "Unlock the Shop tab.",
    condition: () => !!shopUnlocked,
  },
  {
    id: "happy_halloween",
    name: "Happy Halloween",
    desc: "Trick or treat! A spooky bonus awaits.",
    condition: function () {
      try {
        if (localStorage.getItem("pc:force_halloween") === "1") return true;
        const d = new Date();
        return d.getMonth() === 9 && d.getDate() === 31;
      } catch (e) {
        return false;
      }
    },
    reward: function () {
      try {
        usd = (usd || 0) + 20000;
        pc = (pc || 0) + 1000000;
        if (typeof save === "function") save();
        if (typeof render === "function") render();
      } catch (e) {}
    },
    icon: "crown_sparks.png",
  },
];

function addPerUpgradeTierAchievements() {
  if (!Array.isArray(window.mainUpgrades)) {
    setTimeout(addPerUpgradeTierAchievements, 200);
    return;
  }
  const thresholds = [1, 10, 50, 100];
  const percents = { 1: 0.07, 10: 0.15, 50: 0.35, 100: 0.6 };
  const phrases = ["Bronze", "Silver", "Gold", "Diamond"];
  window.mainUpgrades.forEach(function (u) {
    if (u.id === "brainstorm") return;
    thresholds.forEach(function (t, ti) {
      try {
        const aid = `ach_up_${u.id}_x${t}`;
        if (window.achievements.find((x) => x.id === aid)) return;
        let oneCost = 1;
        try {
          if (typeof u.costFunc === "function")
            oneCost = Math.floor(u.costFunc(0) || 1);
          else oneCost = Math.floor(u.baseCost || u.cost || 1);
        } catch (e) {
          oneCost = Math.max(1, Math.floor(u.baseCost || u.cost || 1));
        }
        const pct = percents[t] || 0.1;
        const rewardAmt = Math.max(1, Math.floor(oneCost * pct));
        const phrase = phrases[ti % phrases.length];
        let candidateName = `${u.name} x${t} — ${phrase}`;
        if (window.achievements.find((x) => x.name === candidateName))
          candidateName = `${candidateName} (${u.id})`;
        window.achievements.push({
          id: aid,
          name: candidateName,
          desc: "Claimed",
          condition: function () {
            try {
              return (upgradeLevels[u.id] || 0) >= t;
            } catch (e) {
              return false;
            }
          },
          reward: function () {
            try {
              pc = (pc || 0) + rewardAmt;
              if (typeof save === "function") save();
              if (typeof render === "function") render();
            } catch (e) {}
          },
        });
      } catch (e) {}
    });
  });
}

addPerUpgradeTierAchievements();
