import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let mainModel, mixer, currentAnimation;
let animations = {};
let clock;
let isARMode = false;

// Variables para AR
let reticle, hitTestSource, hitTestSourceRequested;
let modelPlaced = false;
let arModel, arMixer, arAnimations = {};

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
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Crear cámara
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 3);
    
    // Crear renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Controles de órbita
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.update();
    
    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);
    
    const spotLight = new THREE.SpotLight(0xffc0cb, 0.5);
    spotLight.position.set(-5, 5, 0);
    scene.add(spotLight);
    
    // Suelo
    const groundGeometry = new THREE.CircleGeometry(5, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a3e,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x444466, 0x333344);
    scene.add(gridHelper);
    
    // Clock para animaciones
    clock = new THREE.Clock();
    
    // Cargar modelo base con skin
    loadBaseModel();
    
    // Configurar botones
    setupViewerControls();
    setupARButton();
    
    // Manejar resize
    window.addEventListener('resize', onWindowResize);
    
    // Iniciar render loop
    animate();
}

// Cargar modelo base con skin (MOVIMIENTO2)
function loadBaseModel() {
    updateStatus('Cargando modelo base...');
    const loader = new FBXLoader();
    
    loader.load(
        baseModelPath,
        (fbx) => {
            mainModel = fbx;
            mainModel.scale.set(0.01, 0.01, 0.01);
            mainModel.position.set(0, 0, 0);
            
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
            
            updateStatus('Modelo cargado. Selecciona una animación.');
            
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
function setupViewerControls() {
    const buttons = {
        'btn-pose-t': 'poseT',
        'btn-animation-1': 'animation1',
        'btn-animation-2': 'base',  // Animación del modelo base
        'btn-animation-3': 'animation3'
    };
    
    Object.keys(buttons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        btn.addEventListener('click', () => {
            // Remover clase active de todos
            document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
            // Agregar active al actual
            btn.classList.add('active');
            // Cambiar animación
            changeAnimation(buttons[btnId]);
        });
    });
}

// Configurar botón AR
function setupARButton() {
    const arButton = document.getElementById('ar-button');
    
    if (!('xr' in navigator)) {
        arButton.style.display = 'none';
        console.warn('WebXR no disponible en este navegador');
        return;
    }
    
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
            arButton.addEventListener('click', startARSession);
            arButton.disabled = false;
            
            // Pre-solicitar permisos de cámara (opcional pero ayuda)
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        stream.getTracks().forEach(track => track.stop());
                        console.log('Permisos de cámara pre-autorizados');
                    })
                    .catch(err => {
                        console.log('Permisos de cámara pendientes:', err);
                    });
            }
        } else {
            arButton.style.display = 'none';
            console.warn('AR no soportado en este dispositivo');
        }
    }).catch(error => {
        console.error('Error verificando soporte AR:', error);
        arButton.style.display = 'none';
    });
    
    // Configurar controles AR
    setupARControls();
}

function setupARControls() {
    const arButtons = {
        'ar-btn-pose-t': 'poseT',
        'ar-btn-animation-1': 'animation1',
        'ar-btn-animation-2': 'base',
        'ar-btn-animation-3': 'animation3'
    };
    
    Object.keys(arButtons).forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', () => {
            if (modelPlaced) {
                changeARAnimation(arButtons[btnId]);
            }
        });
    });
    
    document.getElementById('exit-ar').addEventListener('click', () => {
        if (renderer.xr.getSession()) {
            renderer.xr.getSession().end();
        }
    });
}

