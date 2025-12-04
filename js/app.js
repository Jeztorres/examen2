import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let scene, camera, renderer;
let mainModel, mixer, currentAnimation;
let animations = {};
let clock;
let video, videoTexture;
let isARMode = false;
let modelPlaced = false;

// Referencias a los modelos
const baseModelPath = './MOVIMIENTO2.fbx'; // Modelo base con skin (Pose T)
const animationPaths = {
    poseT: './T.fbx',
    animation1: './MOVIMIENTO1.fbx',
    animation3: './MOVIMIENTO3.fbx'
};

let currentAnimationPath = null;
let loadedAnimations = {};

// Inicializar la aplicación
init();

function init() {
    const container = document.getElementById('viewer-container');
    
    // Crear escena
    scene = new THREE.Scene();
    
    // Crear cámara para AR
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 0);
    
    // Crear renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Clock para animaciones
    clock = new THREE.Clock();
    
    // Iniciar con cámara AR
    startARCamera();
    
    // Configurar botones
    setupARControls();
    
    // Manejar resize
    window.addEventListener('resize', onWindowResize);
    
    // Iniciar render loop
    animate();
}

// Iniciar cámara AR
async function startARCamera() {
    updateStatus('Iniciando cámara AR...');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
            videoTexture = new THREE.VideoTexture(video);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            
            // Crear plano de fondo con la cámara
            const aspectRatio = video.videoWidth / video.videoHeight;
            const planeGeometry = new THREE.PlaneGeometry(aspectRatio * 2, 2);
            const planeMaterial = new THREE.MeshBasicMaterial({ 
                map: videoTexture,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.z = -1;
            scene.add(plane);
            
            updateStatus('Cámara AR lista. Toca para colocar modelo.');
            
            // Cargar modelo
            loadBaseModel();
            
            // Mostrar controles
            document.getElementById('ar-controls').classList.remove('hidden');
            document.querySelector('header').style.display = 'none';
        };
        
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        updateStatus('Error: No se pudo acceder a la cámara');
        alert('Por favor, permite el acceso a la cámara para usar AR.');
    }
    
    // Configurar interacción táctil
    renderer.domElement.addEventListener('click', onScreenClick);
    renderer.domElement.addEventListener('touchend', onScreenClick);
}
// Colocar modelo al hacer click/touch
function onScreenClick(event) {
    if (!mainModel) return;
    
    if (!modelPlaced) {
        // Primera vez: colocar modelo
        mainModel.position.set(0, 0, -2);
        mainModel.visible = true;
        modelPlaced = true;
        updateStatus('Modelo colocado. Usa los botones para cambiar animaciones.');
    }
}

// Cargar modelo base con skin (MOVIMIENTO2)
function loadBaseModel() {
    updateStatus('Cargando modelo...');
    const loader = new FBXLoader();
    
    loader.load(
        baseModelPath,
        (fbx) => {
            mainModel = fbx;
            mainModel.scale.set(0.005, 0.005, 0.005);
            mainModel.position.set(0, -0.5, -2);
            mainModel.visible = false;
            
            mainModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(mainModel);
            
            // Crear mixer para el modelo base
            mixer = new THREE.AnimationMixer(mainModel);
            
            // Cargar animación por defecto si existe en el modelo base
            if (fbx.animations && fbx.animations.length > 0) {
                fbx.animations.forEach((clip) => {
                    const action = mixer.clipAction(clip);
                    loadedAnimations['base'] = action;
                    action.play();
                });
            }
            
            updateStatus('Modelo cargado. Toca la pantalla para colocarlo.');
            
            // Pre-cargar todas las animaciones
            preloadAnimations();
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            updateStatus(`Cargando modelo: ${percent}%`);
        },
        (error) => {
            console.error('Error al cargar modelo base:', error);
            updateStatus('Error al cargar modelo');
        }
    );
}

// Pre-cargar todas las animaciones
function preloadAnimations() {
    const loader = new FBXLoader();
    
    Object.keys(animationPaths).forEach(key => {
        loader.load(
            animationPaths[key],
            (fbx) => {
                if (fbx.animations && fbx.animations.length > 0) {
                    fbx.animations.forEach((clip) => {
                        loadedAnimations[key] = clip;
                    });
                }
            },
            undefined,
            (error) => console.error(`Error cargando animación ${key}:`, error)
        );
    });
}

// Cambiar animación en el modelo base
function changeAnimation(animKey) {
    if (!mainModel || !mixer) return;
    
    // Detener animaciones actuales
    mixer.stopAllAction();
    
    if (animKey === 'base') {
        // Usar animación del modelo base
        if (loadedAnimations['base']) {
            loadedAnimations['base'].play();
        }
        updateStatus('Pose T (Modelo base)');
    } else if (loadedAnimations[animKey]) {
        // Aplicar animación cargada
        const action = mixer.clipAction(loadedAnimations[animKey]);
        action.play();
        currentAnimationPath = animKey;
        updateStatus(`Reproduciendo ${animKey}`);
    } else {
        updateStatus('Esperando animación...');
        // Reintentar después de un momento
        setTimeout(() => changeAnimation(animKey), 500);
    }
}

// Configurar controles del visor
function setupARControls() {
    const buttons = {
        'ar-btn-pose-t': 'poseT',
        'ar-btn-animation-1': 'animation1',
        'ar-btn-animation-2': 'base',
        'ar-btn-animation-3': 'animation3'
    };
    
    Object.keys(buttons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        btn.addEventListener('click', () => {
            changeAnimation(buttons[btnId]);
        });
    });
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (mixer) {
        mixer.update(delta);
    }
    
    renderer.render(scene, camera);
}
