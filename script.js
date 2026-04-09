// --- IMPORTANTE: PEGUE ESSES DADOS NO CONSOLE DO FIREBASE ---
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI", // Sem isso o cadastro não funciona!
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos (ADICIONEI AS VARIÁVEIS FORM QUE FALTAVAM AQUI)
const authScreen = document.getElementById("auth-screen");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");
const registerAvatar = document.getElementById("registerAvatar");
const registerBtn = document.getElementById("registerBtn");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const authMessage = document.getElementById("authMessage");

const chatScreen = document.getElementById("chat-screen");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

// Alternar entre Login e Cadastro (AGORA VAI FUNCIONAR)
showRegister.addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    authMessage.textContent = "";
});

showLogin.addEventListener("click", () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    authMessage.textContent = "";
});

// --- O RESTO DO SEU CÓDIGO DE CADASTRO E LOGIN CONTINUA IGUAL ABAIXO ---
// (Certifique-se de manter as funções de cadastro e login que você já tem)
