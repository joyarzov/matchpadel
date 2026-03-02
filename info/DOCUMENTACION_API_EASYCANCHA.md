# Documentación API EasyCancha — Centros de Pádel Valdivia

## Resumen

Los centros de pádel en Valdivia que usan **EasyCancha** requieren autenticación JWT para consultar disponibilidad. A diferencia de MatchPoint (que es público), EasyCancha necesita un login previo. Una vez autenticado, la API REST devuelve los slots disponibles de cada cancha para una fecha dada.

El flujo completo es:

1. **Login** → obtener token JWT
2. **(Opcional) Descubrimiento** → obtener clubes, deportes, canchas
3. **Consultar disponibilidad** → obtener slots libres para una fecha

---

## Centros disponibles

| Centro | Club ID | Dirección | Estado |
|--------|---------|-----------|--------|
| Espacio Pádel - Las Ánimas | `400` | Pedro Aguirre Cerda 05, Valdivia | Activo |
| Espacio Pádel - Paillao | `1128` | Camino a Paillao, Valdivia | Activo |

**Sport ID para Pádel:** `7`

**URLs de reserva:**
- Las Ánimas: `https://www.easycancha.com/book/clubs/400/sports?sportId=7&lang=es-CL&country=CL`
- Paillao: `https://www.easycancha.com/book/clubs/1128/sports?sportId=7&lang=es-CL&country=CL`

---

## Paso 1: Autenticación (Login)

### Request

```
POST https://www.easycancha.com/api/login
Content-Type: application/json
Origin: https://www.easycancha.com
Referer: https://www.easycancha.com/book

{
  "email": "tu_email@ejemplo.com",
  "password": "tu_password"
}
```

### Headers obligatorios

| Header | Valor | Por qué |
|--------|-------|---------|
| `Content-Type` | `application/json` | Formato del body |
| `Origin` | `https://www.easycancha.com` | **Requerido** — sin este header la API responde `403 Forbidden` |
| `Referer` | `https://www.easycancha.com/book` | Recomendado para simular navegador |

> **Importante:** El header `Origin` es obligatorio. Sin él, el servidor rechaza la petición con un `403 Forbidden` y body `"Forbidden"`, sin importar que las credenciales sean válidas.

### Response exitoso (HTTP 200)

```json
{
  "error": false,
  "code": 0,
  "msg": "User authenticated",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response con error (HTTP 200, error en body)

```json
{
  "error": true,
  "code": 1,
  "msg": "Invalid credentials"
}
```

### Sobre el token JWT

- Es un **JWT estándar** (Header.Payload.Signature en base64)
- **Expiración:** ~7 días (`exp` claim en el payload)
- **Audiencia:** `easycancha-user-production`
- El payload contiene: `id`, `email`, `first_name`, `last_name`, `role`, `subscription`
- **Uso:** Se envía como header `Authorization: {token}` (sin prefijo "Bearer")
- Se puede reusar hasta que expire; no es necesario hacer login en cada request

### Decodificar el token (para verificar expiración)

```php
// PHP - decodificar payload sin verificar firma
$parts = explode('.', $token);
$payload = json_decode(base64_decode($parts[1]), true);
$expira = date('Y-m-d H:i:s', $payload['exp']);
$expirado = time() > $payload['exp'];
```

```python
# Python
import base64, json, time
payload = json.loads(base64.b64decode(token.split('.')[1] + '=='))
expirado = time.time() > payload['exp']
```

```javascript
// JavaScript
const payload = JSON.parse(atob(token.split('.')[1]));
const expirado = Date.now() / 1000 > payload.exp;
```

---

## Paso 2: Consultar disponibilidad (Timeslots)

Este es el endpoint principal. Devuelve todos los **slots disponibles** (libres) para un club, deporte y fecha.

### Request

```
GET https://www.easycancha.com/api/sports/{sportId}/clubs/{clubId}/timeslots?date={YYYY-MM-DD}&time={HH:MM:SS}&timespan={minutos}
Authorization: {token}
Origin: https://www.easycancha.com
Referer: https://www.easycancha.com/book
```

### Parámetros de query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | string | Sí | Fecha en formato **YYYY-MM-DD** (ISO 8601) |
| `time` | string | Sí | Hora preferida en formato **HH:MM:SS**. Usar `00:00:00` para obtener todos los slots del día |
| `timespan` | int | Sí | Duración del bloque en minutos. Para pádel siempre es `60` |

### Parámetros de ruta

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `sportId` | `7` | ID del deporte Pádel |
| `clubId` | `400` o `1128` | ID del club (ver tabla de centros) |

### Ejemplo con curl

```bash
TOKEN="eyJhbGciOiJIUz..."

