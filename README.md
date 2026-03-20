# 🌐 Megapark Translator MVP

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-Telegram_AI-ea580c.svg)

Una aplicación web estilo "Walkie-Talkie" diseñada para romper las barreras del idioma en tiempo real en el sector del ocio y hostelería (inspirado en la estética y necesidades de **Megapark**). 

> **Dato Curioso:** Este MVP ha sido desarrollado, diseñado y desplegado **íntegramente mediante OpenClaw a través de Telegram**, desde la concepción de la idea y generación de arquitectura, hasta los commits finales en GitHub, sin necesidad de abrir un IDE o un editor de texto convencional.

---

## 🚀 ¿Qué problema soluciona?

En entornos con alta afluencia internacional, la barrera del idioma genera fricción. Las aplicaciones convencionales suelen requerir escribir a mano y seleccionar idiomas específicos de origen y destino de manera engorrosa.

**Nuestra solución:**
* **Flujo Híbrido:** ¿Ruido de fondo? Escribe. ¿Silencio? Pulsa, habla naturalmente y suelta el botón.
* **Traducción Simultánea:** Genera y muestra respuestas en dos idiomas de destino a la vez (ej. Inglés y Alemán o Español).
* **Detección Automática:** La IA sabe en qué idioma se le está hablando y traduce al resto dinámicamente.
* **Text-to-Speech nativo:** No necesitas leer la pantalla. Cada traducción cuenta con un botón de altavoz (🔊) que la lee en voz alta con acento nativo.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19 + Vite
* **Estilos:** Tailwind CSS v4 + Framer Motion (para animaciones fluidas)
* **Reconocimiento y Síntesis de Voz:** `Web Speech API` y `window.speechSynthesis` (Nativo del navegador).
* **Motor de Traducción Contextual:** Integración directa con `@google/generative-ai` (Gemini 2.5 Flash) para que las traducciones no sean literales sino que entiendan jergas y conceptos.

---

## ⚙️ Cómo iniciar el proyecto localmente

### 1. Requisitos Previos
* Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).
* Si quieres compilarlo y gestionarlo desde **OpenClaw**, solo pídeselo por chat.

### 2. Instalación y Configuración
Clona el repositorio y navega a la carpeta de la aplicación:
```bash
git clone https://github.com/TuliEscobar/megapark-translator-mvp.git
cd megapark-translator-mvp/traductor-app
npm install
```

Crea un archivo `.env` en la raíz de `traductor-app` y añade tu clave gratuita de Google AI Studio:
```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```
*(Si no lo configuras, la propia interfaz web te pedirá la clave de forma segura en un popup de Setup antes de empezar a grabar).*

### 3. Arrancar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible por defecto en `http://127.0.0.1:3000`.

---

## 💡 Siguientes Pasos (Roadmap)
- [ ] **Evolución a Full-Stack:** Implementar Node.js + Express y una base de datos (PostgreSQL) para guardar el historial completo de traducciones entre el cliente y el personal.
- [ ] **Local AI:** Cambiar la API de la nube por un modelo open-source corriendo 100% en local (como IBM Granite 3.1 vía Ollama) para asegurar la confidencialidad de la operativa diaria del club.