async function startARSession() {
    // Primero intentar obtener permisos de cámara
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        // Detener el stream inmediatamente, solo necesitamos el permiso
        stream.getTracks().forEach(track => track.stop());
    } catch (cameraError) {
        console.error('Error de permisos de cámara:', cameraError);
        alert('Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
        return;
    }
    
    // Configuración de la sesión AR
    const sessionInit = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'camera-access'],
        domOverlay: { root: document.body }
    };
    
    try {
        const session = await navigator.xr.requestSession('immersive-ar', sessionInit);
        
        session.addEventListener('end', onARSessionEnd);
        
        // Configurar el renderer con la sesión
        await renderer.xr.setSession(session);
        
        isARMode = true;
        
        // Ocultar UI normal y mostrar controles AR
        document.querySelector('header').style.display = 'none';
        document.getElementById('controls').style.display = 'none';
        document.getElementById('ar-button').style.display = 'none';
        document.getElementById('ar-controls').classList.remove('hidden');
        
        // Crear retículo si no existe
        if (!reticle) {
            const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                side: THREE.DoubleSide
            });
            reticle = new THREE.Mesh(geometry, material);
            reticle.matrixAutoUpdate = false;
            reticle.visible = false;
            scene.add(reticle);
        }
        
        // Ocultar modelo del visor
        if (mainModel) mainModel.visible = false;
        
        // Configurar interacción táctil
        const touchHandler = onARTouchEnd.bind(this);
        renderer.domElement.addEventListener('touchend', touchHandler);
        
        // Guardar referencia para limpiar después
        session.touchHandler = touchHandler;
        
        // Cambiar a render loop XR
        renderer.setAnimationLoop(renderAR);
        
    } catch (error) {
        console.error('Error al iniciar sesión AR:', error);
        
        let errorMsg = 'No se pudo iniciar AR. ';
        
        if (error.name === 'NotAllowedError') {
            errorMsg += 'Debes permitir el acceso a la cámara y sensores.';
        } else if (error.name === 'NotSupportedError') {
            errorMsg += 'Tu dispositivo no soporta WebXR AR.';
        } else if (error.name === 'SecurityError') {
            errorMsg += 'Necesitas usar HTTPS. Prueba con GitHub Pages o ngrok.';
        } else {
            errorMsg += error.message || 'Error desconocido.';
        }
        
        alert(errorMsg);
        console.error('Detalles del error:', error);
    }
}

function onARTouchEnd(event) {
    if (!modelPlaced && reticle.visible) {
        placeARModel();
    }
}

async function placeARModel() {
    if (!arModel) {
        await loadARBaseModel();
    }
    
    arModel.position.setFromMatrixPosition(reticle.matrix);
    arModel.visible = true;
    reticle.visible = false;
    modelPlaced = true;
    
    document.querySelector('.ar-instruction').textContent = 'Usa los botones para cambiar animaciones';
}

function loadARBaseModel() {
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader();
        
        loader.load(
            baseModelPath,
            (fbx) => {
                arModel = fbx;
                arModel.scale.set(0.005, 0.005, 0.005);
                arModel.visible = false;
                
                arModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                scene.add(arModel);
                
                // Crear mixer para AR
                arMixer = new THREE.AnimationMixer(arModel);
                
                // Cargar animación base
                if (fbx.animations && fbx.animations.length > 0) {
                    fbx.animations.forEach((clip) => {
                        const action = arMixer.clipAction(clip);
                        arAnimations['base'] = action;
                        action.play();
                    });
                }
                
                // Pre-cargar animaciones para AR
                preloadARAnimations();
                
                resolve();
            },
            undefined,
            reject
        );
    });
}

function preloadARAnimations() {
    const loader = new FBXLoader();
    
    Object.keys(animationPaths).forEach(key => {
        loader.load(
            animationPaths[key],
            (fbx) => {
                if (fbx.animations && fbx.animations.length > 0) {
                    fbx.animations.forEach((clip) => {
                        arAnimations[key] = clip;
                    });
                }
            },
            undefined,
            (error) => console.error(`Error cargando animación AR ${key}:`, error)
        );
    });
}

function changeARAnimation(animKey) {
    if (!arModel || !arMixer) return;
    
    // Detener animaciones actuales
    arMixer.stopAllAction();
    
    if (animKey === 'base') {
        if (arAnimations['base']) {
            arAnimations['base'].play();
        }
    } else if (arAnimations[animKey]) {
        const action = arMixer.clipAction(arAnimations[animKey]);
        action.play();
    } else {
        // Reintentar si la animación aún no está cargada
        setTimeout(() => changeARAnimation(animKey), 500);
    }
}

function onARSessionEnd() {
    isARMode = false;
    modelPlaced = false;
    hitTestSourceRequested = false;
    hitTestSource = null;
    
    if (reticle) reticle.visible = false;
    if (arModel) arModel.visible = false;
    if (mainModel) mainModel.visible = true;
    
    document.querySelector('header').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    document.getElementById('ar-button').style.display = 'block';
    document.getElementById('ar-controls').classList.add('hidden');
    
    // Limpiar event listeners
    const session = renderer.xr.getSession();
    if (session && session.touchHandler) {
        renderer.domElement.removeEventListener('touchend', session.touchHandler);
    }
    
    renderer.setAnimationLoop(null);
    animate();
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function onWindowResize() {
    const container = document.getElementById('viewer-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Render loop para visor normal
function animate() {
    if (isARMode) return;
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (mixer) {
        mixer.update(delta);
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Render loop para AR
function renderAR(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        
        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            
            hitTestSourceRequested = true;
        }
        
        if (hitTestSource && !modelPlaced) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }
    
    if (arMixer) {
        arMixer.update(0.016);
    }
    
    renderer.render(scene, camera);
}