curl -s "https://www.easycancha.com/api/sports/7/clubs/400/timeslots?date=2026-03-03&time=00:00:00&timespan=60" \
  -H "Authorization: $TOKEN" \
  -H "Origin: https://www.easycancha.com" \
  -H "Referer: https://www.easycancha.com/book" \
  -H "User-Agent: Mozilla/5.0"
```

### Response (estructura)

```json
{
  "error": false,
  "code": 0,
  "quotationId": 135188327,
  "sportName": "Padel",
  "sportFieldName": "Cancha",
  "timeslots": [],
  "alternative_timeslots": [
    {
      "hour": "07:00:00",
      "timeslots": [
        {
          "courtText": "Cancha 1",
          "courtId": 123,
          "courtSort": 1,
          "local_date": "2026-03-03",
          "local_start_time": "07:00:00",
          "local_end_time": "08:00:00",
          "priceInfo": {
            "amount": 10000,
            "amount_formatted": "$10.000",
            "currency_id": 1
          },
          "availableForWaitingList": false
        }
      ]
    },
    {
      "hour": "08:00:00",
      "timeslots": [
        {
          "courtText": "Cancha 1",
          "priceInfo": { "amount_formatted": "$10.000" }
        }
      ]
    }
  ],
  "timeslots_summary": [...],
  "alternative_timeslots_summary": [...]
}
```

---

## Estructura de datos detallada

### Campos principales del response

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `error` | bool | `false` si la consulta fue exitosa |
| `code` | int | Código de resultado (0 = OK) |
| `sportName` | string | Nombre del deporte ("Padel") |
| `sportFieldName` | string | Nombre del campo ("Cancha") |
| `timeslots` | array | Slots exactos para la hora solicitada (vacío si `time=00:00:00`) |
| `alternative_timeslots` | array | **Todos los slots libres del día**, agrupados por hora |
| `timeslots_summary` | array | Resumen de clubes con disponibilidad exacta |
| `alternative_timeslots_summary` | array | Resumen de clubes con disponibilidad alternativa |

### Estructura de `alternative_timeslots` (el array principal)

Cada elemento representa un **bloque horario** del día:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `hour` | string | Hora del bloque (`"07:00:00"`, `"07:30:00"`, etc.) |
| `timeslots` | array | Canchas disponibles (libres) en esa hora |

### Estructura de cada slot (dentro de `timeslots`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `courtId` | int | ID numérico de la cancha |
| `courtText` | string | **Nombre de la cancha** (ej: "Cancha 1", "Cancha 2") |
| `courtSort` | int | Orden de la cancha |
| `local_date` | string | Fecha local (YYYY-MM-DD) |
| `local_start_time` | string | Hora inicio (HH:MM:SS) |
| `local_end_time` | string | Hora fin (HH:MM:SS) |
| `priceInfo` | object | Información de precio |
| `priceInfo.amount` | int | Precio en centavos/unidad menor |
| `priceInfo.amount_formatted` | string | **Precio formateado** (ej: "$10.000") |
| `priceInfo.currency_id` | int | ID de moneda (1 = CLP) |
| `clubId` | int | ID del club |
| `clubName` | string | Nombre del club |
| `sportId` | int | ID del deporte |
| `availableForWaitingList` | bool | Si acepta lista de espera |
| `isPrime` | bool | Si es horario Prime |
| `primeIsAdditionalDay` | bool | Si es día adicional de Prime |

---

## Lógica para determinar disponibilidad

### Diferencia clave con MatchPoint

| | MatchPoint | EasyCancha |
|---|---|---|
| Qué devuelve | Todos los slots + cuáles están ocupados | **Solo los slots libres** |
| Lógica | Libre = HorariosFijos - Ocupaciones | Libre = lo que aparece en la respuesta |
| Ocupado | Explícito (array `Ocupaciones`) | **Implícito** (si no aparece, está ocupado) |

### Para armar la grilla completa

1. Obtener la **lista de canchas** que aparecen en la respuesta (nombres únicos de `courtText`)
2. Obtener la **lista de horas** que aparecen (de los bloques `hour` en `alternative_timeslots`)
3. Para cada celda cancha×hora: si hay un slot → **libre**; si no hay → **ocupado**

### Pseudocódigo

```
function getDisponibilidad(responseData):
    freeSlots = {}   // courtText → Set de horas libres
    allHours = Set()

    for block in responseData.alternative_timeslots:
        hour = block.hour[:5]   // "07:00"
        allHours.add(hour)

        for slot in block.timeslots:
            court = slot.courtText
            freeSlots[court][hour] = slot.priceInfo.amount_formatted

    // Armar grilla
    for court in freeSlots.keys():
        for hour in sorted(allHours):
            if hour in freeSlots[court]:
                print(court, hour, "LIBRE", freeSlots[court][hour])
            else:
                print(court, hour, "OCUPADO")
