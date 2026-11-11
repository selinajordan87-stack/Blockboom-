import { LearningEngine, CHALLENGES, type Challenge } from "../learning/Engine";
import { speak } from "../learning/Speech";
import { Missions, MISSIONS, type MissionId } from "../missions/Missions";
export const escapeHTML = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
interface Host {
  open: (tag: string, html: string) => void;
  save: () => boolean;
  near: (id: MissionId) => boolean;
  toast: (text: string) => void;
}
const $ = (id: string) => document.getElementById(id)!;
export class AdventureUI {
  private slowTimer = 0;
  constructor(
    public engine: LearningEngine,
    public missions: Missions,
    private host: Host,
  ) {}
  private save() {
    let ok = false;
    try {
      ok = this.engine.save(localStorage);
    } catch {}
    const worldOK = this.host.save();
    if (!ok || !worldOK)
      this.host.toast(
        "Speichern ist gerade nicht möglich. Bitte Browser-Speicher prüfen.",
      );
  }
  journal() {
    this.host.open(
      "AUFTRÄGE",
      `<h2>Dein Abenteuerbuch</h2><p>Alle Aufträge sind freiwillig. Bauen und Werkzeuge bleiben frei.</p><div class="mission-list">${(
        Object.keys(MISSIONS) as MissionId[]
      )
        .map((id) => {
          const m = this.missions.state(id);
          return `<button data-mission="${id}"><b>${MISSIONS[id].title}</b><small>${m.completed ? "Abgeschlossen ✓" : m.accepted ? `Schritt ${m.step + 1}` : "Noch nicht begonnen"} · ${id === "wood" ? "Mara am Bauplatz" : id === "fish" ? "Angler am Seesteg" : "Kiste am Entdeckerpfad"}</small></button>`;
        })
        .join("")}</div>`,
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-mission]")
      .forEach(
        (b) => (b.onclick = () => this.mission(b.dataset.mission as MissionId)),
      );
  }
  mission(id: MissionId) {
    clearInterval(this.slowTimer);
    this.missions.wood();
    const m = this.missions.state(id),
      info = MISSIONS[id];
    let readText: string = info.prompt;
    let content = `<h2>${info.title}</h2><p class="mission-text">${info.prompt}</p><p>Belohnung: ${info.reward}</p><div id="mission-progress">${m.completed ? "Auftrag geschafft! Deine Belohnung ist im Inventar." : m.accepted ? `Fortschritt: ${m.step + 1} / ${id === "treasure" ? 4 : 3}` : "Du entscheidest, ob du mitmachst."}</div>`;
    if (!m.completed) {
      if (!m.accepted)
        content +=
          '<button class="primary" id="mission-accept">Auftrag annehmen</button>';
      else if (id === "wood" && m.step === 0)
        content += `<p>Holz gesammelt: ${this.missions.data.materials.Holz || 0} / 3. Gehe zu einem Baum und baue drei Holzblöcke ab.</p>`;
      else if (id === "fish" && m.step === 0)
        content +=
          "<p>Fange einen Fisch mit dunklen Streifen: den Barsch. Angel oder Holzknüppel sind möglich. Beim Angeln kannst du die gesuchte Art wählen.</p>";
      else if (this.missions.ready(id))
        content += this.host.near(id)
          ? '<button class="primary" id="mission-claim">Abgeben & Belohnung holen</button>'
          : "<p>Kehre zum Auftraggeber zurück, um die Belohnung zu holen.</p>";
      else if (id === "treasure" && !this.host.near(id))
        content +=
          "<p>Folge dem Schild „Entdeckerpfad“ zur Kiste. Dort kannst du die Rätsel lösen.</p>";
      else {
        const prompts =
          id === "wood"
            ? "Ergänze: Bretter entstehen aus ____."
            : id === "fish"
              ? "Schreibe den Namen deines gesuchten Fisches."
              : [
                  "Aus welchem durchsichtigen Material ist das Fenster?",
                  "Bretter entstehen aus welchem Material?",
                  "Schreibe das Zielwort: Schatz.",
                ][m.step];
        readText = prompts!;
        content += this.form(prompts!);
      }
    }
    content +=
      '<div class="learning-help"><button id="mission-read">▷ Vorlesen</button><button id="mission-hint">Hinweis</button><button id="mission-syllables">Silben</button><button id="mission-slow">Wort langsam</button><button id="mission-back">Auftragsbuch</button></div><p id="learning-feedback" role="status"></p>';
    this.host.open("LERNMISSION", content);
    if ($("mission-accept"))
      $("mission-accept").onclick = () => {
        this.missions.accept(id);
        this.save();
        this.mission(id);
      };
    if ($("mission-claim"))
      $("mission-claim").onclick = () => {
        if (this.host.near(id) && this.missions.claim(id)) {
          this.save();
          this.mission(id);
        }
      };
    if ($("answer-form"))
      ($("answer-form") as HTMLFormElement).onsubmit = (e) => {
        e.preventDefault();
        const answer = ($("learning-answer") as HTMLInputElement).value;
        const c = CHALLENGES.find(
          (c) => c.target === this.missions.solution(id),
        )!;
        this.engine.assess(c, answer);
        this.save();
        if (this.missions.answer(id, answer)) {
          this.save();
          this.mission(id);
        } else
          $("learning-feedback").textContent =
            "Noch nicht ganz. Der Hinweis hilft dir weiter. Du kannst jederzeit später weitermachen.";
      };
    $("mission-read").onclick = () => {
      const c = CHALLENGES.find((c) => c.target === this.missions.solution(id));
      if (c) this.engine.hint(c);
      this.save();
      $("learning-feedback").textContent = speak(readText);
    };
    $("mission-hint").onclick = () => {
      const c = CHALLENGES.find((c) => c.target === this.missions.solution(id));
      if (c) this.engine.hint(c);
      this.save();
      $("learning-feedback").textContent =
        m.accepted && m.step > 0
          ? `Gesuchtes Wort: ${this.missions.solution(id)}.`
          : id === "wood"
            ? "Die braunen Stämme der Bäume liefern Holz."
            : id === "fish"
              ? "Gesucht ist ein Flussbarsch. Du darfst „Barsch“ schreiben."
              : "Die Wörter sind Glas, Holz und Schatz.";
    };
    $("mission-syllables").onclick = () => {
      const c = CHALLENGES.find((c) => c.target === this.missions.solution(id));
      if (c) {
        this.engine.hint(c);
        $("learning-feedback").textContent = c.syllables;
        this.save();
      }
    };
    $("mission-slow").onclick = () => {
      const c = CHALLENGES.find((c) => c.target === this.missions.solution(id));
      if (c) this.engine.hint(c);
      this.save();
      clearInterval(this.slowTimer);
      const word = this.missions.solution(id),
        out = $("learning-feedback");
      let n = 0;
      out.textContent = "";
      this.slowTimer = window.setInterval(() => {
        if (!out.isConnected || n >= word.length) {
          clearInterval(this.slowTimer);
          return;
        }
        out.textContent = word.slice(0, ++n);
      }, 240);
    };
    $("mission-back").onclick = () => this.journal();
    this.save();
  }
  private form(prompt: string) {
    return `<form id="answer-form"><label for="learning-answer">${prompt}</label><input id="learning-answer" name="answer" type="text" maxlength="60" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="done"><button type="submit" class="primary" id="answer-submit">Prüfen</button></form>`;
  }
  challenge() {
    clearInterval(this.slowTimer);
    const c = this.engine.select();
    this.save();
    this.renderChallenge(c);
  }
  private renderChallenge(c: Challenge) {
    let solved = false;
    const started = performance.now();
    const choices = c.options.slice();
    if (choices.length) {
      const shift = Number(c.id.slice(-2)) % 3;
      choices.push(...choices.splice(0, shift));
    }
    this.host.open(
      "LERN-CHALLENGE",
      `<h2>Eine kleine Entdeckung</h2><p class="challenge-domain">${c.domain} · Stufe ${c.level}</p><p id="challenge-prompt" class="mission-text">${escapeHTML(c.prompt)}</p>${choices.length ? `<div class="answer-choices">${choices.map((v) => `<button data-answer="${escapeHTML(v)}">${escapeHTML(v)}</button>`).join("")}</div>` : this.form(c.kind === "gap" ? "Fehlender Buchstabe oder ganzes Wort:" : "Deine Antwort:")}<label class="timer-option"><input type="checkbox" id="challenge-timer"> Zeit freiwillig anzeigen</label><p id="learning-feedback" role="status"></p><p id="learning-aid" role="status"></p><div class="learning-help"><button id="challenge-read">▷ Vorlesen</button><button id="challenge-hint">Hinweis</button><button id="challenge-syllables">Silben</button><button id="challenge-slow">Wort langsam</button></div><div class="learning-help"><button id="challenge-skip">Überspringen</button><button id="challenge-next">Andere Aufgabe</button></div>`,
    );
    const answer = (text: string) => {
      if (solved) return;
      const r = this.engine.assess(c, text);
      $("learning-feedback").textContent = r.feedback;
      if (r.correct) {
        solved = true;
        this.missions.data.tokens += c.reward;
        $("learning-feedback").textContent += ` +${c.reward} Sterne.`;
        if (($("challenge-timer") as HTMLInputElement).checked)
          $("learning-feedback").textContent +=
            ` Deine freiwillige Zeit: ${Math.round((performance.now() - started) / 1000)} Sekunden.`;
        document
          .querySelectorAll<HTMLButtonElement>("[data-answer],#answer-submit")
          .forEach((b) => (b.disabled = true));
      } else if (r.offerHelp)
        $("learning-aid").textContent = this.engine.hint(c);
      this.save();
    };
    if ($("answer-form"))
      ($("answer-form") as HTMLFormElement).onsubmit = (e) => {
        e.preventDefault();
        answer(($("learning-answer") as HTMLInputElement).value);
      };
    document
      .querySelectorAll<HTMLButtonElement>("[data-answer]")
      .forEach((b) => (b.onclick = () => answer(b.dataset.answer!)));
    $("challenge-read").onclick = () => {
      this.engine.hint(c);
      $("learning-aid").textContent = speak(c.speech);
      this.save();
    };
    $("challenge-hint").onclick = () => {
      $("learning-aid").textContent = this.engine.hint(c);
      this.save();
    };
    $("challenge-syllables").onclick = () => {
      this.engine.hint(c);
      $("learning-aid").textContent = c.syllables;
      this.save();
    };
    $("challenge-slow").onclick = () => {
      this.engine.hint(c);
      this.save();
      clearInterval(this.slowTimer);
      let n = 0;
      const out = $("learning-aid");
      out.textContent = "";
      this.slowTimer = window.setInterval(() => {
        if (!out.isConnected || n >= c.target.length) {
          clearInterval(this.slowTimer);
          return;
        }
        out.textContent = c.target.slice(0, ++n);
      }, 240);
    };
    $("challenge-skip").onclick = () => {
      if (!solved) this.engine.skip(c);
      this.save();
      this.challenge();
    };
    $("challenge-next").onclick = () => {
      if (!solved) this.engine.skip(c);
      this.save();
      this.challenge();
    };
  }
}
