import { useState, useEffect, useCallback } from "react";

const paletteOptions = [
  { id:"default", name:"Default", bg:"#F8F6F2", surface:"#FFFFFF", border:"#E8E2D9", text:"#1A1714", textMuted:"#8A8075", textLight:"#C0B8B0", accent:"#FFAB76", accentSoft:"#FFF5ED", grad:["#EAF4F8","#F0EBF8","#F8F2E8"] },
  { id:"ocean",   name:"Ocean",   bg:"#EEF6FB", surface:"#F8FCFF", border:"#C8DFF0", text:"#0D2D3D", textMuted:"#4A7A90", textLight:"#8AB4C8", accent:"#2DA8D8", accentSoft:"#D8F0FA", grad:["#D8EEF8","#E4F2FC","#CCE8F4"] },
  { id:"bloom",   name:"Bloom",   bg:"#FBF0F4", surface:"#FFF8FA", border:"#F0D0DC", text:"#3D0D1E", textMuted:"#904A6A", textLight:"#C890A8", accent:"#E8609A", accentSoft:"#FAD8E8", grad:["#F8D8E8","#FCE4EE","#F4CCD8"] },
  { id:"grove",   name:"Grove",   bg:"#EEF8F2", surface:"#F6FCF8", border:"#C0DFCC", text:"#0D2D1A", textMuted:"#3D7A52", textLight:"#80B894", accent:"#2DBE6C", accentSoft:"#C8F0D8", grad:["#C8EED8","#D8F4E4","#BCE8CC"] },
  { id:"dusk",    name:"Dusk",    bg:"#F4F0FC", surface:"#FAF8FF", border:"#DDD0F0", text:"#1A0D3D", textMuted:"#6A4A90", textLight:"#A890C8", accent:"#8A60E8", accentSoft:"#E8D8FA", grad:["#E4D8F8","#EEE4FC","#D8CCF4"] },
  { id:"sand",    name:"Sand",    bg:"#FAF5EE", surface:"#FFFCF8", border:"#E8D8C4", text:"#2D1A0D", textMuted:"#8A6A4A", textLight:"#C0A080", accent:"#C87840", accentSoft:"#F4E4D0", grad:["#F0E4D0","#F8EEE0","#EADCC8"] },
  { id:"citrus",  name:"Citrus",  bg:"#FDFAF0", surface:"#FFFEF8", border:"#EEE4B8", text:"#2D2A0D", textMuted:"#8A7A2A", textLight:"#C0B460", accent:"#D4A820", accentSoft:"#FAF0C0", grad:["#F4ECC0","#FAF4D0","#EEEAB8"] },
];
const darkBase = { bg:"#111010", surface:"#1E1C1B", border:"#2E2B29", text:"#F0EDE8", textMuted:"#8A8075", textLight:"#4A4540" };

const TIME_BANDS = [
  { id:"morning",   label:"Morning",   icon:"☀️",  time:"6am–12pm",  bg:"rgba(255,200,100,0.11)", activeBg:"rgba(255,200,100,0.26)", border:"rgba(255,180,80,0.28)"  },
  { id:"afternoon", label:"Afternoon", icon:"🌤️", time:"12pm–6pm",   bg:"rgba(118,200,255,0.11)", activeBg:"rgba(118,200,255,0.26)", border:"rgba(90,180,255,0.28)"  },
  { id:"evening",   label:"Evening",   icon:"🌙",  time:"6pm–12am",  bg:"rgba(167,139,250,0.11)", activeBg:"rgba(167,139,250,0.26)", border:"rgba(150,120,240,0.28)" },
];

