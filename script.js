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

let currentUser = null;
let currentChannel = "geral";
let unsubscribe = null;

window.onload = () => {
    const msgDiv = document.getElementById("messages");
    const input = document.getElementById("messageInput");

    // --- NAVEGAÇÃO ENTRE TELAS ---
    document.getElementById("showRegister").onclick = () => {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("register-form").style.display = "block";
    };

    document.getElementById("showLogin").onclick = () => {
        document.getElementById("login-form").style.display = "block";
        document.getElementById("register-form").style.display = "none";
    };

    // --- SISTEMA DE LOGIN ---
    document.getElementById("loginBtn").onclick = async () => {
        const user = document.getElementById("loginUsername").value.trim();
        const pass = document.getElementById("loginPassword").value;
        if(!user || !pass) return alert("Preencha os campos!");

        try {
            const cred = await auth.signInWithEmailAndPassword(user + "@minidiscord.com", pass);
            const doc = await db.collection("users").doc(cred.user.uid).get();
            currentUser = doc.data();
            
            document.getElementById("auth-screen").style.display = "none";
            document.getElementById("chat-screen").style.display = "flex";
            
            if (Notification.permission !== "granted") Notification.requestPermission();
            
            loadMessages();
        } catch (e) {
            alert("Erro: Usuário ou senha incorretos.");
        }
    };

    // --- SISTEMA DE CADASTRO ---
    document.getElementById("registerBtn").onclick = async () => {
        const user = document.getElementById("registerUsername").value.trim();
        const pass = document.getElementById("registerPassword").value;
        const file = document.getElementById("registerAvatar").files[0];

        if (!user || !pass || !file) return alert("Preencha tudo e escolha uma foto!");

        try {
            const cred = await auth.createUserWithEmailAndPassword(user + "@minidiscord.com", pass);
            const reader = new FileReader();
            reader.onload = async (e) => {
                await db.collection("users").doc(cred.user.uid).set({
                    username: user,
                    avatar: e.target.result // Avatar do perfil ainda ok!
                });
                location.reload();
            };
            reader.readAsDataURL(file);
        } catch (e) { alert("Erro ao cadastrar: " + e.message); }
    };

    // --- ENVIAR MENSAGEM (INSTANTÂNEO) ---
    async function sendMessage() {
        const text = input.value.trim();
        if (!text || !currentUser) return;

        // "Fingir" envio para velocidade (1 V)
        const tempId = "t_" + Date.now();
        msgDiv.innerHTML += `
            <div class="message" id="${tempId}" style="opacity:0.7">
                <img src="${currentUser.avatar}" class="avatar">
                <div class="message-content">
                    <div class="username">${currentUser.username} <span class="status-tick">✓</span></div>
                    <div>${text}</div>
                </div>
            </div>`;
        msgDiv.scrollTop = msgDiv.scrollHeight;
        input.value = "";

        // Enviar real pro banco
        await db.collection("messages").add({
            username: currentUser.username,
            avatar: currentUser.avatar,
            text: text,
            channel: currentChannel,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    document.getElementById("sendBtn").onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === "Enter") sendMessage(); };

    // --- CARREGAR MENSAGENS (✓✓) ---
    function loadMessages() {
        if (unsubscribe) unsubscribe();
        
        unsubscribe = db.collection("messages")
            .where("channel", "==", currentChannel)
            .orderBy("timestamp", "desc")
            .limit(40) // Mostra as últimas 40
            .onSnapshot(snap => {
                let list = [];
                snap.forEach(d => list.push(d.data()));
                list.reverse();

                msgDiv.innerHTML = list.map(m => {
                    const confirmed = m.timestamp != null;
                    const ticks = confirmed ? '<span class="status-tick confirmed">✓✓</span>' : '<span class="status-tick">✓</span>';
                    
                    return `
                        <div class="message">
                            <img src="${m.avatar}" class="avatar">
                            <div class="message-content">
                                <div class="username">${m.username} ${ticks}</div>
                                <div>${m.text}</div>
                            </div>
                        </div>`;
                }).join('');
                
                msgDiv.scrollTop = msgDiv.scrollHeight;

                // Notificação se estiver em outra aba
                snap.docChanges().forEach(change => {
                    if (change.type === "added" && !snap.metadata.hasPendingWrites) {
                        const m = change.doc.data();
                        if (m.username !== currentUser.username) {
                            if (document.hidden && Notification.permission === "granted") {
                                new Notification(`#${currentChannel}`, { body: `${m.username}: ${m.text}`, icon: m.avatar });
                            }
                        }
                    }
                });
            });
    }

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

    // --- CALL E LOGOUT ---
    document.getElementById("startVoice").onclick = () => {
        window.open(`https://meet.jit.si/MiniDiscord_${currentChannel}`, '_blank');
    };

    document.getElementById("logoutBtn").onclick = () => { 
        auth.signOut(); 
        location.reload(); 
    };
};
