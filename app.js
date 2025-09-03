// v=2025-09-03-3
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, deleteUser, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, update, query, orderByChild, equalTo, remove,
  startAt, endAt, limitToFirst
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtw8q24h9eiCO8pIR8jqVaD_eIWtR-MCE",
  authDomain: "stamptour-pwa.firebaseapp.com",
  projectId: "stamptour-pwa",
  storageBucket: "stamptour-pwa.appspot.com",
  messagingSenderId: "751009851376",
  appId: "1:751009851376:web:e9280e3a92754de9ed5f35",
  databaseURL: "https://stamptour-pwa-default-rtdb.asia-southeast1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// 세션 지속성
(async () => {
  try { await setPersistence(auth, browserLocalPersistence); } catch(e) { console.warn(e); }
})();

// ===== 데이터 상수 =====
const STAMP_IMAGES = {
  "Static": "./stamps/static.png",
  "인포메티카": "./stamps/informatica.png",
  "배째미": "./stamps/bae.png",
  "생동감": "./stamps/life.png",
  "마스터": "./stamps/master.png",
  "Z-one": "./stamps/zone.png",
  "셈터": "./stamps/semter.png",
  "시그너스": "./stamps/cygnus.png",
  "케미어스": "./stamps/chemius.png",
  "넛츠": "./stamps/nuts.png",
  "스팀": "./stamps/steam.png",
  "오토메틱": "./stamps/automatic.png",
  "플럭스": "./stamps/flux.png"
};
const BOOTH_INFO = {
  "Static": { img: "./booths/static.png", desc: "Static 부스 소개글입니다." },
  "인포메티카": { img: "./booths/informatica.png", desc: "인포메티카 부스 소개글입니다." },
  "배째미": { img: "./booths/bae.png", desc: "배째미 부스 소개글입니다." },
  "생동감": { img: "./booths/life.png", desc: "생동감 부스 소개글입니다." },
  "마스터": { img: "./booths/master.png", desc: "마스터 부스 소개글입니다." },
  "Z-one": { img: "./booths/zone.png", desc: "Z-one 부스 소개글입니다." },
  "셈터": { img: "./booths/semter.png", desc: "셈터 부스 소개글입니다." },
  "시그너스": { img: "./booths/cygnus.png", desc: "시그너스 부스 소개글입니다." },
  "케미어스": { img: "./booths/chemius.png", desc: "케미어스 부스 소개글입니다." },
  "넛츠": { img: "./booths/nuts.png", desc: "넛츠 부스 소개글입니다." },
  "스팀": { img: "./booths/steam.png", desc: "스팀 부스 소개글입니다." },
  "오토메틱": { img: "./booths/automatic.png", desc: "오토메틱 부스 소개글입니다." },
  "플럭스": { img: "./booths/flux.png", desc: "플럭스 부스 소개글입니다." }
};
const STAFF_PASSWORDS = {
  "pw1": "Static","pw2": "인포메티카","pw3": "배째미","pw4": "생동감","pw5": "마스터",
  "pw6": "Z-one","pw7": "셈터","pw8": "시그너스","pw9": "케미어스","pw10": "넛츠",
  "pw11": "스팀","pw12": "오토메틱","pw13": "플럭스"
};

// ===== DOM =====
const loginSection  = document.getElementById("login-section");
const signupSection = document.getElementById("signup-section");
const appSection    = document.getElementById("app-section");
const boothSection  = document.getElementById("booth-section");
const reserveSection= document.getElementById("reserve-section");
const staffLoginSection = document.getElementById("staff-login-section");
const staffSection  = document.getElementById("staff-section");
const settingsSection = document.getElementById("settings-section");

const loginBtn      = document.getElementById("login");
const goSignupBtn   = document.getElementById("go-signup");
const signupBtn     = document.getElementById("signup");
const logoutBtn     = document.getElementById("logout");
const userDisplay   = document.getElementById("user-display");

const settingsBtn   = document.getElementById("settings-btn");
const settingsNick  = document.getElementById("settings-nickname");
const settingsPhone = document.getElementById("settings-phone");
const settingsMsg   = document.getElementById("settings-msg");

// ===== FourCut 전역/템플릿 =====
const cameraFab = document.getElementById("cameraFab");
const fcOverlay = document.getElementById("fourcut-overlay");
const fcStage   = document.getElementById("fourcut-stage");
const fcSlots   = fcStage ? [...fcStage.querySelectorAll(".fc-slot")] : [];
const fcVideo   = document.getElementById("fc-video");
const fcShot    = document.getElementById("fc-shot");
const fcFlip    = document.getElementById("fc-flip");
const fcSel     = document.getElementById("fc-sel");
const fcSelCam  = document.getElementById("fc-sel-cam");
const fcOpen    = document.getElementById("fc-open");
// const fcFace = document.getElementById("fc-face");  // (제거됨)
const fcSave    = document.getElementById("fc-save");
const fcClose   = document.getElementById("fourcut-close");
const fcImport  = document.getElementById("fourcut-import");
const fcFile    = document.getElementById("fc-file");
const fcLivePanel   = document.getElementById("fc-live-panel");
const fcCameraPanel = document.getElementById("fc-camera-panel");
const modeLiveRadio = document.getElementById("fc-mode-live");
const modeCamRadio  = document.getElementById("fc-mode-camera");

