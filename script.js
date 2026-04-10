const firebaseConfig = {
  apiKey: "AIzaSyC3mL24ZO-m7158yYVp2l2o1OuSbnEvoxE",
  authDomain: "mini-discord-cc0c5.firebaseapp.com",
  projectId: "mini-discord-cc0c5",
  storageBucket: "mini-discord-cc0c5.firebasestorage.app",
  messagingSenderId: "392335666272",
  appId: "1:392335666272:web:7661e19e6b9e0078d7a705",
  measurementId: "G-5NX67429FX"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null, currentChannel = "geral", unsubscribe = null;

// ELEMENTOS
const authScreen = document.getElementById("auth-screen"), chatScreen = document.getElementById("chat-screen");
const msgDiv = document.getElementById("messages"), input = document.getElementById("messageInput");

// --- NOTIFICAÇÕES ---
function askNotificationPermission() {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

function sendNotification(m) {
    // Só manda se a aba estiver escondida e tiver permissão
    if (document.hidden && Notification.permission === "granted") {
        new Notification(`Nova mensagem em #${currentChannel}`, {
            body: `${m.username}: ${m.text}`,
            icon: m.avatar || "https://cdn-icons-png.flaticon.com/512/2111/2111370.png"
        });
    }
}

// --- NAVEGAÇÃO ---
document.getElementById("showRegister").onclick = () => { document.getElementById("login-form").style.display="none"; document.getElementById("register-form").style.display="block"; };
document.getElementById("showLogin").onclick = () => { document.getElementById("login-form").style.display="block"; document.getElementById("register-form").style.display="none"; };

// LOGIN
document.getElementById("loginBtn").onclick = async () => {
    try {
        const cred = await auth.signInWithEmailAndPassword(document.getElementById("loginUsername").value.trim() + "@minidiscord.com", document.getElementById("loginPassword").value);
        const doc = await db.collection("users").doc(cred.user.uid).get();
        currentUser = doc.data();
        authScreen.style.display = "none"; chatScreen.style.display = "flex";
        askNotificationPermission(); // Pede permissão ao logar
        loadMessages();
    } catch(e) { alert("Usuário ou senha incorretos"); }
};

// CADASTRO
document.getElementById("registerBtn").onclick = async () => {
    const user = document.getElementById("registerUsername").value.trim();
    const file = document.getElementById("registerAvatar").files[0];
    if(!file) return alert("Selecione uma foto!");
    try {
        const cred = await auth.createUserWithEmailAndPassword(user + "@minidiscord.com", document.getElementById("registerPassword").value);
        const reader = new FileReader();
        reader.onload = async (e) => {
            await db.collection("users").doc(cred.user.uid).set({ username: user, avatar: e.target.result });
            location.reload();
        };
        reader.readAsDataURL(file);
    } catch(e) { alert(e.message); }
};

// TROCA DE CANAIS
document.querySelectorAll('.channel-link').forEach(link => {
    link.onclick = (e) => {
        document.querySelectorAll('.channel-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentChannel = e.currentTarget.dataset.channel;
        document.getElementById("channel-name").innerText = "# " + currentChannel;
        loadMessages();
    };
});

// ENVIAR MENSAGEM
async function sendMessage() {
    if(!input.value.trim() || !currentUser) return;
    await db.collection("messages").add({
        username: currentUser.username, 
        avatar: currentUser.avatar,
        text: input.value, 
        channel: currentChannel, 
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
}

document.getElementById("sendBtn").onclick = sendMessage;
input.onkeypress = (e) => { if(e.key === "Enter") sendMessage(); };

// CARREGAR MENSAGENS E NOTIFICAR
function loadMessages() {
    if(unsubscribe) unsubscribe();
    
    // .docChanges() permite ver o que é NOVO
    unsubscribe = db.collection("messages")
        .where("channel", "==", currentChannel)
        .onSnapshot(snap => {
            let list = [];
            snap.forEach(d => list.push(d.data()));
            
            // Ordena
            list.sort((a,b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            
            // Desenha na tela
            msgDiv.innerHTML = list.map(m => `
                <div class="message">
                    <img src="${m.avatar}" class="avatar">
                    <div><div class="username">${m.username}</div><div>${m.text}</div></div>
                </div>`).join('');
            msgDiv.scrollTop = msgDiv.scrollHeight;

            // Verifica se a última mensagem adicionada deve disparar notificação
            snap.docChanges().forEach(change => {
                if (change.type === "added" && !snap.metadata.hasPendingWrites) {
                    const m = change.doc.data();
                    if (m.username !== currentUser.username) {
                        sendNotification(m);
                    }
                }
            });
        });
}

// CALL (ABRIR EM NOVA ABA)
document.getElementById("startVoice").onclick = () => {
    if(!currentUser) return;
    const salaNome = "Call_MiniDiscord_" + currentChannel; 
    const urlJitsi = `https://meet.jit.si/${salaNome}#config.prejoinPageEnabled=false`;
    window.open(urlJitsi, '_blank');
};

document.getElementById("logoutBtn").onclick = () => { auth.signOut(); location.reload(); };
