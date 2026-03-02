# Documentación API MatchPoint — Centros de Pádel Valdivia

## Resumen

Los centros de pádel en Valdivia que usan MatchPoint exponen una API pública (sin autenticación de usuario) que permite consultar la disponibilidad de canchas en tiempo real. La información se obtiene en 3 pasos:

1. Obtener un **token de sesión** (key)
2. Obtener la **lista de cuadros** (grillas de canchas)
3. Consultar la **disponibilidad** de un cuadro para una fecha específica

---

## Centros disponibles

| Centro | Dominio MatchPoint | Estado |
|--------|-------------------|--------|
| Casa Pádel Valdivia | `casapadel-cl.matchpoint.com.es` | Activo |
| River Padel Valdivia | `riverpadelcl.matchpoint.com.es` | Activo |
| Las Marías Padel | `lasmariaspadel.matchpoint.com.es` | Activo |
| Valdivia Padel Center | `valdiviapadelcentercl.matchpoint.com.es` | **Cerrado** |

> **Nota:** Espacio Pádel (Paillao y Las Ánimas) usa EasyCancha, no MatchPoint. Su API requiere autenticación y devuelve `403 Forbidden` sin sesión de usuario.

---

## Paso 1: Obtener el token (key)

Hacer un `GET` a la página de reservas del centro. El HTML contiene un token en un script inline.

### Request

```
GET /Booking/Grid.aspx HTTP/1.1
Host: {dominio_matchpoint}
```

### Ejemplo con curl

```bash
curl -s -c cookies.txt "https://casapadel-cl.matchpoint.com.es/Booking/Grid.aspx"
```

### Extraer el token

El HTML contiene una línea con el patrón:

```javascript
hl90njda2b89k='TOKEN_AQUI'
```

Extraer con regex:

```bash
# Bash/sed
KEY=$(curl -s -c cookies.txt "https://casapadel-cl.matchpoint.com.es/Booking/Grid.aspx" \
  | sed -n "s/.*hl90njda2b89k='\([^']*\)'.*/\1/p" | head -1)
```

```php
// PHP
$html = file_get_contents('https://casapadel-cl.matchpoint.com.es/Booking/Grid.aspx');
preg_match("/hl90njda2b89k='([^']*)'/", $html, $matches);
$key = $matches[1];
```

```python
# Python
import re, requests
resp = requests.get('https://casapadel-cl.matchpoint.com.es/Booking/Grid.aspx')
key = re.search(r"hl90njda2b89k='([^']*)'", resp.text).group(1)
```

```javascript
// JavaScript (Node.js)
const resp = await fetch('https://casapadel-cl.matchpoint.com.es/Booking/Grid.aspx');
const html = await resp.text();
const key = html.match(/hl90njda2b89k='([^']*)'/)[1];
```

### Notas sobre el token

- El token es **público**, se genera al cargar la página sin login
- No es un token de usuario, es un token de sesión del sitio
- Tiene un **tiempo de vida limitado** (se recomienda obtener uno fresco antes de cada consulta)
- El nombre de la variable (`hl90njda2b89k`) es constante en todos los centros MatchPoint
- **Importante:** también guardar las cookies de la respuesta y enviarlas en las llamadas posteriores

---

## Paso 2: Obtener lista de cuadros (grillas)

Cada centro tiene uno o más "cuadros" (grillas de reservas). Este endpoint devuelve la lista con sus IDs y nombres.

### Request

```
POST /booking/srvc.aspx/ObtenerCuadros HTTP/1.1
Host: {dominio_matchpoint}
Content-Type: application/json; charset=utf-8
X-Requested-With: XMLHttpRequest
Cookie: {cookies del paso 1}

{"key": "{TOKEN}"}
```

### Ejemplo con curl

```bash
curl -s -X POST "https://casapadel-cl.matchpoint.com.es/booking/srvc.aspx/ObtenerCuadros" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "X-Requested-With: XMLHttpRequest" \
  -b cookies.txt \
  -d "{\"key\":\"$KEY\"}"
```

### Response

```json
{
  "d": [
    {
      "__type": "Matchpoint.Web.Library.Views.RegistroListadoCuadrosReservaWeb",
      "Id": 4,
      "Nombre": "Cuadro Pádel Dobles"
    }
  ]
}
```

### Notas

- Todos los centros de Valdivia actualmente tienen **idCuadro = 4** para pádel
- Sin embargo, se recomienda siempre consultar este endpoint primero por si cambia
- El array `d` puede contener múltiples cuadros si el centro tiene distintos deportes

---

## Paso 3: Obtener disponibilidad

Este es el endpoint principal. Devuelve toda la información de canchas, horarios ocupados y horarios libres para una fecha.

### Request