const FOURCUT_TEMPLATE = "./templates/fourcut_600x1800.png";
let _fcTemplateImg = null;
if (FOURCUT_TEMPLATE) {
  _fcTemplateImg = new Image();
  _fcTemplateImg.src = FOURCUT_TEMPLATE;
}

let _fcStream = null;
let _fcUseBack = true; // 라이브 프리뷰 전/후면
let _fcMode = "live";  // 'live' | 'camera'
// 크기 조절/이동 비활성화
const ALLOW_ADJUST = false;

const _fcStates = [0,1,2,3].map(() => ({ img:null, w:0, h:0, sx:1, ox:0, oy:0 }));
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// ===== 화면 전환 =====
function toggleCameraFab(show){ if (cameraFab) cameraFab.style.display = show ? "block" : "none"; }

function showLoginOnly() {
  loginSection.style.display  = "block";
  signupSection.style.display = "none";
  appSection.style.display    = "none";
  boothSection.style.display  = "none";
  reserveSection.style.display= "none";
  staffLoginSection.style.display = "none";
  staffSection.style.display  = "none";
  settingsSection.style.display = "none";
  settingsBtn.style.display   = "none";
}

async function renderLoggedInUI(user) {
  loginSection.style.display  = "none";
  signupSection.style.display = "none";
  appSection.style.display    = "block";
  boothSection.style.display  = "none";
  reserveSection.style.display= "none";
  staffLoginSection.style.display = "none";
  staffSection.style.display  = "none";
  settingsSection.style.display = "none";
  settingsBtn.style.display   = "flex";

  try {
    const nickSnap = await get(ref(db, `users/${user.uid}/profile/nickname`));
    userDisplay.textContent = nickSnap.exists() ? nickSnap.val() : (user.email || "");
  } catch { userDisplay.textContent = user.email || ""; }

  await loadStamps(user.uid);
  await renderBoothList();
}

// ===== 입력 보조 =====
const suNicknameInput = document.getElementById("su-nickname");
if (suNicknameInput) {
  suNicknameInput.addEventListener("input", (e) => {
    if (e.target.value.length > 8) e.target.value = e.target.value.slice(0, 8);
  });
}
const addHourInput = document.getElementById("add-hour");
if (addHourInput) {
  addHourInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^\d:]/g, "");
  });
}
if (settingsPhone) {
  settingsPhone.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
}
if (settingsNick) {
  settingsNick.addEventListener("input", (e) => {
    if (e.target.value.length > 8) e.target.value = e.target.value.slice(0, 8);
  });
}

// ===== 화면 전환 버튼 =====
goSignupBtn.onclick = (e) => {
  e.preventDefault();
  loginSection.style.display = "none";
  signupSection.style.display = "block";
  appSection.style.display = "none";
};
window.closeSignup = function() {
  signupSection.style.display = "none";
  loginSection.style.display = "block";
};

// ===== 회원가입 =====
signupBtn.onclick = async () => {
  const nickname = (document.getElementById("su-nickname").value || "").trim();
  const email    = (document.getElementById("su-email").value || "").trim();
  const password = (document.getElementById("su-password").value || "");
  const phone    = ((document.getElementById("su-phone").value || "")).replace(/\D/g, "");
  const gender   = (document.getElementById("su-gender").value || "").trim();
  const birth    = (document.getElementById("su-birth").value || "").trim();

  if (!nickname || !email || !password || !phone) return alert("닉네임, 이메일, 비밀번호, 전화번호는 필수입니다.");
  if (nickname.length > 8) return alert("닉네임은 최대 8글자까지 가능합니다.");

  try {
    const qDup = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const dup = await get(qDup);
    if (dup.exists()) return alert("이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.");

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), {
      profile: { email, nickname, phone, gender, birth, createdAt: Date.now() },
      stamps: {}
    });

    alert("회원가입 완료! 로그인 해주세요.");
    showLoginOnly();
  } catch (e) {
    alert(e.message);
  }
};

// ===== 로그인 =====
loginBtn.onclick = async () => {
  const id       = (document.getElementById("login-nickname").value || "").trim();
  const password = (document.getElementById("login-password").value || "");
  if (!id || !password) return alert("닉네임(또는 이메일)과 비밀번호를 입력하세요.");

  loginBtn.disabled = true;
  try {
    let email = id;

    if (!id.includes("@")) {
      const qRef = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(id));
      const snap = await get(qRef);
      if (!snap.exists()) { alert("해당 닉네임을 찾을 수 없습니다."); return; }
      const usersObj = snap.val();
      const firstUid = Object.keys(usersObj)[0];
      email = usersObj[firstUid]?.profile?.email;
      if (!email) { alert("이 계정에 이메일 정보가 없어 로그인할 수 없습니다."); return; }
    }

    try { await setPersistence(auth, browserLocalPersistence); } catch {}

    await signInWithEmailAndPassword(auth, email, password);

    if (auth.currentUser) {
      await renderLoggedInUI(auth.currentUser);
    } else {
      setTimeout(() => auth.currentUser && renderLoggedInUI(auth.currentUser), 0);
    }
  } catch (e) {
    alert(e.message);
  } finally {
    loginBtn.disabled = false;
  }
};

logoutBtn.onclick = () => signOut(auth).catch(console.error);

// ===== 세션 반영 =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try { await renderLoggedInUI(user); } catch (e) { console.error(e); }
  } else {
    showLoginOnly();
  }
});