```

### Consideración: horas que no aparecen

Si una hora **no aparece en ningún bloque** de `alternative_timeslots`, puede significar que:
- Está fuera del horario de operación del club
- Todas las canchas están ocupadas en esa hora

Para distinguir estos casos, se puede usar la grilla de horas del club (ver endpoint de descubrimiento) o generar un rango fijo basado en el horario publicado del centro.

---

## Endpoints de descubrimiento (opcionales)

Estos endpoints no requieren autenticación y son útiles para descubrir clubes y configuración.

### Info del club (público)

```
GET https://www.easycancha.com/api/clubs/{clubId}
```

Devuelve nombre, dirección, coordenadas, teléfono, horario de operación, imágenes.

**Response relevante:**
```json
{
  "id": 400,
  "name": "Espacio Pádel - Las Animas",
  "address": "Pedro Aguirre Cerda 05",
  "working_hours": "Lunes a domingo desde las 7:00 a las 24:00 horas.",
  "timezone": "America/Santiago",
  "phone": "+56912345678"
}
```

### Deportes del club (público)

```
GET https://www.easycancha.com/api/clubs/{clubId}/sports
```

Devuelve la lista de deportes disponibles, incluyendo la **grilla de horas** y el **rango de fechas** reservables.

**Response relevante:**
```json
{
  "id": 7,
  "name": "Padel",
  "field_name": "Cancha",
  "timespanvalues": [60],
  "mindate": "2026-03-02",
  "maxdateNormal": "2026-03-17",
  "maxdatePrime": "2026-03-20",
  "hours": [
    "00:00:00", "00:30:00", "01:00:00", "...",
    "07:00:00", "07:30:00", "08:00:00", "...",
    "22:00:00", "22:30:00", "23:00:00", "23:30:00"
  ]
}
```

| Campo | Descripción |
|-------|-------------|
| `timespanvalues` | Duraciones posibles de reserva en minutos (pádel = 60) |
| `mindate` | Fecha más temprana para reservar (hoy) |
| `maxdateNormal` | Fecha máxima para usuarios normales (~15 días) |
| `maxdatePrime` | Fecha máxima para usuarios Prime (~18 días) |
| `hours` | Grilla de medias horas (todos los posibles time slots del día) |

### Deporte global (público)

```
GET https://www.easycancha.com/api/sports/7
```

Devuelve la definición global del deporte (nombre, duración por defecto, etc.).

---

## Ejemplo completo en PHP

```php
<?php
function ecLogin(string $email, string $password): ?string {
    $ch = curl_init('https://www.easycancha.com/api/login');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode([
            'email'    => $email,
            'password' => $password,
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Origin: https://www.easycancha.com',
            'Referer: https://www.easycancha.com/book',
        ],
        CURLOPT_USERAGENT => 'Mozilla/5.0',
        CURLOPT_TIMEOUT   => 15,
    ]);
    $body = curl_exec($ch);
    if (curl_errno($ch)) return null;

    $data = json_decode($body, true);
    return ($data['error'] === false) ? ($data['token'] ?? null) : null;
}

