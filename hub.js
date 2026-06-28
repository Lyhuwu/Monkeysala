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

// Referencias Firebase
const salaEstadoRef = ref(db, 'sala_en_vivo'); 
const zumbidoRef = ref(db, 'notificaciones/zumbido');
const abachosRef = ref(db, 'estadisticas/total_abachos');
const pelisRef = ref(db, 'estadisticas/total_peliculas');
const momentosRef = ref(db, 'momentos_guardados');

let miIdentidad = localStorage.getItem('monkey_identidad'); 

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
    configurarRouterSPA(); // Activa el cambio de pestañas

    if (!miIdentidad) {
        document.getElementById('modal-identidad').style.display = 'flex';
    } else {
        arrancarApp();
    }

    document.getElementById('btn-soy-liz').addEventListener('click', () => {
        localStorage.setItem('monkey_identidad', 'liz');
        miIdentidad = 'liz';
        arrancarApp();
    });

    document.getElementById('btn-soy-sofi').addEventListener('click', () => {
        localStorage.setItem('monkey_identidad', 'sofi');
        miIdentidad = 'sofi';
        arrancarApp();
    });
});

// Sistema de Pestañas (Sin recargar página)
function configurarRouterSPA() {
    const botonesNav = document.querySelectorAll('.nav-item');
    const vistas = document.querySelectorAll('.vista');

    botonesNav.forEach(boton => {
        boton.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            
            botonesNav.forEach(b => b.classList.remove('activo'));
            e.currentTarget.classList.add('activo');

            vistas.forEach(vista => {
                if (vista.id === targetId) {
                    vista.classList.remove('oculta');
                    vista.classList.add('activa');
                } else {
                    vista.classList.remove('activa');
                    vista.classList.add('oculta');
                }
            });
            if(navigator.vibrate) navigator.vibrate(40);
        });
    });
}

function arrancarApp() {
    document.getElementById('modal-identidad').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';

    if (miIdentidad === 'liz') {
        document.getElementById('txt-identidad').textContent = "👩🏻‍💻 Liz";
        document.getElementById('panel-liz').style.display = 'block';
        logicaLider();
    } else {
        document.getElementById('txt-identidad').textContent = "✨ Sofi";
        document.getElementById('panel-sofi').style.display = 'block';
        logicaInvitada();
    }

    cargarRecuerdos();
}

// 🎬 LÓGICA DE SALA: LIZ (Transmisora)
function logicaLider() {
    const btnAbrir = document.getElementById('btn-abrir-sala');
    const inputLink = document.getElementById('input-link');
    const statusBox = document.getElementById('liz-status');

    btnAbrir.addEventListener('click', () => {
        const link = inputLink.value.trim();
        if (link) {
            // Guarda estado en vivo en Firebase
            set(salaEstadoRef, { activa: true, link: link, timestamp: Date.now() });
            statusBox.textContent = "🟢 Transmitiendo. Esperando a Sofi...";
            statusBox.style.color = "#50fa7b";
            inputLink.value = "";
        }
    });

    // Escuchar zumbidos de Sofi
    onValue(zumbidoRef, (snapshot) => {
        if (snapshot.val()) {
            statusBox.textContent = "🔔 ¡Sofi quiere ver peli! Abre la sala.";
            statusBox.style.color = "#ff79c6";
            if(navigator.vibrate) navigator.vibrate([300, 100, 300]);
        }
    });

    // Si la sala se desactiva (Sofi entró y consumió el link)
    onValue(salaEstadoRef, (snapshot) => {
        const estado = snapshot.val();
        if (!estado || !estado.activa) {
            if (statusBox.textContent.includes("Transmitiendo")) {
                statusBox.textContent = "🚀 ¡Sofi ha entrado al cine!";
                statusBox.style.color = "#8be9fd";
            }
        }
    });
}

// 🍿 LÓGICA DE SALA: SOFI (Receptora)
function logicaInvitada() {
    const btnZumbido = document.getElementById('btn-zumbido');
    const btnEntrar = document.getElementById('btn-entrar-peli');
    const divCerrado = document.getElementById('sofi-estado-cerrado');
    const divAbierto = document.getElementById('sofi-estado-abierto');
    let linkActual = "";

    // Mandar alerta a Liz
    btnZumbido.addEventListener('click', () => {
        set(zumbidoRef, Date.now());
        btnZumbido.textContent = "✅ Avisado";
        setTimeout(() => btnZumbido.textContent = "🔔 Mandar Zumbido a Liz", 3000);
    });

    // Escuchar si Liz abre la sala
    onValue(salaEstadoRef, (snapshot) => {
        const estado = snapshot.val();
        if (estado && estado.activa && estado.link) {
            linkActual = estado.link;
            divCerrado.style.display = 'none';
            divAbierto.style.display = 'block';
            if(navigator.vibrate) navigator.vibrate([500]); 
        } else {
            divCerrado.style.display = 'block';
            divAbierto.style.display = 'none';
        }
    });

    // Entrar y consumir el link
    btnEntrar.addEventListener('click', () => {
        if (linkActual) {
            window.open(linkActual, '_blank');
            // Al entrar, apagamos la sala para que no se quede encendida por siempre
            set(salaEstadoRef, { activa: false, link: null });
            set(zumbidoRef, null); 
        }
    });
}

// ✨ CARGAR ESTADÍSTICAS Y MOMENTOS
function cargarRecuerdos() {
    onValue(abachosRef, (s) => document.getElementById('hub-abachos').textContent = s.val() || 0);
    onValue(pelisRef, (s) => document.getElementById('hub-pelis').textContent = s.val() || 0);

    onValue(momentosRef, (snapshot) => {
        const grid = document.getElementById('hub-momentos-grid');
        grid.innerHTML = ''; 
        const datos = snapshot.val();
        
        if (datos) {
            const array = Object.values(datos).reverse();
            array.forEach(m => {
                const fecha = new Date(m.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                const card = document.createElement('div');
                card.className = 'momento-card';
                
                let htmlNota = m.mensaje ? `<div class="momento-nota">"${m.mensaje}"</div>` : '';
                
                card.innerHTML = `
                    <div style="font-weight:900; font-size:15px; color:#f8f8f2;">🎬 ${m.pelicula}</div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; color:#8b949e; margin-top:4px;">
                        <span>⏱️ ${m.tiempo}</span> <span>📅 ${fecha}</span>
                    </div>
                    ${htmlNota}
                    <div style="text-align:right; font-size:10px; color:#6272a4; margin-top:6px;">Por ${m.usuario}</div>
                `;
                grid.appendChild(card);
            });
        }
    });
}

// Registro Service Worker (Para PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
    });
}
