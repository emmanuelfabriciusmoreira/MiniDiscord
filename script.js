// Configurações do Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos
const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");
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

// Alternar login/cadastro
showRegister.addEventListener("click", ()=>{loginForm.style.display="none";registerForm.style.display="block"; authMessage.textContent="";});
showLogin.addEventListener("click", ()=>{loginForm.style.display="block";registerForm.style.display="none"; authMessage.textContent="";});

// Cadastro
registerBtn.addEventListener("click", async () => {
  const email = registerUsername.value.trim() + "@minidiscord.com";
  const password = registerPassword.value;
  const avatarFile = registerAvatar.files[0];

  if(!registerUsername.value || !password || !avatarFile){authMessage.style.color="#faa"; authMessage.textContent="Preencha todos os campos!"; return;}

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email,password);
    currentUser = userCredential.user;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatarData = e.target.result;
      await db.collection("users").doc(currentUser.uid).set({
        username: registerUsername.value.trim(),
        avatar: avatarData
      });
      authMessage.style.color="#3ba55c";
      authMessage.textContent="Cadastro realizado! Faça login.";
    };
    reader.readAsDataURL(avatarFile);
  } catch(err){authMessage.style.color="#faa"; authMessage.textContent=err.message;}
});

// Login
loginBtn.addEventListener("click", async () => {
  const email = loginUsername.value.trim() + "@minidiscord.com";
  const password = loginPassword.value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email,password);
    currentUser = userCredential.user;
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    currentUser.username = userDoc.data().username;
    currentUser.avatar = userDoc.data().avatar;
    showChatScreen();
    loadMessages();
  } catch(err){authMessage.style.color="#faa"; authMessage.textContent=err.message;}
});

function showChatScreen(){authScreen.style.display="none"; chatScreen.style.display="flex";}

// Enviar mensagem
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress",(e)=>{if(e.key==="Enter") sendMessage();});

async function sendMessage(){
  const text = messageInput.value.trim(); if(!text) return;
  await db.collection("messages").add({
    username: currentUser.username,
    avatar: currentUser.avatar,
    text: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  messageInput.value="";
}

// Carregar mensagens em tempo real
function loadMessages(){
  messages.innerHTML="";
  db.collection("messages").orderBy("timestamp")
    .onSnapshot(snapshot=>{
      messages.innerHTML="";
      snapshot.forEach(doc=>appendMessage(doc.data()));
    });
}

function appendMessage(message){
  const messageElement=document.createElement("div");
  messageElement.classList.add("message");
  const avatar=document.createElement("img");
  avatar.classList.add("avatar","online");
  avatar.src=message.avatar;
  const content=document.createElement("div");
  content.classList.add("message-content");
  const nameEl=document.createElement("div");
  nameEl.classList.add("username");
  nameEl.textContent=message.username;
  const textEl=document.createElement("div");
  textEl.textContent=message.text;
  content.appendChild(nameEl);
  content.appendChild(textEl);
  messageElement.appendChild(avatar);
  messageElement.appendChild(content);
  messages.appendChild(messageElement);
  messages.scrollTop=messages.scrollHeight;
}

// Logout
logoutBtn.addEventListener("click", async ()=>{
  await auth.signOut();
  currentUser=null;
  messages.innerHTML="";
  authScreen.style.display="flex";
  chatScreen.style.display="none";
  loginUsername.value="";
  loginPassword.value="";
  authMessage.textContent="";
});