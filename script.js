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

// Elementos
const authScreen = document.getElementById("auth-screen"), chatScreen = document.getElementById("chat-screen");
const messages = document.getElementById("messages"), messageInput = document.getElementById("messageInput");
const channelName = document.getElementById("channel-name");

let currentUser = null, currentChannel = "geral", unsubscribe = null;

// Telas Login/Cadastro
document.getElementById("showRegister").onclick = () => { document.getElementById("login-form").style.display = "none"; document.getElementById("register-form").style.display = "block"; };
document.getElementById("showLogin").onclick = () => { document.getElementById("login-form").style.display = "block"; document.getElementById("register-form").style.display = "none"; };

// Login
document.getElementById("loginBtn").onclick = async () => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(document.getElementById("loginUsername").value.trim() + "@minidiscord.com", document.getElementById("loginPassword").value);
    const userDoc = await db.collection("users").doc(userCredential.user.uid).get();
    currentUser = { ...userDoc.data(), uid: userCredential.user.uid };
    authScreen.style.display = "none"; chatScreen.style.display = "flex";
    loadMessages();
  } catch(err) { alert("Erro: " + err.message); }
};

// Cadastro
document.getElementById("registerBtn").onclick = async () => {
  const username = document.getElementById("registerUsername").value.trim();
  const pass = document.getElementById("registerPassword").value;
  const avatarFile = document.getElementById("registerAvatar").files[0];
  if(!username || !pass || !avatarFile) return alert("Preencha tudo!");
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(username + "@minidiscord.com", pass);
    const reader = new FileReader();
    reader.onload = async (e) => {
      await db.collection("users").doc(userCredential.user.uid).set({ username, avatar: e.target.result });
      alert("Sucesso! Faça o login.");
      location.reload();
    };
    reader.readAsDataURL(avatarFile);
  } catch(err) { alert(err.message); }
};

// Troca de canais
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

// Mensagens
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
  
  console.log("Conectando ao canal: " + currentChannel);

  // Consulta simples (não pede índice!)
  unsubscribe = db.collection("messages")
    .where("channel", "==", currentChannel)
    .onSnapshot(snapshot => {
      let msgList = [];
      snapshot.forEach(doc => msgList.push(doc.data()));

      // Ordenação Manual
      msgList.sort((a, b) => {
        const tA = a.timestamp ? a.timestamp.toMillis() : Date.now();
        const tB = b.timestamp ? b.timestamp.toMillis() : Date.now();
        return tA - tB;
      });

      messages.innerHTML = "";
      msgList.forEach(m => {
          messages.innerHTML += `
            <div class="message">
                <img class="avatar" src="${m.avatar}">
                <div class="message-content">
                    <div class="username">${m.username}</div>
                    <div>${m.text}</div>
                </div>
            </div>`;
      });
      messages.scrollTop = messages.scrollHeight;
    });
}

document.getElementById("logoutBtn").onclick = () => { auth.signOut(); location.reload(); };
