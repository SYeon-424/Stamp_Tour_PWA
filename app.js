// Firebase SDK (modular v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, update
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

/** 🔧 부스별 스탬프 이미지 / 좌표 매핑 */
const STAMP_IMAGES = {
  "인포메티카": "./stamps/informatica.png",
  "Static": "./stamps/static.png",
  "셈터": "./stamps/semter.png"
};

const STAMP_POS = {
  "인포메티카": { x: 50,  y: 100 },
  "Static":     { x: 200, y: 150 },
  "셈터":       { x: 300, y: 250 }
};

/** 🔧 부스 소개 정보 */
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

// ===== UI refs =====
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");
const boothSection = document.getElementById("booth-section");
const signupBtn   = document.getElementById("signup");
const loginBtn    = document.getElementById("login");
const logoutBtn   = document.getElementById("logout");
const userDisplay = document.getElementById("user-display");

// ===== Auth Handlers =====
signupBtn.onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return alert("이메일/비밀번호를 입력하세요.");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), {
      profile: { email, createdAt: Date.now() },
      stamps: {}
    });
    alert("회원가입 완료! 자동 로그인됨.");
  } catch (e) {
    alert(e.message);
  }
};

loginBtn.onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return alert("이메일/비밀번호를 입력하세요.");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
};

logoutBtn.onclick = () => signOut(auth).catch(console.error);

// 로그인 상태 감지
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.style.display = "none";
    appSection.style.display  = "block";
    boothSection.style.display = "none";
    userDisplay.textContent   = user.email || "사용자";
    await loadStamps(user.uid);
  } else {
    authSection.style.display = "block";
    appSection.style.display  = "none";
    boothSection.style.display = "none";
  }
});

// ===== Business Logic =====

// 부스 방문 → 스탬프 찍기
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

// 도장판 렌더링
async function loadStamps(uid) {
  const board = document.getElementById("stampBoard");
  board.innerHTML = "";

  try {
    const snap = await get(ref(db, `users/${uid}/stamps`));
    if (!snap.exists()) return;

    const stamps = snap.val();
    Object.keys(stamps).forEach((booth) => {
      const data = stamps[booth];
      if (!data?.stamped) return;

      const pos = STAMP_POS[booth] || { x: 0, y: 0 };
      const imgSrc = data.img || STAMP_IMAGES[booth] || "./stamp.png";

      const stampEl = document.createElement("img");
      stampEl.src = imgSrc;
      stampEl.alt = `${booth} 스탬프`;
      stampEl.className = "stamp";
      stampEl.style.left = pos.x + "px";
      stampEl.style.top  = pos.y + "px";

      board.appendChild(stampEl);
    });
  } catch (e) {
    console.error(e);
  }
}

// ===== 부스 소개 =====
window.showBooth = function(name) {
  const booth = BOOTH_INFO[name];
  if (!booth) return alert("부스 정보 없음!");

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
