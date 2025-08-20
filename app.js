import { auth, db } from "./firebase-init.js"; // 위에서 전역 등록했으면 바로 사용 가능
import { ref, get, set, update, child } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const appEl = document.getElementById("app");

// 간단한 라우터
function render(page) {
  if (page === "login") renderLogin();
  if (page === "register") renderRegister();
  if (page === "board") renderBoard();
}

function renderLogin() {
  appEl.innerHTML = `
    <h2>🔐 로그인</h2>
    <input id="email" placeholder="이메일"><br>
    <input id="pw" type="password" placeholder="비밀번호"><br>
    <button id="loginBtn">로그인</button>
    <button id="goRegister">회원가입</button>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    const email = document.getElementById("email").value;
    const pw = document.getElementById("pw").value;
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      render("board");
    } catch (e) {
      alert("로그인 실패: " + e.message);
    }
  };
  document.getElementById("goRegister").onclick = () => render("register");
}

function renderRegister() {
  appEl.innerHTML = `
    <h2>📝 회원가입</h2>
    <input id="email" placeholder="이메일"><br>
    <input id="pw" type="password" placeholder="비밀번호"><br>
    <input id="nick" placeholder="닉네임"><br>
    <button id="registerBtn">회원가입</button>
    <button id="goLogin">뒤로가기</button>
  `;

  document.getElementById("registerBtn").onclick = async () => {
    const email = document.getElementById("email").value;
    const pw = document.getElementById("pw").value;
    const nick = document.getElementById("nick").value;
    try {
      await createUserWithEmailAndPassword(auth, email, pw);
      await set(ref(db, "users/" + email.replace(/\./g, "_")), {
        email, nickname: nick
      });
      alert("회원가입 완료!");
      render("login");
    } catch (e) {
      alert("회원가입 실패: " + e.message);
    }
  };
  document.getElementById("goLogin").onclick = () => render("login");
}

function renderBoard() {
  appEl.innerHTML = `
    <h2>🎯 도장판</h2>
    <canvas id="board" width="600" height="800"></canvas>
    <button id="logout">로그아웃</button>
  `;

  document.getElementById("logout").onclick = async () => {
    await signOut(auth);
    render("login");
  };

  // 도장판 그리기
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");

  const baseImg = new Image();
  baseImg.src = "assets/StampPaperSample.png";
  baseImg.onload = () => {
    ctx.drawImage(baseImg, 0, 0);
    // 예시: Static 클럽 도장 표시
    const stamp = new Image();
    stamp.src = "assets/stamps/Static.png";
    stamp.onload = () => ctx.drawImage(stamp, 100, 200, 80, 80);
  };
}

// 로그인 상태 유지
onAuthStateChanged(auth, (user) => {
  if (user) render("board");
  else render("login");
});
