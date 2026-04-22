# Guía de Testing — Quiniela Mundial 2026

## Flujo completo de prueba

### PASO 1 — Crear cuentas de prueba
```bash
# Crear 20 usuarios (por defecto)
node scripts/createTestUsers.mjs TuPasswordAdmin

# Crear una cantidad específica
node scripts/createTestUsers.mjs TuPasswordAdmin 25
node scripts/createTestUsers.mjs TuPasswordAdmin 30
```

Crea usuarios `test_jugador01` hasta `test_jugador20` (o la cantidad que pidas) con nombres ficticios reales para que el ranking se vea natural.

Contraseña de todos: `TestPass1234!`  
Emails: `test_jugador01@quiniela.test` ... `test_jugador20@quiniela.test`

---

### PASO 2 — Simular predicciones Y resultados (automático)
```bash
# Simula todo: predicciones de los 20 usuarios + resultados de partidos + calcula puntos
node scripts/submitTestPredictions.mjs TuPasswordAdmin

# Solo predicciones (sin asignar resultados todavía)
node scripts/submitTestPredictions.mjs TuPasswordAdmin --predictions-only

# Solo resultados (si ya existen predicciones)
node scripts/submitTestPredictions.mjs TuPasswordAdmin --results-only

# Solo una fase específica
node scripts/submitTestPredictions.mjs TuPasswordAdmin --phase groups
```

El script:
- Inicia sesión como cada usuario de prueba y entrega predicciones random
- Cada usuario tiene predicciones distintas (variación por usuario + partido)
- Asigna resultados random a los partidos abiertos como admin
- Recalcula los puntos de todos los usuarios automáticamente

---

### PASO 5 — Verificar puntos
Revisa en la app que:
- [ ] El marcador exacto suma 5 pts
- [ ] El resultado correcto (sin score exacto) suma 3 pts
- [ ] Predicción incorrecta suma 0 pts
- [ ] El ranking general refleja los cambios
- [ ] La Quiniela Flash muestra los puntos del periodo

---

### PASO 6 — Limpiar datos de prueba

**Primero, revisa qué se va a eliminar (sin borrar nada):**
```bash
node scripts/cleanupTest.mjs TuPasswordAdmin --dry-run
```

**Luego, ejecuta la limpieza real:**
```bash
node scripts/cleanupTest.mjs TuPasswordAdmin
```

**Si también quieres resetear los resultados de partidos:**
```bash
node scripts/cleanupTest.mjs TuPasswordAdmin --also-reset-matches
```

---

## Cuentas de prueba

| Nombre | Email | Contraseña |
|---|---|---|
| Test Jugador 1 | test_jugador1@quiniela.test | TestPass1234! |
| Test Jugador 2 | test_jugador2@quiniela.test | TestPass1234! |
| Test Jugador 3 | test_jugador3@quiniela.test | TestPass1234! |

---

## Notas importantes

- Los scripts usan la misma Firebase config del proyecto principal
- Las cuentas de prueba se identifican con el campo `isTestAccount: true`
- El script de limpieza **NO elimina las cuentas de Firebase Auth** (requiere Admin SDK). Para eliminarlas manualmente: Firebase Console → Authentication → Users
- Puedes correr el script de creación múltiples veces — si la cuenta ya existe la omite
