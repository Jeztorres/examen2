# Aplicación WebXR AR - Modelo 3D Animado

Aplicación de Realidad Aumentada que permite visualizar modelos 3D con diferentes animaciones directamente en tu espacio físico usando la cámara del dispositivo.

## 📋 Características

- ✅ Visualización AR de modelos 3D en tu espacio real
- ✅ Cambio dinámico entre diferentes animaciones
- ✅ Interfaz inmersiva con botones flotantes
- ✅ Detección de superficies para colocar modelos
- ✅ Iluminación realista y sombras
- ✅ Diseño responsive para móviles

## 🗂️ Estructura del Proyecto

```
EXAMENBIEN/
├── index.html          # Página principal
├── css/
│   └── style.css      # Estilos de la aplicación
├── js/
│   └── app.js         # Lógica de AR y Three.js
└── models/            # 📁 COLOCA TUS MODELOS AQUÍ
    ├── modell-final.fbx    (Pose T - modelo base)
    ├── movimiento2.fbx     (Animación 2)
    └── movimiento3.fbx     (Animación 3)
```

## 📦 Requisitos

### Dispositivo:
- **Smartphone Android** con soporte ARCore
- **iOS 12+** (Safari con soporte WebXR)

### Navegador:
- **Chrome** 89+ (Android)
- **Edge** (Android)
- **Safari** (iOS con WebXR Viewer)

### Conexión:
- **HTTPS** (obligatorio para WebXR) o
- **localhost** (para desarrollo)

## 🚀 Instalación

### 1. Coloca tus modelos FBX

Copia los archivos `.fbx` en la carpeta `models/`:
- `modell-final.fbx` → Modelo con pose T (base con skin)
- `movimiento2.fbx` → Primera animación
- `movimiento3.fbx` → Segunda animación

### 2. Servidor local

Debes servir la aplicación mediante HTTPS. Opciones:

#### Opción A: Python (Simple)
```bash
# Python 3
python -m http.server 8000
```
Luego visita: `http://localhost:8000`

#### Opción B: Node.js con http-server
```bash
npm install -g http-server
http-server -p 8000
```

#### Opción C: VS Code con Live Server
1. Instala la extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

### 3. Para usar en tu teléfono (HTTPS)

Para usar AR necesitas HTTPS. Opciones:

#### Opción A: ngrok (Recomendado)
```bash
# Descarga ngrok desde ngrok.com
ngrok http 8000
```
Copia la URL HTTPS que te proporciona y ábrela en tu móvil.

#### Opción B: GitHub Pages
1. Sube el proyecto a GitHub
2. Activa GitHub Pages en Settings
3. Accede desde tu móvil a la URL de GitHub Pages

## 📱 Uso

1. **Abre la aplicación** en tu dispositivo móvil
2. **Presiona "Iniciar AR"** y otorga permisos de cámara
3. **Apunta al suelo** y verás un círculo verde (retículo)
4. **Toca la pantalla** para colocar el modelo
5. **Usa los botones** en la parte inferior para cambiar entre:
   - **Pose T**: Modelo base en posición T
   - **Movimiento 2**: Primera animación
   - **Movimiento 3**: Segunda animación

## 🎮 Controles

- **Tocar pantalla**: Colocar modelo (antes de colocarlo)
- **Botón "Pose T"**: Cambiar a modelo base
- **Botón "Movimiento 2"**: Activar animación 2
- **Botón "Movimiento 3"**: Activar animación 3

## ⚙️ Configuración

### Ajustar escala del modelo
En `js/app.js`, línea ~146:
```javascript
mainModel.scale.set(0.5, 0.5, 0.5); // Cambia los valores
```

### Cambiar posición inicial
En `js/app.js`, modifica la función `placeModel()`.

### Añadir más animaciones
1. Agrega el archivo FBX a la carpeta `models/`
2. Añade la ruta en el objeto `models` (línea ~12)
3. Crea un nuevo botón en `index.html`
4. Añade el event listener en `setupEventListeners()`

## 🔧 Solución de Problemas

### "AR no soportado"
- Verifica que tu dispositivo tenga ARCore (Android) o ARKit (iOS)
- Usa un navegador compatible (Chrome/Edge en Android)

### "WebXR no disponible"
- Asegúrate de usar HTTPS o localhost
- Actualiza tu navegador

### El modelo no aparece
- Verifica que los archivos `.fbx` estén en `models/`
- Revisa la consola del navegador (F12) para errores
- Asegúrate de que los nombres coincidan exactamente

### Los modelos se ven muy grandes/pequeños
- Ajusta el valor de `scale.set()` en `app.js`

### Las animaciones no se reproducen
- Verifica que los archivos FBX contengan animaciones
- Revisa la consola para errores de carga
- Los archivos FBX de animación deben tener el esqueleto compatible con el modelo base

## 📚 Tecnologías Utilizadas

- **Three.js** - Motor 3D
- **WebXR API** - Realidad aumentada
- **FBXLoader** - Carga de modelos FBX 3D
- **ARButton** - Interfaz de AR

## 📄 Notas Importantes

- Los modelos FBX deben estar optimizados (< 10MB recomendado)
- Las animaciones deben estar embebidas en los archivos FBX
- El modelo base (`modell-final.fbx`) debe tener la skin/textura (Pose T)
- Los archivos de animación (`movimiento2.fbx`, `movimiento3.fbx`) son solo el esqueleto
- Los esqueletos de las animaciones deben ser compatibles con el modelo base

## 🎨 Personalización

Puedes modificar los colores y estilos en `css/style.css`:
- Gradientes de fondo
- Colores de botones
- Posición de controles
- Animaciones CSS

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los requisitos del dispositivo
3. Asegúrate de usar HTTPS
4. Comprueba que los archivos FBX son válidos y compatibles

---

**¡Disfruta de tu experiencia AR!** 🚀✨