// ===== 도장판 =====
async function loadStamps(uid) {
  const board = document.getElementById("stampBoard");
  board.innerHTML = "";
  const bg = document.createElement("img"); bg.src = "./background.png"; bg.alt = "도장판 배경";
  board.appendChild(bg);
  try {
    const snap = await get(ref(db, `users/${uid}/stamps`));
    if (!snap.exists()) { toggleCameraFab(false); return; }
    const stamps = snap.val();
    Object.keys(stamps).forEach((booth) => {
      const data = stamps[booth]; if (!data?.stamped) return;
      const layer = document.createElement("img");
      layer.src = data.img || STAMP_IMAGES[booth] || "./stamp.png";
      layer.alt = `${booth} 스탬프`;
      board.appendChild(layer);
    });
  } catch (e) { console.error(e); }

  // 완료 시 📷 버튼 노출
  try {
    const total = Object.keys(STAMP_IMAGES).length;
    const snap2 = await get(ref(db, `users/${uid}/stamps`));
    const count = snap2.exists() ? Object.values(snap2.val()).filter(v => v?.stamped).length : 0;
    toggleCameraFab(count >= total);
  } catch {}
}

window.visitBooth = async function(boothName) {
  const user = auth.currentUser; if (!user) return alert("로그인 후 이용하세요.");
  const imgPath = STAMP_IMAGES[boothName] || "./stamp.png";
  try {
    await update(ref(db, `users/${user.uid}/stamps/${boothName}`), { stamped: true, img: imgPath, ts: Date.now() });
    await loadStamps(user.uid);
  } catch (e) { alert("도장 찍기 실패: " + e.message); }
};

// ===== 부스 소개 =====
window.showBooth = function(name) {
  const booth = BOOTH_INFO[name]; if (!booth) return;
  appSection.style.display = "none"; boothSection.style.display = "block";
  document.getElementById("booth-name").textContent = name;
  document.getElementById("booth-img").src = booth.img;
  document.getElementById("booth-desc").textContent = booth.desc;
};
window.closeBooth = function() { boothSection.style.display = "none"; appSection.style.display = "block"; };

async function renderBoothList() {
  const box = document.getElementById("booth-list");
  box.innerHTML = "";
  for (const name of Object.keys(BOOTH_INFO)) {
    let enabled = false;
    try {
      const s = await get(ref(db, `settings/booths/${name}/reservationEnabled`));
      enabled = !!(s.exists() && s.val());
    } catch {}
    const row = document.createElement("div");
    row.className = "booth-row";
    const introBtn = document.createElement("button");
    introBtn.className = "booth-btn"; introBtn.textContent = name;
    introBtn.onclick = () => showBooth(name);
    row.appendChild(introBtn);

    if (enabled) {
      const rBtn = document.createElement("button");
      rBtn.className = "booth-btn reserve-btn"; rBtn.textContent = "예약";
      rBtn.onclick = () => openReserve(name);
      row.appendChild(rBtn);
    }
    box.appendChild(row);
  }
}

// ===== 예약 =====
let currentReserveBooth = null;
let currentTimes = [];
let currentCapacity = 2;

async function openReserve(boothName) {
  currentReserveBooth = boothName;
  appSection.style.display = "none";
  reserveSection.style.display = "block";
  document.getElementById("reserve-title").textContent = `${boothName} 예약`;

  const s = await get(ref(db, `settings/booths/${boothName}`));
  currentTimes    = (s.exists() && s.val().times) ? s.val().times : [];
  currentCapacity = (s.exists() && s.val().capacity) ? s.val().capacity : 2;
  document.getElementById("reserve-capacity").textContent = currentCapacity;

  const sel = document.getElementById("reserve-slot");
  sel.innerHTML = "";
  if (currentTimes.length === 0) {
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = "등록된 시간이 없습니다";
    sel.appendChild(opt);
  } else {
    currentTimes.forEach(t => {
      const opt = document.createElement("option"); opt.value = t; opt.textContent = t; sel.appendChild(opt);
    });
  }

  document.getElementById("reserve-action").onclick = reserveOrCancel;
  await refreshReserveTable();
}
window.closeReserve = function() { reserveSection.style.display = "none"; appSection.style.display = "block"; };

async function refreshReserveTable() {
  const tbody = document.getElementById("reserve-tbody");
  const user = auth.currentUser; if (!user) return;

  let myNick = user.email;
  try { const s = await get(ref(db, `users/${user.uid}/profile/nickname`)); if (s.exists()) myNick = s.val(); } catch {}

  let data = {};
  try { const snap = await get(ref(db, `reservations/${currentReserveBooth}`)); if (snap.exists()) data = snap.val(); } catch {}

  tbody.innerHTML = "";
  let mySlot = null;

  for (const t of currentTimes) {
    const row = document.createElement("tr");
    const tdTime = document.createElement("td"); tdTime.textContent = t; row.appendChild(tdTime);

    const tdNames = document.createElement("td");
    const users = data[t] ? Object.values(data[t]).map(v => v.nickname) : [];
    if (users.length) {
      users.forEach((nick, i) => {
        const span = document.createElement("span");
        span.textContent = nick;
        if (nick === myNick) { span.style.color = "#317EFB"; span.style.fontWeight = "bold"; }
        tdNames.appendChild(span);
        if (i < users.length - 1) tdNames.appendChild(document.createTextNode(", "));
      });
    } else {
      tdNames.textContent = "-";
    }
    row.appendChild(tdNames);
    tbody.appendChild(row);

    if (data[t] && data[t][user.uid]) mySlot = t;
  }

  const sel = document.getElementById("reserve-slot");
  const actionBtn = document.getElementById("reserve-action");

  if (mySlot) {
    sel.value = mySlot;
    actionBtn.textContent = "예약취소";
    actionBtn.dataset.mode = "cancel";
  } else {
    actionBtn.textContent = "예약";
    actionBtn.dataset.mode = "reserve";
  }

  const selected = sel.value;
  const count = selected && data[selected] ? Object.keys(data[selected]).length : 0;
  actionBtn.disabled = (actionBtn.dataset.mode === "reserve" && selected && count >= currentCapacity) || !selected;

  sel.onchange = () => {
    const c = sel.value && data[sel.value] ? Object.keys(data[sel.value]).length : 0;
    if (actionBtn.dataset.mode === "reserve") actionBtn.disabled = (!sel.value || c >= currentCapacity);
  };
}

