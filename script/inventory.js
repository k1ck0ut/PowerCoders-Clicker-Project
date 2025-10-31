(function () {
  const SLOTS = ["hat", "shirt", "pants", "boots", "ring", "jewel"];

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
    const bagGrid = document.getElementById("bagGrid");
    const equipGrid = document.getElementById("equipGrid");
    const cap = document.getElementById("invCapacity");
    if (cap) {
      cap.textContent = inventory.length + " / " + invMax;
    }

    if (!bagGrid || !equipGrid) return;

    const capTop = document.getElementById("invCapacityTop");
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

      if (it && it.rarity) {
        el.classList.add("rarity-" + it.rarity);
      }

      el.classList.toggle("empty", !it);

      if (it) {
        const icon = document.createElement("div");
        icon.className = "icon";
        if (it.icon) {
          const img = document.createElement("img");
          img.src = it.icon;
          img.style.maxWidth = "32px";
          img.style.maxHeight = "32px";
          img.style.objectFit = "contain";
          icon.appendChild(img);
        }
        el.appendChild(icon);

        const name = document.createElement("div");
        name.className = "owned-tag";
        name.textContent = it.name;
        el.appendChild(name);

        const statLine = document.createElement("div");
        statLine.className = "equip-statline";

        if (it.crit) {
          statLine.textContent = "+" + Math.round(it.crit * 100) + "% crit";
        } else if (it.perClick) {
          statLine.textContent = "+" + it.perClick + " /click";
        } else if (it.perSecond) {
          statLine.textContent = "+" + it.perSecond + " /sec";
        } else {
          statLine.textContent = "";
        }
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
      if (it.rarity) {
        cell.classList.add("rarity-" + it.rarity);
      }

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
        const slot = it.type;
        const prev = equipment[slot];
        equipment[slot] = it;
        if (prev) {
          inventory[idx] = prev;
        } else {
          inventory.splice(idx, 1);
        }
        recomputeFromEquipment();
        render();
        renderInventory();
        saveInv();
        save();
      };

      bagGrid.appendChild(cell);
    });
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
    box.innerHTML = `
      <div class="card">
        <div class="title">Delete Item</div>
        <div class="sub">Are you sure you want to delete this item?</div>
        <label><input type="checkbox" id="noAsk1h" /> Don't ask again for 1 hour</label>
        <div class="row" style="justify-content:end;gap:8px;margin-top:8px;">
          <button class="btn ghost" id="cancelDel">Cancel</button>
          <button class="btn danger" id="confirmDel">Delete</button>
        </div>
      </div>`;
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

  window.renderInventory = renderInventory;

  function wireActions() {
    const sort = document.getElementById("btnSortInv");

    if (sort)
      sort.onclick = function () {
        inventory.sort(
          (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
        );
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
    oldRender && oldRender();
    renderInventory();
  };

  const oldRecompute = window.recomputeDerived;
  window.recomputeDerived = function () {
    oldRecompute && oldRecompute();
  };

  recomputeFromEquipment();
})();
