# Aplicación WebXR AR - Modelo 3D Animado

Aplicación de Realidad Aumentada que permite visualizar modelos 3D con diferentes animaciones usando **Model Viewer**.

## ⚠️ IMPORTANTE: Conversión de Archivos

Esta aplicación requiere archivos **GLB** (no FBX). Debes convertir tus archivos FBX a GLB.

### 🔄 Opción 1: Conversor Online (Más Rápido)

1. Ve a: https://products.aspose.app/3d/conversion/fbx-to-glb
2. Sube tu archivo FBX (T.fbx, MOVIMIENTO1.fbx, etc.)
3. Descarga el archivo GLB convertido
4. Colócalo en la raíz del proyecto

### 🔄 Opción 2: Blender (Recomendado para Calidad)

1. **Descarga Blender** (gratis): https://www.blender.org/download/
2. **Abre Blender** y cierra la escena por defecto
3. **Importar FBX**:
   - File → Import → FBX (.fbx)
   - Selecciona tu archivo (T.fbx, MOVIMIENTO1.fbx, etc.)
4. **Exportar como GLB**:
   - File → Export → glTF 2.0 (.glb/.gltf)
   - Formato: `GLB` (binario)
   - Incluir: ☑ Animaciones
   - Guardar como: `T.glb`, `MOVIMIENTO1.glb`, etc.
5. **Coloca los archivos** en la raíz del proyecto

### 📁 Estructura Requerida

```
EXAMENBIEN/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── T.glb                  ← Convertir T.fbx a GLB
├── MOVIMIENTO1.glb        ← Convertir MOVIMIENTO1.fbx a GLB
├── MOVIMIENTO2.glb        ← Convertir MOVIMIENTO2.fbx a GLB
└── MOVIMIENTO3.glb        ← Convertir MOVIMIENTO3.fbx a GLB
```

## 📋 Características

- ✅ Visualización 3D interactiva en el navegador
- ✅ AR nativo para iOS (Quick Look) y Android (Scene Viewer)
- ✅ Controles táctiles: rotar, zoom, mover
- ✅ Cambio dinámico entre modelos/animaciones
- ✅ Colocar modelos en tu espacio real
- ✅ Escalar y posicionar libremente en AR
- ✅ Iluminación realista y sombras

## 🚀 Instalación

### 1. Convierte tus archivos FBX a GLB (ver arriba)

### 2. Coloca los archivos GLB en la raíz del proyecto

### 3. Inicia un servidor local

```bash
# Python 3
python -m http.server 8000

# O con Node.js
npx http-server -p 8000
```

### 4. Abre en tu navegador

- Escritorio: `http://localhost:8000`
- Móvil: Usa la IP local o GitHub Pages

## 📱 Uso en AR

1. **Abre la aplicación** en tu móvil (iOS o Android)
2. Presiona **"Ver en tu espacio (AR)"**
3. **Mueve el dispositivo** para escanear superficies
4. **Toca** para colocar el modelo
5. **Pellizca** para escalar
6. **Arrastra** para mover
7. **Rota con dos dedos** para girar

## 🎮 Controles

### En el navegador:
- 🖱️ **Arrastra**: Rotar el modelo
- 🔍 **Pellizca**: Hacer zoom
- 🎬 **Botones**: Cambiar entre modelos

### En modo AR:
- 📱 **Mueve el móvil**: Escanear superficies
- 👆 **Toca**: Colocar modelo
- 🤏 **Pellizca**: Escalar
- 👆 **Arrastra**: Mover posición
- 🔄 **Dos dedos**: Rotar

## 💡 Consejos para AR

- **Buena iluminación**: AR funciona mejor con luz natural
- **Superficies planas**: Mesas, suelo, escritorios
- **Mueve lentamente**: Da tiempo al dispositivo para escanear
- **Distancia**: 1-3 metros del modelo para mejor visualización

## 🔧 Solución de Problemas

### "Error al cargar modelo"
- ✅ Verifica que los archivos sean .GLB (no .FBX)
- ✅ Archivos deben estar en la raíz del proyecto
- ✅ Nombres exactos: `T.glb`, `MOVIMIENTO1.glb`, etc.

### AR no funciona
- ✅ iOS: Requiere iOS 12+ y Safari
- ✅ Android: Requiere ARCore instalado
- ✅ Usa HTTPS o localhost
- ✅ Permisos de cámara activados

### Modelos muy grandes/pequeños
- Ajusta la escala al exportar desde Blender
- En AR, usa pellizco para escalar

## 📚 Tecnologías

- **Model Viewer** - Google's 3D model viewer
- **WebXR API** - Realidad aumentada web
- **GLB/glTF 2.0** - Formato 3D optimizado para web
- **Quick Look** (iOS) - AR nativo de Apple
- **Scene Viewer** (Android) - AR nativo de Google

## 🌐 Desplegar en GitHub Pages

1. Sube el proyecto a GitHub
2. Settings → Pages → Source: main branch
3. Accede a: `https://[usuario].github.io/[repo]`
4. Funcionará con HTTPS automáticamente

## 📄 Notas Técnicas

- **GLB vs FBX**: GLB es más ligero y optimizado para web
- **Animaciones**: Se reproducen automáticamente si están embebidas
- **Compatibilidad**: Chrome, Safari, Edge (últimas versiones)
- **Tamaño**: Se recomienda < 5MB por modelo para carga rápida

---

**¡Disfruta de tu experiencia AR!** 🚀✨