function ecGetDisponibilidad(string $token, int $clubId, string $fechaISO): array {
    $url = "https://www.easycancha.com/api/sports/7/clubs/{$clubId}/timeslots"
         . "?date={$fechaISO}&time=00:00:00&timespan=60";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "Authorization: {$token}",
            'Origin: https://www.easycancha.com',
            'Referer: https://www.easycancha.com/book',
        ],
        CURLOPT_USERAGENT => 'Mozilla/5.0',
        CURLOPT_TIMEOUT   => 20,
    ]);
    $body = curl_exec($ch);
    if (curl_errno($ch)) return ['error' => 'Error de conexión'];

    $data = json_decode($body, true);
    if (($data['error'] ?? true) !== false) {
        return ['error' => $data['msg'] ?? 'Error desconocido'];
    }

    // Parsear slots libres
    $freeSlots = []; // courtText => [hora => precio]
    $allHours  = [];

    foreach ($data['alternative_timeslots'] ?? [] as $block) {
        $hora = substr($block['hour'], 0, 5);
        $allHours[$hora] = true;

        foreach ($block['timeslots'] ?? [] as $slot) {
            $court  = $slot['courtText'] ?? 'Cancha ?';
            $precio = $slot['priceInfo']['amount_formatted'] ?? null;
            $freeSlots[$court][$hora] = $precio;
        }
    }

    // También procesar timeslots principales
    foreach ($data['timeslots'] ?? [] as $slot) {
        $hora = substr($slot['local_start_time'] ?? '', 0, 5);
        if (!$hora) continue;
        $allHours[$hora] = true;
        $court  = $slot['courtText'] ?? 'Cancha ?';
        $precio = $slot['priceInfo']['amount_formatted'] ?? null;
        $freeSlots[$court][$hora] = $precio;
    }

    ksort($allHours);

    // Armar estructura de canchas con slots
    $canchas = [];
    foreach ($freeSlots as $court => $hours) {
        $slots = [];
        foreach (array_keys($allHours) as $hora) {
            $slots[] = [
                'hora'   => $hora,
                'libre'  => isset($hours[$hora]),
                'precio' => $hours[$hora] ?? null,
            ];
        }
        $canchas[] = [
            'nombre' => $court,
            'slots'  => $slots,
        ];
    }

    return ['canchas' => $canchas, 'horas' => array_keys($allHours)];
}

// ── Ejemplo de uso ──
$token = ecLogin('tu_email@ejemplo.com', 'tu_password');
if (!$token) die('Error de autenticación');

$clubes = [
    'Espacio Pádel - Las Ánimas' => 400,
    'Espacio Pádel - Paillao'    => 1128,
];

$fecha = '2026-03-03'; // YYYY-MM-DD

