# 🏆 La Quiniela · Mundial 2026
## Guía de Instalación Completa

---

## LO QUE NECESITAS (todo gratis)
- Cuenta de Google → para Firebase
- Cuenta en Vercel → para publicar
- Node.js instalado en tu computadora → https://nodejs.org (descarga la versión LTS)

---

## PASO 1 — Instalar Node.js

1. Ve a https://nodejs.org
2. Descarga la versión **LTS** (la recomendada)
3. Instálala normalmente
4. Verifica: abre una terminal y escribe `node --version` → debe mostrar un número

---

## PASO 2 — Crear tu proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. Haz clic en **"Agregar proyecto"**
3. Nombre del proyecto: `quiniela-mundial-2026` (o el que quieras)
4. Desactiva Google Analytics (no lo necesitas)
5. Clic en **"Crear proyecto"**

### 2A — Activar Authentication
1. En el menú izquierdo: **Authentication** → "Comenzar"
2. Pestaña **Sign-in method**
3. Habilita **"Correo electrónico/contraseña"**
4. Guarda

### 2B — Crear la base de datos Firestore
1. En el menú izquierdo: **Firestore Database** → "Crear base de datos"
2. Selecciona **"Comenzar en modo de prueba"** (lo cambiaremos después)
3. Selecciona la región más cercana: `us-central1`
4. Clic en **"Listo"**

### 2C — Obtener las credenciales de tu app
1. En la página de inicio del proyecto, haz clic en el ícono **`</>`** (Web)
2. Apodo de la app: `quiniela-web`
3. NO actives Firebase Hosting (usaremos Vercel)
4. Clic en **"Registrar app"**
5. Verás un bloque de código con `firebaseConfig`. **Cópialo completo**, lo necesitas en el paso 4.

---

## PASO 3 — Configurar el proyecto en tu computadora

1. Descarga el ZIP del proyecto y extráelo en una carpeta
2. Abre esa carpeta en tu terminal:
   ```
   cd quiniela-mundial-2026
   ```
3. Instala las dependencias:
   ```
   npm install
   ```

---

## PASO 4 — Conectar Firebase con tu app

Abre el archivo `src/firebaseConfig.js` y reemplaza los valores:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",           // ← pega el valor de tu Firebase
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Reemplaza cada campo con los valores que copiaste en el paso 2C.

---

## PASO 5 — Obtener tu UID de administrador

1. Inicia la app localmente:
   ```
   npm run dev
   ```
2. Abre http://localhost:5173 en tu navegador
3. Regístrate con **tu correo** (el que usarás como admin)
4. Ve a Firebase Console → **Authentication** → **Users**
5. Copia el **UID** que aparece junto a tu correo (es una cadena larga tipo `abc123def456...`)

Ahora abre DOS archivos y reemplaza `REEMPLAZA_CON_TU_UID_DE_FIREBASE` con tu UID:

- `src/contexts/AuthContext.jsx` → línea con `ADMIN_UID`
- `firestore.rules` → línea con la función `isAdmin()`

---

## PASO 6 — Configurar las reglas de seguridad en Firebase

1. Ve a Firebase Console → **Firestore** → **Reglas**
2. Borra todo el contenido actual
3. Copia y pega el contenido del archivo `firestore.rules` (ya con tu UID)
4. Clic en **"Publicar"**

---

## PASO 7 — Publicar en Vercel (gratis)

### 7A — Subir el código a GitHub
1. Ve a https://github.com y crea una cuenta si no tienes
2. Crea un nuevo repositorio: **"New repository"** → nombre: `quiniela-mundial-2026`
3. En tu terminal, dentro de la carpeta del proyecto:
   ```
   git init
   git add .
   git commit -m "La Quiniela Mundial 2026"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/quiniela-mundial-2026.git
   git push -u origin main
   ```

### 7B — Deploy en Vercel
1. Ve a https://vercel.com y créate una cuenta (usa tu GitHub)
2. Clic en **"Add New Project"**
3. Selecciona tu repositorio `quiniela-mundial-2026`
4. Framework Preset: **Vite** (lo detecta automáticamente)
5. Clic en **"Deploy"**
6. En 2-3 minutos tendrás tu URL pública: `quiniela-mundial-2026.vercel.app`

---

## PASO 8 — Configuración final

### Autorizar tu dominio en Firebase
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Agrega tu URL de Vercel: `quiniela-mundial-2026.vercel.app`

### Agregar variables de entorno en Vercel (más seguro)
En lugar de tener las credenciales en el código, puedes:
1. Vercel → tu proyecto → **Settings** → **Environment Variables**
2. Agregar cada valor de firebaseConfig como variable de entorno

---

## CÓMO USAR TU QUINIELA

### Como Administrador:
1. Inicia sesión con tu cuenta (la del UID de admin)
2. Ve a **Info** → **Panel de Administrador**
3. Desde ahí puedes:
   - **Agregar partidos** con fecha, equipos y si están abiertos
   - **Ingresar resultados** y los puntos se calculan automáticamente
   - **Crear quinielas flash** con fechas de inicio y fin
   - **Abrir/cerrar** predicciones con un clic

### Para tus jugadores:
- Comparte la URL de tu app (ej: `quiniela-mundial.vercel.app`)
- Se registran con su nombre y correo
- Hacen sus predicciones antes de que cierres cada partido
- Ven el ranking en tiempo real

---

## FLUJO TÍPICO POR JORNADA

```
1. Agrega los partidos de la jornada (con fecha)
2. Comparte la URL con tus jugadores → ellos predicen
3. Cierra las predicciones antes de cada partido (toggle "Abierto/Cerrado")
4. Mira el partido 🍺
5. Ingresa el resultado en el panel admin
6. Los puntos se calculan solos → el ranking se actualiza en tiempo real
```

---

## ESTRUCTURA DE COLECCIONES EN FIREBASE

```
/users/{uid}
  - displayName, email, totalPoints, correctResults, exactScores, teamAdvances

/matches/{matchId}
  - phase, group, teamA, teamB, date, venue, isOpen, result

/predictions/{userId_matchId}
  - userId, matchId, result ('teamA'|'teamB'|'draw'), teamAScore?, teamBScore?, pointsAwarded

/flashes/{flashId}
  - name, startDate, endDate, description, winner?, winnerPoints?
```

---

## SOPORTE

¿Algo no funcionó? Verifica:
- ✅ Las credenciales de Firebase están bien copiadas
- ✅ Tu UID está reemplazado en AuthContext.jsx y firestore.rules
- ✅ Las reglas de Firestore están publicadas
- ✅ Tu dominio de Vercel está en los dominios autorizados de Firebase

---

*Generado con Claude · Anthropic — Buena suerte con el Mundial 2026! 🏆*
