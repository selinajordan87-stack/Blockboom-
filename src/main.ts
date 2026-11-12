import "./ui/style.css";
import { installLifecycle } from "./core/Lifecycle";
import { TouchControls, bindTap } from "./player/TouchControls";
import * as T from "three";
import { BuildHistory } from "./building/History";
import { enrich, revolutionize } from "./world/Enrich";
import { TOOLS, defaultExpansion, readExpansion } from "./inventory/Equipment";
import { Shoal, type FishActor } from "./fishing/Shoal";
import { FishView } from "./fishing/FishView";
import { AnglingEngine, type AnglingEvent } from "./fishing/AnglingEngine";
import {
  BAITS,
  HOOKS,
  LINES,
  RIGS,
  RODS,
  SPOTS,
  simulatedRule,
  spotById,
  updateAchievements,
  updateUnlocks,
  type AnglingSpot,
} from "./fishing/AnglingData";
import {
  FishingWaters,
  discoverySpot,
  enrichFishingWorld,
  nearAnglingSpot,
} from "./fishing/FishingWorld";
import { FishingView } from "./fishing/FishingView";
import {
  LearningEngine,
  loadProfile,
  freshProfile,
  type Mode,
} from "./learning/Engine";
import { Missions, MISSIONS, type MissionId } from "./missions/Missions";
import { AdventureUI, escapeHTML } from "./ui/AdventureUI";
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
import { HeldTools } from "./player/HeldTools";
import { WaterView } from "./world/WaterView";
import { Inventory, FISH } from "./fishing/Fishing";
import { ReadingEngine, mission } from "./learning/Learning";
import { explode } from "./boom/Boom";
import { load, persist, SAVE_KEY, type Save } from "./storage/Save";
import { DayView, advanceDay, dayPhase, isNight } from "./nightfall/DayCycle";
import { Vitals } from "./nightfall/State";
import { ZombieEngine, WEAPONS, ZOMBIES } from "./nightfall/Zombies";
import { DefenseView, ZombieView, NightAudio } from "./nightfall/Views";
import { buildRefuge, toggleDoor, restoreNightDamage } from "./nightfall/Defense";
import { NightUI } from "./nightfall/NightUI";
const $ = <E extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as E;
$("app").innerHTML = `
<canvas id="world" aria-label="BLOCKBOOM 3D-Spielwelt"></canvas>
<div id="hud" hidden>
 <header><a class="brand" id="brand">BLOCK<span>BOOM</span><small>DEINE KLEINE GROSSE WELT</small></a><div class="top-right"><span class="save-state" id="save-state">Lokal gespeichert</span><button id="bag" aria-label="Inventar öffnen">▦ <span>Inventar</span></button><button id="menu" aria-label="Menü öffnen">☰</button></div></header>
 <div class="location"><i></i><span id="location">Wiesenland</span><small>ENTDECKEN · BAUEN · AUSPROBIEREN</small></div>
 <div id="mission-pin" hidden><span>FREIWILLIGER AUFTRAG</span><b>Fange einen Barsch.</b></div>
 <div id="rotate-tip">↻ Im Querformat hast du mehr Platz.</div>
 <div id="survival-hud"><span id="day-label">Mittag</span><span id="health-label">♥ 100</span><span id="hunger-label">◉ 100</span><span id="wave-label"></span></div>
 <div id="night-actions"><button id="attack" aria-label="Angreifen">⚔</button><button id="word-battle" aria-label="Schreibkampf">✦ Wortmagie</button><button id="gather" aria-label="Beeren sammeln">Sammeln</button></div>
 <div class="crosshair">+</div><div id="target-label"></div>
 <div id="context"><span id="context-text"></span><button id="interact">E · Interagieren</button><button id="local-mission" hidden>Auftrag</button><button id="reset-boom" hidden>↻ Aufbau</button></div>
 <div id="toast" role="status"></div>
 <div id="angling-hud" hidden aria-live="polite"><b id="angling-state">Bereit zum Auswerfen</b><label>Wurfkraft <span class="meter"><i id="cast-power"></i></span></label><label>Schnurspannung <span class="meter tension"><i id="line-tension"></i></span></label><label>Drill <span class="meter progress"><i id="drill-progress"></i></span></label><button id="fish-action" aria-label="Angelaktion gedrückt halten">Halten: Auswerfen</button><small id="angling-help">Gedrückt halten, Kraft wählen, dann loslassen.</small></div>
 <div id="look" aria-label="Zum Umsehen wischen"></div>
 <div id="joystick" aria-label="Bewegungsjoystick"><div id="stick"></div></div>
 <div class="touch-actions"><button id="jump" aria-label="Springen">↑</button><button id="zoom" aria-label="Zoom umschalten" aria-pressed="false">⌕</button><button id="break" aria-label="Block entfernen">−</button><button id="place" aria-label="Block platzieren">+</button></div>
 <div id="tool-palette" hidden></div><footer><div class="toolrow"><button id="tool-toggle">Bauwerkzeug</button><button id="tackle">≈ Angelset</button><button id="learn">✦ Challenge</button><button id="journal">Aufträge</button><button id="undo" aria-label="Letzte Bauaktion rückgängig" disabled>↶</button></div><div class="hotbar" id="hotbar"></div><span class="desktop-help">WASD bewegen · Maus umsehen · Leertaste springen<br>Links abbauen · Rechts bauen · E halten zum Angeln · I Inventar</span><span class="mobile-help">Links bewegen · rechts umsehen</span></footer>
</div>
<section class="overlay" id="start"><div class="start-copy"><div class="eyebrow">NIGHTFALL · v0.5.0</div><h1>BLOCK<span>BOOM</span><i>Am Tag dein Plan. Nachts dein Abenteuer.</i></h1><p>Baue, angle und bereite deinen Unterschlupf vor.<br>Wenn die Sonne sinkt, erwacht die Nacht.</p><button class="primary" id="play">Los geht’s <span>↗</span></button><div class="start-meta"><span>◈ Bauen</span><span>≈ Angeln</span><span>☾ Überleben</span></div><small>Deine Welt bleibt auf diesem Gerät. Ohne Anmeldung.</small></div><div class="world-note"><span>05 / NIGHTFALL</span><b>Deine Basis.<br>Deine Nacht.</b><p>Kämpfe, weiche aus oder wirke Wortmagie.</p></div></section>
<div id="interruption" hidden role="status"><b id="interruption-text">Spiel unterbrochen</b><button id="continue">Weiter</button></div>
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
scene.background = new T.Color(0x9ed2df);
scene.fog = new T.Fog(0xa9d3d5, 26, 68);
const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.08, 80);
camera.rotation.order = "YXZ";
const ambient = new T.HemisphereLight(0xeaf8ff, 0x66724f, 2.25);
scene.add(ambient);
const sun = new T.DirectionalLight(0xffedc2, 2.15);
sun.position.set(-12, 26, 9);
scene.add(sun);
const world = new World(),
  player = new Player(world),
  inventory = new Inventory(),
  shoal = new Shoal(),
  fishing = new AnglingEngine(shoal);
let reading = new ReadingEngine(),
  settings = { sound: false, quality: 1.5 },
  saved = safeLoad(),
  started = false,
  paused = false,
  suspended = false,
  selected = 0,
  materialPage = 0;
let pendingCatch: { fish: FishActor; method: "Angel" | "Holzknüppel" } | null =
  null;
let preferredFish: import("./fishing/Fishing").FishName | undefined;
const expansion = saved?.extension
  ? readExpansion(saved.extension)
  : defaultExpansion(saved ? 1 : 4);
if (!saved) {expansion.nightfall.mode = "Survival";expansion.nightfall.refuge=true;}
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if(raw && !JSON.parse(raw).extension?.nightfall && !localStorage.getItem(SAVE_KEY+".pre-v05"))
    localStorage.setItem(SAVE_KEY+".pre-v05",raw);
} catch {}
if (expansion.edition < 4) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw && !localStorage.getItem(SAVE_KEY + ".pre-v04"))
      localStorage.setItem(SAVE_KEY + ".pre-v04", raw);
  } catch {}
  expansion.edition = 4;
}
if (expansion.edition >= 2) enrich(world);
if (expansion.edition >= 3) revolutionize(world);
if (expansion.edition >= 4) enrichFishingWorld(world);
if (expansion.nightfall.refuge) buildRefuge(world);
const night = expansion.nightfall;
const vitals = new Vitals(night);
const zombies = new ZombieEngine(world,night);
const nightAudio = new NightAudio();
camera.fov = expansion.view.fov;
camera.updateProjectionMatrix();
let zoomed = false;
function updateFov() {
  camera.fov = zoomed
    ? Math.max(36, expansion.view.fov * 0.62)
    : expansion.view.fov;
  camera.updateProjectionMatrix();
  $("zoom").setAttribute("aria-pressed", String(zoomed));
}
const history = new BuildHistory(),
  missions = new Missions(expansion);
const learning = new LearningEngine(
  (() => {
    try {
      return loadProfile(localStorage);
    } catch {
      return freshProfile();
    }
  })(),
);
if (saved) {
  world.apply(saved.changes);
  player.pos = saved.position;
  player.yaw = saved.yaw;
  player.pitch = saved.pitch;
  Object.assign(inventory.fish, saved.fish);
  reading = new ReadingEngine(saved.progress, saved.missionActive);
  settings = saved.settings;
  player.safeSpawn();
}
function safeLoad() {
  try {
    const result = load(localStorage);
    if (result && !result.extension) {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw && !localStorage.getItem(SAVE_KEY + ".pre-v02"))
          localStorage.setItem(SAVE_KEY + ".pre-v02", raw);
      } catch {}
    }
    return result;
  } catch {
    return null;
  }
}
const view = new WorldView(world, scene);
view.update();
const fishView = new FishView(shoal, scene, camera);
const water = new WaterView(scene, expansion.edition);
const fishingWaters = new FishingWaters(scene);
const fishingView = new FishingView(scene);
const dayView = new DayView(scene,sun,ambient);
const zombieView = new ZombieView(scene);
const defenseView = new DefenseView(world,scene);
defenseView.update(camera.position,isNight(night.time));
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
sign("FREIES BAUEN", 1, 5, "#b7d88b");
sign("BOOM-ZONE", 10, 16, "#efb453");
sign("MARA · HOLZAUFTRAG", -3, 14, "#b7d88b");
sign("ENTDECKERPFAD", 7, -1, "#e3bd77");
sign("WALDRUINE", -16, 19, "#b7d88b");
sign("WALDSEE", -13, 12, "#77c6b1");
sign("FLUSS", 14, -8, "#74c9dc");
sign("GEHEIMTEICH", 4, -15, "#d5b66d");
for (const [x, z, color] of [
  [-3, 14, 0xe1a663],
  [-9, 3, 0x78a9b0],
]) {
  for (const [y, sx, sy, sz, c] of [
    [1.5, 0.5, 1, 0.35, color],
    [2.2, 0.45, 0.45, 0.45, 0xdcb38d],
  ]) {
    const m = new T.Mesh(cube, new T.MeshLambertMaterial({ color: c }));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    scene.add(m);
  }
}
const chest = new T.Mesh(cube, new T.MeshLambertMaterial({ color: 0xc29148 }));
chest.position.set(7, 1.4, -4);
chest.scale.set(1, 0.8, 0.65);
scene.add(chest);
const chestLid = new T.Group();
chestLid.position.set(7, 1.8, -4.325);
const lid = new T.Mesh(cube, new T.MeshLambertMaterial({ color: 0x9f703d }));
lid.scale.set(1.05, 0.13, 0.7);
lid.position.z = 0.325;
chestLid.add(lid);
scene.add(chestLid);
const treasureGold = new T.Mesh(
  cube,
  new T.MeshLambertMaterial({ color: 0xf0c66b }),
);
treasureGold.position.set(7, 1.8, -4);
treasureGold.scale.set(0.45, 0.2, 0.35);
scene.add(treasureGold);

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
scene.add(camera);
const heldTools = new HeldTools(camera);

const ray = new T.Raycaster();
let target: Cell | null = null,
  adjacent: Cell | null = null;
function aim() {
  picks++;
  ray.setFromCamera(new T.Vector2(0, 0), camera);
  const hit = ray.intersectObjects([...view.group.children,...defenseView.group.children], false)[0];
  target = null;
  adjacent = null;
  preview.visible = false;
  outline.visible = false;
  $("target-label").textContent = "";
  if (hit && hit.distance <= 6 && hit.face) {
    const p = hit.point.clone().addScaledVector(hit.face.normal, -0.01);
    target = hit.instanceId!==undefined && hit.object.userData.cells
      ? hit.object.userData.cells[hit.instanceId] as Cell
      : [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)];
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
    preview.visible = expansion.tool === "Bauwerkzeug";
    (preview.material as T.MeshBasicMaterial).color.set(
      canPlace(world, adjacent, player.pos) ? 0xc1f5be : 0xf59a6a,
    );
    $("target-label").textContent = (world.get(...target) || "") +
      (night.damage[target.join(",")]?` · Zustand ${Math.max(0,100-night.damage[target.join(",")])}%`:"");
  }
  if (expansion.tool === "Holzknüppel") {
    const fish = fishView.hit(ray, 3.4);
    if (fish && (!hit || fish.distance < hit.distance))
      $("target-label").textContent =
        `${fish.fish.species} · ${fish.fish.length} cm`;
    preview.visible = false;
  }
  if(WEAPONS[expansion.tool]){
    const z=zombies.actors.find(z=>{
      const point=new T.Vector3(z.pos[0],z.pos[1]+1,z.pos[2]);
      return z.hp>0 && ray.ray.distanceToPoint(point)<.65 && point.distanceTo(camera.position)<8 && (!hit||point.distanceTo(camera.position)<hit.distance);
    });
    if(z)$("target-label").textContent=`${ZOMBIES[z.kind].name} · ${Math.ceil(z.hp)} LP`;
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
    extension: expansion,
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
  defenseView.update(camera.position,isNight(night.time));
  view.group.updateMatrixWorld(true);
  aim();
}
function build() {
  syncAim();
  const material=TYPES[selected];
  const tall=material==="Tür"||material==="Tor";
  const upper:Cell|null=adjacent&&tall?[adjacent[0],adjacent[1]+1,adjacent[2]]:null;
  const cost=tall?2:1;
  if(night.mode==="Survival"&&(expansion.materials[material]||0)<cost){toast(`${material} fehlt. Sammle Material oder nutze die Werkbank im Menü.`);return;}
  if(upper&&!canPlace(world,upper,player.pos)){toast("Für Tür oder Tor brauchst du zwei freie Blöcke übereinander.");return;}
  if (adjacent && place(world, adjacent, material, player.pos)) {
    heldTools.play("build");
    history.record(adjacent!, null, material);
    if(upper){world.set(...upper,material);history.record(upper,null,material);}
    if(night.mode==="Survival")expansion.materials[material]=(expansion.materials[material]||0)-cost;
    syncUndo();
    save();
  } else
    toast(
      "Hier ist es belegt, zu weit weg oder geschützt. Visiere eine freie Fläche an.",
    );
}
function destroy() {
  heldTools.play("mine");
  syncAim();
  const previous = target ? world.get(...target) : undefined;
  if (target && remove(world, target, player.pos)) {
    history.record(target, previous!, null);
    syncUndo();
    if (previous && previous !== "Boom")
      {
        const recovered=previous==="Tür offen"?"Tür":previous==="Tor offen"?"Tor":previous;
        expansion.materials[recovered] = (expansion.materials[recovered] || 0) + 1;
      }
    missions.wood();
    save();
  } else toast("Visiere einen Block in deiner Nähe an.");
}
function hotbar() {
  const pageSize = 5;
  const pageCount = Math.ceil(TYPES.length / pageSize);
  materialPage = Math.max(0, Math.min(pageCount - 1, materialPage));
  $("hotbar").innerHTML =
    TYPES.slice(materialPage * pageSize, materialPage * pageSize + pageSize)
      .map(
        (b, i) =>
          `<button class="slot ${i + materialPage * pageSize === selected ? "selected" : ""}" aria-label="${b === "Laub" ? "Blätter" : b} auswählen" data-block="${i + materialPage * pageSize}"><span class="block-icon" style="--block:#${colors[b].toString(16).padStart(6, "0")}"></span><small>${b === "Laub" ? "Blätter" : b}</small><em>${i + 1}</em></button>`,
      )
      .join("") +
    `<button class="slot" id="material-next" aria-label="Weitere Baustoffe">›<small>${materialPage + 1}/${pageCount}</small></button>`;
  bindTap($("material-next"), () => {
    materialPage = (materialPage + 1) % pageCount;
    hotbar();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-block]").forEach((b) =>
    bindTap(b, () => {
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
let touch: TouchControls | undefined;
function canPlay() {
  return started && !paused && !suspended && !document.hidden;
}
function clearInput() {
  touch?.reset();
  fishing.setReeling(false);
  anglingPointer = null;
  mouseDrag = false;
  keys.clear();
  joyX = joyY = 0;
  jump = false;
  $("stick").style.transform = "translate(0px,0px)";
}
function unlock() {
  if (document.pointerLockElement) document.exitPointerLock();
}
function openPanel(tag: string, html: string, preserveFishing = false) {
  paused = true;
  clearInput();
  clearTimeout(toastTimer);
  $("toast").classList.remove("visible");
  unlock();
  if (!preserveFishing) fishing.cancel();
  $("panel-content").classList.toggle("pause-options", tag === "DEINE WELT");
  $("panel-tag").textContent = tag;
  $("panel-content").innerHTML = html;
  $("modal").hidden = false;
  $("tool-palette").hidden = true;
}
function closePanel() {
  if(pendingCatch){finishCatch("released");return;}
  $("modal").hidden = true;
  paused = false;
  if (!pendingCatch) fishView.hideShowcase();
  nightUI.battle = null;
}
$("close").onclick = closePanel;
function menu() {
  openPanel(
    "DEINE WELT",
    '<h2>Kleine Pause.</h2><p>Dein nächstes Abenteuer wartet schon.</p><button class="primary" id="resume">Weiterspielen ↗</button><button id="save">Jetzt speichern</button><button id="sound">Sound: ' +
      (settings.sound ? "an" : "aus") +
      '</button><button id="quality">Auflösung: ' +
      (settings.quality === 1 ? "sparsam" : "normal") +
      `</button><label class="range-setting">Sichtfeld <output id="fov-value">${Math.round(expansion.view.fov)}°</output><input id="fov" type="range" min="55" max="90" step="1" value="${expansion.view.fov}"></label><label class="range-setting">Kamera-Empfindlichkeit <output id="sensitivity-value">${Math.round(expansion.view.sensitivity * 100)}%</output><input id="sensitivity" type="range" min="55" max="160" step="5" value="${expansion.view.sensitivity * 100}"></label><button id="home">Zurück zum Startpunkt</button><p class="hint">Desktop: Zum Umsehen ins Spiel klicken. Falls die Maussperre fehlt: mit gedrückter Maus ziehen; die Tasten + und − bauen und entfernen. I öffnet das Inventar, 1–9 wählen Blöcke, X zoomt.</p>`,
  );
  const mode = document.createElement("label");
  mode.className = "mode-select";
  mode.innerHTML = `Spielmodus <select id="game-mode">${["Entspannt", "Abenteuer", "Lern-Challenge"].map((m) => `<option ${learning.profile.mode === m ? "selected" : ""}>${m}</option>`).join("")}</select>`;
  $("panel-content").append(mode);
  const nightButton=document.createElement("button");nightButton.id="night-menu";nightButton.textContent="☾ NIGHTFALL · Werkbank · Proviant";nightButton.onclick=()=>nightUI.settings();$("panel-content").append(nightButton);
  $("game-mode").onchange = () => {
    learning.profile.mode = ($("game-mode") as HTMLSelectElement).value as Mode;
    try {
      if (!learning.save(localStorage))
        toast("Lernmodus konnte nicht gespeichert werden.");
    } catch {
      toast("Speicher nicht verfügbar.");
    }
  };
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
    ratio = settings.quality;
    resize();
    save();
    menu();
  };
  $("fov").oninput = () => {
    expansion.view.fov = Number($<HTMLInputElement>("fov").value);
    $("fov-value").textContent = `${Math.round(expansion.view.fov)}°`;
    updateFov();
    save();
  };
  $("sensitivity").oninput = () => {
    expansion.view.sensitivity =
      Number($<HTMLInputElement>("sensitivity").value) / 100;
    $("sensitivity-value").textContent = `${Math.round(expansion.view.sensitivity * 100)}%`;
    save();
  };
  $("home").onclick = () => {
    player.pos = [0, 16, 17];
    player.vy = 0;
    closePanel();
    save();
  };
  save();
}
bindTap($("menu"), () => {
  if (!suspended) menu();
});
bindTap($("bag"), () => {
  if (canPlay()) showInventory();
});
const nightUI = new NightUI(night,vitals,zombies,expansion.materials,inventory.fish,world,{
  open:openPanel,close:closePanel,save,toast,position:()=>player.pos,
  equip:name=>{if(TOOLS.includes(name as typeof expansion.tool)){expansion.tool=name as typeof expansion.tool;equipment();}
    if(night.crafted.includes("Rutenstück")&&!expansion.angling.unlocked.includes("Spinnrute"))expansion.angling.unlocked.push("Spinnrute");},
  effect:pos=>combatEffect(pos),refresh:()=>{viewportDirty=true;},
});
const adventure = new AdventureUI(learning, missions, {
  open: openPanel,
  save,
  near: nearMission,
  toast,
});
function nearMission(id: MissionId) {
  const p = MISSIONS[id].position;
  return (
    Math.hypot(player.pos[0] - p[0], player.pos[2] - p[2]) < 3.6 &&
    Math.abs(player.pos[1] - p[1]) < 4
  );
}
function showInventory() {
  openPanel(
    "INVENTAR",
    `<h2>Deine Sammlung</h2><p>${inventory.total} Fische · ${expansion.tokens} Sterne · Bauen bleibt frei</p><div class="inventory-tabs"><button id="tool-tab">Werkzeuge</button><button id="material-tab">Material</button><button id="fish-tab">Fangbuch</button></div><div id="inventory-body"></div>`,
  );
  const fish = () => {
    $("inventory-body").innerHTML = `<p id="fish-preview-note" class="hint">Wähle „3D ansehen“, um Körperform und Flossen in der Fangansicht zu vergleichen.</p><div class="fish-list catchbook">${FISH.map((f) => {
      const records = expansion.catches.filter((c) => c.species === f.name),
        best = Math.max(
          expansion.best[f.name] || 0,
          ...records.map((c) => c.length),
        ),
        bestWeight = Math.max(0, ...records.map((c) => c.weight || 0)),
        last = records.at(-1),
        lastSpot = last?.spot ? spotById(last.spot).name : "früherer Spielstand";
      return `<div><span class="fish-symbol">≈</span><section><b>${f.name}</b><p>${f.description}</p><small>${records.length ? `${records.length} gefangen · Rekord: ${best} cm${bestWeight ? ` / ${bestWeight} g` : ""}<br>Zuletzt: ${last?.method}${last?.bait ? ` mit ${last.bait}` : ""} · ${lastSpot}` : "Noch nicht im Fangbuch entdeckt."}</small><button data-fish-preview="${f.name}" ${records.length || expansion.angling.inspected.includes(f.name) ? "" : "disabled"}>3D ansehen</button></section><div class="kept-count"><strong>${inventory.fish[f.name] || 0}</strong><small>im Inventar</small></div></div>`;
    }).join(
      "",
    )}</div><h3>Angel-Erfolge</h3><p>${expansion.angling.achievements.map(escapeHTML).join(" · ") || "Der erste Erfolg wartet am Wasser."}</p><p class="hint">Fangzahl umfasst zurückgesetzte und versorgte Fische. Die große Zahl rechts zeigt nur Fische im Inventar. Alte Fangzahlen bleiben erhalten.</p>`;
    document
      .querySelectorAll<HTMLButtonElement>("[data-fish-preview]")
      .forEach((button) => {
        button.onclick = () => {
          const species = button.dataset.fishPreview as
            | import("./fishing/Fishing").FishName
            | undefined;
          if (!species) return;
          const record = expansion.catches
            .filter((entry) => entry.species === species)
            .at(-1);
          fishView.showShowcase(
            { species, length: record?.length || FISH.find((entry) => entry.name === species)!.min },
            true,
          );
          viewportDirty = true;
          const info = FISH.find((entry) => entry.name === species)!;
          $("panel-tag").textContent = "3D-FANGBUCH";
          $("panel-content").innerHTML = `<div class="landing-card"><div class="landing-space" aria-label="Dreidimensionale Vorschau von ${species}"></div><h2>${species}</h2><p>${escapeHTML(info.description)}</p><p><b>Merkmale:</b> ${escapeHTML(info.features)}</p><p><b>Lebensraum:</b> ${escapeHTML(info.habitat)}</p><p><b>Nahrung:</b> ${escapeHTML(info.food)}</p><button id="back-catchbook">← Zurück zum Fangbuch</button></div>`;
          $("back-catchbook").onclick = () => {
            fishView.hideShowcase();
            showInventory();
          };
        };
      });
  };
  $("fish-tab").onclick = fish;
  const tools = () => {
    $("inventory-body").innerHTML = `<h3>Werkzeug wählen</h3><div class="inventory-tools">${TOOLS.map((tool) => `<button data-inventory-tool="${tool}" aria-pressed="${expansion.tool === tool}"><span>${toolIcon(tool)}</span>${tool}</button>`).join("")}</div><p class="hint">Abgebaute Materialien werden aufgenommen. Mit dem Bauwerkzeug legst du Blöcke wieder in der Welt ab.</p>`;
    document
      .querySelectorAll<HTMLButtonElement>("[data-inventory-tool]")
      .forEach((button) =>
        bindTap(button, () => {
          expansion.tool = button.dataset.inventoryTool as typeof expansion.tool;
          if(night.mode==="Survival"&&["Holzschwert","Steinschwert","Steinaxt","Bogen"].includes(expansion.tool)&&!night.crafted.includes(expansion.tool)){
            expansion.tool="Holzknüppel";toast("Stelle dieses Werkzeug zuerst an der Werkbank her.");
          }
          equipment();
          tools();
          save();
        }),
      );
  };
  $("tool-tab").onclick = tools;
  $("material-tab").onclick = () => {
    $("inventory-body").innerHTML =
      `<h3>Gesammelte Vorräte</h3><p>Für Aufträge verwendbar. Freies Bauen hat unbegrenzte Baustoffe.</p><div class="material-grid">${TYPES.map((t) => `<span>${t === "Laub" ? "Blätter" : t}: <b>${expansion.materials[t] || 0}</b></span>`).join("")}</div><h3>Deine Schätze</h3><p>${expansion.badges.map(escapeHTML).join(" · ") || "Hier erscheinen deine Missionsabzeichen."}</p>`;
  };
  fish();
}
function gearOptions(
  items: readonly { id: string; description: string }[],
  selectedGear: string,
) {
  return items
    .map((item) => {
      const unlocked = expansion.angling.unlocked.includes(item.id);
      return `<option value="${escapeHTML(item.id)}" ${selectedGear === item.id ? "selected" : ""} ${unlocked ? "" : "disabled"}>${escapeHTML(item.id)}${unlocked ? "" : " · gesperrt"}</option>`;
    })
    .join("");
}
function showTackle() {
  const a = expansion.angling;
  openPanel(
    "ANGEL-AUSRÜSTUNG",
    `<h2>Dein Angelset</h2><p>Rute, Montage, Schnur, Haken und Köder beeinflussen, welche Fische anbeißen und wie sicher der Drill wird.</p><div class="tackle-grid"><label>Rute<select id="rod-select">${gearOptions(RODS, a.loadout.rod)}</select></label><label>Montage<select id="rig-select">${gearOptions(RIGS, a.loadout.rig)}</select></label><label>Schnur<select id="line-select">${gearOptions(LINES, a.loadout.line)}</select></label><label>Haken<select id="hook-select">${gearOptions(HOOKS, a.loadout.hook)}</select></label><label>Köder<select id="bait-select">${gearOptions(BAITS, a.loadout.bait)}</select></label><label>Simulierte Jahreszeit<select id="season-select">${["Frühling", "Sommer", "Herbst", "Winter"].map((season) => `<option ${a.season === season ? "selected" : ""}>${season}</option>`).join("")}</select></label></div><label class="rule-toggle"><input id="rules-enabled" type="checkbox" ${a.rulesEnabled ? "checked" : ""}> Optionale Schonzeit- und Mindestmaß-Simulation anzeigen</label><div class="gear-summary"><h3>Aktuelle Wirkung</h3><p>${RODS.find((item) => item.id === a.loadout.rod)?.description}</p><p>${RIGS.find((item) => item.id === a.loadout.rig)?.description}</p><p>${LINES.find((item) => item.id === a.loadout.line)?.description}</p><p>${BAITS.find((item) => item.id === a.loadout.bait)?.description}</p></div><h3>Entdeckte Angelplätze</h3><p>${SPOTS.map((spot) => `${a.spots.includes(spot.id) ? "●" : "○"} ${spot.name}`).join(" · ")}</p><p class="hint">Neue Ausrüstung wird auch durch Angeln und Erkunden freigeschaltet – nicht nur durch Lernaufgaben. Die Regelprüfung ist eine Spielsimulation und ersetzt weder Fischereischein noch reale Gewässerordnung.</p><button class="primary" id="equip-save">Ausrüsten</button>`,
  );
  $("equip-save").onclick = () => {
    a.loadout.rod = $<HTMLSelectElement>("rod-select").value as typeof a.loadout.rod;
    a.loadout.rig = $<HTMLSelectElement>("rig-select").value as typeof a.loadout.rig;
    a.loadout.line = $<HTMLSelectElement>("line-select").value as typeof a.loadout.line;
    a.loadout.hook = $<HTMLSelectElement>("hook-select").value as typeof a.loadout.hook;
    a.loadout.bait = $<HTMLSelectElement>("bait-select").value as typeof a.loadout.bait;
    a.season = $<HTMLSelectElement>("season-select").value as typeof a.season;
    a.rulesEnabled = $<HTMLInputElement>("rules-enabled").checked;
    expansion.tool = "Angel";
    equipment();
    save();
    closePanel();
    toast(`${a.loadout.rod}, ${a.loadout.rig}, ${a.loadout.bait}: bereit.`);
  };
}
bindTap($("tackle"), () => {
  if (canPlay()) showTackle();
});
bindTap($("journal"), () => {
  if (canPlay()) adventure.journal();
});
bindTap($("learn"), () => {
  if (canPlay()) {
    adventure.challenge();
    $("learn").classList.remove("offer");
    learningOffer = 0;
    offered = false;
  }
});
function syncUndo() {
  const button = $<HTMLButtonElement>("undo");
  button.disabled = !history.available;
  button.textContent = history.available ? `↶ ${history.depth}` : "↶";
  button.setAttribute(
    "aria-label",
    history.available
      ? `${history.depth} Bauaktionen rückgängig möglich`
      : "Keine Bauaktion rückgängig möglich",
  );
}
bindTap($("undo"), () => {
  if (!canPlay()) return;
  const a = history.undo(world, player.pos);
  if (!a) {
    toast("Rückgängig ist hier gerade nicht möglich.");
    return;
  }
  if (a.before && a.after === null){
    const recovered=a.before==="Tür offen"?"Tür":a.before==="Tor offen"?"Tor":a.before;
    expansion.materials[recovered] = Math.max(
      0,
      (expansion.materials[recovered] || 0) - 1,
    );
  }
  if(night.mode==="Survival"&&a.after&&a.before===null)
    expansion.materials[a.after]=(expansion.materials[a.after]||0)+1;
  syncUndo();
  save();
  toast(
    history.available
      ? `Bauaktion rückgängig. Noch ${history.depth} möglich.`
      : "Bauaktion rückgängig.",
  );
});
function equipment() {
  $("tool-toggle").textContent = expansion.tool;
  $("tool-toggle").dataset.icon = toolIcon(expansion.tool);
  $("tool-palette").innerHTML = TOOLS.map(
    (t) =>
      `<button data-tool="${t}" aria-pressed="${expansion.tool === t}"><span>${toolIcon(t)}</span>${t}</button>`,
  ).join("");
  document.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((b) =>
    bindTap(b, () => {
      const next=b.dataset.tool!;
      if(night.mode==="Survival"&&["Holzschwert","Steinschwert","Steinaxt","Bogen"].includes(next)&&!night.crafted.includes(next)){
        toast("Dieses Werkzeug stellst du an der Werkbank her. Grundwerkzeuge bleiben verfügbar.");return;
      }
      expansion.tool = b.dataset.tool as typeof expansion.tool;
      equipment();
      $("tool-palette").hidden = true;
      save();
    }),
  );
  heldTools.equip(
    expansion.tool,
    expansion.badges.includes("Holzhelfer"),
  );
}
function toolIcon(tool: (typeof TOOLS)[number]) {
  return (
    {
      Bauwerkzeug: "▣",
      Spitzhacke: "⛏",
      Axt: "◢",
      Schaufel: "♠",
      Schwert: "⚔",
      Angel: "⌁",
      Holzknüppel: "╱",
      Holzschwert: "⚔",Steinschwert:"⚔",Steinaxt:"◢",Bogen:"⌒",
    } as const
  )[tool];
}
bindTap($("tool-toggle"), () => {
  if (canPlay()) $("tool-palette").hidden = !$("tool-palette").hidden;
});
equipment();
function recordCatch(
  f: FishActor,
  method: "Angel" | "Holzknüppel",
  disposition: "released" | "kept",
) {
  if (disposition === "kept") inventory.add(f.species);
  expansion.best[f.species] = Math.max(
    expansion.best[f.species] || 0,
    f.length,
  );
  expansion.catches.push({
    species: f.species,
    length: f.length,
    weight: f.weight,
    method,
    bait: method === "Angel" ? expansion.angling.loadout.bait : undefined,
    spot: f.spot,
    disposition,
  });
  expansion.catches = expansion.catches.slice(-500);
  if (disposition === "kept") expansion.angling.kept++;
  else expansion.angling.released++;
  missions.caught(f.species);
  const complete = reading.catch(f.species);
  const unlocks = updateUnlocks(expansion.angling, expansion.catches.length);
  const achievements = updateAchievements(expansion.angling, expansion.catches);
  toast(
    `${f.species} · ${f.length} cm · ${disposition === "kept" ? "versorgt" : "zurückgesetzt"}${complete ? " · Auftrag geschafft! Stark!" : ""}${unlocks.length ? ` · Neu: ${unlocks.join(", ")}` : ""}${achievements.length ? ` · Abzeichen: ${achievements.join(", ")}` : ""}`,
  );
  save();
}
function finishCatch(disposition: "released" | "kept") {
  if (!pendingCatch) return;
  const { fish, method } = pendingCatch;
  recordCatch(fish, method, disposition);
  if (method === "Angel") fishing.finishLanded(disposition === "released");
  else if (disposition === "released") shoal.release(fish);
  pendingCatch = null;
  fishView.hideShowcase();
  $("close").hidden = false;
  closePanel();
}
function presentCatch(fish: FishActor, method: "Angel" | "Holzknüppel") {
  pendingCatch = { fish, method };
  fishView.showShowcase(fish, true);
  const info = FISH.find((entry) => entry.name === fish.species)!;
  const rule = simulatedRule(
    fish.species,
    fish.length,
    expansion.angling.season,
  );
  const mayKeep = !expansion.angling.rulesEnabled || rule.allowed;
  openPanel(
    "DEIN FANG",
    `<div class="landing-card"><div class="landing-space" aria-label="Dreidimensionale Fangansicht"></div><h2>${fish.species}</h2><p class="catch-size">${fish.length} cm · ${fish.weight} g · ${method}</p><p>${escapeHTML(info.description)}</p><div id="fish-facts" hidden><h3>Untersuchen</h3><p><b>Erkennbar:</b> ${escapeHTML(info.features)}</p><p><b>Lebensraum:</b> ${escapeHTML(info.habitat)}</p><p><b>Nahrung:</b> ${escapeHTML(info.food)}</p></div><div class="catch-decisions"><button id="inspect-fish">Untersuchen</button><button id="release-fish">Zurücksetzen</button><button class="primary" id="keep-fish" ${mayKeep ? "" : "disabled"}>Versorgen</button></div>${expansion.angling.rulesEnabled ? `<div class="simulated-rule ${rule.allowed ? "allowed" : "protected"}"><b>${rule.allowed ? "In der Simulation entnahmefähig" : "In der Simulation zurücksetzen"}</b><p>${rule.reasons.map(escapeHTML).join(" ") || "Simuliertes Mindestmaß und Schonzeit passen."}</p></div>` : ""}<p class="hint">${escapeHTML(rule.disclaimer)} Die Versorgung bleibt bewusst sachlich und ohne grafische Verletzungsdarstellung.</p></div>`,
    true,
  );
  $("close").hidden = true;
  $("inspect-fish").onclick = () => {
    expansion.angling.inspected = [
      ...new Set([...expansion.angling.inspected, fish.species]),
    ];
    $("fish-facts").hidden = false;
    save();
  };
  $("release-fish").onclick = () => finishCatch("released");
  $("keep-fish").onclick = () => {
    if (!mayKeep) return;
    $("panel-content").classList.add("non-graphic-care");
    $("keep-fish").textContent = "Fisch wird sachlich versorgt …";
    $<HTMLButtonElement>("keep-fish").disabled = true;
    window.setTimeout(() => finishCatch("kept"), 650);
  };
}
function strike() {
  heldTools.play("strike");
  syncAim();
  const hit = fishView.hit(ray, 3.4);
  const block = ray.intersectObjects(view.group.children, false)[0];
  if (hit && (!block || block.distance > hit.distance)) {
    const f = shoal.catch(hit.fish.id);
    if (f) {
      presentCatch(f, "Holzknüppel");
      fishView.update();
      return;
    }
  }
  toast(
    "Visiere einen sichtbaren Fisch in deiner Nähe an. Der Knüppel reicht 3,4 Blöcke weit.",
  );
}
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
    "Willkommen! Du kannst überall bauen. Folge den Schildern zum See, Wald oder zur BOOM-Zone.",
  );
};
function nearLake() {
  return currentSpot()?.id === "small";
}
function currentSpot() {
  return nearAnglingSpot(player.pos[0], player.pos[1], player.pos[2]);
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
    `<h2>Ein Auftrag vom Angler</h2><p class="mission-text">„${mission.prompt}“</p><p>${completed ? "Geschafft! Dein Barsch ist in der Sammlung." : reading.active ? "Der Auftrag läuft. Du kannst jederzeit frei weiterangeln." : "Lust auf eine kleine Mission? Du kannst auch einfach angeln."}</p>${!completed && !reading.active ? '<button class="primary" id="accept">Auftrag annehmen</button>' : ""}<label>Angelziel <select id="fish-target"><option value="">Alle Fische</option>${FISH.map((f) => `<option>${f.name}</option>`).join("")}</select></label><button id="cast">${completed || reading.active ? "Angeln" : "Überspringen & angeln"}</button>${"speechSynthesis" in window ? '<button id="read">▷ Auftrag vorlesen</button>' : ""}`,
  );
  if ($("accept"))
    $("accept").onclick = () => {
      reading.accept();
      save();
      closePanel();
      prepareFishing("Flussbarsch");
    };
  $("cast").onclick = () => {
    closePanel();
    prepareFishing(
      ($<HTMLSelectElement>("fish-target")?.value || undefined) as
        | import("./fishing/Fishing").FishName
        | undefined,
    );
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
function prepareFishing(
  target?: import("./fishing/Fishing").FishName,
) {
  expansion.tool = "Angel";
  equipment();
  preferredFish =
    reading.active ||
    (missions.state("fish").accepted && !missions.state("fish").completed)
      ? "Flussbarsch"
      : target;
  toast("Halte die große Angel-Taste, wähle die Wurfkraft und lasse sie los.");
}
function interact() {
  syncAim();
  if(target){
    const block=world.get(...target);
    if(["Tür","Tür offen","Tor","Tor offen"].includes(block||"")){
      if(toggleDoor(world,target,player.pos)){save();toast("Tür oder Tor umgestellt.");}else toast("Halte den Durchgang zum Schließen frei.");return;
    }
    if(block==="Lagerkiste"){nightUI.chest();return;}
  }
  if (expansion.tool === "Holzknüppel") {
    strike();
    return;
  }
  if (["Spitzhacke", "Axt", "Steinaxt", "Schaufel"].includes(expansion.tool)) {
    destroy();
    return;
  }
  if (["Schwert","Holzschwert","Steinschwert","Bogen"].includes(expansion.tool)) {
    attack();
    return;
  }
  const nearby = (Object.keys(MISSIONS) as MissionId[]).find((id) =>
    nearMission(id),
  );
  if (nearby && !nearLake()) {
    adventure.mission(nearby);
    return;
  }
  const spot = currentSpot();
  if (spot) {
    if (spot.id === "small" && fishing.state === "idle") missionPanel();
    else if (fishing.state === "idle") prepareFishing();
    else toast("Nutze die große Angel-Taste für Biss und Drill.");
  } else if (nearBoom()) boom();
  else if (expansion.tool === "Bauwerkzeug") build();
  else toast("Gehe zum Seesteg oder in die BOOM-Zone.");
}
const rodTipWorld = new T.Vector3();
const castDirection = new T.Vector3();
let anglingPointer: number | null = null;
function anglingPress(now = performance.now()) {
  if (!canPlay() || expansion.tool !== "Angel") return;
  const spot = currentSpot();
  if (fishing.state === "idle") {
    if (!spot) {
      toast("Stelle dich an einen entdeckbaren Angelplatz am Ufer.");
      return;
    }
    fishing.beginCharge(now);
    return;
  }
  if (fishing.state === "bite") {
    if (fishing.hook(now)) {
      fishing.setReeling(true);
      toast("Sitzt! Halte zum Kurbeln, löse kurz bei hoher Spannung.");
    }
    return;
  }
  if (fishing.state === "drill") fishing.setReeling(true);
}
function anglingRelease(now = performance.now()) {
  if (fishing.state === "charging") {
    const spot = currentSpot();
    if (!spot) {
      fishing.cancel();
      toast("Der Wurf wurde abgebrochen: Geh wieder ans Ufer.");
      return;
    }
    camera.getWorldDirection(castDirection);
    heldTools.getRodTipWorld(rodTipWorld);
    if (
      fishing.releaseCast(
        now,
        spot,
        expansion.angling.loadout,
        rodTipWorld,
        castDirection,
        preferredFish,
      )
    ) {
      heldTools.play("cast");
      preferredFish = undefined;
      toast("Der Schwimmer fliegt …");
    }
  }
  fishing.setReeling(false);
}
function cancelAnglingInput() {
  if (fishing.state === "charging") fishing.cancel();
  fishing.setReeling(false);
  anglingPointer = null;
}
const fishAction = $("fish-action");
fishAction.addEventListener("pointerdown", (event) => {
  if (anglingPointer !== null) return;
  event.preventDefault();
  event.stopPropagation();
  anglingPointer = event.pointerId;
  fishAction.setPointerCapture?.(event.pointerId);
  anglingPress();
});
fishAction.addEventListener("pointerup", (event) => {
  if (event.pointerId !== anglingPointer) return;
  event.preventDefault();
  event.stopPropagation();
  anglingRelease();
  anglingPointer = null;
});
fishAction.addEventListener("pointercancel", (event) => {
  if (event.pointerId === anglingPointer) cancelAnglingInput();
});
fishAction.addEventListener("lostpointercapture", (event) => {
  if (event.pointerId === anglingPointer) cancelAnglingInput();
});
fishAction.addEventListener("contextmenu", (event) => event.preventDefault());
bindTap($("local-mission"), () => {
  if (!canPlay()) return;
  const id = (Object.keys(MISSIONS) as MissionId[]).find((id) =>
    nearMission(id),
  );
  if (id) adventure.mission(id);
});
bindTap($("interact"), () => {
  if (canPlay()) interact();
});
bindTap($("place"), () => {
  if (canPlay()) build();
});
bindTap($("break"), () => {
  if (canPlay()) destroy();
});
bindTap($("jump"), () => {
  if (canPlay()) jump = true;
});
bindTap($("zoom"), () => {
  if (!canPlay()) return;
  zoomed = !zoomed;
  updateFov();
});
bindTap($("attack"),()=>{if(canPlay())attack();});
bindTap($("word-battle"),()=>{if(canPlay())nightUI.startBattle();});
let gatherCooldown=0;
bindTap($("gather"),()=>{
  if(!canPlay())return;
  const p=player.pos;
  const tree=[...world.blocks].some(([id,b])=>{if(b!=="Laub")return false;const [x,,z]=id.split(",").map(Number);return Math.hypot(x-p[0],z-p[2])<5;});
  if(!tree){toast("Suche Beeren in der Nähe von Bäumen.");return;}
  if(gatherCooldown>0){toast("Die Pflanzen brauchen noch etwas Zeit. Erkunde einen anderen Bereich.");return;}
  night.supplies.Beeren=(night.supplies.Beeren||0)+2;gatherCooldown=25;save();toast("Zwei Beeren gesammelt. Proviant findest du im NIGHTFALL-Menü.");
});
function attack(){
  if(!WEAPONS[expansion.tool]){toast("Wähle den Holzknüppel, ein Schwert, eine Axt oder den Bogen.");return;}
  heldTools.play("strike");camera.getWorldDirection(castDirection);
  const target=zombies.attack(player.pos,[castDirection.x,castDirection.y,castDirection.z],expansion.tool);
  if(target){combatEffect(target.pos);if(settings.sound)nightAudio.cue("hit");save();}
  else if(expansion.tool==="Holzknüppel")strike();
}
function combatEffect(pos:Cell){
  for(let i=0;i<8 && particles.length<48;i++){
    const mesh=new T.Mesh(cube,particleMat);mesh.scale.setScalar(.09);mesh.position.set(pos[0],pos[1]+1,pos[2]);scene.add(mesh);
    particles.push({mesh,velocity:new T.Vector3((Math.random()-.5)*3,1+Math.random()*2,(Math.random()-.5)*3),life:.45});
  }
}
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
function biteSignal() {
  if (!settings.sound) return;
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, audio.currentTime);
    oscillator.frequency.setValueAtTime(720, audio.currentTime + 0.09);
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.23);
    oscillator.onended = () => void audio.close();
  } catch {}
}
function handleAnglingEvent(event: AnglingEvent | null) {
  if (!event) return;
  if (event === "cast-landed")
    toast("Der Schwimmer liegt im Wasser. Beobachte ihn und bleib bereit.");
  if (event === "bite") {
    biteSignal();
    toast("Biss! Drücke jetzt – dann halte zum Kurbeln.");
  }
  if (event === "bite-missed")
    toast("Der Fisch hat den Köder wieder losgelassen. Ruhig neu versuchen.");
  if (event === "line-broken")
    toast("Zu viel Spannung – die simulierte Schnur ist gerissen. Löse beim nächsten Drill kurz.");
  if (event === "slack-escape")
    toast("Die Schnur war zu lange locker. Der Fisch konnte sich lösen.");
  if (event === "no-fish")
    toast("An diesem Wurfplatz ist gerade kein passender Fisch frei.");
  if (["bite-missed", "line-broken", "slack-escape", "no-fish"].includes(event))
    fishing.acknowledgeEscape();
  if (event === "landed" && fishing.landedFish)
    presentCatch(fishing.landedFish, "Angel");
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
  if (
    e.target instanceof HTMLElement &&
    e.target.closest("input,textarea,select,[contenteditable=true]")
  )
    return;
  if (!started) return;
  if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code))
    e.preventDefault();
  if (e.repeat) return;
  if (e.code === "Escape" && !suspended) {
    if (paused) closePanel();
    else menu();
    return;
  }
  if (!canPlay()) return;
  keys.add(e.code);
  if (e.code === "KeyE") {
    if (expansion.tool === "Angel") anglingPress();
    else interact();
  }
  if (e.code === "Equal" || e.code === "NumpadAdd") build();
  if (e.code === "Minus" || e.code === "NumpadSubtract") destroy();
  if (e.code === "KeyI") $("bag").click();
  if (e.code === "KeyF") attack();
  if (e.code === "KeyR") nightUI.startBattle();
  if (e.code === "Space") jump = true;
  if (e.code === "KeyQ") {
    const available = TOOLS.filter(tool=>night.mode==="Kreativ" ||
      !["Holzschwert","Steinschwert","Steinaxt","Bogen"].includes(tool) || night.crafted.includes(tool));
    expansion.tool = available[(available.indexOf(expansion.tool) + 1) % available.length];
    equipment();
    save();
  }
  if (e.code === "KeyZ") $("undo").click();
  if (e.code === "KeyX") {
    zoomed = !zoomed;
    updateFov();
  }
  if (/Digit[1-9]/.test(e.code)) {
    selected = Number(e.code.slice(-1)) - 1;
    materialPage = Math.floor(selected / 5);
    hotbar();
  }
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  if (e.code === "KeyE" && expansion.tool === "Angel") anglingRelease();
});
function interrupt(reason: string) {
  clearInput();
  save();
  if (!started || paused || suspended) return;
  suspended = true;
  fishing.cancel();
  $("interruption-text").textContent = reason;
  $("interruption").hidden = false;
}
installLifecycle(window, document, {
  blur: () => {
    keys.clear();
    mouseDrag = false;
  },
  resetInput: clearInput,
  hide: () => interrupt("Du warst kurz weg. Bereit?"),
  leave: () => {
    save();
    interrupt("Willkommen zurück.");
  },
});
bindTap($("continue"), () => {
  if (document.hidden) return;
  clearInput();
  suspended = false;
  $("interruption").hidden = true;
  last = performance.now();
  accum = 0;
});
canvas.addEventListener("webglcontextlost", () => {
  interrupt("3D wird wiederhergestellt …");
  $("continue").setAttribute("disabled", "");
});
canvas.addEventListener("webglcontextrestored", () => {
  $("interruption-text").textContent = "3D ist wieder bereit.";
  $("continue").removeAttribute("disabled");
  viewportDirty = true;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
let mouseDrag = false,
  dragged = false,
  lastX = 0,
  lastY = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (!canPlay()) return;
  if (e.pointerType !== "mouse") return;
  mouseDrag = true;
  dragged = false;
  lastX = e.clientX;
  lastY = e.clientY;
  if (document.pointerLockElement === canvas) {
    if (e.button === 0) {
      if (expansion.tool === "Holzknüppel") attack();
      else if (expansion.tool === "Angel") anglingPress();
      else if (WEAPONS[expansion.tool] && !["Spitzhacke","Axt","Steinaxt"].includes(expansion.tool)) attack();
      else destroy();
    }
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
window.addEventListener("pointerup", (event) => {
  mouseDrag = false;
  if (
    event.pointerType === "mouse" &&
    expansion.tool === "Angel" &&
    document.pointerLockElement === canvas
  )
    anglingRelease();
});
document.addEventListener("mousemove", (e) => {
  if (!canPlay()) return;
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
  if (canPlay() && !document.pointerLockElement && !dragged) {
    if (e.shiftKey) build();
    else destroy();
  }
});
function look(x: number, y: number, s: number) {
  player.yaw -= x * s * expansion.view.sensitivity;
  player.pitch = Math.max(
    -1.45,
    Math.min(1.45, player.pitch - y * s * expansion.view.sensitivity),
  );
}
touch = new TouchControls(
  $("joystick"),
  $("look"),
  canPlay,
  (x, y) => {
    joyX = x;
    joyY = y;
    $("stick").style.transform = `translate(${x * 34}px,${-y * 34}px)`;
  },
  (x, y) => look(x, y, 0.0035),
);
let ratio = Math.min(devicePixelRatio, settings.quality),
  viewportDirty = true;
let landscape = innerWidth > innerHeight;
function resize() {
  ratio = Math.min(devicePixelRatio, settings.quality, ratio);
  viewportDirty = true;
  const nextLandscape = innerWidth > innerHeight;
  if (nextLandscape !== landscape) {
    clearInput();
    landscape = nextLandscape;
  }
  renderer.setPixelRatio(ratio);
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
function keyboardViewport() {
  document.documentElement.style.setProperty(
    "--usable-height",
    `${window.visualViewport?.height || innerHeight}px`,
  );
  document.documentElement.style.setProperty(
    "--viewport-top",
    `${window.visualViewport?.offsetTop || 0}px`,
  );
}
window.visualViewport?.addEventListener("resize", keyboardViewport);
window.visualViewport?.addEventListener("scroll", keyboardViewport);
keyboardViewport();
resize();
const diagnostics = new URLSearchParams(location.search).has("diagnostics");
let diagnosticsAt = 0,
  renderedFrames = 0,
  picks = 0;
let lastAim = 0;
let learningOffer = 0,
  offered = false;
let last = performance.now(),
  zombieAccum = 0,
  accum = 0,
  slow = 0,
  frameCount = 0,
  frameTime = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  const realElapsed = (now - last) / 1000;
  const elapsed = Math.min(realElapsed, 0.1);
  last = now;
  if (document.hidden) {
    accum = 0;
    return;
  }
  if (started && (paused || suspended)) {
    accum = 0;
    if(paused && !suspended)nightUI.tick(realElapsed);
    if (viewportDirty) {
      renderer.render(scene, camera);
      viewportDirty = false;
    }
    return;
  }
  if (canPlay()) {
    const wasNight=isNight(night.time);
    advanceDay(night,elapsed);
    if(wasNight&&!isNight(night.time)){restoreNightDamage(night);toast("Die Sonne kehrt zurück. Die Nacht ist überstanden.");save();}
    if(!wasNight&&isNight(night.time))toast(`Nacht ${night.night}: Bereite deine Verteidigung vor.`);
    vitals.tick(elapsed);gatherCooldown=Math.max(0,gatherCooldown-elapsed);
    zombies.cap=ratio<=1?4:8;
    zombieAccum+=elapsed;
    if(zombieAccum>=.1){zombies.tick(Math.min(.2,zombieAccum),player.pos,damage=>{
      if(vitals.hit(damage)){
        canvas.classList.add("hurt");setTimeout(()=>canvas.classList.remove("hurt"),180);
        if(settings.sound)nightAudio.cue("zombie");
      }
    });zombieAccum=0;}
    if(night.health<=0){
      save();openPanel("NEUER ANLAUF",'<h2>Kurze Verschnaufpause.</h2><p>Deine Welt und deine Ausrüstung warten auf dich. Am Startpunkt kannst du neu losziehen.</p><button id="respawn" class="primary">Sicher weitergehen</button>');
      $("respawn").onclick=()=>{vitals.respawn();player.pos=[0,16,17];player.vy=0;zombies.actors=[];closePanel();save();};
      return;
    }
    if(night.defeated>=1&&!expansion.badges.includes("Nachtwächter"))expansion.badges.push("Nachtwächter");
    if(night.survived>=1&&!expansion.badges.includes("Morgenlicht"))expansion.badges.push("Morgenlicht");
    $("day-label").textContent=`${isNight(night.time)?"☾":"☀"} ${dayPhase(night.time)}`;
    $("health-label").textContent=night.mode==="Kreativ"?"♥ ∞":`♥ ${Math.ceil(night.health)}`;
    $("hunger-label").textContent=`◉ ${Math.ceil(night.hunger)}`;
    $("wave-label").textContent=zombies.actors.length?`${zombies.actors.filter(z=>z.hp>0).length} Zombies`:"";
    $("word-battle").hidden=!zombies.actors.some(z=>z.hp>0&&Math.hypot(z.pos[0]-player.pos[0],z.pos[2]-player.pos[2])<12);
    $("attack").hidden=!WEAPONS[expansion.tool];
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
    if (now - lastAim >= 50) {
      aim();
      lastAim = now;
    }
    shoal.update(elapsed);
    const fishingEvent = fishing.tick(now, elapsed);
    handleAnglingEvent(fishingEvent);
    fishView.update(shoal.time);
    chestLid.rotation.x = missions.state("treasure").completed ? -1.15 : 0;
    treasureGold.visible = missions.state("treasure").completed;
    learningOffer += elapsed;
    if (learningOffer > learning.interval) {
      $("learn").classList.add("offer");
      if (!offered) {
        toast("Eine neue Challenge wartet – wenn du Lust hast.");
        offered = true;
      }
    }
    const spot = currentSpot(),
      arena = nearBoom();
    const discovered = discoverySpot(player.pos[0], player.pos[2]);
    if (discovered && !expansion.angling.spots.includes(discovered.id)) {
      expansion.angling.spots.push(discovered.id);
      const achievements = updateAchievements(
        expansion.angling,
        expansion.catches,
      );
      save();
      toast(
        `Angelplatz entdeckt: ${discovered.name}.${achievements.length ? ` Abzeichen: ${achievements.join(", ")}` : ""}`,
      );
    }
    const localMission = (Object.keys(MISSIONS) as MissionId[]).find((id) =>
      nearMission(id),
    );
    $("local-mission").hidden = !localMission;
    $("location").textContent = spot
      ? spot.name
      : arena
        ? "BOOM-Testzone"
        : player.pos[0] < -12 && player.pos[2] > 8
          ? "Dunkelwald"
          : player.pos[2] < -13
            ? "Felsenpfad"
            : "Wiesenland";
    $("context").hidden =
      !spot && !arena && !localMission && expansion.tool === "Bauwerkzeug";
    $("context-text").textContent = spot
      ? fishing.state === "bite"
        ? "Ein Biss! Jetzt anschlagen!"
        : fishing.state === "drill"
          ? "Kurbeln – bei roter Spannung kurz lösen!"
        : fishing.state === "waiting"
          ? "Warte auf den Biss …"
          : `${spot.name}: Angel bereit?`
      : arena
        ? "Bereit für einen großen Knall?"
        : "";
    $("interact").textContent = spot
      ? fishing.state === "bite"
        ? "Angel-Taste!"
        : fishing.state === "drill"
          ? "Drill läuft"
        : fishing.state === "waiting"
          ? "Angel im Wasser"
          : "E · Angelinfo"
      : arena
        ? "E · BOOM!"
        : localMission
          ? "E · Auftrag"
          : "E · Fangen";
    if (expansion.tool === "Holzknüppel")
      $("interact").textContent = "E · Fangen";
    if (["Axt", "Spitzhacke", "Schaufel"].includes(expansion.tool))
      $("interact").textContent = "E · Abbauen";
    if (["Schwert","Holzschwert","Steinschwert","Bogen"].includes(expansion.tool))
      $("interact").textContent = "E · Angreifen";
    $("interact").classList.toggle("bite", fishing.state === "bite");
    if(target && ["Tür","Tür offen","Tor","Tor offen","Lagerkiste"].includes(world.get(...target)||"")){
      $("context").hidden=false;$("interact").textContent=world.get(...target)==="Lagerkiste"?"E · Lagerkiste":"E · Öffnen / Schließen";
    }
    const showAngling =
      (expansion.tool === "Angel" && !!spot) || fishing.state !== "idle";
    $("angling-hud").hidden = !showAngling;
    $("hud").classList.toggle("angling-active", showAngling);
    const stateText: Record<string, string> = {
      idle: "Bereit zum Auswerfen",
      charging: "Wurfkraft wählen",
      flying: "Schwimmer fliegt",
      waiting: "Köder im Wasser",
      bite: "BISS – jetzt drücken!",
      drill: "Drill: Spannung halten",
      landed: "Fisch angelandet",
      escaped: "Fisch entkommen",
    };
    $("angling-state").textContent = stateText[fishing.state];
    $("cast-power").style.width = `${Math.round(fishing.power * 100)}%`;
    $("line-tension").style.width = `${Math.round(Math.min(1, fishing.tension) * 100)}%`;
    $("drill-progress").style.width = `${Math.round(fishing.progress * 100)}%`;
    $("line-tension").classList.toggle("danger", fishing.tension > 0.78);
    $("fish-action").textContent =
      fishing.state === "idle"
        ? "Halten: Auswerfen"
        : fishing.state === "charging"
          ? "Loslassen: Werfen"
          : fishing.state === "bite"
            ? "JETZT ANSCHLAGEN"
            : fishing.state === "drill"
              ? "Halten: Kurbeln"
              : "Schwimmer beobachten";
    $<HTMLButtonElement>("fish-action").disabled = ![
      "idle",
      "charging",
      "bite",
      "drill",
    ].includes(fishing.state);
    $("angling-help").textContent =
      fishing.state === "drill"
        ? "Grün halten: kurbeln. Rot: kurz lösen. Nicht lange ganz locker lassen."
        : fishing.state === "bite"
          ? "Der Schwimmer taucht – reagiere innerhalb weniger Sekunden."
          : "Gedrückt halten, Kraft wählen, dann loslassen.";
    $("reset-boom").hidden = !arena;
    $("mission-pin").hidden = !reading.active;
  } else if (!started) {
    camera.position.set(23, 18, 29);
    camera.lookAt(-2, 0, -2);
  }
  dayView.update(night.time,camera.position);
  zombieView.update(zombies);
  defenseView.update(camera.position,isNight(night.time));
  if(canPlay())nightAudio.tick(elapsed,isNight(night.time),zombies.actors.length,settings.sound);
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
  heldTools.visible = canPlay();
  heldTools.equip(
    expansion.tool,
    expansion.badges.includes("Holzhelfer"),
  );
  heldTools.fishingPose(
    fishing.state,
    fishing.tension,
    fishing.reeling,
  );
  heldTools.update(
    elapsed,
    Math.abs(joyX) + Math.abs(joyY) > 0.08 ||
      ["KeyW", "KeyA", "KeyS", "KeyD"].some((key) => keys.has(key)),
    now / 1000,
  );
  heldTools.getRodTipWorld(rodTipWorld);
  fishingView.update(fishing, rodTipWorld, now);
  canvas.dataset.toolAction = heldTools.action;
  canvas.dataset.activeTool = expansion.tool;

  water.update(now);
  fishingWaters.update(now);
  view.update();
  renderer.render(scene, camera);
  renderedFrames++;
  if (diagnostics && now - diagnosticsAt >= 1000) {
    canvas.dataset.performance = JSON.stringify({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      chunks: view.group.children.length,
      ratio,
      fov: camera.fov,
      toolAction: heldTools.action,
      particles: particles.length,
      renderedFrames,
      picks,
      angling: {
        state: fishing.state,
        power: fishing.power,
        tension: fishing.tension,
        progress: fishing.progress,
        target: fishing.target,
        spot: fishing.spot?.id || null,
      },
      nightfall:{time:night.time,phase:dayPhase(night.time),health:night.health,hunger:night.hunger,mode:night.mode,cap:zombies.cap,night:night.night,player:{pos:player.pos,yaw:player.yaw,pitch:player.pitch},zombies:zombies.actors.map(z=>({id:z.id,kind:z.kind,hp:z.hp,state:z.state,pos:z.pos}))},
      fish: shoal.actors.map((f) => ({
        id: f.id,
        species: f.species,
        x: f.x,
        y: f.y,
        z: f.z,
        alive: f.alive,
      })),
    });
    diagnosticsAt = now;
  }
  viewportDirty = false;
  if (canPlay()) {
    frameTime += realElapsed;
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
