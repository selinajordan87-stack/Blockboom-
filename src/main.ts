import "./ui/style.css";
import * as T from "three";
import {
  World,
  TYPES,
  place,
  remove,
  canPlace,
  type Cell,
} from "./world/World";
import { WorldView, colors } from "./world/Renderer";
import { Player } from "./player/Player";
import { Fishing, Inventory, FISH } from "./fishing/Fishing";
import { ReadingEngine, mission } from "./learning/Learning";
import { explode } from "./boom/Boom";
import { load, persist, SAVE_KEY, type Save } from "./storage/Save";
const $ = <E extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as E;
$("app").innerHTML = `
<canvas id="world" aria-label="BLOCKBOOM 3D-Spielwelt"></canvas>
<div id="hud" hidden>
 <header><a class="brand" id="brand">BLOCK<span>BOOM</span><small>DEINE KLEINE GROSSE WELT</small></a><div class="top-right"><span class="save-state" id="save-state">Lokal gespeichert</span><button id="bag" aria-label="Inventar öffnen">▦ <span>Inventar</span></button><button id="menu" aria-label="Menü öffnen">☰</button></div></header>
 <div class="location"><i></i><span id="location">Wiesenland</span><small>ENTDECKEN · BAUEN · AUSPROBIEREN</small></div>
 <div id="mission-pin" hidden><span>FREIWILLIGER AUFTRAG</span><b>Fange einen Barsch.</b></div>
 <div class="crosshair">+</div><div id="target-label"></div>
 <div id="context"><span id="context-text"></span><button id="interact">E · Interagieren</button><button id="reset-boom" hidden>↻ Aufbau</button></div>
 <div id="toast" role="status"></div>
 <div id="look" aria-label="Zum Umsehen wischen"></div>
 <div id="joystick" aria-label="Bewegungsjoystick"><div id="stick"></div></div>
 <div class="touch-actions"><button id="jump" aria-label="Springen">↑</button><button id="break" aria-label="Block entfernen">−</button><button id="place" aria-label="Block platzieren">+</button></div>
 <footer><div class="hotbar" id="hotbar"></div><span class="desktop-help">WASD bewegen · Maus umsehen · Leertaste springen<br>Links abbauen · Rechts bauen · E benutzen · I Inventar</span><span class="mobile-help">Links bewegen · rechts umsehen</span></footer>
</div>
<section class="overlay" id="start"><div class="start-copy"><div class="eyebrow">SANDBOX-ABENTEUER · v0.1</div><h1>BLOCK<span>BOOM</span><i>Eine Welt voller Möglichkeiten.</i></h1><p>Ein See voller Fische. Platz für deine Ideen.<br>Und ein guter Ort, um alles krachen zu lassen.</p><button class="primary" id="play">Los geht’s <span>↗</span></button><div class="start-meta"><span>◈ Bauen</span><span>≈ Angeln</span><span>✦ BOOM!</span></div><small>Deine Welt bleibt auf diesem Gerät. Ohne Anmeldung.</small></div><div class="world-note"><span>01 / WIESENLAND</span><b>Dein Abenteuer<br>beginnt hier.</b><p>Schau dich um. Mach es zu deiner Welt.</p></div></section>
<section class="overlay panel-overlay" id="modal" hidden><article class="panel"><div class="panel-head"><span id="panel-tag"></span><button id="close" aria-label="Schließen">✕</button></div><div id="panel-content"></div></article></section>
`;
const canvas = $<HTMLCanvasElement>("world");
let renderer: T.WebGLRenderer;
try {
  renderer = new T.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
} catch {
  $("start").innerHTML =
    '<div class="panel"><h2>3D ist gerade nicht verfügbar</h2><p>Bitte öffne BLOCKBOOM in einem aktuellen Browser mit aktiviertem WebGL.</p></div>';
  throw new Error("WebGL unavailable");
}
const scene = new T.Scene();
scene.background = new T.Color(0xb5dcdf);
scene.fog = new T.Fog(0xb5dcdf, 24, 66);
const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.08, 80);
camera.rotation.order = "YXZ";
scene.add(new T.HemisphereLight(0xeaf8ff, 0x7e8660, 2.1));
const sun = new T.DirectionalLight(0xffefce, 2);
sun.position.set(-12, 26, 9);
scene.add(sun);
const world = new World(),
  player = new Player(world),
  inventory = new Inventory(),
  fishing = new Fishing();
