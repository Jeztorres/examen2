// Configuración de Model Viewer
const modelViewer = document.querySelector('#model-viewer');
const buttons = document.querySelectorAll('.control-btn');
const statusText = document.getElementById('status');
const loadingPoster = document.getElementById('lazy-load-poster');

// Referencias a los modelos
const models = {
    'T.fbx': 'T (Pose)',
    'MOVIMIENTO1.fbx': 'Movimiento 1',
    'MOVIMIENTO2.fbx': 'Movimiento 2',
    'MOVIMIENTO3.fbx': 'Movimiento 3'
};

// Inicializar
init();

function init() {
    // Event listeners para los botones de animación
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const modelPath = button.getAttribute('data-model');
            changeModel(modelPath);
            
            // Actualizar botón activo
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    // Eventos del model-viewer
    modelViewer.addEventListener('load', onModelLoaded);
    modelViewer.addEventListener('error', onModelError);
    modelViewer.addEventListener('progress', onLoadProgress);
    
    // Cuando se entra en AR
    modelViewer.addEventListener('ar-status', (event) => {
        if (event.detail.status === 'session-started') {
            updateStatus('Modo AR activado - Coloca el modelo donde quieras');
        } else if (event.detail.status === 'not-presenting') {
            updateStatus('Modo AR desactivado');
        }
    });
    
    updateStatus('Modelo cargado. Interactúa con él o entra en AR');
}

// Cambiar modelo
function changeModel(modelPath) {
    updateStatus(`Cargando ${models[modelPath]}...`);
    loadingPoster.style.display = 'flex';
    modelViewer.src = `./${modelPath}`;
}

// Cuando el modelo se carga
function onModelLoaded() {
    loadingPoster.style.display = 'none';
    const currentModel = modelViewer.src.split('/').pop();
    updateStatus(`${models[currentModel]} cargado. Listo para AR`);
    
    // Activar animaciones si existen
    if (modelViewer.availableAnimations && modelViewer.availableAnimations.length > 0) {
        modelViewer.play();
    }
}

// Error al cargar modelo
function onModelError(event) {
    console.error('Error al cargar modelo:', event);
    loadingPoster.style.display = 'none';
    updateStatus('❌ Error al cargar el modelo. Verifica que los archivos FBX existan.');
}

// Progreso de carga
function onLoadProgress(event) {
    const progress = Math.round(event.detail.totalProgress * 100);
    if (progress < 100) {
        updateStatus(`Cargando modelo: ${progress}%`);
    }
}

// Actualizar status
function updateStatus(message) {
    if (statusText) {
        statusText.textContent = message;
    }
}

// Información adicional
console.log('Model Viewer AR - Controles:');
console.log('- Arrastra para rotar');
console.log('- Pellizca para zoom');
console.log('- Botón AR para ver en tu espacio');
console.log('- En AR: mueve el dispositivo, toca para colocar, pellizca para escalar');
