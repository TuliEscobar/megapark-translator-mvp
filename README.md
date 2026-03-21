# 🌌 Megapark Translator · Full-Stack Edition

<div align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Powered-orange?style=for-the-badge&logo=ai" alt="OpenClaw Powered" />
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20Express%20%2B%20PostgreSQL-blue?style=for-the-badge" alt="Full Stack" />
  <img src="https://img.shields.io/badge/Deployment-Docker%20Ready-green?style=for-the-badge&logo=docker" alt="Docker Ready" />
</div>

> **Dato Curioso:** Este proyecto ha sido desarrollado, diseñado y desplegado **íntegramente mediante OpenClaw a través de Telegram**, evolucionando de un MVP local a una aplicación Full-Stack de grado empresarial con Base de Datos SQL, todo sin necesidad de abrir un editor de código manualmente.

**Megapark Translator** es una aplicación estilo "Walkie-Talkie" que permite la traducción de voz en tiempo real con una interfaz moderna. Ahora cuenta con un **Backend en Node.js (Express)** y una **Base de Datos PostgreSQL** para almacenar el historial de traducciones, completamente preparado para ser desplegado 24/7 en la nube (Render, Fly.io, etc.).

---

## ✨ Características Principales

*   **🎙️ Traducción por Voz (Walkie-Talkie):** Captura tu voz usando la Web Speech API del navegador, con detección automática de idioma.
*   **🤖 Motor de IA Dual:** Integrado nativamente con **Gemini 2.5 Flash** (Google) y preparado para fallback local mediante **Granite 3.1** (Ollama).
*   **🗣️ Text-to-Speech (TTS):** Reproduce el audio traducido con acentos nativos de manera fluida.
*   **💾 Almacenamiento Persistente (Nuevo):** Un backend robusto guarda cada traducción que realizas en una base de datos PostgreSQL, blindada contra inyecciones SQL.
*   **🛡️ Seguridad de Nivel Producción:** Implementación de `helmet` y validaciones estrictas en la API, protegiendo variables de entorno.
*   **🐳 Docker Ready:** Empaquetado en un `Dockerfile` multi-stage que optimiza React y Express en un solo contenedor ligero.

---

## 🚀 Guía de Instalación (Local)

### 1. Clonar el repositorio
```bash
git clone https://github.com/TuliEscobar/megapark-translator-mvp.git
cd megapark-translator-mvp
```

### 2. Configurar la Base de Datos (Backend)
1. Ve a la carpeta del servidor:
```bash
cd backend
npm install
```
2. Crea un archivo `.env` en la carpeta `backend/` con las credenciales de tu PostgreSQL local:
```env
PORT=4000
DB_USER=postgres
DB_PASSWORD=secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=megapark_translator
```
3. Inicializa la base de datos mágicamente (creará la DB y la tabla `translations`):
```bash
node scripts/initDb.js
```
4. Levanta el servidor:
```bash
npm start
```
*(El backend quedará corriendo en `http://localhost:4000`)*

### 3. Iniciar el Frontend (React)
Abre **otra terminal**, vuelve a la raíz del proyecto y entra en la carpeta del frontend:
```bash
cd traductor-app
npm install
```
Crea un archivo `.env` dentro de `traductor-app/` con tu API Key de Gemini:
```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```
Levanta la aplicación:
```bash
npm run dev
```
*(La aplicación quedará corriendo en `http://localhost:3000`)*

---

## ☁️ Despliegue en la Nube (Render, Fly.io, AWS)

El proyecto incluye un `Dockerfile` optimizado. Al desplegar en plataformas en la nube:
1. **No usarás tu base de datos local:** La plataforma en la nube (ej. Render) te proporcionará su propia base de datos PostgreSQL en sus servidores.
2. Solo tendrás que copiar las credenciales que te den (Usuario, Contraseña, Host) y pegarlas en las **Variables de Entorno (Environment Variables)** del panel de control de Render/Fly.io.
3. El `Dockerfile` se encargará de construir el Frontend y meterlo dentro del Backend, exponiendo todo en el **Puerto 8080**.

---

## 🧪 Pruebas Automatizadas (TDD)
El backend incluye una suite de pruebas para verificar que la API no se rompa:
```bash
cd backend
npm test
```

---
*Desarrollado con 🦞 OpenClaw por Tuli & Tulito.*