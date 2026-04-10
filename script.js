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
const messages = document.getElementById("messages"), messageInput = document.getElementById("messageInput");
const channelName = document.getElementById("channel-name");

let currentUser = null, currentChannel = "geral", unsubscribe = null;

// --- LOGIN E CADASTRO ---
document.getElementById("showRegister").onclick = () => { document.getElementById("login-form").style.display = "none"; document.getElementById("register-form").style.display = "block"; };
document.getElementById("showLogin").onclick = () => { document.getElementById("login-form").style.display = "block"; document.getElementById("register-form").style.display = "none"; };

document.getElementById("loginBtn").onclick = async () => {
    try {
        const cred = await auth.signInWithEmailAndPassword(document.getElementById("loginUsername").value.trim() + "@minidiscord.com", document.getElementById("loginPassword").value);
        const doc = await db.collection("users").doc(cred.user.uid).get();
        currentUser = doc.data();
        authScreen.style.display = "none"; chatScreen.style.display = "flex";
        loadMessages();
    } catch(e) { alert("Erro ao entrar: Verifique usuário e senha."); }
};

document.getElementById("registerBtn").onclick = async () => {
    const user = document.getElementById("registerUsername").value.trim();
    const file = document.getElementById("registerAvatar").files[0];
    if(!user || !file) return alert("Preencha o nome e escolha uma foto!");
    try {
        const cred = await auth.createUserWithEmailAndPassword(user + "@minidiscord.com", document.getElementById("registerPassword").value);
        const reader = new FileReader();
        reader.onload = async (e) => {
            await db.collection("users").doc(cred.user.uid).set({ username: user, avatar: e.target.result });
            alert("Conta criada! Agora é só logar.");
            location.reload();
        };
        reader.readAsDataURL(file);
    } catch(e) { alert("Erro no cadastro: " + e.message); }
};

// --- LOGICA DE CANAIS ---
document.querySelectorAll('.channel-link').forEach(link => {
    link.onclick = (e) => {
        document.querySelectorAll('.channel-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentChannel = e.currentTarget.getAttribute('data-channel');
        channelName.textContent = "# " + e.currentTarget.textContent.replace('# ', '');
        messages.innerHTML = "";
        loadMessages();
    };
});

// --- MENSAGENS (ORDENAÇÃO MANUAL) ---
async function sendMessage(){
    const text = messageInput.value.trim(); 
    if(!text || !currentUser) return;
    await db.collection("messages").add({
        username: currentUser.username, avatar: currentUser.avatar, text,
        channel: currentChannel, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    messageInput.value = "";
}

document.getElementById("sendBtn").onclick = sendMessage;
messageInput.onkeypress = (e) => { if(e.key === "Enter") sendMessage(); };

function loadMessages(){
    if(unsubscribe) unsubscribe();
    unsubscribe = db.collection("messages")
        .where("channel", "==", currentChannel)
        .onSnapshot(snapshot => {
            let msgList = [];
            snapshot.forEach(doc => msgList.push(doc.data()));
            // Ordena por tempo para não bugar a ordem
            msgList.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

            messages.innerHTML = msgList.map(m => `
                <div class="message">
                    <img src="${m.avatar}" class="avatar">
                    <div class="message-content">
                        <div class="username">${m.username}</div>
                        <div>${m.text}</div>
                    </div>
                </div>`).join('');
            messages.scrollTop = messages.scrollHeight;
        });
}

// --- CALL (ABRINDO EM NOVA ABA) ---
document.getElementById("startVoice").onclick = () => {
    if(!currentUser) return;
    
    // Nome da sala limpo como você pediu
    const salaNome = "Call_MiniDiscord_" + firebaseConfig.projectId;
    const urlJitsi = "https://meet.jit.si/" + salaNome;

    // Abre em nova aba para evitar erros de permissão e limites de tempo
    window.open(urlJitsi, '_blank');
};

document.getElementById("logoutBtn").onclick = () => { auth.signOut(); location.reload(); };
