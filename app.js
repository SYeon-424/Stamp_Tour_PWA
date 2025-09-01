import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
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

// =================== 상수/데이터 ===================
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

// =================== DOM 요소 ===================
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

// 입력보조
const loginNicknameInput = document.getElementById("login-nickname");
if (loginNicknameInput) {
  loginNicknameInput.addEventListener("input", (e) => {
    if (e.target.value.length > 8) e.target.value = e.target.value.slice(0, 8);
  });
}
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

// =================== 화면 전환 ===================
goSignupBtn.onclick = () => {
  loginSection.style.display = "none";
  signupSection.style.display = "block";
  appSection.style.display = "none";
};
window.closeSignup = function() {
  signupSection.style.display = "none";
  loginSection.style.display = "block";
};

// =================== 회원가입 ===================
signupBtn.onclick = async () => {
  const nickname = (document.getElementById("su-nickname").value || "").trim();
  const email    = (document.getElementById("su-email").value || "").trim();
  const password = (document.getElementById("su-password").value || "");
  const phone    = ((document.getElementById("su-phone").value || "")).replace(/\D/g, "");
  const gender   = (document.getElementById("su-gender").value || "").trim();
  const birth    = (document.getElementById("su-birth").value || "").trim();

  if (!nickname || !email || !password || !phone) {
    return alert("닉네임, 이메일, 비밀번호, 전화번호는 필수입니다.");
  }
  if (nickname.length > 8) {
    return alert("닉네임은 최대 8글자까지 가능합니다.");
  }

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
    signupSection.style.display = "none";
    loginSection.style.display = "block";
  } catch (e) {
    alert(e.message);
  }
};

// =================== 로그인(닉네임 + 비번) ===================
loginBtn.onclick = async () => {
  const nickname = (document.getElementById("login-nickname").value || "").trim();
  const password = (document.getElementById("login-password").value || "");
  if (!nickname || !password) return alert("닉네임과 비밀번호를 입력하세요.");

  try {
    const qRef = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const snap = await get(qRef);
    if (!snap.exists()) return alert("해당 닉네임을 찾을 수 없습니다.");

    const usersObj = snap.val();
    const firstUid = Object.keys(usersObj)[0];
    const email = usersObj[firstUid]?.profile?.email;
    if (!email) return alert("이 계정에 이메일 정보가 없어 로그인할 수 없습니다.");

    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
};

logoutBtn.onclick = () => signOut(auth).catch(console.error);

// =================== 세션 반영 ===================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginSection.style.display  = "none";
    signupSection.style.display = "none";
    appSection.style.display    = "block";
    boothSection.style.display  = "none";
    reserveSection.style.display= "none";
    staffLoginSection.style.display = "none";
    staffSection.style.display  = "none";
    settingsSection.style.display = "none";

    settingsBtn.style.display   = "flex"; // ⚙️ 표시

    try {
      const nickSnap = await get(ref(db, `users/${user.uid}/profile/nickname`));
      userDisplay.textContent = nickSnap.exists() ? nickSnap.val() : (user.email || "");
    } catch { userDisplay.textContent = user.email || ""; }

    await loadStamps(user.uid);
    await renderBoothList();
  } else {
    loginSection.style.display  = "block";
    signupSection.style.display = "none";
    appSection.style.display    = "none";
    boothSection.style.display  = "none";
    reserveSection.style.display= "none";
    staffLoginSection.style.display = "none";
    staffSection.style.display  = "none";
    settingsSection.style.display = "none";

    settingsBtn.style.display   = "none"; // ⚙️ 숨김
    userDisplay.textContent     = "";
  }
});

// =================== 기능: 도장판 로드 ===================
async function loadStamps(uid) {
  const board = document.getElementById("stampBoard");
  board.innerHTML = "";
  const bg = document.createElement("img"); bg.src = "./background.png"; bg.alt = "도장판 배경";
  board.appendChild(bg);
  try {
    const snap = await get(ref(db, `users/${uid}/stamps`));
    if (!snap.exists()) return;
    const stamps = snap.val();
    Object.keys(stamps).forEach((booth) => {
      const data = stamps[booth]; if (!data?.stamped) return;
      const layer = document.createElement("img");
      layer.src = data.img || STAMP_IMAGES[booth] || "./stamp.png";
      layer.alt = `${booth} 스탬프`;
      board.appendChild(layer);
    });
  } catch (e) { console.error(e); }
}

// 방문 도장(사용자 스스로 버튼/이벤트로 호출할 때)
window.visitBooth = async function(boothName) {
  const user = auth.currentUser; if (!user) return alert("로그인 후 이용하세요.");
  const imgPath = STAMP_IMAGES[boothName] || "./stamp.png";
  try {
    await update(ref(db, `users/${user.uid}/stamps/${boothName}`), { stamped: true, img: imgPath, ts: Date.now() });
    await loadStamps(user.uid);
  } catch (e) { alert("도장 찍기 실패: " + e.message); }
};

// =================== 부스 소개 ===================
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

// =================== 예약 ===================
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

// =================== 스태프 ===================
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

  // 닉네임 자동완성 초기화
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

// =================== 닉네임 자동완성(스태프 도장찍기) ===================
function debounce(fn, delay = 250) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

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

// =================== 설정(닉네임/전화번호 변경) ===================
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

// === 예약표에 사용자 정보 반영(닉네임/전화) ===
async function updateReservationsForUser(uid, fields) {
  const booths = Object.keys(BOOTH_INFO);
  const tasks = [];
  for (const booth of booths) {
    try {
      const resSnap = await get(ref(db, `reservations/${booth}`));
      if (!resSnap.exists()) continue;
      const byTime = resSnap.val(); // { "13:00": { uid: { nickname, phone, ts }, ... }, ... }
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
    // 기존 닉네임
    const curNickSnap = await get(ref(db, `users/${user.uid}/profile/nickname`));
    const curNick = curNickSnap.exists() ? curNickSnap.val() : null;

    if (newNick !== curNick) {
      // 중복 검사
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

    // 예약표에도 반영
    await updateReservationsForUser(user.uid, { nickname: newNick, phone: newPhone });

    // 화면 갱신
    userDisplay.textContent = newNick || (user.email || "");
    settingsMsg.textContent = "✅ 저장되었습니다.";
    setTimeout(() => { settingsMsg.textContent = ""; }, 1500);

    // 표 새로고침
    if (reserveSection.style.display === "block" && currentReserveBooth) {
      await refreshReserveTable();
    }
    if (staffSection.style.display === "block" && currentStaffBooth) {
      await loadStaffReserveAdmin();
    }
  } catch (e) {
    alert("저장 실패: " + e.message);
  }
};
