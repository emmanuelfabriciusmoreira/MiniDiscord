// 1. Configurações do seu Firebase
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

// NOVOS ELEMENTOS PARA VOZ
const startVoiceBtn = document.getElementById("startVoice");
const stopVoiceBtn = document.getElementById("stopVoice");
const voiceContainer = document.getElementById("voice-container");
const textChatContent = document.getElementById("text-chat-content");
const channelName = document.getElementById("channel-name");
let jitsiApi = null;

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

// 7. Carregar mensagens
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

// 8. LÓGICA DE VOZ (JITSI)
startVoiceBtn.addEventListener("click", () => {
    if (!currentUser) return;

    textChatContent.style.display = "none";
    voiceContainer.style.display = "flex";
    channelName.textContent = "🔊 Sala de Voz da DØMINUS";

    const domain = "meet.jit.si";
    const options = {
        roomName: "DominusVoz_Sala_Exclusiva_99", // Nome da sala
        width: "100%",
        height: "100%",
        parentNode: document.querySelector("#jitsi-iframe"),
        userInfo: {
            displayName: currentUser.username
        },
        configOverwrite: { startWithAudioMuted: false },
        interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false }
    };
    jitsiApi = new JitsiMeetExternalAPI(domain, options);
});

stopVoiceBtn.addEventListener("click", () => {
    if (jitsiApi) {
        jitsiApi.dispose();
        jitsiApi = null;
    }
    voiceContainer.style.display = "none";
    textChatContent.style.display = "block";
    channelName.textContent = "# Geral";
});

// 9. Logout
logoutBtn.addEventListener("click", async () => {
  if (jitsiApi) jitsiApi.dispose();
  await auth.signOut();
  location.reload();
});
