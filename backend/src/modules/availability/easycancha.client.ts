const EC_BASE = 'https://www.easycancha.com/api';
const EC_HEADERS = {
  Origin: 'https://www.easycancha.com',
  Referer: 'https://www.easycancha.com/book',
  'User-Agent': 'Mozilla/5.0',
};

let cachedToken: string | null = null;
let tokenExp = 0;

function isTokenExpired(): boolean {
  if (!cachedToken) return true;
  return Date.now() / 1000 > tokenExp - 300; // refresh 5 min before expiry
}

async function login(): Promise<string> {
  const email = process.env.EASYCANCHA_EMAIL;
  const password = process.env.EASYCANCHA_PASSWORD;

  if (!email || !password) {
    throw new Error('EASYCANCHA_EMAIL and EASYCANCHA_PASSWORD env vars required');
  }

  const resp = await fetch(`${EC_BASE}/login`, {
    method: 'POST',
    headers: { ...EC_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await resp.json();
  if (data.error !== false || !data.token) {
    throw new Error(`EasyCancha login failed: ${data.msg || 'Unknown error'}`);
  }

  cachedToken = data.token;

  // Decode JWT payload to get expiration
  try {
    const payload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
    tokenExp = payload.exp || 0;
  } catch {
    tokenExp = Date.now() / 1000 + 3600; // fallback 1h
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
  freeSlots: Map<string, Set<string>>; // courtText → set of free start times
  allHours: string[];
  courts: Map<string, { slots: EasyCanchaSlot[] }>;
}

export async function getAvailability(clubId: number, dateISO: string): Promise<EasyCanchaResult> {
  const token = await getToken();

  const url = `${EC_BASE}/sports/7/clubs/${clubId}/timeslots?date=${dateISO}&time=00:00:00&timespan=60`;
  const resp = await fetch(url, {
    headers: { ...EC_HEADERS, Authorization: token },
  });

  const data = await resp.json();
  if (data.error !== false) {
    throw new Error(`EasyCancha timeslots failed: ${data.msg || 'Unknown error'}`);
  }

  const freeSlots = new Map<string, Set<string>>();
  const allHoursSet = new Set<string>();
  const courtsMap = new Map<string, { slots: EasyCanchaSlot[] }>();

  for (const block of data.alternative_timeslots || []) {
    const hora = (block.hour as string).slice(0, 5);
    allHoursSet.add(hora);

    for (const slot of block.timeslots || []) {
      const court = slot.courtText || 'Cancha ?';

      if (!freeSlots.has(court)) freeSlots.set(court, new Set());
      freeSlots.get(court)!.add(hora);

      if (!courtsMap.has(court)) courtsMap.set(court, { slots: [] });
      courtsMap.get(court)!.slots.push({
        courtText: court,
        courtId: slot.courtId,
        courtSort: slot.courtSort ?? 0,
        localStartTime: hora,
        localEndTime: (slot.local_end_time as string)?.slice(0, 5) ?? '',
        price: slot.priceInfo?.amount_formatted,
      });
    }
  }

  // Also process main timeslots
  for (const slot of data.timeslots || []) {
    const hora = (slot.local_start_time as string)?.slice(0, 5);
    if (!hora) continue;
    allHoursSet.add(hora);
    const court = slot.courtText || 'Cancha ?';
    if (!freeSlots.has(court)) freeSlots.set(court, new Set());
    freeSlots.get(court)!.add(hora);
  }

  const allHours = [...allHoursSet].sort();

  return { freeSlots, allHours, courts: courtsMap };
}