const moods     = [{id:"chill",emoji:"🌿",label:"Chill"},{id:"adventure",emoji:"🧗",label:"Adventure"},{id:"romantic",emoji:"🌸",label:"Romantic"},{id:"social",emoji:"🎉",label:"Social"},{id:"cultural",emoji:"🎨",label:"Cultural"},{id:"hungry",emoji:"🍽️",label:"Hungry"}];
const groups    = [{id:"solo",emoji:"🧍",label:"Solo"},{id:"couple",emoji:"👫",label:"Us two"},{id:"friends",emoji:"👯",label:"Friends"},{id:"family",emoji:"👨‍👩‍👧",label:"Family"}];
const budgets   = [{id:"free",label:"Free",sub:"No spend"},{id:"cheap",label:"$",sub:"Under $30"},{id:"mid",label:"$$",sub:"$30–80"},{id:"splurge",label:"$$$",sub:"Go big"}];
const timeframes= [{id:"now",label:"Right now"},{id:"today",label:"Today"},{id:"tomorrow",label:"Tomorrow"},{id:"weekend",label:"Weekend"}];
const radii     = [{id:"15",label:"15 min",sub:"Nearby"},{id:"30",label:"30 min",sub:"Close by"},{id:"60",label:"1 hr",sub:"Day trip"},{id:"120",label:"2+ hrs",sub:"Adventure"}];

const budgetLabel = (id:string) => ({free:"Free only",cheap:"Under $30 per person",mid:"$30–80 per person",splurge:"$80+ per person"}[id]||id);
const radiusLabel = (id:string) => ({15:"15 minute drive",30:"30 minute drive",60:"1 hour drive",120:"up to 2 hours drive"}[id]||id);
const groupLabel  = (id:string) => ({solo:"solo traveler",couple:"a couple",friends:"a group of friends",family:"a family with children"}[id]||id);
const timeLabel   = (id:string) => ({now:"right now",today:"sometime today",tomorrow:"tomorrow",weekend:"this weekend"}[id]||id);

function defaultBand(card:any) {
  const tag=(card.tag||"").toLowerCase();
  if(card.timeLocked||["event","night","sunset","evening","show","dinner"].some((k:string)=>tag.includes(k))) return "evening";
  if(["breakfast","brunch","morning","market","sunrise"].some((k:string)=>tag.includes(k))) return "morning";
  return "afternoon";
}
function isTimeLocked(card:any){return !!card.timeLocked;}
function cardKey(card:any){return card.id||card.title;}

function getBudgetBadge(card:any, budget:string) {
  const c=(card.cost||"").toLowerCase();
  const isFree=c==="free";
  const isExp=c.includes("$$$")||["80","90","100","120"].some((n:string)=>c.includes(n));
  const isCheap=isFree||["$10","$12","$15","$20"].some((n:string)=>c.includes(n));
  if(budget==="free") return null;
  if(isFree&&budget!=="free") return {text:"🎁 This one's on the house",color:"#2DBE6C",bg:"#C8F0D8"};
  if((budget==="cheap"||budget==="mid")&&isExp) return {text:"✨ Worth the splurge",color:"#C87840",bg:"#F4E4D0"};
  if(budget==="splurge"&&isCheap) return {text:"🎁 Bonus freebie",color:"#2DBE6C",bg:"#C8F0D8"};
  if(card.deal) return {text:"🔥 Deal right now",color:"#E8609A",bg:"#FAD8E8"};
  return null;
}

async function fetchVybeSuggestions(inputs:any, cityName:string, page=0, weatherInfo:string="") {
  try {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs, cityName, page, weatherInfo })
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    await new Promise(r => setTimeout(r, page===0?2000:1200));
    return getMock(inputs, cityName, page);
  }
}

async function fetchWeather(cityName:string): Promise<string> {
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    if (!res.ok) return "";
    const data = await res.json();
    return data.summary || "";
  } catch {
    return "";
  }
}

