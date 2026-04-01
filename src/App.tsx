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
function VybeLogo({size=64}:{size?:number}){return(<svg width={size} height={size} viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="19" fill="#1A1714"/><line x1="12" y1="42" x2="52" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><circle cx="32" cy="34" r="9" fill="white"/><line x1="32" y1="18" x2="32" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="46" y1="22" x2="49" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="50" y1="34" x2="54" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="18" y1="22" x2="15" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="14" y1="34" x2="10" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="22" y1="47" x2="42" y2="47" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.45"/><line x1="26" y1="52" x2="38" y2="52" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.22"/></svg>);}
function VybeLogoMini({t}:{t:any}){return(<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="19" fill={t.text}/><line x1="12" y1="42" x2="52" y2="42" stroke={t.surface} strokeWidth="2.5" strokeLinecap="round"/><circle cx="32" cy="34" r="9" fill={t.surface}/><line x1="32" y1="18" x2="32" y2="14" stroke={t.surface} strokeWidth="2.5" strokeLinecap="round"/><line x1="46" y1="22" x2="49" y2="19" stroke={t.surface} strokeWidth="2.5" strokeLinecap="round"/><line x1="50" y1="34" x2="54" y2="34" stroke={t.surface} strokeWidth="2.5" strokeLinecap="round"/><line x1="18" y1="22" x2="15" y2="19" stroke={t.surface} strokeWidth="2.5" strokeLinecap="round"/><line x1="14" y1="34" x2="10" y2="34" stroke={t.surface} strokeWidth="2.5" strokeLinecap="round"/><line x1="22" y1="47" x2="42" y2="47" stroke={t.surface} strokeWidth="2" strokeLinecap="round" opacity="0.45"/><line x1="26" y1="52" x2="38" y2="52" stroke={t.surface} strokeWidth="2" strokeLinecap="round" opacity="0.22"/></svg>);}