let reading = new ReadingEngine(),
  settings = { sound: false, quality: 1.5 },
  saved = safeLoad(),
  started = false,
  paused = false,
  selected = 0;
if (saved) {
  world.apply(saved.changes);
  player.pos = saved.position;
  player.yaw = saved.yaw;
  player.pitch = saved.pitch;
  inventory.fish = saved.fish;
  reading = new ReadingEngine(saved.progress, saved.missionActive);
  settings = saved.settings;
  player.safeSpawn();
}
function safeLoad() {
  try {
    return load(localStorage);
  } catch {
    return null;
  }
}
const view = new WorldView(world, scene);
view.update();
const water = new T.Mesh(
  new T.CircleGeometry(1, 48),
  new T.MeshPhongMaterial({
    color: 0x4daeba,
    transparent: true,
    opacity: 0.76,
    shininess: 65,
    side: T.DoubleSide,
  }),
);
water.scale.set(6.4, 6.15, 1);
water.rotation.x = -Math.PI / 2;
water.position.set(-9.8, 0.38, -4.9);
scene.add(water);
// A few distant block clouds and hand-built signs; all artwork is generated here.
const cloudMaterial = new T.MeshLambertMaterial({ color: 0xf4f6e9 });
const cube = new T.BoxGeometry(1, 1, 1);
for (const [x, z] of [
  [-16, -18],
  [9, -23],
  [21, 12],
  [-22, 18],
]) {
  const cloud = new T.Mesh(cube, cloudMaterial);
  cloud.position.set(x, 14, z);
  cloud.scale.set(7, 1.2, 3);
  scene.add(cloud);
}
function sign(text: string, x: number, z: number, color: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#183e38";
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 150);
  ctx.fillStyle = "#fff4d9";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 94);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.PlaneGeometry(3.5, 1.1),
    new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }),
  );
  m.position.set(x, 2.8, z);
  scene.add(m);
  const post = new T.Mesh(cube, new T.MeshLambertMaterial({ color: 0x765940 }));
  post.scale.set(0.15, 2, 0.15);
  post.position.set(x, 1.8, z);
  scene.add(post);
}
sign("SEESTEG", -11, 4, "#8bd4d7");
sign("BAUPLATZ", 1, 5, "#b7d88b");
sign("BOOM-ZONE", 14, 16, "#efb453");
// Buoys mark the test area's boundary without blocking access.
for (let x = 9; x <= 19; x += 2) {
  for (const z of [6, 16]) {
    const m = new T.Mesh(cube, new T.MeshLambertMaterial({ color: 0xe7b75a }));
    m.scale.set(0.25, 0.6, 0.25);
    m.position.set(x, 0.95, z);
    scene.add(m);
  }
}
const preview = new T.Mesh(
  new T.BoxGeometry(1.015, 1.015, 1.015),
  new T.MeshBasicMaterial({
    color: 0xc1f5be,
    transparent: true,
    opacity: 0.33,
    depthWrite: false,
  }),
);
preview.visible = false;
scene.add(preview);
const outline = new T.LineSegments(
  new T.EdgesGeometry(cube),
  new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
);
outline.visible = false;
scene.add(outline);
const bobber = new T.Mesh(
  new T.SphereGeometry(0.12, 8, 6),
  new T.MeshBasicMaterial({ color: 0xf7b35e }),
);
bobber.position.set(-11, 0.62, -4);
bobber.visible = false;
scene.add(bobber);
const rod = new T.Mesh(
  new T.CylinderGeometry(0.025, 0.045, 2.2, 6),
  new T.MeshLambertMaterial({ color: 0x805738 }),
);
rod.position.set(0.48, -0.5, -1);
rod.rotation.x = -0.6;
rod.rotation.z = -0.2;
rod.visible = false;
camera.add(rod);
scene.add(camera);
const ray = new T.Raycaster();
let target: Cell | null = null,
  adjacent: Cell | null = null;
