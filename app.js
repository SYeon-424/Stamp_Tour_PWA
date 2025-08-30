// Firebase SDK (modular v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, update, query, orderByChild, equalTo, remove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

/* Firebase 설정 */
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

/* ===== 예약 상수 ===== */
const MAX_PER_SLOT = 2;
const TIMES = buildTimeSlots(10, 0, 17, 0, 30); // 10:00~17:00, 30분 간격
function buildTimeSlots(sHour, sMin, eHour, eMin, intervalMin) {
  const out = [];
  let d = new Date(2000,0,1,sHour,sMin,0,0);
  const end = new Date(2000,0,1,eHour,eMin,0,0);
  while (d <= end) { out.push(d.toTimeString().slice(0,5)); d = new Date(d.getTime()+intervalMin*60000); }
  return out;
}

/* ===== 스탬프/부스 이미지 ===== */
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
/* Staff PW → 부스 */
const STAFF_PASSWORDS = {
  "pw1": "Static","pw2": "인포메티카","pw3": "배째미","pw4": "생동감","pw5": "마스터",
  "pw6": "Z-one","pw7": "셈터","pw8": "시그너스","pw9": "케미어스","pw10": "넛츠",
  "pw11": "스팀","pw12": "오토메틱","pw13": "플럭스"
};

/* ===== DOM ===== */
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

/* ===== Auth ===== */
signupBtn.onclick = async () => {
  const nickname = document.getElementById("nickname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!nickname || !email || !password) return alert("닉네임, 이메일, 비밀번호를 모두 입력하세요.");
  try {
    const q = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const dup = await get(q);
    if (dup.exists()) return alert("이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), { profile: { email, nickname, createdAt: Date.now() }, stamps: {} });
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

/* ===== 도장 렌더 ===== */
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

/* ===== 부스 소개 ===== */
window.showBooth = function(name) {
  const booth = BOOTH_INFO[name]; if (!booth) return;
  appSection.style.display = "none"; boothSection.style.display = "block";
  document.getElementById("booth-name").textContent = name;
  document.getElementById("booth-img").src = booth.img;
  document.getElementById("booth-desc").textContent = booth.desc;
};
window.closeBooth = function() { boothSection.style.display = "none"; appSection.style.display = "block"; };

/* ===== 홈: 부스 리스트 렌더 (예약버튼 포함) ===== */
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
      rBtn.className = "booth-btn"; rBtn.textContent = "예약";
      rBtn.onclick = () => openReserve(name);
      row.appendChild(rBtn);
    }
    box.appendChild(row);
  }
}

/* ===== 예약 페이지 ===== */
let currentReserveBooth = null;
async function openReserve(boothName) {
  currentReserveBooth = boothName;
  appSection.style.display = "none";
  reserveSection.style.display = "block";
  document.getElementById("reserve-title").textContent = `${boothName} 예약`;
  document.getElementById("reserve-capacity").textContent = MAX_PER_SLOT;

  const sel = document.getElementById("reserve-slot");
  sel.innerHTML = "";
  for (const t of TIMES) { const opt = document.createElement("option"); opt.value=t; opt.textContent=t; sel.appendChild(opt); }

  const actionBtn = document.getElementById("reserve-action");
  actionBtn.onclick = reserveOrCancel;

  await refreshReserveTable();
}
window.closeReserve = function() { reserveSection.style.display = "none"; appSection.style.display = "block"; };

async function refreshReserveTable() {
  const tbody = document.getElementById("reserve-tbody");
  const user = auth.currentUser; if (!user) return;

  // 내 닉네임
  let myNick = user.email;
  try { const s = await get(ref(db, `users/${user.uid}/profile/nickname`)); if (s.exists()) myNick = s.val(); } catch {}

  // 모든 예약 읽기
  let data = {};
  try { const snap = await get(ref(db, `reservations/${currentReserveBooth}`)); if (snap.exists()) data = snap.val(); } catch {}

  // 표 렌더 + 내 닉네임 강조
  tbody.innerHTML = "";
  let mySlot = null;
  for (const t of TIMES) {
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

  // 버튼 상태
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
  const count = data[selected] ? Object.keys(data[selected]).length : 0;
  actionBtn.disabled = (actionBtn.dataset.mode === "reserve" && count >= MAX_PER_SLOT);

  sel.onchange = () => {
    const c = data[sel.value] ? Object.keys(data[sel.value]).length : 0;
    if (actionBtn.dataset.mode === "reserve") actionBtn.disabled = (c >= MAX_PER_SLOT);
  };
}

async function reserveOrCancel() {
  const user = auth.currentUser; if (!user) return alert("로그인 후 이용하세요.");
  // 내 닉네임
  let myNick = user.email;
  try { const s = await get(ref(db, `users/${user.uid}/profile/nickname`)); if (s.exists()) myNick = s.val(); } catch {}

  const sel = document.getElementById("reserve-slot");
  const slot = sel.value;
  const mode = document.getElementById("reserve-action").dataset.mode;

  if (mode === "cancel") {
    const all = await get(ref(db, `reservations/${currentReserveBooth}`));
    if (all.exists()) {
      const obj = all.val();
      for (const t of Object.keys(obj)) {
        if (obj[t][user.uid]) await remove(ref(db, `reservations/${currentReserveBooth}/${t}/${user.uid}`));
      }
    }
  } else {
    // 한 사람 1슬롯 정책: 기존 삭제
    const all = await get(ref(db, `reservations/${currentReserveBooth}`));
    if (all.exists()) {
      const obj = all.val();
      for (const t of Object.keys(obj)) {
        if (obj[t][user.uid]) await remove(ref(db, `reservations/${currentReserveBooth}/${t}/${user.uid}`));
      }
    }
    // 용량 확인 후 추가
    const currentSnap = await get(ref(db, `reservations/${currentReserveBooth}/${slot}`));
    const cnt = currentSnap.exists() ? Object.keys(currentSnap.val()).length : 0;
    if (cnt >= MAX_PER_SLOT) return alert("해당 시간은 이미 정원이 찼습니다.");
    await set(ref(db, `reservations/${currentReserveBooth}/${slot}/${user.uid}`), { nickname: myNick, ts: Date.now() });
  }

  await refreshReserveTable();
}

/* ===== Staff Only ===== */
window.openStaffLogin = function() { appSection.style.display = "none"; staffLoginSection.style.display = "block"; };
window.closeStaffLogin = function() { staffLoginSection.style.display = "none"; appSection.style.display = "block"; };
window.checkStaffPassword = async function() {
  const pw = document.getElementById("staff-password").value.trim();
  if (!STAFF_PASSWORDS[pw]) return alert("비밀번호가 올바르지 않습니다.");
  const boothName = STAFF_PASSWORDS[pw];
  staffLoginSection.style.display = "none"; staffSection.style.display = "block";
  document.getElementById("staff-booth-name").textContent = `${boothName} 관리`;
  openStaffTab("stamp");

  const toggle = document.getElementById("reserve-toggle");
  const s = await get(ref(db, `settings/booths/${boothName}/reservationEnabled`));
  toggle.checked = !!(s.exists() && s.val());

  toggle.onchange = async () => {
    await set(ref(db, `settings/booths/${boothName}/reservationEnabled`), toggle.checked);
    await renderBoothList();
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

/* ===== Staff: 닉네임 도장찍기 ===== */
window.giveStamp = async function() {
  const nickname = document.getElementById("target-nickname").value.trim();
  const result = document.getElementById("stamp-result");
  const boothName = document.getElementById("staff-booth-name").textContent.replace(" 관리", "");
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
