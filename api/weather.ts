export const config = { runtime: 'edge' };

const WEATHER_KEY = (globalThis as any).OPENWEATHER_API_KEY || '';

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get('city') || '';
  if (!city) return new Response(JSON.stringify({summary:''}), { headers: {'Content-Type':'application/json'} });
  if (!WEATHER_KEY) return new Response(JSON.stringify({summary:''}), { headers: {'Content-Type':'application/json'} });
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=imperial`);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const summary = `${temp}°F, ${desc} in ${data.name}`;
    return new Response(JSON.stringify({summary}), { headers: {'Content-Type':'application/json'} });
  } catch {
    return new Response(JSON.stringify({summary:''}), { headers: {'Content-Type':'application/json'} });
  }
}