async function reserveOrCancel() {
  const user = auth.currentUser; if (!user) return alert("로그인 후 이용하세요.");
  const sel = document.getElementById("reserve-slot");
  const slot = sel.value; if (!slot) return;

  let myNick = user.email, myPhone = "";
  try {
    const p = await get(ref(db, `users/${user.uid}/profile`));
    if (p.exists()) { myNick = p.val().nickname || myNick; myPhone = p.val().phone || ""; }
  } catch {}

  const btn = document.getElementById("reserve-action");
  const mode = btn.dataset.mode;

  if (mode === "cancel") {
    const all = await get(ref(db, `reservations/${currentReserveBooth}`));
    if (all.exists()) {
      const obj = all.val();
      for (const t of Object.keys(obj)) {
        if (obj[t][user.uid]) await remove(ref(db, `reservations/${currentReserveBooth}/${t}/${user.uid}`));
      }
    }
  } else {
    const all = await get(ref(db, `reservations/${currentReserveBooth}`));
    if (all.exists()) {
      const obj = all.val();
      for (const t of Object.keys(obj)) {
        if (obj[t][user.uid]) await remove(ref(db, `reservations/${currentReserveBooth}/${t}/${user.uid}`));
      }
    }
    const currentSnap = await get(ref(db, `reservations/${currentReserveBooth}/${slot}`));
    const cnt = currentSnap.exists() ? Object.keys(currentSnap.val()).length : 0;
    if (cnt >= currentCapacity) return alert("해당 시간은 정원이 찼습니다.");

    await set(ref(db, `reservations/${currentReserveBooth}/${slot}/${user.uid}`), {
      nickname: myNick, phone: myPhone, ts: Date.now()
    });
  }

  await refreshReserveTable();
}

// ===== 스태프 =====
window.openStaffLogin = function() { appSection.style.display = "none"; staffLoginSection.style.display = "block"; };
window.closeStaffLogin = function() { staffLoginSection.style.display = "none"; appSection.style.display = "block"; };

let currentStaffBooth = null;

window.checkStaffPassword = async function() {
  const pw = document.getElementById("staff-password").value.trim();
  if (!STAFF_PASSWORDS[pw]) return alert("비밀번호가 올바르지 않습니다.");
  currentStaffBooth = STAFF_PASSWORDS[pw];

  staffLoginSection.style.display = "none";
  staffSection.style.display = "block";
  document.getElementById("staff-booth-name").textContent = `${currentStaffBooth} 관리`;
  openStaffTab("stamp");

  const toggle = document.getElementById("reserve-toggle");
  const settingsSnap = await get(ref(db, `settings/booths/${currentStaffBooth}`));
  const enabled  = settingsSnap.exists() && !!settingsSnap.val().reservationEnabled;
  const capacity = settingsSnap.exists() && settingsSnap.val().capacity ? settingsSnap.val().capacity : 2;

  toggle.checked = enabled;
  document.getElementById("staff-reserve-admin").style.display = enabled ? "block" : "none";
  document.getElementById("capacity-input").value = capacity;

  if (enabled) await loadStaffReserveAdmin();

  toggle.onchange = async () => {
    await set(ref(db, `settings/booths/${currentStaffBooth}/reservationEnabled`), toggle.checked);
    document.getElementById("staff-reserve-admin").style.display = toggle.checked ? "block" : "none";
    await renderBoothList();
    if (toggle.checked) await loadStaffReserveAdmin();
  };

  initNicknameAutocomplete();
};

window.closeStaff = function() { staffSection.style.display = "none"; appSection.style.display = "block"; };
window.openStaffTab = function(tab) {
  document.getElementById("staff-tab-stamp").style.display   = (tab === "stamp") ? "block" : "none";
  document.getElementById("staff-tab-reserve").style.display = (tab === "reserve") ? "block" : "none";
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach(b => b.classList.remove("active"));
  (tab === "stamp" ? buttons[0] : buttons[1]).classList.add("active");
};