function aim() {
  ray.setFromCamera(new T.Vector2(0, 0), camera);
  const hit = ray.intersectObjects(view.group.children, false)[0];
  target = null;
  adjacent = null;
  preview.visible = false;
  outline.visible = false;
  $("target-label").textContent = "";
  if (hit && hit.distance <= 6 && hit.face) {
    const p = hit.point.clone().addScaledVector(hit.face.normal, -0.01);
    target = [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)];
    adjacent = target.map(
      (v, i) => v + hit.face!.normal.getComponent(i),
    ) as Cell;
    outline.position.set(target[0] + 0.5, target[1] + 0.5, target[2] + 0.5);
    outline.visible = true;
    preview.position.set(
      adjacent[0] + 0.5,
      adjacent[1] + 0.5,
      adjacent[2] + 0.5,
    );
    preview.visible = canPlace(world, adjacent, player.pos);
    $("target-label").textContent = world.get(...target) || "";
  }
}
function toast(text: string) {
  $("toast").textContent = text;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => $("toast").classList.remove("visible"),
    4200,
  );
}
let toastTimer = 0;
function save() {
  if (!started) return false;
  const s: Save = {
    version: 1,
    position: player.pos,
    yaw: player.yaw,
    pitch: player.pitch,
    changes: world.changes,
    fish: inventory.fish,
    progress: reading.progress,
    missionActive: reading.active,
    settings,
  };
  let ok = false;
  try {
    ok = persist(localStorage, s);
  } catch {}
  $("save-state").textContent = ok
    ? "Lokal gespeichert"
    : "Speicher nicht verfügbar";
  return ok;
}
function syncAim() {
  camera.position.set(player.pos[0], player.pos[1] + 1.6, player.pos[2]);
  camera.rotation.set(player.pitch, player.yaw, 0);
  camera.updateMatrixWorld();
  view.update();
  view.group.updateMatrixWorld(true);
  aim();
}
function build() {
  syncAim();
  if (adjacent && place(world, adjacent, TYPES[selected], player.pos)) {
    save();
  } else toast("Hier ist kein freier Bauplatz in Reichweite.");
}
function destroy() {
  syncAim();
  if (target && remove(world, target, player.pos)) {
    save();
  } else toast("Visiere einen Block in deiner Nähe an.");
}
function hotbar() {
  $("hotbar").innerHTML = TYPES.map(
    (b, i) =>
      `<button class="slot ${i === selected ? "selected" : ""}" aria-label="${b} auswählen" data-block="${i}"><span class="block-icon" style="--block:#${colors[b].toString(16)}"></span><small>${b}</small><em>${i + 1}</em></button>`,
  ).join("");
  document.querySelectorAll<HTMLButtonElement>("[data-block]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = Number(b.dataset.block);
        hotbar();
      }),
  );
}
hotbar();
const keys = new Set<string>();
let joyX = 0,
  joyY = 0,
  jump = false;
function clearInput() {
  keys.clear();
  joyX = joyY = 0;
  jump = false;
  $("stick").style.transform = "translate(0px,0px)";
}
function unlock() {
  if (document.pointerLockElement) document.exitPointerLock();
}
function openPanel(tag: string, html: string) {
  paused = true;
  clearInput();
  unlock();
  fishing.cancel();
  $("panel-tag").textContent = tag;
  $("panel-content").innerHTML = html;
  $("modal").hidden = false;
}
function closePanel() {
  $("modal").hidden = true;
  paused = false;
}
$("close").onclick = closePanel;
function menu() {
  openPanel(
    "DEINE WELT",
    '<h2>Kleine Pause.</h2><p>Dein nächstes Abenteuer wartet schon.</p><button class="primary" id="resume">Weiterspielen ↗</button><button id="save">Jetzt speichern</button><button id="sound">Sound: ' +
      (settings.sound ? "an" : "aus") +
      '</button><button id="quality">Auflösung: ' +
      (settings.quality === 1 ? "sparsam" : "normal") +
      '</button><button id="home">Zurück zum Startpunkt</button><p class="hint">Desktop: Zum Umsehen ins Spiel klicken. Falls die Maussperre fehlt: mit gedrückter Maus ziehen; die Tasten + und − bauen und entfernen. I öffnet das Inventar, 1–6 wählen Blöcke.</p>',
  );
  $("resume").onclick = closePanel;
  $("save").onclick = () =>
    toast(
      save()
        ? "Deine Welt ist gespeichert."
        : "Speichern fehlgeschlagen. Bitte Speicherplatz prüfen.",
    );
  $("sound").onclick = () => {
    settings.sound = !settings.sound;
    save();
    menu();
  };
  $("quality").onclick = () => {
    settings.quality = settings.quality === 1 ? 1.5 : 1;
    resize();
    save();
    menu();
  };
  $("home").onclick = () => {
    player.pos = [0, 16, 17];
    player.vy = 0;
    closePanel();
    save();
  };
  save();
}
$("menu").onclick = menu;
$("bag").onclick = () =>
  openPanel(
    "INVENTAR",
    `<h2>Deine Sammlung</h2><p>${inventory.total} Fische gefangen · Baumaterial unbegrenzt</p><div class="fish-list">${FISH.map((f) => `<div><span class="fish-symbol">≈</span><section><b>${f.name}</b><p>${f.description}</p></section><strong>${inventory.fish[f.name]}</strong></div>`).join("")}</div><p class="hint">Alle sechs Baustoffe findest du unten in der Blockleiste.</p>`,
  );
