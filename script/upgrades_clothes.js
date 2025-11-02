(function () {
  const LEVELS = {
    1: { chance: 1.0, bonus: 20 },
    2: { chance: 0.9, bonus: 44 },
    3: { chance: 0.8, bonus: 72 },
    4: { chance: 0.65, bonus: 84 },
    5: { chance: 0.5, bonus: 140 },
    6: { chance: 0.2, bonus: 180 },
    7: { chance: 0.1, bonus: 224 },
    8: { chance: 0.05, bonus: 272 },
    9: { chance: 0.02, bonus: 324 },
    10: { chance: 0.005, bonus: 400 },
    11: { chance: 0.0025, bonus: 520 },
  };

  const MAX_LEVEL = Math.max(...Object.keys(LEVELS).map(Number));

  const levelEl = document.getElementById("level");
  const bonusEl = document.getElementById("bonus");
  const chanceEl = document.getElementById("chance");
  const msgEl = document.getElementById("message");
  const arrow = document.getElementById("upgradeArrow");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const clearPickBtn = document.getElementById("clearPickBtn");
  const pickSquare = document.getElementById("upgradePickSquare");
  const bagGrid = document.getElementById("bagGrid");
  const equipGrid = document.getElementById("equipGrid");

  let currentLevel = 0;
  let selectedIndex = null;
  let selectedItem = null;
  let selectedSlot = null;

  function formatChance(c) {
    if (c >= 0.01) return Math.round(c * 100) + "%";
    return (c * 100).toFixed(2) + "%";
  }

  function updateUI() {
    levelEl.textContent = currentLevel;
    const maxEl = document.getElementById("maxLevel");
    if (maxEl) maxEl.textContent = MAX_LEVEL;
    const bonus = currentLevel === 0 ? 0 : LEVELS[currentLevel].bonus;
    bonusEl.textContent = bonus + "%";
    if (currentLevel >= MAX_LEVEL) {
      chanceEl.textContent = "MAX";
    } else {
      const next = LEVELS[currentLevel + 1];
      if (next) {
        const succ = formatChance(next.chance);
        const lose = formatChance(1 - next.chance);
        chanceEl.textContent = "Success: " + succ + "  Lose: " + lose;
      } else {
        chanceEl.textContent = "—";
      }
    }
  }

  function clearSelection() {
    selectedIndex = null;
    selectedItem = null;
    selectedSlot = null;
    if (pickSquare) pickSquare.innerHTML = "";
    if (pickSquare) {
      pickSquare.removeAttribute("data-inv-index");
      pickSquare.removeAttribute("data-slot");
      pickSquare.removeAttribute("data-equipped");
      pickSquare.title = "";
    }
    upgradeBtn.disabled = true;
    msgEl.textContent = "Pick an item to upgrade.";
    currentLevel = 0;
    updateUI();
  }

  function renderPickSquare(item) {
    if (!pickSquare) return;
    pickSquare.innerHTML = "";
    if (!item) return;
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.style.width = "60px";
    icon.style.height = "60px";
    icon.style.borderRadius = "8px";
    icon.style.overflow = "hidden";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    if (item.icon) {
      const img = document.createElement("img");
      img.src = item.icon;
      img.style.width = "90%";
      img.style.height = "90%";
      img.style.objectFit = "contain";
      icon.appendChild(img);
    }
    if (item.upgradeLevel && item.upgradeLevel > 0) {
      const badge = document.createElement("div");
      badge.className = "upgrade-badge";
      badge.textContent = "+" + item.upgradeLevel;
      badge.style.position = "absolute";
      badge.style.bottom = "0px";
      badge.style.right = "0px";
      badge.style.background = "rgba(0,0,0,0.6)";
      badge.style.color = "#fff";
      badge.style.fontSize = "12px";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "8px";
      badge.style.transform = "translate(20%,20%)";
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.appendChild(icon);
      wrapper.appendChild(badge);
      pickSquare.appendChild(wrapper);
    } else {
      pickSquare.appendChild(icon);
    }

    const info = document.createElement("div");
    info.style.marginLeft = "8px";
    info.innerHTML =
      '<div style="font-weight:700">' + (item.name || "Item") + "</div>";
    pickSquare.appendChild(info);
  }

  function selectInventoryItem(idx) {
    try {
      if (!window.inventory || !Array.isArray(window.inventory)) return;
      const it = window.inventory[idx];
      if (!it) return;
      selectedIndex = idx;
      selectedItem = it;
      selectedSlot = null;
      if (pickSquare) {
        pickSquare.setAttribute("data-inv-index", String(idx));
        pickSquare.removeAttribute("data-slot");
        pickSquare.setAttribute("title", it.name || "");
      }
      if (typeof selectedItem.upgradeLevel === "undefined")
        selectedItem.upgradeLevel = 0;
      currentLevel = selectedItem.upgradeLevel || 0;
      renderPickSquare(selectedItem);
      upgradeBtn.disabled = false;
      msgEl.textContent = "Selected: " + (selectedItem.name || "Item");
      updateUI();
    } catch (e) {}
  }

  function selectEquippedSlot(slot) {
    try {
      if (!window.equipment) return;
      const it = window.equipment[slot];
      if (!it) return;
      selectedIndex = null;
      selectedItem = it;
      selectedSlot = slot;
      if (pickSquare) {
        pickSquare.setAttribute("data-slot", slot);
        pickSquare.removeAttribute("data-inv-index");
        pickSquare.setAttribute("title", it.name || "");
      }
      if (typeof selectedItem.upgradeLevel === "undefined")
        selectedItem.upgradeLevel = 0;
      currentLevel = selectedItem.upgradeLevel || 0;
      renderPickSquare(selectedItem);
      upgradeBtn.disabled = false;
      msgEl.textContent = "Selected equipped: " + (selectedItem.name || slot);
      updateUI();
    } catch (e) {}
  }
  window.clothesUpgrade = window.clothesUpgrade || {};
  window.clothesUpgrade.selectInventoryIndex = selectInventoryItem;
  window.clothesUpgrade.selectEquippedSlot = selectEquippedSlot;
  window.clothesUpgrade.clearSelection = clearSelection;
  window.clothesUpgrade.selectByItemRef = function (item) {
    const idx = Array.isArray(window.inventory)
      ? window.inventory.indexOf(item)
      : -1;
    if (idx >= 0) return selectInventoryItem(idx);
    if (window.equipment) {
      const slot = Object.keys(window.equipment).find(
        (s) => window.equipment[s] === item
      );
      if (slot) return selectEquippedSlot(slot);
    }
  };

  function clearArrowClasses() {
    arrow.classList.remove("success");
    arrow.classList.remove("failure");
    arrow.classList.remove("charging");
  }

  function applyOutcome(type) {
    clearArrowClasses();
    arrow.offsetWidth;

    if (type === "success") {
      arrow.classList.add("success");
      msgEl.textContent = "Success! Item upgraded.";
    } else if (type === "disupgrade") {
      arrow.classList.add("failure");
      msgEl.textContent = "Disupgrade! You lost one level.";
    } else {
      arrow.classList.add("failure");
      msgEl.textContent = "Failure — upgrade attempt failed.";
    }

    setTimeout(clearArrowClasses, 700);
  }

  function attemptUpgrade() {
    if (upgradeBtn.disabled) return;

    upgradeBtn.disabled = true;
    setTimeout(() => {
      upgradeBtn.disabled = false;
    }, 1500);

    if (!selectedItem) {
      msgEl.textContent = "No item selected.";
      return;
    }

    if (currentLevel >= MAX_LEVEL) {
      msgEl.textContent = "Already at maximum level.";
      return;
    }

    const target = currentLevel + 1;
    const cfg = LEVELS[target];
    if (!cfg) return;

    clearArrowClasses();
    arrow.offsetWidth;
    arrow.classList.add("charging");

    function onChargeEnd(ev) {
      if (ev.animationName !== "arrow-fill-charge") return;
      arrow.removeEventListener("animationend", onChargeEnd);
      arrow.classList.remove("charging");

      const roll = Math.random();
      const success = roll <= cfg.chance;

      if (success) {
        currentLevel = target;
        applyOutcome("success");
      } else {
        if (currentLevel > 0) currentLevel = Math.max(0, currentLevel - 1);
        applyOutcome("disupgrade");
      }
      try {
        if (selectedItem) {
          selectedItem.upgradeLevel = currentLevel;
          applyUpgradesToAll();
          if (typeof window.saveInv === "function") window.saveInv();
          if (typeof window.renderInventory === "function")
            window.renderInventory();
          if (typeof window.save === "function") window.save();
        }
      } catch (e) {}
      updateUI();
    }

    arrow.addEventListener("animationend", onChargeEnd);
  }
  upgradeBtn.addEventListener("click", attemptUpgrade);
  if (clearPickBtn) clearPickBtn.addEventListener("click", clearSelection);
  function bagClickHandler(e) {
    const el = e.target.closest ? e.target.closest(".item") : null;
    if (!el) return;
    const idx = el.getAttribute && el.getAttribute("data-inv-index");
    const invTabUpgrade = document.getElementById("invTabUpgrade");
    const isUpgradeTabVisible =
      invTabUpgrade && invTabUpgrade.classList.contains("active");
    if (!isUpgradeTabVisible) return;
    if (idx != null) {
      try {
        e.stopImmediatePropagation();
      } catch (er) {}
      try {
        e.preventDefault();
      } catch (er) {}
      selectInventoryItem(Number(idx));
    }
  }

  if (bagGrid) {
    bagGrid.addEventListener("click", bagClickHandler, true);
  } else {
    document.addEventListener("click", bagClickHandler, true);
  }

  if (equipGrid) {
    equipGrid.addEventListener("click", function (e) {
      const slotEl = e.target.closest && e.target.closest(".slot");
      if (!slotEl) return;
      const slot = slotEl.getAttribute("data-slot");
      if (slot) selectEquippedSlot(slot);
    });
  }

  if (pickSquare) {
    pickSquare.addEventListener("click", function (e) {
      if (selectedItem) return;
      const invIdx =
        pickSquare.getAttribute && pickSquare.getAttribute("data-inv-index");
      const slot =
        pickSquare.getAttribute && pickSquare.getAttribute("data-slot");
      const equipped =
        pickSquare.getAttribute && pickSquare.getAttribute("data-equipped");
      if (invIdx != null) {
        selectInventoryItem(Number(invIdx));
        return;
      }
      if (slot) {
        selectEquippedSlot(slot);
        return;
      }
      const title = pickSquare.title || pickSquare.getAttribute("title") || "";
      if (title) {
        if (Array.isArray(window.inventory)) {
          const idx = window.inventory.findIndex(
            (i) => i && (i.name === title || i.id === title)
          );
          if (idx >= 0) {
            selectInventoryItem(idx);
            return;
          }
        }
        if (window.equipment) {
          const slotKey = Object.keys(window.equipment).find((k) => {
            const it = window.equipment[k];
            return it && (it.name === title || it.id === title);
          });
          if (slotKey) {
            selectEquippedSlot(slotKey);
            return;
          }
        }
      }

      const img = pickSquare.querySelector && pickSquare.querySelector("img");
      const src = img && img.src;
      if (src) {
        if (Array.isArray(window.inventory)) {
          const idx = window.inventory.findIndex(
            (i) => i && i.icon && i.icon === src
          );
          if (idx >= 0) {
            selectInventoryItem(idx);
            return;
          }
        }
        if (window.equipment) {
          const slotKey = Object.keys(window.equipment).find((k) => {
            const it = window.equipment[k];
            return it && it.icon && it.icon === src;
          });
          if (slotKey) {
            selectEquippedSlot(slotKey);
            return;
          }
        }
      }
      msgEl.textContent = "No selectable item found in pick box.";
    });
  }

  updateUI();
  msgEl.textContent = "Pick an item to upgrade.";
  if (upgradeBtn) upgradeBtn.disabled = true;

  let _applyingUpgrades = false;
  function applyUpgradeToItem(item) {
    if (!item) return;
    if (!item._base) {
      item._base = {};
      if (typeof item.perClick !== "undefined")
        item._base.perClick = item.perClick;
      if (typeof item.perSecond !== "undefined")
        item._base.perSecond = item.perSecond;
      if (typeof item.crit !== "undefined") item._base.crit = item.crit;
    }
    if (typeof item._base.perClick !== "undefined")
      item.perClick = item._base.perClick;
    if (typeof item._base.perSecond !== "undefined")
      item.perSecond = item._base.perSecond;
    if (typeof item._base.crit !== "undefined") item.crit = item._base.crit;

    const lvl = item.upgradeLevel || 0;
    if (lvl <= 0) return;
    const cfg = LEVELS[lvl];
    const bonus = cfg ? cfg.bonus : 0;
    const mult = 1 + bonus / 100;
    if (typeof item._base.perClick !== "undefined")
      item.perClick = item._base.perClick * mult;
    if (typeof item._base.perSecond !== "undefined")
      item.perSecond = item._base.perSecond * mult;
    if (typeof item._base.crit !== "undefined")
      item.crit = item._base.crit * mult;
  }

  function applyUpgradesToAll() {
    if (_applyingUpgrades) return;
    _applyingUpgrades = true;
    try {
      if (Array.isArray(window.inventory)) {
        window.inventory.forEach(function (it) {
          try {
            applyUpgradeToItem(it);
          } catch (e) {}
        });
      }
      if (window.equipment) {
        Object.keys(window.equipment).forEach(function (k) {
          try {
            applyUpgradeToItem(window.equipment[k]);
          } catch (e) {}
        });
      }
      if (typeof recomputeFromEquipment === "function")
        recomputeFromEquipment();
      if (typeof render === "function") render();
    } catch (e) {}
    _applyingUpgrades = false;
  }

  document.addEventListener("inventory:rendered", function () {
    applyUpgradesToAll();
    if (selectedIndex !== null) {
      selectInventoryItem(selectedIndex);
    } else if (selectedSlot) {
      selectEquippedSlot(selectedSlot);
    }
  });

  setTimeout(applyUpgradesToAll, 20);
})();
