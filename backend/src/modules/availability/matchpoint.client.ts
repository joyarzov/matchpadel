const TOKEN_REGEX = /hl90njda2b89k='([^']*)'/;

interface MatchPointCuadro {
  Id: number;
  Nombre: string;
}

interface MatchPointHorarioFijo {
  Id: number;
  StrHoraInicio: string;
  StrHoraFin: string;
  StrHoraInicioMostrar: string;
  StrHoraFinMostrar: string;
  Minutos: number;
  Clickable: boolean;
  TextoAdicional: string;
}

interface MatchPointOcupacion {
  StrHoraInicio: string;
  StrHoraFin: string;
  Tipo: string;
  Texto1: string;
  Texto2: string;
}

export interface MatchPointColumna {
  Id: string;
  TextoPrincipal: string;
  TextoSecundario: string;
  HorariosFijos: MatchPointHorarioFijo[];
  Ocupaciones: MatchPointOcupacion[];
}

export interface MatchPointCuadroData {
  Id: number;
  Nombre: string;
  StrHoraInicio: string;
  StrHoraFin: string;
  StrFecha: string;
  TieneClienteAcceso: boolean;
  Columnas: MatchPointColumna[];
  PartesPorHora?: number;
}

async function getTokenAndCookies(domain: string): Promise<{ token: string; cookies: string }> {
  const url = `https://${domain}/Booking/Grid.aspx`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    redirect: 'follow',
  });

  if (!resp.ok) {
    throw new Error(`Grid.aspx returned ${resp.status}`);
  }

  const html = await resp.text();
  const match = html.match(TOKEN_REGEX);
  if (!match) {
    throw new Error('Could not extract token from Grid.aspx');
  }

  const setCookies = resp.headers.getSetCookie?.() ?? [];
  const cookies = setCookies
    .map((c) => c.split(';')[0])
    .join('; ');

  return { token: match[1], cookies };
}

async function obtenerCuadros(
  domain: string,
  token: string,
  cookies: string,
): Promise<MatchPointCuadro[]> {
  const url = `https://${domain}/booking/srvc.aspx/ObtenerCuadros`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: cookies,
      Referer: `https://${domain}/Booking/Grid.aspx`,
    },
    body: JSON.stringify({ key: token }),
  });

  if (!resp.ok) {
    throw new Error(`ObtenerCuadros returned ${resp.status}`);
  }

  const data = await resp.json();
  return data.d as MatchPointCuadro[];
}

async function obtenerCuadro(
  domain: string,
  idCuadro: number,
  fecha: string,
  token: string,
  cookies: string,
): Promise<MatchPointCuadroData> {
  const url = `https://${domain}/booking/srvc.aspx/ObtenerCuadro`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: cookies,
      Referer: `https://${domain}/Booking/Grid.aspx`,
    },
    body: JSON.stringify({ idCuadro, fecha, key: token }),
  });

  if (!resp.ok) {
    throw new Error(`ObtenerCuadro returned ${resp.status}`);
  }

  const data = await resp.json();
  return data.d as MatchPointCuadroData;
}

/**
 * Fetches availability for a given MatchPoint domain and date.
 * Date must be in YYYY-MM-DD format (converted internally to DD/MM/YYYY).
 */
export async function getAvailability(
  domain: string,
  dateISO: string,
): Promise<MatchPointCuadroData[]> {
  const { token, cookies } = await getTokenAndCookies(domain);

  const cuadros = await obtenerCuadros(domain, token, cookies);

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const [y, m, d] = dateISO.split('-');
  const fechaFormatted = `${d}/${m}/${y}`;

  const results: MatchPointCuadroData[] = [];
  for (const cuadro of cuadros) {
    const data = await obtenerCuadro(domain, cuadro.Id, fechaFormatted, token, cookies);
    if (data.TieneClienteAcceso && data.Columnas?.length > 0) {
      results.push(data);
    }
  }

  return results;
}
