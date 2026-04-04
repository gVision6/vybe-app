export const config = { runtime: 'edge' };

const FOURSQUARE_KEY   = (globalThis as any).FOURSQUARE_API_KEY   || '';
const EVENTBRITE_KEY   = (globalThis as any).EVENTBRITE_API_KEY   || '';
const TICKETMASTER_KEY = (globalThis as any).TICKETMASTER_API_KEY || '';

interface VybeCard {
  title: string;
  emoji: string;
  tag: string;
  why: string;
  cost: string;
  distance: string;
  location: string;
  duration: string;
  timeLocked: boolean;
  deal: string | null;
  hours: string;
  weather: string;
  description: string;
  isFreebie: boolean;
  tier: number;
  rating?: number;
  url?: string;
}

interface Inputs {
  mood: string;
  group: string;
  budget: string;
  timeframe: string;
  radius: string;
  cheapMode: boolean;
}

const RADIUS_MAP: Record<string, number> = {
  '15':  15000,
  '30':  25000,
  '60':  50000,
  '120': 100000,
};

const BUDGET_TIERS: Record<string, number[]> = {
  free:    [1],
  cheap:   [1, 2],
  mid:     [2, 3],
  splurge: [1, 2, 3, 4],
};

function getDateRange(timeframe: string): { start: string; end: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00Z`;
  const endOf = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59); return e; };

  switch (timeframe) {
    case 'now': {
      const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      return { start: fmt(now), end: fmt(end) };
    }
    case 'today':
      return { start: fmt(now), end: fmt(endOf(now)) };
    case 'tomorrow': {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      tom.setHours(0, 0, 0);
      return { start: fmt(tom), end: fmt(endOf(tom)) };
    }
    case 'weekend': {
      const day = now.getDay();
      const daysUntilFri = day <= 5 ? 5 - day : 6;
      const fri = new Date(now);
      fri.setDate(now.getDate() + daysUntilFri);
      fri.setHours(17, 0, 0);
      const sun = new Date(fri);
      sun.setDate(fri.getDate() + 2);
      sun.setHours(23, 59, 59);
      return { start: fmt(fri), end: fmt(sun) };
    }
    default:
      return { start: fmt(now), end: fmt(endOf(now)) };
  }
}

const MOOD_BOOST: Record<string, string[]> = {
  chill:     ['beach', 'park', 'cafe', 'scenic', 'garden', 'waterfront', 'nature'],
  adventure: ['outdoor', 'hiking', 'sports', 'tour', 'kayak', 'climbing', 'zipline'],
  romantic:  ['sunset', 'rooftop', 'fine dining', 'jazz', 'waterfront', 'scenic'],
  social:    ['bar', 'nightlife', 'festival', 'market', 'food hall', 'event', 'concert'],
  cultural:  ['museum', 'gallery', 'historic', 'art', 'theater', 'landmark', 'tour'],
  hungry:    ['restaurant', 'food', 'cafe', 'market', 'dining', 'brunch', 'bistro'],
};

const MOOD_SUPPRESS: Record<string, string[]> = {
  chill:     ['nightclub', 'sports bar', 'intense', 'racing'],
  adventure: ['spa', 'fine dining', 'shopping mall'],
  romantic:  ['sports bar', 'arcade', 'family entertainment'],
  social:    ['remote', 'solo', 'meditation'],
  cultural:  ['nightclub', 'sports bar', 'mall'],
  hungry:    [],
};

function getEmoji(category: string, tag: string): string {
  const c = (category + tag).toLowerCase();
  if (c.includes('beach') || c.includes('surf')) return '🏖️';
  if (c.includes('park') || c.includes('garden')) return '🌿';
  if (c.includes('trail') || c.includes('hike')) return '🥾';
  if (c.includes('museum') || c.includes('gallery')) return '🎨';
  if (c.includes('concert') || c.includes('music')) return '🎵';
  if (c.includes('sport') || c.includes('game')) return '🏟️';
  if (c.includes('food') || c.includes('restaurant')) return '🍽️';
  if (c.includes('bar') || c.includes('cocktail')) return '🍸';
  if (c.includes('cafe') || c.includes('coffee')) return '☕';
  if (c.includes('theater') || c.includes('show')) return '🎭';
  if (c.includes('festival') || c.includes('fair')) return '🎪';
  if (c.includes('market')) return '🛍️';
  if (c.includes('sunset') || c.includes('viewpoint')) return '🌅';
  if (c.includes('historic') || c.includes('landmark')) return '🏛️';
  if (c.includes('water') || c.includes('lake') || c.includes('river')) return '🌊';
  if (c.includes('night') || c.includes('club')) return '🌙';
  return '✨';
}

function getTag(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('restaurant') || c.includes('food') || c.includes('dining') || c.includes('cafe') || c.includes('bar') || c.includes('coffee')) return 'Food & Drink';
  if (c.includes('beach') || c.includes('surf') || c.includes('swim')) return 'Beach';
  if (c.includes('park') || c.includes('trail') || c.includes('hike') || c.includes('outdoor') || c.includes('nature')) return 'Outdoor';
  if (c.includes('museum') || c.includes('gallery') || c.includes('art') || c.includes('historic') || c.includes('landmark')) return 'Culture';
  if (c.includes('concert') || c.includes('music') || c.includes('theater') || c.includes('show') || c.includes('festival') || c.includes('event')) return 'Event';
  if (c.includes('night') || c.includes('club') || c.includes('lounge')) return 'Nightlife';
  if (c.includes('spa') || c.includes('wellness') || c.includes('yoga')) return 'Wellness';
  return 'Sightseeing';
}

function scoreResult(category: string, rating: number, mood: string, group: string): number {
  let score = rating * 10;
  const c = category.toLowerCase();
  const boosts = MOOD_BOOST[mood] || [];
  const suppresses = MOOD_SUPPRESS[mood] || [];
  boosts.forEach(b => { if (c.includes(b)) score += 15; });
  suppresses.forEach(s => { if (c.includes(s)) score -= 20; });
  if (group === 'family') {
    if (c.includes('nightclub') || c.includes('bar') || c.includes('cocktail')) score -= 30;
    if (c.includes('park') || c.includes('beach') || c.includes('museum')) score += 10;
  }
  if (group === 'solo') {
    if (c.includes('cafe') || c.includes('museum') || c.includes('gallery')) score += 10;
  }
  if (group === 'couple') {
    if (c.includes('sunset') || c.includes('rooftop') || c.includes('fine dining')) score += 15;
  }
  return score;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 2) return '< 5 min drive';
  if (km < 10) return `${Math.round(km * 2)} min drive`;
  if (km < 25) return `${Math.round(km * 1.5)} min drive`;
  if (km < 50) return `${Math.round(km * 1.2)} min drive`;
  return `${Math.round(km)} km away`;
}

async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VybeApp/1.0 (vybeapp-rho.vercel.app)' }
    });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function fetchFoursquare(
  lat: number, lng: number,
  radius: number, budget: string,
  mood: string, group: string
): Promise<VybeCard[]> {
  if (!FOURSQUARE_KEY) return [];
  const categoryMap: Record<string, string> = {
    chill:     '13065,16000,16032,16020',
    adventure: '18000,16000,18021,18032',
    romantic:  '13065,13002,16032,13338',
    social:    '13003,13002,13065,10000',
    cultural:  '10000,10027,10051,12000',
    hungry:    '13000,13002,13003,13065',
  };
  const categories = categoryMap[mood] || '13000,16000,10000';
  const priceTiers = BUDGET_TIERS[budget] || [1, 2, 3];
  const priceParam = priceTiers.join(',');
  try {
    const url = new URL('https://api.foursquare.com/v3/places/search');
    url.searchParams.set('ll', `${lat},${lng}`);
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('categories', categories);
    url.searchParams.set('price', priceParam);
    url.searchParams.set('sort', 'RATING');
    url.searchParams.set('limit', '20');
    url.searchParams.set('fields', 'name,categories,location,distance,rating,price,hours,photos,website,fsq_id');
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FOURSQUARE_KEY,
        'Accept': 'application/json',
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];
    return results.map((place: any, i: number) => {
      const category = place.categories?.[0]?.name || 'Venue';
      const tag = getTag(category);
      const rating = place.rating || 7.0;
      const price = place.price || 2;
      const isFreebie = price === 1 || budget === 'free';
      const score = scoreResult(category, rating / 2, mood, group);
      const distMeters = place.distance || 0;
      const costMap: Record<number, string> = {
        1: 'Under $15/person',
        2: '$15–40/person',
        3: '$40–80/person',
        4: '$80+/person',
      };
      return {
        title: place.name,
        emoji: getEmoji(category, tag),
        tag,
        why: `${(rating / 2).toFixed(1)}★ rated ${category.toLowerCase()} in ${place.location?.locality || place.location?.region || 'the area'}`,
        cost: isFreebie ? 'Free' : (costMap[price] || '$15–40/person'),
        distance: formatDistance(distMeters),
        location: place.location?.formatted_address || place.location?.locality || '',
        duration: tag === 'Food & Drink' ? '~1.5 hrs' : '~2 hrs',
        timeLocked: false,
        deal: null,
        hours: place.hours?.display || 'Check venue for hours',
        weather: '🏢 Indoor venue',
        description: `${place.name} is a ${category.toLowerCase()} with a ${(rating / 2).toFixed(1)} star rating. Located in ${place.location?.locality || 'the area'}.`,
        isFreebie,
        tier: i < 4 ? 1 : i < 12 ? 2 : 3,
        rating: rating / 2,
        url: place.website || '',
        _score: score,
      } as any;
    });
  } catch {
    return [];
  }
}

async function fetchEventbrite(
  lat: number, lng: number,
  radius: number, timeframe: string,
  mood: string
): Promise<VybeCard[]> {
  if (!EVENTBRITE_KEY) return [];
  const { start, end } = getDateRange(timeframe);
  const radiusKm = Math.round(radius / 1000);
  const keywordMap: Record<string, string> = {
    chill:     'outdoor relaxing nature',
    adventure: 'outdoor adventure sports',
    romantic:  'romantic dinner sunset',
    social:    'festival party social',
    cultural:  'art music culture',
    hungry:    'food festival market',
  };
  const keyword = keywordMap[mood] || 'event';
  try {
    const url = new URL('https://www.eventbriteapi.com/v3/events/search/');
    url.searchParams.set('location.latitude', String(lat));
    url.searchParams.set('location.longitude', String(lng));
    url.searchParams.set('location.within', `${radiusKm}km`);
    url.searchParams.set('start_date.range_start', start);
    url.searchParams.set('start_date.range_end', end);
    url.searchParams.set('q', keyword);
    url.searchParams.set('sort_by', 'best');
    url.searchParams.set('expand', 'venue,ticket_availability');
    url.searchParams.set('page_size', '15');
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_KEY}`,
        'Accept': 'application/json',
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events = data.events || [];
    return events.map((event: any, i: number) => {
      const isFree = event.is_free || false;
      const minPrice = event.ticket_availability?.minimum_ticket_price?.major_value;
      const costStr = isFree ? 'Free' : minPrice ? `From $${minPrice}/person` : 'See event for pricing';
      const venueName = event.venue?.name || '';
      const venueCity = event.venue?.address?.city || '';
      const startDate = new Date(event.start?.local || '');
      const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return {
        title: event.name?.text || 'Local Event',
        emoji: '🎭',
        tag: 'Event',
        why: `Happening ${timeframe === 'now' ? 'right now' : timeframe === 'today' ? 'today' : timeframe === 'tomorrow' ? 'tomorrow' : 'this weekend'} near you`,
        cost: costStr,
        distance: 'Nearby',
        location: venueName ? `${venueName}, ${venueCity}` : venueCity,
        duration: '~2 hrs',
        timeLocked: true,
        deal: isFree ? '🎁 Free event' : null,
        hours: `${timeStr} start`,
        weather: '📅 Scheduled event',
        description: (event.description?.text || event.name?.text || 'Local event').slice(0, 120) + '...',
        isFreebie: isFree,
        tier: i < 2 ? 1 : i < 6 ? 2 : 3,
        rating: 4.0,
        url: event.url || '',
        _score: isFree ? 60 : 50,
      } as any;
    });
  } catch {
    return [];
  }
}

