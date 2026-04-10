const firebaseConfig = {
  apiKey: "AIzaSyC3mL24ZO-m7158yYVp2l2o1OuSbnEvoxE",
  authDomain: "mini-discord-cc0c5.firebaseapp.com",
  projectId: "mini-discord-cc0c5",
  storageBucket: "mini-discord-cc0c5.firebasestorage.app",
  messagingSenderId: "392335666272",
  appId: "1:392335666272:web:7661e19e6b9e0078d7a705",
  measurementId: "G-5NX67429FX"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos da Interface
const authScreen = document.getElementById("auth-screen"), chatScreen = document.getElementById("chat-screen");
const loginForm = document.getElementById("login-form"), registerForm = document.getElementById("register-form");
const loginUsername = document.getElementById("loginUsername"), loginPassword = document.getElementById("loginPassword"), loginBtn = document.getElementById("loginBtn");
const registerUsername = document.getElementById("registerUsername"), registerPassword = document.getElementById("registerPassword"), registerAvatar = document.getElementById("registerAvatar"), registerBtn = document.getElementById("registerBtn");
const showRegister = document.getElementById("showRegister"), showLogin = document.getElementById("showLogin"), authMessage = document.getElementById("authMessage");
const sendBtn = document.getElementById("sendBtn"), messageInput = document.getElementById("messageInput"), messages = document.getElementById("messages"), logoutBtn = document.getElementById("logoutBtn");

const startVoiceBtn = document.getElementById("startVoice"), stopVoiceBtn = document.getElementById("stopVoice"), voiceContainer = document.getElementById("voice-container"), textChatContent = document.getElementById("text-chat-content"), channelName = document.getElementById("channel-name");

let jitsiApi = null, currentUser = null, currentChannel = "geral", unsubscribe = null;

// --- LOGIN E CADASTRO ---
showRegister.onclick = () => { loginForm.style.display = "none"; registerForm.style.display = "block"; };
showLogin.onclick = () => { loginForm.style.display = "block"; registerForm.style.display = "none"; };

registerBtn.onclick = async () => {
  const email = registerUsername.value.trim() + "@minidiscord.com", password = registerPassword.value, avatarFile = registerAvatar.files[0];
  if(!registerUsername.value || !password || !avatarFile) return authMessage.textContent = "Preencha tudo!";
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const reader = new FileReader();
    reader.onload = async (e) => {
      await db.collection("users").doc(userCredential.user.uid).set({ username: registerUsername.value.trim(), avatar: e.target.result });
      authMessage.style.color = "#3ba55c"; authMessage.textContent = "OK! Entre agora.";
      setTimeout(() => showLogin.click(), 2000);
    };
    reader.readAsDataURL(avatarFile);
  } catch(err) { authMessage.textContent = err.message; }
};

loginBtn.onclick = async () => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(loginUsername.value.trim() + "@minidiscord.com", loginPassword.value);
    const userDoc = await db.collection("users").doc(userCredential.user.uid).get();
    currentUser = { ...userDoc.data(), uid: userCredential.user.uid };
    authScreen.style.display = "none"; chatScreen.style.display = "flex";
    loadMessages();
  } catch(err) { authMessage.textContent = "Erro: " + err.message; }
};

// --- LOGICA DE CANAIS REFORÇADA ---
document.querySelectorAll('.channel-link').forEach(link => {
    link.onclick = (e) => {
        document.querySelectorAll('.channel-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        currentChannel = e.currentTarget.getAttribute('data-channel');
        channelName.textContent = "# " + e.currentTarget.textContent.replace('# ', '');
        
        messages.innerHTML = ""; // Limpa a tela
        voiceContainer.style.display = "none"; 
        textChatContent.style.display = "block";
        
        if (jitsiApi) { jitsiApi.dispose(); jitsiApi = null; }
        
        console.log("Mudando para: " + currentChannel);
        loadMessages();
    };
});

// --- MENSAGENS ---
async function sendMessage(){
  const text = messageInput.value.trim(); 
  if(!text || !currentUser) return;
  await db.collection("messages").add({
    username: currentUser.username, avatar: currentUser.avatar, text: text,
    channel: currentChannel, timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  messageInput.value = "";
}

sendBtn.onclick = sendMessage;
messageInput.onkeypress = (e) => { if(e.key === "Enter") sendMessage(); };

function loadMessages(){
  // Desconecta do canal antigo antes de entrar no novo
  if(unsubscribe) unsubscribe();
  
  unsubscribe = db.collection("messages")
    .where("channel", "==", currentChannel)
    .orderBy("timestamp", "asc")
    .onSnapshot(snapshot => {
      messages.innerHTML = "";
      snapshot.forEach(doc => {
          const m = doc.data();
          messages.innerHTML += `
            <div class="message">
                <img class="avatar" src="${m.avatar}">
                <div class="message-content">
                    <div class="username">${m.username}</div>
                    <div>${m.text}</div>
                </div>
            </div>`;
      });
      
      const jumpToBottom = () => { messages.scrollTop = messages.scrollHeight; };
      jumpToBottom();
      setTimeout(jumpToBottom, 150);
    }, error => {
      console.error("ERRO FIREBASE: ", error);
    });
}

// --- CALL (VOZ) ---
startVoiceBtn.onclick = () => {
    if(!currentUser) return;
    textChatContent.style.display = "none"; 
    voiceContainer.style.display = "flex"; 
    channelName.textContent = "🔊 CALL";
    
    jitsiApi = new JitsiMeetExternalAPI("meet.jit.si", {
        roomName: "MiniDiscord_Call_" + firebaseConfig.projectId,
        width: "100%", height: "100%", parentNode: document.querySelector("#jitsi-iframe"),
        userInfo: { displayName: currentUser.username }
    });
};

stopVoiceBtn.onclick = () => {
    if (jitsiApi) jitsiApi.dispose(); 
    jitsiApi = null;
    voiceContainer.style.display = "none"; 
    textChatContent.style.display = "block"; 
    channelName.textContent = "# " + currentChannel;
};

logoutBtn.onclick = () => { 
    if(jitsiApi) jitsiApi.dispose();
    auth.signOut(); 
    location.reload(); 
};