window.giveStamp = async function() {
  const nickname = document.getElementById("target-nickname").value.trim();
  const result = document.getElementById("stamp-result");
  const boothName = currentStaffBooth;
  if (!nickname) { result.textContent = "❌ 닉네임을 입력하세요."; return; }
  try {
    const q = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const snap = await get(q);
    if (!snap.exists()) { result.textContent = "❌ 해당 닉네임 사용자가 없습니다."; return; }
    const uid = Object.keys(snap.val())[0];
    const imgPath = STAMP_IMAGES[boothName] || "./stamp.png";
    await update(ref(db, `users/${uid}/stamps/${boothName}`), { stamped: true, img: imgPath, ts: Date.now() });
    result.textContent = `✅ ${nickname} 님에게 [${boothName}] 도장을 찍었습니다.`;
  } catch (e) { console.error(e); result.textContent = "❌ 오류: " + e.message; }
};

async function loadStaffReserveAdmin() {
  const s = await get(ref(db, `settings/booths/${currentStaffBooth}`));
  const capacity = (s.exists() && s.val().capacity) ? s.val().capacity : 2;
  const times    = (s.exists() && s.val().times) ? s.val().times : [];
  document.getElementById("capacity-input").value = capacity;

  const delSel = document.getElementById("delete-time");
  delSel.innerHTML = "";
  times.forEach(t => {
    const opt = document.createElement("option"); opt.value = t; opt.textContent = t; delSel.appendChild(opt);
  });

  const tbody = document.getElementById("staff-reserve-tbody");
  tbody.innerHTML = "";
  let res = {};
  try {
    const r = await get(ref(db, `reservations/${currentStaffBooth}`));
    if (r.exists()) res = r.val();
  } catch {}

  times.forEach(t => {
    const row = document.createElement("tr");
    const tdTime = document.createElement("td"); tdTime.textContent = t; row.appendChild(tdTime);

    const users = res[t] ? Object.values(res[t]) : [];
    const tdNick = document.createElement("td");
    const tdPhone = document.createElement("td");
    if (users.length) {
      tdNick.textContent = users.map(u => u.nickname || "-").join(", ");
      tdPhone.textContent = users.map(u => u.phone || "-").join(", ");
    } else {
      tdNick.textContent = "-";
      tdPhone.textContent = "-";
    }
    row.appendChild(tdNick); row.appendChild(tdPhone);
    tbody.appendChild(row);
  });
}

window.saveCapacity = async function() {
  const v = parseInt(document.getElementById("capacity-input").value, 10);
  if (!(v >= 1)) return alert("1 이상 정수를 입력하세요.");
  await set(ref(db, `settings/booths/${currentStaffBooth}/capacity`), v);
  alert("저장되었습니다.");
};

window.addReserveTime = async function() {
  const raw = (document.getElementById("add-hour").value || "").trim();
  if (!/^\d{1,2}(:\d{2})?$/.test(raw)) {
    return alert("시간은 HH 또는 HH:MM 형식으로 입력하세요. 예) 9, 09, 13:30, 23:05");
  }

  let [hStr, mStr = "00"] = raw.split(":");
  const h = Number(hStr), m = Number(mStr);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) {
    return alert("시간 범위가 올바르지 않습니다.");
  }

  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const sRef = ref(db, `settings/booths/${currentStaffBooth}`);
  const s = await get(sRef);
  let times = (s.exists() && s.val().times) ? s.val().times : [];

  if (!times.includes(time)) times.push(time);
  times.sort();

  await update(sRef, { times });
  document.getElementById("add-hour").value = "";
  await loadStaffReserveAdmin();
  alert(`시간 추가: ${time}`);
};

window.deleteReserveTime = async function() {
  const delSel = document.getElementById("delete-time");
  const t = delSel.value;
  if (!t) return;
  const sRef = ref(db, `settings/booths/${currentStaffBooth}`);
  const s = await get(sRef);
  let times = (s.exists() && s.val().times) ? s.val().times : [];
  times = times.filter(x => x !== t);
  await update(sRef, { times });
  await loadStaffReserveAdmin();
  alert(`시간 삭제: ${t}`);
};

// ===== 닉네임 자동완성 (스태프) =====
function debounce(fn, delay = 250) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }

async function nicknamePrefixSearch(prefix) {
  const qRef = query(
    ref(db, "users"),
    orderByChild("profile/nickname"),
    startAt(prefix),
    endAt(prefix + "\uf8ff"),
    limitToFirst(8)
  );
  const snap = await get(qRef);
  if (!snap.exists()) return [];
  const results = [];
  Object.values(snap.val()).forEach(u => {
    const nick = u?.profile?.nickname;
    if (nick) results.push(nick);
  });
  return [...new Set(results)];
}

