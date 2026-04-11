// CONFIGURAÇÃO (Confira se é a sua mesmo!)
const firebaseConfig = {
    apiKey: "AIzaSyC3mL24ZO-m7158yYVp2l2o1OuSbnEvoxE",
    authDomain: "mini-discord-cc0c5.firebaseapp.com",
    projectId: "mini-discord-cc0c5",
    storageBucket: "mini-discord-cc0c5.firebasestorage.app",
    messagingSenderId: "392335666272",
    appId: "1:392335666272:web:7661e19e6b9e0078d7a705",
    measurementId: "G-5NX67429FX"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentChannel = "geral";
let unsubscribe = null;

// Espera o HTML carregar 100%
window.onload = () => {
    console.log("Sistema carregado. Pronto para os cliques!");

    const msgDiv = document.getElementById("messages");
    const input = document.getElementById("messageInput");

    // --- TROCAR TELAS ---
    document.getElementById("showRegister").onclick = () => {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("register-form").style.display = "block";
    };

    document.getElementById("showLogin").onclick = () => {
        document.getElementById("login-form").style.display = "block";
        document.getElementById("register-form").style.display = "none";
    };

    // --- LOGIN ---
    document.getElementById("loginBtn").onclick = async () => {
        const user = document.getElementById("loginUsername").value.trim();
        const pass = document.getElementById("loginPassword").value;
        
        if(!user || !pass) return alert("Preencha tudo!");

        try {
            console.log("Tentando entrar...");
            const cred = await auth.signInWithEmailAndPassword(user + "@minidiscord.com", pass);
            const doc = await db.collection("users").doc(cred.user.uid).get();
            currentUser = doc.data();
            
            document.getElementById("auth-screen").style.display = "none";
            document.getElementById("chat-screen").style.display = "flex";
            
            if (Notification.permission !== "granted") Notification.requestPermission();
            
            loadMessages();
            console.log("Login feito com sucesso!");
        } catch (e) {
            console.error(e);
            alert("Erro no login: Usuário ou senha inválidos.");
        }
    };

    // --- CADASTRO ---
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
                    avatar: e.target.result
                });
                location.reload();
            };
            reader.readAsDataURL(file);
        } catch (e) { alert(e.message); }
    };

    // --- ENVIAR TEXTO ---
    async function sendMessage() {
        const text = input.value.trim();
        if (!text || !currentUser) return;

        // Fingir envio (✓)
        const tempId = "t_" + Date.now();
        msgDiv.innerHTML += `
            <div class="message" id="${tempId}" style="opacity:0.6">
                <img src="${currentUser.avatar}" class="avatar">
                <div class="message-content">
                    <div class="username">${currentUser.username} <span class="status-tick">✓</span></div>
                    <div>${text}</div>
                </div>
            </div>`;
        msgDiv.scrollTop = msgDiv.scrollHeight;
        input.value = "";

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

    // --- IMAGENS E CLIP ---
    const imgInput = document.getElementById("imageInput");
    document.getElementById("clipBtn").onclick = () => imgInput.click();

    imgInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) handleImage(file);
    };

    window.addEventListener('paste', e => {
        const item = e.clipboardData.items[0];
        if (item && item.type.indexOf("image") !== -1) handleImage(item.getAsFile());
    });

    function handleImage(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await db.collection("messages").add({
                username: currentUser.username,
                avatar: currentUser.avatar,
                image: e.target.result,
                text: "",
                channel: currentChannel,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        };
        reader.readAsDataURL(file);
    }

    // --- CARREGAR ---
    function loadMessages() {
        if (unsubscribe) unsubscribe();
        unsubscribe = db.collection("messages")
            .where("channel", "==", currentChannel)
            .orderBy("timestamp", "desc")
            .limit(30)
            .onSnapshot(snap => {
                let list = [];
                snap.forEach(d => list.push(d.data()));
                list.reverse();

                msgDiv.innerHTML = list.map(m => {
                    const confirmed = m.timestamp != null;
                    const ticks = confirmed ? '<span class="status-tick confirmed">✓✓</span>' : '<span class="status-tick">✓</span>';
                    const content = m.image ? `<img src="${m.image}" style="max-width:250px;border-radius:8px;margin-top:5px">` : `<div>${m.text}</div>`;
                    
                    return `
                        <div class="message">
                            <img src="${m.avatar}" class="avatar">
                            <div class="message-content">
                                <div class="username">${m.username} ${ticks}</div>
                                ${content}
                            </div>
                        </div>`;
                }).join('');
                msgDiv.scrollTop = msgDiv.scrollHeight;
            });
    }

    // Canais
    document.querySelectorAll('.channel-link').forEach(link => {
        link.onclick = (e) => {
            document.querySelectorAll('.channel-link').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentChannel = e.currentTarget.dataset.channel;
            document.getElementById("channel-name").innerText = "# " + currentChannel;
            loadMessages();
        };
    });

    document.getElementById("startVoice").onclick = () => {
        window.open(`https://meet.jit.si/MiniDiscord_${currentChannel}`, '_blank');
    };

    document.getElementById("logoutBtn").onclick = () => { auth.signOut(); location.reload(); };
};
