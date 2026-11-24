/* ==========================================================
   CONFIGURATION – à modifier si besoin
   ========================================================== */
const CONFIG = {
  // Adresse de l'application Web Google Apps Script (finit par /exec).
  // Laisser vide = mode démo (rien n'est enregistré).
  API_URL: "https://script.google.com/macros/s/AKfycbxQs5gIgNxTb5l9NC80InF5OGaYgaU80MULhPen9lOeZl3qQNS7ciw-42OmqcaoXEGJ/exec",

  MAX_WISHES: 3,
  MIN_WISHES: 1,

  // Classes participantes, regroupées par école.
  CLASSES: {
    "ESD": ["B3 CI", "B3 DESIGN", "B3 MARKET", "M1 DESIGN", "M1 UXUI", "M1 VIDEO", "M2 DESIGN", "M2 UXUI", "M2 VIDEO"],
    "ESP": ["B2 COM & PUB", "B3 EVENT", "B3 PRODUCTION CREATIVE"]
  }
};

// Ateliers (source : fiches ateliers Digital Event 2027).
// Le champ "nom" est celui enregistré dans le Google Sheet : il doit rester identique à l'onglet "Ateliers".
const ATELIERS = [
  { id: 1, nom: "Mapping", encadrant: "Eric Gaudet-Traffy", places: 20, couleur: "c-lavande",
    accroche: "Transformez les murs de l'école en toile vivante",
    description: "Projeter des images et des animations sur des surfaces et des volumes réels pour les transformer en œuvres visuelles. En équipe, vous imaginerez un scénario, créerez les contenus animés, puis les ajusterez à l'architecture pour offrir au public une projection spectaculaire.",
    logiciels: "HeavyM, After Effects, Premiere Pro", competences: "Scénarisation, animation, calage sur surface" },
  { id: 2, nom: "Livestream", encadrant: "Mathieu Brochier", places: 17, couleur: "c-jaune",
    accroche: "Prenez les commandes du direct",
    description: "Concevoir et animer une émission diffusée en direct pendant le Digital Event. En équipe, vous définirez le format et le déroulé, répartirez les rôles (réalisation, image, son, animation) et donnerez au live une identité visuelle propre.",
    logiciels: "OBS Studio, Premiere Pro", competences: "Réalisation en direct, mixage audio, animation de live" },
  { id: 3, nom: "Expérience visiteur", encadrant: "Natacha Ondet", places: 18, couleur: "c-ocre",
    accroche: "Et si le public devenait le héros de l'événement ?",
    description: "Imaginer le parcours des visiteurs et visiteuses, de leur arrivée jusqu'à leur départ. En équipe, vous travaillerez chaque étape (accueil, circulation, interactions, ambiance) pour la rendre fluide, surprenante et mémorable, puis la mettrez en œuvre sur place.",
    logiciels: "Figma, Illustrator", competences: "Parcours utilisateur, scénographie, coordination d'équipe" },
  { id: 4, nom: "Prod de Contenu", encadrant: "Mathéo Meynier", places: 20, couleur: "c-rouge",
    accroche: "Créez les contenus qui donnent vie à l'événement",
    description: "Produire les contenus qui accompagneront le Digital Event : photos, vidéos, visuels et formats courts pour les réseaux. En équipe, vous définirez une ligne éditoriale, planifierez la production, capterez et monterez vos contenus, puis les diffuserez pendant l'événement.",
    logiciels: "Photoshop, Premiere Pro, After Effects", competences: "Photo, vidéo, montage, ligne éditoriale" },
  { id: 5, nom: "Court-métrage", encadrant: "Frédéric Cifarelli", places: 20, couleur: "c-lavande",
    accroche: "Racontez une histoire en quelques minutes",
    description: "Réaliser un court-métrage de l'idée jusqu'à la projection. En équipe, vous écrirez le scénario, préparerez le tournage, filmerez, monterez puis étalonnerez votre film, avant de le présenter au public.",
    logiciels: "Premiere Pro, DaVinci Resolve", competences: "Écriture de scénario, tournage, montage, étalonnage" },
  { id: 6, nom: "Escape Game", encadrant: "Sylvain Chirollet", places: 18, couleur: "c-jaune",
    accroche: "Saurez-vous trouver la sortie ?",
    description: "Concevoir un escape game que le public pourra jouer pendant le Digital Event. En équipe, vous imaginerez l'histoire, construirez les énigmes, les décors et les ambiances, puis testerez et ajusterez l'ensemble pour une expérience immersive et bien rythmée.",
    logiciels: "Figma, Illustrator, Photoshop", competences: "Game design, écriture d'énigmes, scénographie" },
  { id: 7, nom: "DA & Branding", encadrant: "Mathieu Surrel", places: 20, couleur: "c-ocre",
    accroche: "Donnez une identité forte à l'événement",
    description: "Construire l'univers visuel du Digital Event : direction artistique, identité graphique et déclinaisons sur différents supports. En équipe, vous définirez l'intention créative, concevrez les éléments de marque et veillerez à leur cohérence sur tout l'événement.",
    logiciels: "Illustrator, Photoshop, InDesign, Figma", competences: "Direction artistique, identité graphique, déclinaisons" },
  { id: 8, nom: "Motion & VFX", encadrant: "Frédéric Cifarelli", places: 20, couleur: "c-rouge",
    accroche: "Faites bouger les images",
    description: "Créer des animations et des effets visuels pour le Digital Event. En équipe, vous imaginerez vos séquences, les animerez, y intégrerez des effets spéciaux, puis les assemblerez pour proposer un rendu spectaculaire au public.",
    logiciels: "After Effects, Cinema 4D, Premiere Pro", competences: "Animation, effets visuels, compositing" }
];