function initNicknameAutocomplete() {
  const input = document.getElementById("target-nickname");
  if (!input || input.dataset.autocompleteInit === "1") return;

  if (getComputedStyle(input.parentElement).position === "static") {
    input.parentElement.style.position = "relative";
  }

  let box = document.getElementById("nick-suggest-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "nick-suggest-box";
    Object.assign(box.style, {
      position: "absolute",
      left: input.offsetLeft + "px",
      top: (input.offsetTop + input.offsetHeight + 4) + "px",
      width: input.offsetWidth + "px",
      maxHeight: "180px",
      overflowY: "auto",
      background: "#1e1e1e",
      border: "1px solid #333",
      borderRadius: "8px",
      boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
      padding: "4px 0",
      zIndex: 1000,
      display: "none"
    });
    input.parentElement.appendChild(box);

    window.addEventListener("resize", () => {
      box.style.left = input.offsetLeft + "px";
      box.style.top = (input.offsetTop + input.offsetHeight + 4) + "px";
      box.style.width = input.offsetWidth + "px";
    });
  }

  const render = (list) => {
    box.innerHTML = "";
    if (!list.length) { box.style.display = "none"; return; }
    list.forEach(nick => {
      const item = document.createElement("div");
      item.textContent = nick;
      Object.assign(item.style, { padding: "8px 10px", cursor: "pointer" });
      item.onmouseenter = () => item.style.background = "#2a2a2a";
      item.onmouseleave = () => item.style.background = "transparent";
      item.onclick = () => { input.value = nick; box.style.display = "none"; };
      box.appendChild(item);
    });
    box.style.display = "block";
  };

  const run = debounce(async () => {
    const v = input.value.trim();
    if (!v) { box.style.display = "none"; return; }
    try { render(await nicknamePrefixSearch(v)); }
    catch { box.style.display = "none"; }
  }, 200);

  input.addEventListener("input", run);
  input.addEventListener("focus", run);
  document.addEventListener("click", (e) => {
    if (e.target !== input && !box.contains(e.target)) box.style.display = "none";
  });

  input.dataset.autocompleteInit = "1";
}

// ===== 설정 =====
settingsBtn.onclick = () => openSettings();

window.openSettings = async function() {
  loginSection.style.display  = "none";
  signupSection.style.display = "none";
  appSection.style.display    = "none";
  boothSection.style.display  = "none";
  reserveSection.style.display= "none";
  staffLoginSection.style.display = "none";
  staffSection.style.display  = "none";
  settingsSection.style.display = "block";

  settingsMsg.textContent = "";
  const user = auth.currentUser;
  if (!user) { settingsMsg.textContent = "로그인이 필요합니다."; return; }

  try {
    const profSnap = await get(ref(db, `users/${user.uid}/profile`));
    if (profSnap.exists()) {
      const p = profSnap.val();
      settingsNick.value  = p.nickname || "";
      settingsPhone.value = (p.phone || "").toString();
    } else {
      settingsNick.value  = "";
      settingsPhone.value = "";
    }
  } catch (e) {
    settingsMsg.textContent = "프로필을 불러오지 못했습니다.";
  }
};

window.closeSettings = function() {
  settingsSection.style.display = "none";
  appSection.style.display = "block";
};

async function updateReservationsForUser(uid, fields) {
  const booths = Object.keys(BOOTH_INFO);
  const tasks = [];
  for (const booth of booths) {
    try {
      const resSnap = await get(ref(db, `reservations/${booth}`));
      if (!resSnap.exists()) continue;
      const byTime = resSnap.val();
      for (const time of Object.keys(byTime)) {
        if (byTime[time] && byTime[time][uid]) {
          tasks.push(update(ref(db, `reservations/${booth}/${time}/${uid}`), fields));
        }
      }
    } catch (e) {
      console.error("예약표 업데이트 실패:", booth, e);
    }
  }
  await Promise.all(tasks);
}

window.saveSettings = async function() {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");

  const newNick = (settingsNick.value || "").trim();
  const newPhone = (settingsPhone.value || "").replace(/\D/g, "");

  if (!newNick) return alert("닉네임을 입력하세요.");
  if (newNick.length > 8) return alert("닉네임은 최대 8글자입니다.");

  try {
    const curNickSnap = await get(ref(db, `users/${user.uid}/profile/nickname`));
    const curNick = curNickSnap.exists() ? curNickSnap.val() : null;

    if (newNick !== curNick) {
      const qDup = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(newNick));
      const dup = await get(qDup);
      if (dup.exists()) {
        const keys = Object.keys(dup.val());
        const someoneElse = keys.some(k => k !== user.uid);
        if (someoneElse) return alert("이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.");
      }
    }

    await update(ref(db, `users/${user.uid}/profile`), {
      nickname: newNick,
      phone: newPhone
    });

    await updateReservationsForUser(user.uid, { nickname: newNick, phone: newPhone });

    userDisplay.textContent = newNick || (user.email || "");
    settingsMsg.textContent = "✅ 저장되었습니다.";
    setTimeout(() => { settingsMsg.textContent = ""; }, 1500);

    if (reserveSection.style.display === "block" && currentReserveBooth) await refreshReserveTable();
    if (staffSection.style.display === "block" && currentStaffBooth) await loadStaffReserveAdmin();
  } catch (e) {
    alert("저장 실패: " + e.message);
  }
};

// 회원탈퇴
async function deleteUserReservations(uid) {
  const booths = Object.keys(BOOTH_INFO);
  const tasks = [];
  for (const booth of booths) {
    try {
      const resSnap = await get(ref(db, `reservations/${booth}`));
      if (!resSnap.exists()) continue;
      const byTime = resSnap.val();
      for (const time of Object.keys(byTime)) {
        if (byTime[time] && byTime[time][uid]) {
          tasks.push(remove(ref(db, `reservations/${booth}/${time}/${uid}`)));
        }
      }
    } catch (e) {
      console.error("예약 정리 실패:", booth, e);
    }
  }
  await Promise.all(tasks);
}

window.deleteAccount = async function() {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");

  const ok = confirm("정말로 회원탈퇴 하시겠습니까? 모든 데이터가 삭제되며 되돌릴 수 없습니다.");
  if (!ok) return;

  try {
    await deleteUserReservations(user.uid);
    await remove(ref(db, `users/${user.uid}`));
    await deleteUser(user);
    alert("계정이 삭제되었습니다.");
  } catch (e) {
    console.error(e);
    if (e.code === "auth/requires-recent-login") {
      alert("보안을 위해 최근 로그인 후 다시 시도해주세요.");
      try { await signOut(auth); } catch {}
    } else {
      alert("회원탈퇴 실패: " + e.message);
    }
  }
};