foreach ($clubes as $nombre => $clubId) {
    $data = ecGetDisponibilidad($token, $clubId, $fecha);
    if (isset($data['error'])) {
        echo "{$nombre}: ERROR - {$data['error']}\n";
        continue;
    }
    echo "\n{$nombre}:\n";
    foreach ($data['canchas'] as $cancha) {
        $libres = array_filter($cancha['slots'], fn($s) => $s['libre']);
        $horas  = array_map(fn($s) => $s['hora'], $libres);
        echo "  {$cancha['nombre']}: " . count($libres) . " slots libres → " . implode(', ', $horas) . "\n";
    }
}
```

---

## Ejemplo completo en Python

```python
import requests

EC_BASE = 'https://www.easycancha.com/api'
EC_HEADERS = {
    'Origin': 'https://www.easycancha.com',
    'Referer': 'https://www.easycancha.com/book',
    'User-Agent': 'Mozilla/5.0',
}

def ec_login(email: str, password: str) -> str | None:
    resp = requests.post(f'{EC_BASE}/login',
        json={'email': email, 'password': password},
        headers={**EC_HEADERS, 'Content-Type': 'application/json'},
    )
    data = resp.json()
    return data.get('token') if data.get('error') is False else None

def ec_get_disponibilidad(token: str, club_id: int, fecha_iso: str) -> dict:
    resp = requests.get(
        f'{EC_BASE}/sports/7/clubs/{club_id}/timeslots',
        params={'date': fecha_iso, 'time': '00:00:00', 'timespan': 60},
        headers={**EC_HEADERS, 'Authorization': token},
    )
    data = resp.json()
    if data.get('error') is not False:
        return {'error': data.get('msg', 'Error desconocido')}

    free_slots = {}  # courtText → {hora: precio}
    all_hours = set()

    for block in data.get('alternative_timeslots', []):
        hora = block['hour'][:5]
        all_hours.add(hora)
        for slot in block.get('timeslots', []):
            court = slot.get('courtText', '?')
            precio = slot.get('priceInfo', {}).get('amount_formatted')
            free_slots.setdefault(court, {})[hora] = precio

    return {
        'canchas': free_slots,
        'horas': sorted(all_hours),
    }

# ── Ejemplo de uso ──
token = ec_login('tu_email@ejemplo.com', 'tu_password')
assert token, 'Error de autenticación'

clubes = {
    'Espacio Pádel - Las Ánimas': 400,
    'Espacio Pádel - Paillao': 1128,
}

for nombre, club_id in clubes.items():
    result = ec_get_disponibilidad(token, club_id, '2026-03-03')
    if 'error' in result:
        print(f'{nombre}: ERROR - {result["error"]}')
        continue
    print(f'\n{nombre}:')
    for court, hours in sorted(result['canchas'].items()):
        libres = sorted(hours.keys())
        print(f'  {court}: {len(libres)} libres → {", ".join(libres)}')
```

---

## Ejemplo completo en JavaScript (Node.js)

```javascript
const EC_BASE = 'https://www.easycancha.com/api';
const EC_HEADERS = {
  'Origin': 'https://www.easycancha.com',
  'Referer': 'https://www.easycancha.com/book',
  'User-Agent': 'Mozilla/5.0',
};

