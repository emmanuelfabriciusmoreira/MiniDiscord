// ... (mantenha seu firebaseConfig e as variáveis de topo iguais)

// --- ELEMENTOS ADICIONAIS ---
const imageInput = document.getElementById("imageInput");
const clipBtn = document.getElementById("clipBtn");

// Abrir seletor de arquivo ao clicar no clipe
clipBtn.onclick = () => imageInput.click();

// Quando selecionar uma imagem pelo botão
imageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) processarEEnviarImagem(file);
};

// Capturar CTRL+V (Print Screen)
window.addEventListener('paste', e => {
    const item = e.clipboardData.items[0];
    if (item && item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        processarEEnviarImagem(file);
    }
});

// Função principal para enviar imagem
function processarEEnviarImagem(file) {
    if (!currentUser) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target.result;
        
        // Envio otimista (mostra na tela antes de ir pro banco)
        const tempId = "img_" + Date.now();
        msgDiv.innerHTML += `
            <div class="message sending" id="${tempId}">
                <img src="${currentUser.avatar}" class="avatar">
                <div class="message-content">
                    <div class="username">${currentUser.username} <span class="status-tick">✓</span></div>
                    <img src="${base64}" style="max-width:250px; border-radius:8px; display:block; margin-top:5px;">
                </div>
            </div>`;
        msgDiv.scrollTop = msgDiv.scrollHeight;

        // Envia pro Firebase
        db.collection("messages").add({
            username: currentUser.username,
            avatar: currentUser.avatar,
            image: base64, // A imagem vai aqui
            text: "", 
            channel: currentChannel,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    };
    reader.readAsDataURL(file);
    imageInput.value = ""; // Limpa o input
}

// --- ATUALIZAÇÃO DA FUNÇÃO LOADMESSAGES ---
function loadMessages() {
    if(unsubscribe) unsubscribe();
    
    unsubscribe = db.collection("messages")
        .where("channel", "==", currentChannel)
        .orderBy("timestamp", "desc")
        .limit(30) 
        .onSnapshot(snap => {
            let list = [];
            snap.forEach(d => list.push(d.data()));
            list.reverse();

            const html = list.map(m => {
                const confirmed = m.timestamp != null;
                const ticks = confirmed ? '<span class="status-tick confirmed">✓✓</span>' : '<span class="status-tick">✓</span>';
                
                // Se tiver imagem, mostra a imagem. Se não, mostra o texto.
                const conteudoMsg = m.image 
                    ? `<img src="${m.image}" style="max-width:250px; border-radius:8px; display:block; margin-top:5px;">` 
                    : `<div>${m.text}</div>`;

                return `
                <div class="message">
                    <img src="${m.avatar}" class="avatar">
                    <div class="message-content">
                        <div class="username">${m.username} ${ticks}</div>
                        ${conteudoMsg}
                    </div>
                </div>`;
            }).join('');
            
            if (msgDiv.innerHTML !== html) {
                msgDiv.innerHTML = html;
                msgDiv.scrollTop = msgDiv.scrollHeight;
            }

            // Notificações
            snap.docChanges().forEach(change => {
                if (change.type === "added" && !snap.metadata.hasPendingWrites) {
                    const m = change.doc.data();
                    if (m.username !== currentUser.username) sendNotification(m);
                }
            });
        });
}

// Mantenha suas funções de sendMessage() de texto e Login como estavam!
