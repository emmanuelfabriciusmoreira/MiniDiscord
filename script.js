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
const auth = firebase.auth(), db = firebase.firestore();

let currentUser = null, currentChannel = "geral", unsubscribe = null;
const msgDiv = document.getElementById("messages"), input = document.getElementById("messageInput");

// --- NOTIFICAÇÕES ---
function sendNotification(m) {
    if (document.hidden && Notification.permission === "granted") {
        new Notification(`#${currentChannel}`, {
            body: `${m.username}: ${m.text}`,
            icon: m.avatar
        });
    }
}

// --- LOGIN / CADASTRO ---
const authScreen = document.getElementById("auth-screen"), chatScreen = document.getElementById("chat-screen");
document.getElementById("showRegister").onclick = () => { document.getElementById("login-form").style.display="none"; document.getElementById("register-form").style.display="block"; };
document.getElementById("showLogin").onclick = () => { document.getElementById("login-form").style.display="block"; document.getElementById("register-form").style.display="none"; };

document.getElementById("loginBtn").onclick = async () => {
    try {
        const cred = await auth.signInWithEmailAndPassword(document.getElementById("loginUsername").value.trim() + "@minidiscord.com", document.getElementById("loginPassword").value);
        const doc = await db.collection("users").doc(cred.user.uid).get();
        currentUser = doc.data();
        authScreen.style.display = "none"; chatScreen.style.display = "flex";
        if (Notification.permission !== "granted") Notification.requestPermission();
        loadMessages();
    } catch(e) { alert("Erro ao entrar."); }
};

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

// --- CANAIS ---
document.querySelectorAll('.channel-link').forEach(link => {
    link.onclick = (e) => {
        document.querySelectorAll('.channel-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentChannel = e.currentTarget.dataset.channel;
        document.getElementById("channel-name").innerText = "# " + currentChannel;
        loadMessages();
    };
});

// --- MENSAGENS (TURBO) ---
async function sendMessage() {
    const text = input.value.trim();
    if(!text || !currentUser) return;
    await db.collection("messages").add({
        username: currentUser.username, avatar: currentUser.avatar,
        text: text, channel: currentChannel, 
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
}

document.getElementById("sendBtn").onclick = sendMessage;
input.onkeypress = (e) => { if(e.key === "Enter") sendMessage(); };

function loadMessages() {
    if(unsubscribe) unsubscribe();
    
    unsubscribe = db.collection("messages")
        .where("channel", "==", currentChannel)
        .onSnapshot(snap => {
            let list = [];
            snap.forEach(d => list.push(d.data()));
            
            // Ordenação ultra-rápida
            list.sort((a,b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            
            // Renderiza tudo de uma vez (evita lag de repintura)
            const html = list.map(m => `
                <div class="message">
                    <img src="${m.avatar}" class="avatar">
                    <div class="message-content">
                        <div class="username">${m.username}</div>
                        <div>${m.text}</div>
                    </div>
                </div>`).join('');
            
            if (msgDiv.innerHTML !== html) {
                msgDiv.innerHTML = html;
                msgDiv.scrollTop = msgDiv.scrollHeight;
            }

            // Notificações sem travar o chat
            snap.docChanges().forEach(change => {
                if (change.type === "added" && !snap.metadata.hasPendingWrites) {
                    const m = change.doc.data();
                    const msgTime = m.timestamp?.toMillis() || 0;
                    if (m.username !== currentUser.username && (Date.now() - msgTime < 8000)) {
                        sendNotification(m);
                    }
                }
            });
        });
}

// --- CALL ---
document.getElementById("startVoice").onclick = () => {
    const url = `https://meet.jit.si/Call_MiniDiscord_${currentChannel}#config.prejoinPageEnabled=false`;
    window.open(url, '_blank');
};

document.getElementById("logoutBtn").onclick = () => { auth.signOut(); location.reload(); };