async function ecLogin(email, password) {
  const resp = await fetch(`${EC_BASE}/login`, {
    method: 'POST',
    headers: { ...EC_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  return data.error === false ? data.token : null;
}

async function ecGetDisponibilidad(token, clubId, fechaISO) {
  const url = `${EC_BASE}/sports/7/clubs/${clubId}/timeslots`
    + `?date=${fechaISO}&time=00:00:00&timespan=60`;

  const resp = await fetch(url, {
    headers: { ...EC_HEADERS, Authorization: token },
  });
  const data = await resp.json();
  if (data.error !== false) {
    return { error: data.msg || 'Error desconocido' };
  }

  const freeSlots = {}; // courtText → { hora: precio }
  const allHours = new Set();

  for (const block of data.alternative_timeslots || []) {
    const hora = block.hour.slice(0, 5);
    allHours.add(hora);
    for (const slot of block.timeslots || []) {
      const court = slot.courtText || '?';
      const precio = slot.priceInfo?.amount_formatted;
      if (!freeSlots[court]) freeSlots[court] = {};
      freeSlots[court][hora] = precio;
    }
  }

  return {
    canchas: freeSlots,
    horas: [...allHours].sort(),
  };
}

// ── Ejemplo de uso ──
const token = await ecLogin('tu_email@ejemplo.com', 'tu_password');
if (!token) throw new Error('Error de autenticación');

const clubes = {
  'Espacio Pádel - Las Ánimas': 400,
  'Espacio Pádel - Paillao': 1128,
};

for (const [nombre, clubId] of Object.entries(clubes)) {
  const result = await ecGetDisponibilidad(token, clubId, '2026-03-03');
  if (result.error) {
    console.log(`${nombre}: ERROR - ${result.error}`);
    continue;
  }
  console.log(`\n${nombre}:`);
  for (const [court, hours] of Object.entries(result.canchas).sort()) {
    const libres = Object.keys(hours).sort();
    console.log(`  ${court}: ${libres.length} libres → ${libres.join(', ')}`);
  }
}
```

---

## Comparación: MatchPoint vs EasyCancha

| Aspecto | MatchPoint | EasyCancha |
|---------|------------|------------|
| Autenticación | No requiere (público) | JWT con login obligatorio |
| Formato fecha | `DD/MM/YYYY` | `YYYY-MM-DD` (ISO 8601) |
| Método HTTP | POST | GET |
| Qué devuelve | Todos los slots + ocupaciones | Solo slots libres |
| Lógica de ocupado | Explícita (array Ocupaciones) | Implícita (ausencia = ocupado) |
| Cookies | Sí, vinculadas al token | No necesarias |
| Header especial | `X-Requested-With: XMLHttpRequest` | `Origin: https://www.easycancha.com` |
| Precio en respuesta | En `TextoAdicional` de HorariosFijos | En `priceInfo.amount_formatted` |
| Expiración token | Minutos (obtener nuevo cada vez) | ~7 días (reutilizable) |
| Rate limiting | No detectado | No detectado |

---

## Notas importantes

1. **El header `Origin: https://www.easycancha.com` es obligatorio** en TODAS las peticiones (login y timeslots). Sin él, la API responde `403 Forbidden`.

2. **El formato de fecha es YYYY-MM-DD** (ISO 8601), a diferencia de MatchPoint que usa DD/MM/YYYY.

3. **Solo se devuelven slots LIBRES.** Si una cancha/hora no aparece en la respuesta, está ocupada. No hay un array de "ocupaciones" como en MatchPoint.

4. **El parámetro `time` afecta la respuesta:**
   - `time=00:00:00` → devuelve **todos** los slots del día en `alternative_timeslots`
   - `time=10:00:00` → devuelve el "mejor match" para las 10:00 en `timeslots`, y el resto en `alternative_timeslots`
   - Para consultar disponibilidad completa, **siempre usar `time=00:00:00`**

5. **El token JWT dura ~7 días.** Se puede cachear y reusar. Verificar expiración con el claim `exp` del payload.

6. **No se requiere `User-Agent` específico**, pero se recomienda enviar uno de navegador por buena práctica.

7. **Cuentas gratuitas** tienen acceso completo a consulta de disponibilidad. La diferencia con Prime es solo el rango de fechas para reservar (15 días normal vs 18 días Prime).

8. **Las credenciales nunca deben exponerse al frontend.** Usar el PHP como proxy: el navegador llama al PHP, y el PHP llama a EasyCancha con las credenciales almacenadas en el servidor.

9. **Las canchas no tienen IDs estables en la respuesta de timeslots.** Se identifican por `courtText` (ej: "Cancha 1"). El `courtId` es un ID interno que puede cambiar.

10. **Horario de operación:**
    - Las Ánimas: Lunes a domingo, 7:00 a 24:00
    - Paillao: Consultar vía `/api/clubs/1128`
