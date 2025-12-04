import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let scene, camera, renderer;
let mainModel, mixer, currentAnimation;
let animations = {};
let clock;
let video, videoTexture;
let isARMode = false;
let modelPlaced = false;
let reticle, scanEffect;
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
let touchStartPos = null;

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
    
    // Crear retículo para indicar dónde colocar el modelo
    createReticle();
    
    // Clock para animaciones
    clock = new THREE.Clock();
    
    // Iniciar con cámara AR
    startARCamera();
    
    // Configurar botones
    setupARControls();
    
    // Manejar resize
    window.addEventListener('resize', onWindowResize);
    
    // Escuchar orientación del dispositivo
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }
    
    // Iniciar render loop
    animate();
}

// Crear retículo para indicar dónde colocar el modelo
function createReticle() {
    // Anillo exterior
    const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    reticle = new THREE.Mesh(ringGeometry, ringMaterial);
    reticle.rotation.x = -Math.PI / 2;
    reticle.position.set(0, -0.5, -2);
    
    // Efecto de escaneo (anillos animados)
    const scanGeometry = new THREE.RingGeometry(0.1, 0.25, 32);
    const scanMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00d2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
    });
    scanEffect = new THREE.Mesh(scanGeometry, scanMaterial);
    scanEffect.rotation.x = -Math.PI / 2;
    scanEffect.position.copy(reticle.position);
    
    scene.add(reticle);
    scene.add(scanEffect);
}

// Manejar orientación del dispositivo
function handleOrientation(event) {
    deviceOrientation.alpha = event.alpha || 0; // Z axis (0-360)
    deviceOrientation.beta = event.beta || 0;   // X axis (-180 to 180)
    deviceOrientation.gamma = event.gamma || 0; // Y axis (-90 to 90)
    
    // Ajustar la posición del retículo basado en la orientación
    if (!modelPlaced && reticle) {
        const tiltFactor = 0.01;
        reticle.position.x = (deviceOrientation.gamma || 0) * tiltFactor;
        reticle.position.y = -0.5 + (deviceOrientation.beta - 90) * tiltFactor;
        
        if (scanEffect) {
            scanEffect.position.copy(reticle.position);
        }
    }
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
            
            updateStatus('AR listo. Mueve el dispositivo para escanear y toca para colocar.');
            
            // Cargar modelo
            loadBaseModel();
            
            // Mostrar controles
            document.getElementById('ar-controls').classList.remove('hidden');
            document.querySelector('header').style.display = 'block';
            
            // Animar efecto de escaneo
            animateScanEffect();
        };
        
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        updateStatus('Error: No se pudo acceder a la cámara');
        alert('Por favor, permite el acceso a la cámara para usar AR.');
    }
    
    // Configurar interacción táctil
    renderer.domElement.addEventListener('click', onScreenClick);
    renderer.domElement.addEventListener('touchend', onScreenClick);
    
    // Gestos para mover el modelo después de colocarlo
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
}

// Animar efecto de escaneo
function animateScanEffect() {
    if (!modelPlaced && scanEffect) {
        scanEffect.scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.3;
        scanEffect.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.3;
        scanEffect.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    }
}

function onTouchStart(event) {
    if (modelPlaced && event.touches.length === 1) {
        touchStartPos = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }
}

function onTouchMove(event) {
    if (modelPlaced && touchStartPos && event.touches.length === 1 && mainModel) {
        const deltaX = event.touches[0].clientX - touchStartPos.x;
        const deltaY = event.touches[0].clientY - touchStartPos.y;
        
        // Mover el modelo horizontalmente
        mainModel.position.x += deltaX * 0.001;
        mainModel.position.z += deltaY * 0.001;
        
        touchStartPos = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }
}
// Colocar modelo al hacer click/touch
function onScreenClick(event) {
    if (!mainModel) return;
    
    if (!modelPlaced) {
        // Primera vez: colocar modelo en la posición del retículo
        mainModel.position.copy(reticle.position);
        mainModel.visible = true;
        modelPlaced = true;
        
        // Ocultar retículo y efecto de escaneo
        reticle.visible = false;
        scanEffect.visible = false;
        
        updateStatus('Modelo colocado. Arrastra para mover o usa botones para animar.');
        
        // Vibrar si está disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
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
    
    // Animar efecto de escaneo
    animateScanEffect();
    
    renderer.render(scene, camera);
}
