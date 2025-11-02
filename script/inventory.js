(function () {
  const SLOTS = ["hat", "shirt", "pants", "boots", "ring", "jewel"];

  // small DOM cache for hot element lookups inside inventory
  const __invEl = Object.create(null);
  function $get(id) {
    if (!id) return null;
    if (Object.prototype.hasOwnProperty.call(__invEl, id)) return __invEl[id];
    const el = document.getElementById(id);
    __invEl[id] = el || null;
    return __invEl[id];
  }

  window.equipment = window.equipment || {
    hat: null,
    shirt: null,
    pants: null,
    boots: null,
    ring: null,
    jewel: null,
  };
  window.inventory = window.inventory || [];
  window.invMax = window.invMax || 10;

  if (typeof window.equipManualClick === "undefined")
    window.equipManualClick = 0;
  if (typeof window.equipPassivePS === "undefined") window.equipPassivePS = 0;
  if (typeof window.critFromItems === "undefined") window.critFromItems = 0;

  function loadInv() {
    try {
      const eqRaw = localStorage.getItem("pc:eq");
      const invRaw = localStorage.getItem("pc:inv");
      if (eqRaw) {
        const eqParsed = JSON.parse(eqRaw);
        if (eqParsed && typeof eqParsed === "object") {
          equipment = Object.assign(equipment, eqParsed);
        }
      }
      if (invRaw) {
        const invParsed = JSON.parse(invRaw);
        if (Array.isArray(invParsed)) {
          inventory = invParsed;
        }
      }
    } catch (e) {
      console.warn("loadInv failed:", e);
    }
  }

  function saveInv() {
    localStorage.setItem("pc:eq", JSON.stringify(equipment));
    localStorage.setItem("pc:inv", JSON.stringify(inventory));
  }

  window.loadInv = loadInv;
  window.saveInv = saveInv;
  loadInv();

  window.tryAddToInventory = function (item) {
    if (!window.inventory) window.inventory = [];
    if (!window.invMax) window.invMax = 20;
    if (window.inventory.length >= window.invMax) {
      showDialog({
        title: "Inventory Full",
        message:
          "Your inventory is full. Please remove some items before buying new ones.",
        okText: "OK",
      });
      return false;
    }
    try {
      if (!item.icon && item.id) item.icon = "assets/icons/" + item.id + ".png";
    } catch (e) {}
    window.inventory.push(item);
    saveInv();
    renderInventory();
    save();
    return true;
  };

  function recomputeFromEquipment() {
    let clickBonus = 0;
    let passiveBonus = 0;
    let critBonus = 0;
    SLOTS.forEach((slot) => {
      const it = equipment[slot];
      if (!it) return;
      if (it.crit) critBonus += it.crit;
      if (it.perClick) clickBonus += it.perClick;
      if (it.perSecond) passiveBonus += it.perSecond;
    });
    window.critFromItems = critBonus;
    window.equipManualClick = clickBonus;
    window.equipPassivePS = passiveBonus;
    if (typeof recalcTotals === "function") recalcTotals();
  }

  function renderInventory() {
  const bagGrid = $get("bagGrid");
  const equipGrid = $get("equipGrid");
  const cap = $get("invCapacity");
    if (cap) cap.textContent = inventory.length + " / " + invMax;
    if (!bagGrid || !equipGrid) return;

  const capTop = $get("invCapacityTop");
    if (capTop) capTop.textContent = inventory.length + " / " + invMax;

    equipGrid.querySelectorAll(".slot").forEach((el) => {
      const slot = el.getAttribute("data-slot");
      const it = equipment[slot];
      el.innerHTML = "";
      el.classList.remove(
        "rarity-common",
        "rarity-rare",
        "rarity-epic",
        "rarity-legendary"
      );
      if (it && it.rarity) el.classList.add("rarity-" + it.rarity);
      el.classList.toggle("empty", !it);

      if (it) {
        const icon = document.createElement("div");
        icon.className = "icon equipped-badge";
        icon.style.width = "44px";
        icon.style.height = "44px";
        icon.style.display = "flex";
        icon.style.alignItems = "center";
        icon.style.justifyContent = "center";
        icon.style.overflow = "hidden";
        icon.style.borderRadius = "50%";
        icon.style.background =
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))";
        if (it.icon) {
          const img = document.createElement("img");
          img.src = it.icon;
          img.style.width = "70%";
          img.style.height = "70%";
          img.style.objectFit = "contain";
          img.style.display = "block";
          icon.appendChild(img);
        }
        const RARITY_GLOW = {
          common: "0 0 6px rgba(0,0,0,0.22)",
          rare: "0 0 14px rgba(85,150,255,0.38)",
          epic: "0 0 16px rgba(160,50,255,0.62)",
          legendary: "0 0 18px rgba(255,200,60,0.67)",
        };
        if (it.rarity && RARITY_GLOW[it.rarity]) {
          icon.style.boxShadow = RARITY_GLOW[it.rarity];
          icon.style.border = "1px solid rgba(255,255,255,0.04)";
        } else {
          icon.style.boxShadow = "";
          icon.style.border = "";
        }
        if (it.upgradeLevel && it.upgradeLevel > 0) {
          const badge = document.createElement("div");
          badge.className = "upgrade-badge equip-badge";
          badge.textContent = "+" + it.upgradeLevel;
          icon.style.position = "relative";
          icon.appendChild(badge);
        }

        el.appendChild(icon);

        const name = document.createElement("div");
        name.className = "owned-tag";
        name.textContent = it.name;
        el.appendChild(name);

        const statLine = document.createElement("div");
        statLine.className = "equip-statline";

        function fmt(v) {
          return (Math.round(v * 1000) / 1000).toString();
        }

        if (it.crit) statLine.textContent = "+" + fmt(it.crit * 100) + "% crit";
        else if (it.perClick)
          statLine.textContent = "+" + fmt(it.perClick) + " /click";
        else if (it.perSecond)
          statLine.textContent = "+" + fmt(it.perSecond) + " /sec";
        else statLine.textContent = "";

        el.appendChild(statLine);
      } else {
        const span = document.createElement("span");
        span.textContent = slot[0].toUpperCase() + slot.slice(1);
        el.appendChild(span);
      }

      el.onclick = function () {
        if (!equipment[slot]) return;
        if (inventory.length >= invMax) {
          showDialog({
            title: "Inventory Full",
            message: "No space in bag to unequip this item.",
            okText: "OK",
          });
          return;
        }
        inventory.push(equipment[slot]);
        equipment[slot] = null;
        recomputeFromEquipment();
        render();
        renderInventory();
        saveInv();
        save();
      };
    });

    bagGrid.innerHTML = "";
    inventory.forEach((it, idx) => {
      const cell = document.createElement("div");
      cell.className = "item";
      cell.setAttribute("data-inv-index", String(idx));
      if (it.rarity) cell.classList.add("rarity-" + it.rarity);

      const ic = document.createElement("div");
      ic.className = "icon";
      if (it.icon) {
        const img = document.createElement("img");
        img.src = it.icon;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        ic.appendChild(img);
      }
      cell.appendChild(ic);
      if (it.upgradeLevel && it.upgradeLevel > 0) {
        const badge = document.createElement("div");
        badge.className = "upgrade-badge bag-badge";
        badge.textContent = "+" + it.upgradeLevel;
        ic.style.position = "relative";
        ic.appendChild(badge);
      }

      const lab = document.createElement("div");
      lab.className = "label";
      lab.textContent = it.name || "???";
      cell.appendChild(lab);

      const stat = document.createElement("div");
      stat.className = "stat";
      if (it.crit)
        stat.textContent = "+" + Math.round(it.crit * 100) + "% crit";
      else if (it.perClick) stat.textContent = "+" + it.perClick + " /click";
      else if (it.perSecond) stat.textContent = "+" + it.perSecond + " /sec";
      else stat.textContent = "";
      cell.appendChild(stat);

      const trashBtn = document.createElement("button");
      trashBtn.className = "trash-btn";
      trashBtn.setAttribute("title", "Delete item");
      trashBtn.innerText = "🗑";
      trashBtn.onclick = function (e) {
        e.stopPropagation();
        confirmDeleteItem(idx);
      };
      cell.appendChild(trashBtn);

      cell.onclick = function () {
        confirmEquip(idx);
      };

      bagGrid.appendChild(cell);
    });
    try {
      document.dispatchEvent(new CustomEvent("inventory:rendered"));
    } catch (e) {}
  }

  function confirmDeleteItem(index) {
    const now = Date.now();
    const skipUntil = +localStorage.getItem("pc:noAskDelUntil") || 0;
    if (now < skipUntil) {
      inventory.splice(index, 1);
      saveInv();
      renderInventory();
      save();
      return;
    }
    const box = document.createElement("div");
    box.className = "confirm-popup";
    box.innerHTML =
      '\
      <div class="card">\
        <div class="title">Delete Item</div>\
        <div class="sub">Are you sure you want to delete this item?</div>\
        <label><input type="checkbox" id="noAsk1h" /> Don\'t ask again for 1 hour</label>\
        <div class="row" style="justify-content:end;gap:8px;margin-top:8px;">\
          <button class="btn ghost" id="cancelDel">Cancel</button>\
          <button class="btn danger" id="confirmDel">Delete</button>\
        </div>\
      </div>';
    document.body.appendChild(box);
    box.querySelector("#cancelDel").onclick = () => box.remove();
    box.querySelector("#confirmDel").onclick = () => {
      const skip = box.querySelector("#noAsk1h").checked;
      if (skip)
        localStorage.setItem(
          "pc:noAskDelUntil",
          String(Date.now() + 3600 * 1000)
        );
      inventory.splice(index, 1);
      box.remove();
      saveInv();
      renderInventory();
      save();
    };
  }

  function equipFromBag(index) {
    const it = inventory[index];
    if (!it) return;
    const slot = it.type;
    const prev = equipment[slot];
    equipment[slot] = it;
    if (prev) {
      inventory[index] = prev;
    } else {
      inventory.splice(index, 1);
    }
    recomputeFromEquipment();
    render();
    renderInventory();
    saveInv();
    save();
  }

  function confirmEquip(index) {
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    const now = Date.now();
    const skipUntil = +localStorage.getItem("pc:noAskEquipUntil") || 0;
    if (now < skipUntil) {
      equipFromBag(index);
      return;
    }
    const item = inventory[index];
    if (!item) return;
    const box = document.createElement("div");
    box.className = "confirm-popup";
    box.innerHTML =
      '\
      <div class="card">\
        <div class="title">Equip Item</div>\
        <div class="sub">Are you sure you want to equip <strong>' +
      escapeHtml(item.name || "this item") +
      '</strong>?</div>\
        <label><input type="checkbox" id="noAskEq1h" /> Don\'t ask again for 1 hour</label>\
        <div class="row" style="justify-content:end;gap:8px;margin-top:8px;">\
          <button class="btn ghost" id="cancelEq">Cancel</button>\
          <button class="btn primary" id="confirmEq">Equip</button>\
        </div>\
      </div>';
    document.body.appendChild(box);
    box.querySelector("#cancelEq").onclick = () => box.remove();
    box.querySelector("#confirmEq").onclick = () => {
      const skip = box.querySelector("#noAskEq1h").checked;
      if (skip)
        localStorage.setItem(
          "pc:noAskEquipUntil",
          String(Date.now() + 3600 * 1000)
        );
      box.remove();
      equipFromBag(index);
    };
  }

  window.renderInventory = renderInventory;

  function wireActions() {
    const sort = $get("btnSortInv");
    if (sort)
      sort.onclick = function () {
        inventory.sort((a, b) => {
          const t = a.type.localeCompare(b.type);
          if (t !== 0) return t;
          const an = (a.name || "").toString();
          const bn = (b.name || "").toString();
          return an.localeCompare(bn);
        });
        renderInventory();
        saveInv();
      };
  }
  wireActions();

  const inventoryTab = document.querySelector(
    'button.tab[data-panel="inventory"]'
  );
  if (inventoryTab) {
    inventoryTab.addEventListener("click", function () {
      renderInventory();
    });
  }

  const oldRender = window.render;
  window.render = function () {
    if (typeof oldRender === "function") oldRender();
    renderInventory();
  };

  const oldRecompute = window.recomputeDerived;
  window.recomputeDerived = function () {
    if (typeof oldRecompute === "function") oldRecompute();
  };

  recomputeFromEquipment();
})();