/* ==========================================================
   ÉTAT
   ========================================================== */
const state = {
  step: 1,
  wishes: Array(CONFIG.MAX_WISHES).fill(null), // ids d'ateliers
  nogo: null,
  target: null // emplacement en cours d'édition : 0..2 ou "nogo"
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const byId = id => ATELIERS.find(a => a.id === id);
const pad = n => String(n).padStart(2, "0");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ==========================================================
   NAVIGATION
   ========================================================== */
function goTo(step) {
  state.step = step;
  $$(".step").forEach(s => { s.hidden = Number(s.dataset.step) !== step; });
  $$(".stepper li").forEach(li => {
    const n = Number(li.dataset.step);
    li.classList.toggle("is-current", n === step);
    li.classList.toggle("is-done", n < step);
    const dot = $(".dot", li);
    dot.textContent = n < step ? "✓" : n;
    if (n === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
  if (step === 3) renderRecap();
  const h = $(`.step[data-step="${step}"] h1`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
}

/* ==========================================================
   ÉTAPE 1 – PROFIL
   ========================================================== */
function initClasses() {
  const sel = $("#classe");
  Object.entries(CONFIG.CLASSES).forEach(([ecole, classes]) => {
    const g = document.createElement("optgroup");
    g.label = ecole;
    classes.forEach(c => {
      const o = document.createElement("option");
      o.value = `${ecole} · ${c}`;
      o.textContent = c;
      g.appendChild(o);
    });
    sel.appendChild(g);
  });
}

function setError(id, msg) {
  const el = $(`.err[data-for="${id}"]`);
  if (el) el.textContent = msg || "";
  $(`#${id}`).closest(".field").classList.toggle("has-error", !!msg);
}

function validateProfil() {
  let ok = true;
  const checks = [
    ["classe", "Choisissez votre classe."],
    ["nom", "Indiquez votre nom."],
    ["prenom", "Indiquez votre prénom."]
  ];
  checks.forEach(([id, msg]) => {
    const v = $(`#${id}`).value.trim();
    const bad = !v || (id !== "classe" && v.length < 2);
    setError(id, bad ? msg : "");
    if (bad && ok) { $(`#${id}`).focus(); ok = false; }
  });
  return ok;
}

/* ==========================================================
   ÉTAPE 2 – VŒUX
   ========================================================== */
function slotLabel(i) {
  return i === 0 ? "Vœu 1 · mon préféré" : `Vœu ${i + 1}`;
}

function filledBox(a) {
  return `<span class="num ${a.couleur}">${pad(a.id)}</span>
          <span class="name">${esc(a.nom)}<span class="who">avec ${esc(a.encadrant)}</span></span>`;
}

function renderSlots() {
  const wrap = $("#slots");
  wrap.innerHTML = "";
  state.wishes.forEach((id, i) => {
    const a = id ? byId(id) : null;
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.innerHTML = `
      <h3 class="slot-title"><span class="rank">${i + 1}</span>${slotLabel(i)}</h3>
      <button type="button" class="slot-box ${a ? "filled" : ""}" data-slot="${i}"
        aria-label="${a ? `${slotLabel(i)} : ${esc(a.nom)}. Changer` : `Choisir le vœu ${i + 1}`}">
        ${a ? filledBox(a) : '<span class="plus" aria-hidden="true">+</span>'}
      </button>
      <div class="slot-tools">
        ${a && i > 0 ? `<button type="button" data-move="${i}" data-dir="-1" aria-label="Monter ce vœu en position ${i}">Monter</button>` : ""}
        ${a && i < CONFIG.MAX_WISHES - 1 && state.wishes[i + 1] ? `<button type="button" data-move="${i}" data-dir="1" aria-label="Descendre ce vœu en position ${i + 2}">Descendre</button>` : ""}
        ${a ? `<button type="button" data-clear="${i}" aria-label="Retirer le vœu ${i + 1}">Retirer</button>` : ""}
      </div>`;
    wrap.appendChild(slot);
  });

  const n = state.nogo ? byId(state.nogo) : null;
  $("#slot-nogo").innerHTML = `
    <div class="slot slot-nogo">
      <button type="button" class="slot-box ${n ? "filled" : ""}" data-slot="nogo"
        aria-label="${n ? `No go : ${esc(n.nom)}. Changer` : "Choisir mon no go"}">
        ${n ? filledBox(n) : '<span class="plus" aria-hidden="true">+</span>'}
      </button>
      <div class="slot-tools">${n ? '<button type="button" data-clear="nogo">Retirer</button>' : ""}</div>
    </div>`;
}

// Les vœux restent compacts : pas de vœu 2 sans vœu 1.
function compactWishes() {
  const filled = state.wishes.filter(Boolean);
  state.wishes = [...filled, ...Array(CONFIG.MAX_WISHES - filled.length).fill(null)];
}

function openPicker(target) {
  state.target = target;
  const isNogo = target === "nogo";
  $("#picker-title").textContent = isNogo ? "Mon no go" : `Vœu ${Number(target) + 1}`;
  const list = $("#picker-list");
  list.innerHTML = "";

  ATELIERS.forEach(a => {
    const wIdx = state.wishes.indexOf(a.id);
    let taken = "";
    if (isNogo && wIdx !== -1) taken = `Déjà en vœu ${wIdx + 1}`;
    if (!isNogo && state.nogo === a.id) taken = "C'est votre no go";
    const isCurrent = isNogo ? state.nogo === a.id : state.wishes[target] === a.id;
    const swap = !isNogo && wIdx !== -1 && !isCurrent; // déjà dans un autre vœu → on échange

    const el = document.createElement("article");
    el.className = "ws" + (taken ? " is-taken" : "");
    el.innerHTML = `
      <span class="num ${a.couleur}">${pad(a.id)}</span>
      <div>
        <div class="ws-title">${esc(a.nom)}</div>
        <div class="ws-meta">Avec ${esc(a.encadrant)} · ${a.places} places</div>
      </div>
      <div class="ws-pick">
        ${taken ? `<span class="ws-badge">${taken}</span>`
          : isCurrent ? `<span class="ws-badge">Sélectionné</span>`
          : `<button type="button" class="btn ${isNogo ? "btn-ghost" : "btn-primary"}" data-pick="${a.id}">
               ${swap ? `Passer en vœu ${Number(target) + 1}` : "Choisir"}</button>`}
      </div>
      <p class="ws-tag">${esc(a.accroche)}</p>
      <details>
        <summary>En savoir plus</summary>
        <p>${esc(a.description)}</p>
        <ul>
          <li><strong>Logiciels :</strong> ${esc(a.logiciels)}</li>
          <li><strong>Compétences :</strong> ${esc(a.competences)}</li>
        </ul>
      </details>`;
    list.appendChild(el);
  });

  const dlg = $("#picker");
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  list.scrollTop = 0;
}

function closePicker() {
  const dlg = $("#picker");
  if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
}

function pick(id) {
  const t = state.target;
  if (t === "nogo") {
    state.nogo = id;
  } else {
    const i = Number(t);
    const prev = state.wishes.indexOf(id);
    if (prev !== -1) state.wishes[prev] = state.wishes[i]; // échange
    state.wishes[i] = id;
    compactWishes();
  }
  closePicker();
  renderSlots();
  $("#err-wishes").textContent = "";
  const focusSel = t === "nogo" ? '[data-slot="nogo"]' : `[data-slot="${state.wishes.indexOf(id)}"]`;
  const f = $(focusSel);
  if (f) f.focus();
}

function validateWishes() {
  const sansPref = $("#sans-pref").checked;
  const n = state.wishes.filter(Boolean).length;
  if (!sansPref && n < CONFIG.MIN_WISHES) {
    return "Choisissez au moins un atelier, ou activez « Je n'ai pas de préférence ».";
  }
  if (state.nogo && !sansPref && state.wishes.includes(state.nogo)) {
    return "Votre no go ne peut pas faire partie de vos vœux.";
  }
  return "";
}

/* ==========================================================
   ÉTAPE 3 – RÉCAP & ENVOI
   ========================================================== */
function payload() {
  const sansPref = $("#sans-pref").checked;
  const w = sansPref ? [] : state.wishes.filter(Boolean);
  return {
    classe: $("#classe").value,
    nom: $("#nom").value.trim(),
    prenom: $("#prenom").value.trim().replace(/\s+/g, " ").toLowerCase()
      .replace(/(^|[\s\-'])(\S)/g, (m, a, b) => a + b.toUpperCase()),
    sansPreference: sansPref,
    voeu1: w[0] ? byId(w[0]).nom : "",
    voeu2: w[1] ? byId(w[1]).nom : "",
    voeu3: w[2] ? byId(w[2]).nom : "",
    noGo: state.nogo ? byId(state.nogo).nom : "",
    commentaire: $("#commentaire").value.trim(),
    website: $("#website").value // anti-robots
  };
}

function tag(nom) {
  const a = ATELIERS.find(x => x.nom === nom);
  return a ? `<span class="tag ${a.couleur}">${pad(a.id)}</span>${esc(a.nom)}` : "—";
}

function renderRecap() {
  const p = payload();
  const rows = [
    ["Classe", esc(p.classe)],
    ["Nom", esc(p.nom.toUpperCase())],
    ["Prénom", esc(p.prenom)]
  ];
  if (p.sansPreference) {
    rows.push(["Vœux", "Pas de préférence"]);
  } else {
    [p.voeu1, p.voeu2, p.voeu3].forEach((v, i) => { if (v) rows.push([`Vœu ${i + 1}`, tag(v)]); });
  }
  rows.push(["No go", p.noGo ? tag(p.noGo) : "Aucun"]);
  if (p.commentaire) rows.push(["Commentaire", `<span style="font-weight:400">${esc(p.commentaire)}</span>`]);
  $("#recap").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
}

async function send() {
  const btn = $("#send");
  const err = $("#err-send");
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Envoi en cours…";
  const data = payload();

  try {
    if (!CONFIG.API_URL) {
      await new Promise(r => setTimeout(r, 700));
      console.info("[Mode démo] Réponse non enregistrée :", data);
    } else {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        // text/plain évite la requête préalable CORS, non gérée par Apps Script
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });
      const out = await res.json();
      if (!out.ok) {
        if (out.code === "closed") { showClosed(); return; }
        throw new Error(out.message || "Erreur inconnue");
      }
    }
    $("#thanks").textContent = `Merci ${data.prenom}, vos vœux ont bien été enregistrés.`;
    goTo(4);
  } catch (e) {
    console.error(e);
    err.textContent = "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez. Si le problème continue, prévenez l'équipe pédagogique.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Envoyer mes vœux";
  }
}

function showClosed() {
  $$(".step").forEach(s => { s.hidden = true; });
  $("#closed-banner").hidden = false;
  $(".stepper").hidden = true;
}

async function checkOpen() {
  if (!CONFIG.API_URL) { $("#demo-banner").hidden = false; return; }
  try {
    const res = await fetch(CONFIG.API_URL + "?action=status");
    const out = await res.json();
    if (out && out.open === false) showClosed();
  } catch (e) { /* en cas d'échec, on laisse le formulaire ouvert ; le serveur vérifiera à l'envoi */ }
}

/* ==========================================================
   BRANCHEMENTS
   ========================================================== */
function init() {
  initClasses();
  renderSlots();
  goTo(1);
  checkOpen();

  $("#form-profil").addEventListener("submit", e => {
    e.preventDefault();
    if (validateProfil()) goTo(2);
  });
  ["classe", "nom", "prenom"].forEach(id => $(`#${id}`).addEventListener("input", () => setError(id, "")));

  $$("[data-go]").forEach(b => b.addEventListener("click", () => goTo(Number(b.dataset.go))));

  document.addEventListener("click", e => {
    const slot = e.target.closest("[data-slot]");
    if (slot) {
      const t = slot.dataset.slot;
      if (t === "nogo") return openPicker("nogo");
      // un clic sur un emplacement vide au-delà du premier vide → on cible le premier vide
      const i = Number(t);
      const firstEmpty = state.wishes.indexOf(null);
      openPicker(state.wishes[i] || firstEmpty === -1 ? i : Math.min(i, firstEmpty));
      return;
    }
    const pk = e.target.closest("[data-pick]");
    if (pk) return pick(Number(pk.dataset.pick));
    const clr = e.target.closest("[data-clear]");
    if (clr) {
      if (clr.dataset.clear === "nogo") state.nogo = null;
      else { state.wishes[Number(clr.dataset.clear)] = null; compactWishes(); }
      return renderSlots();
    }
    const mv = e.target.closest("[data-move]");
    if (mv) {
      const i = Number(mv.dataset.move), j = i + Number(mv.dataset.dir);
      [state.wishes[i], state.wishes[j]] = [state.wishes[j], state.wishes[i]];
      renderSlots();
      const f = $(`[data-slot="${j}"]`);
      if (f) f.focus();
    }
  });

  $("#picker-close").addEventListener("click", closePicker);
  $("#picker").addEventListener("click", e => { if (e.target.id === "picker") closePicker(); });

  $("#sans-pref").addEventListener("change", e => {
    $("#wishes-block").classList.toggle("is-disabled", e.target.checked);
    $("#wishes-block").setAttribute("aria-disabled", e.target.checked);
    $("#err-wishes").textContent = "";
  });

  $("#commentaire").addEventListener("input", e => { $("#count").textContent = e.target.value.length; });

  $("#to-recap").addEventListener("click", () => {
    const msg = validateWishes();
    $("#err-wishes").textContent = msg;
    if (!msg) goTo(3);
  });

  $("#send").addEventListener("click", send);
  $("#restart").addEventListener("click", () => goTo(2));
}

document.addEventListener("DOMContentLoaded", init);