```
POST /booking/srvc.aspx/ObtenerCuadro HTTP/1.1
Host: {dominio_matchpoint}
Content-Type: application/json; charset=utf-8
X-Requested-With: XMLHttpRequest
Cookie: {cookies del paso 1}

{
  "idCuadro": 4,
  "fecha": "02/03/2026",
  "key": "{TOKEN}"
}
```

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `idCuadro` | int | ID del cuadro obtenido en el Paso 2 |
| `fecha` | string | Fecha en formato **DD/MM/YYYY** |
| `key` | string | Token obtenido en el Paso 1 |

### Ejemplo con curl

```bash
curl -s -X POST "https://casapadel-cl.matchpoint.com.es/booking/srvc.aspx/ObtenerCuadro" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "X-Requested-With: XMLHttpRequest" \
  -b cookies.txt \
  -d "{\"idCuadro\":4,\"fecha\":\"02/03/2026\",\"key\":\"$KEY\"}"
```

### Response (estructura)

```json
{
  "d": {
    "__type": "Matchpoint.Web.Library.Views.CuadroReservasNuevo",
    "Id": 4,
    "Nombre": "Cuadro Pádel Dobles",
    "StrHoraInicio": "07:00",
    "StrHoraFin": "00:00",
    "StrFecha": "02/03/2026",
    "StrFechaMin": "02/03/2026",
    "StrFechaMax": "14/03/2026",
    "TieneClienteAcceso": true,
    "StrHoraActualDelCentro": "16:19",
    "TipoCuadro": "general",
    "Columnas": [
      {
        "Id": "13",
        "TextoPrincipal": "Cancha 1",
        "TextoSecundario": "-",
        "IdImagen": "...",
        "Tipo": "Recurso",
        "IdModalidadFijaParaReservas": 9,
        "HorariosFijos": [...],
        "Ocupaciones": [...]
      }
    ]
  }
}
```

---

## Estructura de datos detallada

### Campos principales del response (`d`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Id` | int | ID del cuadro |
| `Nombre` | string | Nombre del cuadro (ej: "Cuadro Pádel Dobles") |
| `StrHoraInicio` | string | Hora de apertura (ej: "07:00") |
| `StrHoraFin` | string | Hora de cierre (ej: "00:00") |
| `StrFecha` | string | Fecha consultada (DD/MM/YYYY) |
| `StrFechaMin` | string | Fecha mínima disponible para reservas |
| `StrFechaMax` | string | Fecha máxima disponible para reservas |
| `TieneClienteAcceso` | bool | Si el cuadro está accesible (debe ser `true`) |
| `StrHoraActualDelCentro` | string | Hora actual del servidor del centro |
| `TipoCuadro` | string | Tipo de vista ("general") |
| `Columnas` | array | **Lista de canchas** (ver abajo) |

### Estructura de cada Columna (cancha)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Id` | string | ID de la cancha/recurso |
| `TextoPrincipal` | string | **Nombre de la cancha** (ej: "Cancha 1", "Cancha Socovesa") |
| `TextoSecundario` | string | Texto adicional |
| `IdImagen` | string | Hash de imagen de la cancha |
| `Tipo` | string | Tipo de columna ("Recurso") |
| `HorariosFijos` | array | **Bloques horarios disponibles** para reservar |
| `Ocupaciones` | array | **Bloques horarios ocupados** |

### Estructura de HorariosFijos (bloques reservables)

Estos son los bloques de tiempo que el centro tiene habilitados para reserva. Si un bloque aparece aquí y NO tiene una entrada correspondiente en `Ocupaciones`, está **LIBRE**.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Id` | int | ID del horario |
| `StrHoraInicio` | string | Hora inicio (ej: "16:00") |
| `StrHoraFin` | string | Hora fin (ej: "17:00") |
| `StrHoraInicioMostrar` | string | Hora inicio para mostrar |
| `StrHoraFinMostrar` | string | Hora fin para mostrar |
| `Minutos` | int | Duración en minutos |
| `Clickable` | bool | Si es clickeable para reservar |
| `FechaHoraInicio` | string | Fecha+hora inicio (formato .NET date) |
| `FechaHoraFin` | string | Fecha+hora fin (formato .NET date) |
| `MostrarOpcionesContratacionHorariosLibres` | bool | Si muestra opciones de contratación |

### Estructura de Ocupaciones (bloques ocupados)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `StrHoraInicio` | string | Hora inicio de la ocupación |
| `StrHoraFin` | string | Hora fin de la ocupación |
| `Tipo` | string | Tipo de ocupación (ver tabla abajo) |

#### Tipos de ocupación

| Tipo | Significado |
|------|-------------|
| `reserva_individual` | Reserva de un cliente |
| `clase_colectiva` | Clase grupal programada |
| `clase_suelta` | Clase individual/suelta |

---

## Lógica para determinar disponibilidad

### Canchas CON HorariosFijos

```
Para cada cancha:
  LIBRE = HorariosFijos donde StrHoraInicio NO está en Ocupaciones
  OCUPADO = Ocupaciones
