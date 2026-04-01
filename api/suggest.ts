export const config = { runtime: 'edge' };

const ANTHROPIC_KEY = (globalThis as any).ANTHROPIC_API_KEY || '';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { inputs, cityName, page, weatherInfo } = await req.json();
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }
    const moodLabels: Record<string,string> = {chill:"Chill",adventure:"Adventure",romantic:"Romantic",social:"Social",cultural:"Cultural",hungry:"Hungry"};
    const budgetLabels: Record<string,string> = {free:"Free only",cheap:"Under $30",mid:"$30–80",splurge:"$80+"};
    const radiusLabels: Record<string,string> = {"15":"15 min drive","30":"30 min drive","60":"1 hour drive","120":"2 hours drive"};
    const groupLabels: Record<string,string> = {solo:"solo traveler",couple:"a couple",friends:"friends group",family:"family with children"};
    const weatherNote = weatherInfo ? `Current weather: ${weatherInfo}.` : '';
    const count = page === 0 ? 12 : 8;
    const tierNote = page === 0 ? 'Mark top 4 as tier:1, next 8 as tier:2' : 'Mark all as tier:3';
    const prompt = `You are Vybe, a lifestyle agent crafting perfect days.

Location: ${cityName}
Who: ${groupLabels[inputs.group]||inputs.group}
Mood: ${moodLabels[inputs.mood]||inputs.mood}
Budget: ${budgetLabels[inputs.budget]||inputs.budget}
Radius: ${radiusLabels[inputs.radius]||inputs.radius}
Time: ${inputs.timeframe}
${weatherNote}
${inputs.cheapMode?'Do It Cheaply mode: prioritize free and discounted options.':''}

Mix anchor experiences (restaurants, tours, events) with curated freebies (beaches, viewpoints, historic walks). Freebies must be genuinely popular or beautiful.

${inputs.budget==='free'?'ALL suggestions must be free.':'Use budget as guidance, not a hard wall.'}

Return exactly ${count} suggestions. ${tierNote}.

Return ONLY a JSON array:
[{"title":"...","emoji":"...","tag":"Outdoor|Food & Drink|Sightseeing|Event|Culture|Beach|Nightlife|Wellness|Freebie","why":"...","cost":"Free OR $X–Y/person","distance":"X min drive","location":"area, city","duration":"~X hrs","timeLocked":false,"deal":null,"hours":"...","weather":"...","description":"2 sentences","isFreebie":false,"tier":1}]`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
    const data = await res.json();
    const text = data.content.map((b: any) => b.text || '').join('').trim();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