// ======================= FourCut 본체 =======================
cameraFab?.addEventListener("click", async () => {
  const dataURL = await renderStampBoardToDataURL(); // 도장판 자동 캡쳐
  openFourCut(dataURL);
});

// 모드 토글
modeLiveRadio?.addEventListener("change", (e)=> e.target.checked && setFcMode("live"));
modeCamRadio?.addEventListener("change", (e)=> e.target.checked && setFcMode("camera"));

function setFcMode(mode){
  _fcMode = mode;
  if (mode === "live") {
    fcLivePanel.classList.remove("hide");
    fcCameraPanel.classList.add("hide");
    startFcCamera();
  } else {
    fcCameraPanel.classList.remove("hide");
    fcLivePanel.classList.add("hide");
    stopFcCamera();
  }
}

// 라이브 카메라
async function startFcCamera(){
  try {
    if (_fcStream) return;
    _fcStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: _fcUseBack ? "environment" : "user" }, audio:false });
    fcVideo.srcObject = _fcStream; await fcVideo.play();
  } catch(e){ console.warn("camera error", e); }
}
function stopFcCamera(){
  if (!_fcStream) return; _fcStream.getTracks().forEach(t=>t.stop()); _fcStream=null; fcVideo.srcObject=null;
}

function openFourCut(stampDataURL){
  fcOverlay.style.display = "flex";
  // iOS/모바일은 기본 카메라 모드가 호환 좋음
  const preferCamera = isIOS || window.innerWidth < 900;
  (preferCamera ? modeCamRadio : modeLiveRadio).checked = true;
  setFcMode(preferCamera ? "camera" : "live");

  if (stampDataURL) loadIntoSlot(0, stampDataURL, true);
  updateSaveEnabled();
}
fcClose?.addEventListener("click", ()=>{ fcOverlay.style.display="none"; stopFcCamera(); });

// 도장판 외부 이미지로 넣기
fcImport?.addEventListener("click", ()=>{
  fcFile.onchange = (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=> loadIntoSlot(0, r.result, true);
    r.readAsDataURL(f);
    fcFile.value="";
  };
  fcFile.removeAttribute("capture");
  fcFile.setAttribute("accept", "image/*");
  fcFile.click();
});

// 라이브 전/후면
fcFlip?.addEventListener("click", async ()=>{ _fcUseBack=!_fcUseBack; stopFcCamera(); await startFcCamera(); });

// 라이브에서 한 컷 캡쳐
fcShot?.addEventListener("click", ()=>{
  const idx = parseInt(fcSel.value,10);
  if (!_fcStream || !fcVideo.videoWidth) return;
  const c = document.createElement("canvas");
  c.width = fcVideo.videoWidth; c.height = fcVideo.videoHeight;
  c.getContext("2d").drawImage(fcVideo, 0,0,c.width,c.height);
  loadIntoSlot(idx, c.toDataURL("image/jpeg", .92), true);
  updateSaveEnabled();
});

// 기본 카메라(앱) 열기 — 전/후면 선택 제거, 가로 촬영 안내
fcOpen?.addEventListener("click", ()=>{
  const idx = parseInt(fcSelCam.value,10);
  fcFile.dataset.slot = idx.toString();
  // 후면 기본 힌트만 유지
  try { fcFile.setAttribute("capture", "environment"); } catch {}
  fcFile.setAttribute("accept", "image/*");
  fcFile.onchange = (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=> { loadIntoSlot(idx, r.result, true); updateSaveEnabled(); };
    r.readAsDataURL(f);
    fcFile.value="";
  };
  fcFile.click();
});

function loadIntoSlot(idx, dataURL){
  const slotEl = fcSlots[idx]; const imgEl = slotEl.querySelector(".fc-img");
  const img = new Image(); img.onload = ()=>{
    const slotW = slotEl.clientWidth, slotH = slotEl.clientHeight;
    const cover = Math.max(slotW / img.width, slotH / img.height); // 빈틈 없이 채우기
    const drawW = img.width * cover, drawH = img.height * cover;
    // 상태 저장(사용자 조절 비활성화이므로 초기값이 곧 최종값)
    _fcStates[idx] = {
      img, w: img.width, h: img.height,
      sx: cover,
      ox: (slotW - drawW)/2,
      oy: (slotH - drawH)/2
    };
    // 미리보기 적용
    imgEl.style.width  = img.width + "px";
    imgEl.style.height = img.height + "px";
    imgEl.style.transform = `translate(${_fcStates[idx].ox}px, ${_fcStates[idx].oy}px) scale(${cover})`;
    imgEl.src = dataURL;
  };
  img.src = dataURL;
}

function applyTransform(idx){
  // (조절 OFF 상태 — 외부에서 호출될 일 없지만 호환 유지)
  const slotEl = fcSlots[idx]; const imgEl = slotEl.querySelector(".fc-img");
  const st = _fcStates[idx]; if (!st.img) { imgEl.style.transform="none"; return; }
  imgEl.style.width = st.w + "px"; imgEl.style.height = st.h + "px";
  imgEl.style.transform = `translate(${st.ox}px, ${st.oy}px) scale(${st.sx})`;
}

