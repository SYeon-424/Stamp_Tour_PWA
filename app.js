import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, update, query, orderByChild, equalTo, remove
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

const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");
const boothSection = document.getElementById("booth-section");
const reserveSection = document.getElementById("reserve-section");
const staffLoginSection = document.getElementById("staff-login-section");
const staffSection = document.getElementById("staff-section");
const signupBtn = document.getElementById("signup");
const loginBtn  = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const userDisplay = document.getElementById("user-display");

signupBtn.onclick = async () => {
  const nickname = document.getElementById("nickname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = (document.getElementById("phone").value || "").replace(/\D/g, "");
  const password = document.getElementById("password").value;
  if (!nickname || !email || !password || !phone) return alert("닉네임, 이메일, 전화번호, 비밀번호를 모두 입력하세요.");

  try {
    const q = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const dup = await get(q);
    if (dup.exists()) return alert("이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.");

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), {
      profile: { email, nickname, phone, createdAt: Date.now() },
      stamps: {}
    });
    alert("회원가입 완료!");
  } catch (e) { alert(e.message); }
};
loginBtn.onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try { await signInWithEmailAndPassword(auth, email, password); } catch (e) { alert(e.message); }
};
logoutBtn.onclick = () => signOut(auth).catch(console.error);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.style.display = "none";
    appSection.style.display  = "block";
    boothSection.style.display = "none";
    reserveSection.style.display = "none";
    staffLoginSection.style.display = "none";
    staffSection.style.display = "none";

    try {
      const nickSnap = await get(ref(db, `users/${user.uid}/profile/nickname`));
      userDisplay.textContent = nickSnap.exists() ? nickSnap.val() : (user.email || "");
    } catch { userDisplay.textContent = user.email || ""; }

    await loadStamps(user.uid);
    await renderBoothList();
  } else {
    authSection.style.display = "block";
    appSection.style.display  = "none";
    boothSection.style.display = "none";
    reserveSection.style.display = "none";
    staffLoginSection.style.display = "none";
    staffSection.style.display = "none";
    userDisplay.textContent = "";
  }
});

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

window.visitBooth = async function(boothName) {
  const user = auth.currentUser; if (!user) return alert("로그인 후 이용하세요.");
  const imgPath = STAMP_IMAGES[boothName] || "./stamp.png";
  try {
    await update(ref(db, `users/${user.uid}/stamps/${boothName}`), { stamped: true, img: imgPath, ts: Date.now() });
    await loadStamps(user.uid);
  } catch (e) { alert("도장 찍기 실패: " + e.message); }
};

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
  const raw = document.getElementById("add-hour").value.trim();

  // 허용 형식: "H", "HH", "H:MM", "HH:MM"
  if (!/^\d{1,2}(:\d{2})?$/.test(raw)) {
    return alert("시간은 HH 또는 HH:MM 형식으로 입력하세요. 예) 9, 09, 13:30, 23:05");
  }

  let [hStr, mStr = "00"] = raw.split(":");
  const h = Number(hStr);
  const m = Number(mStr);

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
