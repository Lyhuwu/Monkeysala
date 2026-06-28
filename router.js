document.addEventListener('DOMContentLoaded', () => {
    const botonesNav = document.querySelectorAll('.nav-item');
    const vistas = document.querySelectorAll('section');

    botonesNav.forEach(boton => {
        boton.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');

            // 1. Actualizar botones
            botonesNav.forEach(b => b.classList.remove('activo'));
            e.currentTarget.classList.add('activo');

            // 2. Transición suave de vistas
            vistas.forEach(vista => {
                if (vista.id === targetId) {
                    vista.classList.remove('vista-oculta');
                    vista.classList.add('vista-activa');
                } else {
                    vista.classList.remove('vista-activa');
                    vista.classList.add('vista-oculta');
                }
            });
            
            // Retroalimentación háptica sutil
            if (navigator.vibrate) navigator.vibrate(50);
        });
    });
});
