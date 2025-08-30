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

// ===== UI refs =====
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");
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
    // 사용자 기본 데이터 초기화
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
    userDisplay.textContent   = user.email || "사용자";
    await loadStamps(user.uid);
  } else {
    authSection.style.display = "block";
    appSection.style.display  = "none";
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
  // 배경만 남기고 초기화
  board.innerHTML = '<img src="./background.png" alt="도장판 배경">';

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
      stampEl.style.position = "absolute";
      stampEl.style.left = pos.x + "px";
      stampEl.style.top  = pos.y + "px";
      stampEl.style.width = "60px";
      stampEl.style.pointerEvents = "none";
      board.appendChild(stampEl);
    });
  } catch (e) {
    console.error(e);
  }
}
