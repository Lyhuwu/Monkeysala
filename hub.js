import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD5L51DKMU8ozgN8wTt9WATlgzjI7lQ2Ls",
    authDomain: "monkeycine.firebaseapp.com",
    projectId: "monkeycine",
    storageBucket: "monkeycine.firebasestorage.app",
    messagingSenderId: "134472914894",
    appId: "1:134472914894:web:df59027eb99b5c05207d9f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Referencias en Firebase
const linkRef = ref(db, 'sala_estado/link_actual');
const peticionRef = ref(db, 'sala_estado/solicitud');
const abachosRef = ref(db, 'estadisticas/total_abachos');
const pelisRef = ref(db, 'estadisticas/total_peliculas');
const momentosRef = ref(db, 'momentos_guardados');

// Variables de UI
let miIdentidad = localStorage.getItem('monkey_identidad'); 

window.addEventListener('DOMContentLoaded', () => {
    if (!miIdentidad) {
        document.getElementById('pantalla-identidad').style.display = 'flex';
    } else {
        iniciarApp();
    }

    document.getElementById('btn-soy-liz').addEventListener('click', () => {
        localStorage.setItem('monkey_identidad', 'liz');
        miIdentidad = 'liz';
        iniciarApp();
    });

    document.getElementById('btn-soy-sofi').addEventListener('click', () => {
        localStorage.setItem('monkey_identidad', 'sofi');
        miIdentidad = 'sofi';
        iniciarApp();
    });
});

function iniciarApp() {
    document.getElementById('pantalla-identidad').style.display = 'none';
    document.getElementById('app-principal').style.display = 'block';

    if (miIdentidad === 'liz') {
        document.getElementById('txt-bienvenida').textContent = "👩🏻‍💻 Arquitecta de la Matrix";
        document.getElementById('panel-liz').style.display = 'block';
        configurarPanelLiz();
    } else {
        document.getElementById('txt-bienvenida').textContent = "✨ Bienvenida, dueña del cine";
        document.getElementById('panel-sofi').style.display = 'block';
        configurarPanelSofi();
    }

    cargarEstadisticas();
}

function configurarPanelLiz() {
    const btnEnviar = document.getElementById('btn-enviar-link');
    const inputLink = document.getElementById('input-link');
    const statusBox = document.getElementById('liz-status');

    btnEnviar.addEventListener('click', () => {
        const link = inputLink.value.trim();
        if (link !== "") {
            set(linkRef, link);
            statusBox.textContent = "✅ ¡Link enviado! Esperando a Sofi...";
            inputLink.value = "";
            set(peticionRef, null);
        }
    });

    // Escuchar si Sofi pide link
    onValue(peticionRef, (snapshot) => {
        if (snapshot.val()) {
            statusBox.textContent = "🔔 ¡Sofi está pidiendo link para ver peli!";
            statusBox.style.color = "#ff79c6";
            if(navigator.vibrate) navigator.vibrate([300, 100, 300]);
        }
    });

    // Si Sofi entró, el link se borra de firebase y avisamos a Liz
    onValue(linkRef, (snapshot) => {
        if (!snapshot.val() && statusBox.textContent.includes("Esperando")) {
            statusBox.textContent = "🚀 Sofi ha entrado a la sala.";
            statusBox.style.color = "#50fa7b";
        }
    });
}

function configurarPanelSofi() {
    const btnPedir = document.getElementById('btn-pedir-link');
    const btnEntrar = document.getElementById('btn-entrar-sala');
    const statusBox = document.getElementById('sofi-status-espera');
    let linkActivo = "";

    btnPedir.addEventListener('click', () => {
        set(peticionRef, Date.now());
        btnPedir.textContent = "✅ Solicitud enviada";
        setTimeout(() => btnPedir.textContent = "🛎️ Solicitar Link", 3000);
    });

    // Escuchar si Liz pone un link
    onValue(linkRef, (snapshot) => {
        linkActivo = snapshot.val();
        if (linkActivo) {
            statusBox.style.display = 'none';
            btnEntrar.style.display = 'block';
            if(navigator.vibrate) navigator.vibrate([500]); // Vibra cuando llega el link
        } else {
            statusBox.style.display = 'block';
            btnEntrar.style.display = 'none';
        }
    });

    btnEntrar.addEventListener('click', () => {
        if (linkActivo) {
            window.open(linkActivo, '_blank');
            set(linkRef, null);
        }
    });
}

function cargarEstadisticas() {
    onValue(abachosRef, (s) => document.getElementById('hub-abachos-counter').textContent = s.val() || 0);
    onValue(pelisRef, (s) => document.getElementById('hub-pelis-counter').textContent = s.val() || 0);

    onValue(momentosRef, (snapshot) => {
        const grid = document.getElementById('hub-momentos-grid');
        grid.innerHTML = ''; 
        const datos = snapshot.val();
        
        if (datos) {
            const momentosArray = Object.values(datos).reverse();
            momentosArray.forEach(momento => {
                const fecha = new Date(momento.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
                const card = document.createElement('div');
                card.className = 'momento-card';
                
                let htmlNota = momento.mensaje ? `<div class="momento-nota">" ${momento.mensaje} "</div>` : '';
                
                card.innerHTML = `
                    <div class="momento-peli">🎬 ${momento.pelicula}</div>
                    <div class="momento-detalles"><span>⏱️ ${momento.tiempo}</span><span>📅 ${fecha}</span></div>
                    ${htmlNota}
                    <div style="text-align: right; margin-top: 5px; font-size: 10px; color: #6272a4;">Guardado por ${momento.usuario}</div>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p style="color:#8b949e; text-align:center;">Aún no hay momentos guardados.</p>';
        }
    });
}

// ==========================================
// REGISTRO DEL SERVICE WORKER (Para instalar como App)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registro => {
                console.log('⚙️ Service Worker registrado con éxito. ¡App instalable!');
            })
            .catch(error => {
                console.error('❌ Error al registrar el Service Worker:', error);
            });
    });
}
