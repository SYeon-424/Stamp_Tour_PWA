// Firebase SDK (modular v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { 
  getDatabase, ref, set, get 
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
const db = getDatabase(app);

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
      set(ref(db, "users/" + user.uid), { stamps: {} });
    })
    .catch((err) => alert(err.message));
};

// 로그인
loginBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password).catch((err) => alert(err.message));
};

// 로그아웃
logoutBtn.onclick = () => signOut(auth);

// 상태 감지
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

// 도장 찍기
window.visitBooth = function(boothName) {
  const user = auth.currentUser;
  if (!user) return;
  set(ref(db, "users/" + user.uid + "/stamps/" + boothName), true)
    .then(() => loadStamps(user.uid));
};

// 도장 불러오기
function loadStamps(uid) {
  const board = document.getElementById("stampBoard");
  board.innerHTML = '<img src="background.png" style="width:100%;">';

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