$("play").onclick = () => {
  started = true;
  $("start").hidden = true;
  $("hud").hidden = false;
  if (!saved) {
    player.pos = [0, 1.02, 17];
    player.yaw = 0;
    player.pitch = -0.12;
  }
  toast(
    "Willkommen! Folge den Schildern zum See, Bauplatz oder zur BOOM-Zone.",
  );
};
function nearLake() {
  return (
    Math.hypot(player.pos[0] + 11, player.pos[2] - 2) < 4.2 &&
    Math.abs(player.pos[1] - 2) < 3
  );
}
function nearBoom() {
  return (
    player.pos[0] > 8 &&
    player.pos[0] < 21 &&
    player.pos[2] > 5 &&
    player.pos[2] < 19 &&
    player.pos[1] < 7
  );
}
function missionPanel() {
  const completed = reading.progress.completedMissions.includes(mission.id);
  openPanel(
    "AM SEESTEG",
    `<h2>Ein Auftrag vom Angler</h2><p class="mission-text">„${mission.prompt}“</p><p>${completed ? "Geschafft! Dein Barsch ist in der Sammlung." : reading.active ? "Der Auftrag läuft. Du kannst jederzeit frei weiterangeln." : "Lust auf eine kleine Mission? Du kannst auch einfach angeln."}</p>${!completed && !reading.active ? '<button class="primary" id="accept">Auftrag annehmen</button>' : ""}<button id="cast">${completed || reading.active ? "Angeln" : "Überspringen & angeln"}</button>${"speechSynthesis" in window ? '<button id="read">▷ Auftrag vorlesen</button>' : ""}`,
  );
  if ($("accept"))
    $("accept").onclick = () => {
      reading.accept();
      save();
      closePanel();
      cast();
    };
  $("cast").onclick = () => {
    closePanel();
    cast();
  };
  if ($("read"))
    $("read").onclick = () => {
      reading.hint();
      save();
      const u = new SpeechSynthesisUtterance(mission.prompt);
      u.lang = "de-DE";
      u.rate = 0.88;
      const voices = speechSynthesis.getVoices();
      const local = voices.find(
        (v) => v.lang.startsWith("de") && v.localService,
      );
      if (local) {
        u.voice = local;
        speechSynthesis.speak(u);
      } else
        toast(
          "Keine lokale deutsche Stimme verfügbar. Der Auftrag bleibt lesbar.",
        );
    };
}
function cast() {
  fishing.cast(performance.now());
  toast("Angel ausgeworfen … beobachte den Schwimmer.");
}
function interact() {
  if (nearLake()) {
    if (fishing.state === "bite") {
      const f = fishing.reel(performance.now());
      if (f) {
        inventory.add(f);
        const complete = reading.catch(f);
        const data = FISH.find((v) => v.name === f)!;
        toast(
          `${f}! ${data.description} · Sammlung: ${inventory.fish[f]}${complete ? " · Auftrag geschafft! Stark!" : ""}`,
        );
        save();
      }
    } else if (fishing.state === "idle") missionPanel();
    else toast("Noch ist es ruhig am Schwimmer …");
  } else if (nearBoom()) boom();
  else toast("Gehe zum Seesteg oder in die BOOM-Zone.");
}
$("interact").onclick = interact;
$("place").onclick = build;
$("break").onclick = destroy;
$("jump").onpointerdown = (e) => {
  e.preventDefault();
  jump = true;
};
const particles: { mesh: T.Mesh; velocity: T.Vector3; life: number }[] = [];
const particleMat = new T.MeshLambertMaterial({ color: 0xf5bb52 });
function boom() {
  const removed = explode(world);
  if (!removed.length) {
    toast("Mit „Aufbau“ stellst du die Teststruktur wieder her.");
    return;
  }
  for (const p of particles) scene.remove(p.mesh);
  particles.length = 0;
  for (const c of removed.slice(0, 48)) {
    const mesh = new T.Mesh(cube, particleMat);
    mesh.scale.setScalar(0.23);
    mesh.position.set(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5);
    scene.add(mesh);
    particles.push({
      mesh,
      velocity: new T.Vector3(
        (Math.random() - 0.5) * 9,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 9,
      ),
      life: 1.3,
    });
  }
  sound();
  toast("BOOOM! Platz für den nächsten Versuch.");
  save();
}
function sound() {
  if (!settings.sound) return;
  try {
    const a = new AudioContext();
    const o = a.createOscillator(),
      g = a.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(150, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(35, a.currentTime + 0.25);
    g.gain.setValueAtTime(0.15, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.35);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.35);
    o.onended = () => void a.close();
  } catch {}
}
$("reset-boom").onclick = () => {
  if (nearBoom()) {
    world.resetBoom();
    player.safeSpawn();
    save();
    toast("Neue Runde! Die Struktur steht wieder.");
  }
};
window.addEventListener("keydown", (e) => {
  if (!started) return;
  if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code))
    e.preventDefault();
  if (e.repeat) return;
  if (e.code === "Escape") {
    if (paused) closePanel();
    else menu();
    return;
  }
  if (paused) return;
  keys.add(e.code);
  if (e.code === "KeyE") interact();
  if (e.code === "Equal" || e.code === "NumpadAdd") build();
  if (e.code === "Minus" || e.code === "NumpadSubtract") destroy();
  if (e.code === "KeyI") $("bag").click();
  if (e.code === "Space") jump = true;
  if (/Digit[1-6]/.test(e.code)) {
    selected = Number(e.code.slice(-1)) - 1;
    hotbar();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  clearInput();
  if (started && !paused) menu();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInput();
    save();
    if (started && !paused) menu();
  }
});
window.addEventListener("pagehide", save);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
let mouseDrag = false,
  dragged = false,
  lastX = 0,
  lastY = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (!started || paused) return;
  if (e.pointerType !== "mouse") return;
  mouseDrag = true;
  dragged = false;
  lastX = e.clientX;
  lastY = e.clientY;
  if (document.pointerLockElement === canvas) {
    if (e.button === 0) destroy();
    if (e.button === 2) build();
  } else {
    try {
      const p = canvas.requestPointerLock();
      p?.catch(() => toast("Zum Umsehen die Maus gedrückt halten und ziehen."));
    } catch {
      toast("Zum Umsehen die Maus gedrückt halten und ziehen.");
    }
  }
});
window.addEventListener("pointerup", () => (mouseDrag = false));
document.addEventListener("mousemove", (e) => {
  if (!started || paused) return;
  if (document.pointerLockElement === canvas)
    look(e.movementX, e.movementY, 0.0023);
  else if (mouseDrag) {
    dragged = true;
    look(e.clientX - lastX, e.clientY - lastY, 0.004);
    lastX = e.clientX;
    lastY = e.clientY;
  }
});
// Pointer-lock fallback also supports double-click mining and Shift+double-click placing.
canvas.addEventListener("dblclick", (e) => {
  if (started && !paused && !document.pointerLockElement && !dragged) {
    if (e.shiftKey) build();
    else destroy();
  }
});
function look(x: number, y: number, s: number) {
  player.yaw -= x * s;
  player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - y * s));
}
let joyId = -1,
  lookId = -1,
  lx = 0,
  ly = 0;
