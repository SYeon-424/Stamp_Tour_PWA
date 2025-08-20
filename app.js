// Firebase SDK import (v10 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { 
  getDatabase, ref, set, get 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// 🔹 여기에 네 Firebase 설정 붙여넣기
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 🔹 UI 요소
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const signupBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

// 회원가입
signupBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // DB에 초기 도장판 저장
      set(ref(db, "users/" + user.uid), {
        stamps: {}
      });
    })
    .catch((err) => alert(err.message));
};

// 로그인
loginBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .catch((err) => alert(err.message));
};

// 로그아웃
logoutBtn.onclick = () => {
  signOut(auth);
};

// 로그인 상태 변화 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    loadStamps(user.uid);
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
});

// 부스 방문 → 도장 찍기
window.visitBooth = function(boothName) {
  const user = auth.currentUser;
  if (!user) return;

  // DB에 해당 부스 도장 true로 저장
  set(ref(db, "users/" + user.uid + "/stamps/" + boothName), true)
    .then(() => loadStamps(user.uid));
};

// 도장판 불러오기
function loadStamps(uid) {
  const board = document.getElementById("stampBoard");
  board.innerHTML = '<img src="background.png" style="width:100%;">'; // 초기화

  const stampPositions = {
    "인포메티카": {x: 50, y: 100},
    "Static": {x: 200, y: 150},
    "셈터": {x: 300, y: 250}
  };

  get(ref(db, "users/" + uid + "/stamps")).then(snapshot => {
    if (snapshot.exists()) {
      const stamps = snapshot.val();
      for (const booth in stamps) {
        if (stamps[booth]) {
          const stamp = document.createElement("img");
          stamp.src = "stamp.png";
          stamp.style.position = "absolute";
          stamp.style.left = stampPositions[booth].x + "px";
          stamp.style.top = stampPositions[booth].y + "px";
          stamp.style.width = "50px";
          board.appendChild(stamp);
        }
      }
    }
  });
}