async function fetchTicketmaster(
  lat: number, lng: number,
  radius: number, timeframe: string
): Promise<VybeCard[]> {
  if (!TICKETMASTER_KEY) return [];
  const { start, end } = getDateRange(timeframe);
  const radiusKm = Math.round(radius / 1000);
  try {
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', TICKETMASTER_KEY);
    url.searchParams.set('latlong', `${lat},${lng}`);
    url.searchParams.set('radius', String(radiusKm));
    url.searchParams.set('unit', 'km');
    url.searchParams.set('startDateTime', start);
    url.searchParams.set('endDateTime', end);
    url.searchParams.set('size', '10');
    url.searchParams.set('sort', 'relevance,desc');
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = await res.json();
    const events = data._embedded?.events || [];
    return events.map((event: any, i: number) => {
      const minPrice = event.priceRanges?.[0]?.min;
      const costStr = minPrice ? `From $${Math.round(minPrice)}/person` : 'See event for pricing';
      const venue = event._embedded?.venues?.[0];
      const venueName = venue?.name || '';
      const venueCity = venue?.city?.name || '';
      const timeStr = event.dates?.start?.localTime
        ? new Date(`2000-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'Check event';
      const segment = event.classifications?.[0]?.segment?.name || 'Entertainment';
      const emoji = segment === 'Music' ? '🎵' : segment === 'Sports' ? '🏟️' : '🎭';
      return {
        title: event.name,
        emoji,
        tag: 'Event',
        why: `${segment} event at ${venueName || 'local venue'} — tickets available now`,
        cost: costStr,
        distance: venueName ? `At ${venueName}` : 'Nearby',
        location: venueName ? `${venueName}, ${venueCity}` : venueCity,
        duration: '~2.5 hrs',
        timeLocked: true,
        deal: null,
        hours: `${timeStr} start`,
        weather: '🎟️ Indoor venue',
        description: `${event.name} — a live ${segment.toLowerCase()} event${venueName ? ` at ${venueName}` : ''}. ${costStr}.`,
        isFreebie: false,
        tier: i < 2 ? 1 : i < 5 ? 2 : 3,
        rating: 4.5,
        url: event.url || '',
        _score: 55,
      } as any;
    });
  } catch {
    return [];
  }
}

async function fetchOpenStreetMap(
  lat: number, lng: number,
  radius: number, mood: string
): Promise<VybeCard[]> {
  const tagFilters: Record<string, string> = {
    chill:     '(node["leisure"="beach"](around);node["natural"="beach"](around);node["leisure"="park"]["name"](around);node["tourism"="viewpoint"](around);)',
    adventure: '(node["leisure"="nature_reserve"](around);node["natural"="peak"](around);node["tourism"="attraction"]["name"](around);way["leisure"="nature_reserve"](around);)',
    romantic:  '(node["tourism"="viewpoint"](around);node["natural"="beach"](around);node["leisure"="beach"](around);)',
    social:    '(node["leisure"="park"]["name"](around);node["tourism"="attraction"]["name"](around);node["amenity"="marketplace"](around);)',
    cultural:  '(node["tourism"="museum"]["name"](around);node["historic"]["name"](around);node["tourism"="attraction"]["name"](around);)',
    hungry:    '(node["amenity"="marketplace"]["name"](around);node["leisure"="park"]["name"](around);)',
  };
  const filter = tagFilters[mood] || tagFilters.chill;
  const query = `[out:json][timeout:10];${filter.replace(/\(around\)/g, `(around:${radius},${lat},${lng})`)};out body 20;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const elements = (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .filter((el: any) => !el.tags?.name?.match(/^(parking|lot|garage|toilet|restroom)/i));
    const withDistance = elements.map((el: any) => {
      const elLat = el.lat || el.center?.lat || lat;
      const elLng = el.lon || el.center?.lon || lng;
      const dLat = (elLat - lat) * 111000;
      const dLng = (elLng - lng) * 111000 * Math.cos(lat * Math.PI / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return { ...el, _dist: dist };
    });
    withDistance.sort((a: any, b: any) => a._dist - b._dist);
    const top = withDistance.slice(0, 15);
    return top.map((el: any, i: number) => {
      const tags = el.tags || {};
      const name = tags.name || 'Natural Area';
      let category = 'Outdoor';
      let emoji = '🌿';
      if (tags.natural === 'beach' || tags.leisure === 'beach') { category = 'Beach'; emoji = '🏖️'; }
      else if (tags.natural === 'peak') { category = 'Outdoor'; emoji = '⛰️'; }
      else if (tags.tourism === 'viewpoint') { category = 'Sightseeing'; emoji = '🌅'; }
      else if (tags.tourism === 'museum') { category = 'Culture'; emoji = '🏛️'; }
      else if (tags.historic) { category = 'Culture'; emoji = '🏛️'; }
      else if (tags.leisure === 'park') { category = 'Outdoor'; emoji = '🌿'; }
      else if (tags.amenity === 'marketplace') { category = 'Food & Drink'; emoji = '🛍️'; }
      const isFreebie = !tags.fee || tags.fee === 'no';
      const dist = el._dist || 0;
      const hasWikipedia = !!tags.wikipedia || !!tags['wikidata'];
      const qualityBonus = hasWikipedia ? 20 : 0;
      const score = scoreResult(category, 3.5, mood, 'couple') + qualityBonus;
      return {
        title: name,
        emoji,
        tag: getTag(category),
        why: `${category} spot ${formatDistance(dist)} away — ${isFreebie ? 'completely free' : 'admission may apply'}`,
        cost: isFreebie ? 'Free' : (tags.fee ? `Fee: ${tags.fee}` : 'Free'),
        distance: formatDistance(dist),
        location: tags['addr:city'] || tags['addr:state'] || '',
        duration: category === 'Beach' ? '~2 hrs' : '~1.5 hrs',
        timeLocked: false,
        deal: isFreebie ? '🌿 Free outdoor spot' : null,
        hours: tags.opening_hours || 'Always accessible',
        weather: category === 'Beach' || category === 'Outdoor' ? '☀️ Best in good weather' : '🏛️ Any weather',
        description: `${name} is a ${category.toLowerCase()} area${tags['addr:city'] ? ` in ${tags['addr:city']}` : ''}. ${isFreebie ? 'Free to visit.' : ''}${hasWikipedia ? ' A notable local landmark.' : ''}`,
        isFreebie,
        tier: i < 3 ? 2 : 3,
        rating: hasWikipedia ? 4.0 : 3.5,
        url: tags.website || tags.url || '',
        _score: score,
      } as any;
    });
  } catch {
    return [];
  }
}

function rankAndTier(results: any[], budget: string): VybeCard[] {
  results.sort((a, b) => (b._score || 0) - (a._score || 0));
  const tier1: any[] = [];
  const slots = ['Food & Drink', 'Event', 'Outdoor', null];
  for (const slot of slots) {
    if (tier1.length >= 4) break;
    const match = results.find(r => !tier1.includes(r) && (slot === null || r.tag === slot));
    if (match) tier1.push(match);
  }
  for (const r of results) {
    if (tier1.length >= 4) break;
    if (!tier1.includes(r)) tier1.push(r);
  }
  const rest = results.filter(r => !tier1.includes(r));
  const tier2 = rest.slice(0, 10);
  const tier3 = rest.slice(10);
  const final: VybeCard[] = [
    ...tier1.map(r => ({ ...r, tier: 1 })),
    ...tier2.map(r => ({ ...r, tier: 2 })),
    ...tier3.map(r => ({ ...r, tier: 3 })),
  ];
  return final.map(card => {
    const c = (card.cost || '').toLowerCase();
    const isFree = c === 'free';
    const isExp = c.includes('80') || c.includes('$$$');
    if (isFree && budget !== 'free') {
      (card as any).deal = (card as any).deal || '🎁 This one\'s on the house';
    }
    if ((budget === 'cheap' || budget === 'mid') && isExp) {
      (card as any).deal = (card as any).deal || '✨ Worth the splurge';
    }
    return card;
  });
}

function getEmptyMessage(mood: string): string {
  const messages: Record<string, string> = {
    chill:     "Even the beach took a day off. 🦴 Vybe looked everywhere but came up empty for your current filters.",
    adventure: "The trails are quiet... suspiciously quiet. 🦴 Nothing matched your adventure specs right now.",
    romantic:  "The sunset waited but nothing showed up. 🦴 Vybe couldn't find your perfect romantic spot with these filters.",
    social:    "The party's somewhere else tonight. 🦴 Nothing matched your social vibe with these filters.",
    cultural:  "The museums are hiding. 🦴 Vybe searched every corner but found nothing matching your cultural mood.",
    hungry:    "Even the skeleton is hungry. 🦴 Nothing matched your food cravings with these filters.",
  };
  return messages[mood] || "🦴 Vybe came up empty. The skeleton has been waiting forever and still found nothing.";
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const { inputs, cityName, page, weatherInfo } = await req.json() as {
      inputs: Inputs;
      cityName: string;
      page: number;
      weatherInfo: string;
    };

    const coords = await geocodeCity(cityName);
    if (!coords) {
      return new Response(JSON.stringify({
        error: 'city_not_found',
        message: `Couldn't find "${cityName}" on the map. Try a different city name.`,
        empty: true,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const { lat, lng } = coords;
    const radius = RADIUS_MAP[inputs.radius] || 25000;

    const [fsqResults, ebResults, tmResults, osmResults] = await Promise.allSettled([
      fetchFoursquare(lat, lng, radius, inputs.budget, inputs.mood, inputs.group),
      fetchEventbrite(lat, lng, radius, inputs.timeframe, inputs.mood),
      fetchTicketmaster(lat, lng, radius, inputs.timeframe),
      fetchOpenStreetMap(lat, lng, radius, inputs.mood),
    ]);

    const foursquare   = fsqResults.status  === 'fulfilled' ? fsqResults.value  : [];
    const eventbrite   = ebResults.status   === 'fulfilled' ? ebResults.value   : [];
    const ticketmaster = tmResults.status   === 'fulfilled' ? tmResults.value   : [];
    const osm          = osmResults.status  === 'fulfilled' ? osmResults.value  : [];

    let all = [...foursquare, ...eventbrite, ...ticketmaster, ...osm];

    if (inputs.budget === 'free') {
      all = all.filter(r => (r as any).isFreebie || (r.cost || '').toLowerCase() === 'free');
    }

    if (inputs.cheapMode) {
      all.sort((a, b) => {
        const aFree = a.isFreebie ? 1 : 0;
        const bFree = b.isFreebie ? 1 : 0;
        return bFree - aFree;
      });
    }

    if (all.length === 0) {
      return new Response(JSON.stringify({
        empty: true,
        message: getEmptyMessage(inputs.mood),
        cards: [],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const ranked = rankAndTier(all, inputs.budget);

    let response: VybeCard[];
    if (page === 0) {
      response = ranked.filter(r => r.tier <= 2);
    } else {
      response = ranked.filter(r => r.tier === 3);
    }

    const clean = response.map(({ ...r }) => {
      delete (r as any)._score;
      delete (r as any)._dist;
      return r;
    });

    return new Response(JSON.stringify(clean), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      error: err.message,
      empty: true,
      cards: [],
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
