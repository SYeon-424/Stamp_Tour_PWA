import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, deleteUser
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

// =================== 유틸: 화면 전환 ===================
function showLoginOnly() {
  loginSection.style.display  = "block";
  signupSection.style.display = "none";
  appSection.style.display    = "none";
  boothSection.style.display  = "none";
  reserveSection.style.display= "none";
  staffLoginSection.style.display = "none";
  staffSection.style.display  = "none";
  settingsSection.style.display = "none";
  settingsBtn.style.display   = "none"; // ⚙️ 숨김
}

// === 공용: 로그인된 화면 렌더 ===
async function renderLoggedInUI(user) {
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
}

// =================== 입력 보조 ===================
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

// =================== 화면 전환 버튼 ===================
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
    showLoginOnly(); // 회원가입 후에는 로그인 화면만 보이도록
  } catch (e) {
    alert(e.message);
  }
};

// =================== 로그인(닉네임 또는 이메일 + 비번) ===================
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
      if (!snap.exists()) {
        alert("해당 닉네임을 찾을 수 없습니다.");
        return;
      }
      const usersObj = snap.val();
      const firstUid = Object.keys(usersObj)[0];
      email = usersObj[firstUid]?.profile?.email;
      if (!email) {
        alert("이 계정에 이메일 정보가 없어 로그인할 수 없습니다.");
        return;
      }
    }

    await signInWithEmailAndPassword(auth, email, password);

    // 즉시 렌더(새로고침 필요 없음)
    if (auth.currentUser) {
      await renderLoggedInUI(auth.currentUser);
    }
  } catch (e) {
    alert(e.message);
  } finally {
    loginBtn.disabled = false;
  }
};

logoutBtn.onclick = () => signOut(auth).catch(console.error);

// =================== 세션 반영 ===================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try { await renderLoggedInUI(user); }
    catch (e) { console.error(e); }
  } else {
    showLoginOnly();
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
    if (p.exists()) { myNick = p.val().nickname || myNick; myPhone
