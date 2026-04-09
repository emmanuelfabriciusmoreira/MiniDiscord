// 1. Configurações do seu Firebase (Dados reais do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyC3mL24ZO-m7158yYVp2l2o1OuSbnEvoxE",
  authDomain: "mini-discord-cc0c5.firebaseapp.com",
  projectId: "mini-discord-cc0c5",
  storageBucket: "mini-discord-cc0c5.firebasestorage.app",
  messagingSenderId: "392335666272",
  appId: "1:392335666272:web:7661e19e6b9e0078d7a705",
  measurementId: "G-5NX67429FX"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. Elementos do HTML
const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");
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

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

// 3. Alternar entre Login e Cadastro
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

// 4. Sistema de Cadastro
registerBtn.addEventListener("click", async () => {
  const email = registerUsername.value.trim() + "@minidiscord.com";
  const password = registerPassword.value;
  const avatarFile = registerAvatar.files[0];

  if(!registerUsername.value || !password || !avatarFile){
      authMessage.style.color = "#faa"; 
      authMessage.textContent = "Preencha tudo e escolha uma foto!"; 
      return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatarData = e.target.result;
      await db.collection("users").doc(currentUser.uid).set({
        username: registerUsername.value.trim(),
        avatar: avatarData
      });
      authMessage.style.color = "#3ba55c";
      authMessage.textContent = "Cadastro OK! Pode entrar.";
      // Volta pro login pro usuário entrar
      setTimeout(() => showLogin.click(), 2000);
    };
    reader.readAsDataURL(avatarFile);
  } catch(err) {
    authMessage.style.color = "#faa"; 
    authMessage.textContent = "Erro: " + err.message;
  }
});

// 5. Sistema de Login
loginBtn.addEventListener("click", async () => {
  const email = loginUsername.value.trim() + "@minidiscord.com";
  const password = loginPassword.value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    const userData = userDoc.data();
    
    currentUser.username = userData.username;
    currentUser.avatar = userData.avatar;
    
    authScreen.style.display = "none";
    chatScreen.style.display = "flex";
    loadMessages();
  } catch(err) {
    authMessage.style.color = "#faa"; 
    authMessage.textContent = "Login falhou: " + err.message;
  }
});

// 6. Enviar Mensagem
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendMessage(); });

async function sendMessage(){
  const text = messageInput.value.trim(); 
  if(!text || !currentUser) return;
  
  await db.collection("messages").add({
    username: currentUser.username,
    avatar: currentUser.avatar,
    text: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  messageInput.value = "";
}

// 7. Carregar mensagens (Snapshot = tempo real)
function loadMessages(){
  db.collection("messages").orderBy("timestamp")
    .onSnapshot(snapshot => {
      messages.innerHTML = "";
      snapshot.forEach(doc => appendMessage(doc.data()));
      messages.scrollTop = messages.scrollHeight;
    });
}

function appendMessage(message){
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  
  const avatar = document.createElement("img");
  avatar.classList.add("avatar");
  avatar.src = message.avatar || "https://via.placeholder.com/40";
  
  const content = document.createElement("div");
  content.classList.add("message-content");
  
  const nameEl = document.createElement("div");
  nameEl.classList.add("username");
  nameEl.textContent = message.username;
  
  const textEl = document.createElement("div");
  textEl.textContent = message.text;
  
  content.appendChild(nameEl);
  content.appendChild(textEl);
  messageElement.appendChild(avatar);
  messageElement.appendChild(content);
  messages.appendChild(messageElement);
}

// 8. Logout
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  location.reload(); // Recarrega a página para limpar tudo
});
