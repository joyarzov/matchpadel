import https from 'node:https';

const EC_BASE = 'https://www.easycancha.com/api';

let cachedToken: string | null = null;
let tokenExp = 0;

function isTokenExpired(): boolean {
  if (!cachedToken) return true;
  return Date.now() / 1000 > tokenExp - 300;
}

function httpsRequest(url: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        Origin: 'https://www.easycancha.com',
        Referer: 'https://www.easycancha.com/book',
        'User-Agent': 'Mozilla/5.0',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function login(): Promise<string> {
  const email = process.env.EASYCANCHA_EMAIL;
  const password = process.env.EASYCANCHA_PASSWORD;

  if (!email || !password) {
    throw new Error('EASYCANCHA_EMAIL and EASYCANCHA_PASSWORD env vars required');
  }

  const resp = await httpsRequest(`${EC_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (resp.status !== 200) {
    throw new Error(`EasyCancha login returned ${resp.status}: ${resp.body}`);
  }

  const data = JSON.parse(resp.body);
  if (data.error !== false || !data.token) {
    throw new Error(`EasyCancha login failed: ${data.msg || 'Unknown error'}`);
  }

  cachedToken = data.token;

  try {
    const payload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
    tokenExp = payload.exp || 0;
  } catch {
    tokenExp = Date.now() / 1000 + 3600;
  }

  return data.token;
}

async function getToken(): Promise<string> {
  if (!isTokenExpired() && cachedToken) return cachedToken;
  return login();
}

export interface EasyCanchaSlot {
  courtText: string;
  courtId: number;
  courtSort: number;
  localStartTime: string;
  localEndTime: string;
  price?: string;
}

export interface EasyCanchaResult {
  freeSlots: Map<string, Set<string>>;
  allHours: string[];
}

export async function getAvailability(clubId: number, dateISO: string): Promise<EasyCanchaResult> {
  const token = await getToken();

  const url = `${EC_BASE}/sports/7/clubs/${clubId}/timeslots?date=${dateISO}&time=00:00:00&timespan=60`;
  const resp = await httpsRequest(url, {
    headers: { Authorization: token },
  });

  if (resp.status !== 200) {
    throw new Error(`EasyCancha timeslots returned ${resp.status}: ${resp.body}`);
  }

  const data = JSON.parse(resp.body);
  if (data.error !== false) {
    throw new Error(`EasyCancha timeslots failed: ${data.msg || 'Unknown error'}`);
  }

  const freeSlots = new Map<string, Set<string>>();
  const allHoursSet = new Set<string>();

  for (const block of data.alternative_timeslots || []) {
    const hora = (block.hour as string).slice(0, 5);
    allHoursSet.add(hora);

    for (const slot of block.timeslots || []) {
      const court = slot.courtText || 'Cancha ?';
      if (!freeSlots.has(court)) freeSlots.set(court, new Set());
      freeSlots.get(court)!.add(hora);
    }
  }

  for (const slot of data.timeslots || []) {
    const hora = (slot.local_start_time as string)?.slice(0, 5);
    if (!hora) continue;
    allHoursSet.add(hora);
    const court = slot.courtText || 'Cancha ?';
    if (!freeSlots.has(court)) freeSlots.set(court, new Set());
    freeSlots.get(court)!.add(hora);
  }

  const allHours = [...allHoursSet].sort();

  return { freeSlots, allHours };
}