```

### Canchas SIN HorariosFijos (reserva flexible)

Algunas canchas no tienen `HorariosFijos` (array vacío). Esto significa que aceptan reservas en cualquier horario dentro del rango de apertura/cierre. En ese caso:
- Las `Ocupaciones` indican los bloques ocupados
- El resto del horario está libre

### Pseudocódigo

```
function getDisponibilidad(columna, horaActual):
    ocupadas = {}
    for oc in columna.Ocupaciones:
        ocupadas[oc.StrHoraInicio] = {fin: oc.StrHoraFin, tipo: oc.Tipo}

    if columna.HorariosFijos is not empty:
        libres = []
        for h in columna.HorariosFijos:
            if h.StrHoraInicio not in ocupadas:
                libres.append({inicio: h.StrHoraInicio, fin: h.StrHoraFin})
        return libres
    else:
        // Cancha flexible: todo libre excepto ocupaciones
        return "Libre excepto: " + ocupadas
```

---

## Ejemplo completo en PHP

```php
<?php
function getMatchPointDisponibilidad($dominio, $fecha) {
    // Paso 1: Obtener key
    $cookieFile = tempnam(sys_get_temp_dir(), 'mp_');

    $ch = curl_init("https://$dominio/Booking/Grid.aspx");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $html = curl_exec($ch);
    curl_close($ch);

    preg_match("/hl90njda2b89k='([^']*)'/", $html, $matches);
    if (empty($matches[1])) return ['error' => 'No se pudo obtener key'];
    $key = $matches[1];

    // Paso 2: Obtener cuadros
    $ch = curl_init("https://$dominio/booking/srvc.aspx/ObtenerCuadros");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json; charset=utf-8',
            'X-Requested-With: XMLHttpRequest',
        ],
        CURLOPT_POSTFIELDS => json_encode(['key' => $key]),
    ]);
    $cuadrosJson = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (empty($cuadrosJson['d'])) return ['error' => 'No se encontraron cuadros'];
    $idCuadro = $cuadrosJson['d'][0]['Id'];

    // Paso 3: Obtener disponibilidad
    $ch = curl_init("https://$dominio/booking/srvc.aspx/ObtenerCuadro");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json; charset=utf-8',
            'X-Requested-With: XMLHttpRequest',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'idCuadro' => $idCuadro,
            'fecha' => $fecha,  // formato DD/MM/YYYY
            'key' => $key,
        ]),
    ]);
    $data = json_decode(curl_exec($ch), true);
    curl_close($ch);

    unlink($cookieFile);
    return $data['d'] ?? ['error' => 'Sin datos'];
}

// Ejemplo de uso
$centros = [
    'Casa Pádel'    => 'casapadel-cl.matchpoint.com.es',
    'River Padel'   => 'riverpadelcl.matchpoint.com.es',
    'Las Marías'    => 'lasmariaspadel.matchpoint.com.es',
];

$fecha = '02/03/2026';  // DD/MM/YYYY

foreach ($centros as $nombre => $dominio) {
    $data = getMatchPointDisponibilidad($dominio, $fecha);
    // Procesar $data['Columnas'] para mostrar disponibilidad
}
```

---

## Ejemplo completo en Python

```python
import re
import requests

def get_matchpoint_disponibilidad(dominio, fecha):
    session = requests.Session()

    # Paso 1: Obtener key
    resp = session.get(f'https://{dominio}/Booking/Grid.aspx')
    match = re.search(r"hl90njda2b89k='([^']*)'", resp.text)
    if not match:
        return {'error': 'No se pudo obtener key'}
    key = match.group(1)

    headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
    }

    # Paso 2: Obtener cuadros
    resp = session.post(
        f'https://{dominio}/booking/srvc.aspx/ObtenerCuadros',
        json={'key': key},
        headers=headers
    )
    cuadros = resp.json()['d']
    if not cuadros:
        return {'error': 'No se encontraron cuadros'}
    id_cuadro = cuadros[0]['Id']

    # Paso 3: Obtener disponibilidad
    resp = session.post(
        f'https://{dominio}/booking/srvc.aspx/ObtenerCuadro',
        json={'idCuadro': id_cuadro, 'fecha': fecha, 'key': key},
        headers=headers
    )
    return resp.json()['d']


# Ejemplo de uso
centros = {
    'Casa Pádel': 'casapadel-cl.matchpoint.com.es',
    'River Padel': 'riverpadelcl.matchpoint.com.es',
    'Las Marías': 'lasmariaspadel.matchpoint.com.es',
}

