<?php
// ============================================================
// Disponibilidad Pádel Valdivia - Single-file PHP app
// ============================================================
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', '0');

$CENTROS = [
    [
        'nombre'   => 'Casa Pádel',
        'dominio'  => 'casapadel-cl.matchpoint.com.es',
        'idCuadro' => 4,
    ],
    [
        'nombre'   => 'River Padel',
        'dominio'  => 'riverpadelcl.matchpoint.com.es',
        'idCuadro' => 4,
    ],
    [
        'nombre'   => 'Las Marías Padel',
        'dominio'  => 'lasmariaspadel.matchpoint.com.es',
        'idCuadro' => 4,
    ],
];

// ── API Proxy ──────────────────────────────────────────────
if (isset($_GET['api'])) {
    header('Content-Type: application/json; charset=utf-8');

    $fecha = $_GET['fecha'] ?? date('d/m/Y');
    // Validate date format DD/MM/YYYY
    if (!preg_match('#^\d{2}/\d{2}/\d{4}$#', $fecha)) {
        echo json_encode(['error' => 'Formato de fecha inválido']);
        exit;
    }

    $resultados = [];
    foreach ($CENTROS as $centro) {
        $resultados[] = obtenerDisponibilidad($centro, $fecha);
    }
    echo json_encode($resultados, JSON_UNESCAPED_UNICODE);
    exit;
}

