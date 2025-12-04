// Configuración de Model Viewer
const modelViewer = document.querySelector('#model-viewer');
const buttons = document.querySelectorAll('.control-btn');
const statusText = document.getElementById('status');
const loadingPoster = document.getElementById('lazy-load-poster');

// Referencias a los modelos (cada uno tiene su propia skin y animación)
const models = {
    'models/Movimiento1.glb': 'Movimiento 1',
    'models/movimiento2.glb': 'Movimiento 2',
    'models/movimiento3.glb': 'Movimiento 3'
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
    
    // Detener cualquier animación previa antes de cambiar
    modelViewer.pause();
    modelViewer.currentTime = 0;
    
    // Cambiar el modelo
    modelViewer.src = `./${modelPath}`;
}

// Cuando el modelo se carga
function onModelLoaded() {
    loadingPoster.style.display = 'none';
    const currentModel = modelViewer.src.split('/').pop();
    updateStatus(`${models[currentModel]} cargado. Listo para AR`);
    
    // Reiniciar y reproducir - cada GLB tiene su propia skin y animación completa
    modelViewer.currentTime = 0;
    
    if (modelViewer.availableAnimations && modelViewer.availableAnimations.length > 0) {
        console.log('Modelo:', currentModel, 'con animación:', modelViewer.availableAnimations[0]);
        modelViewer.animationName = modelViewer.availableAnimations[0];
        modelViewer.play();
    } else {
        console.log('Modelo:', currentModel, '(sin animación - pose estática)');
    }
}

// Error al cargar modelo
function onModelError(event) {
    console.error('Error al cargar modelo:', event);
    loadingPoster.style.display = 'none';
    updateStatus('❌ Error: Los archivos deben ser .GLB. Convierte tus FBX a GLB primero.');
    
    // Mostrar mensaje de ayuda
    alert('⚠️ Model Viewer requiere archivos GLB, no FBX.\n\n' +
          '📝 Para convertir:\n' +
          '1. Abre Blender (gratis)\n' +
          '2. Importa tu FBX (File > Import > FBX)\n' +
          '3. Exporta como GLB (File > Export > glTF 2.0)\n' +
          '4. Reemplaza los archivos en la carpeta\n\n' +
          'O usa un conversor online en:\n' +
          'https://products.aspose.app/3d/conversion/fbx-to-glb');
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