const MOCK:any = {
  default:{
    romantic:[
      {title:"Sunset at Cabo Rojo Lighthouse",emoji:"🌅",tag:"Freebie",why:"One of the most romantic sunsets in the Caribbean — free, iconic, and unforgettable for two.",cost:"Free",distance:"1 hr 45 min drive",location:"Cabo Rojo, PR",duration:"~2 hrs",timeLocked:true,deal:null,hours:"Always accessible",weather:"🌅 Golden hour magic",description:"The westernmost point of Puerto Rico, where dramatic red cliffs drop into turquoise water and the lighthouse glows amber.",isFreebie:true,tier:1},
      {title:"La Factoria Cocktail Bar",emoji:"🍸",tag:"Nightlife",why:"Hidden behind an unmarked door — intimate, dim, and made for a couple with good taste.",cost:"$20–35/person",distance:"22 min drive",location:"Old San Juan, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"6pm–3am",weather:"🌙 Perfect evening",description:"One of the best cocktail bars in the Caribbean, a labyrinth of intimate rooms with live jazz and expertly crafted drinks.",isFreebie:false,tier:1},
      {title:"Paseo de la Princesa Walk",emoji:"🌹",tag:"Freebie",why:"Free, beautiful, and completely unhurried — the most romantic evening walk in San Juan.",cost:"Free",distance:"22 min drive",location:"Old San Juan, PR",duration:"~1 hr",timeLocked:false,deal:null,hours:"Always open",weather:"🌆 Lovely at dusk",description:"A tree-lined promenade hugging the ancient city walls above the bay.",isFreebie:true,tier:1},
      {title:"Marmalade Restaurant",emoji:"🍽️",tag:"Food & Drink",why:"The most intimate fine dining in San Juan — worth every penny for a special night.",cost:"$60–90/person",distance:"22 min drive",location:"Old San Juan, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"6pm–11pm",weather:"🌙 Indoor, candlelit",description:"A candlelit gem in a colonial building serving creative contemporary cuisine.",isFreebie:false,tier:1},
      {title:"Sunset Catamaran Sail",emoji:"⛵",tag:"Event",why:"Watching the sun set over the Atlantic together from a sailboat.",cost:"$65–80/person",distance:"18 min drive",location:"San Juan Bay, PR",duration:"~2.5 hrs",timeLocked:true,deal:null,hours:"Departs 4:30pm daily",weather:"☀️ Best in clear skies",description:"Sail along the San Juan coastline as the sky turns gold and pink behind El Morro.",isFreebie:false,tier:2},
      {title:"El Morro Fortress at Dusk",emoji:"⚓",tag:"Freebie",why:"The most dramatic free viewpoint in PR — the Atlantic stretches endlessly from the walls.",cost:"Free",distance:"22 min drive",location:"Old San Juan, PR",duration:"~1 hr",timeLocked:false,deal:null,hours:"Always accessible",weather:"🌅 Stunning at sunset",description:"The 16th-century fortress guards the entrance to San Juan Bay.",isFreebie:true,tier:2},
    ],
    chill:[
      {title:"Luquillo Beach & Kiosks",emoji:"🏖️",tag:"Freebie",why:"The most beautiful and chill beach on the island — calm water, palms, legendary kiosks.",cost:"Free (kiosks $10–20)",distance:"40 min drive",location:"Luquillo, PR",duration:"~3 hrs",timeLocked:false,deal:null,hours:"Always open",weather:"🌊 Calm, sheltered bay",description:"Luquillo's crescent bay stays glass-calm year-round.",isFreebie:true,tier:1},
      {title:"Santaella Restaurant Lunch",emoji:"🌿",tag:"Food & Drink",why:"Beautiful garden courtyard, unhurried service, and the best farm-to-table PR cuisine.",cost:"$25–40/person",distance:"15 min drive",location:"Santurce, PR",duration:"~1.5 hrs",timeLocked:false,deal:null,hours:"12pm–10pm",weather:"🌿 Garden patio",description:"Chef Santaella's flagship centers around a lush open courtyard that feels like a secret garden.",isFreebie:false,tier:1},
      {title:"Old San Juan Morning Walk",emoji:"🏛️",tag:"Freebie",why:"Five centuries of history on foot — the blue cobblestones and ocean views cost nothing.",cost:"Free",distance:"22 min drive",location:"Old San Juan, PR",duration:"~1.5 hrs",timeLocked:false,deal:null,hours:"Always open",weather:"☀️ Best in the morning",description:"Wander the 500-year-old streets of one of the oldest European settlements in the Americas.",isFreebie:true,tier:1},
      {title:"Cueva Ventana Viewpoint",emoji:"🪟",tag:"Sightseeing",why:"A natural cave window framing the entire central valley — peaceful and stunning.",cost:"$12/person",distance:"1 hr drive",location:"Arecibo, PR",duration:"~1.5 hrs",timeLocked:false,deal:null,hours:"Wed–Sun 8am–4pm",weather:"☀️ Best in morning light",description:"A natural cave window carved into limestone reveals a breathtaking panorama.",isFreebie:false,tier:1},
    ],
    adventure:[
      {title:"El Yunque Rainforest & La Mina Falls",emoji:"🌊",tag:"Outdoor",why:"The only tropical rainforest in the US National Forest — real adventure.",cost:"$2 entry",distance:"45 min drive",location:"El Yunque, PR",duration:"~3 hrs",timeLocked:false,deal:null,hours:"7:30am–5pm",weather:"☀️ Always lush",description:"Hike through a real tropical rainforest to La Mina Falls, a 35-foot cascade you can swim in.",isFreebie:false,tier:1},
      {title:"Crash Boat Beach",emoji:"🏄",tag:"Freebie",why:"One of the most stunning free beaches on the island.",cost:"Free",distance:"1 hr 45 min drive",location:"Aguadilla, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Always open",weather:"🌊 Best waves in PR",description:"A brilliant turquoise bay framed by an old military pier, beloved by surfers.",isFreebie:true,tier:1},
      {title:"Bio Bay Kayaking, Vieques",emoji:"✨",tag:"Event",why:"One of the rarest natural phenomena on Earth — the bay glows electric blue.",cost:"$45–65/person",distance:"2 hrs + ferry",location:"Mosquito Bay, Vieques",duration:"~4 hrs",timeLocked:true,deal:null,hours:"Tours at dusk",weather:"🌙 Best moonless nights",description:"Kayak through water that lights up electric blue with every stroke.",isFreebie:false,tier:1},
      {title:"Cañón San Cristóbal Hike",emoji:"🏔️",tag:"Freebie",why:"Puerto Rico's deepest canyon — a hidden gem most tourists never find.",cost:"Free",distance:"1 hr drive",location:"Barranquitas, PR",duration:"~3 hrs",timeLocked:false,deal:null,hours:"Always accessible",weather:"☀️ Cool canyon temps",description:"The deepest canyon in the Caribbean with swimming holes and waterfalls.",isFreebie:true,tier:1},
    ],
    social:[
      {title:"La Placita de Santurce",emoji:"🎉",tag:"Nightlife",why:"The beating heart of San Juan nightlife.",cost:"$15–30/person",distance:"15 min drive",location:"Santurce, PR",duration:"~3 hrs",timeLocked:false,deal:"🔥 Happy hour 5–7pm",hours:"Best after 7pm",weather:"🌙 Outdoor square",description:"A public square that transforms into a massive open-air party Thursday through Sunday.",isFreebie:false,tier:1},
      {title:"Calle Loíza Bar & Food Crawl",emoji:"🍹",tag:"Freebie",why:"San Juan's hippest street — walk it freely.",cost:"Free to walk",distance:"10 min drive",location:"Ocean Park, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Restaurants noon onwards",weather:"🌆 Walkable, lovely evening",description:"Calle Loíza is where San Juan's creative class eats, drinks, and gathers.",isFreebie:true,tier:1},
      {title:"Noche de Galería Art Walk",emoji:"🎭",tag:"Event",why:"Monthly art walk — free wine, open galleries, live art.",cost:"Free",distance:"20 min drive",location:"Miramar, PR",duration:"~2 hrs",timeLocked:true,deal:"✨ Monthly event",hours:"7pm–11pm only",weather:"🌙 Evening event",description:"A beloved monthly tradition where Miramar's galleries open simultaneously.",isFreebie:true,tier:1},
      {title:"Lote 23 Food Truck Park",emoji:"🚚",tag:"Food & Drink",why:"San Juan's best food trucks in one vibrant space.",cost:"$10–25/person",distance:"12 min drive",location:"Santurce, PR",duration:"~1.5 hrs",timeLocked:false,deal:null,hours:"Wed–Sun 12pm–10pm",weather:"🌆 Outdoor, covered areas",description:"A curated collection of the city's best food trucks.",isFreebie:false,tier:1},
    ],
    cultural:[
      {title:"El Morro & San Cristóbal Fortresses",emoji:"⚓",tag:"Freebie",why:"Two of the most extraordinary fortifications in the Americas.",cost:"Free (exterior)",distance:"22 min drive",location:"Old San Juan, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Always accessible",weather:"🌊 Dramatic ocean views",description:"The twin 16th-century fortresses dominate the San Juan peninsula.",isFreebie:true,tier:1},
      {title:"Museo de Arte de Puerto Rico",emoji:"🎨",tag:"Culture",why:"World-class collection spanning five centuries of Puerto Rican art.",cost:"$6–10/person",distance:"15 min drive",location:"Santurce, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Tue–Sat 10am–5pm",weather:"🏛️ Indoor, air conditioned",description:"The MAPR holds over 1,400 works in a stunning neoclassical building.",isFreebie:false,tier:1},
      {title:"Bacardí Rum Distillery Tour",emoji:"🥃",tag:"Culture",why:"The history of Puerto Rico is inseparable from rum.",cost:"$12–45/person",distance:"25 min drive",location:"Cataño, PR",duration:"~2 hrs",timeLocked:false,deal:"🍹 Free shuttle from Old San Juan",hours:"Mon–Sat 9am–4:30pm",weather:"🏭 Partially outdoor",description:"The world's largest premium rum distillery with a proper tasting session.",isFreebie:false,tier:1},
      {title:"Old San Juan Walking Tour",emoji:"🏛️",tag:"Freebie",why:"Five centuries of layered history on foot.",cost:"Free",distance:"22 min drive",location:"Old San Juan, PR",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Always accessible",weather:"🌆 Best morning or evening",description:"Walk the 500-year-old streets of one of the oldest European settlements in the Americas.",isFreebie:true,tier:1},
    ],
    hungry:[
      {title:"Kasalta Bakery & Café",emoji:"🥐",tag:"Food & Drink",why:"The best breakfast on the island since 1972.",cost:"$10–18/person",distance:"12 min drive",location:"Ocean Park, PR",duration:"~1 hr",timeLocked:false,deal:null,hours:"6am–9pm daily",weather:"☀️ Perfect morning stop",description:"Part bakery, part café, part deli — entirely excellent.",isFreebie:false,tier:1},
      {title:"Lote 23 Food Truck Park",emoji:"🚚",tag:"Food & Drink",why:"The most fun way to eat in San Juan.",cost:"$10–25/person",distance:"12 min drive",location:"Santurce, PR",duration:"~1.5 hrs",timeLocked:false,deal:null,hours:"Wed–Sun 12pm–10pm",weather:"🌆 Outdoor",description:"San Juan's best food trucks in one curated space.",isFreebie:false,tier:1},
      {title:"El Jibarito Restaurant",emoji:"🍛",tag:"Food & Drink",why:"Honest Puerto Rican home cooking — the real thing.",cost:"$12–20/person",distance:"22 min drive",location:"Old San Juan, PR",duration:"~1 hr",timeLocked:false,deal:null,hours:"11am–9pm daily",weather:"🍽️ Indoor, casual",description:"A tiny Old San Juan institution beloved by locals for decades.",isFreebie:false,tier:1},
      {title:"Piñones Roadside Kiosks",emoji:"🌮",tag:"Freebie",why:"The most authentic local street food in PR.",cost:"$5–15/person",distance:"20 min drive",location:"Piñones, PR",duration:"~1.5 hrs",timeLocked:false,deal:null,hours:"Daily, best 11am–5pm",weather:"🌴 Outdoor, beachside",description:"Local kiosks along the Piñones coast serving traditional Puerto Rican street food.",isFreebie:true,tier:1},
    ],
  },
  miami:{
    romantic:[
      {title:"Sunset at Peacock Park",emoji:"🌅",tag:"Freebie",why:"Miami's most romantic free sunset spot.",cost:"Free",distance:"25 min drive",location:"Coconut Grove, Miami",duration:"~1.5 hrs",timeLocked:true,deal:null,hours:"Always open",weather:"🌅 Arrive 30 min before sunset",description:"Peacock Park sits right on the Coconut Grove waterfront with unobstructed views across Biscayne Bay.",isFreebie:true,tier:1},
      {title:"Cote Miami",emoji:"🥩",tag:"Food & Drink",why:"Michelin-starred Korean steakhouse — theatrical and intimate.",cost:"$70–120/person",distance:"20 min drive",location:"Wynwood, Miami",duration:"~2.5 hrs",timeLocked:false,deal:null,hours:"Daily 5:30pm–11pm",weather:"🌙 Indoor, beautifully lit",description:"Prime aged beef grilled tableside, impeccable banchan, and a wine list rivaling any fine dining room.",isFreebie:false,tier:1},
      {title:"Wynwood Walls Evening Walk",emoji:"🎨",tag:"Freebie",why:"The world's most celebrated street art, completely free.",cost:"Free",distance:"18 min drive",location:"Wynwood, Miami",duration:"~1 hr",timeLocked:false,deal:null,hours:"Always accessible outdoor",weather:"🌆 Beautiful at dusk",description:"An entire neighborhood transformed by the world's most celebrated muralists.",isFreebie:true,tier:1},
      {title:"Pérez Art Museum Terrace",emoji:"🌊",tag:"Culture",why:"Cocktails with sunset views over Biscayne Bay.",cost:"$15–25/person",distance:"15 min drive",location:"Downtown Miami",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Thu–Tue 11am–6pm",weather:"🌅 Perfect at golden hour",description:"The PAMM sits dramatically over Biscayne Bay with one of the most beautiful terrace bars in the city.",isFreebie:false,tier:1},
    ],
    chill:[
      {title:"Bill Baggs Cape Florida Beach",emoji:"🏖️",tag:"Freebie",why:"The most beautiful and least crowded beach in Miami.",cost:"$8/vehicle",distance:"35 min drive",location:"Key Biscayne, Miami",duration:"~3 hrs",timeLocked:false,deal:null,hours:"Daily 8am–sunset",weather:"🌊 Crystal clear water",description:"At the southern tip of Key Biscayne — crystal clear water and a fraction of South Beach's crowds.",isFreebie:true,tier:1},
      {title:"Zak the Baker Brunch",emoji:"☕",tag:"Food & Drink",why:"The best bakery in Miami — exceptional sourdough and coffee.",cost:"$15–25/person",distance:"18 min drive",location:"Wynwood, Miami",duration:"~1 hr",timeLocked:false,deal:null,hours:"Daily 7am–3pm",weather:"🥐 Cozy indoor bakery",description:"A Wynwood institution built around exceptional sourdough and carefully sourced coffee.",isFreebie:false,tier:1},
      {title:"Coconut Grove Waterfront Stroll",emoji:"🌳",tag:"Freebie",why:"Miami's most charming neighborhood for a free walk.",cost:"Free",distance:"25 min drive",location:"Coconut Grove, Miami",duration:"~1 hr",timeLocked:false,deal:null,hours:"Always accessible",weather:"🌿 Canopied streets",description:"Miami's oldest neighborhood with tree-canopied streets and waterfront parks.",isFreebie:true,tier:1},
      {title:"Vizcaya Museum & Gardens",emoji:"🌸",tag:"Culture",why:"The most beautiful grounds in Miami — Italian Renaissance gardens.",cost:"$22/person",distance:"20 min drive",location:"Coconut Grove, Miami",duration:"~2 hrs",timeLocked:false,deal:null,hours:"Wed–Mon 9:30am–4:30pm",weather:"🌿 Outdoor gardens",description:"An extraordinary 1916 Gilded Age villa on 10 acres of formal Italian gardens overlooking Biscayne Bay.",isFreebie:false,tier:1},
    ],
  },
};

function getMock(inputs:any, cityName:string, page=0) {
  const cityKey=cityName.toLowerCase().includes("miami")?"miami":"default";
  const cityData=MOCK[cityKey]||MOCK.default;
  const moodData=cityData[inputs.mood]||cityData.chill||Object.values(cityData)[0];
  let results=[...(moodData as any[])];
  if(inputs.budget==="free") results=results.filter((c:any)=>c.cost==="Free"||(c.cost||"").toLowerCase()==="free"||c.isFreebie);
  if(inputs.cheapMode) results=results.sort((a:any,b:any)=>(b.isFreebie?1:0)-(a.isFreebie?1:0));
  if(page===0) return results.filter((c:any)=>c.tier<=2);
  return results.filter((c:any)=>c.tier===3);
}

function GaritaWatermark({color}:{color:string}) {
  return (
    <svg viewBox="0 0 400 520" fill="none" style={{width:"100%",height:"100%"}}>
      <rect x="60" y="420" width="280" height="80" rx="6" fill={color}/>
      <rect x="90" y="200" width="220" height="230" rx="4" fill={color}/>
      <rect x="110" y="100" width="180" height="120" rx="4" fill={color}/>
      <path d="M110 120 Q200 60 290 120" fill={color}/>
      {[100,145,190,235,270].map((x:number)=><rect key={x} x={x} y="88" width="30" height="24" rx="3" fill={color}/>)}
      <rect x="186" y="130" width="28" height="52" rx="14" fill="white" opacity="0.18"/>
      <rect x="140" y="240" width="36" height="52" rx="18" fill="white" opacity="0.13"/>
      <rect x="224" y="240" width="36" height="52" rx="18" fill="white" opacity="0.13"/>
      <rect x="182" y="320" width="36" height="52" rx="18" fill="white" opacity="0.13"/>
      <path d="M170 420 L170 370 Q200 345 230 370 L230 420Z" fill="white" opacity="0.13"/>
      {[82,118,154,190,226,262,296].map((x:number)=><rect key={x} x={x} y="188" width="22" height="20" rx="3" fill={color}/>)}
      <rect x="88" y="310" width="44" height="22" rx="4" fill="white" opacity="0.1"/>
      <rect x="268" y="310" width="44" height="22" rx="4" fill="white" opacity="0.1"/>
      <rect x="197" y="28" width="6" height="64" rx="3" fill={color}/>
      <path d="M203 32 L236 46 L203 60Z" fill={color}/>
    </svg>
  );
}
function VybeLogo({size=64}:{size?:number}){return(<svg width={size} height={size} viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="19" fill="#1A1714"/><line x1="12" y1="42" x2="52" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><circle cx="32" cy="34" r="9" fill="white"/><line x1="32" y1="18" x2="32" y2="14​​​​​​​​​​​​​​​​