// 제스처(드래그/핀치) — 완전 비활성화
if (ALLOW_ADJUST) {
  fcSlots.forEach((slotEl)=>{
    const idx = parseInt(slotEl.dataset.index,10);
    let active=false, startX=0, startY=0, baseOX=0, baseOY=0, pinch=false, baseDist=0, baseS=1;

    const getPts = (e)=>{
      const pts=[]; if (e.touches) for(let i=0;i<e.touches.length;i++) pts.push({x:e.touches[i].clientX,y:e.touches[i].clientY});
      else pts.push({x:e.clientX,y:e.clientY}); return pts;
    };
    const onDown = (e)=>{ if(!_fcStates[idx].img) return; active=true; pinch=false; baseS=_fcStates[idx].sx; baseOX=_fcStates[idx].ox; baseOY=_fcStates[idx].oy;
      const pts=getPts(e); if(pts.length>=2){ pinch=true; baseDist=dist(pts[0],pts[1]); } else { startX=pts[0].x; startY=pts[0].y; } };
    const onMove = (e)=>{ if(!active) return; e.preventDefault();
      const pts=getPts(e);
      if(pinch && pts.length>=2){ const d=dist(pts[0],pts[1]); _fcStates[idx].sx = clamp(baseS*(d/baseDist), 0.05, 8); }
      else { const dx=pts[0].x-startX, dy=pts[0].y-startY; _fcStates[idx].ox = baseOX+dx; _fcStates[idx].oy = baseOY+dy; }
      applyTransform(idx);
    };
    const onUp = ()=>{ active=false; pinch=false; };

    slotEl.addEventListener("pointerdown", onDown, {passive:false});
    window.addEventListener("pointermove", onMove, {passive:false});
    window.addEventListener("pointerup", onUp, {passive:false});
    slotEl.addEventListener("touchstart", onDown, {passive:false});
    slotEl.addEventListener("touchmove", onMove, {passive:false});
    slotEl.addEventListener("touchend", onUp, {passive:false});
  });
}
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function clamp(x,a,b){ return Math.max(a, Math.min(b,x)); }

function updateSaveEnabled(){
  const ok = !!(_fcStates[0].img && _fcStates[1].img && _fcStates[2].img && _fcStates[3].img);
  fcSave.disabled = !ok;
}

// 고해상도 저장(템플릿 크기 우선, 없으면 DPR 기반)
fcSave?.addEventListener("click", ()=>{
  const stageW = fcStage.clientWidth, stageH = fcStage.clientHeight; // 미리보기 좌표계
  let outW, outH;
  if (_fcTemplateImg && _fcTemplateImg.complete && _fcTemplateImg.naturalWidth && _fcTemplateImg.naturalHeight) {
    outW = _fcTemplateImg.naturalWidth;
    outH = _fcTemplateImg.naturalHeight;
  } else {
    const dpr = Math.max(2, Math.round(window.devicePixelRatio || 2));
    outW = Math.max(600, Math.round(stageW * dpr));
    outH = Math.round(outW * 3); // 1:3 비율 유지
  }

  const c = document.createElement("canvas"); c.width = outW; c.height = outH;
  const ctx = c.getContext("2d");

  const sx = outW / stageW, sy = outH / stageH;
  ctx.setTransform(sx, 0, 0, sy, 0, 0);

  if (_fcTemplateImg && _fcTemplateImg.complete) {
    ctx.drawImage(_fcTemplateImg, 0, 0, stageW, stageH);
  } else {
    ctx.fillStyle="#101010"; roundRect(ctx,0,0,stageW,stageH,20); ctx.fill();
  }

  fcSlots.forEach((slotEl, idx)=>{
    const r = slotEl.getBoundingClientRect();
    const sR = fcStage.getBoundingClientRect();
    const x = r.left - sR.left, y = r.top - sR.top, w = r.width, h = r.height;

    ctx.save(); roundRect(ctx,x,y,w,h,12); ctx.clip(); ctx.fillStyle="#0b0b0b"; ctx.fillRect(x,y,w,h);
    const st = _fcStates[idx];
    if (st.img){
      const drawW = st.w * st.sx;
      const drawH = st.h * st.sx;
      ctx.drawImage(st.img, x + st.ox, y + st.oy, drawW, drawH);
    }
    ctx.restore();
    ctx.strokeStyle="#282828"; ctx.lineWidth=1; roundRect(ctx,x,y,w,h,12); ctx.stroke();
  });

  const url = c.toDataURL("image/png");
  const a = document.createElement("a"); a.href=url; a.download=`stamptour_4cut_${Date.now()}.png`; a.click();
});

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

async function renderStampBoardToDataURL(){
  const board = document.getElementById("stampBoard");
  const imgs = [...board.querySelectorAll("img")];
  if (!imgs.length) return undefined;

  const W = board.clientWidth || 600;
  const H = board.clientHeight || Math.round(W * 2/3);
  const c = document.createElement("canvas"); c.width=W; c.height=H;
  const ctx = c.getContext("2d");

  await Promise.all(imgs.map(im=> im.complete ? Promise.resolve() : new Promise(res=> { im.onload=res; im.onerror=res; })));
  imgs.forEach(im=> ctx.drawImage(im, 0, 0, W, H));
  try { return c.toDataURL("image/png"); } catch { return undefined; }
}