function obtenerDisponibilidad(array $centro, string $fecha): array {
    $dominio = $centro['dominio'];
    $base    = "https://{$dominio}";
    $result  = [
        'nombre'  => $centro['nombre'],
        'dominio' => $dominio,
        'canchas' => [],
        'error'   => null,
    ];

    // Step 1: GET Grid.aspx to obtain token + cookies
    $ch = curl_init("{$base}/Booking/Grid.aspx");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_USERAGENT      => 'Mozilla/5.0',
    ]);
    $resp = curl_exec($ch);
    if (curl_errno($ch)) {
        $result['error'] = 'No se pudo conectar con ' . $centro['nombre'];
        curl_close($ch);
        return $result;
    }
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers    = substr($resp, 0, $headerSize);
    $html       = substr($resp, $headerSize);
    curl_close($ch);

    // Extract cookies
    preg_match_all('/^Set-Cookie:\s*([^;]+)/mi', $headers, $cookieMatches);
    $cookies = implode('; ', $cookieMatches[1] ?? []);

    // Extract token
    if (!preg_match("/hl90njda2b89k='([^']*)'/", $html, $m)) {
        $result['error'] = 'No se pudo obtener token de ' . $centro['nombre'];
        return $result;
    }
    $key = $m[1];

    // Step 2: POST ObtenerCuadro
    $postData = json_encode([
        'idCuadro' => $centro['idCuadro'],
        'fecha'    => $fecha,
        'key'      => $key,
    ]);

    $ch = curl_init("{$base}/booking/srvc.aspx/ObtenerCuadro");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json; charset=utf-8',
            'X-Requested-With: XMLHttpRequest',
            "Referer: {$base}/Booking/Grid.aspx",
            "Cookie: {$cookies}",
        ],
        CURLOPT_USERAGENT => 'Mozilla/5.0',
    ]);
    $body = curl_exec($ch);
    if (curl_errno($ch)) {
        $result['error'] = 'Error al consultar disponibilidad de ' . $centro['nombre'];
        curl_close($ch);
        return $result;
    }
    curl_close($ch);

    $data = json_decode($body, true);
    $d    = $data['d'] ?? null;

    if (!$d || empty($d['Columnas']) || !($d['TieneClienteAcceso'] ?? false)) {
        $result['error'] = 'Sin datos disponibles para ' . $centro['nombre'];
        return $result;
    }

    $result['horaInicio'] = $d['StrHoraInicio'] ?? '08:00';
    $result['horaFin']    = $d['StrHoraFin'] ?? '23:00';
    $result['fechaMin']   = $d['StrFechaMin'] ?? null;
    $result['fechaMax']   = $d['StrFechaMax'] ?? null;

    foreach ($d['Columnas'] as $col) {
        $cancha = [
            'id'     => $col['Id'],
            'nombre' => $col['TextoPrincipal'] ?? ('Cancha ' . $col['Id']),
            'slots'  => [],
        ];

        // Build occupied set
        $ocupados = [];
        foreach ($col['Ocupaciones'] ?? [] as $oc) {
            $ocupados[$oc['StrHoraInicio']] = [
                'tipo'  => $oc['Tipo'] ?? 'ocupado',
                'texto' => trim(($oc['Texto1'] ?? '') . ' ' . ($oc['Texto2'] ?? '')),
                'fin'   => $oc['StrHoraFin'],
            ];
        }

        $horariosFijos = $col['HorariosFijos'] ?? [];

        if (!empty($horariosFijos)) {
            // Fixed schedule: slots are defined by HorariosFijos
            foreach ($horariosFijos as $hf) {
                $hora  = $hf['StrHoraInicio'];
                $libre = !isset($ocupados[$hora]);
                $cancha['slots'][] = [
                    'hora'   => $hora,
                    'fin'    => $hf['StrHoraFin'],
                    'libre'  => $libre,
                    'precio' => $hf['TextoAdicional'] ?? null,
                    'tipo'   => $libre ? null : ($ocupados[$hora]['tipo'] ?? 'ocupado'),
                ];
            }
        } else {
            // Flexible: generate hourly slots, occupied ones come from Ocupaciones
            $hInicio = $d['StrHoraInicio'] ?? '08:00';
            $hFin    = $d['StrHoraFin'] ?? '23:00';
            // Handle midnight as end
            if ($hFin === '00:00' || $hFin === '0:00') $hFin = '24:00';

            $partes  = $d['PartesPorHora'] ?? 2;
            $minStep = (int)(60 / $partes);

            $t    = strtotime("2026-01-01 {$hInicio}");
            $tFin = strtotime("2026-01-01 " . ($hFin === '24:00' ? '23:59' : $hFin));

            while ($t <= $tFin) {
                $hora = date('H:i', $t);
                if (isset($ocupados[$hora])) {
                    $cancha['slots'][] = [
                        'hora'  => $hora,
                        'fin'   => $ocupados[$hora]['fin'],
                        'libre' => false,
                        'tipo'  => $ocupados[$hora]['tipo'],
                    ];
                } else {
                    $nextT = $t + $minStep * 60;
                    $cancha['slots'][] = [
                        'hora'  => $hora,
                        'fin'   => date('H:i', $nextT),
                        'libre' => true,
                    ];
                }
                $t += $minStep * 60;
            }
        }

        $result['canchas'][] = $cancha;
    }

    return $result;
}