const joystick = $("joystick");
joystick.onpointerdown = (e) => {
  joyId = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  moveJoy(e);
};
function moveJoy(e: PointerEvent) {
  if (e.pointerId !== joyId) return;
  const r = joystick.getBoundingClientRect(),
    x = e.clientX - r.left - r.width / 2,
    y = e.clientY - r.top - r.height / 2,
    scale = Math.max(1, Math.hypot(x, y) / 37);
  joyX = x / scale / 37;
  joyY = -y / scale / 37;
  $("stick").style.transform = `translate(${x / scale}px,${y / scale}px)`;
}
joystick.onpointermove = moveJoy;
joystick.onpointerup = joystick.onpointercancel = () => {
  joyId = -1;
  joyX = joyY = 0;
  $("stick").style.transform = "";
};
const lookArea = $("look");
lookArea.onpointerdown = (e) => {
  lookId = e.pointerId;
  lx = e.clientX;
  ly = e.clientY;
  lookArea.setPointerCapture(e.pointerId);
};
lookArea.onpointermove = (e) => {
  if (e.pointerId !== lookId || paused) return;
  look(e.clientX - lx, e.clientY - ly, 0.005);
  lx = e.clientX;
  ly = e.clientY;
};
lookArea.onpointerup = lookArea.onpointercancel = () => (lookId = -1);
let ratio = 1;
function resize() {
  ratio = Math.min(devicePixelRatio, settings.quality);
  renderer.setPixelRatio(ratio);
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
let last = performance.now(),
  accum = 0,
  slow = 0,
  frameCount = 0,
  frameTime = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  const elapsed = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (started && !paused) {
    accum += elapsed;
    while (accum >= 1 / 120) {
      player.step(
        1 / 120,
        joyX + (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
        joyY + (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0),
        jump,
      );
      jump = false;
      accum -= 1 / 120;
    }
    camera.position.set(player.pos[0], player.pos[1] + 1.6, player.pos[2]);
    camera.rotation.set(player.pitch, player.yaw, 0);
    aim();
    const missed = fishing.tick(now);
    if (missed) toast("Der Fisch ist weitergezogen. Versuch es noch einmal!");
    const lake = nearLake(),
      arena = nearBoom();
    if (!lake && fishing.state !== "idle") fishing.cancel();
    $("location").textContent = lake
      ? "Am Seesteg"
      : arena
        ? "BOOM-Testzone"
        : player.pos[2] > 4 && Math.abs(player.pos[0]) < 6
          ? "Dein Bauplatz"
          : "Wiesenland";
    $("context").hidden = !lake && !arena;
    $("context-text").textContent = lake
      ? fishing.state === "bite"
        ? "Ein Biss! Jetzt einholen!"
        : fishing.state === "waiting"
          ? "Warte auf den Biss …"
          : "Eine Angelpause?"
      : arena
        ? "Bereit für einen großen Knall?"
        : "";
    $("interact").textContent = lake
      ? fishing.state === "bite"
        ? "Einholen!"
        : fishing.state === "waiting"
          ? "Angel im Wasser"
          : "E · Angeln"
      : "E · BOOM!";
    $("interact").classList.toggle("bite", fishing.state === "bite");
    $("reset-boom").hidden = !arena;
    $("mission-pin").hidden = !reading.active;
  } else if (!started) {
    camera.position.set(23, 18, 29);
    camera.lookAt(-2, 0, -2);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= elapsed;
    p.velocity.y -= 14 * elapsed;
    p.mesh.position.addScaledVector(p.velocity, elapsed);
    p.mesh.rotation.x += elapsed * 3;
    p.mesh.rotation.z += elapsed * 2;
    p.mesh.scale.setScalar(Math.max(0, p.life) * 0.18);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }
  bobber.visible = started && !paused && fishing.state !== "idle";
  rod.visible = bobber.visible;
  bobber.position.y =
    0.62 +
    Math.sin(now * (fishing.state === "bite" ? 0.025 : 0.003)) *
      (fishing.state === "bite" ? 0.17 : 0.025);
  water.position.y = 0.38 + Math.sin(now * 0.001) * 0.025;
  view.update();
  renderer.render(scene, camera);
  if (started && !paused) {
    frameTime += elapsed;
    frameCount++;
    if (frameTime > 3) {
      if (frameCount / frameTime < 28 && ratio > 0.8) {
        slow++;
        if (slow >= 2) {
          ratio = Math.max(0.75, ratio - 0.25);
          renderer.setPixelRatio(ratio);
          slow = 0;
        }
      }
      frameTime = frameCount = 0;
    }
  }
}
requestAnimationFrame(frame);
setInterval(() => {
  if (started) save();
}, 10000);
// No service worker yet: the manifest prepares installation without stale-cache risk.
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw && !saved) {
    localStorage.setItem(SAVE_KEY + ".backup", raw);
    toast(
      "Der Spielstand ist nicht lesbar. Eine Sicherung bleibt auf diesem Gerät.",
    );
  }
} catch {}
