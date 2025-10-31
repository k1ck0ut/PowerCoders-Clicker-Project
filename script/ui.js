(function () {
  window.logoSrc = function () {
    return ICONS.logoPresets[logoKey] || ICONS.logoPresets.powercoders;
  };

  window.applyIcons = function () {
    if (clickLogo) clickLogo.src = logoSrc();
    if (icoUpg) icoUpg.src = ICONS.upgrades;
    if (icoShop) icoShop.src = ICONS.shop;
    if (icoStats) icoStats.src = ICONS.stats;
    if (icoMap) icoMap.src = ICONS.map;
    if (icoInventory) icoInventory.src = ICONS.inventory;
    if (miniBrainIco) miniBrainIco.src = ICONS.upgradeIcons.brainstorm;
    if (icoCPU) icoCPU.src = ICONS.cpu;
  };

  window.applyTheme = function () {
    document.documentElement.classList.remove(
      "theme-light",
      "theme-neon",
      "theme-green"
    );
    if (theme === "light")
      document.documentElement.classList.add("theme-light");
    if (theme === "neon") document.documentElement.classList.add("theme-neon");
    if (theme === "green")
      document.documentElement.classList.add("theme-green");
  };

  window.applyCurrency = function () {
    if (pSym) pSym.textContent = curr;
    if (pSymInline3) pSymInline3.textContent = curr;
    if (pSymInline4) pSymInline4.textContent = curr;
    document.querySelectorAll(".pSym").forEach(function (n) {
      n.textContent = curr;
    });
    if (centerSymbol) centerSymbol.textContent = curr;
    if (typeof renderUpgrades === "function") renderUpgrades();
  };

  let map3d = {
    inited: false,
    running: false,
    scene: null,
    camera: null,
    renderer: null,
    rafId: null,
    spawnId: null,
    mount: null,
    animateHook: null,
    controls: null,
    homeBtn: null,
    overlays: [],
    spawnId: null,
  };

  function hasProp(obj, name) {
    return Object.prototype.hasOwnProperty.call(obj, name);
  }

  function initMap3D() {
    if (map3d.inited) return;
    map3d.mount = document.getElementById("map3d");
    if (!map3d.mount || !window.THREE) return;

    const rect = map3d.mount.getBoundingClientRect();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e10);

    const camera = new THREE.PerspectiveCamera(
      55,
      rect.width / rect.height,
      0.1,
      2000
    );
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width, rect.height);
    if (hasProp(renderer, "outputColorSpace"))
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;
    map3d.mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(3, 5, 2);
    scene.add(ambient, hemi, dir);

    if (THREE.OrbitControls) {
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 0.8;
      controls.maxDistance = 1000;
      map3d.controls = controls;
    }

    function frameToObject(obj, pad) {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const dist = (maxDim / 2 / Math.tan(fov / 2)) * (pad || 1.25);
      const dirVec = new THREE.Vector3(0, 0.25, 1).normalize();
      camera.position.copy(center.clone().add(dirVec.multiplyScalar(dist)));
      camera.near = Math.max(0.01, dist / 100);
      camera.far = dist * 100;
      camera.updateProjectionMatrix();
      camera.lookAt(center);
    }

    function latLonToUnit(lonDeg, latDeg) {
      const lon = THREE.MathUtils.degToRad(lonDeg);
      const lat = THREE.MathUtils.degToRad(latDeg);
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      return new THREE.Vector3(x, y, z);
    }

    function makeMarkerSprite(radius) {
      const r = radius || 0.02;
      const texSize = 128;
      const cvs = document.createElement("canvas");
      cvs.width = cvs.height = texSize;
      const ctx = cvs.getContext("2d");
      const grd = ctx.createRadialGradient(
        texSize / 2,
        texSize / 2,
        6,
        texSize / 2,
        texSize / 2,
        texSize / 2
      );
      grd.addColorStop(0, "rgba(255,80,80,1)");
      grd.addColorStop(1, "rgba(255,80,80,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(texSize / 2, texSize / 2, texSize / 2, 0, Math.PI * 2);
      ctx.fill();
      const texture = new THREE.CanvasTexture(cvs);
      if (hasProp(texture, "colorSpace"))
        texture.colorSpace = THREE.SRGBColorSpace;
      else texture.encoding = THREE.sRGBEncoding;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.setScalar(r);
      return sprite;
    }

    function projectToScreen(worldPos) {
      const p = worldPos.clone().project(camera);
      const w = map3d.renderer.domElement.clientWidth;
      const h = map3d.renderer.domElement.clientHeight;
      return {
        x: (p.x * 0.5 + 0.5) * w,
        y: (-p.y * 0.5 + 0.5) * h,
        behind: p.z > 1 || p.z < -1,
      };
    }

    function makeOverlayButton(text) {
      const b = document.createElement("button");
      b.textContent = text;
      b.className = "btn small map-float";
      b.style.position = "absolute";
      b.style.transform = "translate(-50%,-50%)";
      b.style.pointerEvents = "auto";
      b.style.zIndex = "2";
      map3d.mount.appendChild(b);
      map3d.overlays.push(b);
      return b;
    }

    const MODEL_PATH = "assets/models/earth.glb";
    const manager = new THREE.LoadingManager();
    const loader = new THREE.GLTFLoader(manager);

    loader.load(
      MODEL_PATH,
      function (gltf) {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);

        model.traverse(function (o) {
          if (!o.isMesh) return;
          const oldMat = o.material;
          const tex = oldMat && oldMat.map ? oldMat.map : null;
          if (tex) {
            if (hasProp(tex, "colorSpace"))
              tex.colorSpace = THREE.SRGBColorSpace;
            else tex.encoding = THREE.sRGBEncoding;
          }
          o.material = new THREE.MeshBasicMaterial({
            map: tex || null,
            color: 0xffffff,
            side: THREE.DoubleSide,
          });
          if (o.geometry && o.geometry.computeVertexNormals)
            o.geometry.computeVertexNormals();
        });

        scene.add(model);
        frameToObject(model, 1.25);

        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const globeRadius = Math.max(size.x, size.y, size.z) * 0.5;

        const homeLat = 47.3769;
        const homeLon = 8.5417;
        const homeDir = latLonToUnit(homeLon, homeLat);
        const home = makeMarkerSprite();
        home.scale.setScalar(globeRadius * 0.08);
        home.position.copy(homeDir.clone().multiplyScalar(globeRadius * 1.002));
        model.add(home);

        const cityBtn = document.getElementById("btnCity");
        const cityOverlay = document.getElementById("cityOverlay");
        const closeCity = document.getElementById("closeCity");

        if (cityBtn && cityOverlay) {
          cityBtn.addEventListener("click", () => {
            cityOverlay.classList.add("active");
          });
        }

        if (closeCity && cityOverlay) {
          closeCity.addEventListener("click", () => {
            cityOverlay.classList.remove("active");
          });
        }

        function placeOverlayForPoint(v3, btn) {
          const sp = projectToScreen(v3);
          if (sp.behind) {
            btn.style.display = "none";
            return;
          }
          btn.style.display = "block";
          btn.style.left = sp.x + "px";
          btn.style.top = sp.y - 20 + "px";
        }

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const pickingSphere = new THREE.Mesh(
          new THREE.SphereGeometry(globeRadius * 1.001, 64, 32),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        model.add(pickingSphere);

        map3d.mount.addEventListener("pointerdown", function (e) {
          const r = map3d.mount.getBoundingClientRect();
          mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObject(pickingSphere, true);
          if (hits.length) {
            const p = hits[0].point.clone().sub(model.position).normalize();
            home.position.copy(p.multiplyScalar(globeRadius * 1.002));
          }
        });

        function spawnRefugeeEvent() {
          const lat = -80 + Math.random() * 160;
          const lon = -180 + Math.random() * 360;
          const dir = latLonToUnit(lon, lat);
          const pos = dir.clone().multiplyScalar(globeRadius * 1.002);
          const marker = makeMarkerSprite();
          marker.scale.setScalar(globeRadius * 0.06);
          marker.position.copy(pos);
          model.add(marker);

          const btn = makeOverlayButton("Help Refugee");
          const createdAt = performance.now();
          const lifetime = 12000;
          const tick = function () {
            const now = performance.now();
            placeOverlayForPoint(
              marker.getWorldPosition(new THREE.Vector3()),
              btn
            );
            if (now - createdAt > lifetime) {
              btn.remove();
              map3d.overlays = map3d.overlays.filter((x) => x !== btn);
              model.remove(marker);
              return;
            }
            btn._raf = requestAnimationFrame(tick);
          };
          btn._raf = requestAnimationFrame(tick);

          btn.addEventListener("click", function () {
            pc += 50;
            render();
            save();
            if (btn._raf) cancelAnimationFrame(btn._raf);
            btn.remove();
            map3d.overlays = map3d.overlays.filter((x) => x !== btn);
            model.remove(marker);
          });
        }

        const startT = performance.now();
        const baseScale = home.scale.x;
        const prevHook = map3d.animateHook;
        map3d.animateHook = function () {
          if (prevHook) prevHook();
          model.rotation.y += 0.0005;
          const t = (performance.now() - startT) / 1000;
          const s = baseScale * (1 + 0.15 * Math.sin(t * 3.2));
          home.scale.setScalar(s);
          if (map3d.controls && map3d.controls.update) map3d.controls.update();
          if (map3d.homeBtn)
            placeOverlayForPoint(
              home.getWorldPosition(new THREE.Vector3()),
              map3d.homeBtn
            );
        };

        spawnRefugeeEvent();
        setInterval(spawnRefugeeEvent, 8000);
      },
      undefined,
      function (err) {
        const geo = new THREE.BoxGeometry();
        const mat = new THREE.MeshStandardMaterial({
          metalness: 0.1,
          roughness: 0.4,
          color: 0x7bd88f,
        });
        const cube = new THREE.Mesh(geo, mat);
        scene.add(cube);
        const box = new THREE.Box3().setFromObject(cube);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.2;
        camera.position.set(0, 0, dist * 1.2);
        camera.near = Math.max(0.01, dist / 100);
        camera.far = dist * 100;
        camera.updateProjectionMatrix();
        camera.lookAt(new THREE.Vector3());
        map3d.animateHook = function () {
          cube.rotation.y += 0.01;
          if (map3d.controls && map3d.controls.update) map3d.controls.update();
        };
      }
    );

    map3d.scene = scene;
    map3d.camera = camera;
    map3d.renderer = renderer;
    map3d.inited = true;

    window.addEventListener("resize", function () {
      if (!map3d.inited) return;
      const r = map3d.mount.getBoundingClientRect();
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
    });
  }

  function startMap3D() {
    if (!map3d.inited || map3d.running) return;
    map3d.running = true;
    const animate = function () {
      if (!map3d.running) return;
      if (typeof map3d.animateHook === "function") map3d.animateHook();
      map3d.renderer.render(map3d.scene, map3d.camera);
      map3d.rafId = requestAnimationFrame(animate);
    };
    map3d.rafId = requestAnimationFrame(animate);
  }

  function stopMap3D() {
    map3d.running = false;
    if (map3d.rafId) cancelAnimationFrame(map3d.rafId);
    map3d.rafId = null;
    if (map3d.overlays && map3d.overlays.length) {
      map3d.overlays.forEach(function (b) {
        try {
          b.remove();
        } catch (e) {}
      });
      map3d.overlays = [];
    }
  }

  window.populateSettings = function () {
    if (themeSel) themeSel.value = theme;

    if (styleSel) {
      styleSel.innerHTML = "";
      Object.keys(STYLE_PRESETS || {}).forEach(function (k) {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = k;
        styleSel.appendChild(o);
      });
      styleSel.value = getStyleKeyFromState();
    }

    const effectsToggle = document.getElementById("effectsToggle");
    if (effectsToggle) {
      effectsToggle.checked = !window.effectsEnabled;
      effectsToggle.addEventListener("change", function () {
        window.effectsEnabled = !this.checked;
        localStorage.setItem("pc:effects", window.effectsEnabled ? "1" : "0");
      });
    }

    const sfxToggle = document.getElementById("sfxToggle");
    if (sfxToggle) {
      sfxToggle.checked = window.sfxEnabled;
      sfxToggle.addEventListener("change", function () {
        window.sfxEnabled = this.checked;
        localStorage.setItem("pc:sfx", window.sfxEnabled ? "1" : "0");
      });
    }

    const musicToggle = document.getElementById("musicToggle");
    if (musicToggle) {
      musicToggle.checked = window.musicEnabled;
      musicToggle.addEventListener("change", function () {
        window.musicEnabled = this.checked;
        localStorage.setItem("pc:music", window.musicEnabled ? "1" : "0");
        if (window.musicEnabled) playBackgroundMusic();
        else stopBackgroundMusic();
      });
    }

    const volumeSlider = document.getElementById("musicVolume");
    if (volumeSlider) {
      const sliderVal = window.getSavedMusicSliderValue();
      volumeSlider.value = sliderVal;

      if (window.bgMusic) {
        window.setMusicVolumeSliderValue(sliderVal);
      }

      volumeSlider.addEventListener("input", function () {
        const v = parseFloat(this.value);
        window.setMusicVolumeSliderValue(v);
      });
    }
  };

  window.getStyleKeyFromState = function () {
    const match = Object.keys(STYLE_PRESETS).find(function (k) {
      const s = STYLE_PRESETS[k];
      return s.logoKey === logoKey && s.currency === curr;
    });
    return match || "powercoders";
  };

  window.closeAllPanels = function () {
    Object.values(panels).forEach(function (p) {
      if (p) p.classList.remove("active");
    });
  };

  window.openPanel = function (name) {
    Object.values(panels).forEach(function (p) {
      if (p) p.classList.remove("active");
    });
    if (panels[name]) panels[name].classList.add("active");
    if (centerSymbol) {
      if (name) centerSymbol.style.opacity = "0.06";
    }
    if (name === "map") {
      initMap3D();
      startMap3D();
    } else {
      stopMap3D();
    }
  };

  window.showPlus = function (amount, isCrit, evt) {
    if (!effectsEnabled) return;
    const el = document.createElement("div");
    el.className = "plus-text";
    if (isCrit) el.classList.add("crit");
    el.textContent = "+" + formatCompact(amount);
    el.style.left = evt.clientX + "px";
    el.style.top = evt.clientY - 20 + "px";
    document.body.appendChild(el);
    el.addEventListener("animationend", function () {
      el.remove();
    });
  };

  window.spawnRain = function (n) {
    if (!effectsEnabled) return;
    n = n || 1;
    const rect = playfield.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "fall";
      const img = document.createElement("img");
      img.src = logoSrc();
      s.appendChild(img);
      const x = Math.random() * (rect.width - 40) - rect.width / 2;
      s.style.setProperty("--x", x + "px");
      s.style.setProperty("--dur", 3.6 + Math.random() * 1 + "s");
      s.style.left = rect.width / 2 + "px";
      s.style.top = "0px";
      playfield.appendChild(s);
      s.addEventListener("animationend", function () {
        s.remove();
      });
    }
  };

  window.bump = function (el) {
    el.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.06)" },
        { transform: "scale(1)" },
      ],
      { duration: 120, easing: "ease-out" }
    );
  };

  window.render = function () {
    const critEl = document.getElementById("critChanceStat");
    const multEl = document.getElementById("critMultStat");
    if (critEl) critEl.textContent = Math.round(totalCritChance() * 100) + "%";
    if (multEl) multEl.textContent = "x" + critMultiplier;
    if (elPC) elPC.textContent = formatCompact(Math.floor(pc));
    if (elUSD) elUSD.textContent = formatCompact(Math.floor(usd));
    if (elCPU) elCPU.textContent = formatCompact(Math.floor(cpu));
    if (elPerClick) elPerClick.textContent = formatCompact(getPerClick());
    if (elTotal) elTotal.textContent = formatCompact(totalClicks);
    if (miniBrainX) miniBrainX.textContent = "x" + formatCompact(brainLvl);
    if (typeof elPerSecond !== "undefined" && elPerSecond)
      elPerSecond.textContent = formatCompact(pcps);
    const centerAmountEl = document.getElementById("centerAmount");
    if (centerAmountEl) {
      centerAmountEl.textContent = Math.floor(pc).toLocaleString("en-US");
    }

    renderUpgrades();
    const bCost = brainCost();
    if (spanBrainCost) spanBrainCost.textContent = formatCompact(bCost);
    if (btnBrain) btnBrain.disabled = pc < bCost;
    if (brainLvl >= 10 && !shopUnlocked) {
      if (unlockShopCard) unlockShopCard.classList.remove("hidden");
      const cost = shopCost();
      if (spanShopCost) spanShopCost.textContent = formatCompact(cost);
      if (btnShop) btnShop.disabled = pc < cost;
    } else {
      if (unlockShopCard) unlockShopCard.classList.add("hidden");
    }
    if (tabShopBtn) tabShopBtn.disabled = !shopUnlocked;
    if (rebirthBtn) rebirthBtn.disabled = pc < 1000;
    checkAchievements();
  };

  window.checkAchievements = function () {
    achievements.forEach(function (a) {
      if (
        !achievementsUnlocked[a.id] &&
        typeof a.condition === "function" &&
        a.condition()
      ) {
        achievementsUnlocked[a.id] = true;
        localStorage.setItem("pc:ach:" + a.id, "1");
        if (typeof a.reward === "function") a.reward();
      }
    });
    renderAchievements();
  };

  window.renderUpgrades = function () {
    if (upgradeListMain) {
      upgradeListMain.innerHTML = "";

      mainUpgrades.forEach(function (u) {
        const unlockKey = "pc:unlockedUpg:" + u.id;
        const alreadyUnlocked =
          localStorage.getItem(unlockKey) === "1" ? true : false;

        let canShow = alreadyUnlocked;
        if (!canShow) {
          if (!u.unlockAt || pc >= u.unlockAt) {
            canShow = true;
            localStorage.setItem(unlockKey, "1");
          }
        }
        if (!canShow) return;

        const lvl = upgradeLevels[u.id] || 0;
        const cost = u.costFunc ? u.costFunc(lvl) : u.cost || 0;

        const baseInc = u.baseIncome || u.increment || 0;
        const rData = refineData[u.id] || { mult: 1, tiersUnlocked: 0 };
        const multLocal = rData.mult || 1;
        const perLevelRaw = baseInc * multLocal * globalIncomeMult;

        const perLevelRounded =
          perLevelRaw >= 100
            ? Math.round(perLevelRaw)
            : Number(perLevelRaw.toFixed(2));

        const perLevelShown = formatNiceUpgrade(perLevelRounded);

        const card = document.createElement("div");
        card.className = "card upgrade-card";

        const seenKey = "pc:seenUpg:" + u.id;
        const isFirstTimeVisible = !localStorage.getItem(seenKey);
        if (isFirstTimeVisible) {
          card.classList.add("new");
          setTimeout(() => {
            localStorage.setItem(seenKey, "1");
          }, 10000);
        }
        const row = document.createElement("div");
        row.className = "row";

        const infoRow = document.createElement("div");
        infoRow.className = "row gap";

        const img = document.createElement("img");
        img.className = "inline-ico";
        img.alt = u.name;
        img.src = u.icon;
        infoRow.appendChild(img);

        const info = document.createElement("div");

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = u.name;
        const lvlSpan = document.createElement("span");
        lvlSpan.className = "level";
        lvlSpan.textContent = "Lvl " + lvl;
        title.appendChild(lvlSpan);
        info.appendChild(title);

        const sub = document.createElement("div");
        sub.className = "sub";
        if (u.effectType === "perClick") {
          sub.textContent =
            "+" + perLevelShown + " " + curr + " per click / lvl";
        } else if (u.effectType === "perSecond") {
          sub.textContent =
            "+" + perLevelShown + " " + curr + " per second / lvl";
        } else {
          sub.textContent = "";
        }
        info.appendChild(sub);

        if (rData.tiersUnlocked > 0) {
          const mkDiv = document.createElement("div");
          mkDiv.className = "sub";
          mkDiv.textContent =
            "Refining Mk" + rData.tiersUnlocked + " (x" + rData.mult + ")";
          info.appendChild(mkDiv);
        }

        infoRow.appendChild(info);
        row.appendChild(infoRow);

        const wanted =
          buyMode === "max" ? maxAffordable(u, lvl, pc) : Number(buyMode) || 1;
        const safeWanted = wanted > 0 ? wanted : 1;
        const total = totalCostFor(u, lvl, safeWanted);

        const buyBtn = document.createElement("button");
        buyBtn.className = "btn primary";
        buyBtn.setAttribute("data-buy", u.id);

        if (wanted > 1) {
          buyBtn.textContent =
            "Buy x" + wanted + " " + formatCompact(total) + " " + curr;
        } else {
          buyBtn.textContent = "Buy " + formatCompact(cost) + " " + curr;
        }

        if (pc < total || wanted <= 0) buyBtn.disabled = true;

        row.appendChild(buyBtn);

        card.appendChild(row);
        upgradeListMain.appendChild(card);
      });
    }

    if (upgradeListSpecial) {
      upgradeListSpecial.innerHTML = "";

      const list = specialUpgrades
        .filter(function (s) {
          return typeof s.condition === "function" ? s.condition() : true;
        })
        .slice();

      list.sort(function (a, b) {
        const oa = specialOwned[a.id] || false;
        const ob = specialOwned[b.id] || false;
        return oa === ob ? 0 : oa ? 1 : -1;
      });

      list.forEach(function (s) {
        const owned = specialOwned[s.id];
        const cost = s.costFunc ? s.costFunc() : s.cost || 0;

        const card = document.createElement("div");
        card.className = "card upgrade-card" + (owned ? " owned" : "");

        const row = document.createElement("div");
        row.className = "row";

        const infoRow = document.createElement("div");
        infoRow.className = "row gap";

        const img = document.createElement("img");
        img.className = "inline-ico";
        img.alt = s.name;
        img.src = s.icon;
        infoRow.appendChild(img);

        const info = document.createElement("div");

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = s.name;
        info.appendChild(title);

        const sub = document.createElement("div");
        sub.className = "sub";
        sub.textContent = s.desc || "";
        info.appendChild(sub);

        infoRow.appendChild(info);
        row.appendChild(infoRow);

        const actionWrap = document.createElement("div");

        if (!owned) {
          const buyBtn = document.createElement("button");
          buyBtn.className = "btn primary";
          buyBtn.setAttribute("data-buy", s.id);
          buyBtn.textContent = "Buy " + formatCompact(cost) + " " + curr;
          if (pc < cost) buyBtn.disabled = true;
          actionWrap.appendChild(buyBtn);
        } else if (s.sellable) {
          const sellBtn = document.createElement("button");
          sellBtn.className = "btn";
          sellBtn.setAttribute("data-sell", s.id);
          const refund = Math.floor(cost * 0.75);
          sellBtn.textContent = "Sell +" + formatCompact(refund) + " " + curr;
          actionWrap.appendChild(sellBtn);
        }

        row.appendChild(actionWrap);
        card.appendChild(row);
        upgradeListSpecial.appendChild(card);
      });
    }
  };

  window.renderAchievements = function () {
    const listEl = document.getElementById("achievementsList");
    if (!listEl) return;
    listEl.innerHTML = "";
    achievements.forEach(function (a) {
      const unlocked = achievementsUnlocked[a.id];
      const item = document.createElement("div");
      item.className = "achievement" + (unlocked ? "" : " locked");
      const info = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = a.name;
      title.className = "title";
      const desc = document.createElement("div");
      desc.className = "desc";
      if (unlocked) {
        const text = a.desc.replace(/\{P\.\}/g, curr);
        desc.textContent = text;
      } else {
        desc.textContent = "???";
      }
      info.appendChild(title);
      info.appendChild(desc);
      item.appendChild(info);
      const status = document.createElement("div");
      status.textContent = unlocked ? "Unlocked" : "";
      status.style.fontWeight = "700";
      status.style.fontSize = "11px";
      item.appendChild(status);
      listEl.appendChild(item);
    });
  };
  (function setupCityWiring() {
    var cityBtn = document.getElementById("btnCity");
    var closeCity = document.getElementById("closeCity");
    if (cityBtn)
      cityBtn.addEventListener("click", function () {
        openPanel("city");
      });
    if (closeCity)
      closeCity.addEventListener("click", function () {
        openPanel("map");
      });
  })();
  window.showDialog = function (opts) {
    const {
      title = "Message",
      message = "",
      okText = "OK",
      cancelText = null,
      onOk = null,
      onCancel = null,
    } = opts || {};

    const existing = document.querySelector(".game-dialog");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.className = "game-dialog";
    wrap.innerHTML = `
    <div class="game-dialog-backdrop"></div>
    <div class="game-dialog-box">
      <div class="title">${title}</div>
      <div class="msg">${message}</div>
      <div class="buttons">
        ${
          cancelText
            ? `<button class="btn ghost cancel">${cancelText}</button>`
            : ""
        }
        <button class="btn ok">${okText}</button>
      </div>
    </div>
  `;
    document.body.appendChild(wrap);
    wrap
      .querySelector(".game-dialog-backdrop")
      .addEventListener("click", () => {
        if (!cancelText) {
          wrap.remove();
          if (onCancel) onCancel();
        }
      });

    const okBtn = wrap.querySelector(".ok");
    const cancelBtn = wrap.querySelector(".cancel");

    okBtn.addEventListener("click", () => {
      wrap.remove();
      if (onOk) onOk();
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        wrap.remove();
        if (onCancel) onCancel();
      });
    }
  };
})();
