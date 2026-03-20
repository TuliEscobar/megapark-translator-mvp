import os
import sys
import requests
import json
import speech_recognition as sr

# Modelo de Ollama a utilizar (asegúrate de haberlo descargado con 'ollama run granite3.1-dense:8b' o 'llama3.2')
OLLAMA_MODEL = "granite3.1-dense:8b"
OLLAMA_URL = "http://localhost:11434/api/generate"

def check_ollama():
    try:
        response = requests.get("http://localhost:11434/")
        if response.status_code == 200:
            return True
    except requests.exceptions.ConnectionError:
        pass
    return False

def traducir_con_ollama(texto_espanol):
    prompt = f"""Actúa como un traductor profesional en tiempo real. 
Traduce el siguiente texto del español al inglés de la manera más natural posible. 
Responde ÚNICAMENTE con la traducción en inglés, sin explicaciones ni comillas extra.

Texto original: {texto_espanol}
Traducción:"""
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 200
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            return f"[Error del modelo: HTTP {response.status_code}]"
    except Exception as e:
        return f"[Error de conexión con Ollama: {e}]"

def main():
    print("=" * 60)
    print("🤖 Traductor en Tiempo Real MVP (IBM Granite Open Source)")
    print("=" * 60)
    
    if not check_ollama():
        print("❌ Error: No se detecta Ollama ejecutándose en segundo plano.")
        print("1. Descarga Ollama de https://ollama.com")
        print(f"2. Abre una terminal y ejecuta: ollama run {OLLAMA_MODEL}")
        sys.exit(1)
        
    print(f"✅ Conectado a Ollama local (Modelo: {OLLAMA_MODEL})")
    
    # Inicializar el reconocedor de voz
    recognizer = sr.Recognizer()
    
    try:
        mic = sr.Microphone()
    except Exception as e:
        print(f"❌ Error al acceder al micrófono: {e}")
        print("Asegúrate de tener un micrófono conectado y PyAudio instalado.")
        sys.exit(1)

    print("\n🎤 Ajustando el ruido de fondo... (silencio un momento)")
    with mic as source:
        recognizer.adjust_for_ambient_noise(source, duration=2)
    
    print("✅ ¡Listo! Empieza a hablar en español (Di 'salir' para terminar).")
    
    while True:
        try:
            with mic as source:
                print("\n🎧 Escuchando...")
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            
            print("⏳ Reconociendo voz...")
            texto_espanol = recognizer.recognize_google(audio, language="es-ES")
            print(f"🗣️  Tú: '{texto_espanol}'")
            
            if texto_espanol.lower() in ["salir", "terminar", "exit", "quit", "salir del traductor"]:
                print("👋 Saliendo del traductor. ¡Hasta luego!")
                break
            
            print("🧠 Granite procesando localmente...")
            traduccion = traducir_con_ollama(texto_espanol)
            print(f"🌐 Traducción (EN): {traduccion}")
                
        except sr.WaitTimeoutError:
            pass  # No se detectó voz a tiempo, vuelve a escuchar
        except sr.UnknownValueError:
            print("🤷 No pude entender lo que dijiste.")
        except sr.RequestError as e:
            print(f"❌ Error en el servicio de reconocimiento: {e}")
        except KeyboardInterrupt:
            print("\n👋 Traductor detenido por el usuario.")
            break
        except Exception as e:
            print(f"⚠️ Error inesperado: {e}")

if __name__ == "__main__":
    main()