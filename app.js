// Firebase SDK (modular v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, update, query, orderByChild, equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtw8q24h9eiCO8pIR8jqVaD_eIWtR-MCE",
  authDomain: "stamptour-pwa.firebaseapp.com",
  projectId: "stamptour-pwa",
  storageBucket: "stamptour-pwa.firebasestorage.app",
  messagingSenderId: "751009851376",
  appId: "1:751009851376:web:e9280e3a92754de9ed5f35"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

/* =========================
   도장/부스 이미지 매핑
   (스탬프 이미지는 배경과 동일 크기)
========================= */

// 13개 부스 도장 이미지 (배경과 동일 크기의 PNG)
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

// 부스 소개 이미지 (선택 화면 → 소개 페이지)
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

// Staff 전용 비밀번호 → 부스명 매핑
const STAFF_PASSWORDS = {
  "pw1": "Static","pw2": "인포메티카","pw3": "배째미","pw4": "생동감","pw5": "마스터",
  "pw6": "Z-one","pw7": "셈터","pw8": "시그너스","pw9": "케미어스","pw10": "넛츠",
  "pw11": "스팀","pw12": "오토메틱","pw13": "플럭스"
};

/* =========================
   UI refs
========================= */
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");
const boothSection = document.getElementById("booth-section");
const staffLoginSection = document.getElementById("staff-login-section");
const staffSection = document.getElementById("staff-section");

const signupBtn   = document.getElementById("signup");
const loginBtn    = document.getElementById("login");
const logoutBtn   = document.getElementById("logout");
const userDisplay = document.getElementById("user-display");

/* =========================
   Auth
========================= */

// 회원가입 (닉네임 중복 검사 포함)
signupBtn.onclick = async () => {
  const nickname = document.getElementById("nickname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!nickname || !email || !password) {
    alert("닉네임, 이메일, 비밀번호를 모두 입력하세요.");
    return;
  }

  try {
    // 닉네임 중복 검사
    const q = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const dup = await get(q);
    if (dup.exists()) {
      alert("이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.");
      return;
    }

    // 회원 생성
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), {
      profile: { email, nickname, createdAt: Date.now() },
      stamps: {}
    });

    alert("회원가입 완료!");
  } catch (e) {
    alert(e.message);
  }
};

loginBtn.onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
};

logoutBtn.onclick = () => signOut(auth).catch(console.error);

// 로그인 상태 처리
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.style.display = "none";
    appSection.style.display  = "block";
    boothSection.style.display = "none";
    staffLoginSection.style.display = "none";
    staffSection.style.display = "none";

    // 닉네임 표기
    try {
      const nickSnap = await get(ref(db, `users/${user.uid}/profile/nickname`));
      userDisplay.textContent = nickSnap.exists() ? nickSnap.val() : (user.email || "");
    } catch {
      userDisplay.textContent = user.email || "";
    }

    await loadStamps(user.uid);
  } else {
    authSection.style.display = "block";
    appSection.style.display  = "none";
    boothSection.style.display = "none";
    staffLoginSection.style.display = "none";
    staffSection.style.display = "none";
    userDisplay.textContent = "";
  }
});

/* =========================
   도장판 렌더링 (오버레이 방식)
========================= */
async function loadStamps(uid) {
  const board = document.getElementById("stampBoard");
  board.innerHTML = ""; // 초기화

  // 1) 배경
  const bg = document.createElement("img");
  bg.src = "./background.png";
  bg.alt = "도장판 배경";
  board.appendChild(bg);

  // 2) 사용자의 모든 스탬프 레이어
  try {
    const snap = await get(ref(db, `users/${uid}/stamps`));
    if (!snap.exists()) return;

    const stamps = snap.val();
    Object.keys(stamps).forEach((booth) => {
      const data = stamps[booth];
      if (!data?.stamped) return;

      const layer = document.createElement("img");
      layer.src = data.img || STAMP_IMAGES[booth] || "./stamp.png";
      layer.alt = `${booth} 스탬프`;
      board.appendChild(layer);
    });
  } catch (e) {
    console.error(e);
  }
}

/* =========================
   사용자 본인이 부스 방문 → 도장 찍기
========================= */
window.visitBooth = async function(boothName) {
  const user = auth.currentUser;
  if (!user) return alert("로그인 후 이용하세요.");

  const imgPath = STAMP_IMAGES[boothName] || "./stamp.png";
  try {
    await update(ref(db, `users/${user.uid}/stamps/${boothName}`), {
      stamped: true,
      img: imgPath,
      ts: Date.now()
    });
    await loadStamps(user.uid);
  } catch (e) {
    alert("도장 찍기 실패: " + e.message);
  }
};

/* =========================
   부스 소개 페이지
========================= */
window.showBooth = function(name) {
  const booth = BOOTH_INFO[name];
  if (!booth) return;
  appSection.style.display = "none";
  boothSection.style.display = "block";
  document.getElementById("booth-name").textContent = name;
  document.getElementById("booth-img").src = booth.img;
  document.getElementById("booth-desc").textContent = booth.desc;
};

window.closeBooth = function() {
  boothSection.style.display = "none";
  appSection.style.display = "block";
};

/* =========================
   Staff Only → 로그인/탭
========================= */
window.openStaffLogin = function() {
  appSection.style.display = "none";
  staffLoginSection.style.display = "block";
};
window.closeStaffLogin = function() {
  staffLoginSection.style.display = "none";
  appSection.style.display = "block";
};
window.checkStaffPassword = function() {
  const pw = document.getElementById("staff-password").value.trim();
  if (STAFF_PASSWORDS[pw]) {
    const boothName = STAFF_PASSWORDS[pw];
    staffLoginSection.style.display = "none";
    staffSection.style.display = "block";
    document.getElementById("staff-booth-name").textContent = `${boothName} 관리`;
    openStaffTab("stamp");
  } else {
    alert("비밀번호가 올바르지 않습니다.");
  }
};
window.closeStaff = function() {
  staffSection.style.display = "none";
  appSection.style.display = "block";
};
window.openStaffTab = function(tab) {
  document.getElementById("staff-tab-stamp").style.display = (tab === "stamp") ? "block" : "none";
  document.getElementById("staff-tab-reserve").style.display = (tab === "reserve") ? "block" : "none";

  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  if (tab === "stamp") buttons[0].classList.add("active");
  else buttons[1].classList.add("active");
};

/* =========================
   Staff: 닉네임으로 도장 찍기
========================= */
window.giveStamp = async function() {
  const nickname = document.getElementById("target-nickname").value.trim();
  const result = document.getElementById("stamp-result");
  const boothName = document.getElementById("staff-booth-name").textContent.replace(" 관리", "");

  if (!nickname) {
    result.textContent = "❌ 닉네임을 입력하세요.";
    return;
  }

  try {
    // 닉네임으로 사용자 찾기 (회원가입 시 중복 금지되어 있음)
    const q = query(ref(db, "users"), orderByChild("profile/nickname"), equalTo(nickname));
    const snap = await get(q);

    if (!snap.exists()) {
      result.textContent = "❌ 해당 닉네임 사용자가 없습니다.";
      return;
    }

    const uid = Object.keys(snap.val())[0];
    const imgPath = STAMP_IMAGES[boothName] || "./stamp.png";

    await update(ref(db, `users/${uid}/stamps/${boothName}`), {
      stamped: true,
      img: imgPath,
      ts: Date.now()
    });

    result.textContent = `✅ ${nickname} 님에게 [${boothName}] 도장을 찍었습니다.`;
  } catch (e) {
    console.error(e);
    result.textContent = "❌ 오류 발생: " + e.message;
  }
};
