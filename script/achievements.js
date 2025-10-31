window.achievements = [
  {
    id: "first_click",
    name: "First Click",
    desc: "Make your very first click.",
    condition: () => totalClicks >= 1,
  },
  {
    id: "click_master",
    name: "Click Master",
    desc: "Reach 1000 total clicks.",
    condition: () => totalClicks >= 1000,
  },
  {
    id: "wealthy",
    name: "Wealthy",
    desc: "Accumulate 10k {P.}.",
    condition: () => pc >= 10000,
  },
  {
    id: "brainiac",
    name: "Brainiac",
    desc: "Level up Brainstorm 20 times.",
    condition: () => (upgradeLevels.brainstorm || brainLvl || 0) >= 20,
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
];