fecha = '02/03/2026'  # DD/MM/YYYY

for nombre, dominio in centros.items():
    data = get_matchpoint_disponibilidad(dominio, fecha)
    if 'error' not in data:
        for cancha in data.get('Columnas', []):
            nombre_cancha = cancha['TextoPrincipal']
            ocupaciones = {oc['StrHoraInicio']: oc['Tipo'] for oc in cancha.get('Ocupaciones', [])}
            horarios_libres = [
                h['StrHoraInicio'] + '-' + h['StrHoraFin']
                for h in cancha.get('HorariosFijos', [])
                if h['StrHoraInicio'] not in ocupaciones
            ]
            print(f'{nombre} - {nombre_cancha}: Libre: {horarios_libres}')
```

---

## Ejemplo completo en JavaScript (Node.js)

```javascript
async function getMatchPointDisponibilidad(dominio, fecha) {
  // Paso 1: Obtener key
  const pageResp = await fetch(`https://${dominio}/Booking/Grid.aspx`);
  const html = await pageResp.text();
  const cookies = pageResp.headers.get('set-cookie');

  const keyMatch = html.match(/hl90njda2b89k='([^']*)'/);
  if (!keyMatch) return { error: 'No se pudo obtener key' };
  const key = keyMatch[1];

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': cookies || '',
  };

  // Paso 2: Obtener cuadros
  const cuadrosResp = await fetch(
    `https://${dominio}/booking/srvc.aspx/ObtenerCuadros`,
    { method: 'POST', headers, body: JSON.stringify({ key }) }
  );
  const cuadros = (await cuadrosResp.json()).d;
  if (!cuadros?.length) return { error: 'No se encontraron cuadros' };
  const idCuadro = cuadros[0].Id;

  // Paso 3: Obtener disponibilidad
  const dataResp = await fetch(
    `https://${dominio}/booking/srvc.aspx/ObtenerCuadro`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ idCuadro, fecha, key }),
    }
  );
  return (await dataResp.json()).d;
}

// Uso
const centros = {
  'Casa Pádel': 'casapadel-cl.matchpoint.com.es',
  'River Padel': 'riverpadelcl.matchpoint.com.es',
  'Las Marías': 'lasmariaspadel.matchpoint.com.es',
};

const fecha = '02/03/2026'; // DD/MM/YYYY

for (const [nombre, dominio] of Object.entries(centros)) {
  const data = await getMatchPointDisponibilidad(dominio, fecha);
  // Procesar data.Columnas
}
```

---

## Endpoints adicionales (referencia)

Estos endpoints también están disponibles pero no son necesarios para consultar disponibilidad básica:

| Endpoint | Método | Parámetros | Descripción |
|----------|--------|------------|-------------|
| `/booking/srvc.aspx/ObtenerCuadroSoloContenido_HTML` | POST | `{idCuadro, key}` | Retorna HTML renderizado de la grilla |
| `/booking/srvc.aspx/ObtenerInformacionGeneralEspacioOcupado` | POST | `{id, key}` | Detalle de una ocupación específica |
| `/booking/srvc.aspx/ObtenerInformacionHorarioPrefijadoLibre` | POST | `{id, idmodalidad, fecha, idHorario, key}` | Info de un horario libre específico |
| `/booking/srvc.aspx/ObtenerInformacionHuecoLibre` | POST | `{idCuadro, idRecurso, idmodalidad, fecha, hora, key}` | Info de un hueco libre |
| `/booking/srvc.aspx/ObtenerInformacionPartida` | POST | `{id, key}` | Info de una partida/match |
| `/booking/srvc.aspx/PonerseEnEspera` | POST | `{idreserva, key}` | Ponerse en lista de espera |

---

## Notas importantes

1. **El formato de fecha es DD/MM/YYYY** — no ISO 8601
2. **Se requiere el header `Content-Type: application/json; charset=utf-8`** en todos los POST
3. **Las cookies de sesión son importantes** — el key está asociado a la sesión de cookies
4. **El rango de fechas consultables** está dado por `StrFechaMin` y `StrFechaMax` en la respuesta (generalmente ~12-15 días hacia adelante)
5. **Si `TieneClienteAcceso` es `false`** o `Columnas` está vacío, el key expiró o la sesión no es válida — obtener un key nuevo
6. **No se requiere autenticación de usuario** — toda esta información es pública
7. **Rate limiting**: No se detectó rate limiting explícito, pero se recomienda no hacer más de 1 request por segundo por centro para no sobrecargar
8. **EasyCancha** (Espacio Pádel Paillao y Las Ánimas) usa una API diferente (`/api/sports/{sportId}/clubs/{clubId}/timeslots`) que **requiere autenticación** y devuelve `403 Forbidden` sin login