// ── Frontend HTML ──────────────────────────────────────────
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Disponibilidad Pádel Valdivia</title>
<style>
:root {
    --green: #22c55e;
    --green-bg: #dcfce7;
    --red: #ef4444;
    --red-bg: #fee2e2;
    --gray: #6b7280;
    --gray-bg: #f3f4f6;
    --border: #e5e7eb;
    --bg: #f9fafb;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: #111827;
    min-height: 100vh;
}
header {
    background: #1e3a5f;
    color: white;
    padding: 1.2rem 1rem;
    text-align: center;
}
header h1 { font-size: 1.4rem; font-weight: 700; }
header p { font-size: 0.85rem; opacity: 0.8; margin-top: 0.3rem; }
.controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
}
.controls label { font-weight: 600; font-size: 0.9rem; }
.controls input[type="date"] {
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.95rem;
}
.controls button {
    padding: 0.45rem 1.2rem;
    background: #1e3a5f;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: 600;
}
.controls button:hover { background: #2d4f7a; }
.controls button:disabled { opacity: 0.5; cursor: not-allowed; }
.day-nav {
    display: flex;
    gap: 0.3rem;
}
.day-nav button {
    padding: 0.45rem 0.7rem;
    font-size: 0.85rem;
}
#status {
    text-align: center;
    padding: 0.7rem;
    font-size: 0.9rem;
    color: var(--gray);
}
#status.error { color: var(--red); }
.spinner {
    display: inline-block;
    width: 18px; height: 18px;
    border: 2px solid var(--border);
    border-top-color: #1e3a5f;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    vertical-align: middle;
    margin-right: 0.4rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
main { padding: 0.5rem 1rem 2rem; max-width: 1200px; margin: 0 auto; }
.centro {
    background: white;
    border-radius: 10px;
    margin-bottom: 1.2rem;
    overflow: hidden;
    border: 1px solid var(--border);
}
.centro-header {
    padding: 0.8rem 1rem;
    font-weight: 700;
    font-size: 1.05rem;
    background: #f0f4f8;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.centro-header .link {
    font-size: 0.75rem;
    font-weight: 400;
    color: #1e3a5f;
    text-decoration: none;
}
.centro-error {
    padding: 1rem;
    color: var(--red);
    font-size: 0.9rem;
}
.grid-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
.grid-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
    min-width: 500px;
}
.grid-table th {
    background: #f8fafc;
    padding: 0.5rem 0.4rem;
    text-align: center;
    font-weight: 600;
    border-bottom: 2px solid var(--border);
    position: sticky;
    top: 0;
    white-space: nowrap;
}
.grid-table th:first-child {
    text-align: left;
    padding-left: 0.8rem;
    min-width: 60px;
}
.grid-table td {
    padding: 0.3rem 0.4rem;
    text-align: center;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
}
.grid-table td:first-child {
    text-align: left;
    padding-left: 0.8rem;
    font-weight: 600;
    color: #374151;
    background: #fafbfc;
}
.slot {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.78rem;
    min-width: 70px;
}
.slot.libre {
    background: var(--green-bg);
    color: #166534;
}
.slot.ocupado {
    background: var(--red-bg);
    color: #991b1b;
}
.slot.clase {
    background: #fef3c7;
    color: #92400e;
}
.precio {
    display: block;
    font-size: 0.7rem;
    font-weight: 400;
    color: var(--gray);
    margin-top: 1px;
}
.legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding: 0.6rem;
    font-size: 0.8rem;
    flex-wrap: wrap;
}
.legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}
.legend-dot {
    width: 12px; height: 12px;
    border-radius: 3px;
    display: inline-block;
}
@media (max-width: 640px) {
    header h1 { font-size: 1.15rem; }
    main { padding: 0.5rem 0.5rem 2rem; }
    .grid-table { font-size: 0.75rem; }
    .slot { min-width: 58px; padding: 0.2rem 0.35rem; font-size: 0.72rem; }
}
</style>
</head>
<body>

<header>
    <h1>Disponibilidad Pádel Valdivia</h1>
    <p>Canchas disponibles en los centros de Valdivia</p>
</header>

<div class="controls">
    <label for="fecha">Fecha:</label>
    <div class="day-nav">
        <button id="btnPrev" title="Día anterior">&larr;</button>
    </div>
    <input type="date" id="fecha">
    <div class="day-nav">
        <button id="btnNext" title="Día siguiente">&rarr;</button>
    </div>
    <button id="btnConsultar">Consultar</button>
</div>

<div class="legend">
    <span><span class="legend-dot" style="background:var(--green-bg);border:1px solid #86efac"></span> Disponible</span>
    <span><span class="legend-dot" style="background:var(--red-bg);border:1px solid #fca5a5"></span> Reservado</span>
    <span><span class="legend-dot" style="background:#fef3c7;border:1px solid #fcd34d"></span> Clase</span>
</div>

<div id="status"></div>
<main id="resultados"></main>

<script>
const fechaInput = document.getElementById('fecha');
const btnConsultar = document.getElementById('btnConsultar');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const statusEl = document.getElementById('status');
const resultadosEl = document.getElementById('resultados');

// Default to today
const hoy = new Date();
fechaInput.value = formatISO(hoy);