function SkeletonPlanning(){return(<svg width="140" height="154" viewBox="0 0 160 176" fill="none" style={{overflow:"visible"}}><rect x="30" y="118" width="100" height="58" rx="4" fill="#E8D8A8" opacity="0.7"/><line x1="30" y1="132" x2="130" y2="132" stroke="#C8B880" strokeWidth="1.5" opacity="0.6"/><line x1="72" y1="118" x2="72" y2="176" stroke="#C8B880" strokeWidth="1.5" opacity="0.6"/><circle cx="95" cy="138" r="5" fill="#FF6B6B" opacity="0.85"/><ellipse cx="80" cy="22" rx="18" ry="20" fill="none" stroke="#8A8075" strokeWidth="2.2"/><ellipse cx="72" cy="20" rx="5" ry="5.5" fill="#8A8075"/><ellipse cx="88" cy="20" rx="5" ry="5.5" fill="#8A8075"/><path d="M69 36 Q80 42 91 36" fill="none" stroke="#8A8075" strokeWidth="2"/><line x1="80" y1="42" x2="80" y2="52" stroke="#8A8075" strokeWidth="3" strokeLinecap="round"/><path d="M80 52 Q78 70 76 88 Q74 100 74 118" stroke="#8A8075" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M78 58 Q60 62 56 72 Q60 68 78 66" stroke="#8A8075" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M80 58 Q96 62 100 70" stroke="#8A8075" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M68 116 Q74 108 80 108 Q86 108 92 116 Q98 124 92 128 Q86 132 80 130 Q74 132 68 128 Q62 124 68 116Z" fill="none" stroke="#8A8075" strokeWidth="2"/><line x1="78" y1="56" x2="52" y2="82" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><line x1="52" y1="85" x2="48" y2="118" stroke="#8A8075" strokeWidth="2.2" strokeLinecap="round"/><line x1="80" y1="52" x2="108" y2="60" stroke="#8A8075" strokeWidth="1.8" strokeLinecap="round"/><line x1="108" y1="60" x2="116" y2="82" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><line x1="116" y1="85" x2="112" y2="118" stroke="#8A8075" strokeWidth="2.2" strokeLinecap="round"/><line x1="72" y1="128" x2="62" y2="158" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><line x1="62" y1="161" x2="58" y2="176" stroke="#8A8075" strokeWidth="2.2" strokeLinecap="round"/><line x1="88" y1="128" x2="100" y2="152" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><line x1="100" y1="155" x2="104" y2="170" stroke="#8A8075" strokeWidth="2.2" strokeLinecap="round"/></svg>);}

function SkeletonBeach(){return(<svg width="150" height="128" viewBox="0 0 160 136" fill="none"><circle cx="130" cy="18" r="12" fill="#FFD166" opacity="0.9"/>{[0,45,90,135,180,225,270,315].map((a:number,i:number)=>(<line key={i} x1={130+Math.cos(a*Math.PI/180)*15} y1={18+Math.sin(a*Math.PI/180)*15} x2={130+Math.cos(a*Math.PI/180)*20} y2={18+Math.sin(a*Math.PI/180)*20} stroke="#FFD166" strokeWidth="2" strokeLinecap="round"/>))}<line x1="72" y1="28" x2="72" y2="88" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><path d="M40 42 Q72 18 104 42" fill="#FFAB76" opacity="0.85"/><path d="M40 42 Q56 36 72 42" fill="#FF85B3" opacity="0.85"/><path d="M72 42 Q88 36 104 42" fill="#76C8FF" opacity="0.85"/><ellipse cx="24" cy="86" rx="16" ry="14" fill="none" stroke="#8A8075" strokeWidth="2"/><ellipse cx="20" cy="83" rx="4.5" ry="5" fill="#8A8075"/><ellipse cx="28" cy="83" rx="4.5" ry="5" fill="#8A8075"/><path d="M22 94 Q28 98 34 94" fill="none" stroke="#8A8075" strokeWidth="1.8" strokeLinecap="round"/><path d="M38 92 Q60 90 82 91 Q100 92 118 91" stroke="#8A8075" strokeWidth="2.5" fill="none" strokeLinecap="round"/><line x1="60" y1="82" x2="50" y2="68" stroke="#8A8075" strokeWidth="2.2" strokeLinecap="round"/><line x1="50" y1="65" x2="54" y2="52" stroke="#8A8075" strokeWidth="2" strokeLinecap="round"/><path d="M50 46 L58 46 L55 56 L53 56 Z" fill="#76C8FF" opacity="0.85"/><line x1="54" y1="42" x2="54" y2="46" stroke="#FF85B3" strokeWidth="1.5" strokeLinecap="round"/><line x1="62" y1="98" x2="42" y2="120" stroke="#8A8075" strokeWidth="2.2" strokeLinecap="round"/><line x1="128" y1="90" x2="156" y2="76" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><line x1="126" y1="94" x2="154" y2="114" stroke="#8A8075" strokeWidth="2.5" strokeLinecap="round"/><path d="M8 124 Q80 118 152 124" stroke="#E8D4A8" strokeWidth="3" strokeLinecap="round"/><path d="M8 132 Q28 128 48 132 Q68 136 88 132" stroke="#76C8FF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/></svg>);}

function TransitionScreen({t,onDone}:{t:any,onDone:()=>void}){
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),400);
    const t2=setTimeout(()=>setPhase(2),1600);
    const t3=setTimeout(()=>onDone(),2200);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);
  return(<div style={{position:"fixed",inset:0,zIndex:50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backgroundColor:t.bg,opacity:phase===2?0:1,transition:"opacity 0.5s ease",pointerEvents:phase===2?"none":"auto"}}><div style={{animation:"fadeUp 0.5s ease both",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}><SkeletonPlanning/><div style={{textAlign:"center",opacity:phase>=1?1:0,transition:"opacity 0.4s ease 0.1s"}}><p style={{fontSize:16,fontWeight:800,color:t.text,margin:"0 0 4px"}}>Your agent is getting to work.</p><p style={{fontSize:13,color:t.textMuted,margin:0}}>No more dying of indecision. ✦</p></div></div></div>);
}

function SkeletonScreen({t}:{t:any}){
  return(<div style={{position:"relative",zIndex:1,padding:"52px 24px 100px"}}><div style={{textAlign:"center",marginBottom:28,animation:"fadeUp 0.4s ease both"}}><SkeletonBeach/><p style={{fontSize:15,fontWeight:700,color:t.textMuted,margin:"14px 0 4px"}}>Finding your Vybe…</p><p style={{fontSize:12,color:t.textLight,margin:0}}>Scanning events, weather & local gems</p></div>{[0,1,2].map((i:number)=>(<div key={i} style={{backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:20,overflow:"hidden",marginBottom:13,animation:`fadeUp 0.3s ease ${i*0.08}s both`}}><div style={{padding:"18px 18px 16px"}}><div style={{display:"flex",gap:14}}><div style={{width:48,height:48,borderRadius:13,background:`linear-gradient(90deg,${t.border} 25%,${t.bg} 50%,${t.border} 75%)`,backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite",flexShrink:0}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>{[[60,14],[200,18],[280,13],[180,13]].map(([w,h]:number[],j:number)=>(<div key={j} style={{width:w,height:h,borderRadius:6,background:`linear-gradient(90deg,${t.border} 25%,${t.bg} 50%,${t.border} 75%)`,backgroundSize:"200% 100%",animation:`shimmer 1.4s infinite ${j*0.05}s`}}/>))}</div></div></div></div>))}</div>);
}

function AppBackground({t}:{t:any}){return(<><div style={{position:"fixed",inset:0,zIndex:0,background:`linear-gradient(150deg,${t.grad[0]} 0%,${t.grad[1]} 50%,${t.grad[2]} 100%)`,transition:"background 0.6s ease"}}/><div style={{position:"fixed",inset:0,zIndex:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",opacity:0.048}}><div style={{width:"100%",height:"100%"}}><GaritaWatermark color={t.text}/></div></div></>);}
function Sec({label,children,t}:{label:string,children:any,t:any}){return(<div style={{marginBottom:20}}><p style={{margin:"0 0 9px",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:1}}>{label}</p>{children}</div>);}

function CityInput({value,onChange,t}:{value:string,onChange:(v:string)=>void,t:any}){
  const [focused,setFocused]=useState(false);
  const suggestions=["San Juan, Puerto Rico","Rincón, Puerto Rico","Ponce, Puerto Rico","Miami, Florida","New York City","Barcelona, Spain","Paris, France","London, UK","Cancún, Mexico","Medellín, Colombia","Lisbon, Portugal","Tokyo, Japan"].filter((s:string)=>value.length>1&&s.toLowerCase().includes(value.toLowerCase())&&s.toLowerCase()!==value.toLowerCase());
  return(<div style={{position:"relative"}}><div style={{display:"flex",alignItems:"center",gap:10,backgroundColor:t.surface,border:`1.5px solid ${focused?t.accent:t.border}`,borderRadius:16,padding:"14px 18px",transition:"border-color 0.15s ease",boxShadow:focused?`0 0 0 3px ${t.accent}20`:"0 2px 14px rgba(0,0,0,0.07)"}}><span style={{fontSize:18}}>📍</span><input value={value} onChange={(e:any)=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),150)} placeholder="Any city, neighborhood, or place…" style={{border:"none",background:"transparent",outline:"none",fontSize:15,color:t.text,fontFamily:"'DM Sans',sans-serif",flex:1,fontWeight:500}}/>{value&&<button onClick={()=>onChange("")} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:t.textMuted,padding:0}}>✕</button>}</div>{focused&&suggestions.length>0&&(<div style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",zIndex:50}}>{suggestions.slice(0,5).map((s:string,i:number)=>(<button key={i} onMouseDown={()=>onChange(s)} style={{width:"100%",background:"none",border:"none",borderTop:i>0?`1px solid ${t.border}`:"none",padding:"12px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:16,opacity:0.5}}>📍</span><span style={{fontSize:14,fontWeight:600,color:t.text}}>{s}</span></button>))}</div>)}</div>);
}

function DayPlanner({plan,onRemove,onMove,onAddMore,onConfirm,onBack,cityName,t}:any){
  const [movingKey,setMovingKey]=useState<string|null>(null);
  const movingCard=movingKey?plan.find((p:any)=>cardKey(p.card)===movingKey)?.card:null;
  const movingBand=movingKey?plan.find((p:any)=>cardKey(p.card)===movingKey)?.band:null;
  const bandItems=(id:string)=>plan.filter((p:any)=>p.band===id);
  const totalCost=()=>{if(plan.every((p:any)=>p.card.cost==="Free")) return "Free day 🎉";return plan.filter((p:any)=>p.card.cost!=="Free").map((p:any)=>p.card.cost).join(" + ");};
  const handleMoveBtn=(e:any,card:any)=>{e.preventDefault();e.stopPropagation();const k=cardKey(card);setMovingKey((prev:any)=>prev===k?null:k);};
  const handlePlaceHere=(e:any,bandId:string)=>{e.preventDefault();e.stopPropagation();if(!movingKey) return;onMove(movingKey,bandId);setMovingKey(null);};
  const handleCancel=(e:any)=>{e.preventDefault();e.stopPropagation();setMovingKey(null);};
  return(
    <div style={{position:"relative",zIndex:1,padding:"52px 24px 120px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:t.textMuted,fontFamily:"'DM Sans',sans-serif",padding:0,fontWeight:700}}>← Back</button>
        <span style={{fontSize:16,fontWeight:800,color:t.text,marginLeft:8}}>My Day</span>
        <span style={{marginLeft:"auto",fontSize:11,color:t.textMuted,backgroundColor:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"4px 10px",fontWeight:600}}>📍 {cityName}</span>
      </div>
      <h2 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-0.8}}>Your Day Plan</h2>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <span style={{fontSize:12,color:t.textMuted,fontWeight:600}}>{plan.length} {plan.length===1?"activity":"activities"}</span>
        <span style={{opacity:0.3}}>·</span>
        <span style={{fontSize:12,fontWeight:700,color:t.text}}>{totalCost()}</span>
      </div>
      {movingCard&&(<div style={{backgroundColor:t.accentSoft,border:`1.5px solid ${t.accent}`,borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:22,flexShrink:0}}>{movingCard.emoji}</span><div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:700,color:t.text}}>Moving: {movingCard.title}</p><p style={{margin:0,fontSize:11,color:t.textMuted,marginTop:2}}>Tap "Place here" in the time band you want</p></div><button onClick={handleCancel} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700,color:t.textMuted,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Cancel</button></div>)}
      {TIME_BANDS.map((band:any)=>{
        const items=bandItems(band.id);
        const isMovingInThisBand=movingBand===band.id;
        const canDropHere=!!movingKey&&!isMovingInThisBand;
        return(<div key={band.id} style={{backgroundColor:canDropHere?band.activeBg:band.bg,border:`1.5px solid ${canDropHere?"rgba(255,160,40,0.5)":band.border}`,borderRadius:20,marginBottom:14,overflow:"hidden",transition:"all 0.2s ease"}}>
          <div style={{padding:"12px 16px 10px",display:"flex",alignItems:"center",gap:8,borderBottom:items.length>0||canDropHere?`1px solid ${band.border}`:"none"}}>
            <span style={{fontSize:18}}>{band.icon}</span><span style={{fontSize:13,fontWeight:800,color:t.text}}>{band.label}</span><span style={{fontSize:11,color:t.textMuted,marginLeft:4}}>{band.time}</span>
            {isMovingInThisBand&&<span style={{marginLeft:"auto",fontSize:11,color:t.textMuted,fontWeight:600}}>Currently here</span>}
          </div>
          <div style={{padding:"10px 12px"}}>
            {canDropHere&&(<button onClick={(e:any)=>handlePlaceHere(e,band.id)} style={{width:"100%",backgroundColor:t.accent,color:"#fff",border:"none",borderRadius:12,padding:"13px 16px",marginBottom:items.length>0?10:0,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 16px ${t.accent}40`}}><span style={{fontSize:18}}>{band.icon}</span> Place here → {band.label}</button>)}
            {items.map((item:any,idx:number)=>{const locked=isTimeLocked(item.card);const k=cardKey(item.card);const isBeingMoved=movingKey===k;return(<div key={k}><div style={{backgroundColor:isBeingMoved?t.accentSoft:t.surface,border:`1.5px solid ${isBeingMoved?t.accent:t.border}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s ease",opacity:isBeingMoved?0.7:1}}><span style={{fontSize:22,flexShrink:0}}>{item.card.emoji}</span><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><p style={{margin:0,fontSize:14,fontWeight:700,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.card.title}</p>{locked&&<span style={{fontSize:11}}>🔒</span>}</div><p style={{margin:0,fontSize:11,color:t.textMuted}}>{item.card.duration} · <span style={{fontWeight:700,color:t.text}}>{item.card.cost}</span></p></div><div style={{display:"flex",gap:6,flexShrink:0}}>{!locked&&(<button onClick={(e:any)=>handleMoveBtn(e,item.card)} style={{backgroundColor:isBeingMoved?t.accent:t.bg,border:`1.5px solid ${isBeingMoved?t.accent:t.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:13,color:isBeingMoved?"#fff":t.textMuted,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{isBeingMoved?"✓":"⇅"}</button>)}<button onClick={(e:any)=>{e.stopPropagation();onRemove(k);}} style={{backgroundColor:t.bg,border:`1.5px solid ${t.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:13,color:t.textLight,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>✕</button></div></div>{idx<items.length-1&&(<div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 14px"}}><div style={{width:2,height:16,backgroundColor:t.border,borderRadius:1,marginLeft:20}}/><span style={{fontSize:11,color:t.textLight,fontWeight:600}}>🚗 ~{items[idx+1].card.distance} to next stop</span></div>)}</div>);})}
            <button onClick={(e:any)=>{e.stopPropagation();setMovingKey(null);onAddMore(band.id);}} style={{width:"100%",backgroundColor:"transparent",border:`1.5px dashed ${t.border}`,borderRadius:14,padding:"12px",cursor:"pointer",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,marginTop:items.length>0||canDropHere?8:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:16}}>+</span> Add {band.label.toLowerCase()} activity</button>
          </div>
        </div>);
      })}
      {plan.length>0&&(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"16px 24px 32px",background:`linear-gradient(to top,${t.bg} 70%,transparent)`,zIndex:10}}><button onClick={onConfirm} style={{width:"100%",backgroundColor:t.text,color:t.bg,border:"none",borderRadius:16,padding:"17px 24px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 20px rgba(0,0,0,0.18)"}}>Plan this day → ({plan.length} {plan.length===1?"stop":"stops"})</button></div>)}
    </div>
  );
}

function DetailSheet({card,onClose,onAddToDay,targetBand,t}:any){
  return(<div style={{position:"fixed",inset:0,zIndex:150,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><div onClick={onClose} style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.42)",backdropFilter:"blur(3px)"}}/><div style={{position:"relative",zIndex:1,backgroundColor:t.surface,borderRadius:"24px 24px 0 0",padding:"0 0 40px",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)",maxHeight:"88vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease both"}}><div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:40,height:4,borderRadius:2,backgroundColor:t.border}}/></div><div style={{overflowY:"auto",flex:1,padding:"16px 22px 0"}}>{targetBand&&(<div style={{backgroundColor:t.accentSoft,border:`1.5px solid ${t.accent}`,borderRadius:12,padding:"8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>{TIME_BANDS.find((b:any)=>b.id===targetBand)?.icon}</span><p style={{margin:0,fontSize:12,fontWeight:700,color:t.accent}}>Will be added to {TIME_BANDS.find((b:any)=>b.id===targetBand)?.label}</p></div>)}<div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}><div style={{width:60,height:60,borderRadius:16,backgroundColor:t.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{card.emoji}</div><div style={{flex:1}}><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}><span style={{display:"inline-block",fontSize:10,fontWeight:700,color:t.accent,backgroundColor:t.accentSoft,padding:"3px 8px",borderRadius:6,textTransform:"uppercase",letterSpacing:0.5}}>{card.tag}</span>{card.isFreebie&&<span style={{display:"inline-block",fontSize:10,fontWeight:700,color:"#2DBE6C",backgroundColor:"#C8F0D8",padding:"3px 8px",borderRadius:6}}>🌿 Freebie</span>}</div><h2 style={{margin:0,fontSize:20,fontWeight:800,color:t.text,letterSpacing:-0.5,lineHeight:1.2}}>{card.title}</h2></div></div>{card.deal&&<div style={{backgroundColor:t.accentSoft,border:`1.5px solid ${t.accent}`,borderRadius:12,padding:"10px 14px",marginBottom:14}}><span style={{fontSize:13,fontWeight:700,color:t.accent}}>{card.deal}</span></div>}<p style={{fontSize:14,color:t.textMuted,lineHeight:1.6,margin:"0 0 18px"}}>{card.description}</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>{[["📍","Location",card.location],["🕐","Drive time",card.distance],["💰","Cost",card.cost],["⏱","Duration",card.duration],["🕐","Hours",card.hours],["🌤","Conditions",card.weather]].map(([icon,label,value]:string[],i:number)=>(<div key={i} style={{backgroundColor:t.bg,borderRadius:12,padding:"10px 12px"}}><p style={{margin:0,fontSize:11,color:t.textLight,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{icon} {label}</p><p style={{margin:"3px 0 0",fontSize:13,fontWeight:700,color:t.text}}>{value}</p></div>))}</div></div><div style={{padding:"16px 22px 0",display:"flex",gap:10}}><button onClick={()=>onAddToDay(card,targetBand)} style={{flex:1,backgroundColor:t.text,color:t.bg,border:"none",borderRadius:14,padding:"15px 10px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add to my day</button><button onClick={onClose} style={{flex:1,backgroundColor:t.accentSoft,color:t.accent,border:`1.5px solid ${t.accent}`,borderRadius:14,padding:"15px 10px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button></div></div></div>);
}

function ConfirmScreen({plan,cityName,onBack,t}:any){
  return(<div style={{position:"relative",zIndex:1,padding:"52px 24px 100px"}}><button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:t.textMuted,fontFamily:"'DM Sans',sans-serif",padding:"0 0 16px",fontWeight:700}}>← Back</button><div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:48,marginBottom:12}}>🗓️</div><h2 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 8px",letterSpacing:-0.8}}>Day locked in!</h2><p style={{fontSize:14,color:t.textMuted,margin:0}}>{plan.length} stops in {cityName}</p></div>{TIME_BANDS.map((band:any)=>{const items=plan.filter((p:any)=>p.band===band.id);if(!items.length) return null;return(<div key={band.id} style={{backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:16,overflow:"hidden",marginBottom:12}}><div style={{padding:"10px 16px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:8}}><span>{band.icon}</span><span style={{fontSize:13,fontWeight:800,color:t.text}}>{band.label}</span></div>{items.map((item:any,i:number)=>(<div key={i} style={{padding:"12px 16px",borderBottom:i<items.length-1?`1px solid ${t.border}`:"none",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{item.card.emoji}</span><div><p style={{margin:0,fontSize:14,fontWeight:700,color:t.text}}>{item.card.title}</p><p style={{margin:0,fontSize:11,color:t.textMuted}}>{item.card.duration} · {item.card.cost}</p></div></div>))}</div>);})} <div style={{backgroundColor:t.accentSoft,border:`1.5px solid ${t.accent}`,borderRadius:16,padding:"16px 18px",marginBottom:16,textAlign:"center"}}><p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:t.text}}>🔧 Reservations coming in Phase 4</p><p style={{margin:0,fontSize:12,color:t.textMuted}}>Your agent will handle all bookings automatically.</p></div><button onClick={onBack} style={{width:"100%",backgroundColor:t.surface,color:t.text,border:`1.5px solid ${t.border}`,borderRadius:16,padding:"15px 24px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Edit my day</button></div>);
}

function ProfileScreen({onClose,colorMode,setColorMode,paletteId,setPaletteId,t}:any){
  const [section,setSection]=useState("main");
  const dModes=[{id:"system",label:"System",icon:"⚙️"},{id:"light",label:"Light",icon:"☀️"},{id:"dark",label:"Dark",icon:"🌙"}];
  const menuItems=[{id:"personalization",icon:"🎨",label:"Personalization",sub:"Themes, colors, display"},{id:"account",icon:"👤",label:"Account",sub:"Profile, email, password"},{id:"privacy",icon:"🔒",label:"Privacy",sub:"Data, permissions"},{id:"notifications",icon:"🔔",label:"Notifications",sub:"Alerts, reminders, deals"},{id:"help",icon:"💬",label:"Help & Feedback",sub:"Support, report, suggest"}];
  return(<div style={{position:"fixed",inset:0,zIndex:90,backgroundColor:t.bg,display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif"}}><div style={{padding:"52px 24px 16px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:14}}>{section!=="main"&&<button onClick={()=>setSection("main")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:t.textMuted,fontFamily:"'DM Sans',sans-serif",padding:0}}>←</button>}<h2 style={{margin:0,fontSize:22,fontWeight:800,color:t.text,letterSpacing:-0.6,flex:1}}>{section==="main"?"Profile":section==="personalization"?"Personalization":"Coming soon"}</h2><button onClick={onClose} style={{background:t.surface,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:t.textMuted,fontFamily:"'DM Sans',sans-serif"}}>Done</button></div><div style={{flex:1,overflowY:"auto",padding:"20px 24px 60px"}}>{section==="main"&&<><div style={{display:"flex",alignItems:"center",gap:16,backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:18,padding:"18px 20px",marginBottom:24}}><div style={{width:56,height:56,borderRadius:"50%",backgroundColor:t.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>😎</div><div><p style={{margin:0,fontSize:17,fontWeight:800,color:t.text}}>Gino</p><p style={{margin:0,fontSize:13,color:t.textMuted,marginTop:2}}>Puerto Rico · Couple</p></div></div><div style={{backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:18,overflow:"hidden"}}>{menuItems.map((item:any,i:number)=>(<button key={item.id} onClick={()=>setSection(item.id)} style={{width:"100%",background:"none",border:"none",borderBottom:i<menuItems.length-1?`1px solid ${t.border}`:"none",padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}><div style={{width:38,height:38,borderRadius:10,backgroundColor:t.bg,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{item.icon}</div><div style={{flex:1,textAlign:"left"}}><p style={{margin:0,fontSize:15,fontWeight:700,color:t.text}}>{item.label}</p><p style={{margin:0,fontSize:12,color:t.textMuted,marginTop:1}}>{item.sub}</p></div><span style={{color:t.textLight,fontSize:16}}>›</span></button>))}</div><p style={{fontSize:12,color:t.textLight,textAlign:"center",marginTop:28}}>Vybe · Phase 2A ✦</p></>}{section==="personalization"&&<><p style={{margin:"0 0 10px",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:1}}>Display mode</p><div style={{backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:16,display:"flex",overflow:"hidden",marginBottom:28}}>{dModes.map((m:any,i:number)=>(<button key={m.id} onClick={()=>setColorMode(m.id)} style={{flex:1,backgroundColor:colorMode===m.id?t.text:"transparent",border:"none",borderRight:i<2?`1px solid ${t.border}`:"none",padding:"13px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontFamily:"'DM Sans',sans-serif",transition:"background 0.15s ease"}}><span style={{fontSize:18}}>{m.icon}</span><span style={{fontSize:12,fontWeight:700,color:colorMode===m.id?t.bg:t.text}}>{m.label}</span></button>))}</div><p style={{margin:"0 0 10px",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:1}}>Color theme</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{paletteOptions.map((p:any)=>{const active=paletteId===p.id;return(<button key={p.id} onClick={()=>setPaletteId(p.id)} style={{backgroundColor:p.bg,border:`2px solid ${active?p.accent:p.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif",boxShadow:active?`0 0 0 3px ${p.accent}40`:"none",transition:"all 0.15s ease"}}><div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${p.accent},${p.accentSoft})`,border:`2px solid ${p.border}`,flexShrink:0}}/><div style={{textAlign:"left"}}><p style={{margin:0,fontSize:14,fontWeight:700,color:p.text}}>{p.name}</p>{active&&<p style={{margin:0,fontSize:10,color:p.accent,fontWeight:700}}>Active</p>}</div></button>);})}</div></>}{!["main","personalization"].includes(section)&&<div style={{textAlign:"center",padding:"60px 0"}}><p style={{fontSize:36,margin:"0 0 12px"}}>🔧</p><p style={{fontSize:16,fontWeight:700,color:t.text}}>Coming in a future phase</p></div>}</div></div>);
}

function SplashScreen({onEnter,cityName,onCityChange,onProfile,t}:any){
  const [detected,setDetected]=useState(false);
  useEffect(()=>{setTimeout(()=>setDetected(true),1000);},[]);
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 28px 64px",position:"relative",zIndex:1}}><button onClick={onProfile} style={{position:"absolute",top:52,right:24,backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:t.textMuted,fontFamily:"'DM Sans',sans-serif"}}>👤 Profile</button><div style={{animation:"fadeUp 0.4s ease both",marginBottom:18}}><VybeLogo size={72}/></div><h1 style={{fontSize:58,fontWeight:800,letterSpacing:-2.5,color:t.text,margin:0,lineHeight:1,animation:"fadeUp 0.4s ease 0.08s both"}}>Vybe</h1><p style={{fontSize:15,color:t.textMuted,marginTop:10,fontWeight:400,animation:"fadeUp 0.4s ease 0.16s both"}}>Your day, curated for you.</p><div style={{marginTop:40,width:"100%",maxWidth:340,animation:"fadeUp 0.4s ease 0.22s both"}}><p style={{fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:0.9,textAlign:"center",marginBottom:10}}>{detected?"Where are you?":"Detecting location…"}</p><CityInput value={cityName} onChange={onCityChange} t={t}/><button onClick={()=>cityName.trim()&&onEnter()} style={{width:"100%",marginTop:16,backgroundColor:cityName.trim()?t.text:t.border,color:cityName.trim()?t.bg:t.textLight,border:"none",borderRadius:16,padding:"17px 24px",fontSize:16,fontWeight:700,cursor:cityName.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif",boxShadow:cityName.trim()?"0 4px 24px rgba(0,0,0,0.18)":"none",transition:"all 0.2s ease"}}>Let's go →</button></div></div>);
}

function SurpriseAnimation({group,onDone,t}:any){
  const [activeMood,setActiveMood]=useState<string|null>(null);
  const [activeBudget,setActiveBudget]=useState<string|null>(null);
  useEffect(()=>{let frame=0;const mIds=moods.map((m:any)=>m.id),bIds=budgets.map((b:any)=>b.id);const fm=mIds[Math.floor(Math.random()*mIds.length)],fb=bIds[Math.floor(Math.random()*bIds.length)];const iv=setInterval(()=>{frame++;setActiveMood(mIds[frame%mIds.length]);setActiveBudget(bIds[frame%bIds.length]);if(frame>14){clearInterval(iv);setActiveMood(fm);setActiveBudget(fb);setTimeout(()=>onDone({mood:fm,group,budget:fb,timeframe:"today",radius:"30",cheapMode:false}),600);}},80);return()=>clearInterval(iv);},[]);
  return(<div style={{position:"relative",zIndex:1,padding:"52px 24px 100px"}}><div style={{textAlign:"center",marginBottom:32}}><div style={{animation:"pulse 0.6s ease infinite alternate",display:"inline-block"}}><VybeLogo size={52}/></div><p style={{fontSize:18,fontWeight:800,color:t.text,margin:"16px 0 4px"}}>Picking your Vybe…</p><p style={{fontSize:13,color:t.textMuted,margin:0}}>Leaving it to the universe ✦</p></div><Sec label="Your mood" t={t}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>{moods.map((m:any)=>{const a=activeMood===m.id;return(<div key={m.id} style={{backgroundColor:a?t.accent:t.surface,border:`1.5px solid ${a?t.accent:t.border}`,borderRadius:14,padding:"13px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all 0.06s ease"}}><span style={{fontSize:22}}>{m.emoji}</span><span style={{fontSize:11,fontWeight:700,color:a?"#fff":t.text}}>{m.label}</span></div>);})}</div></Sec><Sec label="Budget?" t={t}><div style={{display:"flex",gap:8}}>{budgets.map((b:any)=>{const a=activeBudget===b.id;return(<div key={b.id} style={{flex:1,backgroundColor:a?t.text:t.surface,border:`1.5px solid ${a?t.text:t.border}`,borderRadius:12,padding:"10px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.06s ease"}}><span style={{fontSize:15,fontWeight:800,color:a?t.bg:t.text}}>{b.label}</span><span style={{fontSize:10,color:a?t.bg+"99":t.textLight}}>{b.sub}</span></div>);})}</div></Sec></div>);
}

function VibeCheckScreen({cityName,onCityChange,onSubmit,onSurprise,onProfile,t}:any){
  const [mood,setMood]=useState<string|null>(null);
  const [group,setGroup]=useState("couple");
  const [budget,setBudget]=useState("mid");
  const [timeframe,setTimeframe]=useState("today");
  const [radius,setRadius]=useState("30");
  const [cheapMode,setCheapMode]=useState(false);
  const PillRow=({items,selected,onSelect,accent}:any)=>(<div style={{display:"flex",gap:8}}>{items.map((item:any)=>{const a=selected===item.id;const bg=a?(accent||t.text):t.surface;const fg=a?(accent?"#fff":t.bg):t.text;return(<button key={item.id} onClick={()=>onSelect(item.id)} style={{flex:1,backgroundColor:bg,border:`1.5px solid ${a?(accent||t.text):t.border}`,borderRadius:12,padding:"10px 4px",cursor:"pointer",transition:"all 0.15s ease",display:"flex",flexDirection:"column",alignItems:"center",gap:3,boxShadow:a&&accent?`0 3px 10px ${accent}40`:"none",fontFamily:"'DM Sans',sans-serif"}}>{item.emoji&&<span style={{fontSize:17}}>{item.emoji}</span>}<span style={{fontSize:12,fontWeight:700,color:fg}}>{item.label}</span>{item.sub&&<span style={{fontSize:10,color:a?(accent?"rgba(255,255,255,0.65)":t.bg+"80"):t.textLight}}>{item.sub}</span>}</button>);})}</div>);
  return(<div style={{position:"relative",zIndex:1,padding:"52px 24px 100px"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}><VybeLogoMini t={t}/><span style={{fontSize:16,fontWeight:800,letterSpacing:-0.5,color:t.text}}>Vybe</span><button onClick={onProfile} style={{marginLeft:"auto",background:t.surface,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:14}}>👤</button></div><h2 style={{fontSize:30,fontWeight:800,color:t.text,margin:"0 0 6px",letterSpacing:-1,lineHeight:1.15}}>What's the vibe?</h2><p style={{fontSize:14,color:t.textMuted,margin:"0 0 20px"}}>A few answers and we handle the rest.</p><Sec label="Where are you?" t={t}><CityInput value={cityName} onChange={onCityChange} t={t}/></Sec><Sec label="How are you feeling?" t={t}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>{moods.map((m:any)=>{const a=mood===m.id;return(<button key={m.id} onClick={()=>setMood(m.id)} style={{backgroundColor:a?t.accent:t.surface,border:`1.5px solid ${a?t.accent:t.border}`,borderRadius:14,padding:"13px 6px",cursor:"pointer",transition:"all 0.15s ease",display:"flex",flexDirection:"column",alignItems:"center",gap:5,boxShadow:a?`0 4px 14px ${t.accent}45`:"none",fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:22}}>{m.emoji}</span><span style={{fontSize:11,fontWeight:700,color:a?"#fff":t.text}}>{m.label}</span></button>);})}</div></Sec><Sec label="Who's coming?" t={t}><PillRow items={groups} selected={group} onSelect={setGroup}/></Sec><Sec label="When?" t={t}><PillRow items={timeframes} selected={timeframe} onSelect={setTimeframe}/></Sec><Sec label="Budget?" t={t}><PillRow items={budgets} selected={budget} onSelect={(id:string)=>{setBudget(id);if(id==="free")setCheapMode(true);}}/></Sec><Sec label="How far to travel?" t={t}><PillRow items={radii} selected={radius} onSelect={setRadius} accent={t.accent}/></Sec><div onClick={()=>setCheapMode((v:boolean)=>!v)} style={{backgroundColor:cheapMode?t.accentSoft:t.surface,border:`1.5px solid ${cheapMode?t.accent:t.border}`,borderRadius:16,padding:"14px 16px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all 0.2s ease"}}><div><p style={{margin:0,fontSize:14,fontWeight:700,color:t.text}}>💸 Do It Cheaply</p><p style={{margin:0,fontSize:12,color:t.textMuted,marginTop:2}}>Surface deals, discounts & free gems near you</p></div><div style={{width:44,height:26,borderRadius:13,backgroundColor:cheapMode?t.accent:t.border,position:"relative",transition:"background 0.2s ease",flexShrink:0,marginLeft:12}}><div style={{width:20,height:20,borderRadius:"50%",backgroundColor:"#fff",position:"absolute",top:3,left:cheapMode?21:3,transition:"left 0.2s ease",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/></div></div><button onClick={()=>mood&&cityName.trim()&&onSubmit({mood,group,budget,timeframe,radius,cheapMode})} style={{width:"100%",backgroundColor:mood&&cityName.trim()?t.text:t.border,color:mood&&cityName.trim()?t.bg:t.textLight,border:"none",borderRadius:16,padding:"17px 24px",fontSize:16,fontWeight:700,cursor:mood&&cityName.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif",marginBottom:12,boxShadow:mood&&cityName.trim()?"0 4px 20px rgba(0,0,0,0.15)":"none",transition:"all 0.15s ease"}}>Find my Vybe →</button><button onClick={()=>onSurprise(group)} style={{width:"100%",backgroundColor:t.accent,color:"#fff",border:"none",borderRadius:16,padding:"15px 24px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 18px ${t.accent}55`}}>✦ Surprise me</button></div>);
}

function ResultsScreen({inputs,cityName,onBack,onProfile,onOpenDetail,targetBand,weatherInfo,t}:any){
  const [cards,setCards]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [loadingTier3,setLoadingTier3]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [dismissed,setDismissed]=useState<string[]>([]);
  const [showMore,setShowMore]=useState(false);
  const [tier3Cards,setTier3Cards]=useState<any[]>([]);
  const [tier3Loaded,setTier3Loaded]=useState(false);
  const load=useCallback(()=>{setLoading(true);setError(null);setDismissed([]);setShowMore(false);setTier3Cards([]);setTier3Loaded(false);fetchVybeSuggestions(inputs,cityName,0,weatherInfo).then((r:any)=>{setCards(r);setLoading(false);}).catch((e:any)=>{setError(e.message);setLoading(false);});},[inputs,cityName,weatherInfo]);
  useEffect(()=>{load();},[]);
  const loadTier3=()=>{setLoadingTier3(true);fetchVybeSuggestions(inputs,cityName,1,weatherInfo).then((r:any)=>{setTier3Cards(r);setLoadingTier3(false);setTier3Loaded(true);}).catch(()=>setLoadingTier3(false));};
  const tier1=cards.filter((c:any)=>c.tier===1&&!dismissed.includes(cardKey(c)));
  const tier2=cards.filter((c:any)=>c.tier===2&&!dismissed.includes(cardKey(c)));
  const tier3visible=tier3Cards.filter((c:any)=>!dismissed.includes(cardKey(c)));
  const moodObj=moods.find((m:any)=>m.id===inputs?.mood);
  const radiusObj=radii.find((r:any)=>r.id===inputs?.radius);
  const groupObj=groups.find((g:any)=>g.id===inputs?.group);
  if(loading) return <SkeletonScreen t={t}/>;
  if(error) return(<div style={{position:"relative",zIndex:1,padding:"52px 24px",textAlign:"center"}}><p style={{fontSize:40,margin:"0 0 16px"}}>😅</p><h2 style={{fontSize:20,fontWeight:800,color:t.text,margin:"0 0 8px"}}>Something went wrong</h2><p style={{fontSize:13,color:t.textMuted,margin:"0 0 24px"}}>{error}</p><button onClick={load} style={{backgroundColor:t.text,color:t.bg,border:"none",borderRadius:14,padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Try again</button></div>);
  const CardItem=({card,i,animate=true}:any)=>{const k=cardKey(card);const badge=getBudgetBadge(card,inputs?.budget);return(<div key={k} style={{backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:20,overflow:"hidden",boxShadow:"0 2px 14px rgba(0,0,0,0.07)",animation:animate?`fadeUp 0.3s ease ${i*0.06}s both`:"none",position:"relative"}}>{(badge||card.isFreebie)&&(<div style={{position:"absolute",top:12,right:12,zIndex:2,backgroundColor:badge?badge.bg:"#C8F0D8",borderRadius:20,padding:"4px 10px"}}><span style={{fontSize:11,fontWeight:700,color:badge?badge.color:"#2DBE6C"}}>{badge?badge.text:"🌿 Freebie"}</span></div>)}{card.deal&&<div style={{backgroundColor:t.accentSoft,padding:"8px 16px",borderBottom:`1px solid ${t.border}`}}><span style={{fontSize:12,fontWeight:700,color:t.accent}}>{card.deal}</span></div>}<div style={{padding:"16px 16px 14px",paddingTop:badge||card.isFreebie?"36px":"16px"}}><div style={{display:"flex",gap:13,alignItems:"flex-start"}}><div style={{width:48,height:48,borderRadius:13,backgroundColor:t.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{card.emoji}</div><div style={{flex:1}}><span style={{display:"inline-block",fontSize:10,fontWeight:700,color:t.accent,backgroundColor:t.accentSoft,padding:"3px 8px",borderRadius:6,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{card.tag}</span><h3 style={{margin:0,fontSize:16,fontWeight:700,color:t.text,letterSpacing:-0.3}}>{card.title}</h3><p style={{margin:"5px 0 0",fontSize:13,color:t.textMuted,lineHeight:1.45}}>{card.why}</p></div></div><div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${t.border}`}}><p style={{margin:"0 0 10px",fontSize:12,color:t.textMuted}}><span>📍 {card.location}</span><span style={{margin:"0 6px",opacity:0.35}}>·</span><span>🕐 {card.distance}</span><span style={{margin:"0 6px",opacity:0.35}}>·</span><span style={{fontWeight:700,color:t.text}}>{card.cost}</span></p><div style={{display:"flex",gap:8}}><button onClick={()=>onOpenDetail(card)} style={{flex:1,backgroundColor:t.text,color:t.bg,border:"none",borderRadius:10,padding:"11px 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Plan this →</button><button onClick={()=>setDismissed((d:string[])=>[...d,k])} style={{backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"11px 16px",fontSize:13,color:t.textMuted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>✕</button></div></div></div></div>);};
  return(<div style={{position:"relative",zIndex:1,padding:"52px 24px 100px"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:t.textMuted,fontFamily:"'DM Sans',sans-serif",padding:0,fontWeight:700}}>← Back</button><button onClick={onProfile} style={{marginLeft:"auto",background:t.surface,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:14}}>👤</button></div>
  <h2 style={{fontSize:28,fontWeight:800,color:t.text,margin:"0 0 6px",letterSpacing:-0.8}}>{targetBand?`Adding to ${TIME_BANDS.find((b:any)=>b.id===targetBand)?.label}`:"Your Vybe is ready"}</h2>
  {targetBand&&<p style={{fontSize:13,color:t.textMuted,margin:"0 0 14px"}}>Pick an activity for your {TIME_BANDS.find((b:any)=>b.id===targetBand)?.label.toLowerCase()} slot</p>}
  {weatherInfo&&<div style={{backgroundColor:t.accentSoft,border:`1.5px solid ${t.accent}`,borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>🌤</span><p style={{margin:0,fontSize:13,fontWeight:600,color:t.text}}>{weatherInfo}</p></div>}
  {!targetBand&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>{[`📍 ${cityName}`,moodObj&&`${moodObj.emoji} ${moodObj.label}`,groupObj&&`${groupObj.emoji} ${groupObj.label}`,radiusObj&&`⏱ ${radiusObj.label}`,inputs?.cheapMode&&"💸 Cheaply"].filter(Boolean).map((tag:any,i:number)=>(<span key={i} style={{fontSize:11,fontWeight:600,color:t.textMuted,backgroundColor:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"4px 10px"}}>{tag}</span>))}</div>}
  {inputs?.cheapMode&&<div style={{backgroundColor:t.accentSoft,border:`1.5px solid ${t.accent}`,borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>💸</span><div><p style={{margin:0,fontSize:13,fontWeight:700,color:t.text}}>Do It Cheaply is on</p><p style={{margin:0,fontSize:12,color:t.textMuted}}>Freebies & deals prioritized</p></div></div>}
  {tier1.length>0&&<><p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:1}}>✦ Top picks for you</p><div style={{display:"flex",flexDirection:"column",gap:13,marginBottom:16}}>{tier1.map((card:any,i:number)=><CardItem key={cardKey(card)} card={card} i={i}/>)}</div></>}
  {tier2.length>0&&!showMore&&<button onClick={()=>setShowMore(true)} style={{width:"100%",backgroundColor:t.surface,border:`1.5px solid ${t.border}`,borderRadius:16,padding:"14px 20px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div><p style={{margin:0,fontSize:14,fontWeight:700,color:t.text}}>More options near you</p><p style={{margin:0,fontSize:12,color:t.textMuted,marginTop:2}}>{tier2.length} additional suggestions</p></div><span style={{fontSize:18,color:t.textMuted}}>↓</span></button>}
  {showMore&&tier2.length>0&&<><p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:1}}>More near you</p><div style={{display:"flex",flexDirection:"column",gap:13,marginBottom:16}}>{tier2.map((card:any,i:number)=><CardItem key={cardKey(card)} card={card} i={i} animate={false}/>)}</div></>}
  {showMore&&!tier3Loaded&&!loadingTier3&&<button onClick={loadTier3} style={{width:"100%",backgroundColor:t.bg,border:`1.5px dashed ${t.border}`,borderRadius:16,padding:"14px 20px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}><span style={{fontSize:14,fontWeight:700,color:t.textMuted}}>Load more options</span><span style={{fontSize:16,color:t.textMuted}}>↓</span></button>}
  {loadingTier3&&<div style={{textAlign:"center",padding:"24px 0"}}><div style={{width:28,height:28,borderRadius:"50%",border:`3px solid ${t.border}`,borderTopColor:t.accent,animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}}/><p style={{fontSize:13,color:t.textMuted,margin:0}}>Loading more…</p></div>}
  {tier3Loaded&&tier3visible.length>0&&<><p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:1}}>Even more options</p><div style={{display:"flex",flexDirection:"column",gap:13,marginBottom:16}}>{tier3visible.map((card:any,i:number)=><CardItem key={cardKey(card)} card={card} i={i} animate={false}/>)}</div></>}
  {tier1.length===0&&tier2.length===0&&<div style={{textAlign:"center",padding:"48px 0"}}><p style={{fontSize:36,margin:"0 0 12px"}}>🌀</p><p style={{color:t.textMuted,fontSize:14}}>All cleared — go back and change your vibe.</p><button onClick={onBack} style={{marginTop:16,backgroundColor:t.text,color:t.bg,border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Try again</button></div>}
  </div>);
}

export default function App() {
  const [screen,setScreen]=useState("splash");
  const [showTransition,setShowTransition]=useState(false);
  const [inputs,setInputs]=useState<any>(null);
  const [cityName,setCityName]=useState("San Juan, Puerto Rico");
  const [showProfile,setShowProfile]=useState(false);
  const [colorMode,setColorMode]=useState("system");
  const [paletteId,setPaletteId]=useState("default");
  const [surpriseGroup,setSurpriseGroup]=useState("couple");
  const [surpriseMode,setSurpriseMode]=useState(false);
  const [detailCard,setDetailCard]=useState<any>(null);
  const [dayPlan,setDayPlan]=useState<any[]>([]);
  const [targetBand,setTargetBand]=useState<string|null>(null);
  const [weatherInfo,setWeatherInfo]=useState("");

  const systemDark=typeof window!=="undefined"&&window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark=colorMode==="dark"||(colorMode==="system"&&systemDark);
  const base=paletteOptions.find((p:any)=>p.id===paletteId)||paletteOptions[0];
  const t=isDark?{...darkBase,accent:base.accent,accentSoft:base.accentSoft,grad:["#141210","#181614","#121010"]}:base;

  useEffect(()=>{if(cityName.trim()) fetchWeather(cityName).then(setWeatherInfo);},[cityName]);

  const addToDay=(card:any,band:any)=>{
    const finalBand=band||defaultBand(card);
    setDayPlan((prev:any)=>[...prev,{card,band:finalBand,order:prev.filter((p:any)=>p.band===finalBand).length,date:new Date().toISOString().split("T")[0]}]);
    setDetailCard(null);setTargetBand(null);setScreen("planner");
  };
  const removeFromDay=(k:string)=>setDayPlan((prev:any)=>prev.filter((p:any)=>cardKey(p.card)!==k));
  const moveInDay=(k:string,newBand:string)=>setDayPlan((prev:any)=>prev.map((p:any)=>cardKey(p.card)===k?{...p,band:newBand}:p));
  const addMoreFromPlanner=(bandId:string)=>{setTargetBand(bandId);setScreen("results");};
  const cp={t,onProfile:()=>setShowProfile(true)};

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        body{margin:0;background:${t.bg};transition:background 0.4s ease;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
        @keyframes pulse{from{transform:scale(1)}to{transform:scale(1.06)}}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:0}
        input::placeholder{color:${t.textLight}}
        #root{min-height:100vh;display:flex;justify-content:center;}
        .vybe-app{width:100%;max-width:430px;position:relative;overflow:hidden;min-height:100vh;}
      `}</style>
      <div className="vybe-app">
        <AppBackground t={t}/>
        {showTransition&&<TransitionScreen t={t} onDone={()=>{setShowTransition(false);setScreen("vibe");}}/>}
        {!showTransition&&screen==="splash"&&<SplashScreen onEnter={()=>setShowTransition(true)} cityName={cityName} onCityChange={setCityName} {...cp}/>}
        {!showTransition&&screen==="vibe"&&!surpriseMode&&<VibeCheckScreen cityName={cityName} onCityChange={setCityName} onSubmit={(data:any)=>{setInputs(data);setTargetBand(null);setScreen("results");}} onSurprise={(group:string)=>{setSurpriseGroup(group);setSurpriseMode(true);}} {...cp}/>}
        {!showTransition&&surpriseMode&&<SurpriseAnimation group={surpriseGroup} t={t} onDone={(data:any)=>{setInputs({...data,group:surpriseGroup});setSurpriseMode(false);setTargetBand(null);setScreen("results");}}/>}
        {!showTransition&&screen==="results"&&!surpriseMode&&<ResultsScreen inputs={inputs} cityName={cityName} onBack={()=>{setTargetBand(null);setScreen(targetBand?"planner":"vibe");}} onOpenDetail={(card:any)=>setDetailCard(card)} targetBand={targetBand} weatherInfo={weatherInfo} {...cp}/>}
        {!showTransition&&screen==="planner"&&<DayPlanner plan={dayPlan} cityName={cityName} onRemove={removeFromDay} onMove={moveInDay} onAddMore={addMoreFromPlanner} onConfirm={()=>setScreen("confirm")} onBack={()=>setScreen("results")} t={t}/>}
        {!showTransition&&screen==="confirm"&&<ConfirmScreen plan={dayPlan} cityName={cityName} onBack={()=>setScreen("planner")} t={t}/>}
        {detailCard&&<DetailSheet card={detailCard} onClose={()=>setDetailCard(null)} onAddToDay={addToDay} targetBand={targetBand} t={t}/>}
        {showProfile&&<ProfileScreen onClose={()=>setShowProfile(false)} colorMode={colorMode} setColorMode={setColorMode} paletteId={paletteId} setPaletteId={setPaletteId} t={t}/>}
      </div>
    </>
  );
}