btnConsultar.addEventListener('click', consultar);
btnPrev.addEventListener('click', () => cambiarDia(-1));
btnNext.addEventListener('click', () => cambiarDia(1));
fechaInput.addEventListener('keydown', e => { if (e.key === 'Enter') consultar(); });

function formatISO(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth()+1).padStart(2,'0') + '-' +
        String(d.getDate()).padStart(2,'0');
}

function cambiarDia(delta) {
    const d = new Date(fechaInput.value + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    fechaInput.value = formatISO(d);
    consultar();
}

async function consultar() {
    const isoDate = fechaInput.value;
    if (!isoDate) return;
    const [y, m, d] = isoDate.split('-');
    const fechaAPI = `${d}/${m}/${y}`;

    btnConsultar.disabled = true;
    statusEl.className = '';
    statusEl.innerHTML = '<span class="spinner"></span>Consultando disponibilidad...';
    resultadosEl.innerHTML = '';

    try {
        const resp = await fetch(`?api=1&fecha=${encodeURIComponent(fechaAPI)}`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        renderResultados(data);
        statusEl.textContent = '';
    } catch (err) {
        statusEl.className = 'error';
        statusEl.textContent = 'Error: ' + err.message;
    } finally {
        btnConsultar.disabled = false;
    }
}

function renderResultados(centros) {
    resultadosEl.innerHTML = '';
    for (const centro of centros) {
        const div = document.createElement('div');
        div.className = 'centro';

        const header = document.createElement('div');
        header.className = 'centro-header';
        header.innerHTML = `
            <span>${esc(centro.nombre)}</span>
            <a class="link" href="https://${esc(centro.dominio)}/Booking/Grid.aspx" target="_blank" rel="noopener">Reservar &rarr;</a>
        `;
        div.appendChild(header);

        if (centro.error) {
            const errDiv = document.createElement('div');
            errDiv.className = 'centro-error';
            errDiv.textContent = centro.error;
            div.appendChild(errDiv);
            resultadosEl.appendChild(div);
            continue;
        }

        if (!centro.canchas || centro.canchas.length === 0) {
            const errDiv = document.createElement('div');
            errDiv.className = 'centro-error';
            errDiv.textContent = 'No hay canchas disponibles para esta fecha.';
            div.appendChild(errDiv);
            resultadosEl.appendChild(div);
            continue;
        }

        // Collect all unique time slots across courts
        const allHoras = new Set();
        for (const c of centro.canchas) {
            for (const s of c.slots) allHoras.add(s.hora);
        }
        const horas = [...allHoras].sort();

        // Build slot lookup: cancha_id -> hora -> slot
        const lookup = {};
        for (const c of centro.canchas) {
            lookup[c.id] = {};
            for (const s of c.slots) lookup[c.id][s.hora] = s;
        }

        // Build table: rows = hours, columns = courts
        const wrapper = document.createElement('div');
        wrapper.className = 'grid-wrapper';

        let html = '<table class="grid-table"><thead><tr><th>Hora</th>';
        for (const c of centro.canchas) {
            html += `<th>${esc(c.nombre)}</th>`;
        }
        html += '</tr></thead><tbody>';

        for (const hora of horas) {
            html += `<tr><td>${esc(hora)}</td>`;
            for (const c of centro.canchas) {
                const slot = lookup[c.id]?.[hora];
                if (!slot) {
                    html += '<td>-</td>';
                } else if (slot.libre) {
                    html += `<td><span class="slot libre">Libre`;
                    if (slot.precio) html += `<span class="precio">${esc(slot.precio)}</span>`;
                    html += `</span></td>`;
                } else {
                    const isClase = (slot.tipo || '').includes('clase');
                    const cls = isClase ? 'clase' : 'ocupado';
                    const label = isClase ? 'Clase' : 'Ocupado';
                    html += `<td><span class="slot ${cls}">${label}</span></td>`;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        wrapper.innerHTML = html;
        div.appendChild(wrapper);
        resultadosEl.appendChild(div);
    }
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// Auto-load on page open
consultar();
</script>
</body>
</html>
