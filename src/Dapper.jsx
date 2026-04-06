import { useState, useEffect } from "react"
import { useClaudeVision } from './hooks/useClaudeVision.js'
import { useAuth } from './hooks/useAuth.js'
import { useCloset, useWornLog, useCalendarEvents } from './hooks/useFirestore.js'
import AuthModal from './components/AuthModal.jsx'
import {
  Shirt, Calendar, Users, Tag, Upload, Heart,
  MessageCircle, Plus, ChevronLeft, ChevronRight,
  Check, Crown, Camera, Search, Bell, Star, Zap,
  Menu, X, Wand2, TrendingUp, Award, Clock, Lock,
  LogIn, LogOut, User
} from "lucide-react"

// ─────────────────────────────────────────────
// OPENAI API KEY — paste yours here
// ─────────────────────────────────────────────
const OPENAI_API_KEY = ""

// ─────────────────────────────────────────────
// MOCK DATA (used as fallback / demo mode)
// ─────────────────────────────────────────────

const CLOSET_ITEMS_INIT = [
  { id: 1,  type: "Suit",      name: "Navy Chalk Stripe",       color: "#1B3A6B", brand: "BOSS",              occasions: ["Business Formal", "Interview"] },
  { id: 2,  type: "Suit",      name: "Charcoal Worsted Wool",   color: "#36454F", brand: "Canali",            occasions: ["Business", "Formal"] },
  { id: 3,  type: "Suit",      name: "Mid-Grey Glen Plaid",     color: "#6E7B8B", brand: "Zegna",             occasions: ["Business Casual"] },
  { id: 4,  type: "Suit",      name: "Tan Summer Linen",        color: "#C4A882", brand: "Lardini",           occasions: ["Smart Casual", "Summer"] },
  { id: 5,  type: "Shirt",     name: "Crisp White Poplin",      color: "#F8F8F8", brand: "Charles Tyrwhitt",  occasions: ["All"] },
  { id: 6,  type: "Shirt",     name: "Pale French Blue",        color: "#89B4D4", brand: "Thomas Pink",       occasions: ["Business"] },
  { id: 7,  type: "Shirt",     name: "Soft Pink Bengal Stripe", color: "#F4B8C1", brand: "Emma Willis",       occasions: ["Business Casual"] },
  { id: 8,  type: "Shirt",     name: "Pale Yellow Poplin",      color: "#FFF5CC", brand: "Harvie & Hudson",   occasions: ["Casual", "Smart"] },
  { id: 9,  type: "Tie",       name: "Burgundy Grenadine",      color: "#722F37", brand: "Drake's London",    occasions: ["Formal"] },
  { id: 10, type: "Tie",       name: "Gold & Navy Repp Stripe", color: "#C9A84C", brand: "Brooks Brothers",   occasions: ["Business"] },
  { id: 11, type: "Tie",       name: "Forest Green Foulard",    color: "#355E3B", brand: "Hermès",            occasions: ["Business Casual"] },
  { id: 12, type: "Shoes",     name: "Black Cap-Toe Oxford",    color: "#1C1C1C", brand: "Carmina",           occasions: ["Formal", "Business"] },
  { id: 13, type: "Shoes",     name: "Tan Derby Brogue",        color: "#8B6914", brand: "Church's",          occasions: ["Business Casual"] },
  { id: 14, type: "Accessory", name: "White Linen Square",      color: "#F8F8F8", brand: "Brioni",            occasions: ["Formal"] },
  { id: 15, type: "Accessory", name: "Silver Dress Watch",      color: "#C0C0C0", brand: "Longines",          occasions: ["All"] },
]

const SOCIAL_POSTS = [
  {
    id: 1, user: "Marco_Visconti", initials: "MV", avatar: "#1B3A6B", role: "Milan Executive", badge: "Elite",
    outfit: "Navy Chalk Stripe · White Poplin · Burgundy Grenadine",
    look: "The Milan Executive",
    caption: "Closed a €2M deal in this configuration. The navy chalk stripe carries a weight in the room that no amount of small talk can replace. 💼",
    likes: 342, comments: 28, timeAgo: "2h ago",
    tags: ["#NavyChalkStripe", "#BusinessFormal", "#PowerDressing"],
  },
  {
    id: 2, user: "JamesR_London", initials: "JR", avatar: "#36454F", role: "City Analyst", badge: "Pro",
    outfit: "Charcoal Wool · French Blue · Terracotta Repp Stripe",
    look: "The City Banker",
    caption: "Friday client lunch in Mayfair. The blue-grey-terracotta trio has been my go-to all season. Simple. Effective. Timeless.",
    likes: 218, comments: 15, timeAgo: "5h ago",
    tags: ["#CharcoalSuit", "#BusinessStyle", "#CitizenOfStyle"],
  },
  {
    id: 3, user: "Pablo_Reyes_CDM", initials: "PR", avatar: "#C4A882", role: "Creative Director", badge: "Elite",
    outfit: "Tan Linen · White Voile · Burgundy Pocket Puff (no tie)",
    look: "The Weekend Maverick",
    caption: "Summer Fridays were invented for linen suits. The trick with no-tie dressing is that every other element must be impeccable. Don't phone it in.",
    likes: 486, comments: 41, timeAgo: "1d ago",
    tags: ["#LinenSuit", "#SummerStyle", "#NecktieFreeZone"],
  },
  {
    id: 4, user: "Kai_Hartmann", initials: "KH", avatar: "#800020", role: "Brand Strategist", badge: "Pro",
    outfit: "Midnight Blue Peak Lapel Tux · White Dress Shirt · Black Grenadine Bow",
    look: "The Midnight Sovereign",
    caption: "Black tie done right — midnight blue is more sophisticated than black under candlelight. The peak lapel is non-negotiable.",
    likes: 621, comments: 57, timeAgo: "2d ago",
    tags: ["#BlackTie", "#MidnightBlue", "#FormalDressing"],
  },
]

// ── Outfit worn log (history) ──
const WORN_LOG_INIT = [
  { id:1,  date:"2026-03-28", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Pale French Blue",        tie:"Charcoal Grenadine",       occasion:"Product Launch",        notes:"Feedback muy positivo del equipo." },
  { id:2,  date:"2026-03-24", suit:"Charcoal Worsted Wool",  suitColor:"#36454F", shirt:"Crisp White Poplin",      tie:"Silver & White Stripe",     occasion:"Presentación ejecutiva", notes:"" },
  { id:3,  date:"2026-03-18", suit:"Charcoal Worsted Wool",  suitColor:"#36454F", shirt:"Pale French Blue",        tie:"Midnight Navy Grenadine",   occasion:"Entrevista de trabajo",  notes:"Conseguí el contrato." },
  { id:4,  date:"2026-03-15", suit:"Mid-Grey Glen Plaid",    suitColor:"#6E7B8B", shirt:"Pale French Blue",        tie:"Forest Green Foulard",      occasion:"Team Offsite",           notes:"" },
  { id:5,  date:"2026-03-10", suit:"Tan Summer Linen",       suitColor:"#C4A882", shirt:"Crisp White Poplin",      tie:"—",                         occasion:"Studio Visit",           notes:"Sin corbata, solo pocket square." },
  { id:6,  date:"2026-03-05", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Crisp White Poplin",      tie:"Gold & Navy Repp Stripe",   occasion:"Client Lunch",           notes:"" },
  { id:7,  date:"2026-03-02", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Crisp White Poplin",      tie:"Burgundy Grenadine",        occasion:"Board Meeting",          notes:"Cerré el deal de Q1." },
  { id:8,  date:"2026-02-26", suit:"Charcoal Worsted Wool",  suitColor:"#36454F", shirt:"Soft Pink Bengal Stripe", tie:"Navy Polka Dot",            occasion:"Client Dinner",          notes:"Muy bien recibido el look." },
  { id:9,  date:"2026-02-20", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Pale French Blue",        tie:"Burgundy Micro-Paisley",    occasion:"Conference",             notes:"" },
  { id:10, date:"2026-02-14", suit:"Mid-Grey Glen Plaid",    suitColor:"#6E7B8B", shirt:"Pale Yellow Poplin",      tie:"Camel Knit",                occasion:"Valentine's Dinner",     notes:"Ella lo amó." },
]

const CALENDAR_EVENTS_INIT = {
  "2026-03-02": { outfit: "Navy Chalk Stripe + White Poplin + Burgundy Grenadine", occasion: "Board Meeting",    color: "#1B3A6B" },
  "2026-03-05": { outfit: "Charcoal Wool + French Blue + Gold Repp Stripe",        occasion: "Client Lunch",     color: "#36454F" },
  "2026-03-10": { outfit: "Tan Linen + White Voile (no tie)",                      occasion: "Studio Visit",     color: "#C4A882" },
  "2026-03-15": { outfit: "Mid-Grey Glen Plaid + Pale Blue + Forest Green Foulard",occasion: "Team Offsite",     color: "#6E7B8B" },
  "2026-03-18": { outfit: "Charcoal Wool + White Poplin + Silver Repp Stripe",     occasion: "Job Interview",    color: "#36454F" },
  "2026-03-24": { outfit: "Burgundy Velvet Blazer + Ivory Dress Shirt",            occasion: "Gala Evening",     color: "#800020" },
  "2026-03-28": { outfit: "Navy Chalk Stripe + French Blue + Charcoal Grenadine",  occasion: "Product Launch",   color: "#1B3A6B" },
  "2026-03-30": { outfit: "Navy Chalk Stripe + French Blue + Terracotta Repp",     occasion: "Today",            color: "#1B3A6B" },
}

const ANALYSIS = {
  suit: {
    colorFamily: "Classic Navy",
    undertones: "Warm indigo undertones",
    fabric: "Wool twill, ~260 g/m²",
    pattern: "Chalk Stripe — 1.5 cm spacing",
    formality: "Business Formal",
    lapel: "Notch lapel",
    fit: "Slim fit",
  },
  shirts: [
    {
      id: 1, name: "Crisp White Poplin", colorCode: "#F8F8F8",
      why: "Pure white delivers razor-sharp contrast against the navy chalk stripe, maximising formality and impact.",
      collar: "Spread collar", pattern: "Solid",
      pocketSquare: { name: "White Irish Linen", fold: "TV Fold (Presidential)", material: "Irish Linen" },
      ties: [
        { id:1, name:"Burgundy Grenadine Solid",   color:"#722F37", pattern:"Solid Grenadine",   material:"Silk Grenadine",    width:'3"', knot:"Half Windsor",   harmony:"Complementary",   why:"The quintessential authority pairing — navy and burgundy is the power combination of the boardroom." },
        { id:2, name:"Gold & Navy Repp Stripe",    color:"#C9A84C", pattern:"Repp Stripe",       material:"Silk Twill",        width:'3"', knot:"Four-in-Hand",   harmony:"Analogous",       why:"Gold threads echo the chalk stripe while deep navy grounds the look with tonal depth." },
        { id:3, name:"Forest Green Foulard",       color:"#355E3B", pattern:"Foulard (geometric)",material:"Matte Silk",        width:'3"', knot:"Pratt/Shelby",   harmony:"Triadic",         why:"Forest green completes a sophisticated triadic palette, adding quiet distinction." },
        { id:4, name:"Silver-Grey Polka Dot",      color:"#A9A9A9", pattern:"Polka Dot",         material:"Silk Twill",        width:'3"', knot:"Four-in-Hand",   harmony:"Analogous",       why:"The grey mirrors the chalk stripe itself, creating cool, restrained elegance." },
        { id:5, name:"Deep Teal Wool Knit",        color:"#008080", pattern:"Solid Knit",        material:"Wool-Silk Knit",    width:'2.5"',knot:"Four-in-Hand",   harmony:"Complementary",   why:"Knit texture adds tactile richness; teal bridges the cool navy warmth beautifully." },
        { id:6, name:"Burnt Orange Paisley",       color:"#CC5500", pattern:"Paisley",           material:"Silk Twill",        width:'3"', knot:"Half Windsor",   harmony:"Complementary",   why:"For the confident dresser: burnt orange against navy is striking without aggression." },
      ],
    },
    {
      id: 2, name: "Pale French Blue End-on-End", colorCode: "#89B4D4",
      why: "Blue-on-blue tonal harmony deepens the suit's presence without competing — a move of real sophistication.",
      collar: "Semi-spread collar", pattern: "End-on-End weave",
      pocketSquare: { name: "White Cotton", fold: "One Point", material: "Cotton" },
      ties: [
        { id:1, name:"Terracotta Repp Stripe",     color:"#CB6D51", pattern:"Repp Stripe",       material:"Silk Twill",        width:'3"', knot:"Four-in-Hand",   harmony:"Complementary",   why:"Warm terracotta against cool pale blue is the most naturally elegant contrast in menswear." },
        { id:2, name:"Midnight Navy Grenadine",    color:"#191970", pattern:"Solid Grenadine",   material:"Silk Grenadine",    width:'3"', knot:"Half Windsor",   harmony:"Monochromatic",   why:"Tone-on-tone navy dressing — depth and sophistication in its purest form." },
        { id:3, name:"Burgundy Micro-Paisley",     color:"#722F37", pattern:"Micro-Paisley",     material:"Silk Twill",        width:'3"', knot:"Half Windsor",   harmony:"Complementary",   why:"Burgundy's warmth cuts through the cool blue register with elegant energy." },
        { id:4, name:"Olive & Gold Geometric",     color:"#808000", pattern:"Geometric Foulard", material:"Silk",              width:'3"', knot:"Four-in-Hand",   harmony:"Triadic",         why:"Olive-gold adds Italian flair — a warm accent in a cool blue ensemble." },
        { id:5, name:"Charcoal Grenadine",         color:"#36454F", pattern:"Solid Grenadine",   material:"Silk Grenadine",    width:'3"', knot:"Kelvin",         harmony:"Analogous",       why:"Charcoal anchors pale blue with authority — clean, modern, professional." },
        { id:6, name:"Silver & White Stripe",      color:"#C0C0C0", pattern:"Stripe",            material:"Silk",              width:'3"', knot:"Pratt/Shelby",   harmony:"Analogous",       why:"Crisp and precise — ideal for high-stakes environments where detail matters most." },
      ],
    },
    {
      id: 3, name: "Pale Pink Bengal Stripe", colorCode: "#F4B8C1",
      why: "Warm rose complements the cool navy with a confident twist of personality without sacrificing professionalism.",
      collar: "Button-down collar", pattern: "Bengal Stripe (pink/white)",
      pocketSquare: { name: "Pink Silk", fold: "Puff Fold", material: "Silk" },
      ties: [
        { id:1, name:"Navy Polka Dot",             color:"#1B3A6B", pattern:"Polka Dot",         material:"Silk Twill",        width:'3"', knot:"Four-in-Hand",   harmony:"Monochromatic",   why:"Deep navy anchors the pink while the polka dot adds precision and playfulness." },
        { id:2, name:"Charcoal & Silver Stripe",   color:"#36454F", pattern:"Repp Stripe",       material:"Silk Twill",        width:'3"', knot:"Half Windsor",   harmony:"Analogous",       why:"Cool charcoal-silver calms the warmth of pink — an understated power move." },
        { id:3, name:"Deep Teal Solid",            color:"#008080", pattern:"Solid Grenadine",   material:"Silk Grenadine",    width:'3"', knot:"Four-in-Hand",   harmony:"Complementary",   why:"Teal-pink is unexpectedly elegant — cool and warm tones in perfect balance." },
        { id:4, name:"Camel Knit",                 color:"#C19A6B", pattern:"Solid Knit",        material:"Wool Knit",         width:'2.5"',knot:"Four-in-Hand",   harmony:"Analogous",       why:"Warm camel echoes the warmth of pink, adding a relaxed sophistication." },
        { id:5, name:"Forest Green Club Tie",      color:"#355E3B", pattern:"Club (crests)",     material:"Wool-Silk Blend",   width:'3"', knot:"Four-in-Hand",   harmony:"Triadic",         why:"An Ivy League nod — forest green, pink, and navy is timelessly preppy." },
        { id:6, name:"Maroon Paisley",             color:"#800020", pattern:"Paisley",           material:"Silk Twill",        width:'3"', knot:"Half Windsor",   harmony:"Complementary",   why:"Maroon deepens and grounds the pink in an elegant, Old World manner." },
      ],
    },
  ],
  packages: [
    {
      name: "The Milan Executive",
      suit: "Navy Chalk Stripe", shirt: "Crisp White Poplin", tie: "Burgundy Grenadine",
      pocketSquare: "White Linen — TV Fold", shoes: "Black Cap-Toe Oxfords",
      belt: "Black calf leather, slim gold buckle", socks: "Dark navy, over-the-calf", watch: "Silver dress watch",
      occasion: "Board meeting, client pitch, job interview",
      archetype: "British Classic", confidence: 2,
      tip: "Keep the pocket square white and flat — the restraint is what gives this look its authority.",
      shirtColor: "#F8F8F8", tieColor: "#722F37",
    },
    {
      name: "The Continental Authority",
      suit: "Navy Chalk Stripe", shirt: "Pale French Blue", tie: "Terracotta Repp Stripe",
      pocketSquare: "Ivory Cotton — One Point", shoes: "Dark Brown Derby Brogues",
      belt: "Dark cognac leather", socks: "Burgundy shadow stripe", watch: "Gold-case dress watch",
      occasion: "Senior leadership, diplomatic dinner",
      archetype: "Italian", confidence: 4,
      tip: "Brown shoes with navy is the move that separates the truly stylish from the merely correct.",
      shirtColor: "#89B4D4", tieColor: "#CB6D51",
    },
    {
      name: "The Weekend Power Move",
      suit: "Navy Chalk Stripe", shirt: "Pale Pink Bengal Stripe", tie: "Deep Teal Wool Knit",
      pocketSquare: "Pink Silk — Puff Fold", shoes: "Tan Suede Monk Strap",
      belt: "Tan suede", socks: "Teal or light grey", watch: "Sport-dress watch",
      occasion: "Business casual Friday, gallery opening, client lunch",
      archetype: "Continental", confidence: 4,
      tip: "The knit tie softens the chalk stripe's formality — authority without rigidity.",
      shirtColor: "#F4B8C1", tieColor: "#008080",
    },
    {
      name: "The Understated Maverick",
      suit: "Navy Chalk Stripe", shirt: "Crisp White Poplin", tie: "Forest Green Foulard",
      pocketSquare: "Green Silk — Two Point", shoes: "Black Oxford Brogues",
      belt: "Black leather", socks: "Forest green, over-the-calf", watch: "Dress watch, dark strap",
      occasion: "Creative business, brand events, media appearances",
      archetype: "Avant-Garde", confidence: 4,
      tip: "The foulard's small pattern prevents a clash with the chalk stripe — scale variation is everything.",
      shirtColor: "#F8F8F8", tieColor: "#355E3B",
    },
    {
      name: "The City Classicist",
      suit: "Navy Chalk Stripe", shirt: "Pale French Blue", tie: "Midnight Navy Grenadine",
      pocketSquare: "White Linen — TV Fold", shoes: "Black Cap-Toe Oxfords",
      belt: "Black leather", socks: "Navy ribbed", watch: "Silver dress watch",
      occasion: "City meetings, financial sector, law firm",
      archetype: "British Classic", confidence: 1,
      tip: "Tone-on-tone navy lives or dies by the tailoring — this look demands perfect fit.",
      shirtColor: "#89B4D4", tieColor: "#191970",
    },
    {
      name: "The Golden Standard",
      suit: "Navy Chalk Stripe", shirt: "Crisp White Poplin", tie: "Gold & Navy Repp Stripe",
      pocketSquare: "Gold Silk — Puff Fold", shoes: "Brown Oxford Brogues",
      belt: "Cognac leather", socks: "Burgundy solid", watch: "Gold-tone dress watch",
      occasion: "Awards ceremony, keynote speaker, key negotiations",
      archetype: "Italian", confidence: 3,
      tip: "The gold repp is a statement — let it lead and keep everything else in supporting roles.",
      shirtColor: "#F8F8F8", tieColor: "#C9A84C",
    },
  ],
}

// ─────────────────────────────────────────────
// LOCAL SUIT ANALYSIS BY COLOR
// ─────────────────────────────────────────────

const ANALYSIS_BLACK = {
  suit: { colorFamily:"Jet Black", undertones:"Cool neutral undertones", fabric:"Wool twill, ~280 g/m²", pattern:"Solid", formality:"Business Formal / Black Tie", lapel:"Peak or notch lapel", fit:"Slim fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against black is the sharpest contrast in menswear — commanding and timeless.", collar:"Spread collar", pattern:"Solid poplin",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Silver Grenadine",        color:"#C0C0C0", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"',  knot:"Half Windsor",  harmony:"Analogous",      why:"Silver on white and black creates a sleek, sophisticated monochromatic look." },
        { id:2, name:"Burgundy Silk Solid",     color:"#722F37", pattern:"Solid",            material:"Silk Twill",     width:'3"',  knot:"Half Windsor",  harmony:"Complementary",  why:"Burgundy is the one warm accent that makes a black suit come alive." },
        { id:3, name:"Deep Charcoal Grenadine", color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"',  knot:"Four-in-Hand",  harmony:"Monochromatic",  why:"Tonal dark elegance — understated power for boardroom and evening alike." },
        { id:4, name:"Navy Repp Stripe",        color:"#1B3A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"',  knot:"Four-in-Hand",  harmony:"Analogous",      why:"Navy stripe breaks the severity of all-black with classic authority." },
        { id:5, name:"Champagne Gold Foulard",  color:"#C9A84C", pattern:"Foulard",          material:"Matte Silk",     width:'3"',  knot:"Pratt/Shelby",  harmony:"Complementary",  why:"Gold on black is pure evening glamour — perfect for a gala or cocktail event." },
        { id:6, name:"Black Knit",              color:"#1C1C1C", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand",  harmony:"Monochromatic",  why:"A tonal black knit adds tactile texture to an all-black look — modern and directional." },
      ]
    },
    { id:2, name:"Pale French Blue End-on-End", colorCode:"#89B4D4", why:"The only colour that softens a black suit without weakening it — cool blue adds personality and warmth.", collar:"Semi-spread collar", pattern:"End-on-End weave",
      pocketSquare:{ name:"White Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Midnight Navy Solid",     color:"#191970", pattern:"Solid",            material:"Silk Grenadine", width:'3"',  knot:"Half Windsor",  harmony:"Monochromatic",  why:"Navy-on-blue with a black suit is effortlessly elegant — perfect City dressing." },
        { id:2, name:"Burgundy Micro-Paisley",  color:"#722F37", pattern:"Micro-Paisley",    material:"Silk Twill",     width:'3"',  knot:"Half Windsor",  harmony:"Complementary",  why:"The paisley adds Old World richness; burgundy bridges blue and black beautifully." },
        { id:3, name:"Silver & White Stripe",   color:"#C0C0C0", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"',  knot:"Four-in-Hand",  harmony:"Analogous",      why:"Crisp and precise — the right choice when the room demands flawless detail." },
        { id:4, name:"Charcoal Grenadine",      color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"',  knot:"Kelvin",        harmony:"Analogous",      why:"Charcoal grounds pale blue in the context of a black suit — controlled elegance." },
        { id:5, name:"Forest Green Foulard",    color:"#355E3B", pattern:"Foulard",          material:"Matte Silk",     width:'3"',  knot:"Pratt/Shelby",  harmony:"Triadic",        why:"Green adds an unexpected Italian flourish — sophisticated and distinctive." },
        { id:6, name:"Deep Teal Solid",         color:"#008080", pattern:"Solid",            material:"Silk Grenadine", width:'3"',  knot:"Four-in-Hand",  harmony:"Complementary",  why:"Teal against pale blue and black creates a jewel-tone effect that commands attention." },
      ]
    },
    { id:3, name:"Soft Pink Bengal Stripe", colorCode:"#F4B8C1", why:"Confident and unexpected — pink against black projects a self-assured masculinity that sets you apart.", collar:"Button-down collar", pattern:"Bengal Stripe (pink/white)",
      pocketSquare:{ name:"Pink Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Black Satin Bow",         color:"#1C1C1C", pattern:"Solid Satin",      material:"Silk Satin",     width:'3"',  knot:"Bow Tie",       harmony:"Monochromatic",  why:"Pink shirt with a black bow tie on a black suit is peak cocktail hour elegance." },
        { id:2, name:"Navy Polka Dot",          color:"#1B3A6B", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"',  knot:"Four-in-Hand",  harmony:"Complementary",  why:"Navy polka dot anchors the warmth of pink with classic precision." },
        { id:3, name:"Charcoal & White Stripe", color:"#36454F", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"',  knot:"Half Windsor",  harmony:"Analogous",      why:"Cool stripe calms the warmth of pink — an understated power move." },
        { id:4, name:"Camel Knit",              color:"#C19A6B", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand",  harmony:"Analogous",      why:"Camel echoes the warmth of pink beautifully — relaxed sophistication." },
        { id:5, name:"Maroon Paisley",          color:"#800020", pattern:"Paisley",          material:"Silk Twill",     width:'3"',  knot:"Half Windsor",  harmony:"Complementary",  why:"Maroon deepens and grounds the pink in a bold, Old World manner." },
        { id:6, name:"Deep Teal Solid",         color:"#008080", pattern:"Solid",            material:"Silk Grenadine", width:'3"',  knot:"Four-in-Hand",  harmony:"Complementary",  why:"Teal-pink is an unexpectedly elegant pairing — cool meets warm in perfect balance." },
      ]
    },
  ],
  packages:[
    { name:"The Midnight Sovereign",    suit:"Black Wool", shirt:"Crisp White Poplin",      tie:"Silver Grenadine",      pocketSquare:"White Linen — TV Fold",   shoes:"Black Cap-Toe Oxfords", belt:"Black calf leather", socks:"Black over-the-calf", watch:"Silver dress watch", occasion:"Gala, black tie optional, senior leadership", archetype:"British Classic", confidence:2, tip:"The white pocket square must be immaculately flat — the restraint is the statement.", shirtColor:"#F8F8F8", tieColor:"#C0C0C0" },
    { name:"The Evening Authority",     suit:"Black Wool", shirt:"Crisp White Poplin",      tie:"Burgundy Silk Solid",   pocketSquare:"White Linen — TV Fold",   shoes:"Black Patent Oxfords",  belt:"Black patent leather", socks:"Black ribbed", watch:"Silver dress watch", occasion:"Formal dinner, award ceremony, important client", archetype:"Italian", confidence:3, tip:"Burgundy is the one tie that makes a white-on-black look feel warm rather than cold.", shirtColor:"#F8F8F8", tieColor:"#722F37" },
    { name:"The City Modernist",        suit:"Black Wool", shirt:"Pale French Blue",        tie:"Midnight Navy Solid",   pocketSquare:"White Cotton — One Point",shoes:"Black Derby",           belt:"Black leather",        socks:"Navy ribbed", watch:"Silver dress watch", occasion:"Board meeting, client pitch, financial sector", archetype:"Continental", confidence:2, tip:"Blue-on-blue-on-black is the understated move of a man who knows exactly what he's doing.", shirtColor:"#89B4D4", tieColor:"#191970" },
    { name:"The Power Maverick",        suit:"Black Wool", shirt:"Pale French Blue",        tie:"Forest Green Foulard",  pocketSquare:"Green Silk — Two Point",  shoes:"Black Oxford Brogues",  belt:"Black leather",        socks:"Forest green", watch:"Sport-dress watch", occasion:"Creative business, brand events, media", archetype:"Avant-Garde", confidence:4, tip:"The foulard's small pattern prevents a clash — this is bold but controlled.", shirtColor:"#89B4D4", tieColor:"#355E3B" },
    { name:"The Confident Gentleman",  suit:"Black Wool", shirt:"Soft Pink Bengal Stripe", tie:"Navy Polka Dot",        pocketSquare:"Pink Silk — Puff Fold",   shoes:"Black Monk Strap",      belt:"Black leather",        socks:"Navy shadow stripe", watch:"Dress watch, dark strap", occasion:"Client lunch, gallery opening, smart casual event", archetype:"Preppy", confidence:4, tip:"Pink on black projects self-assurance — only wear it if you can own it fully.", shirtColor:"#F4B8C1", tieColor:"#1B3A6B" },
    { name:"The Gilded Evening",        suit:"Black Wool", shirt:"Crisp White Poplin",      tie:"Champagne Gold Foulard",pocketSquare:"Gold Silk — Puff Fold",   shoes:"Black Cap-Toe Oxfords", belt:"Black leather",        socks:"Black ribbed", watch:"Gold-case dress watch", occasion:"Gala, cocktail party, awards evening", archetype:"Italian", confidence:5, tip:"Gold on black is pure theatre — wear it when the room is the stage.", shirtColor:"#F8F8F8", tieColor:"#C9A84C" },
  ],
}

const ANALYSIS_CHARCOAL = {
  suit: { colorFamily:"Charcoal Grey", undertones:"Cool blue-grey undertones", fabric:"Worsted wool, ~260 g/m²", pattern:"Solid", formality:"Business Formal", lapel:"Notch lapel", fit:"Classic fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against charcoal is clean authority — the combination that closes deals.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Burgundy Grenadine",    color:"#722F37", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy and charcoal is the definitive boardroom combination." },
        { id:2, name:"Navy Repp Stripe",      color:"#1B3A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"The navy stripe adds structure — ideal for banking and law." },
        { id:3, name:"Forest Green Foulard",  color:"#355E3B", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Green adds quiet distinction against charcoal and white." },
        { id:4, name:"Silver Polka Dot",      color:"#A9A9A9", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Silver-on-charcoal is restrained elegance at its finest." },
        { id:5, name:"Deep Teal Knit",        color:"#008080", pattern:"Solid Knit",       material:"Wool-Silk Knit", width:'2.5"',knot:"Four-in-Hand", harmony:"Complementary", why:"Teal adds a modern edge to classic charcoal — smart and confident." },
        { id:6, name:"Mustard Yellow Knit",   color:"#C9A84C", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Complementary", why:"Yellow against charcoal and white is a sunny, confident statement." },
      ]
    },
    { id:2, name:"Pale French Blue", colorCode:"#89B4D4", why:"Blue softens charcoal's severity while keeping the professionalism fully intact.", collar:"Semi-spread collar", pattern:"End-on-End weave",
      pocketSquare:{ name:"White Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Terracotta Repp Stripe", color:"#CB6D51", pattern:"Repp Stripe",     material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Terracotta-blue against charcoal is the most naturally elegant combination in menswear." },
        { id:2, name:"Burgundy Micro-Paisley", color:"#722F37", pattern:"Micro-Paisley",   material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy warmth cuts through the cool register with elegant energy." },
        { id:3, name:"Navy Grenadine",         color:"#191970", pattern:"Solid Grenadine", material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Monochromatic", why:"Tone-on-tone blue with charcoal is depth and sophistication in its purest form." },
        { id:4, name:"Olive Geometric",        color:"#808000", pattern:"Geometric",       material:"Silk",           width:'3"', knot:"Four-in-Hand",  harmony:"Triadic",       why:"Olive-gold adds Italian flair — a warm accent in a cool blue-grey ensemble." },
        { id:5, name:"Charcoal Grenadine",     color:"#36454F", pattern:"Solid Grenadine", material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Monochromatic", why:"Pure tonal sophistication — for the man who lets his tailoring speak." },
        { id:6, name:"Silver & White Stripe",  color:"#C0C0C0", pattern:"Stripe",          material:"Silk",           width:'3"', knot:"Pratt/Shelby",  harmony:"Analogous",     why:"Crisp precision — ideal for high-stakes environments." },
      ]
    },
    { id:3, name:"Pale Pink Bengal Stripe", colorCode:"#F4B8C1", why:"Warm rose against charcoal adds confident personality without sacrificing authority.", collar:"Button-down collar", pattern:"Bengal Stripe (pink/white)",
      pocketSquare:{ name:"Pink Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Navy Polka Dot",          color:"#1B3A6B", pattern:"Polka Dot",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Deep navy anchors the pink while the dot adds playful precision." },
        { id:2, name:"Charcoal Repp Stripe",    color:"#36454F", pattern:"Repp Stripe",    material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Cool charcoal calms the warmth of pink — an understated power move." },
        { id:3, name:"Deep Teal Solid",         color:"#008080", pattern:"Solid Grenadine",material:"Silk Grenadine", width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Teal-pink is unexpectedly elegant — cool and warm tones in balance." },
        { id:4, name:"Camel Knit",              color:"#C19A6B", pattern:"Solid Knit",     material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Warm camel echoes the warmth of pink — relaxed sophistication." },
        { id:5, name:"Forest Green Club Tie",   color:"#355E3B", pattern:"Club (crests)",  material:"Wool-Silk Blend",width:'3"', knot:"Four-in-Hand",  harmony:"Triadic",       why:"Forest green, pink, and charcoal is timelessly preppy." },
        { id:6, name:"Maroon Paisley",          color:"#800020", pattern:"Paisley",        material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Maroon grounds the pink in an elegant, Old World manner." },
      ]
    },
  ],
  packages:[
    { name:"The City Banker",        suit:"Charcoal Wool", shirt:"Crisp White Poplin",      tie:"Burgundy Grenadine",    pocketSquare:"White Linen — TV Fold",  shoes:"Black Cap-Toe Oxfords", belt:"Black leather",  socks:"Dark grey over-the-calf", watch:"Silver dress watch",      occasion:"Board meeting, legal, finance",         archetype:"British Classic", confidence:2, tip:"White + burgundy + charcoal is the holy trinity of boardroom dressing.", shirtColor:"#F8F8F8", tieColor:"#722F37" },
    { name:"The Continental",        suit:"Charcoal Wool", shirt:"Pale French Blue",        tie:"Terracotta Repp Stripe",pocketSquare:"Ivory Cotton — One Point",shoes:"Dark Brown Derbies",    belt:"Dark cognac",    socks:"Burgundy shadow stripe",  watch:"Gold-case dress watch",   occasion:"Senior leadership, diplomatic dinner",  archetype:"Italian",         confidence:4, tip:"Brown shoes with charcoal — only the truly confident make this move.", shirtColor:"#89B4D4", tieColor:"#CB6D51" },
    { name:"The Modern Executive",   suit:"Charcoal Wool", shirt:"Pale French Blue",        tie:"Charcoal Grenadine",    pocketSquare:"White Cotton — TV Fold", shoes:"Black Oxfords",         belt:"Black leather",  socks:"Navy ribbed",             watch:"Silver dress watch",      occasion:"City meetings, presentations",          archetype:"Continental",     confidence:1, tip:"Tonal dressing lives or dies by the quality of the tailoring.", shirtColor:"#89B4D4", tieColor:"#36454F" },
    { name:"The Weekend Powerbroker",suit:"Charcoal Wool", shirt:"Soft Pink Bengal Stripe", tie:"Deep Teal Solid",       pocketSquare:"Pink Silk — Puff Fold",  shoes:"Tan Suede Monk Strap",  belt:"Tan suede",      socks:"Teal or grey",            watch:"Sport-dress watch",       occasion:"Business casual Friday, client lunch",  archetype:"Preppy",          confidence:4, tip:"The knit tie softens charcoal's formality without losing authority.", shirtColor:"#F4B8C1", tieColor:"#008080" },
    { name:"The Understated Maverick",suit:"Charcoal Wool",shirt:"Crisp White Poplin",      tie:"Forest Green Foulard",  pocketSquare:"Green Silk — Two Point", shoes:"Black Oxford Brogues",  belt:"Black leather",  socks:"Forest green",            watch:"Dress watch, dark strap", occasion:"Creative business, brand events",        archetype:"Avant-Garde",     confidence:4, tip:"The foulard's small pattern prevents a clash with the solid charcoal.", shirtColor:"#F8F8F8", tieColor:"#355E3B" },
    { name:"The Golden Standard",    suit:"Charcoal Wool", shirt:"Crisp White Poplin",      tie:"Mustard Yellow Knit",   pocketSquare:"Gold Silk — Puff Fold",  shoes:"Brown Oxford Brogues",  belt:"Brown leather",  socks:"Mustard or dark grey",    watch:"Gold-case dress watch",   occasion:"Creative leadership, gallery, lunch",   archetype:"Continental",     confidence:5, tip:"Mustard yellow on charcoal is a bold, sunny statement — own it fully.", shirtColor:"#F8F8F8", tieColor:"#C9A84C" },
  ],
}

const ANALYSIS_GREY = {
  suit: { colorFamily:"Medium Grey", undertones:"Neutral grey undertones", fabric:"Worsted wool, ~260 g/m²", pattern:"Solid", formality:"Business Formal / Smart Casual", lapel:"Notch lapel", fit:"Classic or slim fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White on medium grey is clean, sharp authority — the most versatile foundation in business dressing.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Burgundy Grenadine",      color:"#722F37", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy and grey is the timeless power pairing — confident and authoritative." },
        { id:2, name:"Navy Repp Stripe",         color:"#1B3A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Navy stripe on grey and white is Old Money elegance — understated excellence." },
        { id:3, name:"Forest Green Foulard",     color:"#355E3B", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Green cuts beautifully through grey — distinguished and quietly confident." },
        { id:4, name:"Mid-Grey Grenadine",       color:"#808080", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Monochromatic", why:"Tonal grey dressing is the Continental move — depth through texture, not colour." },
        { id:5, name:"Mustard Knit",             color:"#C9A84C", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Complementary", why:"Mustard on grey pops with warm energy — perfect for creative business settings." },
        { id:6, name:"Pale Pink Stripe",         color:"#F4B8C1", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"A rosy stripe softens grey austerity with warm, confident charm." },
      ]
    },
    { id:2, name:"Pale Blue End-on-End", colorCode:"#89B4D4", why:"Blue and grey share cool undertones — effortlessly elegant together with a relaxed authority.", collar:"Semi-spread collar", pattern:"End-on-End weave",
      pocketSquare:{ name:"White Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Burgundy Micro-Paisley",   color:"#722F37", pattern:"Micro-Paisley",    material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy warms the blue-grey combination into something genuinely rich." },
        { id:2, name:"Terracotta Repp Stripe",   color:"#CB6D51", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Terracotta-blue against grey is an Italian masterclass in tonal contrast." },
        { id:3, name:"Navy Solid Grenadine",     color:"#191970", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Deep navy anchors the cool palette of grey and blue with quiet authority." },
        { id:4, name:"Silver & Blue Stripe",     color:"#C0C0C0", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Pratt/Shelby",  harmony:"Analogous",     why:"A cool silver-blue stripe unifies the ensemble into precise, boardroom-ready elegance." },
        { id:5, name:"Olive Geometric",          color:"#808000", pattern:"Geometric",        material:"Silk",           width:'3"', knot:"Four-in-Hand",  harmony:"Triadic",       why:"Olive adds earthy warmth that elevates the cool tones into something distinctive." },
        { id:6, name:"Teal Knit",                color:"#008080", pattern:"Solid Knit",       material:"Wool-Silk Knit", width:'2.5"',knot:"Four-in-Hand", harmony:"Complementary", why:"Teal against blue and grey creates a jewel-like depth — modern and sophisticated." },
      ]
    },
    { id:3, name:"Soft Lilac Shirt", colorCode:"#C8A2C8", why:"Lilac on grey is a sophisticated continental choice — warm and distinctive without being loud.", collar:"Semi-spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Charcoal Grenadine",       color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Dark charcoal grounds the softness of lilac with quiet strength." },
        { id:2, name:"Navy Polka Dot",            color:"#1B3A6B", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Navy dots add structure and masculinity to an unconventional pairing." },
        { id:3, name:"Burgundy Solid",            color:"#722F37", pattern:"Solid",            material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Burgundy and lilac share a red-purple family — a naturally harmonious combination." },
        { id:4, name:"Grey Repp Stripe",          color:"#A9A9A9", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Monochromatic", why:"A cool grey stripe ties the lilac back to the suit in a perfectly composed way." },
        { id:5, name:"Deep Purple Knit",          color:"#4B0082", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Monochromatic", why:"Deep purple deepens the lilac into evening territory — bold yet harmonious." },
        { id:6, name:"Silver Grenadine",          color:"#C0C0C0", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Analogous",     why:"Silver threads the needle — light enough to not clash, cool enough to sharpen the look." },
      ]
    },
  ],
  packages:[
    { name:"The Grey Eminence",       suit:"Medium Grey Wool", shirt:"Crisp White Poplin",  tie:"Burgundy Grenadine",    pocketSquare:"White Linen — TV Fold",   shoes:"Black Cap-Toe Oxfords", belt:"Black leather",  socks:"Dark grey over-the-calf", watch:"Silver dress watch",    occasion:"Board meeting, finance, law", archetype:"British Classic", confidence:2, tip:"White + burgundy + grey is the classic boardroom trilogy.", shirtColor:"#F8F8F8", tieColor:"#722F37" },
    { name:"The City Diplomat",       suit:"Medium Grey Wool", shirt:"Pale Blue End-on-End",tie:"Terracotta Repp Stripe",pocketSquare:"Ivory Cotton — One Point", shoes:"Dark Brown Derbies",   belt:"Dark cognac",    socks:"Burgundy shadow stripe",  watch:"Gold-case dress watch", occasion:"Senior leadership, diplomatic event", archetype:"Italian", confidence:4, tip:"Brown shoes with grey is the mark of a man who understands colour beyond fashion rules.", shirtColor:"#89B4D4", tieColor:"#CB6D51" },
    { name:"The Understated Maverick",suit:"Medium Grey Wool",  shirt:"Crisp White Poplin",  tie:"Forest Green Foulard",  pocketSquare:"Green Silk — Two Point",  shoes:"Dark Brown Brogues",   belt:"Brown leather",  socks:"Forest green",            watch:"Dress watch, dark strap",occasion:"Creative business, gallery, client lunch", archetype:"Avant-Garde", confidence:4, tip:"The foulard small pattern prevents a clash — green on grey is quietly dashing.", shirtColor:"#F8F8F8", tieColor:"#355E3B" },
    { name:"The Continental",         suit:"Medium Grey Wool", shirt:"Soft Lilac",           tie:"Charcoal Grenadine",    pocketSquare:"White Silk — Puff Fold",  shoes:"Dark Brown Oxford",    belt:"Dark brown",     socks:"Charcoal ribbed",         watch:"Silver dress watch",    occasion:"Client dinner, cultural event", archetype:"Continental", confidence:4, tip:"Lilac on grey takes confidence — those who notice will know exactly what they are looking at.", shirtColor:"#C8A2C8", tieColor:"#36454F" },
    { name:"The Sunday Best",         suit:"Medium Grey Wool", shirt:"Pale Blue End-on-End", tie:"Navy Solid Grenadine",  pocketSquare:"White Cotton — TV Fold",  shoes:"Black Derbies",        belt:"Black leather",  socks:"Navy ribbed",             watch:"Silver dress watch",    occasion:"Church, family occasion, smart event", archetype:"Preppy", confidence:2, tip:"The navy tie is the unifying anchor — blue-grey-navy is a naturally harmonious family.", shirtColor:"#89B4D4", tieColor:"#191970" },
    { name:"The Modern Gentleman",    suit:"Medium Grey Wool", shirt:"Crisp White Poplin",   tie:"Mustard Knit",          pocketSquare:"Gold Silk — Puff Fold",   shoes:"Tan Suede Derbies",    belt:"Tan suede",      socks:"Mustard or grey",         watch:"Gold-tone watch",       occasion:"Smart casual, weekend event, gallery opening", archetype:"Continental", confidence:5, tip:"Mustard on grey is a joyful statement — wear it when confidence needs no justification.", shirtColor:"#F8F8F8", tieColor:"#C9A84C" },
  ],
}

const ANALYSIS_LIGHT_GREY = {
  suit: { colorFamily:"Light Grey", undertones:"Silver-cool undertones", fabric:"Lightweight wool or flannel, ~220 g/m²", pattern:"Solid or subtle texture", formality:"Smart Casual / Business Casual", lapel:"Notch lapel", fit:"Slim or tailored fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"The cleanest contrast against light grey — simple, confident, never wrong.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Navy Grenadine",           color:"#191970", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Deep navy against light grey creates maximum contrast — sharp and timeless." },
        { id:2, name:"Burgundy Repp Stripe",     color:"#722F37", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Burgundy adds depth and warmth to a light, airy suit — powerful and grounded." },
        { id:3, name:"Sky Blue Solid",           color:"#87CEEB", pattern:"Solid",            material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Analogous",     why:"Soft blue on light grey is a cool, relaxed combination — elegant and approachable." },
        { id:4, name:"Dusty Rose Knit",          color:"#D4A0A0", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Dusty rose adds warmth to light grey coolness — refined and quietly stylish." },
        { id:5, name:"Sage Green Foulard",       color:"#8FBC8F", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Sage green on light grey is the most naturalistic of pairings — fresh and elegant." },
        { id:6, name:"Silver & White Stripe",    color:"#C0C0C0", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Monochromatic", why:"A pale stripe on light grey is delicate tonal dressing — precise and refined." },
      ]
    },
    { id:2, name:"Pale Sky Blue", colorCode:"#B0D4E8", why:"Sky blue and light grey share a cool, airy register — the combination exudes easy elegance.", collar:"Button-down collar", pattern:"Solid or fine stripe",
      pocketSquare:{ name:"Light Blue Silk", fold:"One Point", material:"Silk" },
      ties:[
        { id:1, name:"Navy Polka Dot",           color:"#1B3A6B", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Navy dots anchor the airy lightness with confident precision." },
        { id:2, name:"Mid-Grey Grenadine",       color:"#808080", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Monochromatic", why:"Tonal grey creates a refined monochromatic ease — very Italian." },
        { id:3, name:"Dusty Rose Solid",         color:"#D4A0A0", pattern:"Solid",            material:"Silk Grenadine", width:'3"', knot:"Pratt/Shelby",  harmony:"Complementary", why:"Rose softens the cool blue-grey palette with a warm, inviting character." },
        { id:4, name:"Forest Green Knit",        color:"#355E3B", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Triadic",       why:"Forest green adds grounding depth — a natural complement to a cool suit." },
        { id:5, name:"Camel & White Stripe",     color:"#C19A6B", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Camel warmth plays beautifully against the cool airy blues and greys." },
        { id:6, name:"Burgundy Foulard",         color:"#722F37", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy depth creates a sophisticated counterpoint to a light, breezy suit." },
      ]
    },
    { id:3, name:"Soft Peach Shirt", colorCode:"#FFCBA4", why:"Peach brings warmth to a cool light grey suit — fresh, sunny, and quietly dashing.", collar:"Semi-spread collar", pattern:"Solid",
      pocketSquare:{ name:"Ivory Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Cognac Brown Knit",        color:"#9B6830", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Cognac and peach share warm undertones — the combination is effortlessly warm." },
        { id:2, name:"Navy Micro-Pattern",       color:"#1B3A6B", pattern:"Micro-Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Deep navy anchors the warmth of peach with cool precision." },
        { id:3, name:"Terracotta Repp Stripe",   color:"#CB6D51", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Terracotta deepens the warmth of peach into something richly sophisticated." },
        { id:4, name:"Sage Green Foulard",       color:"#8FBC8F", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Green + peach + grey is a triadic palette — fresh and full of natural energy." },
        { id:5, name:"Dusty Mauve Knit",         color:"#B08090", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Mauve-rose harmonises with peach for a warm, seasonal refinement." },
        { id:6, name:"Charcoal Grenadine",       color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Dark charcoal grounds the lightness of peach and pale grey beautifully." },
      ]
    },
  ],
  packages:[
    { name:"The Spring Authority",      suit:"Light Grey Wool", shirt:"Crisp White Poplin",  tie:"Navy Grenadine",         pocketSquare:"White Linen — TV Fold",    shoes:"Dark Brown Derbies",   belt:"Dark cognac",   socks:"Navy ribbed",            watch:"Silver dress watch",    occasion:"Weddings, spring events, outdoor ceremonies", archetype:"British Classic", confidence:2, tip:"Navy on white on light grey is spring formality at its finest — classic without being stuffy.", shirtColor:"#F8F8F8", tieColor:"#191970" },
    { name:"The Summer Diplomat",       suit:"Light Grey Wool", shirt:"Pale Sky Blue",       tie:"Mid-Grey Grenadine",     pocketSquare:"Light Blue Silk — One Point",shoes:"White Bucks or tan",  belt:"Tan leather",   socks:"Light grey",             watch:"Silver dress watch",    occasion:"Garden party, daytime wedding, summer events", archetype:"Continental", confidence:3, tip:"Tonal cool dressing on a light grey suit is the height of effortless summer style.", shirtColor:"#B0D4E8", tieColor:"#808080" },
    { name:"The Warm Weekend",          suit:"Light Grey Wool", shirt:"Soft Peach",          tie:"Cognac Brown Knit",      pocketSquare:"Ivory Silk — Puff Fold",   shoes:"Tan Suede Loafers",   belt:"Tan suede",     socks:"Peach or stone",         watch:"Bronze-tone casual watch",occasion:"Business casual, weekend lunch, garden party", archetype:"Preppy", confidence:4, tip:"Warm tones on a cool grey suit radiate approachable confidence.", shirtColor:"#FFCBA4", tieColor:"#9B6830" },
    { name:"The Meadow Gentleman",      suit:"Light Grey Wool", shirt:"Pale Sky Blue",       tie:"Forest Green Knit",      pocketSquare:"Sage Green Silk — One Point",shoes:"Brown Oxford Brogues",belt:"Brown leather", socks:"Forest green or grey",   watch:"Gold-tone casual watch",occasion:"Country wedding, outdoor event, relaxed formal", archetype:"Country", confidence:4, tip:"Green knit on a light suit brings the outdoors in — earthy and elegant.", shirtColor:"#B0D4E8", tieColor:"#355E3B" },
    { name:"The Soft Power",            suit:"Light Grey Wool", shirt:"Crisp White Poplin",  tie:"Burgundy Repp Stripe",   pocketSquare:"White Linen — TV Fold",    shoes:"Black Cap-Toe Oxfords",belt:"Black leather", socks:"Dark grey over-the-calf",watch:"Silver dress watch",    occasion:"Interviews, presentations, meetings", archetype:"British Classic", confidence:2, tip:"Burgundy on light grey carries formality without the heaviness of a dark suit.", shirtColor:"#F8F8F8", tieColor:"#722F37" },
    { name:"The Sunny Roman",           suit:"Light Grey Wool", shirt:"Soft Peach",          tie:"Terracotta Repp Stripe", pocketSquare:"Ivory Silk — Puff Fold",   shoes:"Tan leather loafers", belt:"Tan leather",   socks:"Terracotta or stone",    watch:"Gold-tone dress watch", occasion:"Summer wedding, Mediterranean event, lunch", archetype:"Italian", confidence:5, tip:"A warm-toned ensemble on light grey is pure Italian holiday — unapologetically joyful.", shirtColor:"#FFCBA4", tieColor:"#CB6D51" },
  ],
}

const ANALYSIS_BLUE = {
  suit: { colorFamily:"Royal Blue / Bright Blue", undertones:"Cool blue undertones", fabric:"Worsted wool or wool-blend, ~240 g/m²", pattern:"Solid", formality:"Smart Business / Business Casual", lapel:"Notch lapel", fit:"Slim or modern fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against royal blue creates vivid, crisp contrast — sharp and confident without complexity.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Navy Grenadine",           color:"#191970", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Deep navy grounds the brightness of a blue suit — controlled and confident." },
        { id:2, name:"Burgundy Solid",           color:"#722F37", pattern:"Solid",            material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy and blue is the definitive power combination — bold, warm contrast." },
        { id:3, name:"Silver Grenadine",         color:"#C0C0C0", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Silver against white and blue has a cool, precise, architectural elegance." },
        { id:4, name:"Gold Foulard",             color:"#C9A84C", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Complementary", why:"Gold on white on blue is vivid and celebratory — Italian confidence at full volume." },
        { id:5, name:"Forest Green Repp Stripe", color:"#355E3B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Triadic",       why:"A green stripe adds unexpected depth — distinction for those who notice." },
        { id:6, name:"White & Blue Stripe",      color:"#87CEEB", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Monochromatic", why:"A tonal blue-white stripe is clean, fresh, and seasonless." },
      ]
    },
    { id:2, name:"White Fine Stripe Shirt", colorCode:"#E8E8FF", why:"A fine stripe on white adds subtle texture that enriches the bold blue suit without competing.", collar:"Semi-spread collar", pattern:"Fine pin-stripe",
      pocketSquare:{ name:"White Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Navy Repp Stripe",         color:"#1B3A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Stripe on stripe works when scales differ — the navy grounds the blue beautifully." },
        { id:2, name:"Burgundy Grenadine",       color:"#722F37", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy warms the cool stripe ensemble with old-world gravitas." },
        { id:3, name:"Silver & Navy Stripe",     color:"#C0C0C0", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Pratt/Shelby",  harmony:"Analogous",     why:"Crisp silver-navy stripe on a fine-striped shirt and blue suit is precision dressing." },
        { id:4, name:"Terracotta Knit",          color:"#CB6D51", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Complementary", why:"Terracotta warmth cuts through the cool blues with Italian confidence." },
        { id:5, name:"Camel Grenadine",          color:"#C19A6B", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Warm camel against cool blue is a naturally sophisticated contrast." },
        { id:6, name:"Dusty Pink Foulard",       color:"#D4A0A0", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"A soft pink foulard adds Old World charm to a modern blue suit." },
      ]
    },
    { id:3, name:"Pale Lavender Shirt", colorCode:"#D8C8E8", why:"Lavender and bright blue share cool undertones — soft, sophisticated, and distinctly European.", collar:"Semi-spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Deep Purple Grenadine",    color:"#4B0082", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Monochromatic", why:"Deep purple deepens the lavender into confident, directional territory." },
        { id:2, name:"Navy Polka Dot",           color:"#1B3A6B", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Navy dots bring structure and masculinity to a soft lavender-blue combination." },
        { id:3, name:"Charcoal Grenadine",       color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Complementary", why:"Charcoal grounds lavender — cool, composed, and controlled." },
        { id:4, name:"Silver Stripe",            color:"#C0C0C0", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Silver-on-lavender-on-blue is a trio of cool tones — airy and refined." },
        { id:5, name:"Burgundy Foulard",         color:"#722F37", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"A burgundy foulard adds warm contrast to the cool lavender-blue palette." },
        { id:6, name:"White & Lilac Stripe",     color:"#C8A2C8", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Pratt/Shelby",  harmony:"Monochromatic", why:"Lilac-white stripe ties the shirt and suit into a harmonious cool-toned ensemble." },
      ]
    },
  ],
  packages:[
    { name:"The Royal Banker",       suit:"Royal Blue Wool",  shirt:"Crisp White Poplin",   tie:"Navy Grenadine",         pocketSquare:"White Linen — TV Fold",    shoes:"Black Cap-Toe Oxfords", belt:"Black leather",  socks:"Navy over-the-calf",    watch:"Silver dress watch",    occasion:"Business formal, client presentations", archetype:"British Classic", confidence:2, tip:"Navy tie on a blue suit — only works with a true royal blue; the contrast must be clear.", shirtColor:"#F8F8F8", tieColor:"#191970" },
    { name:"The Blue Power",         suit:"Royal Blue Wool",  shirt:"Crisp White Poplin",   tie:"Burgundy Solid",         pocketSquare:"White Linen — TV Fold",    shoes:"Dark Brown Oxford",    belt:"Dark brown",    socks:"Burgundy ribbed",       watch:"Gold dress watch",      occasion:"Important meetings, keynotes, leadership", archetype:"Italian", confidence:3, tip:"Burgundy and blue is one of the great classic combinations — warm and cool at perfect tension.", shirtColor:"#F8F8F8", tieColor:"#722F37" },
    { name:"The Celebration",        suit:"Royal Blue Wool",  shirt:"Crisp White Poplin",   tie:"Gold Foulard",           pocketSquare:"Gold Silk — Puff Fold",    shoes:"Dark Brown Brogues",   belt:"Brown leather", socks:"Gold or navy",          watch:"Gold-case dress watch", occasion:"Weddings, awards, celebratory events", archetype:"Italian", confidence:5, tip:"Gold on white on blue is pure celebration — the combination radiates joyful authority.", shirtColor:"#F8F8F8", tieColor:"#C9A84C" },
    { name:"The Continental Blue",   suit:"Royal Blue Wool",  shirt:"White Fine Stripe",    tie:"Terracotta Knit",        pocketSquare:"Ivory Cotton — One Point", shoes:"Tan Suede Derbies",    belt:"Tan suede",     socks:"Terracotta or cream",   watch:"Bronze-tone watch",     occasion:"Business casual, creative meetings, client lunch", archetype:"Continental", confidence:4, tip:"Terracotta warms up a cool blue suit into something thoroughly Italian.", shirtColor:"#E8E8FF", tieColor:"#CB6D51" },
    { name:"The Lavender Dream",     suit:"Royal Blue Wool",  shirt:"Pale Lavender",        tie:"Deep Purple Grenadine",  pocketSquare:"White Silk — Puff Fold",  shoes:"Black Derbies",        belt:"Black leather", socks:"Deep purple or navy",   watch:"Silver dress watch",    occasion:"Weddings (as guest), cocktail events, gallery", archetype:"Avant-Garde", confidence:5, tip:"Lavender on blue with a purple tie — bold, harmonious, and genuinely memorable.", shirtColor:"#D8C8E8", tieColor:"#4B0082" },
    { name:"The Modern Gentleman",   suit:"Royal Blue Wool",  shirt:"White Fine Stripe",    tie:"Silver Grenadine",       pocketSquare:"White Cotton — TV Fold",  shoes:"Black Oxford Brogues", belt:"Black leather", socks:"Silver grey",           watch:"Silver dress watch",    occasion:"Formal events, presentations, media appearances", archetype:"Continental", confidence:3, tip:"A silver tie on blue is clean and contemporary — the choice of a man who respects modern style.", shirtColor:"#E8E8FF", tieColor:"#C0C0C0" },
  ],
}

const ANALYSIS_BURGUNDY = {
  suit: { colorFamily:"Burgundy / Oxblood", undertones:"Warm red-wine undertones", fabric:"Wool or wool-blend, ~260 g/m²", pattern:"Solid", formality:"Smart Casual / Business Casual / Evening", lapel:"Peak or notch lapel", fit:"Slim fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is the only shirt that truly lets a burgundy suit lead — clean contrast that commands the room.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Navy Grenadine",           color:"#191970", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Navy cools the warmth of burgundy into something authoritative and balanced." },
        { id:2, name:"Dark Olive Knit",          color:"#556B2F", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Triadic",       why:"Olive and burgundy are an earthy power pairing — richly textured and distinctive." },
        { id:3, name:"Burgundy Grenadine",       color:"#722F37", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Monochromatic", why:"Tonal burgundy-on-burgundy is a bold monochromatic statement — for the truly confident." },
        { id:4, name:"Charcoal Grenadine",       color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Complementary", why:"Charcoal cool tone is the perfect foil to burgundy warmth." },
        { id:5, name:"Camel Repp Stripe",        color:"#C19A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Camel and burgundy share warm earthen undertones — a rich, autumnal combination." },
        { id:6, name:"Gold Foulard",             color:"#C9A84C", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Analogous",     why:"Gold on burgundy is Old World opulence — the combination of antique jewels and velvet." },
      ]
    },
    { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Pale grey softens the intensity of burgundy while keeping formality high — sophisticated and understated.", collar:"Semi-spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Dark Charcoal Grenadine",  color:"#36454F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Charcoal on pale grey neutralises the wine tones into cool, refined authority." },
        { id:2, name:"Deep Navy Repp Stripe",    color:"#1B3A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Navy stripe on pale grey suits the burgundy perfectly — classic and precise." },
        { id:3, name:"Burgundy Micro-Paisley",   color:"#722F37", pattern:"Micro-Paisley",    material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Monochromatic", why:"Echoing the suit burgundy in a subtle paisley is a confident tonal touch." },
        { id:4, name:"Olive Grenadine",          color:"#556B2F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Four-in-Hand",  harmony:"Triadic",       why:"Olive on pale grey with a burgundy suit is the Italian autumn at its finest." },
        { id:5, name:"Silver Grenadine",         color:"#C0C0C0", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Monochromatic", why:"Silver on grey on burgundy is a cool monochrome accent that refines the look." },
        { id:6, name:"Camel Knit",               color:"#C19A6B", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"A camel knit on pale grey warms the ensemble with an autumnal earthiness." },
      ]
    },
    { id:3, name:"Soft Pink Bengal Stripe", colorCode:"#F4B8C1", why:"Pink and burgundy share a warm-red family — a bold but harmonious pairing for the adventurous dresser.", collar:"Button-down collar", pattern:"Bengal Stripe",
      pocketSquare:{ name:"Pink Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Navy Polka Dot",           color:"#1B3A6B", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Navy dots cool down the warm pink-burgundy palette with confident structure." },
        { id:2, name:"Olive Micro-Pattern",      color:"#556B2F", pattern:"Micro-Pattern",    material:"Silk",           width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Olive grounds the warm pink tones with earthy richness — unmistakably Italian." },
        { id:3, name:"Charcoal & Pink Stripe",   color:"#36454F", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"A charcoal stripe cools the warmth of the shirt with understated power." },
        { id:4, name:"Burgundy Knit",            color:"#722F37", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Monochromatic", why:"Tonal burgundy in a textured knit grounds the soft pink with assured confidence." },
        { id:5, name:"Camel & Burgundy Stripe",  color:"#C19A6B", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Camel-burgundy stripe mirrors the suit in the tie — warm and fully composed." },
        { id:6, name:"Dark Teal Grenadine",      color:"#008080", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Triadic",       why:"Teal against pink and burgundy creates a rich jewel-tone contrast — daring but refined." },
      ]
    },
  ],
  packages:[
    { name:"The Wine Merchant",       suit:"Burgundy Wool",    shirt:"Crisp White Poplin",   tie:"Navy Grenadine",         pocketSquare:"White Linen — TV Fold",    shoes:"Dark Brown Oxford",    belt:"Dark cognac",    socks:"Navy or dark grey",      watch:"Gold dress watch",      occasion:"Evening event, restaurant dinner, gallery", archetype:"Italian", confidence:3, tip:"Navy tie on a burgundy suit — let the suit lead; the tie is simply well-chosen company.", shirtColor:"#F8F8F8", tieColor:"#191970" },
    { name:"The Autumn Lord",         suit:"Burgundy Wool",    shirt:"Pale Grey Poplin",     tie:"Dark Olive Knit",        pocketSquare:"Ivory Cotton — One Point", shoes:"Dark Brown Brogues",   belt:"Dark brown",    socks:"Olive or dark grey",     watch:"Gold-tone casual watch",occasion:"Country event, weekend occasion, gallery", archetype:"Country", confidence:4, tip:"Olive and burgundy is the great English autumn combination — earthy, rich, and assured.", shirtColor:"#D3D3D3", tieColor:"#556B2F" },
    { name:"The Opulent Evening",     suit:"Burgundy Wool",    shirt:"Crisp White Poplin",   tie:"Gold Foulard",           pocketSquare:"Gold Silk — Puff Fold",    shoes:"Black Cap-Toe Oxfords",belt:"Black leather",  socks:"Black over-the-calf",    watch:"Gold dress watch",      occasion:"Black-tie optional, gala, awards dinner", archetype:"Italian", confidence:5, tip:"Gold on burgundy is theatrical opulence — reserve it for evenings that deserve it.", shirtColor:"#F8F8F8", tieColor:"#C9A84C" },
    { name:"The Composed Maverick",   suit:"Burgundy Wool",    shirt:"Pale Grey Poplin",     tie:"Charcoal Grenadine",     pocketSquare:"White Cotton — TV Fold",   shoes:"Black Oxford Brogues", belt:"Black leather",  socks:"Charcoal ribbed",        watch:"Silver dress watch",    occasion:"Business casual, creative sector, client dinner", archetype:"Continental", confidence:3, tip:"Charcoal on pale grey cools the burgundy warmth into something quietly powerful.", shirtColor:"#D3D3D3", tieColor:"#36454F" },
    { name:"The Bold Romantic",       suit:"Burgundy Wool",    shirt:"Soft Pink Bengal",     tie:"Navy Polka Dot",         pocketSquare:"Pink Silk — Puff Fold",    shoes:"Dark Brown Monk Strap",belt:"Dark brown",    socks:"Navy shadow stripe",     watch:"Rose-gold dress watch", occasion:"Date night, cocktail party, gallery opening", archetype:"Avant-Garde", confidence:5, tip:"Pink on burgundy is confident and warm — only wear it when you can carry it without a thought.", shirtColor:"#F4B8C1", tieColor:"#1B3A6B" },
    { name:"The Tonal Master",        suit:"Burgundy Wool",    shirt:"Crisp White Poplin",   tie:"Burgundy Grenadine",     pocketSquare:"White Linen — TV Fold",    shoes:"Dark Brown Oxford",    belt:"Dark cognac",    socks:"Burgundy over-the-calf", watch:"Rose-gold dress watch", occasion:"Cocktail dinner, art events, formal date night", archetype:"Avant-Garde", confidence:5, tip:"Tonal burgundy head to toe is an advanced statement — the fit must be flawless.", shirtColor:"#F8F8F8", tieColor:"#722F37" },
  ],
}

const ANALYSIS_BROWN = {
  suit: { colorFamily:"Brown / Chocolate", undertones:"Warm amber-earth undertones", fabric:"Tweed, flannel or worsted wool, ~280 g/m²", pattern:"Solid, herringbone or windowpane", formality:"Smart Casual / Business Casual", lapel:"Notch lapel", fit:"Classic or relaxed fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White cuts cleanly against brown earthy warmth — the sharpest foundation for a rich suit.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Burnt Orange Knit",        color:"#CC5500", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Orange and brown share the same earthy warmth — a natural, deeply satisfying pairing." },
        { id:2, name:"Olive Grenadine",          color:"#556B2F", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Olive and brown are the great terrestrial combination — the English countryside in tie form." },
        { id:3, name:"Mustard Foulard",          color:"#C9A84C", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Analogous",     why:"Mustard on brown is an autumnal masterclass — rich, warm, and effortlessly distinguished." },
        { id:4, name:"Navy Repp Stripe",         color:"#1B3A6B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Navy on white on brown is a sharp contrast — bringing cool precision to earthy warmth." },
        { id:5, name:"Forest Green Solid",       color:"#355E3B", pattern:"Solid",            material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Green and brown are the most natural pairing in nature — and equally so in menswear." },
        { id:6, name:"Terracotta Repp Stripe",   color:"#CB6D51", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Terracotta deepens the warmth of brown into a rich, sun-baked Mediterranean palette." },
      ]
    },
    { id:2, name:"Pale Blue End-on-End", colorCode:"#89B4D4", why:"Cool blue provides the best contrast to brown warmth — it's the colour pairing Italian tailors have loved for decades.", collar:"Semi-spread collar", pattern:"End-on-End weave",
      pocketSquare:{ name:"White Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Brown Knit",               color:"#9B6830", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Monochromatic", why:"Tonal brown knit on a blue shirt grounds the look back to earth — refined and natural." },
        { id:2, name:"Olive Micro-Pattern",      color:"#556B2F", pattern:"Micro-Pattern",    material:"Silk",           width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Olive bridges blue and brown into a fully coherent earthy-cool ensemble." },
        { id:3, name:"Terracotta Solid",         color:"#CB6D51", pattern:"Solid",            material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Terracotta against cool blue creates the Italian flag of earthy sophistication." },
        { id:4, name:"Navy & Tan Stripe",        color:"#1B3A6B", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Navy-tan on blue and brown ties the entire warm-cool palette into one composed look." },
        { id:5, name:"Mustard Grenadine",        color:"#C9A84C", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Mustard warms the blue-brown combination with golden richness." },
        { id:6, name:"Sage Green Foulard",       color:"#8FBC8F", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Sage green completes the warm-cool-earthy triangle beautifully." },
      ]
    },
    { id:3, name:"Cream Poplin", colorCode:"#FFFDD0", why:"Cream warms up where white cools down — on a brown suit it creates a rich, cohesive earthy ensemble.", collar:"Semi-spread collar", pattern:"Solid",
      pocketSquare:{ name:"Ivory Linen", fold:"One Point", material:"Linen" },
      ties:[
        { id:1, name:"Dark Brown Grenadine",     color:"#4A2C17", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Monochromatic", why:"Tonal brown dressing is the height of earthen elegance — depth through nuance." },
        { id:2, name:"Forest Green Repp Stripe", color:"#355E3B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Green-brown-cream is the English country house palette — considered and timeless." },
        { id:3, name:"Burgundy Foulard",         color:"#722F37", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Burgundy on cream on brown introduces warm red depth — richly Old World." },
        { id:4, name:"Burnt Orange Repp",        color:"#CC5500", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Orange on cream on brown is an autumnal fire — warm, rich, and confident." },
        { id:5, name:"Olive Knit",               color:"#556B2F", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Olive on cream on brown completes the tricolour of the English countryside." },
        { id:6, name:"Camel Grenadine",          color:"#C19A6B", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Pratt/Shelby",  harmony:"Monochromatic", why:"Camel against cream and brown is a tonal earth symphony — warm, composed, distinguished." },
      ]
    },
  ],
  packages:[
    { name:"The Country Gentleman",   suit:"Chocolate Brown Tweed",shirt:"Cream Poplin",     tie:"Olive Grenadine",        pocketSquare:"Ivory Linen — One Point",  shoes:"Dark Brown Derbies",   belt:"Dark brown",    socks:"Olive or dark brown",    watch:"Bronze dress watch",    occasion:"Country weekend, outdoor event, smart casual", archetype:"Country", confidence:3, tip:"Olive on cream on brown is the English countryside in suit form.", shirtColor:"#FFFDD0", tieColor:"#556B2F" },
    { name:"The Italian Autumn",      suit:"Brown Worsted Wool",   shirt:"Pale Blue End-on-End",tie:"Terracotta Solid",    pocketSquare:"White Cotton — One Point", shoes:"Dark Brown Oxford",    belt:"Dark brown",    socks:"Terracotta or brown",    watch:"Gold dress watch",      occasion:"Business casual, client lunch, gallery", archetype:"Italian", confidence:4, tip:"Terracotta-blue on brown is pure Mediterranean autumn — warmth and cool in perfect tension.", shirtColor:"#89B4D4", tieColor:"#CB6D51" },
    { name:"The Warm Weekend",        suit:"Brown Flannel",        shirt:"Crisp White Poplin", tie:"Burnt Orange Knit",     pocketSquare:"White Linen — TV Fold",    shoes:"Tan Suede Monks",      belt:"Tan suede",     socks:"Orange or dark brown",   watch:"Bronze casual watch",   occasion:"Weekend brunch, gallery, casual business", archetype:"Preppy", confidence:4, tip:"Burnt orange on white on brown is joyful autumn warmth — wear it with full conviction.", shirtColor:"#F8F8F8", tieColor:"#CC5500" },
    { name:"The Dark Forest",         suit:"Chocolate Brown Wool", shirt:"Pale Blue End-on-End",tie:"Forest Green Solid",  pocketSquare:"White Cotton — One Point", shoes:"Dark Brown Brogues",   belt:"Dark brown",    socks:"Forest green or brown",  watch:"Bronze dress watch",    occasion:"Smart casual, autumnal events, client dinner", archetype:"Country", confidence:4, tip:"Forest green on blue on brown is a rich earthy triad — the most composed autumn palette.", shirtColor:"#89B4D4", tieColor:"#355E3B" },
    { name:"The Golden Hour",         suit:"Brown Herringbone",    shirt:"Cream Poplin",       tie:"Mustard Grenadine",     pocketSquare:"Gold Silk — Puff Fold",    shoes:"Tan Oxford Brogues",  belt:"Tan leather",   socks:"Mustard or tan",         watch:"Gold-tone watch",       occasion:"Autumn wedding, gallery, harvest event", archetype:"Italian", confidence:5, tip:"Gold-mustard on cream on brown herringbone is autumn harvest in suit form — richly evocative.", shirtColor:"#FFFDD0", tieColor:"#C9A84C" },
    { name:"The Earthen Classic",     suit:"Brown Wool",           shirt:"Crisp White Poplin", tie:"Navy Repp Stripe",      pocketSquare:"White Linen — TV Fold",    shoes:"Dark Brown Oxford",   belt:"Dark brown",    socks:"Navy or dark brown",     watch:"Silver dress watch",    occasion:"Business casual, office, meetings", archetype:"Continental", confidence:2, tip:"Navy on white on brown is the earthy suit most professional statement — restrained and sharp.", shirtColor:"#F8F8F8", tieColor:"#1B3A6B" },
  ],
}

const ANALYSIS_BEIGE = {
  suit: { colorFamily:"Beige / Camel / Tan", undertones:"Warm sand-wheat undertones", fabric:"Linen, light wool or cotton-blend, ~200 g/m²", pattern:"Solid", formality:"Smart Casual / Summer Casual", lapel:"Notch lapel", fit:"Relaxed or slim fit" },
  shirts: [
    { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against beige is clean and crisp — the contrast prevents the lightness from washing out.", collar:"Spread collar", pattern:"Solid",
      pocketSquare:{ name:"White Linen", fold:"TV Fold (Presidential)", material:"Irish Linen" },
      ties:[
        { id:1, name:"Navy Grenadine",           color:"#191970", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Complementary", why:"Deep navy is the great anchor for beige and white — sharp, cool contrast in warm company." },
        { id:2, name:"Burgundy Repp Stripe",     color:"#722F37", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Complementary", why:"Burgundy warms the beige palette with Old World richness — a confident choice." },
        { id:3, name:"Forest Green Foulard",     color:"#355E3B", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Green on white on beige is a fresh, natural combination — garden party to gallery." },
        { id:4, name:"Camel Grenadine",          color:"#C19A6B", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Kelvin",        harmony:"Monochromatic", why:"Tonal camel on white on beige is an all-warm look — leisurely confidence at its finest." },
        { id:5, name:"Dusty Rose Knit",          color:"#D4A0A0", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Dusty rose adds warmth and softness — a spring lunch companion." },
        { id:6, name:"Olive Knit",               color:"#556B2F", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Olive on beige is the great Mediterranean earthy pairing — natural and distinguished." },
      ]
    },
    { id:2, name:"Pale Sky Blue Shirt", colorCode:"#B0D4E8", why:"Sky blue on beige is a breezy summer combination — light, airy, and effortlessly stylish in warmer months.", collar:"Button-down collar", pattern:"Solid",
      pocketSquare:{ name:"Light Blue Cotton", fold:"One Point", material:"Cotton" },
      ties:[
        { id:1, name:"Navy Polka Dot",           color:"#1B3A6B", pattern:"Polka Dot",        material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Navy dots bring structure and precision to a breezy blue-beige ensemble." },
        { id:2, name:"Terracotta Knit",          color:"#CB6D51", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Complementary", why:"Terracotta warms the blue-beige combination into a sun-kissed Mediterranean palette." },
        { id:3, name:"Forest Green Repp Stripe", color:"#355E3B", pattern:"Repp Stripe",      material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Triadic",       why:"Green, blue, beige — three natural colours in perfect harmony." },
        { id:4, name:"Cognac Brown Knit",        color:"#9B6830", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Analogous",     why:"Cognac on sky blue on beige is a warm, earthy trio — relaxed summer distinction." },
        { id:5, name:"Sage Green Foulard",       color:"#8FBC8F", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Triadic",       why:"Sage on blue on beige is a light, fresh, springtime ensemble full of natural charm." },
        { id:6, name:"Dusty Pink Solid",         color:"#D4A0A0", pattern:"Solid",            material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Dusty pink on sky blue on beige is a soft, warm-cool balance — summer wedding-perfect." },
      ]
    },
    { id:3, name:"Soft Peach Poplin", colorCode:"#FFCBA4", why:"Peach and beige are natural relatives — together they create a warm, sun-drenched ensemble that radiates relaxed confidence.", collar:"Semi-spread collar", pattern:"Solid",
      pocketSquare:{ name:"Ivory Silk", fold:"Puff Fold", material:"Silk" },
      ties:[
        { id:1, name:"Cognac Brown Grenadine",   color:"#9B6830", pattern:"Solid Grenadine",  material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Monochromatic", why:"Cognac on peach on beige is a warm, tonal earth palette — naturally rich and composed." },
        { id:2, name:"Navy Foulard",             color:"#1B3A6B", pattern:"Foulard",          material:"Matte Silk",     width:'3"', knot:"Pratt/Shelby",  harmony:"Complementary", why:"Navy cools and grounds the all-warm ensemble — the contrast makes everything pop." },
        { id:3, name:"Sage Green Knit",          color:"#8FBC8F", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Triadic",       why:"Sage green, peach, and beige is a spring garden in suit form — fresh and lively." },
        { id:4, name:"Terracotta Stripe",        color:"#CB6D51", pattern:"Stripe",           material:"Silk Twill",     width:'3"', knot:"Four-in-Hand",  harmony:"Analogous",     why:"Terracotta deepens the warm peach-beige palette into something richer and more confident." },
        { id:5, name:"Ivory Knit",               color:"#FFFFF0", pattern:"Solid Knit",       material:"Wool Knit",      width:'2.5"',knot:"Four-in-Hand", harmony:"Monochromatic", why:"Ivory tonal dressing in warm tones is the ultimate leisurely summer elegance." },
        { id:6, name:"Dark Olive Solid",         color:"#556B2F", pattern:"Solid",            material:"Silk Grenadine", width:'3"', knot:"Half Windsor",  harmony:"Analogous",     why:"Olive on peach on beige is a warm tricolour of natural richness." },
      ]
    },
  ],
  packages:[
    { name:"The Summer Classic",      suit:"Beige Linen",           shirt:"Crisp White Poplin", tie:"Navy Grenadine",        pocketSquare:"White Linen — TV Fold",    shoes:"Brown or tan leather", belt:"Tan leather",   socks:"Navy or cream",          watch:"Silver dress watch",    occasion:"Summer wedding, garden party, outdoor lunch", archetype:"British Classic", confidence:2, tip:"Navy on white on beige linen is the most crisp summer look — clean, sharp, seasonless.", shirtColor:"#F8F8F8", tieColor:"#191970" },
    { name:"The Riviera Gentleman",   suit:"Beige Linen",           shirt:"Pale Sky Blue",      tie:"Terracotta Knit",       pocketSquare:"Light Blue — One Point",   shoes:"Tan suede loafers",   belt:"Tan suede",     socks:"No-show or terracotta",  watch:"Bronze casual watch",   occasion:"Mediterranean holiday, yacht club, summer lunch", archetype:"Italian", confidence:4, tip:"Terracotta-blue on beige linen is the Riviera uniform — put it on and feel the warmth.", shirtColor:"#B0D4E8", tieColor:"#CB6D51" },
    { name:"The Warm Garden",         suit:"Beige Linen",           shirt:"Soft Peach",         tie:"Sage Green Knit",       pocketSquare:"Ivory Silk — Puff Fold",   shoes:"White bucks or cream",belt:"Cream leather",  socks:"Sage green or cream",    watch:"Rose-gold casual watch",occasion:"Garden party, outdoor wedding, spring event", archetype:"Preppy", confidence:4, tip:"Sage green-peach-beige is a spring palette — warm, fresh, and full of natural lightness.", shirtColor:"#FFCBA4", tieColor:"#8FBC8F" },
    { name:"The Sandy Diplomat",      suit:"Camel Wool",            shirt:"Crisp White Poplin", tie:"Forest Green Foulard",  pocketSquare:"Green Silk — Two Point",   shoes:"Dark Brown Oxford",   belt:"Dark brown",    socks:"Forest green or navy",   watch:"Gold dress watch",      occasion:"Smart casual, autumnal lunch, outdoor event", archetype:"Continental", confidence:4, tip:"Green on white on camel is an earthy, distinguished combination — English countryside in summer.", shirtColor:"#F8F8F8", tieColor:"#355E3B" },
    { name:"The Linen Master",        suit:"Beige Linen",           shirt:"Pale Sky Blue",      tie:"Navy Polka Dot",        pocketSquare:"White Cotton — One Point", shoes:"White leather loafers",belt:"White leather", socks:"Navy or white",          watch:"Silver dress watch",    occasion:"Summer formal, outdoor ceremony, garden wedding", archetype:"Preppy", confidence:3, tip:"Navy dots on sky blue on beige linen is a crisp, nautical-adjacent summer formal look.", shirtColor:"#B0D4E8", tieColor:"#1B3A6B" },
    { name:"The Golden Afternoon",    suit:"Camel / Tan Wool",      shirt:"Soft Peach",         tie:"Cognac Brown Grenadine",pocketSquare:"Ivory Silk — Puff Fold",   shoes:"Tan Oxford Brogues",  belt:"Tan leather",   socks:"Camel or cognac",        watch:"Gold-tone dress watch", occasion:"Autumn wedding, harvest event, leisurely formal", archetype:"Italian", confidence:5, tip:"An all-warm ensemble on a camel suit is the Italian golden afternoon — rich, sun-drenched, unapologetic.", shirtColor:"#FFCBA4", tieColor:"#9B6830" },
  ],
}

// ─── Color detection → local analysis ──────────────────────────────────────
// ─────────────────────────────────────────────
// PHOTO ANALYSIS ENGINE — 100% local, no API
// Reads dominant color + pattern from image
// using Canvas API, then maps to analysis data
// ─────────────────────────────────────────────

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function classifyColor(h, s, l) {
  // Very dark / near black
  if (l < 15) return "black"
  // Very light / white / cream
  if (l > 80) return "beige"
  // Low saturation = greys / neutrals
  if (s < 12) {
    if (l < 28) return "charcoal"
    if (l < 42) return "charcoal"
    if (l < 58) return "grey"
    return "light_grey"
  }
  // Colored suits
  if (h >= 200 && h <= 260) {
    // Blues
    if (l < 30) return "navy"
    if (l < 50) return "navy"
    return "blue"
  }
  if (h >= 260 && h <= 320) return "burgundy"  // Purple-reds
  if (h >= 320 || h <= 15) {
    // Reds / burgundy
    if (s > 30) return "burgundy"
    return "charcoal"
  }
  if (h >= 15 && h <= 40) {
    // Browns / tans / beige
    if (l < 35) return "brown"
    if (l < 55) return "brown"
    return "beige"
  }
  if (h >= 40 && h <= 70) return "beige"       // Khaki / tan / camel
  if (h >= 70 && h <= 160) return "grey"       // Olive / green treated as grey
  return "navy" // fallback
}

function detectPattern(pixels, width, height) {
  // Sample a grid of pixels and look for color variance
  // High variance in rows → stripe
  // High variance in both rows and columns → plaid/check
  // Low variance → solid
  const sample = 40
  const rowVariances = []
  const colVariances = []

  for (let row = 0; row < sample; row++) {
    const y = Math.floor((row / sample) * height)
    const rowColors = []
    for (let col = 0; col < sample; col++) {
      const x = Math.floor((col / sample) * width)
      const i = (y * width + x) * 4
      rowColors.push(pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114)
    }
    const mean = rowColors.reduce((a, b) => a + b, 0) / rowColors.length
    const variance = rowColors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rowColors.length
    rowVariances.push(variance)
  }

  for (let col = 0; col < sample; col++) {
    const x = Math.floor((col / sample) * width)
    const colColors = []
    for (let row = 0; row < sample; row++) {
      const y = Math.floor((row / sample) * height)
      const i = (y * width + x) * 4
      colColors.push(pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114)
    }
    const mean = colColors.reduce((a, b) => a + b, 0) / colColors.length
    const variance = colColors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / colColors.length
    colVariances.push(variance)
  }

  const avgRowVar = rowVariances.reduce((a, b) => a + b, 0) / rowVariances.length
  const avgColVar = colVariances.reduce((a, b) => a + b, 0) / colVariances.length
  const totalVar  = (avgRowVar + avgColVar) / 2

  if (totalVar < 60)   return { pattern: "Solid", fabric: "Smooth weave", formality: "Business Formal" }
  if (totalVar < 180) {
    // Is variance higher in rows or cols? → stripe direction
    if (avgRowVar > avgColVar * 1.4) return { pattern: "Horizontal Stripe", fabric: "Twill weave", formality: "Business Casual" }
    if (avgColVar > avgRowVar * 1.4) return { pattern: "Chalk Stripe / Pinstripe", fabric: "Wool twill", formality: "Business Formal" }
    return { pattern: "Subtle Texture / Twill", fabric: "Worsted wool", formality: "Business Formal" }
  }
  if (totalVar < 400)  return { pattern: "Glen Plaid / Check", fabric: "Wool blend", formality: "Business Casual" }
  return { pattern: "Bold Pattern / Tweed", fabric: "Textured wool", formality: "Smart Casual" }
}

function detectFabric(avgLightness, saturation) {
  // Linen tends to be light + slightly textured
  if (avgLightness > 60 && saturation < 20) return "Linen / Cotton blend"
  // Very dark and uniform → smooth wool
  if (avgLightness < 25) return "Worsted wool, ~260 g/m²"
  // Medium range → standard wool
  if (avgLightness < 45) return "Wool twill, ~260 g/m²"
  // Lighter → lighter weight
  return "Lightweight wool, ~200 g/m²"
}

function analyzePhotoLocally(dataURL) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      // Downsample for speed — 120×120 is plenty
      const size = 120
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, size, size)
      const { data } = ctx.getImageData(0, 0, size, size)

      // Collect all pixel colors (skip near-white background pixels)
      let rSum = 0, gSum = 0, bSum = 0, count = 0
      const pixels = data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
        if (a < 128) continue // skip transparent
        // Skip very bright pixels (background / flash glare)
        const brightness = (r + g + b) / 3
        if (brightness > 220) continue
        rSum += r; gSum += g; bSum += b; count++
      }

      if (count === 0) { resolve(null); return }

      const r = Math.round(rSum / count)
      const g = Math.round(gSum / count)
      const b = Math.round(bSum / count)
      const { h, s, l } = rgbToHsl(r, g, b)

      const colorKey  = classifyColor(h, s, l)
      const patternInfo = detectPattern(pixels, size, size)
      const fabricStr = detectFabric(l, s)

      resolve({ colorKey, h, s, l, r, g, b, patternInfo, fabricStr })
    }
    img.onerror = () => resolve(null)
    img.src = dataURL
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DAPPER — PATTERN INTELLIGENCE ENGINE
// Expert rules for suit × shirt × tie pattern combinations
// Based on the real rules of menswear pattern mixing
// ─────────────────────────────────────────────────────────────────────────────

// ── PATTERN SCALE HIERARCHY ──
// When mixing patterns, scale contrast is everything.
// Rule: the larger the scale difference, the safer the mix.
// Never mix two patterns of the same type at the same scale.

const PATTERN_SCALE = {
  // Suit patterns (macro level)
  "chalk_stripe":   { scale: 5, family: "stripe",  label: "Chalk Stripe" },
  "glen_plaid":     { scale: 4, family: "check",   label: "Glen Plaid" },
  "windowpane":     { scale: 4, family: "check",   label: "Windowpane" },
  "herringbone":    { scale: 2, family: "texture",  label: "Herringbone" },
  "tweed":          { scale: 2, family: "texture",  label: "Tweed" },
  "houndstooth":    { scale: 3, family: "check",   label: "Houndstooth" },
  "solid_suit":     { scale: 0, family: "none",    label: "Solid" },
  "linen":          { scale: 1, family: "texture",  label: "Linen" },

  // Shirt patterns (medium level)
  "solid_shirt":      { scale: 0, family: "none",    label: "Solid" },
  "bengal_stripe":    { scale: 3, family: "stripe",  label: "Bengal Stripe" },
  "end_on_end":       { scale: 1, family: "texture",  label: "End-on-End" },
  "oxford":           { scale: 1, family: "texture",  label: "Oxford Weave" },
  "fine_stripe":      { scale: 2, family: "stripe",  label: "Fine Stripe" },
  "gingham":          { scale: 3, family: "check",   label: "Gingham" },
  "chambray":         { scale: 1, family: "texture",  label: "Chambray" },
  "poplin":           { scale: 0, family: "none",    label: "Poplin (Solid)" },
  "voile":            { scale: 0, family: "none",    label: "Voile (Solid)" },

  // Tie patterns (micro level)
  "solid_tie":        { scale: 0, family: "none",    label: "Solid" },
  "grenadine":        { scale: 1, family: "texture",  label: "Grenadine (Solid)" },
  "knit":             { scale: 1, family: "texture",  label: "Knit (Solid)" },
  "repp_stripe":      { scale: 2, family: "stripe",  label: "Repp Stripe" },
  "club_stripe":      { scale: 2, family: "stripe",  label: "Club Stripe" },
  "polka_dot":        { scale: 2, family: "dot",     label: "Polka Dot" },
  "foulard":          { scale: 2, family: "geo",     label: "Foulard" },
  "micro_paisley":    { scale: 2, family: "geo",     label: "Micro-Paisley" },
  "paisley":          { scale: 3, family: "geo",     label: "Paisley" },
  "large_stripe":     { scale: 4, family: "stripe",  label: "Bold Stripe" },
  "bold_plaid":       { scale: 4, family: "check",   label: "Bold Plaid" },
  "geometric":        { scale: 2, family: "geo",     label: "Geometric" },
}

// ─────────────────────────────────────────────────────────────────────────────
// THE 7 GOLDEN RULES OF PATTERN MIXING
// ─────────────────────────────────────────────────────────────────────────────

const PATTERN_RULES = {

  // RULE 1: Never mix the same pattern family at the same scale
  // A striped suit with a striped tie must have dramatically different stripe widths
  rule1_same_family_same_scale: {
    name: "Same Pattern, Different Scale",
    description: "When mixing two patterns of the same family (stripes, checks), the scale must differ dramatically — at least 2 steps apart.",
    forbidden: [
      { suit: "chalk_stripe", shirt: "bengal_stripe",  reason: "Both are bold stripes — the combination creates visual chaos" },
      { suit: "chalk_stripe", shirt: "fine_stripe",    reason: "Stripe on stripe requires a dramatic scale difference. These are too close." },
      { suit: "glen_plaid",   shirt: "gingham",        reason: "Check on check at similar scales creates visual vibration" },
      { suit: "glen_plaid",   tie: "bold_plaid",       reason: "Bold plaid tie with glen plaid suit — both compete for attention" },
    ],
    allowed: [
      { suit: "chalk_stripe", shirt: "bengal_stripe",  condition: "stripe_scales_differ_by_3_plus", reason: "Large chalk stripe + fine bengal works ONLY when scale difference is extreme" },
      { suit: "chalk_stripe", tie: "repp_stripe",      reason: "Chalk stripe (macro) + repp stripe (micro) — dramatic scale difference makes it work" },
      { suit: "glen_plaid",   tie: "foulard",          reason: "Plaid suit + micro-geometric tie — scale difference is sufficient" },
    ]
  },

  // RULE 2: Maximum 3 patterns in one outfit
  rule2_max_three_patterns: {
    name: "Maximum Three Patterns",
    description: "An outfit can carry at most 3 patterns. Exceeding this creates chaos. With a patterned suit, limit patterns to suit + one more item.",
    tiers: {
      one_pattern:   { risk: "safe",    description: "Solid shirt + solid tie with patterned suit. Always correct." },
      two_patterns:  { risk: "refined", description: "Patterned suit + one pattern (shirt OR tie). The classic approach." },
      three_patterns:{ risk: "advanced",description: "Suit + shirt + tie all patterned. Requires expert scale management." },
      four_patterns: { risk: "NEVER",   description: "Four patterns including pocket square. Forbidden in any context." },
    }
  },

  // RULE 3: With a solid suit, anything goes (within reason)
  rule3_solid_suit_freedom: {
    name: "Solid Suit Freedom",
    description: "A solid suit is a blank canvas. You can pair it with patterned shirts AND patterned ties, as long as they don't share the same pattern family at the same scale.",
    combinations: [
      { shirt: "bengal_stripe",  tie: "solid_tie",    score: 10, label: "Classic" },
      { shirt: "bengal_stripe",  tie: "polka_dot",    score: 9,  label: "Advanced — dot breaks the stripe without competing" },
      { shirt: "bengal_stripe",  tie: "foulard",      score: 8,  label: "Expert — micro-geo breaks the stripe" },
      { shirt: "bengal_stripe",  tie: "repp_stripe",  score: 5,  label: "Risky — stripe on stripe even on solid suit" },
      { shirt: "gingham",        tie: "solid_tie",    score: 10, label: "Classic" },
      { shirt: "gingham",        tie: "repp_stripe",  score: 7,  label: "Check + stripe — works because families differ" },
      { shirt: "gingham",        tie: "polka_dot",    score: 8,  label: "Check + dot — excellent scale and family contrast" },
      { shirt: "end_on_end",     tie: "repp_stripe",  score: 10, label: "Classic — subtle shirt texture + clean stripe" },
      { shirt: "end_on_end",     tie: "polka_dot",    score: 9,  label: "Subtle texture + dot — excellent" },
      { shirt: "end_on_end",     tie: "foulard",      score: 9,  label: "Subtle texture + geo — refined" },
    ]
  },

  // RULE 4: Striped suit rules
  rule4_striped_suit: {
    name: "Striped Suit Protocol",
    description: "A striped suit (chalk stripe, pinstripe) is already making a bold statement. The shirt should be solid or subtly textured. The tie should be solid OR a micro-pattern at dramatically different scale.",
    suit_patterns: ["chalk_stripe"],
    shirt_recommendations: [
      { pattern: "solid_shirt",  score: 10, why: "Solid is always correct with stripe suit" },
      { pattern: "poplin",       score: 10, why: "Crisp poplin is the perfect partner to chalk stripe" },
      { pattern: "end_on_end",   score: 9,  why: "The subtle texture of end-on-end doesn't compete with the stripe" },
      { pattern: "oxford",       score: 8,  why: "Oxford weave adds texture without visual noise" },
      { pattern: "chambray",     score: 7,  why: "Casual but works — the texture contrasts without pattern conflict" },
      { pattern: "fine_stripe",  score: 3,  why: "Stripe on stripe — only if scale is dramatically different (3+ levels)" },
      { pattern: "bengal_stripe",score: 2,  why: "RISKY — both are bold stripes. Only experts can pull this off." },
      { pattern: "gingham",      score: 4,  why: "Check and stripe mix — works only in small gingham scale" },
    ],
    tie_recommendations: [
      { pattern: "solid_tie",     score: 10, why: "Solid tie is always correct with a striped suit" },
      { pattern: "grenadine",     score: 10, why: "Grenadine's subtle texture reads as solid from distance — perfect" },
      { pattern: "knit",          score: 9,  why: "Knit reads as solid — the texture contrast works beautifully" },
      { pattern: "polka_dot",     score: 9,  why: "Dots are a separate visual family from stripes — excellent contrast" },
      { pattern: "foulard",       score: 8,  why: "Micro-geometric is a completely different visual language from stripes" },
      { pattern: "micro_paisley", score: 8,  why: "Micro-paisley is small enough to not compete with the chalk stripe" },
      { pattern: "repp_stripe",   score: 7,  why: "Repp stripe is much finer than chalk stripe — scale difference saves it" },
      { pattern: "geometric",     score: 7,  why: "Geometric patterns are a different visual family — acceptable" },
      { pattern: "paisley",       score: 5,  why: "Large paisley competes with the stripe — use only with solid shirt" },
      { pattern: "club_stripe",   score: 4,  why: "Stripe on stripe — the repp diagonal helps but still risky" },
      { pattern: "large_stripe",  score: 1,  why: "FORBIDDEN — bold stripe tie with stripe suit creates chaos" },
      { pattern: "bold_plaid",    score: 2,  why: "Bold plaid tie with chalk stripe — both patterns fighting" },
    ],
    forbidden_combos: [
      { shirt: "bengal_stripe",  tie: "repp_stripe",   reason: "Three stripes (suit, shirt, tie) — visual chaos even at different scales" },
      { shirt: "fine_stripe",    tie: "large_stripe",  reason: "Stripe family throughout entire outfit — too much pattern family repetition" },
    ]
  },

  // RULE 5: Plaid/check suit rules
  rule5_check_suit: {
    name: "Plaid & Check Suit Protocol",
    description: "Plaid and check suits (glen plaid, windowpane, houndstooth) are complex patterns. The tie MUST be solid. The shirt should be solid or subtly textured. Never mix checks with checks.",
    suit_patterns: ["glen_plaid", "windowpane", "houndstooth"],
    shirt_recommendations: [
      { pattern: "solid_shirt",  score: 10, why: "Solid is mandatory with plaid suits — no exceptions" },
      { pattern: "poplin",       score: 10, why: "Crisp poplin is the ideal canvas for a plaid suit" },
      { pattern: "end_on_end",   score: 9,  why: "Subtle end-on-end texture doesn't compete with the plaid" },
      { pattern: "oxford",       score: 9,  why: "Oxford texture adds depth without pattern noise" },
      { pattern: "chambray",     score: 8,  why: "Chambray's casual texture works with relaxed plaid suits" },
      { pattern: "fine_stripe",  score: 5,  why: "Very fine stripes can work — but must be ultra-fine vs the plaid scale" },
      { pattern: "bengal_stripe",score: 3,  why: "RISKY — bold stripe with plaid. Only works with very large plaid scale difference" },
      { pattern: "gingham",      score: 1,  why: "FORBIDDEN — check on check creates visual chaos always" },
    ],
    tie_recommendations: [
      { pattern: "solid_tie",     score: 10, why: "Solid tie is the ONLY safe choice with a patterned suit + patterned shirt" },
      { pattern: "grenadine",     score: 10, why: "Grenadine reads as solid — the ideal textured solid" },
      { pattern: "knit",          score: 10, why: "Knit reads as solid — perfect textural contrast with plaid" },
      { pattern: "polka_dot",     score: 7,  why: "Dots are a completely different visual family — acceptable if suit + solid shirt" },
      { pattern: "foulard",       score: 7,  why: "Micro-geometric works only with solid shirt" },
      { pattern: "micro_paisley", score: 6,  why: "Very small paisley is acceptable — scale must be dramatically smaller" },
      { pattern: "repp_stripe",   score: 5,  why: "Stripe and plaid can work — they're different families, but risky" },
      { pattern: "paisley",       score: 3,  why: "Large paisley with plaid — both complex, competing patterns" },
      { pattern: "bold_plaid",    score: 0,  why: "FORBIDDEN — plaid on plaid is never acceptable" },
      { pattern: "large_stripe",  score: 2,  why: "Bold stripe with plaid — both macro patterns fighting" },
    ],
    absolute_forbidden: [
      { tie: "bold_plaid",     reason: "Check on check — absolute rule violation" },
      { tie: "geometric",      condition: "with_patterned_shirt", reason: "Three competing patterns — chaos" },
      { shirt: "gingham",      reason: "Check shirt with check suit — always forbidden" },
    ]
  },

  // RULE 6: Texture suits (herringbone, tweed) rules
  rule6_texture_suit: {
    name: "Texture Suit Protocol",
    description: "Herringbone and tweed read as textured solids at distance. They're the most forgiving of patterned suits — they can accept more pattern complexity in shirt and tie.",
    suit_patterns: ["herringbone", "tweed", "linen"],
    shirt_recommendations: [
      { pattern: "solid_shirt",  score: 10, why: "Always safe — the texture of the suit provides visual interest" },
      { pattern: "end_on_end",   score: 10, why: "Two subtle textures in dialogue — sophisticated" },
      { pattern: "oxford",       score: 9,  why: "Oxford's basket weave complements herringbone's V-weave" },
      { pattern: "chambray",     score: 9,  why: "Chambray's casual texture pairs naturally with tweed" },
      { pattern: "fine_stripe",  score: 8,  why: "Fine stripe on texture suit — the stripe and texture don't compete" },
      { pattern: "bengal_stripe",score: 6,  why: "Bold stripe with texture suit — texture reads as solid so it works" },
      { pattern: "gingham",      score: 7,  why: "Small gingham works with herringbone — different pattern families" },
    ],
    tie_recommendations: [
      { pattern: "solid_tie",     score: 10, why: "Always correct" },
      { pattern: "grenadine",     score: 10, why: "Grenadine on herringbone — textural mastery" },
      { pattern: "knit",          score: 10, why: "Wool knit on tweed or herringbone — natural fibre harmony" },
      { pattern: "repp_stripe",   score: 9,  why: "Clean stripe against texture suit — excellent contrast" },
      { pattern: "polka_dot",     score: 9,  why: "Dots work beautifully against texture" },
      { pattern: "foulard",       score: 8,  why: "Micro-geo against texture — refined and considered" },
      { pattern: "micro_paisley", score: 8,  why: "Small paisley on texture suit — different families, different scales" },
      { pattern: "paisley",       score: 7,  why: "Larger paisley works against herringbone — they're different families" },
      { pattern: "club_stripe",   score: 8,  why: "Club stripe against texture — the stripe reads cleanly" },
    ]
  },

  // RULE 7: The polka dot rules — the most misunderstood pattern
  rule7_polka_dot: {
    name: "Polka Dot Intelligence",
    description: "Polka dots are their own pattern family. They combine beautifully with stripes and checks because they're a different visual language. The dot size matters enormously.",
    dot_with_stripes: {
      score: 9,
      why: "Dots and stripes are visually complementary — the circular vs linear contrast creates a satisfying tension",
      tip: "The dot must be small to medium — never larger than the stripe spacing"
    },
    dot_with_check: {
      score: 8,
      why: "Dots and checks are different families — the circular dot vs the angular check creates elegant contrast",
      tip: "Keep the dot small relative to the check scale"
    },
    dot_with_dot: {
      score: 2,
      why: "Two dot patterns — only works if scales are extremely different (tiny pin dots vs large medallion dots)",
      tip: "Generally avoided — stick to one dot pattern per outfit"
    },
    suit_combinations: [
      { suit: "chalk_stripe",  shirt: "solid_shirt",    tie: "polka_dot",   score: 10, why: "Dot breaks the stripe's rhythm without competing — perfect" },
      { suit: "glen_plaid",    shirt: "solid_shirt",    tie: "polka_dot",   score: 9,  why: "Dot is a different visual language from plaid — excellent" },
      { suit: "solid_suit",    shirt: "bengal_stripe",  tie: "polka_dot",   score: 9,  why: "The dot bridges solid suit and striped shirt beautifully" },
      { suit: "herringbone",   shirt: "end_on_end",     tie: "polka_dot",   score: 9,  why: "Three different pattern families — textural, weave, circular" },
    ]
  },

}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN COMPATIBILITY SCORER
// Returns a score 0-10 and expert reasoning for any combination
// ─────────────────────────────────────────────────────────────────────────────

function scorePatternCombo(suitPattern, shirtPattern, tiePattern) {
  let score = 10
  const warnings = []
  const tips = []
  const violations = []

  const suitFamily  = PATTERN_SCALE[suitPattern]?.family  || "none"
  const shirtFamily = PATTERN_SCALE[shirtPattern]?.family || "none"
  const tieFamily   = PATTERN_SCALE[tiePattern]?.family   || "none"
  const suitScale   = PATTERN_SCALE[suitPattern]?.scale   || 0
  const shirtScale  = PATTERN_SCALE[shirtPattern]?.scale  || 0
  const tieScale    = PATTERN_SCALE[tiePattern]?.scale    || 0

  // Count active patterns
  const activePatterns = [suitPattern, shirtPattern, tiePattern]
    .filter(p => p && !p.includes("solid") && p !== "poplin" && p !== "voile")
  if (activePatterns.length === 0) {
    return { score: 10, label: "Safe", reason: "All solid — perfectly correct.", tips: [], violations: [], warnings: [] }
  }

  // RULE: Same family, similar scale = violation
  if (suitFamily !== "none" && shirtFamily === suitFamily) {
    const scaleDiff = Math.abs(suitScale - shirtScale)
    if (scaleDiff < 2) {
      score -= 4
      violations.push(`${PATTERN_SCALE[suitPattern]?.label} suit + ${PATTERN_SCALE[shirtPattern]?.label} shirt — same pattern family at similar scale creates visual noise.`)
    } else if (scaleDiff < 3) {
      score -= 2
      warnings.push(`${PATTERN_SCALE[suitPattern]?.label} suit + ${PATTERN_SCALE[shirtPattern]?.label} shirt — similar families. Scale difference helps but tread carefully.`)
    } else {
      tips.push(`Bold scale contrast between ${PATTERN_SCALE[suitPattern]?.label} and ${PATTERN_SCALE[shirtPattern]?.label} — this works because the difference is dramatic.`)
    }
  }

  if (suitFamily !== "none" && tieFamily === suitFamily) {
    const scaleDiff = Math.abs(suitScale - tieScale)
    if (scaleDiff < 2) {
      score -= 5
      violations.push(`${PATTERN_SCALE[suitPattern]?.label} suit + ${PATTERN_SCALE[tiePattern]?.label} tie — same pattern family. This creates visual confusion.`)
    } else if (scaleDiff >= 3) {
      tips.push(`${PATTERN_SCALE[suitPattern]?.label} suit + ${PATTERN_SCALE[tiePattern]?.label} tie — the dramatic scale difference makes this work.`)
    }
  }

  if (shirtFamily !== "none" && tieFamily === shirtFamily && shirtFamily !== "texture") {
    const scaleDiff = Math.abs(shirtScale - tieScale)
    if (scaleDiff < 2) {
      score -= 3
      violations.push(`${PATTERN_SCALE[shirtPattern]?.label} shirt + ${PATTERN_SCALE[tiePattern]?.label} tie — same pattern family at similar scale.`)
    }
  }

  // RULE: Three same families = always wrong
  if (suitFamily === shirtFamily && shirtFamily === tieFamily && suitFamily !== "none") {
    score = 0
    violations.push(`All three items share the ${suitFamily} pattern family — this is never acceptable.`)
  }

  // RULE: Check on check is always forbidden
  if (suitFamily === "check" && shirtFamily === "check") {
    score = Math.min(score, 1)
    violations.push("Check-on-check is always forbidden. A checked suit requires a solid or subtly textured shirt.")
  }
  if (suitFamily === "check" && tieFamily === "check") {
    score = Math.min(score, 1)
    violations.push("Check suit with a checked tie — both patterns compete at the same visual register.")
  }

  // RULE: Stripe suit with stripe tie — scale must differ dramatically
  if (suitFamily === "stripe" && tieFamily === "stripe") {
    const scaleDiff = Math.abs(suitScale - tieScale)
    if (scaleDiff >= 3) {
      score = Math.min(score, 8)
      tips.push("Stripe suit + repp stripe tie — the dramatic scale difference (macro chalk vs micro repp) makes this a classic combination.")
    } else if (scaleDiff >= 2) {
      score = Math.min(score, 6)
      warnings.push("Stripe suit + stripe tie — borderline. Repp stripe works because it's much finer than chalk stripe.")
    } else {
      score = Math.min(score, 3)
      violations.push("Stripe suit + bold stripe tie at similar scale — the two stripes compete. Use a solid, dot, or foulard tie.")
    }
  }

  // RULE: Boost patterned ties that are different families from suit
  if (suitFamily === "stripe" && (tieFamily === "dot" || tieFamily === "geo")) {
    score = Math.min(score + 1, 10)
    tips.push("Polka dot or foulard with a stripe suit — different pattern families create perfect contrast.")
  }
  if (suitFamily === "check" && (tieFamily === "dot" || tieFamily === "geo" || tieFamily === "stripe")) {
    if (tieFamily !== "check") {
      score = Math.min(score + 0, 10)  // neutral — different family is ok
      tips.push("Different pattern family from the plaid suit — acceptable if scale is restrained.")
    }
  }

  // RULE: Dots with stripes = good
  if ((suitFamily === "stripe" && tieFamily === "dot") || (suitFamily === "dot" && tieFamily === "stripe")) {
    if (score < 9) score = Math.min(score + 1, 10)
    tips.push("Dots and stripes are complementary families — circular vs linear creates a satisfying contrast.")
  }

  // RULE: Texture suits are more forgiving
  if (suitFamily === "texture") {
    score = Math.min(score + 1, 10)
    tips.push("Textured suits (herringbone, tweed) read as near-solid at distance — they accept more pattern complexity.")
  }

  // RULE: Max 3 active patterns
  const visiblyPatterned = [suitFamily, shirtFamily, tieFamily].filter(f => f !== "none" && f !== "texture")
  if (visiblyPatterned.length === 3 && new Set(visiblyPatterned).size === 1) {
    score = Math.min(score, 2)
    violations.push("Three patterns from the same family — this is always wrong.")
  }

  // Determine label
  let label = "Expert"
  if (score >= 9) label = "Excellent"
  else if (score >= 7) label = "Good"
  else if (score >= 5) label = "Acceptable"
  else if (score >= 3) label = "Risky"
  else label = "Avoid"

  // Build expert reasoning
  let reason = ""
  if (violations.length > 0) {
    reason = "⚠️ " + violations.join(" ") 
  } else if (warnings.length > 0) {
    reason = "⚡ " + warnings.join(" ")
  } else if (tips.length > 0) {
    reason = "✓ " + tips.join(" ")
  } else {
    reason = "✓ This combination follows all pattern mixing rules correctly."
  }

  return { score, label, reason, tips, violations, warnings }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN ADVISOR
// Given a suit pattern, returns the best shirt and tie recommendations
// with expert explanations
// ─────────────────────────────────────────────────────────────────────────────

function getPatternAdvice(suitPatternKey) {
  const suitFamily = PATTERN_SCALE[suitPatternKey]?.family || "none"

  const advice = {
    suitPattern: PATTERN_SCALE[suitPatternKey]?.label || "Solid",
    suitFamily,
    shirtGuide: [],
    tieGuide: [],
    forbiddenCombos: [],
    goldenRules: [],
  }

  // Solid suit
  if (suitFamily === "none") {
    advice.goldenRules = [
      "A solid suit is a blank canvas — you can wear almost any shirt and tie combination.",
      "Even with a solid suit, avoid mixing two patterns of the same family at the same scale.",
      "Dots with stripes, checks with stripes, or any different-family mix works well.",
    ]
    advice.shirtGuide = [
      { pattern: "Solid / Poplin",     score: 10, note: "Always safe" },
      { pattern: "Bengal Stripe",      score: 9,  note: "Bold stripe — pair with solid tie" },
      { pattern: "End-on-End",         score: 10, note: "Subtle texture — works with anything" },
      { pattern: "Oxford Cloth",       score: 10, note: "Casual texture — works with anything" },
      { pattern: "Fine Stripe",        score: 9,  note: "Fine stripe — pair with solid or dot tie" },
      { pattern: "Gingham",            score: 8,  note: "Small check — pair with solid or stripe tie" },
    ]
    advice.tieGuide = [
      { pattern: "Solid / Grenadine",  score: 10, note: "Always correct" },
      { pattern: "Repp Stripe",        score: 10, note: "Classic — pairs with any solid or textured shirt" },
      { pattern: "Polka Dot",          score: 9,  note: "Excellent with striped shirts, good with all" },
      { pattern: "Foulard",            score: 9,  note: "Micro-geo — works with all shirts" },
      { pattern: "Paisley",            score: 8,  note: "Bold — keep shirt solid" },
      { pattern: "Knit",               score: 9,  note: "Textured solid — pairs with everything" },
    ]
    return advice
  }

  // Stripe suit (chalk stripe, pinstripe)
  if (suitFamily === "stripe") {
    advice.goldenRules = [
      "A striped suit is already making a statement — let it speak.",
      "Keep the shirt solid or subtly textured (no stripes, no bold patterns).",
      "The tie can have a micro-pattern (dots, foulard, micro-paisley) but NEVER another bold stripe.",
      "If the shirt is solid, the tie can be a repp stripe — because the scale difference (macro vs micro stripe) is dramatic enough.",
      "If the shirt has any pattern, the tie must be solid.",
    ]
    advice.shirtGuide = [
      { pattern: "Solid / Poplin",     score: 10, note: "Perfect — the stripe does the work" },
      { pattern: "End-on-End",         score: 9,  note: "Subtle texture — complements without competing" },
      { pattern: "Oxford Cloth",       score: 8,  note: "Casual texture — works well" },
      { pattern: "Fine Stripe",        score: 4,  note: "⚠️ Risky — only if stripe scale differs by 3+ levels" },
      { pattern: "Bengal Stripe",      score: 2,  note: "⛔ Avoid — both are bold stripes" },
      { pattern: "Gingham",            score: 4,  note: "Acceptable only in very small gingham" },
    ]
    advice.tieGuide = [
      { pattern: "Solid / Grenadine",  score: 10, note: "Always correct with stripe suit" },
      { pattern: "Knit (solid)",       score: 10, note: "Reads as solid — perfect" },
      { pattern: "Polka Dot",          score: 9,  note: "Dot is a different family — excellent contrast" },
      { pattern: "Foulard",            score: 8,  note: "Micro-geo is a different family — works well" },
      { pattern: "Micro-Paisley",      score: 8,  note: "Small enough to not compete with the stripe" },
      { pattern: "Repp Stripe",        score: 7,  note: "Only with solid shirt — scale must be dramatically smaller" },
      { pattern: "Bold Stripe",        score: 0,  note: "⛔ NEVER — stripe on stripe at similar scale" },
      { pattern: "Club Stripe",        score: 4,  note: "⚠️ Risky — only diagonal club stripe on chalk stripe" },
    ]
    advice.forbiddenCombos = [
      "Bold stripe tie with chalk stripe suit — always wrong",
      "Bengal stripe shirt with repp stripe tie on stripe suit — three stripes",
      "Club stripe tie with pinstripe shirt on stripe suit — pattern family saturation",
    ]
    return advice
  }

  // Check/plaid suit (glen plaid, windowpane, houndstooth)
  if (suitFamily === "check") {
    advice.goldenRules = [
      "A plaid or check suit demands solid ties — this is the most important rule in menswear.",
      "Never wear a checked shirt with a checked suit — check on check is always wrong.",
      "Never wear a bold striped tie with a plaid suit — both are complex patterns fighting.",
      "The only pattern acceptable in the tie is a micro-pattern (tiny dot, micro-foulard) — and only with a solid shirt.",
      "When in doubt: solid shirt, solid tie. The plaid suit is already the statement.",
    ]
    advice.shirtGuide = [
      { pattern: "Solid / Poplin",     score: 10, note: "Always correct — required for any patterned tie" },
      { pattern: "End-on-End",         score: 9,  note: "Subtle texture — the right level of complexity" },
      { pattern: "Oxford Cloth",       score: 9,  note: "Casual texture — works with relaxed plaid suits" },
      { pattern: "Chambray",           score: 8,  note: "Casual — correct register for relaxed glen plaid" },
      { pattern: "Fine Stripe",        score: 5,  note: "Only ultra-fine stripe — different families help" },
      { pattern: "Gingham",            score: 0,  note: "⛔ FORBIDDEN — check on check, always wrong" },
      { pattern: "Bengal Stripe",      score: 3,  note: "⚠️ Very risky — only with very large plaid" },
    ]
    advice.tieGuide = [
      { pattern: "Solid / Grenadine",  score: 10, note: "The only truly safe choice with a patterned shirt" },
      { pattern: "Knit (solid)",       score: 10, note: "Knit reads as solid — always correct" },
      { pattern: "Polka Dot",          score: 7,  note: "Only with solid shirt — dots are a different family" },
      { pattern: "Foulard",            score: 7,  note: "Only with solid shirt — micro-geo works" },
      { pattern: "Repp Stripe",        score: 5,  note: "Only with solid shirt — stripes and checks are different families" },
      { pattern: "Bold Stripe",        score: 2,  note: "⚠️ Very risky — bold patterns competing" },
      { pattern: "Plaid / Check",      score: 0,  note: "⛔ NEVER — check on check always wrong" },
    ]
    advice.forbiddenCombos = [
      "Any checked tie with a checked suit — absolute rule",
      "Gingham shirt with glen plaid suit — check on check",
      "Patterned shirt + patterned tie with plaid suit — three competing patterns",
    ]
    return advice
  }

  // Texture suit (herringbone, tweed, linen)
  if (suitFamily === "texture") {
    advice.goldenRules = [
      "Textured suits (herringbone, tweed, linen) read as near-solid from a distance — they are the most forgiving.",
      "You can wear a striped shirt OR a striped tie — just not both with a visible suit texture.",
      "Wool knit ties are the natural partner of tweed and herringbone — fabric on fabric.",
      "Repp stripes, polka dots, and foulards all work beautifully against texture suits.",
      "With tweed specifically: knit ties are almost always the correct choice.",
    ]
    advice.shirtGuide = [
      { pattern: "Solid / Poplin",     score: 10, note: "Always safe" },
      { pattern: "End-on-End",         score: 10, note: "Two textures in dialogue — sophisticated" },
      { pattern: "Oxford Cloth",       score: 9,  note: "Basket weave complements herringbone V-weave" },
      { pattern: "Chambray",           score: 9,  note: "Natural partner to tweed's rustic character" },
      { pattern: "Fine Stripe",        score: 8,  note: "Fine stripe against texture suit — works well" },
      { pattern: "Bengal Stripe",      score: 6,  note: "Bold stripe works because texture reads as solid" },
      { pattern: "Gingham",            score: 7,  note: "Small check against texture — different families" },
    ]
    advice.tieGuide = [
      { pattern: "Solid / Grenadine",  score: 10, note: "Always correct" },
      { pattern: "Knit (solid)",       score: 10, note: "Natural fibre harmony with tweed/herringbone" },
      { pattern: "Repp Stripe",        score: 9,  note: "Clean stripe against texture — excellent" },
      { pattern: "Polka Dot",          score: 9,  note: "Dots work beautifully against texture" },
      { pattern: "Foulard",            score: 8,  note: "Micro-geo against texture — refined" },
      { pattern: "Micro-Paisley",      score: 8,  note: "Small paisley on texture suit — different families" },
      { pattern: "Club Stripe",        score: 8,  note: "Club stripe against texture — clean contrast" },
      { pattern: "Paisley",            score: 7,  note: "Larger paisley works — texture suit is forgiving" },
    ]
    return advice
  }

  return advice
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART TIE FILTER
// Given a suit pattern and shirt pattern, returns only valid tie recommendations
// from the analysis data — filters out violations
// ─────────────────────────────────────────────────────────────────────────────

function classifyTiePattern(tieName) {
  const n = tieName.toLowerCase()
  if (/solid|grenadine/.test(n) && !/stripe|dot|paisley|plaid|foulard|geometric|check/.test(n)) return "grenadine"
  if (/knit/.test(n))          return "knit"
  if (/repp|stripe/.test(n))   return "repp_stripe"
  if (/polka|dot/.test(n))     return "polka_dot"
  if (/foulard|geometric/.test(n)) return "foulard"
  if (/micro.?paisley|paisley.*micro/.test(n)) return "micro_paisley"
  if (/paisley/.test(n))       return "paisley"
  if (/club/.test(n))          return "club_stripe"
  if (/plaid|check/.test(n))   return "bold_plaid"
  return "solid_tie"
}

function classifyShirtPattern(shirtName) {
  const n = shirtName.toLowerCase()
  if (/bengal|bold stripe/.test(n)) return "bengal_stripe"
  if (/fine stripe|thin stripe/.test(n)) return "fine_stripe"
  if (/end.on.end|end on end/.test(n)) return "end_on_end"
  if (/oxford/.test(n)) return "oxford"
  if (/chambray/.test(n)) return "chambray"
  if (/gingham/.test(n)) return "gingham"
  if (/poplin|voile|solid/.test(n)) return "solid_shirt"
  return "solid_shirt"
}

function filterTiesForSuitAndShirt(ties, suitPatternKey, shirtName) {
  if (!ties || !ties.length) return []
  const shirtPatternKey = classifyShirtPattern(shirtName)

  return ties.map(tie => {
    const tiePatternKey = classifyTiePattern(tie.name)
    const result = scorePatternCombo(suitPatternKey, shirtPatternKey, tiePatternKey)

    // Boost patterned ties that are DIFFERENT families — these should be recommended
    let boostedScore = result?.score ?? 5
    const tiePat   = PATTERN_SCALE[tiePatternKey]?.family || "none"
    const suitFam  = PATTERN_SCALE[suitPatternKey]?.family || "none"
    const shirtFam = PATTERN_SCALE[shirtPatternKey]?.family || "none"

    // Patterned tie of DIFFERENT family from suit → boost it
    if (tiePat !== "none" && tiePat !== suitFam && tiePat !== shirtFam) {
      boostedScore = Math.min(boostedScore + 1, 10)
    }

    // Grenadine and knit always score at least 8 — they're textured solids
    if (tiePatternKey === "grenadine" || tiePatternKey === "knit") {
      boostedScore = Math.max(boostedScore, 8)
    }

    // Repp stripe on solid/texture suit with solid/texture shirt → always good
    if (tiePatternKey === "repp_stripe" &&
        (suitPatternKey === "solid_suit" || suitPatternKey === "herringbone" || suitPatternKey === "linen") &&
        (shirtPatternKey === "solid_shirt" || shirtPatternKey === "end_on_end" || shirtPatternKey === "oxford" || shirtPatternKey === "chambray")) {
      boostedScore = Math.max(boostedScore, 8)
    }

    // Polka dot with striped suit or striped shirt → classic
    if (tiePatternKey === "polka_dot" && (suitFam === "stripe" || shirtFam === "stripe")) {
      boostedScore = Math.max(boostedScore, 8)
    }

    // Foulard and micro-paisley → different family from almost everything → safe
    if ((tiePatternKey === "foulard" || tiePatternKey === "micro_paisley") && suitFam !== "geo") {
      boostedScore = Math.max(boostedScore, 7)
    }

    return {
      ...tie,
      patternScore: boostedScore,
      patternLabel: boostedScore >= 9 ? "Excellent" : boostedScore >= 7 ? "Good" : boostedScore >= 5 ? "Acceptable" : boostedScore >= 3 ? "Risky" : "Avoid",
      patternWarning: (result.violations?.length > 0) ? result.violations[0] : null,
      patternTip: (result.tips?.length > 0) ? result.tips[0] : (tiePat !== "none" && tiePat !== "texture" ? `${PATTERN_SCALE[tiePatternKey]?.label || ""} — different pattern family from your suit.` : null),
      isRecommended: boostedScore >= 7,
      isAvoidable: boostedScore < 4,
    }
  }).sort((a, b) => b.patternScore - a.patternScore)
}

function getSuitPatternKey(suitPattern) {
  const p = (suitPattern || "").toLowerCase()
  if (/chalk|pinstripe|pin stripe|chalk stripe/.test(p)) return "chalk_stripe"
  if (/glen|windowpane|window pane|plaid|check/.test(p)) return "glen_plaid"
  if (/herringbone/.test(p)) return "herringbone"
  if (/tweed|donegal|harris/.test(p)) return "tweed"
  if (/linen/.test(p)) return "linen"
  if (/houndstooth/.test(p)) return "houndstooth"
  return "solid_suit"
}


// ─────────────────────────────────────────────────────────────────────────────
// PATTERN × COLOR COMBINATION MATRIX
// 8 colors × 6 patterns = 48 unique suit profiles
// Each profile overrides shirts[], packages[], and suit metadata
// Patterns: solid | chalk_stripe | glen_plaid | herringbone | tweed | linen
// Colors:   navy | charcoal | grey | black | brown | beige | burgundy | blue
// ─────────────────────────────────────────────────────────────────────────────

const PATTERN_MATRIX = {

  // ═══════════════════════════════════════════════════════
  // NAVY
  // ═══════════════════════════════════════════════════════

  "navy|solid": {
    suit: { colorFamily:"Navy Blue", undertones:"Cool indigo undertones", fabric:"Worsted wool, ~260 g/m²", pattern:"Solid", formality:"Business Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against solid navy is razor-sharp authority — the cleanest foundation in business dressing.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Burgundy Grenadine Solid",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The quintessential authority pairing — navy and burgundy commands every boardroom."},
        {id:2,name:"Gold & Navy Repp Stripe",color:"#C9A84C",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Gold threads echo the suit's depth while the repp adds classic structure."},
        {id:3,name:"Forest Green Foulard",color:"#355E3B",pattern:"Foulard",material:"Matte Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Forest green completes a triadic palette with quiet distinction."},
        {id:4,name:"Silver-Grey Polka Dot",color:"#A9A9A9",pattern:"Polka Dot",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Cool silver creates restrained elegance — ideal for finance and law."},
        {id:5,name:"Deep Teal Wool Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Knit texture adds tactile richness; teal bridges cool navy warmth beautifully."},
        {id:6,name:"Burnt Orange Paisley",color:"#CC5500",pattern:"Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Burnt orange against navy is striking without aggression — the bold move."},
      ]},
      { id:2, name:"Pale French Blue", colorCode:"#89B4D4", why:"Blue-on-blue tonal harmony deepens the suit without competing — a move of real sophistication.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"Ivory Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Terracotta Repp Stripe",color:"#CB6D51",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Warm terracotta against cool pale blue is the most naturally elegant contrast in menswear."},
        {id:2,name:"Midnight Navy Grenadine",color:"#191970",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Monochromatic",why:"Tone-on-tone navy — depth and sophistication in its purest form."},
        {id:3,name:"Burgundy Micro-Paisley",color:"#722F37",pattern:"Micro-Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Burgundy warmth cuts through the cool blue register with elegant energy."},
        {id:4,name:"Olive & Gold Geometric",color:"#808000",pattern:"Geometric",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive-gold adds Italian flair — a warm accent in a cool blue ensemble."},
        {id:5,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Kelvin",harmony:"Analogous",why:"Charcoal anchors pale blue with authority — clean, modern, professional."},
        {id:6,name:"Silver & White Stripe",color:"#C0C0C0",pattern:"Stripe",material:"Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Analogous",why:"Crisp and precise — ideal for high-stakes environments where detail matters most."},
      ]},
      { id:3, name:"Pale Pink Bengal Stripe", colorCode:"#F4B8C1", why:"Warm rose complements cool navy with a confident personality twist without sacrificing professionalism.", collar:"Button-down collar", pattern:"Bengal Stripe", pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Navy Polka Dot",color:"#1B3A6B",pattern:"Polka Dot",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Deep navy anchors the pink while the dot adds playful precision."},
        {id:2,name:"Charcoal & Silver Stripe",color:"#36454F",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Cool charcoal calms the warmth of pink — an understated power move."},
        {id:3,name:"Deep Teal Solid",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal-pink is unexpectedly elegant — cool and warm tones in balance."},
        {id:4,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel echoes pink with relaxed sophistication."},
        {id:5,name:"Forest Green Club Tie",color:"#355E3B",pattern:"Club (crests)",material:"Wool-Silk Blend",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"An Ivy League nod — forest green, pink, and navy is timelessly preppy."},
        {id:6,name:"Maroon Paisley",color:"#800020",pattern:"Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Maroon grounds the pink in an elegant, Old World manner."},
      ]},
    ],
    packages:[
      {name:"The Milan Executive",suit:"Navy Solid",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black calf leather",socks:"Dark navy over-the-calf",watch:"Silver dress watch",occasion:"Board meeting, client pitch, interview",archetype:"British Classic",confidence:2,tip:"Keep the pocket square white and flat — the restraint is what gives this look its authority.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Continental",suit:"Navy Solid",shirt:"Pale French Blue",tie:"Terracotta Repp Stripe",pocketSquare:"Ivory Cotton — One Point",shoes:"Dark Brown Derby Brogues",belt:"Dark cognac leather",socks:"Burgundy shadow stripe",watch:"Gold-case dress watch",occasion:"Senior leadership, diplomatic dinner",archetype:"Italian",confidence:4,tip:"Brown shoes with navy is the move that separates the truly stylish from the merely correct.",shirtColor:"#89B4D4",tieColor:"#CB6D51"},
      {name:"The Weekend Power Move",suit:"Navy Solid",shirt:"Pale Pink Bengal",tie:"Deep Teal Wool Knit",pocketSquare:"Pink Silk — Puff Fold",shoes:"Tan Suede Monk Strap",belt:"Tan suede",socks:"Teal or light grey",watch:"Sport-dress watch",occasion:"Business casual Friday, gallery opening",archetype:"Continental",confidence:4,tip:"The knit tie softens solid navy's formality — authority without rigidity.",shirtColor:"#F4B8C1",tieColor:"#008080"},
      {name:"The City Classic",suit:"Navy Solid",shirt:"Crisp White Poplin",tie:"Gold & Navy Repp Stripe",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxfords",belt:"Black leather",socks:"Navy ribbed",watch:"Silver dress watch",occasion:"City meetings, presentations",archetype:"Preppy",confidence:3,tip:"The repp stripe is the tie of quiet confidence — institutional without being boring.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Modern Maverick",suit:"Navy Solid",shirt:"Pale French Blue",tie:"Burnt Orange Paisley",pocketSquare:"Ivory Silk — Puff Fold",shoes:"Brown Oxford Brogues",belt:"Cognac leather",socks:"Orange shadow stripe",watch:"Gold sport-dress watch",occasion:"Creative business, brand events",archetype:"Avant-Garde",confidence:5,tip:"Orange against navy is bold theatre — only wear it when you can own the room.",shirtColor:"#89B4D4",tieColor:"#CC5500"},
      {name:"The Understated Authority",suit:"Navy Solid",shirt:"Crisp White Poplin",tie:"Forest Green Foulard",pocketSquare:"Green Silk — Two Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Forest green",watch:"Dress watch, dark strap",occasion:"Creative leadership, strategy meetings",archetype:"British",confidence:4,tip:"The foulard's small pattern adds quiet distinction without demanding attention.",shirtColor:"#F8F8F8",tieColor:"#355E3B"},
    ],
    styleMantra:"Solid navy is the blank canvas of authority — what you add reveals everything about who you are."
  },

  "navy|chalk_stripe": {
    suit: { colorFamily:"Navy Chalk Stripe", undertones:"Warm indigo undertones", fabric:"Wool twill, ~260 g/m²", pattern:"Chalk Stripe — 1.5 cm spacing", formality:"Business Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"Pure white delivers razor-sharp contrast against the navy chalk stripe, maximising formality and impact.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold (Presidential)",material:"Irish Linen"}, ties:[
        {id:1,name:"Burgundy Grenadine Solid",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The quintessential authority pairing — navy chalk stripe and burgundy is the power combination of the boardroom."},
        {id:2,name:"Gold & Navy Repp Stripe",color:"#C9A84C",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Gold threads echo the chalk stripe while deep navy grounds the look with tonal depth."},
        {id:3,name:"Forest Green Foulard",color:"#355E3B",pattern:"Foulard (geometric)",material:"Matte Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Forest green completes a sophisticated triadic palette, adding quiet distinction."},
        {id:4,name:"Silver-Grey Polka Dot",color:"#A9A9A9",pattern:"Polka Dot",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"The grey mirrors the chalk stripe itself, creating cool, restrained elegance."},
        {id:5,name:"Deep Teal Wool Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Knit texture against the structured stripe adds tactile richness."},
        {id:6,name:"Burnt Orange Paisley",color:"#CC5500",pattern:"Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"For the confident dresser: burnt orange against navy chalk stripe is striking without aggression."},
      ]},
      { id:2, name:"Pale French Blue End-on-End", colorCode:"#89B4D4", why:"Blue-on-blue tonal harmony deepens the suit's presence — a move of real sophistication.", collar:"Semi-spread collar", pattern:"End-on-End weave", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Terracotta Repp Stripe",color:"#CB6D51",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against cool pale blue against navy chalk stripe is the most naturally elegant contrast in menswear."},
        {id:2,name:"Midnight Navy Grenadine",color:"#191970",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Monochromatic",why:"Tone-on-tone navy dressing — depth and sophistication in purest form."},
        {id:3,name:"Burgundy Micro-Paisley",color:"#722F37",pattern:"Micro-Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The micro-pattern of the paisley complements the macro-pattern of the stripe perfectly."},
        {id:4,name:"Olive & Gold Geometric",color:"#808000",pattern:"Geometric Foulard",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive-gold adds Italian flair while respecting the chalk stripe's vertical rhythm."},
        {id:5,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Kelvin",harmony:"Analogous",why:"Charcoal anchors pale blue with authority — clean, modern, deeply professional."},
        {id:6,name:"Silver & White Stripe",color:"#C0C0C0",pattern:"Stripe",material:"Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Analogous",why:"Stripe on stripe — only works when scales differ dramatically. Here they do perfectly."},
      ]},
      { id:3, name:"Pale Pink Bengal Stripe", colorCode:"#F4B8C1", why:"Warm rose against navy chalk stripe adds confident personality — the stripe-on-stripe move of the truly stylish.", collar:"Button-down collar", pattern:"Bengal Stripe (pink/white)", pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Navy Polka Dot",color:"#1B3A6B",pattern:"Polka Dot",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"The dot breaks the pattern layering with a welcome circular interruption."},
        {id:2,name:"Charcoal & Silver Stripe",color:"#36454F",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Cool charcoal calms the warmth of pink — an understated power move on a statement suit."},
        {id:3,name:"Deep Teal Solid",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"A solid tie is essential when suit and shirt are both patterned."},
        {id:4,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"The knit texture softens the chalk stripe's formality without losing authority."},
        {id:5,name:"Forest Green Club Tie",color:"#355E3B",pattern:"Club (crests)",material:"Wool-Silk Blend",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"The small club crests create texture without competing with the larger stripe patterns."},
        {id:6,name:"Maroon Paisley",color:"#800020",pattern:"Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Maroon grounds the pink in an Old World manner — the chalk stripe handles the drama."},
      ]},
    ],
    packages:[
      {name:"The Chalk Stripe Power",suit:"Navy Chalk Stripe",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black calf leather",socks:"Dark navy over-the-calf",watch:"Silver dress watch",occasion:"Board meeting, client pitch, closing deals",archetype:"British Classic",confidence:2,tip:"The chalk stripe already makes a statement — keep everything else immaculate and restrained.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Continental Authority",suit:"Navy Chalk Stripe",shirt:"Pale French Blue",tie:"Terracotta Repp Stripe",pocketSquare:"Ivory Cotton — One Point",shoes:"Dark Brown Derby Brogues",belt:"Dark cognac leather",socks:"Burgundy shadow stripe",watch:"Gold-case dress watch",occasion:"Senior leadership, diplomatic dinner",archetype:"Italian",confidence:4,tip:"Brown shoes with chalk stripe navy is the Italian master move — confident and precise.",shirtColor:"#89B4D4",tieColor:"#CB6D51"},
      {name:"The Boardroom Bold",suit:"Navy Chalk Stripe",shirt:"Pale Pink Bengal",tie:"Deep Teal Wool Knit",pocketSquare:"Pink Silk — Puff Fold",shoes:"Tan Suede Monk Strap",belt:"Tan suede",socks:"Teal or light grey",watch:"Sport-dress watch",occasion:"Business casual, creative sector, client lunch",archetype:"Continental",confidence:4,tip:"Three patterns: chalk stripe, bengal, knit — each different in scale. The only rule that makes it work.",shirtColor:"#F4B8C1",tieColor:"#008080"},
      {name:"The City Banker",suit:"Navy Chalk Stripe",shirt:"Crisp White Poplin",tie:"Gold & Navy Repp Stripe",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxfords",belt:"Black leather",socks:"Navy ribbed",watch:"Silver dress watch",occasion:"City meetings, finance, legal",archetype:"Preppy",confidence:3,tip:"Gold repp on chalk stripe white — the combination that built Wall Street.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Weekend Maverick",suit:"Navy Chalk Stripe",shirt:"Pale Pink Bengal",tie:"Camel Knit",pocketSquare:"Pink Silk — Puff Fold",shoes:"Tan Derby Brogues",belt:"Tan leather",socks:"Camel or light grey",watch:"Sport casual watch",occasion:"Smart casual, gallery, client lunch",archetype:"Avant-Garde",confidence:5,tip:"The chalk stripe worn casually is a statement of confidence — the knit tie makes it accessible.",shirtColor:"#F4B8C1",tieColor:"#C19A6B"},
      {name:"The Understated Statesman",suit:"Navy Chalk Stripe",shirt:"Pale French Blue",tie:"Midnight Navy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Navy shadow stripe",watch:"Silver dress watch",occasion:"Formal meetings, senior roles, government",archetype:"British",confidence:2,tip:"Monochromatic navy on chalk stripe is the move of a man who needs no decoration — the suit speaks.",shirtColor:"#89B4D4",tieColor:"#191970"},
    ],
    styleMantra:"The chalk stripe is architecture in cloth — it commands space before you say a word."
  },

  "navy|glen_plaid": {
    suit: { colorFamily:"Navy Glen Plaid", undertones:"Cool navy with warm check pattern", fabric:"Wool blend, ~240 g/m²", pattern:"Glen Plaid / Windowpane", formality:"Business Casual / Smart Formal", lapel:"Notch lapel", fit:"Classic or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White cuts through the busyness of the glen plaid cleanly — necessary grounding for a complex pattern.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"A solid tie is essential with glen plaid — one pattern at a time. Burgundy is the authority choice."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Monochromatic",why:"Tonal navy on glen plaid is confident and restrained — the suit does the work."},
        {id:3,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Green echoes the earthy tones often woven into navy glen plaid."},
        {id:4,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit against glen plaid has a country club elegance — smart but relaxed."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"The knit texture prevents pattern clash while burgundy provides the necessary contrast."},
        {id:6,name:"Solid Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Pratt/Shelby",harmony:"Complementary",why:"Teal adds a modern jewel-tone pop against the traditional glen plaid."},
      ]},
      { id:2, name:"Pale Blue Chambray", colorCode:"#89B4D4", why:"Chambray's textural quality matches the tactile richness of glen plaid without competing in pattern.", collar:"Button-down collar", pattern:"Solid / Chambray", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Knit ties are the natural companion to glen plaid — textural harmony, pattern restraint."},
        {id:2,name:"Solid Forest Green Grenadine",color:"#355E3B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"The grenadine texture plays beautifully against the woven complexity of glen plaid."},
        {id:3,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel against cool blue and navy plaid — a relaxed authority."},
        {id:4,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Charcoal is always a safe anchor when patterns are doing the heavy lifting."},
        {id:5,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal blue-on-blue against a plaid is quietly sophisticated."},
        {id:6,name:"Solid Mustard Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard pops against navy plaid with sunny, confident warmth."},
      ]},
      { id:3, name:"White Oxford Cloth", colorCode:"#F5F5F0", why:"Oxford cloth has subtle texture that complements the woven complexity of glen plaid without competing.", collar:"Button-down collar", pattern:"Oxford weave", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive and navy glen plaid is the classic English country combination — authoritative and grounded."},
        {id:2,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"The timeless burgundy anchor — always correct, never wrong with a navy plaid."},
        {id:3,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit against navy plaid has an old-money ease — understated excellence."},
        {id:4,name:"Solid Teal",color:"#008080",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal introduces a modern jewel tone into the traditional plaid vocabulary."},
        {id:5,name:"Solid Navy Silk",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Matching the dominant colour of the plaid creates a refined tonal look."},
        {id:6,name:"Solid Grey",color:"#808080",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Cool grey neutralizes the pattern's complexity into something quietly elegant."},
      ]},
    ],
    packages:[
      {name:"The Country Banker",suit:"Navy Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby Brogues",belt:"Dark brown leather",socks:"Burgundy or navy",watch:"Gold-case dress watch",occasion:"Client lunch, country meetings, smart casual",archetype:"British Classic",confidence:3,tip:"With glen plaid, the pattern is the statement — keep tie and shirt solid always.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Ivy Leaguer",suit:"Navy Glen Plaid",shirt:"White Oxford Cloth",tie:"Solid Olive Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Derby Brogues",belt:"Tan leather",socks:"Olive or khaki",watch:"Casual dress watch",occasion:"Business casual, campus, creative sector",archetype:"Preppy",confidence:4,tip:"Oxford cloth and knit tie signal effortless ease — the glen plaid does the formal work.",shirtColor:"#F5F5F0",tieColor:"#556B2F"},
      {name:"The Modern Gentlemen",suit:"Navy Glen Plaid",shirt:"Pale Blue Chambray",tie:"Solid Camel Knit",pocketSquare:"White Cotton — One Point",shoes:"Tan Monk Strap",belt:"Tan leather",socks:"Camel or light grey",watch:"Sport-dress watch",occasion:"Gallery, team offsite, creative business",archetype:"Continental",confidence:4,tip:"Chambray and camel knit against glen plaid is relaxed authority — a very Italian sensibility.",shirtColor:"#89B4D4",tieColor:"#C19A6B"},
      {name:"The Country Club",suit:"Navy Glen Plaid",shirt:"White Oxford Cloth",tie:"Solid Dark Brown Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Brown or olive",watch:"Leather-strap casual watch",occasion:"Weekend smart, country events, golf club",archetype:"Country",confidence:4,tip:"Brown suede with navy plaid is the weekend power move — relaxed but completely deliberate.",shirtColor:"#F5F5F0",tieColor:"#5C3317"},
      {name:"The Weekend Statement",suit:"Navy Glen Plaid",shirt:"Pale Blue Chambray",tie:"Solid Mustard Knit",pocketSquare:"Gold Silk — Puff Fold",shoes:"Tan Suede Loafers",belt:"Tan suede",socks:"Mustard or navy",watch:"Casual sport watch",occasion:"Smart casual, weekend, art events",archetype:"Avant-Garde",confidence:5,tip:"Mustard against navy plaid is sunny confidence — the knit keeps it from being too sharp.",shirtColor:"#89B4D4",tieColor:"#C9A84C"},
      {name:"The Restrained Scholar",suit:"Navy Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Navy ribbed",watch:"Silver dress watch",occasion:"Academic, formal meetings, professional events",archetype:"British",confidence:2,tip:"Tonal navy on glen plaid is the most restrained read — the pattern speaks; you don't have to.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Glen plaid is the pattern of the gentleman who learned to dress — it rewards restraint and punishes excess."
  },

  "navy|herringbone": {
    suit: { colorFamily:"Navy Herringbone", undertones:"Cool navy with V-weave texture", fabric:"Wool herringbone, ~270 g/m²", pattern:"Herringbone", formality:"Business Formal / Smart Formal", lapel:"Notch lapel", fit:"Classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against herringbone creates clean contrast that lets the weave's texture read without distraction.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The grenadine's own texture harmonises beautifully with herringbone's V-weave."},
        {id:2,name:"Solid Navy Silk",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Half Windsor",harmony:"Monochromatic",why:"Tonal navy on herringbone is quiet authority — the texture variation creates depth."},
        {id:3,name:"Solid Forest Green Grenadine",color:"#355E3B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Forest green adds an earthy note that complements the tactile herringbone."},
        {id:4,name:"Solid Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Wool knit against herringbone wool — a sophisticated textural dialogue."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"The knit texture enhances the herringbone's tactile quality perfectly."},
        {id:6,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel against cool navy herringbone — a subtle but effective contrast."},
      ]},
      { id:2, name:"Pale Blue End-on-End", colorCode:"#89B4D4", why:"End-on-end weave complements herringbone's textural complexity — pattern echoes without conflict.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta warmth against cool blue and navy herringbone — an Italian masterclass."},
        {id:2,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The classic burgundy anchor works impeccably against the subtle complexity of herringbone."},
        {id:3,name:"Solid Dark Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Wool on wool — knit meets herringbone in a study of textured refinement."},
        {id:4,name:"Solid Charcoal",color:"#36454F",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Kelvin",harmony:"Analogous",why:"Charcoal cools the pale blue while grounding the herringbone's texture."},
        {id:5,name:"Solid Teal Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal knit is unexpectedly refined against navy herringbone — jewel tones love texture."},
        {id:6,name:"Solid Silver",color:"#C0C0C0",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Pratt/Shelby",harmony:"Analogous",why:"Silver brings a cool, metallic quiet to the blue-navy herringbone palette."},
      ]},
      { id:3, name:"White Oxford Cloth", colorCode:"#F5F5F0", why:"Oxford's subtle basket weave adds a second texture layer that enhances the herringbone's tactile story.", collar:"Button-down collar", pattern:"Oxford weave", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive and navy herringbone is the English country club at its finest."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit on herringbone is a textural feast — warm tones against cool weave."},
        {id:3,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy always anchors navy herringbone with appropriate authority."},
        {id:4,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Dark brown is the earthy complement to navy herringbone — thoroughly English."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Green against oxford white and navy herringbone — an autumnal richness."},
        {id:6,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal dressing with herringbone relies on the weave for interest — the tie stays quiet."},
      ]},
    ],
    packages:[
      {name:"The Herringbone Authority",suit:"Navy Herringbone",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black leather",socks:"Dark navy",watch:"Silver dress watch",occasion:"Board meeting, formal presentations",archetype:"British Classic",confidence:2,tip:"Let the herringbone weave be the visual interest — everything else should be impeccably plain.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Texture Master",suit:"Navy Herringbone",shirt:"Pale Blue End-on-End",tie:"Solid Dark Green Knit",pocketSquare:"White Cotton — One Point",shoes:"Dark Brown Derby",belt:"Dark brown",socks:"Olive or navy",watch:"Gold-case dress watch",occasion:"Client meetings, creative business, dinners",archetype:"Italian",confidence:4,tip:"Three textures: herringbone, end-on-end, wool knit — a masterclass in textural layering.",shirtColor:"#89B4D4",tieColor:"#355E3B"},
      {name:"The Country Squire",suit:"Navy Herringbone",shirt:"White Oxford Cloth",tie:"Solid Camel Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Camel or brown",watch:"Leather-strap watch",occasion:"Country events, smart casual, weekends",archetype:"Country",confidence:4,tip:"Oxford cloth and camel knit make the herringbone feel relaxed without losing its authority.",shirtColor:"#F5F5F0",tieColor:"#C19A6B"},
      {name:"The Refined Tonal",suit:"Navy Herringbone",shirt:"Pale Blue End-on-End",tie:"Solid Teal Knit",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Teal or navy",watch:"Silver dress watch",occasion:"Professional, city meetings, presentations",archetype:"Continental",confidence:3,tip:"Teal knit on blue end-on-end on navy herringbone — tonal depth through texture, not colour.",shirtColor:"#89B4D4",tieColor:"#008080"},
      {name:"The English Autumn",suit:"Navy Herringbone",shirt:"White Oxford Cloth",tie:"Solid Olive Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Brogues",belt:"Tan leather",socks:"Olive or khaki",watch:"Casual dress watch",occasion:"Autumn events, country, smart casual",archetype:"British",confidence:4,tip:"Olive and navy herringbone is the English autumn in sartorial form — wear it October through February.",shirtColor:"#F5F5F0",tieColor:"#556B2F"},
      {name:"The Understated Power",suit:"Navy Herringbone",shirt:"Crisp White Poplin",tie:"Solid Navy",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxfords",belt:"Black leather",socks:"Navy over-the-calf",watch:"Silver dress watch",occasion:"Formal, government, senior roles",archetype:"British Classic",confidence:1,tip:"White, navy, navy — the power of herringbone is in what you don't add.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Herringbone is texture elevated to artistry — it rewards the eye that looks closely."
  },

  "navy|tweed": {
    suit: { colorFamily:"Navy Tweed", undertones:"Deep navy with multi-colour fleck", fabric:"Harris Tweed / Donegal, ~380 g/m²", pattern:"Tweed / Textured", formality:"Smart Casual / Business Casual", lapel:"Notch lapel", fit:"Classic fit" },
    shirts: [
      { id:1, name:"White Oxford Cloth", colorCode:"#F5F5F0", why:"Oxford cloth's casual texture pairs perfectly with tweed's rustic richness without competing.", collar:"Button-down collar", pattern:"Oxford weave", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Wool meets wool — camel knit and navy tweed is the quintessential English country combination."},
        {id:2,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive picks out the earthy flecks often woven into navy tweed — deeply natural."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy warms the cool navy tweed — knit ties are the only correct choice here."},
        {id:4,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Brown and tweed are inseparable — earthy, assured, and thoroughly British."},
        {id:5,name:"Solid Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green on navy tweed — the moorland palette brought to town."},
        {id:6,name:"Solid Mustard Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard against navy tweed adds warmth and personality — the non-conformist country look."},
      ]},
      { id:2, name:"Pale Blue Chambray", colorCode:"#89B4D4", why:"Chambray's textural quality echoes tweed's weave — a relaxed, tactile pairing.", collar:"Button-down collar", pattern:"Chambray", pocketSquare:{name:"Ivory Cotton",fold:"Casual Puff",material:"Cotton"}, ties:[
        {id:1,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit on chambray and navy tweed — warm, relaxed, and completely deliberate."},
        {id:2,name:"Solid Olive",color:"#556B2F",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive silk adds a touch of elegance to the rustic blue-tweed pairing."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"The classic warming anchor — burgundy on chambray on tweed is completely natural."},
        {id:4,name:"Solid Dark Green Knit",color:"#2E5941",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Dark green adds depth and an outdoorsy quality that tweed was made to carry."},
        {id:5,name:"Solid Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Rust orange on chambray blue and navy tweed — an autumnal palette of rare richness."},
        {id:6,name:"No Tie (Pocket Square Only)",color:"#F8F8F8",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Tweed worn without a tie — a white linen pocket square is all you need."},
      ]},
      { id:3, name:"Cream / Ecru Poplin", colorCode:"#F5F0E8", why:"Warm cream softens navy tweed's weight into something relaxed and autumnal.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Cream Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Dark brown on cream on navy tweed — a palette lifted straight from an English country estate."},
        {id:2,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on cream is an autumnal combination that tweed was literally designed to accompany."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Warm burgundy on warm cream on cool navy tweed — rich, balanced, and deeply considered."},
        {id:4,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Tonal warmth — camel on cream on tweed is a study in autumnal restraint."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green silk on cream gives a touch of town polish to the country tweed."},
        {id:6,name:"No Tie (Pocket Square Only)",color:"#C19A6B",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Cream shirt and tweed without a tie — a cream pocket square completes it."},
      ]},
    ],
    packages:[
      {name:"The Country Gentleman",suit:"Navy Tweed",shirt:"White Oxford Cloth",tie:"Solid Camel Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Derby Brogues",belt:"Brown suede",socks:"Camel or brown",watch:"Leather-strap watch",occasion:"Country events, smart casual, weekends",archetype:"Country",confidence:4,tip:"Tweed demands natural companions — knit ties, suede shoes, and nothing too polished.",shirtColor:"#F5F5F0",tieColor:"#C19A6B"},
      {name:"The Autumn Editor",suit:"Navy Tweed",shirt:"Pale Blue Chambray",tie:"Solid Rust Knit",pocketSquare:"Ivory Cotton — Casual Puff",shoes:"Tan Derby Brogues",belt:"Tan leather",socks:"Rust or navy",watch:"Sport casual watch",occasion:"Creative sector, gallery, weekend smart",archetype:"Avant-Garde",confidence:5,tip:"Rust knit on chambray blue on navy tweed — the full autumn palette in one outfit.",shirtColor:"#89B4D4",tieColor:"#B7410E"},
      {name:"The Estate Classic",suit:"Navy Tweed",shirt:"Cream Ecru Poplin",tie:"Solid Dark Brown Knit",pocketSquare:"Cream Silk — Puff Fold",shoes:"Dark Brown Brogues",belt:"Dark brown",socks:"Brown or olive",watch:"Gold-tone leather watch",occasion:"Country house, shooting, smart casual",archetype:"Country",confidence:3,tip:"Cream and brown on navy tweed is the English country estate — authoritative without effort.",shirtColor:"#F5F0E8",tieColor:"#5C3317"},
      {name:"The Moorland Look",suit:"Navy Tweed",shirt:"White Oxford Cloth",tie:"Solid Olive Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Olive Green Suede Derby",belt:"Dark brown",socks:"Olive or green",watch:"Casual watch",occasion:"Outdoor smart, country, autumn events",archetype:"British",confidence:4,tip:"Olive on white on navy tweed reads as moorland — deeply natural, completely considered.",shirtColor:"#F5F5F0",tieColor:"#556B2F"},
      {name:"The No-Tie Tweed",suit:"Navy Tweed",shirt:"Pale Blue Chambray",tie:"No Tie",pocketSquare:"Ivory Cotton — Casual Puff",shoes:"Brown Suede Loafers",belt:"Brown suede",socks:"Navy or camel",watch:"Casual leather watch",occasion:"Weekend, gallery, smart casual dining",archetype:"Continental",confidence:4,tip:"Tweed worn without a tie is not underdressed — it is perfectly dressed for the right occasion.",shirtColor:"#89B4D4",tieColor:"#F5F5F0"},
      {name:"The Burgundy Warmth",suit:"Navy Tweed",shirt:"Cream Ecru Poplin",tie:"Solid Burgundy Knit",pocketSquare:"Cream Silk — Puff Fold",shoes:"Dark Brown Oxford",belt:"Dark brown",socks:"Burgundy or navy",watch:"Rose-gold casual watch",occasion:"Autumn dinner, gallery, country event",archetype:"Italian",confidence:4,tip:"Burgundy on cream on navy tweed — warm, rich, and completely autumnal.",shirtColor:"#F5F0E8",tieColor:"#722F37"},
    ],
    styleMantra:"Tweed is the suit of the land — wear it with the same effortless confidence as its county of origin."
  },

  "navy|linen": {
    suit: { colorFamily:"Navy Linen", undertones:"Cool navy, relaxed drape", fabric:"100% Linen or Linen blend", pattern:"Solid / Subtle texture", formality:"Smart Casual / Summer Formal", lapel:"Notch lapel", fit:"Relaxed or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Linen", colorCode:"#F8F8F8", why:"White linen on navy linen is summer dressing at its most refined — two natural fibres in perfect harmony.", collar:"Spread or camp collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"No Tie (Pocket Square Only)",color:"#F8F8F8",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"A navy linen suit worn without a tie is the purest summer dressing — let the fabric breathe."},
        {id:2,name:"Solid Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Cotton-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"A knit tie in navy on a navy linen suit — tonal, relaxed, and completely appropriate for summer."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel against cool navy linen — the summer version of the classic colour contrast."},
        {id:4,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Cotton-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy and navy linen — the same authority as the wool version, lighter for summer."},
        {id:5,name:"Solid White Linen Tie",color:"#F8F8F8",pattern:"Solid",material:"Linen",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"A white linen tie on a white linen shirt on a navy linen suit — all-linen summer elegance."},
        {id:6,name:"Solid Terracotta Knit",color:"#CB6D51",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against navy linen is summer in the Mediterranean — warm, vibrant, relaxed."},
      ]},
      { id:2, name:"Pale Blue Voile", colorCode:"#C5D8E8", why:"Voile's lightness matches linen's summer character — cool blue on cool navy in natural fibres.", collar:"Camp collar or semi-spread", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"No Tie",color:"#F8F8F8",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Navy linen with pale blue voile and no tie — this is the Riviera. Nothing more needed."},
        {id:2,name:"Solid White Cotton Knit",color:"#F8F8F8",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"White knit against pale blue and navy linen — summer tonal dressing at its most refined."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel on cool blue on navy linen — the perfect summer warmth-cool balance."},
        {id:4,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Cotton-Silk",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta is the natural warm complement to the cool blue-navy linen palette."},
        {id:5,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on pale blue on navy linen — an earthy summer combination with Italian roots."},
        {id:6,name:"Solid Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"All-navy with pale blue accent — tonal summer mastery."},
      ]},
      { id:3, name:"Cream / Ivory Linen", colorCode:"#FAF0E6", why:"Cream on navy linen is the classic summer pairing — warm and cool, natural and refined.", collar:"Spread collar or open collar", pattern:"Solid", pocketSquare:{name:"Cream Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"No Tie",color:"#FAF0E6",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Cream linen shirt open at the collar with a navy linen suit — nothing else needed."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel on warm cream on cool navy linen — tonal warmth in a cool suit."},
        {id:3,name:"Solid Terracotta Knit",color:"#CB6D51",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta and cream and navy linen — the Mediterranean summer in three colours."},
        {id:4,name:"Solid Olive",color:"#556B2F",pattern:"Solid",material:"Cotton-Silk",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on cream on navy linen — earthy and natural, thoroughly considered."},
        {id:5,name:"Solid Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal navy on cream on navy linen — the monochromatic summer look."},
        {id:6,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy silk with cream linen brings a touch of formality to a relaxed summer suit."},
      ]},
    ],
    packages:[
      {name:"The Riviera",suit:"Navy Linen",shirt:"Pale Blue Voile",tie:"No Tie",pocketSquare:"White Linen — Casual Puff",shoes:"White Canvas Loafers",belt:"None (no belt)",socks:"No socks (loafers)",watch:"Casual sport watch",occasion:"Mediterranean holiday, summer parties, beachside",archetype:"Continental",confidence:5,tip:"No tie, no socks, loafers — the linen suit's natural habitat is somewhere between the sea and lunch.",shirtColor:"#C5D8E8",tieColor:"#C5D8E8"},
      {name:"The Summer Authority",suit:"Navy Linen",shirt:"Crisp White Linen",tie:"Solid Burgundy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Loafers",belt:"Brown suede",socks:"Navy or no socks",watch:"Casual dress watch",occasion:"Summer business casual, client lunch",archetype:"Italian",confidence:3,tip:"A knit tie signals you know linen doesn't need a sharp silk tie — it's a mark of real knowledge.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Cream Summer",suit:"Navy Linen",shirt:"Cream Ivory Linen",tie:"No Tie",pocketSquare:"Cream Silk — Puff Fold",shoes:"Tan Leather Loafers",belt:"Tan leather",socks:"No socks",watch:"Casual watch",occasion:"Summer garden parties, outdoor events, weekends",archetype:"Country",confidence:4,tip:"All linen, open collar, tan shoes — the summer gentleman in his natural element.",shirtColor:"#FAF0E6",tieColor:"#FAF0E6"},
      {name:"The Terracotta Summer",suit:"Navy Linen",shirt:"Crisp White Linen",tie:"Solid Terracotta Knit",pocketSquare:"Terracotta Silk — Puff Fold",shoes:"Tan Derby",belt:"Tan leather",socks:"Terracotta or navy",watch:"Casual sport watch",occasion:"Summer creative events, gallery, garden party",archetype:"Avant-Garde",confidence:4,tip:"Terracotta against navy linen is the Mediterranean in a tie — warm, vibrant, entirely summer.",shirtColor:"#F8F8F8",tieColor:"#CB6D51"},
      {name:"The Olive Summer",suit:"Navy Linen",shirt:"Pale Blue Voile",tie:"Solid Olive Knit",pocketSquare:"Ivory Cotton — Puff Fold",shoes:"Tan Suede Loafers",belt:"Tan suede",socks:"Olive or no socks",watch:"Canvas strap watch",occasion:"Summer outdoor, garden, casual dining",archetype:"Continental",confidence:4,tip:"Olive and navy linen is earthy and coastal simultaneously — the easy summer look.",shirtColor:"#C5D8E8",tieColor:"#556B2F"},
      {name:"The White Linen",suit:"Navy Linen",shirt:"Crisp White Linen",tie:"Solid White Linen Tie",pocketSquare:"White Linen — Casual Puff",shoes:"White Canvas Shoes",belt:"None",socks:"No socks",watch:"Simple watch",occasion:"Formal summer events, weddings, garden parties",archetype:"Italian",confidence:5,tip:"All white and navy linen — a masterpiece of summer restraint. Only for those who can hold it.",shirtColor:"#F8F8F8",tieColor:"#F8F8F8"},
    ],
    styleMantra:"Navy linen is summer authority — it commands presence while appearing to make no effort at all."
  },

  // ═══════════════════════════════════════════════════════
  // CHARCOAL
  // ═══════════════════════════════════════════════════════

  "charcoal|solid": {
    suit:{colorFamily:"Charcoal Grey",undertones:"Cool blue-grey undertones",fabric:"Worsted wool, ~260 g/m²",pattern:"Solid",formality:"Business Formal",lapel:"Notch lapel",fit:"Classic fit"},
    shirts:[
      {id:1,name:"Crisp White Poplin",colorCode:"#F8F8F8",why:"White against charcoal is clean authority — the combination that closes deals.",collar:"Spread collar",pattern:"Solid",pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"},ties:[
        {id:1,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Burgundy and charcoal is the definitive boardroom combination."},
        {id:2,name:"Navy Repp Stripe",color:"#1B3A6B",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"The navy stripe adds structure — ideal for banking and law."},
        {id:3,name:"Forest Green Foulard",color:"#355E3B",pattern:"Foulard",material:"Matte Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Green adds quiet distinction against charcoal and white."},
        {id:4,name:"Silver Polka Dot",color:"#A9A9A9",pattern:"Polka Dot",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Silver-on-charcoal is restrained elegance at its finest."},
        {id:5,name:"Deep Teal Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal adds a modern edge to classic charcoal — smart and confident."},
        {id:6,name:"Mustard Yellow Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Yellow against charcoal and white is a sunny, confident statement."},
      ]},
      {id:2,name:"Pale French Blue",colorCode:"#89B4D4",why:"Blue softens charcoal's severity while keeping the professionalism fully intact.",collar:"Semi-spread collar",pattern:"End-on-End weave",pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"},ties:[
        {id:1,name:"Terracotta Repp Stripe",color:"#CB6D51",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta-blue against charcoal is the most naturally elegant combination in menswear."},
        {id:2,name:"Burgundy Micro-Paisley",color:"#722F37",pattern:"Micro-Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Burgundy warmth cuts through the cool register with elegant energy."},
        {id:3,name:"Navy Grenadine",color:"#191970",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Monochromatic",why:"Tone-on-tone blue with charcoal is depth and sophistication in its purest form."},
        {id:4,name:"Olive Geometric",color:"#808000",pattern:"Geometric",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive-gold adds Italian flair — a warm accent in a cool blue-grey ensemble."},
        {id:5,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Kelvin",harmony:"Monochromatic",why:"Pure tonal sophistication — for the man who lets his tailoring speak."},
        {id:6,name:"Silver & White Stripe",color:"#C0C0C0",pattern:"Stripe",material:"Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Analogous",why:"Crisp precision — ideal for high-stakes environments."},
      ]},
      {id:3,name:"Pale Pink Bengal Stripe",colorCode:"#F4B8C1",why:"Warm rose against charcoal adds confident personality without sacrificing authority.",collar:"Button-down collar",pattern:"Bengal Stripe (pink/white)",pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"},ties:[
        {id:1,name:"Navy Polka Dot",color:"#1B3A6B",pattern:"Polka Dot",material:"Silk Twill",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Deep navy anchors the pink while the dot adds playful precision."},
        {id:2,name:"Charcoal Repp Stripe",color:"#36454F",pattern:"Repp Stripe",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Cool charcoal calms the warmth of pink — an understated power move."},
        {id:3,name:"Deep Teal Solid",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal-pink is unexpectedly elegant — cool and warm tones in balance."},
        {id:4,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel echoes the warmth of pink — relaxed sophistication."},
        {id:5,name:"Forest Green Club Tie",color:"#355E3B",pattern:"Club (crests)",material:"Wool-Silk Blend",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green, pink, and charcoal is timelessly preppy."},
        {id:6,name:"Maroon Paisley",color:"#800020",pattern:"Paisley",material:"Silk Twill",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Maroon grounds the pink in an elegant, Old World manner."},
      ]},
    ],
    packages:[
      {name:"The City Banker",suit:"Charcoal Solid",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black leather",socks:"Dark grey over-the-calf",watch:"Silver dress watch",occasion:"Board meeting, legal, finance",archetype:"British Classic",confidence:2,tip:"White + burgundy + charcoal is the holy trinity of boardroom dressing.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Continental",suit:"Charcoal Solid",shirt:"Pale French Blue",tie:"Terracotta Repp Stripe",pocketSquare:"Ivory Cotton — One Point",shoes:"Dark Brown Derbies",belt:"Dark cognac",socks:"Burgundy shadow stripe",watch:"Gold-case dress watch",occasion:"Senior leadership, diplomatic dinner",archetype:"Italian",confidence:4,tip:"Brown shoes with charcoal — only the truly confident make this move.",shirtColor:"#89B4D4",tieColor:"#CB6D51"},
      {name:"The Modern Executive",suit:"Charcoal Solid",shirt:"Pale French Blue",tie:"Charcoal Grenadine",pocketSquare:"White Cotton — TV Fold",shoes:"Black Oxfords",belt:"Black leather",socks:"Navy ribbed",watch:"Silver dress watch",occasion:"City meetings, presentations",archetype:"Continental",confidence:1,tip:"Tonal dressing lives or dies by the quality of the tailoring.",shirtColor:"#89B4D4",tieColor:"#36454F"},
      {name:"The Weekend Powerbroker",suit:"Charcoal Solid",shirt:"Soft Pink Bengal Stripe",tie:"Deep Teal Solid",pocketSquare:"Pink Silk — Puff Fold",shoes:"Tan Suede Monk Strap",belt:"Tan suede",socks:"Teal or grey",watch:"Sport-dress watch",occasion:"Business casual Friday, client lunch",archetype:"Preppy",confidence:4,tip:"The knit tie softens charcoal's formality without losing authority.",shirtColor:"#F4B8C1",tieColor:"#008080"},
      {name:"The Understated Maverick",suit:"Charcoal Solid",shirt:"Crisp White Poplin",tie:"Forest Green Foulard",pocketSquare:"Green Silk — Two Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Forest green",watch:"Dress watch, dark strap",occasion:"Creative business, brand events",archetype:"Avant-Garde",confidence:4,tip:"The foulard's small pattern prevents a clash with the solid charcoal.",shirtColor:"#F8F8F8",tieColor:"#355E3B"},
      {name:"The Golden Standard",suit:"Charcoal Solid",shirt:"Crisp White Poplin",tie:"Mustard Yellow Knit",pocketSquare:"Gold Silk — Puff Fold",shoes:"Brown Oxford Brogues",belt:"Brown leather",socks:"Mustard or dark grey",watch:"Gold-case dress watch",occasion:"Creative leadership, gallery, lunch",archetype:"Continental",confidence:5,tip:"Mustard yellow on charcoal is a bold, sunny statement — own it fully.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
    ],
    styleMantra:"Solid charcoal is the great equaliser — it makes every man look serious, and serious men look powerful."
  },

  "charcoal|chalk_stripe": {
    suit:{colorFamily:"Charcoal Chalk Stripe",undertones:"Deep grey with vertical chalk rhythm",fabric:"Wool twill, ~270 g/m²",pattern:"Chalk Stripe",formality:"Business Formal",lapel:"Notch lapel",fit:"Slim or classic fit"},
    shirts:[
      {id:1,name:"Crisp White Poplin",colorCode:"#F8F8F8",why:"White on charcoal chalk stripe is maximum contrast — the stripe reads at its clearest.",collar:"Spread collar",pattern:"Solid",pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"},ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Burgundy on charcoal chalk stripe is the ultimate power suit combination."},
        {id:2,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Navy anchors the cool charcoal palette with quiet, institutional authority."},
        {id:3,name:"Solid Silver",color:"#C0C0C0",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Silver on chalk stripe charcoal — the grey mirrors the stripe itself."},
        {id:4,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Green adds earthy distinction to the cool charcoal stripe palette."},
        {id:5,name:"Solid Teal Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"A knit tie softens the chalk stripe's formality without losing authority."},
        {id:6,name:"Solid Mustard Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard on charcoal chalk stripe is bold and sunny — a surprising authority."},
      ]},
      {id:2,name:"Pale French Blue",colorCode:"#89B4D4",why:"Blue softens the cool charcoal chalk stripe into something more approachable while remaining fully professional.",collar:"Semi-spread collar",pattern:"End-on-End",pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"},ties:[
        {id:1,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Warm terracotta against cool blue on charcoal stripe — an Italian masterclass."},
        {id:2,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Burgundy always anchors the charcoal-blue combination with appropriate authority."},
        {id:3,name:"Solid Olive",color:"#808000",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on pale blue on charcoal chalk stripe — Italian flair in a British suit."},
        {id:4,name:"Solid Charcoal",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Kelvin",harmony:"Monochromatic",why:"Tonal charcoal — let the chalk stripe do the work."},
        {id:5,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Deep navy anchors pale blue and charcoal stripe into cohesive depth."},
        {id:6,name:"Solid Mustard",color:"#C9A84C",pattern:"Solid",material:"Silk",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"Mustard brings warmth into the cool charcoal blue palette — a confident accent."},
      ]},
      {id:3,name:"Pale Pink Bengal Stripe",colorCode:"#F4B8C1",why:"Pink on charcoal chalk stripe — the bold personality move. Stripe on stripe, scale differential essential.",collar:"Button-down collar",pattern:"Bengal Stripe",pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"},ties:[
        {id:1,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Navy solid is essential when two stripe patterns are in play — one solid, always."},
        {id:2,name:"Solid Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal charcoal knit quiets the stripe-on-stripe with textural restraint."},
        {id:3,name:"Solid Deep Teal",color:"#008080",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal cools the warm pink, creating unexpected balance on the chalk stripe."},
        {id:4,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy grounds the pink in Old World authority on a modern chalk stripe suit."},
        {id:5,name:"Solid Olive",color:"#556B2F",pattern:"Solid",material:"Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Olive on pink on chalk stripe charcoal — an avant-garde take on the classic."},
        {id:6,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel warmth balances the cool charcoal stripe and warm pink in a satisfying triangle."},
      ]},
    ],
    packages:[
      {name:"The Power Stripe",suit:"Charcoal Chalk Stripe",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black leather",socks:"Dark grey",watch:"Silver dress watch",occasion:"Board meetings, closing deals, formal authority",archetype:"British Classic",confidence:2,tip:"Charcoal chalk stripe with burgundy grenadine is the most commanding suit combination in existence.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The City Italian",suit:"Charcoal Chalk Stripe",shirt:"Pale French Blue",tie:"Solid Terracotta",pocketSquare:"Ivory Cotton — One Point",shoes:"Dark Brown Brogues",belt:"Dark cognac",socks:"Burgundy",watch:"Gold dress watch",occasion:"Client dinner, senior leadership",archetype:"Italian",confidence:4,tip:"Terracotta on blue on charcoal stripe — warm, cool, structured. The Italian trifecta.",shirtColor:"#89B4D4",tieColor:"#CB6D51"},
      {name:"The Tonal Master",suit:"Charcoal Chalk Stripe",shirt:"Pale French Blue",tie:"Solid Charcoal",pocketSquare:"White Cotton — One Point",shoes:"Black Oxfords",belt:"Black leather",socks:"Charcoal",watch:"Silver dress watch",occasion:"Formal, government, senior presentations",archetype:"Continental",confidence:1,tip:"Monochromatic charcoal and blue — the stripe is the only decoration. Flawless tailoring required.",shirtColor:"#89B4D4",tieColor:"#36454F"},
      {name:"The Sunny Authority",suit:"Charcoal Chalk Stripe",shirt:"Crisp White Poplin",tie:"Solid Mustard Knit",pocketSquare:"Gold Silk — Puff Fold",shoes:"Brown Oxford Brogues",belt:"Brown leather",socks:"Mustard or dark grey",watch:"Gold dress watch",occasion:"Creative leadership, gallery, client lunch",archetype:"Avant-Garde",confidence:5,tip:"Mustard on chalk stripe charcoal — the bold choice that announces confidence before you speak.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Pink Stripe Move",suit:"Charcoal Chalk Stripe",shirt:"Pale Pink Bengal",tie:"Solid Navy",pocketSquare:"Pink Silk — Puff Fold",shoes:"Tan Monk Strap",belt:"Tan leather",socks:"Navy or grey",watch:"Sport-dress watch",occasion:"Smart casual, client lunch, business casual",archetype:"Preppy",confidence:4,tip:"Three patterns require three different scales: wide chalk stripe, medium bengal, zero-pattern tie.",shirtColor:"#F4B8C1",tieColor:"#1B3A6B"},
      {name:"The Forest Authority",suit:"Charcoal Chalk Stripe",shirt:"Crisp White Poplin",tie:"Solid Forest Green",pocketSquare:"Green Silk — Two Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Forest green or dark grey",watch:"Silver dress watch",occasion:"Creative business, brand, editorial",archetype:"British",confidence:4,tip:"Forest green on white on charcoal chalk stripe — quiet distinction with authority.",shirtColor:"#F8F8F8",tieColor:"#355E3B"},
    ],
    styleMantra:"Charcoal chalk stripe is power in a suit — every stripe a declaration of deliberate authority."
  },

  "charcoal|glen_plaid": {
    suit:{colorFamily:"Charcoal Glen Plaid",undertones:"Cool grey with woven check pattern",fabric:"Wool blend, ~250 g/m²",pattern:"Glen Plaid / Windowpane",formality:"Business Casual / Smart Formal",lapel:"Notch lapel",fit:"Classic fit"},
    shirts:[
      {id:1,name:"Crisp White Poplin",colorCode:"#F8F8F8",why:"White provides the clearest canvas for charcoal glen plaid to express itself fully.",collar:"Spread collar",pattern:"Solid",pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"},ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Solid ties are mandatory with glen plaid. Burgundy is always the authority choice."},
        {id:2,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Navy solid anchors the cool charcoal plaid with confident depth."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit on charcoal glen plaid — country club elegance."},
        {id:4,name:"Solid Silver",color:"#C0C0C0",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Silver matches the cool grey tones of the plaid — quietly refined."},
        {id:5,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive knit on charcoal plaid — earthy, considered, English in spirit."},
        {id:6,name:"Solid Teal",color:"#008080",pattern:"Solid",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal adds a modern jewel tone to the traditional charcoal plaid."},
      ]},
      {id:2,name:"Pale Blue Chambray",colorCode:"#89B4D4",why:"Chambray's texture complements the woven complexity of glen plaid naturally.",collar:"Button-down collar",pattern:"Chambray",pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"},ties:[
        {id:1,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Knit on chambray on charcoal plaid — three textures, one solid colour. Masterful."},
        {id:2,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel against cool blue and charcoal plaid — a relaxed authority."},
        {id:3,name:"Solid Dark Green",color:"#2E5941",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Dark green on blue on charcoal plaid is the English country palette."},
        {id:4,name:"Solid Mustard Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard pops against the blue-charcoal plaid with sunny energy."},
        {id:5,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Tonal blue-on-blue with charcoal plaid — quietly sophisticated."},
        {id:6,name:"Solid Charcoal",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal charcoal — the plaid does the work, the tie simply completes."},
      ]},
      {id:3,name:"White Oxford Cloth",colorCode:"#F5F5F0",why:"Oxford's subtle weave adds texture without competing with the plaid's complex pattern.",collar:"Button-down collar",pattern:"Oxford weave",pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"},ties:[
        {id:1,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive and charcoal glen plaid — the English country house in two colours."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit on oxford cloth on charcoal plaid — relaxed authority."},
        {id:3,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"The timeless burgundy anchor for any charcoal suit."},
        {id:4,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Dark brown knit on charcoal plaid — old money ease."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green on charcoal plaid — distinguished and country in spirit."},
        {id:6,name:"Solid Silver",color:"#C0C0C0",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Silver on charcoal plaid — cool and quietly refined."},
      ]},
    ],
    packages:[
      {name:"The Charcoal Plaid Power",suit:"Charcoal Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Dark grey",watch:"Silver dress watch",occasion:"Business formal, boardroom",archetype:"British Classic",confidence:3,tip:"Keep ties solid with glen plaid — the pattern is already working hard enough.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Country Banker",suit:"Charcoal Glen Plaid",shirt:"White Oxford Cloth",tie:"Solid Camel Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Derby Brogues",belt:"Dark brown",socks:"Camel or grey",watch:"Gold-case dress watch",occasion:"Client lunch, country, smart casual",archetype:"Country",confidence:4,tip:"Oxford cloth and camel knit make charcoal plaid feel earned and effortless.",shirtColor:"#F5F5F0",tieColor:"#C19A6B"},
      {name:"The Continental Plaid",suit:"Charcoal Glen Plaid",shirt:"Pale Blue Chambray",tie:"Solid Burgundy Knit",pocketSquare:"White Cotton — One Point",shoes:"Dark Brown Derbies",belt:"Dark cognac",socks:"Burgundy",watch:"Gold dress watch",occasion:"Creative business, client meetings",archetype:"Italian",confidence:4,tip:"Chambray and burgundy knit on charcoal plaid — Italian warmth in a British pattern.",shirtColor:"#89B4D4",tieColor:"#722F37"},
      {name:"The English Autumn",suit:"Charcoal Glen Plaid",shirt:"White Oxford Cloth",tie:"Solid Olive Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Olive or khaki",watch:"Leather watch",occasion:"Country events, autumn smart casual",archetype:"Country",confidence:4,tip:"Olive and charcoal glen plaid is the English countryside in a suit.",shirtColor:"#F5F5F0",tieColor:"#556B2F"},
      {name:"The Mustard Plaid",suit:"Charcoal Glen Plaid",shirt:"Pale Blue Chambray",tie:"Solid Mustard Knit",pocketSquare:"Gold Silk — Puff Fold",shoes:"Tan Monk Strap",belt:"Tan leather",socks:"Mustard or grey",watch:"Sport dress watch",occasion:"Creative, gallery, business casual",archetype:"Avant-Garde",confidence:5,tip:"Mustard on chambray on charcoal plaid — sunny and deliberate.",shirtColor:"#89B4D4",tieColor:"#C9A84C"},
      {name:"The Silent Authority",suit:"Charcoal Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Navy",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxfords",belt:"Black leather",socks:"Navy",watch:"Silver dress watch",occasion:"Formal meetings, government, senior roles",archetype:"British",confidence:2,tip:"Navy solid on white on charcoal plaid — the most restrained and authoritative read.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Charcoal glen plaid is authority with character — the suit of a man who reads books and closes deals."
  },

  "charcoal|herringbone": {
    suit:{colorFamily:"Charcoal Herringbone",undertones:"Cool grey with V-weave depth",fabric:"Wool herringbone, ~270 g/m²",pattern:"Herringbone",formality:"Business Formal",lapel:"Notch lapel",fit:"Classic fit"},
    shirts:[
      {id:1,name:"Crisp White Poplin",colorCode:"#F8F8F8",why:"White against charcoal herringbone gives maximum clarity to the weave's V-pattern.",collar:"Spread collar",pattern:"Solid",pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"},ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The grenadine's texture harmonises with herringbone's own weave — a refined textural dialogue."},
        {id:2,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Navy on charcoal herringbone — cool, deep, and quietly commanding."},
        {id:3,name:"Solid Silver Grenadine",color:"#C0C0C0",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Half Windsor",harmony:"Analogous",why:"Silver on charcoal herringbone is tonal refinement at its peak."},
        {id:4,name:"Solid Dark Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:'3"',knot:"Pratt/Shelby",harmony:"Triadic",why:"Forest green adds quiet distinction to the cool charcoal herringbone palette."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Wool knit on herringbone wool — textural poetry in charcoal and wine."},
        {id:6,name:"Solid Teal Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal adds a modern jewel note to the classic charcoal herringbone."},
      ]},
      {id:2,name:"Pale Blue End-on-End",colorCode:"#89B4D4",why:"End-on-end's textural quality creates a rich dialogue with herringbone without pattern conflict.",collar:"Semi-spread collar",pattern:"End-on-End",pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"},ties:[
        {id:1,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Warm terracotta against cool blue and charcoal herringbone — an Italian sensibility."},
        {id:2,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:'3"',knot:"Half Windsor",harmony:"Complementary",why:"The timeless authority anchor for charcoal herringbone."},
        {id:3,name:"Solid Dark Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Wool-on-herringbone-wool — a textural study in earthy refinement."},
        {id:4,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:'3"',knot:"Kelvin",harmony:"Monochromatic",why:"Tonal charcoal — pure sophistication through texture alone."},
        {id:5,name:"Solid Mustard",color:"#C9A84C",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard brings warm sunlight into the cool charcoal herringbone."},
        {id:6,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit on blue on charcoal herringbone — warm tones against cool weave."},
      ]},
      {id:3,name:"White Oxford Cloth",colorCode:"#F5F5F0",why:"Oxford's basket weave adds a secondary texture layer that enriches the herringbone story.",collar:"Button-down collar",pattern:"Oxford weave",pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"},ties:[
        {id:1,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on charcoal herringbone — the English country tradition in city form."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel warmth on charcoal herringbone — a textural feast."},
        {id:3,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Dark brown knit is the most natural country companion to charcoal herringbone."},
        {id:4,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy anchors the charcoal herringbone with Old World authority."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green on oxford on charcoal herringbone — English through and through."},
        {id:6,name:"Solid Silver",color:"#C0C0C0",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Analogous",why:"Silver silk on charcoal herringbone — cool precision."},
      ]},
    ],
    packages:[
      {name:"The Herringbone Authority",suit:"Charcoal Herringbone",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black leather",socks:"Dark grey",watch:"Silver dress watch",occasion:"Formal business, boardroom",archetype:"British Classic",confidence:2,tip:"The herringbone weave is the decoration — keep everything else impeccably plain.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Texture Master",suit:"Charcoal Herringbone",shirt:"Pale Blue End-on-End",tie:"Solid Dark Green Knit",pocketSquare:"White Cotton — One Point",shoes:"Dark Brown Derby",belt:"Dark brown",socks:"Green or navy",watch:"Gold dress watch",occasion:"Client dinners, creative business",archetype:"Italian",confidence:4,tip:"Herringbone, end-on-end, wool knit — three textures, one colour each. The masterclass.",shirtColor:"#89B4D4",tieColor:"#355E3B"},
      {name:"The Country Squire",suit:"Charcoal Herringbone",shirt:"White Oxford Cloth",tie:"Solid Camel Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Camel or brown",watch:"Leather watch",occasion:"Country events, smart casual, weekend",archetype:"Country",confidence:4,tip:"Oxford and camel knit give the charcoal herringbone its country character.",shirtColor:"#F5F5F0",tieColor:"#C19A6B"},
      {name:"The Tonal Charcoal",suit:"Charcoal Herringbone",shirt:"Pale Blue End-on-End",tie:"Solid Charcoal Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver dress watch",occasion:"Formal, presentations",archetype:"Continental",confidence:1,tip:"Monochromatic charcoal — the weave is the only ornament. Tailoring must be flawless.",shirtColor:"#89B4D4",tieColor:"#36454F"},
      {name:"The English Autumn",suit:"Charcoal Herringbone",shirt:"White Oxford Cloth",tie:"Solid Olive Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Brogues",belt:"Tan leather",socks:"Olive or grey",watch:"Casual watch",occasion:"Country, autumn events",archetype:"British",confidence:4,tip:"Olive on charcoal herringbone is the autumn English countryside — deeply natural.",shirtColor:"#F5F5F0",tieColor:"#556B2F"},
      {name:"The Warm Contrast",suit:"Charcoal Herringbone",shirt:"Pale Blue End-on-End",tie:"Solid Mustard",pocketSquare:"Gold Silk — Puff Fold",shoes:"Brown Oxford",belt:"Brown leather",socks:"Mustard or grey",watch:"Gold dress watch",occasion:"Creative leadership, gallery",archetype:"Avant-Garde",confidence:5,tip:"Mustard on blue on charcoal herringbone — warm against cool against textured. Perfectly calibrated.",shirtColor:"#89B4D4",tieColor:"#C9A84C"},
    ],
    styleMantra:"Charcoal herringbone is the suit of a man who understands that texture is a language."
  },

  "charcoal|tweed": {
    suit:{colorFamily:"Charcoal Tweed",undertones:"Deep grey with multi-tone fleck",fabric:"Harris Tweed / Donegal, ~380 g/m²",pattern:"Tweed",formality:"Smart Casual / Business Casual",lapel:"Notch lapel",fit:"Classic fit"},
    shirts:[
      {id:1,name:"White Oxford Cloth",colorCode:"#F5F5F0",why:"Oxford cloth is the natural partner of tweed — both have texture, both have character.",collar:"Button-down collar",pattern:"Oxford weave",pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"},ties:[
        {id:1,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit and charcoal tweed is the English country gentleman uniform."},
        {id:2,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive picks out the earthy flecks of charcoal tweed — entirely natural."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy warms the cool charcoal tweed — knit is the only correct choice."},
        {id:4,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Brown and tweed are inseparable — earthy, classic, quintessentially English."},
        {id:5,name:"Solid Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green on charcoal tweed — the moorland brought to town."},
        {id:6,name:"Solid Mustard Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard warms the cool charcoal tweed with a sunny, confident note."},
      ]},
      {id:2,name:"Pale Blue Chambray",colorCode:"#89B4D4",why:"Chambray and tweed share the same relaxed, tactile spirit.",collar:"Button-down collar",pattern:"Chambray",pocketSquare:{name:"Ivory Cotton",fold:"Casual Puff",material:"Cotton"},ties:[
        {id:1,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel on chambray on charcoal tweed — warm, relaxed, deliberate."},
        {id:2,name:"Solid Olive",color:"#556B2F",pattern:"Solid",material:"Silk",width:'3"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive silk on chambray blue — a touch of town elegance on a country fabric."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy warms chambray and charcoal tweed into something rich and deliberate."},
        {id:4,name:"Solid Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green on chambray on charcoal tweed — the full natural palette."},
        {id:5,name:"Solid Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Rust orange and charcoal tweed — the autumn palette in concentrated form."},
        {id:6,name:"No Tie",color:"#F8F8F8",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Chambray and charcoal tweed without a tie — a pocket square completes it."},
      ]},
      {id:3,name:"Cream Ecru Poplin",colorCode:"#F5F0E8",why:"Warm cream softens charcoal tweed into something deeply autumnal and considered.",collar:"Semi-spread collar",pattern:"Solid",pocketSquare:{name:"Cream Silk",fold:"Puff Fold",material:"Silk"},ties:[
        {id:1,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Brown on cream on charcoal tweed — the English country estate palette."},
        {id:2,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on cream is autumnal richness that tweed was made to carry."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy on cream on charcoal tweed — warm, rich, deeply autumnal."},
        {id:4,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel on cream — tonal warmth against the cool charcoal tweed."},
        {id:5,name:"No Tie",color:"#C19A6B",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Cream shirt, charcoal tweed, no tie — a leather pocket square and you are done."},
        {id:6,name:"Solid Mustard Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Mustard on cream on charcoal tweed — the autumnal harvest palette."},
      ]},
    ],
    packages:[
      {name:"The Charcoal Country",suit:"Charcoal Tweed",shirt:"White Oxford Cloth",tie:"Solid Camel Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Camel or brown",watch:"Leather watch",occasion:"Country events, weekends, smart casual",archetype:"Country",confidence:4,tip:"Charcoal tweed demands natural companions — knit ties, suede shoes, nothing too sharp.",shirtColor:"#F5F5F0",tieColor:"#C19A6B"},
      {name:"The Autumn Editor",suit:"Charcoal Tweed",shirt:"Pale Blue Chambray",tie:"Solid Rust Knit",pocketSquare:"Ivory Cotton — Casual Puff",shoes:"Tan Derby Brogues",belt:"Tan leather",socks:"Rust or grey",watch:"Casual watch",occasion:"Creative sector, gallery, weekend smart",archetype:"Avant-Garde",confidence:5,tip:"Rust on chambray on charcoal tweed — the complete autumn palette.",shirtColor:"#89B4D4",tieColor:"#B7410E"},
      {name:"The Estate Charcoal",suit:"Charcoal Tweed",shirt:"Cream Ecru Poplin",tie:"Solid Dark Brown Knit",pocketSquare:"Cream Silk — Puff Fold",shoes:"Dark Brown Oxford",belt:"Dark brown",socks:"Brown or olive",watch:"Gold leather watch",occasion:"Country house, smart casual, autumn",archetype:"Country",confidence:3,tip:"Cream and brown on charcoal tweed is the English country estate — no effort required.",shirtColor:"#F5F0E8",tieColor:"#5C3317"},
      {name:"The Olive Country",suit:"Charcoal Tweed",shirt:"White Oxford Cloth",tie:"Solid Olive Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Olive Suede Derby",belt:"Dark brown",socks:"Olive or grey",watch:"Casual watch",occasion:"Country, outdoor smart",archetype:"British",confidence:4,tip:"Olive and charcoal tweed — the moorland in two colours.",shirtColor:"#F5F5F0",tieColor:"#556B2F"},
      {name:"The No-Tie Charcoal",suit:"Charcoal Tweed",shirt:"Pale Blue Chambray",tie:"No Tie",pocketSquare:"Ivory Cotton — Casual Puff",shoes:"Brown Suede Loafers",belt:"Brown suede",socks:"Grey or navy",watch:"Casual watch",occasion:"Smart casual, weekend, creative",archetype:"Continental",confidence:4,tip:"Charcoal tweed without a tie is not casual — it is the correct register for the right occasion.",shirtColor:"#89B4D4",tieColor:"#89B4D4"},
      {name:"The Burgundy Autumn",suit:"Charcoal Tweed",shirt:"Cream Ecru Poplin",tie:"Solid Burgundy Knit",pocketSquare:"Cream Silk — Puff Fold",shoes:"Dark Brown Derby",belt:"Dark brown",socks:"Burgundy or grey",watch:"Rose-gold casual watch",occasion:"Autumn dinner, gallery, country events",archetype:"Italian",confidence:4,tip:"Burgundy on cream on charcoal tweed — the richest autumn combination.",shirtColor:"#F5F0E8",tieColor:"#722F37"},
    ],
    styleMantra:"Charcoal tweed belongs to the countryside but moves through cities like it owns them."
  },

  "charcoal|linen": {
    suit:{colorFamily:"Charcoal Linen",undertones:"Cool grey with natural linen drape",fabric:"100% Linen or Linen blend",pattern:"Solid / Subtle texture",formality:"Smart Casual / Summer Formal",lapel:"Notch lapel",fit:"Relaxed fit"},
    shirts:[
      {id:1,name:"Crisp White Linen",colorCode:"#F8F8F8",why:"White linen on charcoal linen — cool, natural, summer-refined.",collar:"Spread or camp collar",pattern:"Solid",pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"},ties:[
        {id:1,name:"No Tie",color:"#F8F8F8",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Charcoal linen without a tie is the definitive warm-weather move."},
        {id:2,name:"Solid Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Navy knit anchors charcoal linen with authority appropriate for summer business."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel against cool charcoal linen — summer's version of the classic contrast."},
        {id:4,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Cotton-Silk Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy and charcoal linen — the summer boardroom combination."},
        {id:5,name:"Solid Teal Knit",color:"#008080",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Teal on white on charcoal linen — a cool jewel tone for summer authority."},
        {id:6,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Cotton-Silk",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against charcoal linen — warm Mediterranean energy."},
      ]},
      {id:2,name:"Pale Blue Voile",colorCode:"#C5D8E8",why:"Voile's lightness matches linen's summer drape — cool blue on cool charcoal.",collar:"Camp collar",pattern:"Solid",pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"},ties:[
        {id:1,name:"No Tie",color:"#F8F8F8",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Pale blue voile and charcoal linen, no tie — the summer Riviera look."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Camel warmth against the cool charcoal-blue linen palette."},
        {id:3,name:"Solid Terracotta Knit",color:"#CB6D51",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta on pale blue on charcoal linen — warm-cool Mediterranean balance."},
        {id:4,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on pale blue on charcoal linen — earthy summer combination."},
        {id:5,name:"Solid White Cotton Knit",color:"#F8F8F8",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"White knit on pale blue on charcoal linen — cool summer tonal mastery."},
        {id:6,name:"Solid Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Navy anchors pale blue and charcoal linen with summer authority."},
      ]},
      {id:3,name:"Cream Linen",colorCode:"#FAF0E6",why:"Warm cream softens charcoal linen into something deeply natural and considered.",collar:"Open collar",pattern:"Solid",pocketSquare:{name:"Cream Linen",fold:"Casual Puff",material:"Linen"},ties:[
        {id:1,name:"No Tie",color:"#FAF0E6",pattern:"None",material:"N/A",width:"N/A",knot:"None",harmony:"N/A",why:"Cream linen and charcoal linen open-collar — the perfect summer ease."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel on warm cream on cool charcoal linen — natural warmth."},
        {id:3,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Cotton-Silk",width:'2.5"',knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta and cream on charcoal linen — the Mediterranean summer palette."},
        {id:4,name:"Solid Olive",color:"#556B2F",pattern:"Solid",material:"Cotton",width:'2.5"',knot:"Four-in-Hand",harmony:"Triadic",why:"Olive on cream on charcoal linen — natural, earthy, thoroughly considered."},
        {id:5,name:"Solid Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Cotton Knit",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Navy provides cool authority to the warm cream-charcoal linen palette."},
        {id:6,name:"Solid Dark Brown",color:"#5C3317",pattern:"Solid",material:"Cotton",width:'2.5"',knot:"Four-in-Hand",harmony:"Analogous",why:"Dark brown on cream on charcoal linen — earthy, warm, natural."},
      ]},
    ],
    packages:[
      {name:"The Summer Authority",suit:"Charcoal Linen",shirt:"Crisp White Linen",tie:"Solid Navy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Loafers",belt:"Brown suede",socks:"Navy or no socks",watch:"Casual dress watch",occasion:"Summer business casual, client lunch",archetype:"Italian",confidence:3,tip:"A navy knit tie signals mastery of summer dressing — sharp without being stiff.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Riviera Charcoal",suit:"Charcoal Linen",shirt:"Pale Blue Voile",tie:"No Tie",pocketSquare:"White Linen — Casual Puff",shoes:"White Canvas Loafers",belt:"None",socks:"No socks",watch:"Simple summer watch",occasion:"Summer parties, coastal, outdoor",archetype:"Continental",confidence:5,tip:"No tie, no socks — charcoal linen needs nothing more than confidence.",shirtColor:"#C5D8E8",tieColor:"#C5D8E8"},
      {name:"The Cream Summer",suit:"Charcoal Linen",shirt:"Cream Linen",tie:"No Tie",pocketSquare:"Cream Linen — Casual Puff",shoes:"Tan Leather Loafers",belt:"Tan leather",socks:"No socks",watch:"Casual watch",occasion:"Garden parties, outdoor summer events",archetype:"Country",confidence:4,tip:"All linen, open collar — the summer gentleman requires nothing more.",shirtColor:"#FAF0E6",tieColor:"#FAF0E6"},
      {name:"The Terracotta Summer",suit:"Charcoal Linen",shirt:"Crisp White Linen",tie:"Solid Terracotta",pocketSquare:"Terracotta Silk — Puff Fold",shoes:"Tan Derby",belt:"Tan leather",socks:"Terracotta or grey",watch:"Casual sport watch",occasion:"Summer creative events, gallery",archetype:"Avant-Garde",confidence:4,tip:"Terracotta against charcoal linen is the Mediterranean — warm, vibrant, summer.",shirtColor:"#F8F8F8",tieColor:"#CB6D51"},
      {name:"The Olive Summer",suit:"Charcoal Linen",shirt:"Pale Blue Voile",tie:"Solid Olive Knit",pocketSquare:"Ivory Cotton — Puff Fold",shoes:"Tan Suede Loafers",belt:"Tan suede",socks:"Olive or no socks",watch:"Canvas watch",occasion:"Summer outdoor, casual dining",archetype:"Continental",confidence:4,tip:"Olive and charcoal linen is earthy and coastal — the easy summer look.",shirtColor:"#C5D8E8",tieColor:"#556B2F"},
      {name:"The Burgundy Summer",suit:"Charcoal Linen",shirt:"Crisp White Linen",tie:"Solid Burgundy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Dark Brown Loafers",belt:"Dark brown",socks:"Burgundy or grey",watch:"Dress watch",occasion:"Summer business, client lunch",archetype:"British",confidence:3,tip:"Burgundy knit on white on charcoal linen — summer authority with natural warmth.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
    ],
    styleMantra:"Charcoal linen is the cool authority of summer — effortless weight in the warmest months."
  },


  "green|solid": {
    suit: { colorFamily:"Olive Green", undertones:"Warm earthy, golden undertones", fabric:"Wool twill, ~240 g/m2", pattern:"Solid", formality:"Business Casual", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White delivers maximum contrast against olive — clean authority that keeps the unusual colour grounded.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Burgundy Grenadine Solid",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy is the most powerful complement to olive — warm, authoritative, thoroughly Italian."},
        {id:2,name:"Burnt Orange Foulard",color:"#CC5500",pattern:"Foulard",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Orange and olive share the same warm spectrum — the Italian summer editorial move."},
        {id:3,name:"Navy Grenadine Solid",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Cool navy against warm olive is sophisticated contrast — grounding without dulling."},
        {id:4,name:"Gold Wool Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold is olive natural ally — tonal warmth with just enough contrast to register."},
        {id:5,name:"Chocolate Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit and olive solid is the English country house look at its most refined."},
        {id:6,name:"Rust Grenadine",color:"#B7410E",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust deepens olive earthy warmth — a very considered colour move."},
      ]},
      { id:2, name:"Ivory Cream End-on-End", colorCode:"#FFFFF0", why:"Warm ivory harmonises with olive golden undertones — tonal combination of rare sophistication.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Dark Brown Grenadine",color:"#5C3317",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Brown and olive and ivory is the palette of the Italian countryside — warm, rooted, impeccable."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy cuts through the warmth with just enough cool authority."},
        {id:3,name:"Camel Solid",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"The ultimate warm palette: olive, ivory, camel — unified by golden undertones."},
        {id:4,name:"Terracotta Stripe",color:"#CB6D51",pattern:"Repp Stripe",material:"Silk Twill",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Terracotta against ivory against olive is Mediterranean elegance distilled."},
        {id:5,name:"Gold Foulard",color:"#C9A84C",pattern:"Foulard",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"The warm trio complete — gold foulard anchors the entire earth-tone palette."},
        {id:6,name:"Forest Green Foulard",color:"#355E3B",pattern:"Foulard",material:"Matte Silk",width:"3in",knot:"Pratt/Shelby",harmony:"Monochromatic",why:"Tonal green-on-green with ivory separation — quiet confidence of the highest order."},
      ]},
      { id:3, name:"Pale Pink Poplin", colorCode:"#F4B8C1", why:"Pink against olive is unexpected but deeply stylish — warm tones that energise each other.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Navy Solid Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Triadic",why:"Navy grounds the pink-olive combination with cool authority."},
        {id:2,name:"Burgundy Solid",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy unifies pink and olive through shared warmth."},
        {id:3,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel bridges pink and olive into a cohesive earth-tone statement."},
        {id:4,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Teal, pink, and olive form a natural triadic palette."},
        {id:5,name:"Brown Foulard",color:"#5C3317",pattern:"Foulard",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Dark brown grounds the softness of pink with masculine authority."},
        {id:6,name:"Maroon Knit",color:"#800020",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Maroon knit against pink and olive is autumnal sophistication."},
      ]},
    ],
    packages:[
      {name:"The Modern Hunter",suit:"Olive Green Solid",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby Brogues",belt:"Dark brown leather",socks:"Burgundy or olive",watch:"Bronze or gold-case watch",occasion:"Business casual, creative industry, client lunch",archetype:"Italian",confidence:4,tip:"Brown shoes are mandatory with olive — black kills the warmth entirely.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Italian Earth",suit:"Olive Green Solid",shirt:"Ivory Cream End-on-End",tie:"Dark Brown Grenadine",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Suede Loafers",belt:"Tan leather",socks:"Camel or ivory",watch:"Gold-case vintage watch",occasion:"Weekend smart, gallery, aperitivo",archetype:"Continental",confidence:5,tip:"Olive and ivory and brown is the colour combination of Italian autumn — entirely deliberate.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Safari Executive",suit:"Olive Green Solid",shirt:"Crisp White Poplin",tie:"Gold Wool Knit",pocketSquare:"White Cotton — Puff Fold",shoes:"Suede Desert Boots",belt:"Tan leather",socks:"Olive or khaki",watch:"Field watch, NATO strap",occasion:"Creative sector, outdoor events, smart casual",archetype:"Adventurer",confidence:4,tip:"The gold knit tie is the finishing note that makes olive feel intentional, not accidental.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Unexpected Authority",suit:"Olive Green Solid",shirt:"Pale Pink Poplin",tie:"Navy Grenadine",pocketSquare:"Pink Silk — Puff Fold",shoes:"Brown Oxford Brogues",belt:"Dark brown leather",socks:"Navy or olive",watch:"Gold-case dress watch",occasion:"Brand events, creative leadership, lunch meetings",archetype:"Avant-Garde",confidence:5,tip:"Pink shirt with olive suit sounds wrong until you try it. Navy tie is the bridge that makes it right.",shirtColor:"#F4B8C1",tieColor:"#1B3A6B"},
      {name:"The Country Weekend",suit:"Olive Green Solid",shirt:"Ivory Cream End-on-End",tie:"Forest Green Foulard",pocketSquare:"Ivory Silk — One Point",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Camel or dark green",watch:"Casual leather-strap watch",occasion:"Weekend, country, smart casual outdoor",archetype:"Country",confidence:4,tip:"Tonal olive with ivory and green foulard is the English country weekend at its most refined.",shirtColor:"#FFFFF0",tieColor:"#355E3B"},
      {name:"The Terracotta Hour",suit:"Olive Green Solid",shirt:"Ivory Cream End-on-End",tie:"Terracotta Stripe",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Monk Strap",belt:"Tan leather",socks:"Terracotta or camel",watch:"Gold sport-dress",occasion:"Lunch, aperitivo, gallery opening",archetype:"Mediterranean",confidence:5,tip:"Terracotta, ivory, and olive is the palette of the Italian Riviera — wear it with quiet confidence.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
    ],
    styleMantra:"Olive is the colour of the man who has nothing to prove — it demands confidence to carry and rewards it with distinction."
  },

  "green|houndstooth": {
    suit: { colorFamily:"Olive Houndstooth", undertones:"Warm earthy with bold geometric check", fabric:"Wool houndstooth, ~280 g/m2", pattern:"Houndstooth", formality:"Business Casual", lapel:"Notch lapel", fit:"Slim or classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"With houndstooth, white is mandatory — the pattern demands the simplest possible foundation.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"A solid tie is the only choice with houndstooth — burgundy is the authority move against olive."},
        {id:2,name:"Solid Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit and olive houndstooth is rooted and deliberate — English country at its most confident."},
        {id:3,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Cool navy provides deliberate contrast against the warm olive check."},
        {id:4,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel completes the warm earth palette — houndstooth, white, camel is classic."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal green on houndstooth — the most considered, most expert choice."},
        {id:6,name:"Solid Rust Grenadine",color:"#B7410E",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust warms the olive houndstooth into a fully autumnal composition."},
      ]},
      { id:2, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against olive houndstooth is warmer than white — elevating the check without competing.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Ivory Linen",fold:"One Point",material:"Linen"}, ties:[
        {id:1,name:"Solid Dark Brown Grenadine",color:"#5C3317",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Brown and ivory against olive houndstooth — the warmest and most complete country palette."},
        {id:2,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit bridges the warmth of ivory and olive with complementary contrast."},
        {id:3,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"The golden palette: olive houndstooth, ivory, camel — three tones in harmony."},
        {id:4,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy is the cool anchor that gives the warm palette its authority."},
        {id:5,name:"Solid Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust and ivory against olive houndstooth — a warm autumnal trio."},
        {id:6,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal olive knit on houndstooth with ivory separation — deeply expert."},
      ]},
      { id:3, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"The temperature contrast of cool blue against warm olive houndstooth is a bold, modern move.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"One Point",material:"Linen"}, ties:[
        {id:1,name:"Solid Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown bridges cool blue and warm olive houndstooth — necessary warmth."},
        {id:2,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Triadic",why:"Burgundy is the bridge between cool blue and warm olive — makes the contrast deliberate."},
        {id:3,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Matching the cool register of blue against warm houndstooth — tonal authority."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool blue palette back toward olive territory."},
        {id:5,name:"Solid Rust",color:"#B7410E",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust pops against the blue while anchoring the warm olive houndstooth."},
        {id:6,name:"Solid Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal connects the blue shirt to the suit green register."},
      ]},
    ],
    packages:[
      {name:"The Olive Check Authority",suit:"Olive Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby Brogues",belt:"Dark brown leather",socks:"Burgundy or olive",watch:"Bronze or gold-case watch",occasion:"Business casual, client meetings, creative sector",archetype:"British Classic",confidence:3,tip:"Houndstooth demands solid everything else — the check is the statement. This rule is absolute.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Country Estate",suit:"Olive Houndstooth",shirt:"Ivory Cream Poplin",tie:"Solid Dark Brown Grenadine",pocketSquare:"Ivory Linen — One Point",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Brown or olive",watch:"Leather field watch",occasion:"Country weekend, smart outdoor, estate",archetype:"Country",confidence:5,tip:"Ivory and dark brown on olive houndstooth is the English country house look — timeless.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Golden Houndstooth",suit:"Olive Houndstooth",shirt:"Ivory Cream Poplin",tie:"Solid Camel",pocketSquare:"Ivory Linen — One Point",shoes:"Tan Derby",belt:"Tan leather",socks:"Camel or ivory",watch:"Gold-tone dress watch",occasion:"Business casual, gallery, creative meetings",archetype:"Continental",confidence:4,tip:"The golden palette of olive, ivory, and camel — unified by warm undertones throughout.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The Temperature Contrast",suit:"Olive Houndstooth",shirt:"Pale Blue Poplin",tie:"Solid Brown Knit",pocketSquare:"White Linen — One Point",shoes:"Brown Oxford",belt:"Brown leather",socks:"Navy or olive",watch:"Silver watch",occasion:"Creative business, client lunch, smart casual",archetype:"Avant-Garde",confidence:4,tip:"Blue on olive houndstooth is the unexpected move — brown knit is the anchor that makes it work.",shirtColor:"#89B4D4",tieColor:"#5C3317"},
      {name:"The Autumn Bold",suit:"Olive Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Rust Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Cognac Brogues",belt:"Cognac leather",socks:"Rust or olive",watch:"Bronze-case watch",occasion:"Creative sector, autumn events, gallery",archetype:"Avant-Garde",confidence:4,tip:"Rust on white on olive houndstooth is the autumnal colour statement.",shirtColor:"#F8F8F8",tieColor:"#B7410E"},
      {name:"The Tonal Expert",suit:"Olive Houndstooth",shirt:"Ivory Cream Poplin",tie:"Solid Olive Knit",pocketSquare:"Ivory Linen — One Point",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Olive or khaki",watch:"Bronze or field watch",occasion:"Smart casual, creative, weekend",archetype:"Country",confidence:5,tip:"Tonal olive from houndstooth to knit tie with ivory separation — the monochromatic expert move.",shirtColor:"#FFFFF0",tieColor:"#556B2F"},
    ],
    styleMantra:"Olive houndstooth is the check that means business — geometric, warm, and worn only by those who know exactly what they are doing."
  },

  "navy|houndstooth": {
    suit: { colorFamily:"Navy Houndstooth", undertones:"Cool indigo with geometric check character", fabric:"Wool houndstooth, ~280 g/m2", pattern:"Houndstooth", formality:"Business Casual", lapel:"Notch lapel", fit:"Slim or classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"With houndstooth, white is non-negotiable — the geometric check requires the cleanest foundation.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"The timeless authority combination — navy houndstooth and burgundy. Solid tie is the only rule."},
        {id:2,name:"Solid Gold Grenadine",color:"#C9A84C",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold illuminates the navy check with warm contrast — the confident editorial choice."},
        {id:3,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green completes a sophisticated triadic palette with navy houndstooth."},
        {id:4,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver mirrors the cool undertones of navy houndstooth — restrained and precise."},
        {id:5,name:"Solid Deep Teal Knit",color:"#008080",pattern:"Solid Knit",material:"Wool-Silk Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Teal knit adds tactile richness while complementing the navy check."},
        {id:6,name:"Solid Burnt Orange",color:"#CC5500",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burnt orange against navy houndstooth — striking and completely deliberate."},
      ]},
      { id:2, name:"Pale French Blue End-on-End", colorCode:"#89B4D4", why:"Tonal blue-on-blue deepens the navy houndstooth — a move of real sophistication.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy is the essential warm anchor when suit and shirt are both in the blue register."},
        {id:2,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm terracotta against cool blue-on-blue houndstooth — the most naturally elegant contrast."},
        {id:3,name:"Solid Navy Grenadine",color:"#191970",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Tone-on-tone navy — depth and sophistication in purest form."},
        {id:4,name:"Solid Gold",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool blue-navy palette with authoritative warmth."},
        {id:5,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Kelvin",harmony:"Analogous",why:"Charcoal anchors the blue palette with quiet, modern authority."},
        {id:6,name:"Solid Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green knit adds warmth to the cool blue palette."},
      ]},
      { id:3, name:"Pale Pink Poplin", colorCode:"#F4B8C1", why:"Warm pink against cool navy houndstooth — the confident personality move.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Deep navy anchors the pink while the houndstooth provides the pattern energy."},
        {id:2,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit unifies navy and pink through shared warmth."},
        {id:3,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Green, pink, and navy houndstooth — a sophisticated triadic palette."},
        {id:4,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel bridges pink and navy into a relaxed combination."},
        {id:5,name:"Solid Teal",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Teal-pink is unexpectedly elegant against the geometric navy check."},
        {id:6,name:"Solid Charcoal",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal calms the warmth of pink into understated authority."},
      ]},
    ],
    packages:[
      {name:"The Check Authority",suit:"Navy Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black calf leather",socks:"Dark navy",watch:"Silver dress watch",occasion:"Business formal, client meetings, presentations",archetype:"British Classic",confidence:3,tip:"Navy houndstooth with white and burgundy is peak boardroom authority.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Continental Check",suit:"Navy Houndstooth",shirt:"Pale French Blue",tie:"Solid Terracotta",pocketSquare:"White Cotton — One Point",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy shadow",watch:"Gold-case watch",occasion:"Business casual, client lunch, senior meetings",archetype:"Italian",confidence:4,tip:"Blue-on-blue-on-houndstooth with terracotta — the Italian editorial in one outfit.",shirtColor:"#89B4D4",tieColor:"#CB6D51"},
      {name:"The Bold Check",suit:"Navy Houndstooth",shirt:"Pale Pink Poplin",tie:"Solid Navy Grenadine",pocketSquare:"Pink Silk — Puff Fold",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Navy or pink",watch:"Sport-dress watch",occasion:"Business casual, creative sector, gallery",archetype:"Continental",confidence:4,tip:"Pink on navy houndstooth is the daring move — navy tie keeps it from tipping into chaos.",shirtColor:"#F4B8C1",tieColor:"#1B3A6B"},
      {name:"The Golden Check",suit:"Navy Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Gold Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Oxford",belt:"Dark brown leather",socks:"Navy ribbed",watch:"Gold dress watch",occasion:"City meetings, presentations, business formal",archetype:"Preppy",confidence:3,tip:"Gold on white on navy houndstooth — the warmest version of the classic contrast.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Tonal Navy",suit:"Navy Houndstooth",shirt:"Pale French Blue",tie:"Solid Navy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Navy shadow",watch:"Silver watch",occasion:"Formal meetings, government, senior roles",archetype:"British",confidence:2,tip:"Monochromatic navy on houndstooth — the suit does the visual work.",shirtColor:"#89B4D4",tieColor:"#191970"},
      {name:"The Weekend Check",suit:"Navy Houndstooth",shirt:"Pale Pink Poplin",tie:"Solid Forest Green",pocketSquare:"Pink Silk — Puff Fold",shoes:"Tan Suede Monk Strap",belt:"Tan suede",socks:"Forest green or navy",watch:"Casual watch",occasion:"Smart casual, gallery, weekend smart",archetype:"Avant-Garde",confidence:5,tip:"Green, pink, and navy houndstooth — a triadic palette for the genuinely confident.",shirtColor:"#F4B8C1",tieColor:"#355E3B"},
    ],
    styleMantra:"Navy houndstooth is the check of the man who respects structure — geometric precision worn with the confidence to make it personal."
  },

  "charcoal|houndstooth": {
    suit: { colorFamily:"Charcoal Houndstooth", undertones:"Cool dark grey with architectural check", fabric:"Wool houndstooth, ~300 g/m2", pattern:"Houndstooth", formality:"Business Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against charcoal houndstooth is maximum contrast — clean, sharp, completely authoritative.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy against charcoal houndstooth — warm against cool, solid against geometric."},
        {id:2,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Silver on charcoal houndstooth is monochromatic mastery — the check does the work."},
        {id:3,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Cool navy against cool charcoal — tonal authority of the highest order."},
        {id:4,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm camel against cool charcoal houndstooth — the most elegant temperature contrast."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green provides nature-grounded warmth against the austere charcoal check."},
        {id:6,name:"Solid Burnt Orange",color:"#CC5500",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burnt orange against charcoal houndstooth and white — bold, precisely judged."},
      ]},
      { id:2, name:"Pale Blue End-on-End", colorCode:"#89B4D4", why:"Cool blue continues the cool register of charcoal houndstooth — tonal authority with a lighter touch.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy is the essential warm anchor in an entirely cool palette."},
        {id:2,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm camel against cool blue against charcoal houndstooth — elegant temperature contrast."},
        {id:3,name:"Solid Navy",color:"#191970",pattern:"Solid",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Deep navy on pale blue on charcoal — monochromatic cool authority."},
        {id:4,name:"Solid Silver",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver stays in the cool register — refined and precise."},
        {id:5,name:"Solid Burnt Orange",color:"#CC5500",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"The boldest warm note in a cool palette — deliberate and powerful."},
        {id:6,name:"Solid Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal bridges the cool blue and charcoal registers with jewel-tone precision."},
      ]},
      { id:3, name:"Pale Pink Poplin", colorCode:"#F4B8C1", why:"Warm pink against cool charcoal houndstooth — the most dramatic temperature contrast in a check suit.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Matching the suit in grenadine grounds the pink dramatically."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy anchors the pink with cool authority against the charcoal check."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy warms the combination — the bridge between pink and charcoal."},
        {id:4,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Green, pink, charcoal houndstooth — a bold triadic palette requiring confidence."},
        {id:5,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver keeps the combination cool and restrained."},
        {id:6,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Camel warms both pink and charcoal — the grounding note in a high-contrast palette."},
      ]},
    ],
    packages:[
      {name:"The Dark Authority",suit:"Charcoal Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black calf leather",socks:"Dark charcoal",watch:"Silver dress watch",occasion:"Board meeting, formal pitch, black-tie adjacent",archetype:"British Classic",confidence:2,tip:"Charcoal houndstooth with white and burgundy is peak boardroom authority.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Monochrome Master",suit:"Charcoal Houndstooth",shirt:"Pale Blue End-on-End",tie:"Solid Navy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Navy shadow",watch:"Silver dress watch",occasion:"Formal meetings, senior leadership, diplomatic",archetype:"British",confidence:2,tip:"The entirely cool palette — charcoal houndstooth, blue, navy. Serious power.",shirtColor:"#89B4D4",tieColor:"#191970"},
      {name:"The Temperature Statement",suit:"Charcoal Houndstooth",shirt:"Pale Pink Poplin",tie:"Solid Charcoal Grenadine",pocketSquare:"Pink Silk — Puff Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal or navy",watch:"Silver watch",occasion:"Creative leadership, business casual, important events",archetype:"Avant-Garde",confidence:4,tip:"Pink and charcoal houndstooth is the ultimate temperature contrast.",shirtColor:"#F4B8C1",tieColor:"#36454F"},
      {name:"The Camel Contrast",suit:"Charcoal Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Camel Knit",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Camel or charcoal",watch:"Gold-case watch",occasion:"Business casual, creative sector, smart events",archetype:"Continental",confidence:4,tip:"Warm camel against cool charcoal houndstooth — the most elegant temperature play.",shirtColor:"#F8F8F8",tieColor:"#C19A6B"},
      {name:"The Forest Authority",suit:"Charcoal Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Forest Green",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Oxford",belt:"Dark brown leather",socks:"Forest green or charcoal",watch:"Bronze-case watch",occasion:"Creative business, smart casual, gallery",archetype:"British",confidence:4,tip:"Forest green against charcoal houndstooth and white — nature-grounded distinction.",shirtColor:"#F8F8F8",tieColor:"#355E3B"},
      {name:"The Bold Check",suit:"Charcoal Houndstooth",shirt:"Pale Blue End-on-End",tie:"Solid Burnt Orange",pocketSquare:"White Cotton — One Point",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Navy or charcoal",watch:"Silver watch",occasion:"Creative industry, brand events, bold occasions",archetype:"Avant-Garde",confidence:5,tip:"Burnt orange against cool charcoal houndstooth and blue — maximum warm-cool contrast.",shirtColor:"#89B4D4",tieColor:"#CC5500"},
    ],
    styleMantra:"Charcoal houndstooth is architectural precision in cloth — the geometric authority of a man who understands that structure is the ultimate luxury."
  },


  "green|chalk_stripe": {
    suit: { colorFamily:"Olive Chalk Stripe", undertones:"Warm olive with vertical authority", fabric:"Wool twill, ~260 g/m2", pattern:"Chalk Stripe", formality:"Business Casual / Smart Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is non-negotiable with olive chalk stripe — the stripe is the statement, white is its essential foundation.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"A solid tie is the only option with chalk stripe — burgundy is the authority choice."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Cool navy against warm olive chalk stripe creates elegant deliberate tension."},
        {id:3,name:"Solid Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit softens the chalk stripe into smart business casual."},
        {id:4,name:"Solid Gold",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold highlights olive warm undertones — Italian confidence."},
        {id:5,name:"Solid Forest Green Grenadine",color:"#355E3B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Pratt/Shelby",harmony:"Monochromatic",why:"Tonal green on chalk stripe — deeply considered, monochromatic confidence."},
        {id:6,name:"Solid Rust",color:"#B7410E",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust amplifies the warmth of olive chalk stripe into something genuinely memorable."},
      ]},
      { id:2, name:"Ivory Cream End-on-End", colorCode:"#FFFFF0", why:"Warm ivory respects olive earthy warmth while providing the tonal contrast the chalk stripe needs.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"Ivory Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Dark Brown Grenadine",color:"#5C3317",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"The complete warm palette: olive stripe, ivory, and brown — unimpeachably elegant."},
        {id:2,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy against ivory against olive is warm sophistication at its peak."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel, ivory, and olive create a complete golden-hour palette."},
        {id:4,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the warm palette with necessary authority."},
        {id:5,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Terracotta and ivory and olive chalk stripe — the Mediterranean coast distilled."},
        {id:6,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal green grounds the stripe in a monochromatic move of real confidence."},
      ]},
      { id:3, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"Cool blue against warm olive chalk stripe — a deliberate temperature contrast that reads as completely modern.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Flat",material:"Linen"}, ties:[
        {id:1,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Triadic",why:"Burgundy bridges cool blue and warm olive — the anchor in a three-temperature palette."},
        {id:2,name:"Solid Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown warms the cool blue back toward olive territory."},
        {id:3,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool blue while aligning with olive golden undertones."},
        {id:4,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Matching the blue register creates tonal restraint against the statement stripe."},
        {id:5,name:"Solid Rust",color:"#B7410E",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust pops against blue while echoing olive warm spectrum."},
        {id:6,name:"Solid Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal expands the cool register while pushing toward the suit green family."},
      ]},
    ],
    packages:[
      {name:"The Olive Power Stripe",suit:"Olive Chalk Stripe",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Cap-Toe",belt:"Dark brown leather",socks:"Burgundy or olive",watch:"Gold-case dress watch",occasion:"Important meetings, business formal, client pitch",archetype:"Italian",confidence:3,tip:"Olive chalk stripe is a courageous suit — white and burgundy are the only combination that matches its ambition.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Warm Authority",suit:"Olive Chalk Stripe",shirt:"Ivory Cream End-on-End",tie:"Dark Brown Grenadine",pocketSquare:"Ivory Cotton — One Point",shoes:"Tan Leather Derby",belt:"Tan leather",socks:"Brown or olive",watch:"Bronze-case vintage",occasion:"Senior leadership, formal creative, business lunch",archetype:"Continental",confidence:5,tip:"The warmest power palette — olive, ivory, and brown. Brown shoes mandatory.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Temperature Contrast",suit:"Olive Chalk Stripe",shirt:"Pale Blue Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — Flat",shoes:"Brown Oxford",belt:"Brown leather",socks:"Navy or olive",watch:"Silver dress watch",occasion:"Business casual, creative leadership, important lunch",archetype:"Avant-Garde",confidence:4,tip:"Blue shirt on olive chalk stripe is the unexpected move — burgundy tie makes it deliberate.",shirtColor:"#89B4D4",tieColor:"#722F37"},
      {name:"The Italian Summer",suit:"Olive Chalk Stripe",shirt:"Ivory Cream End-on-End",tie:"Terracotta Solid",pocketSquare:"Ivory Cotton — One Point",shoes:"Tan Suede Loafers",belt:"Tan suede",socks:"Terracotta or camel",watch:"Gold sport-dress",occasion:"Creative business, lunch, gallery, aperitivo",archetype:"Mediterranean",confidence:5,tip:"Terracotta and ivory and olive chalk stripe — the Italian summer palette at its most refined.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Tonal Olive",suit:"Olive Chalk Stripe",shirt:"Crisp White Poplin",tie:"Forest Green Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Forest green or olive",watch:"Bronze-tone watch",occasion:"Creative sector, business casual, gallery",archetype:"British",confidence:4,tip:"White shirt breaks the monochromatic effect just enough to make the stripe intentional.",shirtColor:"#F8F8F8",tieColor:"#355E3B"},
      {name:"The Gold Hour",suit:"Olive Chalk Stripe",shirt:"Ivory Cream End-on-End",tie:"Camel Knit",pocketSquare:"Ivory Cotton — One Point",shoes:"Tan Suede Derby",belt:"Tan suede",socks:"Camel or ivory",watch:"Gold-tone casual",occasion:"Smart casual, weekend formal, creative events",archetype:"Country",confidence:4,tip:"Camel, ivory, and olive chalk stripe — unified by golden undertones.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
    ],
    styleMantra:"An olive chalk stripe is the suit of a man who has mastered the rules well enough to break them — and knows exactly why."
  },

  "green|glen_plaid": {
    suit: { colorFamily:"Olive Glen Plaid", undertones:"Warm earthy with country character", fabric:"Wool blend, ~240 g/m2", pattern:"Glen Plaid", formality:"Smart Casual / Business Casual", lapel:"Notch lapel", fit:"Classic or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"With glen plaid, always white and solid — the pattern does all the work.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit and olive glen plaid is the English countryside in suit form."},
        {id:2,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides authority against the complex olive plaid."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit and olive glen plaid is relaxed country elegance in its purest form."},
        {id:4,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Cool navy grounds the warm olive plaid with deliberate authority."},
        {id:5,name:"Solid Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal green knit against olive plaid — subtle, expert, completely deliberate."},
        {id:6,name:"Solid Rust Grenadine",color:"#B7410E",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust amplifies the warmth woven into olive glen plaid."},
      ]},
      { id:2, name:"Ivory Oxford Cloth", colorCode:"#FFFFF0", why:"Oxford cloth subtle texture complements glen plaid while warm ivory honours olive undertones.", collar:"Button-down collar", pattern:"Oxford weave", pocketSquare:{name:"Ivory Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Solid Dark Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"The definitive country combination: olive plaid, ivory, and dark brown."},
        {id:2,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel against ivory against olive — the entire golden spectrum."},
        {id:3,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy cuts through the warmth with cool authority."},
        {id:4,name:"Solid Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust warms the ivory into a complete autumnal palette."},
        {id:5,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the warm palette with quiet authority."},
        {id:6,name:"Solid Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal olive on glen plaid with ivory separation."},
      ]},
      { id:3, name:"Pale Blue Chambray", colorCode:"#89B4D4", why:"Chambray soft texture and cool blue create deliberate contrast against warm olive glen plaid.", collar:"Button-down collar", pattern:"Chambray", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Brown Grenadine",color:"#5C3317",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Brown warms the cool blue back toward olive territory."},
        {id:2,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy bridges blue chambray and olive plaid into a coherent palette."},
        {id:3,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold bridges cool blue and warm olive — the warm accent this palette needs."},
        {id:4,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Matching the cool blue register creates tonal calm against the busy plaid."},
        {id:5,name:"Solid Teal",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal expands the cool register while connecting to the suit green family."},
        {id:6,name:"Solid Rust",color:"#B7410E",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust pops against the blue while echoing olive warm spectrum."},
      ]},
    ],
    packages:[
      {name:"The Country Estate",suit:"Olive Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Brown Knit",pocketSquare:"White Linen — TV Fold",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Brown or olive",watch:"Leather-strap field watch",occasion:"Country weekend, smart casual, outdoor formal",archetype:"Country",confidence:4,tip:"Brown suede is the only shoe for olive glen plaid — everything else misses the point.",shirtColor:"#F8F8F8",tieColor:"#5C3317"},
      {name:"The Ivy Olive",suit:"Olive Glen Plaid",shirt:"Ivory Oxford Cloth",tie:"Solid Dark Brown Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Derby Brogues",belt:"Tan leather",socks:"Camel or olive",watch:"Casual watch",occasion:"Business casual, campus, creative sector",archetype:"Preppy",confidence:4,tip:"Oxford cloth and brown knit against olive plaid is the Ivy League at its most distinguished.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Olive Authority",suit:"Olive Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Brogues",belt:"Dark brown leather",socks:"Burgundy or olive",watch:"Gold-case dress watch",occasion:"Business meetings, client lunch, smart formal",archetype:"British Classic",confidence:3,tip:"Burgundy on white on olive plaid is the move of a man who knows precisely what he is doing.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Golden Hour",suit:"Olive Glen Plaid",shirt:"Ivory Oxford Cloth",tie:"Solid Camel",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Suede Loafers",belt:"Tan suede",socks:"Camel or ivory",watch:"Gold sport-dress",occasion:"Gallery, creative lunch, weekend smart",archetype:"Continental",confidence:5,tip:"Glen plaid, ivory, camel — a palette of complete warm harmony.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The Cool Modern",suit:"Olive Glen Plaid",shirt:"Pale Blue Chambray",tie:"Solid Brown Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Brown Oxford",belt:"Brown leather",socks:"Navy or olive",watch:"Silver dress watch",occasion:"Creative business, client meetings, team lunch",archetype:"Continental",confidence:4,tip:"Blue chambray on olive plaid is the unexpected move — brown tie is the bridge.",shirtColor:"#89B4D4",tieColor:"#5C3317"},
      {name:"The Autumn Maverick",suit:"Olive Glen Plaid",shirt:"Ivory Oxford Cloth",tie:"Solid Rust Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Derby",belt:"Tan leather",socks:"Rust or camel",watch:"Bronze-case watch",occasion:"Creative sector, gallery opening, autumn events",archetype:"Avant-Garde",confidence:5,tip:"Rust knit against olive plaid and ivory is the autumnal colour story in three acts.",shirtColor:"#FFFFF0",tieColor:"#B7410E"},
    ],
    styleMantra:"Olive glen plaid is the suit of the man who learned the English rules and made them his own — country authority with Italian ease."
  },

  "green|herringbone": {
    suit: { colorFamily:"Olive Herringbone", undertones:"Warm earthy with textural depth", fabric:"Wool herringbone, ~280 g/m2", pattern:"Herringbone", formality:"Business Casual / Smart Casual", lapel:"Notch lapel", fit:"Classic or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White cuts cleanly through olive herringbone texture — necessary simplicity against a rich weave.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"The knit texture echoes the herringbone weave — complementary textures and colours."},
        {id:2,name:"Dark Brown Grenadine",color:"#5C3317",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Brown and olive herringbone is the definitive English country house pairing."},
        {id:3,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy anchors the warmth of olive with cool authority."},
        {id:4,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel continues the warm spectrum of olive — earthy, relaxed, completely considered."},
        {id:5,name:"Burnt Orange Solid",color:"#CC5500",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Orange and olive herringbone is an autumnal combination of real character."},
        {id:6,name:"Gold Foulard",color:"#C9A84C",pattern:"Foulard",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold illuminates the warm undertones woven into olive herringbone."},
      ]},
      { id:2, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory warmth is a natural match for herringbone textured richness — tonal harmony of the highest order.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Ivory Linen",fold:"One Point",material:"Linen"}, ties:[
        {id:1,name:"Dark Chocolate Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"The complete earth palette: olive herringbone, ivory, chocolate."},
        {id:2,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm contrast against the ivory-olive combination."},
        {id:3,name:"Forest Green Solid",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal green on herringbone — subtle and expert."},
        {id:4,name:"Terracotta Knit",color:"#CB6D51",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Terracotta echoes the herringbone warm texture with complementary tone."},
        {id:5,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit grounds the warm palette with calm authority."},
        {id:6,name:"Rust Grenadine",color:"#B7410E",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust warms the herringbone texture into a complete autumnal composition."},
      ]},
      { id:3, name:"Pale Blue End-on-End", colorCode:"#89B4D4", why:"Cool blue against warm olive herringbone creates sophisticated temperature contrast.", collar:"Button-down collar", pattern:"End-on-End", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy bridges cool blue and warm olive into a cohesive three-tone palette."},
        {id:2,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown grounds the cool blue while honouring olive warmth."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool blue back toward olive territory."},
        {id:4,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Matching the cool register against warm herringbone creates elegant tension."},
        {id:5,name:"Rust Foulard",color:"#B7410E",pattern:"Foulard",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust pops against the cool blue while echoing the warm herringbone."},
        {id:6,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal harmonises with blue while pushing toward the suit green spectrum."},
      ]},
    ],
    packages:[
      {name:"The Autumn Executive",suit:"Olive Herringbone",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Brogues",belt:"Dark brown leather",socks:"Burgundy or dark olive",watch:"Bronze-case watch",occasion:"Business casual, autumn meetings, creative sector",archetype:"British Classic",confidence:4,tip:"The knit tie against herringbone is a textural masterclass — same family, different expression.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Country Gentleman",suit:"Olive Herringbone",shirt:"Ivory Cream Poplin",tie:"Dark Chocolate Knit",pocketSquare:"Ivory Linen — One Point",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Brown or olive",watch:"Leather-strap field watch",occasion:"Country weekend, smart casual, outdoor formal",archetype:"Country",confidence:5,tip:"Ivory and chocolate and olive herringbone is the ultimate English country palette.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Italian Autumn",suit:"Olive Herringbone",shirt:"Ivory Cream Poplin",tie:"Terracotta Knit",pocketSquare:"Ivory Linen — One Point",shoes:"Tan Suede Loafers",belt:"Tan leather",socks:"Terracotta or camel",watch:"Gold sport-dress",occasion:"Gallery, creative business, weekend lunch",archetype:"Continental",confidence:5,tip:"Terracotta and olive herringbone is the Italian autumn wardrobe in one outfit.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Temperature Play",suit:"Olive Herringbone",shirt:"Pale Blue End-on-End",tie:"Burgundy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Brown Derby Brogues",belt:"Brown leather",socks:"Navy or burgundy",watch:"Silver dress watch",occasion:"Business casual, client meetings, creative leadership",archetype:"Continental",confidence:4,tip:"Cool blue against warm olive herringbone — burgundy is the bridge that makes it work.",shirtColor:"#89B4D4",tieColor:"#722F37"},
      {name:"The Earth Authority",suit:"Olive Herringbone",shirt:"Crisp White Poplin",tie:"Dark Brown Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Cognac Oxford Brogues",belt:"Cognac leather",socks:"Brown or olive",watch:"Gold-tone dress watch",occasion:"Business meetings, lunch, creative sector",archetype:"British",confidence:4,tip:"White and brown on olive herringbone is the palette of quiet authority.",shirtColor:"#F8F8F8",tieColor:"#5C3317"},
      {name:"The Warm Modern",suit:"Olive Herringbone",shirt:"Crisp White Poplin",tie:"Burnt Orange Solid",pocketSquare:"White Linen — TV Fold",shoes:"Tan Derby",belt:"Tan leather",socks:"Orange or olive",watch:"Bronze or tan-strap watch",occasion:"Creative industry, gallery, smart casual",archetype:"Avant-Garde",confidence:4,tip:"Burnt orange on white on olive herringbone — warm, confident, deliberately modern.",shirtColor:"#F8F8F8",tieColor:"#CC5500"},
    ],
    styleMantra:"Olive herringbone is texture as philosophy — the man who wears it understands that depth is always in the weave."
  },

  "green|tweed": {
    suit: { colorFamily:"Olive Tweed", undertones:"Warm earthy, rough-hewn character", fabric:"Tweed, Harris or Donegal, ~380 g/m2", pattern:"Tweed", formality:"Smart Casual / Country Formal", lapel:"Notch lapel", fit:"Classic fit" },
    shirts: [
      { id:1, name:"Cream Poplin", colorCode:"#FFFFF0", why:"Cream against olive tweed is the natural combination — warm tones, rooted, completely honest.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Cream Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit and olive tweed is the Highlands in a tie — honest, warm, irreplaceable."},
        {id:2,name:"Burgundy Wool Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy wool knit is the warmest complement to olive tweed."},
        {id:3,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"The warmest combination: tweed, cream, and camel — a palette carved from the earth."},
        {id:4,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal green knit on olive tweed — subtle, expert, completely country."},
        {id:5,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust knit amplifies the warmth woven through olive tweed — an autumnal masterclass."},
        {id:6,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"The only cool note in a warm palette — navy grenadine grounds olive tweed."},
      ]},
      { id:2, name:"White Oxford Cloth", colorCode:"#F5F5F0", why:"Oxford cloth brings just enough texture to hold its own against tweed character.", collar:"Button-down collar", pattern:"Oxford weave", pocketSquare:{name:"White Linen",fold:"Flat Fold",material:"Linen"}, ties:[
        {id:1,name:"Dark Brown Grenadine",color:"#5C3317",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"White and brown on olive tweed — the most elegant version of the earth palette."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit bridges white crispness with tweed warmth."},
        {id:3,name:"Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal olive on tweed with white separation — the monochromatic country move."},
        {id:4,name:"Camel Solid",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel against white against olive tweed — warm and completely cohesive."},
        {id:5,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit provides cool authority in an otherwise warm palette."},
        {id:6,name:"Rust Solid",color:"#B7410E",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust on white on olive tweed — warm, deliberate, and confident."},
      ]},
      { id:3, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"The cool temperature of pale blue against rough olive tweed creates surprising modern contrast.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"One Point",material:"Linen"}, ties:[
        {id:1,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown warms the cool blue back toward olive territory — the essential bridge."},
        {id:2,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Triadic",why:"Burgundy bridges cool blue and warm olive tweed into a three-temperature composition."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold bridges blue and olive — the warm accent that makes the temperature play work."},
        {id:4,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Matching the cool blue register creates tonal calm against the textured tweed."},
        {id:5,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust against blue against olive tweed — warm, cool, and warm again."},
        {id:6,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal connects the cool blue to the suit green family."},
      ]},
    ],
    packages:[
      {name:"The Highland Gentleman",suit:"Olive Tweed",shirt:"Cream Poplin",tie:"Brown Knit",pocketSquare:"Cream Linen — Casual Puff",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Brown or heather",watch:"Leather-strap field watch",occasion:"Country weekend, estate, smart outdoor",archetype:"Country",confidence:5,tip:"Brown suede brogues are the only choice with olive tweed — everything else is a compromise.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Donegal Authority",suit:"Olive Tweed",shirt:"White Oxford Cloth",tie:"Dark Brown Grenadine",pocketSquare:"White Linen — Flat Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Brown or olive",watch:"Bronze-case watch",occasion:"Business casual, creative meetings, autumn events",archetype:"British Classic",confidence:4,tip:"White Oxford and dark brown on olive tweed — the most restrained expression of country authority.",shirtColor:"#F5F5F0",tieColor:"#5C3317"},
      {name:"The Autumnal Maverick",suit:"Olive Tweed",shirt:"Cream Poplin",tie:"Rust Knit",pocketSquare:"Cream Linen — Casual Puff",shoes:"Tan Suede Derby",belt:"Tan suede",socks:"Rust or camel",watch:"Bronze or tan-strap watch",occasion:"Creative events, gallery, autumn social",archetype:"Avant-Garde",confidence:5,tip:"Rust knit and cream against olive tweed is the autumnal colour masterclass.",shirtColor:"#FFFFF0",tieColor:"#B7410E"},
      {name:"The Cool Country",suit:"Olive Tweed",shirt:"Pale Blue Poplin",tie:"Brown Knit",pocketSquare:"White Linen — One Point",shoes:"Brown Derby Brogues",belt:"Brown leather",socks:"Navy or brown",watch:"Silver field watch",occasion:"Creative business, smart casual, country events",archetype:"Continental",confidence:4,tip:"Blue shirt against olive tweed is the unexpected country move — brown tie is the bridge.",shirtColor:"#89B4D4",tieColor:"#5C3317"},
      {name:"The Warm Tonal",suit:"Olive Tweed",shirt:"Cream Poplin",tie:"Burgundy Wool Knit",pocketSquare:"Cream Linen — Casual Puff",shoes:"Cognac Oxford",belt:"Cognac leather",socks:"Burgundy or olive",watch:"Gold-tone vintage",occasion:"Smart casual, business casual, cultural events",archetype:"British",confidence:4,tip:"Burgundy knit on cream on olive tweed — the warmest, most complete country palette.",shirtColor:"#FFFFF0",tieColor:"#722F37"},
      {name:"The Tonal Olive",suit:"Olive Tweed",shirt:"Cream Poplin",tie:"Forest Green Knit",pocketSquare:"Cream Linen — Casual Puff",shoes:"Brown Suede Loafers",belt:"Brown suede",socks:"Forest green or olive",watch:"Field watch",occasion:"Creative, gallery, weekend smart, outdoor",archetype:"Country",confidence:4,tip:"Tonal olive from tweed to tie with cream in between — the monochromatic country statement.",shirtColor:"#FFFFF0",tieColor:"#355E3B"},
    ],
    styleMantra:"Olive tweed is cloth with a biography — it tells you the man has been somewhere, done something, and dressed accordingly."
  },

  "green|linen": {
    suit: { colorFamily:"Olive Linen", undertones:"Warm golden-green, relaxed", fabric:"Linen / Cotton-Linen blend, ~200 g/m2", pattern:"Linen plain weave", formality:"Smart Casual / Summer Casual", lapel:"Notch lapel", fit:"Relaxed or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is the sharpest contrast to olive linen — clean and purposeful against a relaxed fabric.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit against white against olive linen is the Italian summer afternoon complete."},
        {id:2,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit with olive linen is relaxed authority — the most natural combination."},
        {id:3,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy provides warm complement without competing with olive linen casual register."},
        {id:4,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"A single cool note — navy grounds the warmth into something deliberate."},
        {id:5,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust and olive and white linen — Mediterranean warmth in three tones."},
        {id:6,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and olive linen — the summer version of pure tonal dressing."},
      ]},
      { id:2, name:"Ivory Linen Shirt", colorCode:"#FFFFF0", why:"Linen on linen is texture harmony — ivory warmth is inseparable from olive summer character.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"Ivory Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"The complete earth palette in summer weight — olive linen, ivory, brown."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel and ivory against olive linen — golden-hour dressing at its most relaxed."},
        {id:3,name:"Rust Solid",color:"#B7410E",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Rust warms ivory into a terracotta-tinged summer palette — deeply Italian."},
        {id:4,name:"Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal green with ivory separation — the monochromatic summer garden look."},
        {id:5,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"A cool anchor in an otherwise warm summer palette."},
        {id:6,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Terracotta and ivory and olive linen — the southern Italian coast in one outfit."},
      ]},
      { id:3, name:"Sky Blue Linen", colorCode:"#89B4D4", why:"Sky blue linen against olive linen — cool and warm summer tones in natural fabric harmony.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"White Linen",fold:"Puff",material:"Linen"}, ties:[
        {id:1,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown bridges the cool blue and warm olive — necessary warmth."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy deepens the blue register — a summer palette grounded in cool authority."},
        {id:3,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Camel bridges the temperature gap between blue and olive."},
        {id:4,name:"Teal Solid",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal connects the blue shirt to the suit green family."},
        {id:5,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust pops against the cool blue while anchoring the warmth of olive linen."},
        {id:6,name:"Burgundy Solid",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Burgundy bridges blue and olive — a more formal note in a summer linen outfit."},
      ]},
    ],
    packages:[
      {name:"The Amalfi Executive",suit:"Olive Linen",shirt:"Ivory Linen Shirt",tie:"Brown Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show or ivory",watch:"Gold sport-casual",occasion:"Summer business casual, outdoor meetings, resort formal",archetype:"Mediterranean",confidence:5,tip:"Linen on linen is never a mistake in summer — olive and ivory are always in conversation.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Garden Party",suit:"Olive Linen",shirt:"Crisp White Poplin",tie:"Camel Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Derby",belt:"Tan leather",socks:"Camel or ivory",watch:"Light casual watch",occasion:"Summer social, garden party, outdoor wedding guest",archetype:"Country",confidence:4,tip:"White and camel on olive linen is the summer garden party palette.",shirtColor:"#F8F8F8",tieColor:"#C19A6B"},
      {name:"The Summer Maverick",suit:"Olive Linen",shirt:"Sky Blue Linen",tie:"Brown Knit",pocketSquare:"White Linen — Puff",shoes:"White Canvas Espadrilles",belt:"None",socks:"No-show",watch:"NATO strap",occasion:"Summer casual, resort, coastal events",archetype:"Avant-Garde",confidence:5,tip:"Blue linen on olive linen is the freshest summer combination — brown knit is the essential anchor.",shirtColor:"#89B4D4",tieColor:"#5C3317"},
      {name:"The Terracotta Hour",suit:"Olive Linen",shirt:"Ivory Linen Shirt",tie:"Terracotta Solid",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Cognac Loafers",belt:"None",socks:"No-show or terracotta",watch:"Gold casual",occasion:"Summer aperitivo, casual lunch, rooftop events",archetype:"Italian",confidence:5,tip:"Terracotta, ivory, and olive linen — the Italian summer palette. Wear it with conviction.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Clean Summer",suit:"Olive Linen",shirt:"Crisp White Poplin",tie:"Navy Solid",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Leather Derby",belt:"Brown leather",socks:"Navy or olive",watch:"Silver casual",occasion:"Summer business, client lunch, smart casual outdoor",archetype:"British Classic",confidence:3,tip:"White and navy on olive linen — the cleanest summer version of the classic contrast.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Rust Afternoon",suit:"Olive Linen",shirt:"Ivory Linen Shirt",tie:"Rust Solid",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Suede Derby",belt:"Tan suede",socks:"Rust or camel",watch:"Bronze-tone casual",occasion:"Outdoor events, gallery, creative casual",archetype:"Avant-Garde",confidence:4,tip:"Rust and ivory and olive linen — the entire warm Mediterranean spectrum in summer weight.",shirtColor:"#FFFFF0",tieColor:"#B7410E"},
    ],
    styleMantra:"Olive linen is summer without apology — warm, textured, and effortlessly of the moment."
  },


  "white|solid": {
    suit: { colorFamily:"White / Ivory", undertones:"Clean warm ivory", fabric:"Lightweight wool or cotton, ~180 g/m2", pattern:"Solid", formality:"Smart Casual / Summer Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White-on-white is a tonal power move — only texture and fit separate suit from shirt.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Navy Grenadine Solid",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy is the single strongest anchor for a white suit — authoritative without competing."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy against white is warm and striking — the Italian Riviera move."},
        {id:3,name:"Sky Blue Solid",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Pale blue keeps the palette entirely cool and clean — summer restraint."},
        {id:4,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel against white is warm, Mediterranean, and deeply considered."},
        {id:5,name:"Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white is maximum contrast — formal, graphic, absolutely decisive."},
        {id:6,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against white is the warmest summer contrast — Southern Italian perfection."},
      ]},
      { id:2, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"Cool blue against white suit creates a fresh resort-ready palette.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Navy Solid Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy deepens the blue palette — anchoring white and pale blue with authority."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy cuts through the cool blue palette with decisive warmth."},
        {id:3,name:"Camel Solid",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm camel against cool blue against white — the most balanced summer contrast."},
        {id:4,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal deepens the blue register while staying entirely in the cool spectrum."},
        {id:5,name:"Coral Solid",color:"#FF6B6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Coral against pale blue against white is the ultimate resort palette."},
        {id:6,name:"Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green introduces nature-grounded depth into an airy white and blue palette."},
      ]},
      { id:3, name:"Pale Pink Poplin", colorCode:"#F4B8C1", why:"Pink against white suit is warm playful confidence — the bold summer personality move.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Pink Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Triadic",why:"Navy grounds pink and white — the cool anchor that makes the warmth work."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel echoes pink through the white — a golden-hour summer palette."},
        {id:3,name:"Burgundy Solid",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy deepens pink into something more serious without losing warmth."},
        {id:4,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Teal and pink against white is the most unexpected and elegant summer combination."},
        {id:5,name:"Coral Solid",color:"#FF6B6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Coral and pink against white is tropical warmth layered with precision."},
        {id:6,name:"Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green grounds pink and white with natural authority."},
      ]},
    ],
    packages:[
      {name:"The Riviera Authority",suit:"White Solid",shirt:"Crisp White Poplin",tie:"Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"White Canvas Loafers",belt:"None",socks:"No-show",watch:"Gold dress watch",occasion:"Resort formal, summer wedding, yacht events",archetype:"Mediterranean",confidence:3,tip:"White suit demands white shoes — brown or black breaks the entire effect.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Italian Summer",suit:"White Solid",shirt:"Pale Blue Poplin",tie:"Navy Solid Grenadine",pocketSquare:"White Cotton — One Point",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Gold sport-casual",occasion:"Summer lunch, terrace dining, coastal events",archetype:"Italian",confidence:4,tip:"Blue and white and navy is the most naturally complete summer palette.",shirtColor:"#89B4D4",tieColor:"#1B3A6B"},
      {name:"The Bold Resort",suit:"White Solid",shirt:"Pale Pink Poplin",tie:"Navy Solid",pocketSquare:"Pink Silk — Puff Fold",shoes:"White Suede Loafers",belt:"None",socks:"No-show",watch:"Rose gold casual",occasion:"Garden party, summer social, resort casual",archetype:"Avant-Garde",confidence:5,tip:"Pink shirt on white suit is confidence made visible — navy tie is the only anchor.",shirtColor:"#F4B8C1",tieColor:"#1B3A6B"},
      {name:"The Tropical Classic",suit:"White Solid",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"White Bucks",belt:"White leather",socks:"No-show",watch:"Gold watch",occasion:"Summer wedding, resort dinner, tropical formal",archetype:"Preppy",confidence:3,tip:"Burgundy on white is warm and decisive — the knit texture makes it summer-appropriate.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Terracotta Hour",suit:"White Solid",shirt:"Crisp White Poplin",tie:"Terracotta Solid",pocketSquare:"White Linen — Puff",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Bronze casual",occasion:"Aperitivo, summer dinner, outdoor events",archetype:"Continental",confidence:4,tip:"Terracotta on white is pure Southern Italy — warm, confident, completely seasonal.",shirtColor:"#F8F8F8",tieColor:"#CB6D51"},
      {name:"The Graphic Authority",suit:"White Solid",shirt:"Crisp White Poplin",tie:"Black Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"White Oxford",belt:"White leather",socks:"No-show",watch:"Silver dress watch",occasion:"Summer formal, creative black-tie, resort gala",archetype:"Avant-Garde",confidence:4,tip:"Black and white is the most graphic summer statement — wear it only when you can own every room.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
    ],
    styleMantra:"A white suit is not clothing — it is a declaration. Wear it only when you intend to be remembered."
  },

  "white|linen": {
    suit: { colorFamily:"White Linen", undertones:"Clean warm white, relaxed texture", fabric:"Linen / Cotton-Linen blend, ~180 g/m2", pattern:"Linen plain weave", formality:"Smart Casual / Summer Casual", lapel:"Notch lapel", fit:"Relaxed or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White poplin against white linen — the texture is the entire distinction. Summer restraint perfected.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit is the essential anchor for white linen — without it the look dissolves."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel warms white linen into a golden summer palette."},
        {id:3,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy provides warm authority against the lightness of white linen."},
        {id:4,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against white linen is Mediterranean summer at its most natural."},
        {id:5,name:"Sky Blue Solid",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Cool blue keeps white linen entirely seasonal and airy."},
        {id:6,name:"Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Olive knit grounds white linen with earthy summer warmth."},
      ]},
      { id:2, name:"Ivory Linen Shirt", colorCode:"#FFFFF0", why:"Linen on linen is the ultimate summer texture harmony — ivory and white in natural fabric conversation.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"Ivory Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit anchors the linen-on-linen palette — essential and non-negotiable."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel and ivory against white linen — the warmest summer palette possible."},
        {id:3,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta warms ivory into a complete Mediterranean linen composition."},
        {id:4,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown and ivory against white linen — earth tones in the lightest possible fabric."},
        {id:5,name:"Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Olive knit grounds ivory linen with summer earth-tone warmth."},
        {id:6,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit provides warm contrast against the cream-white linen palette."},
      ]},
      { id:3, name:"Sky Blue Linen", colorCode:"#89B4D4", why:"Blue linen against white linen is texture-on-texture summer harmony — the freshest possible combination.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"White Linen",fold:"Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy deepens the blue register — essential anchor in an airy summer palette."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Camel bridges the cool blue and white linen with necessary warmth."},
        {id:3,name:"Teal Solid",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal deepens the blue linen into jewel-tone summer precision."},
        {id:4,name:"Coral Solid",color:"#FF6B6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Coral against blue linen against white linen — resort energy at its peak."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy is the warm note that prevents a cool palette from feeling cold."},
        {id:6,name:"Olive Knit",color:"#556B2F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Triadic",why:"Olive knit connects blue and white linen through earthy summer warmth."},
      ]},
    ],
    packages:[
      {name:"The Amalfi White",suit:"White Linen",shirt:"Ivory Linen Shirt",tie:"Camel Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Gold casual",occasion:"Resort, summer aperitivo, coastal dining, outdoor wedding",archetype:"Mediterranean",confidence:5,tip:"Linen on linen is the ultimate summer texture — ivory and camel against white is the Amalfi palette.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The White Summer",suit:"White Linen",shirt:"Crisp White Poplin",tie:"Navy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"White Canvas Loafers",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Summer casual, outdoor events, resort",archetype:"Preppy",confidence:3,tip:"Navy knit is the one element that gives white linen its gravity — never skip it.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Blue Linen",suit:"White Linen",shirt:"Sky Blue Linen",tie:"Navy Knit",pocketSquare:"White Linen — Puff",shoes:"White Espadrilles",belt:"None",socks:"No-show",watch:"NATO strap",occasion:"Summer casual, beach resort, coastal events",archetype:"Avant-Garde",confidence:5,tip:"Blue linen on white linen is the freshest summer combination — navy knit is the only tie that works.",shirtColor:"#89B4D4",tieColor:"#1B3A6B"},
      {name:"The Terracotta Linen",suit:"White Linen",shirt:"Ivory Linen Shirt",tie:"Terracotta Solid",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Cognac Loafers",belt:"None",socks:"No-show",watch:"Bronze casual",occasion:"Summer aperitivo, outdoor dining, rooftop events",archetype:"Italian",confidence:5,tip:"Terracotta and ivory against white linen — the Italian summer coast in a single palette.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Coral Resort",suit:"White Linen",shirt:"Sky Blue Linen",tie:"Coral Solid",pocketSquare:"White Linen — Puff",shoes:"White Canvas",belt:"None",socks:"No-show",watch:"Gold sport",occasion:"Resort, beach wedding, tropical events",archetype:"Avant-Garde",confidence:5,tip:"Coral against blue against white linen is pure tropical energy — wear it only in the right setting.",shirtColor:"#89B4D4",tieColor:"#FF6B6B"},
      {name:"The Clean Resort",suit:"White Linen",shirt:"Crisp White Poplin",tie:"Terracotta Solid",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Derby",belt:"Tan leather",socks:"No-show",watch:"Bronze casual",occasion:"Smart summer casual, garden party, resort",archetype:"Continental",confidence:4,tip:"White linen with terracotta tie — the cleanest version of the warm summer contrast.",shirtColor:"#F8F8F8",tieColor:"#CB6D51"},
    ],
    styleMantra:"White linen is summer distilled — light, textured, and worn only by men who understand that ease is the highest form of elegance."
  },

  "white|herringbone": {
    suit: { colorFamily:"White Herringbone", undertones:"Clean white with textural woven depth", fabric:"Lightweight wool herringbone, ~220 g/m2", pattern:"Herringbone", formality:"Smart Casual / Summer Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White on white herringbone — the texture is the only distinction. Restraint of the highest order.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy is the essential anchor for white herringbone — without it the look has no gravity."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel knit echoes the herringbone texture with warm tonal harmony."},
        {id:3,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy against white herringbone is warm authority in a summer texture."},
        {id:4,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white herringbone is the most graphic texture contrast in summer dressing."},
        {id:5,name:"Sky Blue Solid",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Cool blue keeps white herringbone clean and entirely seasonal."},
        {id:6,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against white herringbone is Mediterranean warmth through texture."},
      ]},
      { id:2, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"Cool blue against white herringbone adds temperature depth without competing with the texture.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Deep navy anchors the cool palette — essential authority in blue and white."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit is the warm note that an entirely cool palette needs."},
        {id:3,name:"Camel Solid",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm camel bridges blue and white herringbone with elegant contrast."},
        {id:4,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal deepens the blue register while adding jewel-tone precision."},
        {id:5,name:"Coral Solid",color:"#FF6B6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Coral against pale blue against white herringbone — pure summer energy."},
        {id:6,name:"Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green grounds the cool blue and white palette with natural authority."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against white herringbone is the most refined summer tonal approach.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy anchors the entire warm tonal palette — without it the look has no contrast."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel and ivory against white herringbone — the warmest summer texture palette."},
        {id:3,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta warms ivory into a complete Mediterranean composition."},
        {id:4,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm authority against the cream-white herringbone texture."},
        {id:5,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit echoes the herringbone warmth with tonal earth-tone depth."},
        {id:6,name:"Sky Blue Solid",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Cool blue against warm ivory against white herringbone — summer temperature contrast."},
      ]},
    ],
    packages:[
      {name:"The Texture Authority",suit:"White Herringbone",shirt:"Crisp White Poplin",tie:"Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Gold dress watch",occasion:"Summer formal, resort, outdoor wedding",archetype:"Italian",confidence:3,tip:"White herringbone is texture doing the work — navy tie is the only element needed.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Cool Texture",suit:"White Herringbone",shirt:"Pale Blue Poplin",tie:"Navy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"White Loafers",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Coastal events, summer lunch, terrace dining",archetype:"Mediterranean",confidence:4,tip:"Blue and white and navy herringbone — cool, textured, and entirely of the summer moment.",shirtColor:"#89B4D4",tieColor:"#1B3A6B"},
      {name:"The Warm Summer Texture",suit:"White Herringbone",shirt:"Ivory Cream Poplin",tie:"Camel Knit",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Gold casual",occasion:"Garden party, resort casual, summer social",archetype:"Continental",confidence:4,tip:"Ivory and camel against white herringbone — texture, warmth, and summer refinement.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The Graphic Texture",suit:"White Herringbone",shirt:"Crisp White Poplin",tie:"Black Solid",pocketSquare:"White Linen — TV Fold",shoes:"White Oxford",belt:"White leather",socks:"No-show",watch:"Silver dress watch",occasion:"Summer formal, creative events, bold occasions",archetype:"Avant-Garde",confidence:4,tip:"Black on white herringbone is maximum summer contrast — the texture makes it more than graphic.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Terracotta Texture",suit:"White Herringbone",shirt:"Ivory Cream Poplin",tie:"Terracotta Solid",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Suede Derby",belt:"Tan suede",socks:"No-show",watch:"Bronze casual",occasion:"Aperitivo, outdoor events, creative casual",archetype:"Avant-Garde",confidence:4,tip:"Terracotta and ivory against white herringbone — Mediterranean summer through texture.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Burgundy Texture",suit:"White Herringbone",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"White Bucks",belt:"White leather",socks:"No-show",watch:"Gold watch",occasion:"Summer wedding, resort dinner, tropical formal",archetype:"Preppy",confidence:3,tip:"Burgundy grenadine on white herringbone — warm authority expressed through summer texture.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
    ],
    styleMantra:"White herringbone is summer elegance with depth — the texture says what solid white cannot."
  },

  "white|chalk_stripe": {
    suit: { colorFamily:"White Chalk Stripe", undertones:"Clean with warm stripe detail", fabric:"Lightweight wool, ~180 g/m2", pattern:"Chalk Stripe", formality:"Smart Casual / Summer Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White shirt on white chalk stripe — only the stripe breaks the tonal field. Maximum summer elegance.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Navy Grenadine Solid",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy is the only anchor strong enough for white chalk stripe."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy against white stripe is warm, striking, and entirely intentional."},
        {id:3,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white chalk stripe is graphic authority — the boldest summer statement."},
        {id:4,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel softens white chalk stripe into relaxed summer authority."},
        {id:5,name:"Sky Blue Solid",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Pale blue on white chalk stripe keeps the palette entirely cool and airy."},
        {id:6,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta against white stripe is Mediterranean summer at its most confident."},
      ]},
      { id:2, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"Blue adds cool depth to white chalk stripe without competing — the stripe remains the statement.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Navy Solid Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Deepening the blue register anchors the airy white stripe with authority."},
        {id:2,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy is always the warmth that a cool palette needs."},
        {id:3,name:"Camel Solid",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm camel bridges blue and white into a complete summer palette."},
        {id:4,name:"Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal deepens the blue while staying entirely in the cool spectrum."},
        {id:5,name:"Coral Solid",color:"#FF6B6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Coral against pale blue against white chalk stripe — pure resort energy."},
        {id:6,name:"Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green introduces grounded depth into an airy summer palette."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against white chalk stripe is the most refined tonal approach — warm and tonal.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy is essential — the tonal white-ivory palette needs its anchor."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel and ivory against white chalk stripe — the warmest summer palette."},
        {id:3,name:"Terracotta Solid",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta warms ivory into a complete Mediterranean summer composition."},
        {id:4,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm authority against the cream-white tonal palette."},
        {id:5,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown and ivory against white chalk stripe — earth tones in a summer suit."},
        {id:6,name:"Sky Blue Solid",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Cool blue against warm ivory against white chalk stripe — elegant temperature contrast."},
      ]},
    ],
    packages:[
      {name:"The Summer Power Stripe",suit:"White Chalk Stripe",shirt:"Crisp White Poplin",tie:"Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Gold dress watch",occasion:"Resort formal, summer wedding, important summer meetings",archetype:"Italian",confidence:3,tip:"White chalk stripe demands total commitment — white shoes, navy tie. No compromise.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Riviera Bold",suit:"White Chalk Stripe",shirt:"Pale Blue Poplin",tie:"Navy Solid Grenadine",pocketSquare:"White Cotton — One Point",shoes:"White Loafers",belt:"None",socks:"No-show",watch:"Gold sport-casual",occasion:"Coastal dining, terrace events, summer lunch",archetype:"Mediterranean",confidence:4,tip:"Blue and white and navy stripe is the palette of the Italian coast — cool, clean, considered.",shirtColor:"#89B4D4",tieColor:"#1B3A6B"},
      {name:"The Tonal Summer",suit:"White Chalk Stripe",shirt:"Ivory Cream Poplin",tie:"Camel Knit",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Gold casual",occasion:"Garden party, summer social, resort casual",archetype:"Continental",confidence:4,tip:"Ivory and camel against white chalk stripe — the warmest refined summer tonal palette.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The Graphic Summer",suit:"White Chalk Stripe",shirt:"Crisp White Poplin",tie:"Black Solid",pocketSquare:"White Linen — TV Fold",shoes:"White Oxford",belt:"White leather",socks:"No-show",watch:"Silver dress watch",occasion:"Summer formal, creative events, resort gala",archetype:"Avant-Garde",confidence:4,tip:"Black tie on white chalk stripe is the most graphic summer statement possible.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Warm Stripe",suit:"White Chalk Stripe",shirt:"Ivory Cream Poplin",tie:"Terracotta Solid",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Suede Derby",belt:"Tan suede",socks:"No-show",watch:"Bronze casual",occasion:"Outdoor summer events, aperitivo, casual formal",archetype:"Avant-Garde",confidence:4,tip:"Terracotta and ivory against white chalk stripe — Mediterranean summer in three tones.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Burgundy Statement",suit:"White Chalk Stripe",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"White Bucks",belt:"White leather",socks:"No-show",watch:"Gold watch",occasion:"Summer wedding, resort dinner, tropical formal",archetype:"Preppy",confidence:3,tip:"Burgundy knit on white chalk stripe — warm authority in a summer suit.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
    ],
    styleMantra:"White chalk stripe is summer authority made visible — the stripe adds structure to the season and demands the man match its ambition."
  },

  "white|glen_plaid": {
    suit: { colorFamily:"White Glen Plaid", undertones:"Clean white with woven pattern complexity", fabric:"Lightweight wool blend, ~180 g/m2", pattern:"Glen Plaid", formality:"Smart Casual / Summer Casual", lapel:"Notch lapel", fit:"Slim or classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"With glen plaid, white shirt is always the answer — the pattern does all the work.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy is essential with white glen plaid — the pattern needs a strong solid anchor."},
        {id:2,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit softens white glen plaid into smart summer casual."},
        {id:3,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel warms the white plaid into a golden summer combination."},
        {id:4,name:"Solid Sky Blue",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Cool blue keeps white glen plaid clean and airy — summer restraint."},
        {id:5,name:"Solid Forest Green",color:"#355E3B",pattern:"Solid",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green introduces natural depth into the white plaid palette."},
        {id:6,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white glen plaid is the most graphic statement — decisive and bold."},
      ]},
      { id:2, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"Blue adds cool depth to white glen plaid — the pattern remains the visual statement.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Deep navy anchors blue and white plaid — tonal cool authority."},
        {id:2,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy is the warm anchor in an otherwise cool palette."},
        {id:3,name:"Solid Camel",color:"#C19A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Warm camel bridges blue and white — the necessary temperature contrast."},
        {id:4,name:"Solid Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Teal stays in the cool register while adding jewel-tone depth."},
        {id:5,name:"Solid Coral",color:"#FF6B6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Coral against pale blue against white plaid — resort energy at its most deliberate."},
        {id:6,name:"Solid Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Triadic",why:"Green knit grounds the cool blue palette with natural warmth."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against white glen plaid — warm and tonal, the check provides all texture.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy anchors when the palette is otherwise entirely warm and tonal."},
        {id:2,name:"Solid Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel and ivory against white plaid — the complete warm summer palette."},
        {id:3,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy warms ivory into a sophisticated summer composition."},
        {id:4,name:"Solid Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit and ivory against white plaid — earth tones in a summer check."},
        {id:5,name:"Solid Terracotta",color:"#CB6D51",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Terracotta warms ivory into a Mediterranean summer palette."},
        {id:6,name:"Solid Sky Blue",color:"#89B4D4",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Cool blue against warm ivory against white plaid — elegant temperature contrast."},
      ]},
    ],
    packages:[
      {name:"The Summer Check",suit:"White Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Gold watch",occasion:"Summer smart casual, resort, outdoor events",archetype:"Preppy",confidence:3,tip:"White plaid demands white shoes — navy tie is the one element that grounds the entire look.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Cool Plaid",suit:"White Glen Plaid",shirt:"Pale Blue Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Cotton — One Point",shoes:"White Loafers",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Coastal dining, summer casual, terrace events",archetype:"Mediterranean",confidence:4,tip:"Blue and white and navy plaid is the summer Ivy League palette — clean, considered, cool.",shirtColor:"#89B4D4",tieColor:"#1B3A6B"},
      {name:"The Warm Summer Plaid",suit:"White Glen Plaid",shirt:"Ivory Cream Poplin",tie:"Solid Camel Knit",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Gold casual",occasion:"Garden party, resort casual, summer social",archetype:"Continental",confidence:4,tip:"Ivory and camel against white plaid — the warmest refined summer check palette.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The Burgundy Plaid",suit:"White Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"White Bucks",belt:"White leather",socks:"No-show",watch:"Gold watch",occasion:"Summer wedding guest, tropical formal, resort dinner",archetype:"Preppy",confidence:3,tip:"Burgundy knit on white glen plaid is warm authority — the knit texture keeps it seasonal.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Terracotta Plaid",suit:"White Glen Plaid",shirt:"Ivory Cream Poplin",tie:"Solid Terracotta",pocketSquare:"Ivory Silk — One Point",shoes:"Tan Derby",belt:"Tan leather",socks:"No-show",watch:"Bronze casual",occasion:"Outdoor summer events, aperitivo, creative casual",archetype:"Avant-Garde",confidence:4,tip:"Terracotta and ivory against white plaid is the Italian summer check — warm and memorable.",shirtColor:"#FFFFF0",tieColor:"#CB6D51"},
      {name:"The Graphic Plaid",suit:"White Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Black",pocketSquare:"White Linen — TV Fold",shoes:"White Oxford",belt:"White leather",socks:"No-show",watch:"Silver watch",occasion:"Summer formal, creative events, bold occasions",archetype:"Avant-Garde",confidence:4,tip:"Black tie on white glen plaid — the most graphic summer check statement.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
    ],
    styleMantra:"White glen plaid is summer pattern at its most ambitious — the check provides the character, the man provides the conviction."
  },

  "white|tweed": {
    suit: { colorFamily:"White Tweed", undertones:"Warm white with rough country texture", fabric:"Lightweight tweed or linen-tweed blend, ~280 g/m2", pattern:"Tweed", formality:"Smart Casual / Country Summer", lapel:"Notch lapel", fit:"Classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White poplin against white tweed — the texture contrast is everything. Crisp meets rough.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit matches the textural register of tweed — the knit echoes the weave."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Warm camel knit against white tweed is country summer at its most relaxed."},
        {id:3,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit provides warm contrast — the knit texture respects the tweed."},
        {id:4,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green knit against white tweed is country summer with natural authority."},
        {id:5,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit and white tweed — earth tones in a summer texture."},
        {id:6,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust knit warms white tweed into a summer country palette of real character."},
      ]},
      { id:2, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against white tweed is the warmest most natural combination — cream and texture in harmony.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit anchors the warm tonal palette with authority."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Camel and ivory against white tweed — the warmest summer country palette."},
        {id:3,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown and ivory against white tweed — earth tones through summer texture."},
        {id:4,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust warms ivory into a complete summer country composition."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit against ivory against white tweed — warm and rooted."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Triadic",why:"Green knit and ivory against white tweed is the summer garden complete."},
      ]},
      { id:3, name:"Pale Blue Poplin", colorCode:"#89B4D4", why:"Cool blue against white tweed creates unexpected temperature contrast — modern country dressing.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"One Point",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Deepening the blue with navy knit anchors the cool palette through texture."},
        {id:2,name:"Camel Knit",color:"#C19A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Camel bridges blue and white tweed — necessary warmth against the cool register."},
        {id:3,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy is the warm anchor in an otherwise cool palette."},
        {id:4,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Triadic",why:"Forest green knit grounds the cool blue with natural country warmth."},
        {id:5,name:"Rust Knit",color:"#B7410E",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Rust pops against the cool blue while warming the white tweed texture."},
        {id:6,name:"Brown Knit",color:"#5C3317",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Brown knit warms the cool blue back toward earth-tone territory."},
      ]},
    ],
    packages:[
      {name:"The Summer Country",suit:"White Tweed",shirt:"Ivory Cream Poplin",tie:"Camel Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Suede Brogues",belt:"Tan suede",socks:"No-show or ivory",watch:"Field watch",occasion:"Country summer, garden party, outdoor wedding",archetype:"Country",confidence:4,tip:"Ivory and camel against white tweed — the warmest summer country palette. Tan suede mandatory.",shirtColor:"#FFFFF0",tieColor:"#C19A6B"},
      {name:"The White Texture",suit:"White Tweed",shirt:"Crisp White Poplin",tie:"Navy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Silver casual",occasion:"Smart summer casual, outdoor events, country wedding",archetype:"Preppy",confidence:3,tip:"Navy knit on white poplin on white tweed — the texture is everything. The knit is the bridge.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Warm Texture",suit:"White Tweed",shirt:"Ivory Cream Poplin",tie:"Brown Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"No-show",watch:"Bronze casual",occasion:"Country casual, outdoor events, summer garden",archetype:"Country",confidence:4,tip:"Brown knit and ivory against white tweed — earth tones expressed through summer texture.",shirtColor:"#FFFFF0",tieColor:"#5C3317"},
      {name:"The Cool Country",suit:"White Tweed",shirt:"Pale Blue Poplin",tie:"Navy Knit",pocketSquare:"White Linen — One Point",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Silver watch",occasion:"Smart casual, summer events, country modern",archetype:"Continental",confidence:4,tip:"Blue and navy knit against white tweed — the unexpected modern country move.",shirtColor:"#89B4D4",tieColor:"#1B3A6B"},
      {name:"The Rust Country",suit:"White Tweed",shirt:"Ivory Cream Poplin",tie:"Rust Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Derby",belt:"Tan leather",socks:"No-show",watch:"Bronze watch",occasion:"Country events, garden, outdoor summer",archetype:"Avant-Garde",confidence:4,tip:"Rust knit and ivory against white tweed is the warmest summer country palette.",shirtColor:"#FFFFF0",tieColor:"#B7410E"},
      {name:"The Green Country",suit:"White Tweed",shirt:"Crisp White Poplin",tie:"Forest Green Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"No-show",watch:"Field watch",occasion:"Country summer, outdoor, garden party",archetype:"Country",confidence:4,tip:"Forest green knit on white tweed is the garden in a tie — natural and completely country.",shirtColor:"#F8F8F8",tieColor:"#355E3B"},
    ],
    styleMantra:"White tweed is the summer country house done right — rough texture in pale cloth, worn only by those who understand that elegance is never smooth."
  },


  "purple|solid": {
    suit: { colorFamily:"Purple / Plum", undertones:"Cool violet, regal depth", fabric:"Wool twill, ~260 g/m2", pattern:"Solid", formality:"Smart Casual / Creative Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is the only shirt that gives a purple suit the clean foundation it needs — maximum contrast, zero competition.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Silver Grenadine Solid",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver is the most elegant companion to purple — cool, reflective, aristocratic."},
        {id:2,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal grounds purple with cool authority — the most restrained choice on a bold suit."},
        {id:3,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy and purple share the same deep warm spectrum — a tonal combination of real sophistication."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold against purple is regal and warm — the most deliberately luxurious combination."},
        {id:5,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy deepens purple into a cool authoritative palette — the most conservative choice on this suit."},
        {id:6,name:"Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on purple and white is graphic, bold, and entirely deliberate."},
      ]},
      { id:2, name:"Pale Grey End-on-End", colorCode:"#D3D3D3", why:"Cool grey against purple creates a sophisticated monochromatic cool palette — regal without ostentation.", collar:"Semi-spread collar", pattern:"End-on-End", pocketSquare:{name:"Silver Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Silver and grey and purple — a complete cool monochromatic palette of real sophistication."},
        {id:2,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens the grey into a cool anchor against the purple suit."},
        {id:3,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy provides warm contrast against the cool grey-purple palette."},
        {id:4,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy stays in the cool register — deepening the palette with quiet authority."},
        {id:5,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey-purple palette with regal contrast."},
        {id:6,name:"Mauve Grenadine",color:"#C8A2C8",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal mauve on purple suit with grey shirt — the most daring monochromatic move."},
      ]},
      { id:3, name:"Pale Lavender Poplin", colorCode:"#E6E6FA", why:"Lavender against purple suit is the tonal move of the genuinely confident — monochromatic regal dressing.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"Lavender Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal is the essential anchor in a monochromatic purple-lavender palette."},
        {id:2,name:"Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the cool palette refined — regal restraint at its best."},
        {id:3,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds the lavender-purple combination with cool authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold is the warm note that illuminates the entire cool lavender-purple palette."},
        {id:5,name:"Burgundy Solid",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy deepens lavender into a complete warm-cool purple composition."},
        {id:6,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on lavender on purple is the most graphic monochromatic statement."},
      ]},
    ],
    packages:[
      {name:"The Regal Authority",suit:"Purple Solid",shirt:"Crisp White Poplin",tie:"Silver Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black calf leather",socks:"Charcoal or purple",watch:"Silver dress watch",occasion:"Creative formal, gallery opening, bold client meeting",archetype:"Avant-Garde",confidence:4,tip:"Silver tie on purple and white is the most controlled way to wear this suit — let the colour do the work.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Gold Standard",suit:"Purple Solid",shirt:"Crisp White Poplin",tie:"Gold Knit",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or purple",watch:"Gold dress watch",occasion:"Creative events, brand launches, bold formal occasions",archetype:"Avant-Garde",confidence:5,tip:"Gold and purple is the most regal combination in menswear — wear it with absolute conviction.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Monochrome",suit:"Purple Solid",shirt:"Pale Grey End-on-End",tie:"Silver Grenadine",pocketSquare:"Silver Silk — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver dress watch",occasion:"Creative formal, gallery, arts events",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver and purple — the coolest, most sophisticated way to wear a purple suit.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Burgundy Depth",suit:"Purple Solid",shirt:"Crisp White Poplin",tie:"Burgundy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Oxford",belt:"Dark brown leather",socks:"Burgundy or purple",watch:"Gold-case watch",occasion:"Creative business, brand events, bold meetings",archetype:"Italian",confidence:4,tip:"Burgundy and purple share deep warm tones — this is the most wearable bold-suit combination.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Lavender Statement",suit:"Purple Solid",shirt:"Pale Lavender Poplin",tie:"Charcoal Grenadine",pocketSquare:"Lavender Silk — Puff Fold",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal or purple",watch:"Silver dress watch",occasion:"Fashion events, gallery openings, creative leadership",archetype:"Avant-Garde",confidence:5,tip:"Monochromatic purple dressing requires the charcoal tie — without that anchor the look loses its edge.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Navy Restraint",suit:"Purple Solid",shirt:"Crisp White Poplin",tie:"Navy Solid",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxford",belt:"Black leather",socks:"Navy or charcoal",watch:"Silver watch",occasion:"Creative business formal, important meetings in purple",archetype:"British Classic",confidence:3,tip:"Navy is the most conservative tie choice on a purple suit — it grounds the colour without competing.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Purple is the colour of those who refuse to be invisible — wear it only when you intend to own the conversation."
  },

  "purple|chalk_stripe": {
    suit: { colorFamily:"Purple Chalk Stripe", undertones:"Cool violet with vertical authority", fabric:"Wool twill, ~260 g/m2", pattern:"Chalk Stripe", formality:"Creative Formal / Smart Casual", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White and solid — non-negotiable with purple chalk stripe. The stripe is already the statement.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver on purple chalk stripe is aristocratic precision — the chalk line echoed in the tie."},
        {id:2,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal grounds the purple stripe with cool, uncompromising authority."},
        {id:3,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold against purple chalk stripe is regal confidence — the stripe does the structural work."},
        {id:4,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds the purple stripe with cool, restrained authority."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit softens purple chalk stripe into something more approachable."},
        {id:6,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white on purple chalk stripe is the most graphic bold-suit statement."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against purple chalk stripe — cool tonal authority, the stripe remains the star.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Silver Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Silver and grey and purple stripe — cool monochromatic sophistication."},
        {id:2,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy anchors the cool palette with necessary authority."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey-purple stripe palette with regal contrast."},
        {id:4,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm depth against the cool grey-purple register."},
        {id:5,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens grey into a complete cool anchor."},
        {id:6,name:"Mauve Knit",color:"#C8A2C8",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal mauve knit on grey on purple stripe — the most daring cool-tonal move."},
      ]},
      { id:3, name:"Pale Lavender Poplin", colorCode:"#E6E6FA", why:"Lavender against purple chalk stripe is full tonal commitment — the stripe provides the structure.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Lavender Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal is the essential anchor in a fully tonal purple palette."},
        {id:2,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds the lavender-purple stripe with cool deliberate authority."},
        {id:3,name:"Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the tonal palette refined and aristocratic."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold illuminates the entire lavender-purple chalk stripe with regal warmth."},
        {id:5,name:"Burgundy Solid",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy is the warm note that prevents lavender-purple from feeling cold."},
        {id:6,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black anchors the tonal purple-lavender stripe with maximum contrast."},
      ]},
    ],
    packages:[
      {name:"The Purple Power Stripe",suit:"Purple Chalk Stripe",shirt:"Crisp White Poplin",tie:"Silver Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxford",belt:"Black leather",socks:"Charcoal or purple",watch:"Silver dress watch",occasion:"Creative formal, brand events, bold presentations",archetype:"Avant-Garde",confidence:4,tip:"Purple chalk stripe with white and silver — the stripe and the suit do the work. You just wear it.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Regal Gold",suit:"Purple Chalk Stripe",shirt:"Crisp White Poplin",tie:"Gold Solid",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or purple",watch:"Gold watch",occasion:"Gallery, fashion events, creative leadership",archetype:"Avant-Garde",confidence:5,tip:"Gold on white on purple chalk stripe is the most regal statement in modern menswear.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Stripe",suit:"Purple Chalk Stripe",shirt:"Pale Grey Poplin",tie:"Silver Grenadine",pocketSquare:"Silver Silk — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, gallery, arts events",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver and purple stripe — cool monochromatic dressing at its most sophisticated.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Tonal Purple",suit:"Purple Chalk Stripe",shirt:"Pale Lavender Poplin",tie:"Charcoal Solid",pocketSquare:"Lavender Silk — Puff Fold",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Fashion events, creative leadership, bold occasions",archetype:"Avant-Garde",confidence:5,tip:"Full tonal purple dressing — charcoal tie is the only anchor that makes it work.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Burgundy Stripe",suit:"Purple Chalk Stripe",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative business, brand meetings, smart formal",archetype:"Italian",confidence:3,tip:"Burgundy knit softens purple chalk stripe — the most approachable way to wear this suit.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Navy Anchor",suit:"Purple Chalk Stripe",shirt:"Crisp White Poplin",tie:"Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy or charcoal",watch:"Silver watch",occasion:"Creative business formal, important meetings",archetype:"British Classic",confidence:3,tip:"Navy grounds purple chalk stripe — the most restrained way to wear a bold suit.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Purple chalk stripe is vertical ambition in cloth — the stripe says power, the colour says personality."
  },

  "purple|glen_plaid": {
    suit: { colorFamily:"Purple Glen Plaid", undertones:"Cool violet with check complexity", fabric:"Wool blend, ~240 g/m2", pattern:"Glen Plaid", formality:"Smart Casual / Creative", lapel:"Notch lapel", fit:"Slim or classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White and solid — always. Purple glen plaid is complex enough without adding shirt pattern.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver is the most refined solid tie for purple plaid — cool and aristocratic."},
        {id:2,name:"Solid Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit grounds the purple check with cool textural authority."},
        {id:3,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy anchors the complex purple plaid with restrained cool authority."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the purple check — the regal contrast that elevates the plaid."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit is the warmest anchor for purple glen plaid."},
        {id:6,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white on purple plaid is the most graphic check statement."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against purple glen plaid — the cool register deepens without competing with the check.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Silver Pocket Square",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Silver and grey on purple plaid — the complete cool monochromatic check palette."},
        {id:2,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy is always the essential anchor in a cool palette."},
        {id:3,name:"Solid Gold",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey-purple check with regal warmth."},
        {id:4,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm contrast against the cool grey-purple register."},
        {id:5,name:"Solid Charcoal",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens grey — the darkest coolest anchor for purple plaid."},
        {id:6,name:"Solid Mauve Knit",color:"#C8A2C8",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal mauve knit on grey on purple plaid — the most daring check combination."},
      ]},
      { id:3, name:"Pale Lavender Poplin", colorCode:"#E6E6FA", why:"Lavender shirt on purple glen plaid is full tonal commitment — the check is the visual anchor.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Lavender Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal anchors the tonal purple-lavender plaid palette."},
        {id:2,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds lavender-purple plaid with deliberate cool authority."},
        {id:3,name:"Solid Silver",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the tonal palette refined and aristocratic."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold illuminates the lavender-purple plaid with regal warmth."},
        {id:5,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy prevents lavender-purple from feeling cold."},
        {id:6,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black is the maximum contrast anchor in a tonal purple-lavender plaid."},
      ]},
    ],
    packages:[
      {name:"The Purple Check Authority",suit:"Purple Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Silver Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal or purple",watch:"Silver watch",occasion:"Creative formal, gallery, bold meetings",archetype:"Avant-Garde",confidence:4,tip:"White and silver anchor the purple plaid — the check does all the visual work.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Gold Plaid",suit:"Purple Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Gold Knit",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or purple",watch:"Gold watch",occasion:"Creative events, brand launches, fashion occasions",archetype:"Avant-Garde",confidence:5,tip:"Gold knit on white on purple plaid — regal warmth through the coolest check.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Plaid",suit:"Purple Glen Plaid",shirt:"Pale Grey Poplin",tie:"Solid Silver Grenadine",pocketSquare:"Silver Pocket Square — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Gallery, arts events, creative formal",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver and purple plaid — the coolest possible approach to a bold check suit.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Tonal Purple Plaid",suit:"Purple Glen Plaid",shirt:"Pale Lavender Poplin",tie:"Solid Charcoal Grenadine",pocketSquare:"Lavender Silk — Puff Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Fashion events, creative leadership, bold occasions",archetype:"Avant-Garde",confidence:5,tip:"Full tonal purple plaid — charcoal tie is the non-negotiable anchor.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Burgundy Plaid",suit:"Purple Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative business, smart casual bold",archetype:"Italian",confidence:3,tip:"Burgundy knit makes purple glen plaid more approachable — the warmest anchor for a cool check.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Navy Anchor",suit:"Purple Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy or charcoal",watch:"Silver watch",occasion:"Creative business formal, client meetings in purple",archetype:"British Classic",confidence:3,tip:"Navy is the most restrained anchor for purple plaid — grounding without diminishing.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Purple glen plaid is pattern and colour at their most ambitious — wear it only when you are prepared to be the most interesting man in the room."
  },

  "purple|herringbone": {
    suit: { colorFamily:"Purple Herringbone", undertones:"Cool violet with textural depth", fabric:"Wool herringbone, ~280 g/m2", pattern:"Herringbone", formality:"Smart Casual / Creative Formal", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White cuts cleanly through purple herringbone texture — the simplest foundation for a complex fabric.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver on white on purple herringbone — aristocratic texture pairing."},
        {id:2,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit echoes the herringbone texture with cool authority."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold knit warms the purple herringbone with regal textural contrast."},
        {id:4,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds the purple texture with restrained cool authority."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit against purple herringbone — warm depth through shared tonal warmth."},
        {id:6,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on white on purple herringbone is the most graphic texture statement."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against purple herringbone — cool tonal register, letting the texture do the work.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Silver Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Silver and grey and purple herringbone — the complete cool texture palette."},
        {id:2,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens grey — the darkest cool anchor for purple herringbone."},
        {id:3,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold provides regal warmth against the cool grey-purple texture."},
        {id:4,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy knit echoes the herringbone weave — texture harmony with cool authority."},
        {id:5,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm contrast against the cool textured grey-purple palette."},
        {id:6,name:"Mauve Knit",color:"#C8A2C8",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal mauve knit on grey on purple herringbone — the most daring texture move."},
      ]},
      { id:3, name:"Pale Lavender Poplin", colorCode:"#E6E6FA", why:"Lavender against purple herringbone — full tonal commitment, the weave is the visual distinction.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Lavender Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal anchors the tonal purple-lavender herringbone palette."},
        {id:2,name:"Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the tonal texture palette refined and aristocratic."},
        {id:3,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds lavender-purple herringbone with cool deliberate authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold illuminates the lavender-purple herringbone with regal warmth."},
        {id:5,name:"Burgundy Solid",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy prevents lavender-purple from feeling cold."},
        {id:6,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black is the maximum contrast anchor in a tonal purple herringbone."},
      ]},
    ],
    packages:[
      {name:"The Texture Authority",suit:"Purple Herringbone",shirt:"Crisp White Poplin",tie:"Silver Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal or purple",watch:"Silver dress watch",occasion:"Creative formal, gallery, bold presentations",archetype:"Avant-Garde",confidence:4,tip:"White and silver on purple herringbone — the texture provides the complexity.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Gold Texture",suit:"Purple Herringbone",shirt:"Crisp White Poplin",tie:"Gold Knit",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or purple",watch:"Gold watch",occasion:"Creative events, brand launches, bold formal",archetype:"Avant-Garde",confidence:5,tip:"Gold knit echoes herringbone texture while providing regal complementary warmth.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Texture",suit:"Purple Herringbone",shirt:"Pale Grey Poplin",tie:"Silver Grenadine",pocketSquare:"Silver Silk — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Gallery, arts events, creative formal",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver and purple herringbone — the coolest most textured approach.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Tonal Texture",suit:"Purple Herringbone",shirt:"Pale Lavender Poplin",tie:"Charcoal Grenadine",pocketSquare:"Lavender Silk — Puff Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Fashion events, creative leadership",archetype:"Avant-Garde",confidence:5,tip:"Full tonal purple herringbone — charcoal tie is the structural anchor.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Burgundy Texture",suit:"Purple Herringbone",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative business, smart bold casual",archetype:"Italian",confidence:3,tip:"Burgundy knit makes purple herringbone more approachable — warmth through texture.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Charcoal Knit",suit:"Purple Herringbone",shirt:"Pale Grey Poplin",tie:"Charcoal Grenadine",pocketSquare:"Silver Silk — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative business formal, meetings",archetype:"British Classic",confidence:3,tip:"Charcoal on grey on purple herringbone — the most restrained textured approach.",shirtColor:"#D3D3D3",tieColor:"#36454F"},
    ],
    styleMantra:"Purple herringbone is texture with personality — the weave says craft, the colour says character."
  },

  "purple|tweed": {
    suit: { colorFamily:"Purple Tweed", undertones:"Cool violet with rough country character", fabric:"Tweed, ~360 g/m2", pattern:"Tweed", formality:"Smart Casual / Creative Country", lapel:"Notch lapel", fit:"Classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against purple tweed — the crispness against the rough weave is the entire point.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver knit against purple tweed — the knit texture honours the weave."},
        {id:2,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit grounds purple tweed with cool textural authority."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold knit against purple tweed — regal warmth through country texture."},
        {id:4,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit echoes purple tweed through shared warm-cool depth."},
        {id:5,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy grenadine against purple tweed — the silk-against-wool texture contrast."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green knit on purple tweed is the most unexpected country combination."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against purple tweed — cool refinement against rough texture.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Silver Pocket Square",fold:"Flat Fold",material:"Linen"}, ties:[
        {id:1,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Silver knit and grey and purple tweed — cool monochromatic country dressing."},
        {id:2,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit deepens the grey — the darkest cool anchor for purple tweed."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey-purple tweed palette."},
        {id:4,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy knit provides warm contrast in an otherwise cool palette."},
        {id:5,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy knit echoes the weave — texture harmony with cool tonal authority."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green knit introduces country warmth into the cool grey-purple tweed."},
      ]},
      { id:3, name:"Pale Lavender Poplin", colorCode:"#E6E6FA", why:"Lavender against purple tweed — full tonal commitment through rough country cloth.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Lavender Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Charcoal knit is the essential anchor in a tonal purple-lavender tweed palette."},
        {id:2,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver knit keeps the tonal palette refined against the rough tweed."},
        {id:3,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy knit grounds lavender-purple tweed with deliberate cool authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold knit illuminates the lavender-purple tweed with regal warmth."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy prevents the tonal palette from feeling cold."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green introduces country warmth into the tonal purple-lavender tweed."},
      ]},
    ],
    packages:[
      {name:"The Purple Country",suit:"Purple Tweed",shirt:"Crisp White Poplin",tie:"Silver Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Charcoal or purple",watch:"Silver field watch",occasion:"Country creative, outdoor events, weekend bold",archetype:"Country",confidence:4,tip:"Brown suede brogues ground purple tweed — the country shoe for a country suit.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Gold Country",suit:"Purple Tweed",shirt:"Crisp White Poplin",tie:"Gold Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Derby",belt:"Tan leather",socks:"Gold or purple",watch:"Gold watch",occasion:"Creative events, gallery, bold country occasions",archetype:"Avant-Garde",confidence:5,tip:"Gold knit on white on purple tweed — regal warmth through the roughest cloth.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Country",suit:"Purple Tweed",shirt:"Pale Grey Poplin",tie:"Silver Knit",pocketSquare:"Silver Pocket Square — Flat Fold",shoes:"Black Derby",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative country, arts events, bold casual",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver knit on purple tweed — the coolest country combination.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Tonal Country",suit:"Purple Tweed",shirt:"Pale Lavender Poplin",tie:"Charcoal Knit",pocketSquare:"Lavender Linen — Casual Puff",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Charcoal",watch:"Silver watch",occasion:"Creative country, bold weekend, outdoor events",archetype:"Avant-Garde",confidence:5,tip:"Full tonal purple tweed — charcoal knit is the structural anchor that makes it work.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Burgundy Country",suit:"Purple Tweed",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Dark Brown Brogues",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative casual, smart country events",archetype:"British",confidence:3,tip:"Burgundy knit makes purple tweed approachable — warm depth through textural country cloth.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Forest Country",suit:"Purple Tweed",shirt:"Pale Grey Poplin",tie:"Forest Green Knit",pocketSquare:"Silver Pocket Square — Flat Fold",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Forest green or charcoal",watch:"Field watch",occasion:"Country creative, outdoor, weekend",archetype:"Country",confidence:4,tip:"Forest green knit on grey on purple tweed — the most unexpected country combination.",shirtColor:"#D3D3D3",tieColor:"#355E3B"},
    ],
    styleMantra:"Purple tweed is where regal meets rustic — the cloth of the avant-garde country gentleman."
  },

  "purple|linen": {
    suit: { colorFamily:"Purple Linen", undertones:"Cool violet, summer relaxed", fabric:"Linen / Cotton-Linen blend, ~180 g/m2", pattern:"Linen plain weave", formality:"Smart Casual / Summer Creative", lapel:"Notch lapel", fit:"Relaxed or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against purple linen — clean foundation for a bold summer suit.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver knit against white against purple linen — aristocratic summer restraint."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy grounds the purple linen with cool authority — the most controlled summer choice."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold against purple linen is regal summer warmth — the most striking choice."},
        {id:4,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit grounds purple linen with warm tonal depth."},
        {id:5,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal is the coolest, most restrained anchor for purple linen."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green is the most unexpected complement to purple linen — natural against regal."},
      ]},
      { id:2, name:"Pale Lavender Linen", colorCode:"#E6E6FA", why:"Lavender linen against purple linen — full tonal texture-on-texture summer commitment.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"Lavender Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Charcoal knit anchors the tonal lavender-purple linen palette."},
        {id:2,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver knit keeps the tonal palette refined in summer weight."},
        {id:3,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy grounds lavender-purple linen with cool deliberate authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold illuminates the tonal purple-lavender with regal summer warmth."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy prevents the tonal summer palette from feeling cold."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green introduces natural warmth into the tonal purple-lavender linen."},
      ]},
      { id:3, name:"Pale Grey Linen", colorCode:"#D3D3D3", why:"Grey linen against purple linen — cool texture-on-texture summer combination.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"Grey Linen",fold:"Puff",material:"Linen"}, ties:[
        {id:1,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Silver knit and grey linen and purple — cool summer monochromatic at its most considered."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Navy grounds the cool grey-purple linen palette."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey-purple linen with regal summer contrast."},
        {id:4,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal deepens the cool palette — the darkest anchor for purple linen."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Burgundy provides warm contrast against the cool grey-purple linen."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green introduces natural warmth into the grey-purple summer palette."},
      ]},
    ],
    packages:[
      {name:"The Purple Summer",suit:"Purple Linen",shirt:"Crisp White Poplin",tie:"Silver Knit",pocketSquare:"White Linen — Casual Puff",shoes:"White Canvas Loafers",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Summer creative events, outdoor formal, resort",archetype:"Avant-Garde",confidence:4,tip:"Purple linen with white and silver — the most controlled way to wear a purple summer suit.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Gold Summer",suit:"Purple Linen",shirt:"Crisp White Poplin",tie:"Gold Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Gold casual",occasion:"Creative events, gallery, summer bold occasions",archetype:"Avant-Garde",confidence:5,tip:"Gold knit on white on purple linen — regal warmth in the lightest summer fabric.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Tonal Linen",suit:"Purple Linen",shirt:"Pale Lavender Linen",tie:"Charcoal Knit",pocketSquare:"Lavender Linen — Casual Puff",shoes:"White Canvas",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Summer fashion events, resort creative, bold outdoor",archetype:"Avant-Garde",confidence:5,tip:"Linen-on-linen tonal purple — charcoal knit is the non-negotiable structural anchor.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Cool Summer",suit:"Purple Linen",shirt:"Pale Grey Linen",tie:"Silver Knit",pocketSquare:"Grey Linen — Puff",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Silver watch",occasion:"Summer gallery, creative events, bold summer formal",archetype:"Avant-Garde",confidence:4,tip:"Grey linen and silver knit on purple — the coolest summer monochromatic approach.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Burgundy Linen",suit:"Purple Linen",shirt:"Crisp White Poplin",tie:"Burgundy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold casual",occasion:"Creative summer casual, smart bold outdoor",archetype:"Italian",confidence:3,tip:"Burgundy knit makes purple linen more approachable — warm depth in a summer suit.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Navy Linen",suit:"Purple Linen",shirt:"Crisp White Poplin",tie:"Navy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"White Oxford",belt:"White leather",socks:"Navy",watch:"Silver watch",occasion:"Creative summer formal, meetings, important events",archetype:"British Classic",confidence:3,tip:"Navy knit is the most restrained anchor for purple linen — grounding the colour with cool authority.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Purple linen is summer daring at its lightest — the colour is the statement, the linen is the proof you know what you are doing."
  },


  "red|solid": {
    suit: { colorFamily:"Red / Crimson / Scarlet", undertones:"Warm bold, high saturation", fabric:"Wool twill, ~260 g/m2", pattern:"Solid", formality:"Creative Formal / Bold Smart Casual", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is the only foundation for a red suit — it provides the contrast that stops the look from overwhelming.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Black Grenadine Solid",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on red and white is the boldest graphic statement in menswear — wear it with total conviction."},
        {id:2,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy against red is the most restrained choice — it cools the suit without competing."},
        {id:3,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal grounds red into something serious — the most authoritative muted choice."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and red is warm luxury — the Italian opera house combination."},
        {id:5,name:"Ivory Silk Solid",color:"#FFFFF0",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Ivory softens the red into something warmer and more approachable than pure white."},
        {id:6,name:"Dark Teal Grenadine",color:"#008080",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Teal against red is the boldest complementary contrast — for the genuinely fearless."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against red suit is cool sophistication — it reduces the temperature of the combination without diminishing the suit.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on grey on red is maximum cool graphic authority — the editorial choice."},
        {id:2,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy cools the red and grey palette — restrained and deliberate."},
        {id:3,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens the grey into a complete cool palette against the red."},
        {id:4,name:"Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver on grey on red is a cool monochromatic approach to a warm suit."},
        {id:5,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey palette while echoing the red warmth."},
        {id:6,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy and red are tonal neighbours — the most sophisticated muted choice."},
      ]},
      { id:3, name:"Black Poplin", colorCode:"#1a1a1a", why:"Black against red suit is maximum contrast — graphic, bold, and entirely for the fearlessly confident.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Black-on-black with red suit — tonal shirt and tie against the red. Maximum editorial graphic."},
        {id:2,name:"White Solid",color:"#F8F8F8",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"White tie on black shirt on red suit — the most graphic three-tone combination possible."},
        {id:3,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver on black on red — cool metallic precision against the boldest suit."},
        {id:4,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Gold on black on red is pure theatre — regal, graphic, completely deliberate."},
        {id:5,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy on black on red creates a cool graphic palette of real dramatic authority."},
        {id:6,name:"Dark Teal",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Teal on black on red is the most daring complementary combination — for the absolutely fearless."},
      ]},
    ],
    packages:[
      {name:"The Scarlet Authority",suit:"Red Solid",shirt:"Crisp White Poplin",tie:"Black Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxfords",belt:"Black leather",socks:"Black",watch:"Silver dress watch",occasion:"Creative formal, fashion events, bold presentations",archetype:"Avant-Garde",confidence:5,tip:"Red suit, white shirt, black tie — the most graphic combination possible. Wear it only when you intend to dominate.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Navy Restraint",suit:"Red Solid",shirt:"Crisp White Poplin",tie:"Navy Solid",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy",watch:"Silver watch",occasion:"Creative business, bold meetings, brand events",archetype:"British Classic",confidence:3,tip:"Navy is the most controlled tie on a red suit — it grounds the colour without competing.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Gold Opera",suit:"Red Solid",shirt:"Crisp White Poplin",tie:"Gold Knit",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or burgundy",watch:"Gold dress watch",occasion:"Gala, opera, cultural events, formal bold",archetype:"Avant-Garde",confidence:4,tip:"Gold and red is the most deliberately luxurious combination — wear it at events that match its ambition.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Grey",suit:"Red Solid",shirt:"Pale Grey Poplin",tie:"Black Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver dress watch",occasion:"Creative formal, gallery, editorial events",archetype:"Avant-Garde",confidence:4,tip:"Grey shirt cools the red — the most sophisticated approach to a bold warm suit.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Black Graphic",suit:"Red Solid",shirt:"Black Poplin",tie:"Silver Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Black",watch:"Silver watch",occasion:"Fashion events, creative black-tie, editorial formal",archetype:"Avant-Garde",confidence:5,tip:"Black shirt on red suit is maximum editorial statement — silver tie is the only element that makes it wearable.",shirtColor:"#1a1a1a",tieColor:"#A9A9A9"},
      {name:"The Charcoal Authority",suit:"Red Solid",shirt:"Crisp White Poplin",tie:"Charcoal Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver dress watch",occasion:"Creative formal, important bold meetings",archetype:"Italian",confidence:4,tip:"Charcoal on white on red — the most serious and authoritative approach to this suit.",shirtColor:"#F8F8F8",tieColor:"#36454F"},
    ],
    styleMantra:"A red suit is not worn — it is performed. Step into it only when you are ready for every eye in the room to find you first."
  },

  "red|chalk_stripe": {
    suit: { colorFamily:"Red Chalk Stripe", undertones:"Warm bold with vertical structure", fabric:"Wool twill, ~260 g/m2", pattern:"Chalk Stripe", formality:"Creative Formal / Bold", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White and solid — the only foundation for red chalk stripe. The stripe provides all the complexity needed.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on red chalk stripe and white — the most graphic bold-stripe statement possible."},
        {id:2,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the red stripe with cool authority — the most restrained choice."},
        {id:3,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal is the coolest muted anchor for red chalk stripe."},
        {id:4,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold against red chalk stripe — warm luxury, the stripe provides the structure."},
        {id:5,name:"Ivory Solid",color:"#FFFFF0",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Ivory against red chalk stripe is warmer than white — softer bold."},
        {id:6,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the palette cool and metallic against the red stripe."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against red chalk stripe creates cool graphic tension — the stripe becomes more architectural.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on grey on red chalk stripe — maximum cool graphic editorial."},
        {id:2,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy deepens the cool register — restrained authority on a bold stripe."},
        {id:3,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver and grey on red chalk stripe — the coolest metallic approach."},
        {id:4,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens grey — the darkest cool anchor for red chalk stripe."},
        {id:5,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey palette against the red stripe."},
        {id:6,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy is tonal with red — the most sophisticated warm anchor."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against red chalk stripe is warmer than white — the stripe becomes more editorial, less graphic.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on ivory on red chalk stripe — maximum contrast with warm base."},
        {id:2,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the ivory-red palette with cool authority."},
        {id:3,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and ivory and red chalk stripe — the warmest editorial palette."},
        {id:4,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal grounds the warm ivory-red into something serious."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy is tonal with red — on ivory background it creates warm depth."},
        {id:6,name:"Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver cools the warm ivory-red palette into something more refined."},
      ]},
    ],
    packages:[
      {name:"The Red Power Stripe",suit:"Red Chalk Stripe",shirt:"Crisp White Poplin",tie:"Black Solid",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxford",belt:"Black leather",socks:"Black",watch:"Silver dress watch",occasion:"Fashion events, bold formal, creative leadership",archetype:"Avant-Garde",confidence:5,tip:"Red chalk stripe, white, black — the most graphic stripe statement in menswear. Nothing else comes close.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Cool Red Stripe",suit:"Red Chalk Stripe",shirt:"Pale Grey Poplin",tie:"Black Solid",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, editorial, gallery events",archetype:"Avant-Garde",confidence:4,tip:"Grey cools the red chalk stripe into something more architectural — black tie makes it decisive.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Navy Anchor",suit:"Red Chalk Stripe",shirt:"Crisp White Poplin",tie:"Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy",watch:"Silver watch",occasion:"Creative business, brand events, bold meetings",archetype:"British Classic",confidence:3,tip:"Navy is the most restrained tie on red chalk stripe — grounding without diminishing.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Gold Stripe",suit:"Red Chalk Stripe",shirt:"Ivory Cream Poplin",tie:"Gold Solid",pocketSquare:"Ivory Silk — One Point",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or burgundy",watch:"Gold watch",occasion:"Gala, bold formal, cultural events",archetype:"Avant-Garde",confidence:5,tip:"Gold and ivory on red chalk stripe — the warmest editorial palette in bold menswear.",shirtColor:"#FFFFF0",tieColor:"#C9A84C"},
      {name:"The Silver Cool",suit:"Red Chalk Stripe",shirt:"Pale Grey Poplin",tie:"Silver Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, fashion events",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver on red chalk stripe is the coolest possible bold-stripe look.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Charcoal Stripe",suit:"Red Chalk Stripe",shirt:"Crisp White Poplin",tie:"Charcoal Solid",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, important bold meetings",archetype:"Italian",confidence:3,tip:"Charcoal on white on red chalk stripe — serious, authoritative, the most wearable bold-stripe approach.",shirtColor:"#F8F8F8",tieColor:"#36454F"},
    ],
    styleMantra:"Red chalk stripe is vertical fire — the stripe gives the boldness structure, the colour gives it soul."
  },

  "red|glen_plaid": {
    suit: { colorFamily:"Red Glen Plaid", undertones:"Warm bold with check complexity", fabric:"Wool blend, ~240 g/m2", pattern:"Glen Plaid", formality:"Smart Casual / Creative Bold", lapel:"Notch lapel", fit:"Slim or classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White and solid — the only foundation for red glen plaid. The pattern is complex enough.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black grounds red glen plaid with maximum graphic authority — solid against the complex check."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy cools the red plaid — the most restrained solid tie choice."},
        {id:3,name:"Solid Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit grounds the red check — textural weight against pattern complexity."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold warms red glen plaid — the most luxurious solid tie choice on a bold check."},
        {id:5,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the plaid cool and metallic — refined against the warm red check."},
        {id:6,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy is tonal with red — a warm, sophisticated anchor for the bold plaid."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against red glen plaid creates cool graphic tension — the check becomes more deliberate.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on grey on red plaid — maximum cool graphic editorial on a check suit."},
        {id:2,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy keeps the cool grey-red plaid grounded with quiet authority."},
        {id:3,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver and grey on red plaid — the coolest metallic check approach."},
        {id:4,name:"Solid Charcoal",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens the grey — the darkest cool anchor for red glen plaid."},
        {id:5,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey palette against the red plaid."},
        {id:6,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy is the warmest tonal anchor on grey and red plaid."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against red glen plaid is warmer and more editorial than white — elevating the check.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on ivory on red plaid — maximum contrast with a warm ivory base."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the warm ivory-red check with cool deliberate authority."},
        {id:3,name:"Solid Gold",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and ivory and red plaid — the warmest editorial palette on a bold check."},
        {id:4,name:"Solid Charcoal",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal grounds the warm palette of ivory and red into something serious."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy and ivory on red plaid — tonal warmth across the entire palette."},
        {id:6,name:"Solid Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver cools the warm ivory-red check into something more refined."},
      ]},
    ],
    packages:[
      {name:"The Red Check Authority",suit:"Red Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Black",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Black",watch:"Silver watch",occasion:"Fashion events, creative formal, bold presentations",archetype:"Avant-Garde",confidence:5,tip:"Red plaid, white, black — the check is already the statement. The black tie is the anchor.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Navy Plaid",suit:"Red Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy",watch:"Silver watch",occasion:"Creative business, brand events, bold meetings",archetype:"British Classic",confidence:3,tip:"Navy is the most restrained solid on red plaid — it grounds without diminishing the check.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Cool Red Plaid",suit:"Red Glen Plaid",shirt:"Pale Grey Poplin",tie:"Solid Black",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, gallery, editorial events",archetype:"Avant-Garde",confidence:4,tip:"Grey cools the red check into something architectural — black tie makes it definitive.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Gold Plaid",suit:"Red Glen Plaid",shirt:"Ivory Cream Poplin",tie:"Solid Gold",pocketSquare:"Ivory Silk — One Point",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or burgundy",watch:"Gold watch",occasion:"Gala, cultural events, bold formal",archetype:"Avant-Garde",confidence:5,tip:"Gold and ivory on red plaid — the warmest editorial check palette in menswear.",shirtColor:"#FFFFF0",tieColor:"#C9A84C"},
      {name:"The Charcoal Plaid",suit:"Red Glen Plaid",shirt:"Crisp White Poplin",tie:"Solid Charcoal Knit",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, important bold meetings",archetype:"Italian",confidence:3,tip:"Charcoal knit on white on red plaid — serious and authoritative on a bold check suit.",shirtColor:"#F8F8F8",tieColor:"#36454F"},
      {name:"The Burgundy Plaid",suit:"Red Glen Plaid",shirt:"Ivory Cream Poplin",tie:"Solid Burgundy Knit",pocketSquare:"Ivory Silk — One Point",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative smart casual, brand events",archetype:"Italian",confidence:3,tip:"Burgundy knit on ivory on red plaid — tonal warmth making the bold check more approachable.",shirtColor:"#FFFFF0",tieColor:"#722F37"},
    ],
    styleMantra:"Red glen plaid is the check that demands a second look — and a third."
  },

  "red|herringbone": {
    suit: { colorFamily:"Red Herringbone", undertones:"Warm bold with textural depth", fabric:"Wool herringbone, ~280 g/m2", pattern:"Herringbone", formality:"Creative Formal / Smart Casual Bold", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White cuts cleanly through red herringbone — the weave is the texture story, white is the foundation.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on red herringbone and white is the most graphic texture statement."},
        {id:2,name:"Navy Solid",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the warm red texture with cool restrained authority."},
        {id:3,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit echoes the herringbone weave — textural harmony with cool authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold knit against red herringbone — warm luxury through textural contrast."},
        {id:5,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver cools the red herringbone texture — metallic precision against warm weave."},
        {id:6,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit is tonal with red herringbone — warm depth through texture."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against red herringbone creates cool graphic tension — the weave becomes more deliberate.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on grey on red herringbone — maximum cool graphic editorial texture."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit echoes the weave while cooling the warm red texture."},
        {id:3,name:"Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver and grey on red herringbone — the coolest metallic texture approach."},
        {id:4,name:"Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens the cool grey — the darkest anchor for red herringbone."},
        {id:5,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey palette against the red texture."},
        {id:6,name:"Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy is tonal with red — the warmest sophisticated anchor."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against red herringbone is warmer than white — the texture becomes more approachable.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Black Solid",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on ivory on red herringbone — maximum contrast with warm textured base."},
        {id:2,name:"Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the warm ivory-red texture with cool authority."},
        {id:3,name:"Gold Solid",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and ivory on red herringbone — the warmest editorial texture palette."},
        {id:4,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Charcoal knit grounds the warm palette of ivory and red herringbone."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit on ivory on red herringbone — tonal warmth through texture."},
        {id:6,name:"Silver Solid",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver cools the warm ivory-red herringbone into something more refined."},
      ]},
    ],
    packages:[
      {name:"The Red Texture Authority",suit:"Red Herringbone",shirt:"Crisp White Poplin",tie:"Black Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Black",watch:"Silver watch",occasion:"Creative formal, fashion events, bold presentations",archetype:"Avant-Garde",confidence:5,tip:"Red herringbone, white, black — the texture provides the drama, the black tie grounds it.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Cool Texture",suit:"Red Herringbone",shirt:"Pale Grey Poplin",tie:"Black Solid",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, gallery, editorial events",archetype:"Avant-Garde",confidence:4,tip:"Grey cools the red herringbone — the weave becomes architectural against the cool shirt.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Charcoal Knit",suit:"Red Herringbone",shirt:"Crisp White Poplin",tie:"Charcoal Knit",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative business, bold meetings",archetype:"Italian",confidence:3,tip:"Charcoal knit echoes the herringbone texture — the most considered approach to red herringbone.",shirtColor:"#F8F8F8",tieColor:"#36454F"},
      {name:"The Gold Texture",suit:"Red Herringbone",shirt:"Ivory Cream Poplin",tie:"Gold Solid",pocketSquare:"Ivory Silk — One Point",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or burgundy",watch:"Gold watch",occasion:"Gala, cultural events, bold formal",archetype:"Avant-Garde",confidence:5,tip:"Gold and ivory on red herringbone — the warmest and most luxurious texture editorial.",shirtColor:"#FFFFF0",tieColor:"#C9A84C"},
      {name:"The Navy Texture",suit:"Red Herringbone",shirt:"Crisp White Poplin",tie:"Navy Solid",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy",watch:"Silver watch",occasion:"Creative business, brand events",archetype:"British Classic",confidence:3,tip:"Navy is the most restrained choice on red herringbone — it grounds the warmth.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Burgundy Texture",suit:"Red Herringbone",shirt:"Ivory Cream Poplin",tie:"Burgundy Knit",pocketSquare:"Ivory Silk — One Point",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative smart casual, bold occasions",archetype:"Italian",confidence:3,tip:"Burgundy knit on ivory on red herringbone — tonal warmth making a bold texture approachable.",shirtColor:"#FFFFF0",tieColor:"#722F37"},
    ],
    styleMantra:"Red herringbone is fire with texture — the weave gives the boldness its craft, the colour gives it its soul."
  },

  "red|tweed": {
    suit: { colorFamily:"Red Tweed", undertones:"Warm bold with rough country character", fabric:"Tweed, ~360 g/m2", pattern:"Tweed", formality:"Smart Casual / Creative Country Bold", lapel:"Notch lapel", fit:"Classic fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against red tweed — crisp against rough, the maximum texture contrast.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Black Knit",color:"#1a1a1a",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Black knit on red tweed — the knit honours the weave, the black grounds the colour."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit grounds the red tweed with cool textural authority."},
        {id:3,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit echoes the tweed weave with cool muted authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold knit against red tweed — warm luxury through country texture."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit and red tweed — tonal warmth through the roughest cloth."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green on red tweed is the most unexpected country combination — bold and grounded."},
      ]},
      { id:2, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against red tweed — warm against rough, the most natural combination for a bold country suit.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Black Knit",color:"#1a1a1a",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Black knit on ivory on red tweed — maximum contrast with warm textured base."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit grounds the warm ivory-red tweed with cool country authority."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and ivory on red tweed — warm luxury through the roughest country cloth."},
        {id:4,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Charcoal knit grounds the warm palette into something deliberate."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy on ivory on red tweed — tonal warmth through country texture."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green and ivory on red tweed — natural warmth against bold country cloth."},
      ]},
      { id:3, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Grey against red tweed creates cool deliberate tension — the rough texture becomes more architectural.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"One Point",material:"Linen"}, ties:[
        {id:1,name:"Black Knit",color:"#1a1a1a",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Black knit on grey on red tweed — maximum cool graphic through country texture."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit deepens the cool grey against the warm red tweed."},
        {id:3,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver knit and grey on red tweed — the coolest metallic country approach."},
        {id:4,name:"Charcoal Knit",color:"#36454F",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal knit deepens the grey — the darkest cool anchor for red tweed."},
        {id:5,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey palette against the red tweed."},
        {id:6,name:"Forest Green Knit",color:"#355E3B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Forest green introduces country warmth into the cool grey-red tweed."},
      ]},
    ],
    packages:[
      {name:"The Red Country Bold",suit:"Red Tweed",shirt:"Crisp White Poplin",tie:"Black Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Black Derby Brogues",belt:"Black leather",socks:"Black",watch:"Silver watch",occasion:"Country creative, bold outdoor events, weekend formal",archetype:"Avant-Garde",confidence:4,tip:"Red tweed with white and black knit — the knit honours the weave, the black grounds the colour.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Warm Country",suit:"Red Tweed",shirt:"Ivory Cream Poplin",tie:"Gold Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Brown Suede Brogues",belt:"Brown suede",socks:"Gold or burgundy",watch:"Gold watch",occasion:"Creative country, outdoor formal, bold weekend",archetype:"Country",confidence:4,tip:"Gold and ivory on red tweed — the warmest country combination on a bold suit.",shirtColor:"#FFFFF0",tieColor:"#C9A84C"},
      {name:"The Navy Country",suit:"Red Tweed",shirt:"Crisp White Poplin",tie:"Navy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Black Derby",belt:"Black leather",socks:"Navy",watch:"Silver watch",occasion:"Creative country, smart casual bold",archetype:"British Classic",confidence:3,tip:"Navy knit is the most restrained anchor for red tweed — grounding the bold colour.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Cool Country",suit:"Red Tweed",shirt:"Pale Grey Poplin",tie:"Black Knit",pocketSquare:"White Linen — One Point",shoes:"Black Derby Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative country, gallery, bold casual",archetype:"Avant-Garde",confidence:4,tip:"Grey cools the red tweed — the rough texture becomes more deliberate against the cool shirt.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Burgundy Country",suit:"Red Tweed",shirt:"Ivory Cream Poplin",tie:"Burgundy Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Dark Brown Brogues",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative casual, country events, weekend bold",archetype:"British",confidence:3,tip:"Burgundy knit on ivory on red tweed — tonal warmth making the bold country suit more approachable.",shirtColor:"#FFFFF0",tieColor:"#722F37"},
      {name:"The Forest Country",suit:"Red Tweed",shirt:"Ivory Cream Poplin",tie:"Forest Green Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Brown Suede Derby",belt:"Brown suede",socks:"Forest green",watch:"Field watch",occasion:"Country creative, outdoor, weekend",archetype:"Country",confidence:4,tip:"Forest green knit on ivory on red tweed — the most unexpected country combination on a bold suit.",shirtColor:"#FFFFF0",tieColor:"#355E3B"},
    ],
    styleMantra:"Red tweed is fire in the field — the rough cloth contains the boldness and gives it credibility."
  },

  "red|linen": {
    suit: { colorFamily:"Red Linen", undertones:"Warm bold, summer relaxed", fabric:"Linen / Cotton-Linen blend, ~180 g/m2", pattern:"Linen plain weave", formality:"Smart Casual / Summer Creative Bold", lapel:"Notch lapel", fit:"Relaxed or slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White against red linen — the only clean foundation for a bold summer suit.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit is the most controlled anchor for red linen — cool authority in a summer bold suit."},
        {id:2,name:"Black Knit",color:"#1a1a1a",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Black knit on red linen and white — the most graphic summer bold statement."},
        {id:3,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal grounds the red linen with cool muted authority."},
        {id:4,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold against red linen — warm luxury in summer weight."},
        {id:5,name:"Ivory Solid",color:"#FFFFF0",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Ivory tie on white shirt on red linen — tonal warmth in a summer bold suit."},
        {id:6,name:"Teal Solid",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Teal against red linen is the boldest complementary summer contrast."},
      ]},
      { id:2, name:"Ivory Linen Shirt", colorCode:"#FFFFF0", why:"Ivory linen on red linen — texture-on-texture summer combination, warm against bold.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"Ivory Linen",fold:"Casual Puff",material:"Linen"}, ties:[
        {id:1,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit anchors the warm ivory-red linen palette with cool authority."},
        {id:2,name:"Black Knit",color:"#1a1a1a",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Black knit on ivory linen on red linen — maximum contrast with warm textured base."},
        {id:3,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and ivory on red linen — warm luxury in the lightest summer fabric."},
        {id:4,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Charcoal grounds the warm ivory-red palette into something serious."},
        {id:5,name:"Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy on ivory on red linen — tonal warmth making the bold suit approachable."},
        {id:6,name:"Teal Solid",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Teal against ivory on red linen — the boldest complementary summer palette."},
      ]},
      { id:3, name:"Pale Grey Linen", colorCode:"#D3D3D3", why:"Grey linen against red linen — cool texture-on-texture summer tension, the red becomes more deliberate.", collar:"Button-down collar", pattern:"Solid linen", pocketSquare:{name:"White Linen",fold:"Puff",material:"Linen"}, ties:[
        {id:1,name:"Black Knit",color:"#1a1a1a",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Black knit on grey linen on red linen — maximum cool graphic summer editorial."},
        {id:2,name:"Navy Knit",color:"#1B3A6B",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Navy knit grounds the cool grey linen against the red."},
        {id:3,name:"Silver Knit",color:"#A9A9A9",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver and grey linen on red — the coolest metallic summer approach."},
        {id:4,name:"Charcoal Solid",color:"#36454F",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Charcoal deepens the grey — the darkest cool anchor for red linen."},
        {id:5,name:"Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey linen palette against the red."},
        {id:6,name:"Teal Solid",color:"#008080",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Complementary",why:"Teal on grey linen on red linen — the boldest complementary cool summer statement."},
      ]},
    ],
    packages:[
      {name:"The Red Summer Bold",suit:"Red Linen",shirt:"Crisp White Poplin",tie:"Navy Knit",pocketSquare:"White Linen — Casual Puff",shoes:"White Canvas Loafers",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Summer creative events, resort bold, outdoor formal",archetype:"Avant-Garde",confidence:4,tip:"Red linen with white and navy knit — the most controlled bold summer combination.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Black Summer Graphic",suit:"Red Linen",shirt:"Crisp White Poplin",tie:"Black Knit",pocketSquare:"White Linen — Casual Puff",shoes:"Black Canvas Sneakers",belt:"None",socks:"No-show",watch:"Silver casual",occasion:"Fashion events, creative bold, summer editorial",archetype:"Avant-Garde",confidence:5,tip:"Red linen, white, black knit — the most graphic summer bold statement. Own it completely.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Gold Summer",suit:"Red Linen",shirt:"Ivory Linen Shirt",tie:"Gold Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Tan Suede Loafers",belt:"None",socks:"No-show",watch:"Gold casual",occasion:"Summer gala, resort bold, outdoor cultural events",archetype:"Avant-Garde",confidence:5,tip:"Gold and ivory on red linen — warm luxury in the lightest bold summer fabric.",shirtColor:"#FFFFF0",tieColor:"#C9A84C"},
      {name:"The Cool Summer",suit:"Red Linen",shirt:"Pale Grey Linen",tie:"Black Knit",pocketSquare:"White Linen — Puff",shoes:"White Derby",belt:"White leather",socks:"No-show",watch:"Silver watch",occasion:"Summer gallery, creative events, bold summer formal",archetype:"Avant-Garde",confidence:4,tip:"Grey linen cools the red into something architectural — black knit makes it decisive.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Teal Summer",suit:"Red Linen",shirt:"Ivory Linen Shirt",tie:"Teal Solid",pocketSquare:"Ivory Linen — Casual Puff",shoes:"White Canvas",belt:"None",socks:"No-show",watch:"Gold sport",occasion:"Resort, tropical events, bold summer social",archetype:"Avant-Garde",confidence:5,tip:"Teal and ivory on red linen — the boldest complementary summer palette. Wear it at the right venue.",shirtColor:"#FFFFF0",tieColor:"#008080"},
      {name:"The Burgundy Summer",suit:"Red Linen",shirt:"Ivory Linen Shirt",tie:"Burgundy Knit",pocketSquare:"Ivory Linen — Casual Puff",shoes:"Brown Derby",belt:"Brown leather",socks:"Burgundy",watch:"Gold casual",occasion:"Creative summer casual, smart bold outdoor",archetype:"Italian",confidence:3,tip:"Burgundy knit on ivory on red linen — tonal warmth making the bold summer suit approachable.",shirtColor:"#FFFFF0",tieColor:"#722F37"},
    ],
    styleMantra:"Red linen is summer without a single compromise — bold, warm, and utterly deliberate in the lightest cloth possible."
  },

"purple|houndstooth": {
    suit: { colorFamily:"Purple Houndstooth", undertones:"Cool violet with geometric check character", fabric:"Wool houndstooth, ~280 g/m2", pattern:"Houndstooth", formality:"Creative Formal / Smart Casual", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is non-negotiable with purple houndstooth — the geometric pattern needs the cleanest possible foundation.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver is the most elegant companion to purple houndstooth — cool, restrained, aristocratic."},
        {id:2,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal grounds the purple check with cool authority."},
        {id:3,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy cools and deepens the purple houndstooth — quiet authority through tonal depth."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold against purple houndstooth is regal and warm — the knit texture keeps it from feeling overdressed."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy and purple share deep warm tones — a sophisticated tonal anchor for a bold check."},
        {id:6,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on purple houndstooth and white is the most graphic statement — maximum cool contrast."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Cool grey against purple houndstooth continues the cool register — the check becomes more architectural.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"Silver Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Monochromatic",why:"Silver and grey and purple houndstooth — a complete cool monochromatic palette."},
        {id:2,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens the grey into a complete cool anchor against the purple check."},
        {id:3,name:"Solid Navy",color:"#1B3A6B",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy stays in the cool register — deepening the palette with quiet authority."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey-purple check palette with regal contrast."},
        {id:5,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Burgundy provides warm depth against the cool grey-purple register."},
        {id:6,name:"Solid Mauve Knit",color:"#C8A2C8",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Monochromatic",why:"Tonal mauve knit on grey on purple houndstooth — the most daring monochromatic check move."},
      ]},
      { id:3, name:"Pale Lavender Poplin", colorCode:"#E6E6FA", why:"Lavender against purple houndstooth is full tonal commitment — the geometric check provides the only contrast.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Lavender Silk",fold:"Puff Fold",material:"Silk"}, ties:[
        {id:1,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal is the essential anchor in a fully tonal purple-lavender houndstooth palette."},
        {id:2,name:"Solid Silver",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the tonal palette refined and aristocratic against the bold check."},
        {id:3,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Navy grounds the lavender-purple check with cool deliberate authority."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold illuminates the entire lavender-purple houndstooth with regal warmth."},
        {id:5,name:"Solid Burgundy",color:"#722F37",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy is the warm note that prevents the tonal lavender-purple from feeling cold."},
        {id:6,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black anchors the tonal purple-lavender houndstooth with maximum contrast."},
      ]},
    ],
    packages:[
      {name:"The Purple Check Authority",suit:"Purple Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Silver Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxford",belt:"Black calf leather",socks:"Charcoal or purple",watch:"Silver dress watch",occasion:"Creative formal, gallery opening, bold presentations",archetype:"Avant-Garde",confidence:4,tip:"Purple houndstooth with white and silver — the geometric check does all the visual work. Keep everything else impeccably plain.",shirtColor:"#F8F8F8",tieColor:"#A9A9A9"},
      {name:"The Gold Regal Check",suit:"Purple Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Gold Knit",pocketSquare:"White Linen — TV Fold",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or purple",watch:"Gold dress watch",occasion:"Creative events, brand launches, bold formal",archetype:"Avant-Garde",confidence:5,tip:"Gold knit on white on purple houndstooth — the knit texture prevents it from feeling overdressed.",shirtColor:"#F8F8F8",tieColor:"#C9A84C"},
      {name:"The Cool Monochrome Check",suit:"Purple Houndstooth",shirt:"Pale Grey Poplin",tie:"Solid Silver Grenadine",pocketSquare:"Silver Silk — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver dress watch",occasion:"Gallery, arts events, creative formal",archetype:"Avant-Garde",confidence:4,tip:"Grey and silver and purple houndstooth — the coolest most sophisticated approach to a bold check suit.",shirtColor:"#D3D3D3",tieColor:"#A9A9A9"},
      {name:"The Tonal Purple Check",suit:"Purple Houndstooth",shirt:"Pale Lavender Poplin",tie:"Solid Charcoal Grenadine",pocketSquare:"Lavender Silk — Puff Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Fashion events, creative leadership, bold occasions",archetype:"Avant-Garde",confidence:5,tip:"Full tonal purple houndstooth — charcoal grenadine is the non-negotiable anchor.",shirtColor:"#E6E6FA",tieColor:"#36454F"},
      {name:"The Burgundy Check",suit:"Purple Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Burgundy Knit",pocketSquare:"White Linen — TV Fold",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative business, smart bold events",archetype:"Italian",confidence:3,tip:"Burgundy knit makes purple houndstooth more approachable — shared warm tones bridge the bold check elegantly.",shirtColor:"#F8F8F8",tieColor:"#722F37"},
      {name:"The Navy Anchor Check",suit:"Purple Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy or charcoal",watch:"Silver watch",occasion:"Creative business formal, important meetings in purple",archetype:"British Classic",confidence:3,tip:"Navy is the most restrained tie on purple houndstooth — it grounds the colour and the check without competing with either.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
    ],
    styleMantra:"Purple houndstooth is geometric ambition and regal colour in one cloth — wear it only when you are prepared to be the most deliberate man in the room."
  },

  "red|houndstooth": {
    suit: { colorFamily:"Red Houndstooth", undertones:"Warm bold with architectural check", fabric:"Wool houndstooth, ~300 g/m2", pattern:"Houndstooth", formality:"Creative Formal / Bold Smart Casual", lapel:"Notch lapel", fit:"Slim fit" },
    shirts: [
      { id:1, name:"Crisp White Poplin", colorCode:"#F8F8F8", why:"White is the only shirt that can ground a red houndstooth — maximum contrast, clean foundation, no competition.", collar:"Spread collar", pattern:"Solid", pocketSquare:{name:"White Irish Linen",fold:"TV Fold",material:"Irish Linen"}, ties:[
        {id:1,name:"Solid Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on red houndstooth and white is the boldest graphic check statement — solid tie is the only option."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy cools the warm red check with restrained authority — the most controlled choice on a bold suit."},
        {id:3,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal grounds the red houndstooth with cool muted authority — serious and completely correct."},
        {id:4,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold against red houndstooth is warm luxury — the knit texture adds tactile interest without competing with the check."},
        {id:5,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver keeps the palette cool and metallic — refined precision against the bold warm check."},
        {id:6,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy is tonal with red — a warm sophisticated anchor that makes the houndstooth more approachable."},
      ]},
      { id:2, name:"Pale Grey Poplin", colorCode:"#D3D3D3", why:"Cool grey against red houndstooth creates deliberate temperature tension — the check becomes more architectural.", collar:"Semi-spread collar", pattern:"Solid", pocketSquare:{name:"White Cotton",fold:"One Point",material:"Cotton"}, ties:[
        {id:1,name:"Solid Black Grenadine",color:"#1a1a1a",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on grey on red houndstooth — maximum cool graphic authority on a bold warm check."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy deepens the cool register — restrained and deliberate against the red houndstooth."},
        {id:3,name:"Solid Silver Grenadine",color:"#A9A9A9",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Silver and grey on red houndstooth — the coolest metallic approach to a warm bold check."},
        {id:4,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Charcoal deepens grey into a complete cool anchor against the warm red houndstooth."},
        {id:5,name:"Solid Gold Knit",color:"#C9A84C",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Complementary",why:"Gold warms the cool grey palette — bridging the temperature gap toward the red check."},
        {id:6,name:"Solid Burgundy Grenadine",color:"#722F37",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Analogous",why:"Burgundy is the warmest tonal anchor on grey and red houndstooth."},
      ]},
      { id:3, name:"Ivory Cream Poplin", colorCode:"#FFFFF0", why:"Ivory against red houndstooth is warmer than white — it makes the check feel editorial rather than graphic.", collar:"Button-down collar", pattern:"Solid", pocketSquare:{name:"Ivory Silk",fold:"One Point",material:"Silk"}, ties:[
        {id:1,name:"Solid Black",color:"#1a1a1a",pattern:"Solid",material:"Silk",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Black on ivory on red houndstooth — maximum contrast with a warm base. Bold and completely deliberate."},
        {id:2,name:"Solid Navy Grenadine",color:"#1B3A6B",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Navy grounds the warm ivory-red check palette with cool deliberate authority."},
        {id:3,name:"Solid Gold",color:"#C9A84C",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Gold and ivory on red houndstooth — the warmest and most editorial check palette."},
        {id:4,name:"Solid Charcoal Grenadine",color:"#36454F",pattern:"Solid Grenadine",material:"Silk Grenadine",width:"3in",knot:"Half Windsor",harmony:"Complementary",why:"Charcoal grounds the warm ivory-red houndstooth into something serious and authoritative."},
        {id:5,name:"Solid Burgundy Knit",color:"#722F37",pattern:"Solid Knit",material:"Wool Knit",width:"2.5in",knot:"Four-in-Hand",harmony:"Analogous",why:"Burgundy knit on ivory on red houndstooth — tonal warmth making the bold check more approachable."},
        {id:6,name:"Solid Silver",color:"#A9A9A9",pattern:"Solid",material:"Silk",width:"3in",knot:"Four-in-Hand",harmony:"Analogous",why:"Silver cools the warm ivory-red check into something more refined and considered."},
      ]},
    ],
    packages:[
      {name:"The Red Check Authority",suit:"Red Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Black Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Cap-Toe Oxford",belt:"Black calf leather",socks:"Black",watch:"Silver dress watch",occasion:"Fashion events, creative formal, bold presentations",archetype:"Avant-Garde",confidence:5,tip:"Red houndstooth, white, black — the check is the statement. Keep everything else immaculate.",shirtColor:"#F8F8F8",tieColor:"#1a1a1a"},
      {name:"The Navy Restraint Check",suit:"Red Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Navy Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Navy",watch:"Silver watch",occasion:"Creative business, brand events, bold meetings",archetype:"British Classic",confidence:3,tip:"Navy is the most controlled tie on red houndstooth — it grounds both the colour and the check.",shirtColor:"#F8F8F8",tieColor:"#1B3A6B"},
      {name:"The Cool Check Editorial",suit:"Red Houndstooth",shirt:"Pale Grey Poplin",tie:"Solid Black Grenadine",pocketSquare:"White Cotton — One Point",shoes:"Black Oxford Brogues",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative formal, gallery, editorial events",archetype:"Avant-Garde",confidence:4,tip:"Grey cools the red houndstooth into something architectural — the check becomes pattern not provocation.",shirtColor:"#D3D3D3",tieColor:"#1a1a1a"},
      {name:"The Gold Check",suit:"Red Houndstooth",shirt:"Ivory Cream Poplin",tie:"Solid Gold",pocketSquare:"Ivory Silk — One Point",shoes:"Brown Derby",belt:"Brown leather",socks:"Gold or burgundy",watch:"Gold watch",occasion:"Gala, cultural events, bold formal",archetype:"Avant-Garde",confidence:5,tip:"Gold and ivory on red houndstooth — the check feels luxurious rather than aggressive.",shirtColor:"#FFFFF0",tieColor:"#C9A84C"},
      {name:"The Charcoal Check",suit:"Red Houndstooth",shirt:"Crisp White Poplin",tie:"Solid Charcoal Grenadine",pocketSquare:"White Linen — TV Fold",shoes:"Black Oxford",belt:"Black leather",socks:"Charcoal",watch:"Silver watch",occasion:"Creative business formal, important bold meetings",archetype:"Italian",confidence:3,tip:"Charcoal on white on red houndstooth — the most serious and authoritative approach.",shirtColor:"#F8F8F8",tieColor:"#36454F"},
      {name:"The Burgundy Check",suit:"Red Houndstooth",shirt:"Ivory Cream Poplin",tie:"Solid Burgundy Knit",pocketSquare:"Ivory Silk — One Point",shoes:"Dark Brown Derby",belt:"Dark brown leather",socks:"Burgundy",watch:"Gold watch",occasion:"Creative casual, smart bold events",archetype:"Italian",confidence:3,tip:"Burgundy knit on ivory on red houndstooth — tonal warmth making the bold check feel considered.",shirtColor:"#FFFFF0",tieColor:"#722F37"},
    ],
    styleMantra:"Red houndstooth is fire contained within geometry — the check gives the boldness its structure, the colour gives it its soul."
  },

}

// ─── Auto-generate remaining 6 colors × 6 patterns from base analysis data ───
// Grey, Black, Brown, Beige, Burgundy, Blue × all 6 patterns
// These share shirt/tie logic with their base color but get pattern-specific
// suit metadata, packages, and style mantras.

const GREY_PATTERN_META = {
  solid:        {pattern:"Solid",fabric:"Worsted wool, ~260 g/m²",formality:"Business Formal / Smart Casual",mantra:"Medium grey is the most versatile canvas in menswear — it takes every colour and refuses none."},
  chalk_stripe: {pattern:"Chalk Stripe",fabric:"Wool twill, ~260 g/m²",formality:"Business Formal",mantra:"Grey chalk stripe is the quieter cousin of navy — power without announcement."},
  glen_plaid:   {pattern:"Glen Plaid / Windowpane",fabric:"Wool blend, ~240 g/m²",formality:"Business Casual / Smart Formal",mantra:"Grey glen plaid is character in a suit — the pattern of a man who has learned to dress."},
  herringbone:  {pattern:"Herringbone",fabric:"Wool herringbone, ~270 g/m²",formality:"Business Formal",mantra:"Grey herringbone is texture elevated to quiet authority."},
  tweed:        {pattern:"Tweed",fabric:"Harris Tweed / Donegal, ~380 g/m²",formality:"Smart Casual",mantra:"Grey tweed belongs to the countryside and moves through cities with quiet confidence."},
  linen:        {pattern:"Solid / Linen texture",fabric:"100% Linen",formality:"Smart Casual / Summer",mantra:"Grey linen is the most considered summer suit — cool authority in natural fibre."},
}

const BLACK_PATTERN_META = {
  solid:        {pattern:"Solid",fabric:"Worsted wool, ~260 g/m²",formality:"Formal / Black Tie Optional",mantra:"Black is the absence of compromise — wear it only when you mean to command."},
  chalk_stripe: {pattern:"Chalk Stripe",fabric:"Wool twill, ~260 g/m²",formality:"Business Formal / Evening",mantra:"Black chalk stripe is theatre — architectural, dramatic, and unapologetic."},
  glen_plaid:   {pattern:"Glen Plaid",fabric:"Wool blend, ~240 g/m²",formality:"Business Formal",mantra:"Black glen plaid is the urban statement — pattern on the darkest canvas."},
  herringbone:  {pattern:"Herringbone",fabric:"Wool herringbone, ~270 g/m²",formality:"Business Formal / Evening",mantra:"Black herringbone is texture in darkness — it rewards those who look closely."},
  tweed:        {pattern:"Tweed",fabric:"Donegal / Harris Tweed",formality:"Smart Casual / Business Casual",mantra:"Black tweed is the night sky woven into cloth — rare and commanding."},
  linen:        {pattern:"Solid / Linen texture",fabric:"100% Linen",formality:"Smart Casual / Summer Evening",mantra:"Black linen is summer authority — cool in temperature, warm in effect."},
}

const BROWN_PATTERN_META = {
  solid:        {pattern:"Solid",fabric:"Worsted wool, ~260 g/m²",formality:"Business Casual / Smart Casual",mantra:"Brown is the gentleman's earthen alternative — warm, grounded, and unmistakably considered."},
  chalk_stripe: {pattern:"Chalk Stripe",fabric:"Wool twill, ~260 g/m²",formality:"Business Casual / Smart Formal",mantra:"Brown chalk stripe is the Italian move — warm authority with a continental soul."},
  glen_plaid:   {pattern:"Glen Plaid",fabric:"Wool blend, ~240 g/m²",formality:"Business Casual / Country",mantra:"Brown glen plaid is the country house in a suit — earth tones in perfect pattern."},
  herringbone:  {pattern:"Herringbone",fabric:"Wool herringbone, ~270 g/m²",formality:"Business Casual / Smart Casual",mantra:"Brown herringbone is the warmth of wood grain translated into cloth."},
  tweed:        {pattern:"Tweed",fabric:"Harris Tweed / Donegal",formality:"Smart Casual / Country",mantra:"Brown tweed is the suit of the land — worn by those who understand nature and tailoring equally."},
  linen:        {pattern:"Solid / Linen texture",fabric:"100% Linen",formality:"Smart Casual / Summer",mantra:"Brown linen is summer earth — warm, natural, and entirely at home outdoors."},
}

const BEIGE_PATTERN_META = {
  solid:        {pattern:"Solid",fabric:"Linen / Lightweight wool",formality:"Smart Casual / Summer Formal",mantra:"Beige and tan are summer's gift — warm neutrals that make everything around them look considered."},
  chalk_stripe: {pattern:"Chalk Stripe",fabric:"Lightweight wool, ~220 g/m²",formality:"Smart Formal / Summer Business",mantra:"Beige chalk stripe is summer formality — the stripe provides structure, the colour provides warmth."},
  glen_plaid:   {pattern:"Glen Plaid",fabric:"Wool-linen blend",formality:"Smart Casual / Country",mantra:"Beige glen plaid is the warm season at its most elegant — light and patterned."},
  herringbone:  {pattern:"Herringbone",fabric:"Wool-cotton herringbone",formality:"Business Casual / Smart Casual",mantra:"Beige herringbone is the sun woven into cloth — warm, textural, entirely summer."},
  tweed:        {pattern:"Tweed",fabric:"Lightweight Donegal",formality:"Smart Casual / Country",mantra:"Beige tweed is the countryside in warm light — natural, relaxed, completely deliberate."},
  linen:        {pattern:"Solid / Linen texture",fabric:"100% Linen",formality:"Smart Casual / Summer",mantra:"Beige linen is summer in its purest form — natural fibre, warm tone, complete ease."},
}

const BURGUNDY_PATTERN_META = {
  solid:        {pattern:"Solid",fabric:"Worsted wool, ~260 g/m²",formality:"Business Casual / Evening",mantra:"Burgundy is warmth and confidence distilled into cloth — the colour of wine and authority."},
  chalk_stripe: {pattern:"Chalk Stripe",fabric:"Wool twill, ~260 g/m²",formality:"Business Formal / Evening",mantra:"Burgundy chalk stripe is Old World opulence — rich, structured, and theatrical."},
  glen_plaid:   {pattern:"Glen Plaid",fabric:"Wool blend, ~240 g/m²",formality:"Business Casual / Smart",mantra:"Burgundy glen plaid is the warm season's power pattern — earthy and commanding."},
  herringbone:  {pattern:"Herringbone",fabric:"Wool herringbone, ~270 g/m²",formality:"Business Casual / Smart",mantra:"Burgundy herringbone is warmth made tactile — rich colour and rich texture together."},
  tweed:        {pattern:"Tweed",fabric:"Harris Tweed / Donegal",formality:"Smart Casual / Country / Evening",mantra:"Burgundy tweed is the autumn harvest — deep, warm, and entirely deliberate."},
  linen:        {pattern:"Solid / Linen texture",fabric:"100% Linen",formality:"Smart Casual / Summer Evening",mantra:"Burgundy linen is summer wine — warm authority in the lightest possible cloth."},
}

const BLUE_PATTERN_META = {
  solid:        {pattern:"Solid",fabric:"Worsted wool, ~260 g/m²",formality:"Business Casual / Smart",mantra:"Bright blue is confidence made visible — wear it when you want to be seen."},
  chalk_stripe: {pattern:"Chalk Stripe",fabric:"Wool twill, ~260 g/m²",formality:"Business Formal",mantra:"Blue chalk stripe is the Italian boardroom — structured, vibrant, and completely deliberate."},
  glen_plaid:   {pattern:"Glen Plaid",fabric:"Wool blend, ~240 g/m²",formality:"Business Casual",mantra:"Blue glen plaid is personality in a pattern — the suit of a man who dresses to be interesting."},
  herringbone:  {pattern:"Herringbone",fabric:"Wool herringbone, ~270 g/m²",formality:"Business Casual / Smart",mantra:"Blue herringbone is confidence with texture — bold colour made subtle by weave."},
  tweed:        {pattern:"Tweed",fabric:"Harris Tweed / Donegal",formality:"Smart Casual / Business Casual",mantra:"Blue tweed is the unexpected move — a bold colour in the most traditional fabric."},
  linen:        {pattern:"Solid / Linen texture",fabric:"100% Linen",formality:"Smart Casual / Summer",mantra:"Blue linen is the sky made wearable — open, warm, and entirely confident."},
}

// ─── Build remaining 36 entries by inheriting from base analysis + meta ───
function buildPatternEntry(baseAnalysis, colorKey, patternKey, meta, colorLabel) {
  const patternDisplayMap = {
    solid: "Solid", chalk_stripe: "Chalk Stripe", glen_plaid: "Glen Plaid",
    herringbone: "Herringbone", tweed: "Tweed", linen: "Linen"
  }
  const entry = {
    suit: {
      ...baseAnalysis.suit,
      colorFamily: `${colorLabel} ${patternDisplayMap[patternKey]}`,
      pattern: meta.pattern,
      fabric: meta.fabric,
      formality: meta.formality,
    },
    shirts: baseAnalysis.shirts,
    packages: (baseAnalysis.packages || []).map(p => ({
      ...p,
      suit: `${colorLabel} ${patternDisplayMap[patternKey]}`,
      tip: patternKey === "solid" ? p.tip :
           patternKey === "chalk_stripe" ? p.tip + " The chalk stripe already commands attention — restraint elsewhere is key." :
           patternKey === "glen_plaid" ? "With glen plaid, always keep the tie solid — the pattern does the work." :
           patternKey === "herringbone" ? "The herringbone weave is the decoration — keep shirts and ties plain." :
           patternKey === "tweed" ? "Tweed demands knit ties, natural fabrics, and suede shoes." :
           "Linen suits breathe best without a tie — a pocket square is often enough.",
    })),
    styleMantra: meta.mantra,
  }
  return entry
}

const remainingColors = [
  { key: "grey",     label: "Medium Grey",   base: null, meta: GREY_PATTERN_META },
  { key: "black",    label: "Black",         base: null, meta: BLACK_PATTERN_META },
  { key: "brown",    label: "Brown",         base: null, meta: BROWN_PATTERN_META },
  { key: "beige",    label: "Beige",         base: null, meta: BEIGE_PATTERN_META },
  { key: "burgundy", label: "Burgundy",      base: null, meta: BURGUNDY_PATTERN_META },
  { key: "blue",     label: "Blue",          base: null, meta: BLUE_PATTERN_META },
]

// These get populated at runtime since base ANALYSIS objects are defined in Dapper.jsx
// The PATTERN_MATRIX lookup function handles the fallback


function getAnalysisFromPhotoResult(result) {
  if (!result) return ANALYSIS

  // Map color key to base analysis

  // Map detected pattern string to matrix key
  const patternToKey = {
    "Solid":                    "solid",
    "Smooth weave":             "solid",
    "Subtle Texture / Twill":   "solid",
    "Chalk Stripe / Pinstripe": "chalk_stripe",
    "Horizontal Stripe":        "chalk_stripe",
    "Glen Plaid / Check":       "glen_plaid",
    "Bold Pattern / Tweed":     "tweed",
    "Herringbone":              "herringbone",
  }

  const colorKey   = result.colorKey === "light_grey" ? "grey" : result.colorKey
  const patternKey = patternToKey[result.patternInfo.pattern] || "solid"

  // Check if fabric looks like linen
  const isLinen = result.fabricStr && result.fabricStr.toLowerCase().includes("linen")
  const finalPatternKey = isLinen ? "linen" : patternKey

  // Look up in PATTERN_MATRIX first
  const matrixKey = colorKey + "|" + finalPatternKey
  if (PATTERN_MATRIX[matrixKey]) {
    const matrixResult = PATTERN_MATRIX[matrixKey]
    if (result.colorLabel) {
      return { ...matrixResult, suit: { ...matrixResult.suit, colorFamily: result.colorLabel } }
    }
    return matrixResult
  }

  // Fallback: use base analysis + inject detected metadata
  const base = baseMap[result.colorKey] || ANALYSIS
  return {
    ...base,
    suit: {
      ...base.suit,
      colorFamily: result.colorLabel || base.suit.colorFamily,
      pattern:   result.patternInfo.pattern,
      fabric:    result.fabricStr,
      formality: result.patternInfo.formality,
    }
  }
}

// Color family labels for UI display
const COLOR_FAMILY_LABELS = {
  black:      "Black",
  charcoal:   "Charcoal Grey",
  navy:       "Navy Blue",
  grey:       "Medium Grey",
  light_grey: "Light Grey",
  blue:       "Blue",
  burgundy:   "Burgundy / Wine",
  brown:      "Brown",
  beige:      "Beige / Tan / Camel",
}


// ─────────────────────────────────────────────────────────────────────────────
// LOCAL COMBO ASSESSMENT ENGINE
// Evaluates suit + tie + shirt + accessory combos WITHOUT any API call.
// Provides expert menswear advice for common and uncommon combinations.
// ─────────────────────────────────────────────────────────────────────────────

function parseComboFromText(text) {
  const t = text.toLowerCase()

  // Extract suit color
  const suitColors = [
    [/(?:black)\s*suit|suit.*(?:black)/,"black"],
    [/(?:charcoal|dark\s*gr[ae]y)\s*suit|suit.*(?:charcoal)/,"charcoal"],
    [/(?:navy|midnight|dark\s*blue)\s*suit|suit.*(?:navy)/,"navy"],
    [/(?:grey|gray|silver)\s*suit|suit.*(?:grey|gray)/,"grey"],
    [/(?:blue|cobalt|royal)\s*suit|suit.*(?:blue)/,"blue"],
    [/(?:burgundy|wine|oxblood|maroon)\s*suit|suit.*(?:burgundy)/,"burgundy"],
    [/(?:brown|chocolate|cognac|tobacco)\s*suit|suit.*(?:brown)/,"brown"],
    [/(?:beige|tan|camel|sand)\s*suit|suit.*(?:beige|tan)/,"beige"],
    [/(?:green|olive|sage|forest)\s*suit|suit.*(?:green|olive)/,"green"],
    [/(?:white|cream|ivory)\s*suit|suit.*(?:white|cream|ivory)/,"white"],
    [/(?:purple|violet|plum)\s*suit|suit.*(?:purple)/,"purple"],
    [/(?:red|crimson|scarlet)\s*suit|suit.*(?:red)/,"red"],
  ]
  let suitColor = null
  for (const [rx, color] of suitColors) {
    if (rx.test(t)) { suitColor = color; break }
  }
  // Fallback: detect any color word before/near "suit"
  if (!suitColor) {
    const colorWords = ["black","charcoal","navy","grey","gray","blue","burgundy","brown","beige","tan","green","olive","white","cream","ivory","purple","red","crimson"]
    for (const c of colorWords) {
      if (t.includes(c)) { suitColor = c === "gray" ? "grey" : c === "tan" ? "beige" : c === "cream" || c === "ivory" ? "white" : c === "olive" ? "green" : c === "crimson" ? "red" : c; break }
    }
  }

  // Extract tie info
  let tieColor = null, tiePattern = "solid"
  const tieMatch = t.match(/(?:(\w+)\s+)?(?:(\w+)\s+)?tie/)
  if (tieMatch) {
    const words = [tieMatch[1], tieMatch[2]].filter(Boolean)
    const colorWords = ["black","charcoal","navy","grey","gray","blue","burgundy","brown","beige","tan","green","olive","white","cream","ivory","purple","red","crimson","gold","silver","yellow","orange","rust","pink","burgundy","maroon","wine"]
    const patternWords = ["solid","striped","stripe","polka","dot","paisley","knit","grenadine","repp","foulard","plaid","check"]
    for (const w of words) {
      if (colorWords.includes(w)) tieColor = w
      if (patternWords.includes(w)) tiePattern = w
    }
    if (!tieColor && suitColor) {
      // Check if description says "X suit with X tie" (same color repeated)
      const sameColorRx = new RegExp(suitColor + ".*tie|" + suitColor + "\\s+tie")
      if (sameColorRx.test(t)) tieColor = suitColor
    }
  }

  // Extract shirt info
  let shirtColor = null
  const shirtMatch = t.match(/(?:(\w+)\s+)?shirt/)
  if (shirtMatch && shirtMatch[1]) {
    shirtColor = shirtMatch[1]
  }

  // Extract accessories
  const mentionsBelt = /belt/.test(t)
  const mentionsShoes = /shoes|shoe|loafer|oxford|derby|brogue/.test(t)
  const beltColorMatch = t.match(/(\w+)\s+belt/)
  const shoesColorMatch = t.match(/(\w+)\s+(?:shoes|shoe|loafer|oxford|derby|brogue)/)
  const beltColor = beltColorMatch ? beltColorMatch[1] : null
  const shoesColor = shoesColorMatch ? shoesColorMatch[1] : null

  return {
    suitColor: suitColor || "navy",
    tieColor,
    tiePattern,
    shirtColor,
    beltColor: mentionsBelt ? (beltColor || suitColor) : null,
    shoesColor: mentionsShoes ? (shoesColor || suitColor) : null,
    hasTie: /tie|corbata|necktie/.test(t),
    hasShirt: /shirt|camisa/.test(t),
    hasBelt: mentionsBelt,
    hasShoes: mentionsShoes,
    isAllSameColor: false, // computed below
  }
}

function getLocalComboAssessment(text) {
  const combo = parseComboFromText(text)
  const { suitColor, tieColor, shirtColor, beltColor, shoesColor } = combo

  // Detect monochromatic (all same color)
  const mentionedColors = [suitColor, tieColor, shirtColor, beltColor, shoesColor].filter(Boolean)
  const uniqueColors = [...new Set(mentionedColors.map(c => {
    if (["cream","ivory","oyster","ecru"].includes(c)) return "white"
    if (["grey","gray","silver"].includes(c)) return "grey"
    if (["tan","camel","sand"].includes(c)) return "beige"
    return c
  }))]
  const isMonochromatic = uniqueColors.length === 1 && mentionedColors.length >= 2

  let assessment = ""
  const tips = []

  // ── MONOCHROMATIC ASSESSMENT ──
  if (isMonochromatic) {
    const color = uniqueColors[0]
    const monoRules = {
      white: {
        verdict: "High risk.",
        advice: "An all-white ensemble is one of the most difficult looks in menswear. It can read as powerful — think Mediterranean summer sophistication — or it can look like a costume. The key rules: (1) vary the TEXTURES dramatically — linen suit, cotton poplin shirt, silk knit tie, suede shoes. (2) Break the white with one neutral anchor — a brown leather belt, tan suede loafers, or a navy pocket square. (3) Fit must be impeccable — all-white magnifies every flaw. Without texture contrast and one breaking element, this will flatten into a single white mass.",
        tips: ["Add a brown or tan leather belt to break the white", "Use different textures: linen suit + cotton shirt + silk knit tie", "Consider ivory or cream tie instead of pure white — tonal difference adds depth", "Tan suede loafers are the ideal shoe — they ground the look without competing", "A navy or burgundy pocket square saves this entire outfit"],
      },
      black: {
        verdict: "Formal but risky.",
        advice: "All-black is either the most sophisticated look in the room or the most boring. In menswear (not fashion), a black suit with a black tie typically signals black-tie formal or funeral. If that is your intent, add a crisp white shirt — that is the essential contrast element. If this is for personal style, vary the textures: matte wool suit, satin grenadine tie, polished leather shoes. Never let everything be the same finish.",
        tips: ["A white shirt is NON-NEGOTIABLE with all-black — it is the only contrast", "Vary textures: matte wool, silk grenadine, polished leather", "A white pocket square in TV fold completes the look perfectly", "All-black without white reads as costume — add the white element"],
      },
      navy: {
        verdict: "Monochromatic navy works — with care.",
        advice: "Navy-on-navy is actually one of the easier monochromatic looks because navy has enough depth to show tonal variation. The key: use different shades of navy. A midnight suit with a bright navy grenadine tie creates tonal depth. Add a white or pale blue shirt to break the navy, and brown shoes to ground it. Never use the exact same shade for suit and tie — the slight contrast is everything.",
        tips: ["Use different SHADES of navy — midnight suit + bright navy tie", "White or pale blue shirt is essential to break the navy", "Brown shoes (not black) add warmth and contrast", "A white linen pocket square is the finishing touch"],
      },
      grey: {
        verdict: "Works well with tonal variation.",
        advice: "Grey monochromatic is one of the most forgiving tonal looks. Charcoal suit, mid-grey tie, light grey shirt — the gradient creates natural visual movement. The key: ensure at least 2-3 shades of difference between each piece. Add brown or burgundy shoes for warmth.",
        tips: ["Create a gradient: dark suit → mid tie → light shirt", "Brown or burgundy shoes add essential warmth", "Silver accessories complement perfectly", "A white pocket square provides a clean break"],
      },
      red: {
        verdict: "Extremely bold — not recommended for most settings.",
        advice: "An all-red combination is the most aggressive statement in menswear. Even in fashion-forward contexts, this reads as costume. The suit itself is already a major statement — the tie and accessories should CONTRAST, not match. A red suit needs: white or ivory shirt, black or charcoal tie, black shoes. Let the suit color speak — everything else should frame it quietly.",
        tips: ["White shirt is mandatory — it gives the red suit space to breathe", "Black, charcoal, or navy tie grounds the look", "Black shoes and belt are the safest choice", "NEVER match the tie to the suit — let the suit be the only red element"],
      },
      purple: {
        verdict: "Very difficult — not recommended.",
        advice: "An all-purple ensemble is almost impossible to pull off outside of fashion editorial. Purple is already a statement suit color — matching the tie eliminates the contrast that makes it wearable. Instead: white or pale grey shirt, silver or charcoal tie, black shoes. The purple suit should be the sole statement piece.",
        tips: ["White shirt provides the essential clean foundation", "Silver or charcoal tie is far more wearable", "Black shoes and belt keep it grounded", "Save the monochromatic look for a pocket square accent, not the whole outfit"],
      },
    }

    const rule = monoRules[color] || {
      verdict: "Monochromatic " + color + " — proceed with caution.",
      advice: "Wearing the same color head-to-toe can work if you vary textures and shades dramatically. The fundamental rule: no two pieces should be the exact same shade. Add one contrasting element (shoes, belt, or pocket square) to break the monochrome and give the eye somewhere to rest.",
      tips: ["Vary textures between pieces", "Use at least 2-3 different shades of " + color, "Add one contrasting accessory to break the monochrome", "A white pocket square provides relief in any monochromatic look"],
    }

    assessment = rule.verdict + " " + rule.advice
    tips.push(...rule.tips)
  }

  // ── SAME-COLOR SUIT + TIE (but other pieces differ) ──
  else if (tieColor && suitColor === tieColor && !isMonochromatic) {
    assessment = "Matching your tie exactly to your suit color is generally discouraged in classic menswear — the tie should provide contrast, not blend in. When suit and tie are the same color, the tie disappears visually and the outfit loses its focal point. Better approach: choose a tie in a complementary or contrasting color that creates visual interest against your " + suitColor + " suit."

    const contrastMap = {
      navy: "burgundy, forest green, gold, or silver",
      charcoal: "burgundy, navy, teal, or silver",
      black: "silver, burgundy, or deep navy",
      grey: "burgundy, navy, forest green, or camel",
      blue: "burgundy, terracotta, navy, or gold",
      white: "navy, burgundy, charcoal, or black",
      brown: "navy, burgundy, gold, or forest green",
      red: "black, charcoal, navy, or gold",
      green: "burgundy, navy, brown, or gold",
      purple: "silver, charcoal, gold, or navy",
      burgundy: "navy, charcoal, forest green, or gold",
      beige: "navy, burgundy, forest green, or chocolate brown",
    }
    tips.push("Better tie colors for a " + suitColor + " suit: " + (contrastMap[suitColor] || "a complementary color"))
    tips.push("If you want tonal dressing, use a DIFFERENT shade — lighter or darker than the suit")
    tips.push("A textured tie (grenadine, knit) in the same color family works better than an exact match")
  }

  // ── GENERAL COMBO (different colors) ──
  else if (tieColor) {
    // Good combos
    const goodCombos = {
      "navy+burgundy": "The quintessential power pairing. Navy and burgundy is the most authoritative combination in menswear — boardroom-tested, always correct.",
      "navy+gold": "Gold on navy is warm, confident, and decidedly Italian. A classic for client meetings and presentations.",
      "charcoal+burgundy": "Charcoal grounds burgundy beautifully. This is polished, serious, and universally flattering.",
      "charcoal+navy": "Cool and authoritative. Two of menswear's strongest neutrals working together.",
      "grey+burgundy": "Burgundy warms up grey perfectly. This is one of the most balanced combinations in menswear.",
      "black+silver": "Black and silver is formal, graphic, and decisive. The correct choice for black-tie adjacent events.",
      "brown+navy": "Navy tie on a brown suit is earthy and refined — the Italian country gentleman's choice.",
      "white+navy": "Navy is the strongest anchor for a white suit. Clean, sharp, and properly considered.",
      "white+black": "Maximum contrast. Black on white is formal and graphic — wear it with total conviction.",
    }
    const key1 = suitColor + "+" + tieColor
    const key2 = tieColor + "+" + suitColor
    if (goodCombos[key1]) {
      assessment = goodCombos[key1]
    } else if (goodCombos[key2]) {
      assessment = goodCombos[key2]
    } else {
      assessment = "Your " + suitColor + " suit with a " + tieColor + " " + (combo.tiePattern || "solid") + " tie — an intentional combination. "
      assessment += "The key to making this work: ensure your shirt provides enough contrast between the two. A white or pale shirt is almost always the safest foundation for any suit-tie pairing."
    }
  }

  // ── NO TIE BUT ACCESSORIES MENTIONED ──
  else if (combo.hasBelt || combo.hasShoes) {
    assessment = "Accessories should complement your " + suitColor + " suit, not match it exactly. "
    if (["navy","charcoal","black","grey"].includes(suitColor)) {
      assessment += "For a " + suitColor + " suit, black or dark brown leather is always correct for shoes and belt. The rule: shoes and belt must always match each other."
    } else if (["brown","beige","green"].includes(suitColor)) {
      assessment += "Earth-toned suits look best with brown leather — from tan to dark chocolate depending on formality. Shoes and belt must always match each other."
    } else {
      assessment += "For a " + suitColor + " suit, choose shoes and belt in a neutral — black, dark brown, or tan depending on the occasion. Shoes and belt must always match each other."
    }
  }

  if (!assessment) return null

  return {
    assessment,
    tie: tieColor ? { color: tieColor, pattern: combo.tiePattern || "solid" } : null,
    shirt: shirtColor ? { color: shirtColor, pattern: "solid" } : null,
    suitColor: suitColor,
    tips, // bonus: local tips
  }
}

function getLocalAnalysis(text) {
  const t = text.toLowerCase()

  // Detect color (with match tracking)
  let colorKey = "navy"
  const baseMap = {
    black: ANALYSIS_BLACK, charcoal: ANALYSIS_CHARCOAL, navy: ANALYSIS,
    grey: ANALYSIS_GREY, blue: ANALYSIS_BLUE, burgundy: ANALYSIS_BURGUNDY,
    brown: ANALYSIS_BROWN, beige: ANALYSIS_BEIGE,
    green: ANALYSIS, white: ANALYSIS, purple: ANALYSIS, red: ANALYSIS,
  }
    let colorMatched = false
  if (/black/.test(t))                                                      { colorKey = "black"; colorMatched = true }
  else if (/charcoal|dark[\s-]?gr[ae]y/.test(t))                          { colorKey = "charcoal"; colorMatched = true }
  else if (/navy|midnight blue|dark blue/.test(t))                         { colorKey = "navy"; colorMatched = true }
  else if (/light[\s-]?gr[ae]y|pale gr[ae]y|silver gr[ae]y/.test(t))    { colorKey = "grey"; colorMatched = true }
  else if (/medium gr[ae]y|gr[ae]y|grey/.test(t))                         { colorKey = "grey"; colorMatched = true }
  else if (/burgundy|oxblood|wine suit|maroon|claret/.test(t))            { colorKey = "burgundy"; colorMatched = true }
  else if (/beige|camel|tan suit|sand suit|ivory suit|cream suit/.test(t)) { colorKey = "beige"; colorMatched = true }
  else if (/brown|chocolate|cognac suit|tobacco/.test(t))                  { colorKey = "brown"; colorMatched = true }
  else if (/royal blue|bright blue|cobalt|electric blue|blue/.test(t))    { colorKey = "blue"; colorMatched = true }
  else if (/green|olive|sage|forest|hunter|emerald|moss|teal/.test(t))    { colorKey = "green"; colorMatched = true }
  else if (/white|cream|ivory|off.white|oyster|ecru/.test(t))             { colorKey = "white"; colorMatched = true }
  else if (/purple|violet|plum|eggplant|lavender/.test(t))                { colorKey = "purple"; colorMatched = true }
  else if (/red|crimson|scarlet|rust|orange|terracotta/.test(t))          { colorKey = "red"; colorMatched = true }

  // Detect pattern (with match tracking)
  let patternKey = "solid"
  let patternMatched = /solid/.test(t)
  if (/linen/.test(t))                                                      { patternKey = "linen"; patternMatched = true }
  else if (/chalk stripe|pinstripe|pin stripe/.test(t))                    { patternKey = "chalk_stripe"; patternMatched = true }
  else if (/glen plaid|windowpane|window pane|plaid|check/.test(t))       { patternKey = "glen_plaid"; patternMatched = true }
  else if (/herringbone|herring bone/.test(t))                             { patternKey = "herringbone"; patternMatched = true }
  else if (/tweed|donegal|harris/.test(t))                                 { patternKey = "tweed"; patternMatched = true }
  else if (/houndstooth|hounds tooth/.test(t))                             { patternKey = "houndstooth"; patternMatched = true }
  else if (/birdseye|bird.s eye|nailhead/.test(t))                        { patternKey = "birdseye"; patternMatched = true }
  else if (/seersucker/.test(t))                                           { patternKey = "seersucker"; patternMatched = true }
  else if (/flannel/.test(t))                                              { patternKey = "flannel"; patternMatched = true }
  else if (/stripe/.test(t))                                               { patternKey = "chalk_stripe"; patternMatched = true }

  // Lookup in matrix
  const matrixKey = colorKey + "|" + patternKey
  if (PATTERN_MATRIX[matrixKey]) return { ...PATTERN_MATRIX[matrixKey], _isMatrixMatch: true }
  // Color or pattern detected but not in matrix — exotic combo
  if (colorMatched || patternMatched) return { ...(baseMap[colorKey] || ANALYSIS), _isMatrixMatch: false, _detectedColor: colorKey, _detectedPattern: patternKey }

  // Fallback to base analysis
  return { ...(baseMap[colorKey] || ANALYSIS), _isMatrixMatch: false, _detectedColor: colorKey, _detectedPattern: patternKey }
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTFIT COMBINATION ENGINE
// Generates every valid combination locally using stylist rules.
// Mirrors the SQL stylist_rules logic — no AI needed for standard lookups.
// Only falls back to OpenAI for exotic / unusual suit descriptions.
// ─────────────────────────────────────────────────────────────────────────────

const _DB_SHIRTS = {
  black:    ['white','light_blue','light_grey'],
  navy:     ['white','light_blue','pink'],
  charcoal: ['white','light_blue','pink','light_grey'],
  grey:     ['white','light_blue','pink','light_grey'],
  brown:    ['white','light_blue','cream'],
}

const _DB_TIES = {
  black:    ['burgundy','navy','charcoal','silver','black','dark_green',null],
  navy:     ['burgundy','navy','charcoal','silver','dark_green','black',null],
  charcoal: ['burgundy','navy','charcoal','silver','black','dark_green',null],
  grey:     ['burgundy','navy','charcoal','silver','dark_green',null],
  brown:    ['navy','burgundy','dark_green','charcoal',null],
}

// For suits: pants = suit color. For blazers: pants ≠ blazer color.
const _DB_PANTS = {
  'suit|black':     ['black'],
  'suit|navy':      ['navy'],
  'suit|charcoal':  ['charcoal'],
  'suit|grey':      ['grey'],
  'blazer|black':   ['grey','charcoal','black'],
  'blazer|navy':    ['grey','charcoal','beige','cream'],
  'blazer|charcoal':['grey','black'],
  'blazer|grey':    ['navy','charcoal','black'],
  'blazer|brown':   ['beige','cream','grey'],
}

const _DB_SHOES = {
  'suit|black':     ['black'],
  'suit|navy':      ['black','brown'],
  'suit|charcoal':  ['black'],
  'suit|grey':      ['black','brown'],
  'blazer|black':   ['black'],
  'blazer|navy':    ['black','brown'],
  'blazer|charcoal':['black','brown'],
  'blazer|grey':    ['black','brown'],
  'blazer|brown':   ['brown'],
}

// Occasions where a tie is mandatory
const _TIE_REQUIRED = new Set(['formal','wedding','funeral','interview','evening_event'])

// Per-occasion tie validators (return true = tie is allowed)
const _TIE_OCC_OK = {
  funeral:         t => t !== null && ['black','charcoal','navy'].includes(t),
  interview:       t => t !== null && ['navy','charcoal','burgundy','black'].includes(t),
  business_casual: t => t === null || ['navy','burgundy','charcoal'].includes(t),
  date:            t => t !== 'black' && t !== 'silver',
}

function _dbDressCode(occ, tie) {
  if (['formal','wedding','funeral','interview','evening_event'].includes(occ)) return 'formal'
  if (['office','church'].includes(occ) && tie) return 'formal'
  if (!tie) return 'business_casual'
  return 'semi_formal'
}

const _DB_CONF = {
  funeral:0.99, interview:0.97, wedding:0.95, formal:0.95,
  office:0.94, church:0.93, evening_event:0.93, date:0.91, business_casual:0.90,
}

function _dbKey(type,color,shirt,tie,pants,shoe,occ,dc,season,style) {
  return `${type}|${color}|${shirt}|${tie||'NO_TIE'}|${pants}|${shoe}|${shoe}|${occ}|${dc}|${season}|${style}`
}

// Build the full combination database once at module load (~3–6k entries)
const OUTFIT_DB = (() => {
  const db = new Map()
  const garments   = [['suit','black'],['suit','navy'],['suit','charcoal'],['suit','grey'],
                      ['blazer','black'],['blazer','navy'],['blazer','charcoal'],['blazer','grey'],['blazer','brown']]
  const occasions  = ['office','business_casual','formal','wedding','funeral','church','date','interview','evening_event']
  const seasons    = ['all_season','spring','summer','fall','winter']
  const styles     = ['classic','modern_classic']

  for (const [type, color] of garments) {
    const shirts = _DB_SHIRTS[color]              || []
    const ties   = _DB_TIES[color]                || []
    const pants  = _DB_PANTS[`${type}|${color}`]  || []
    const shoes  = _DB_SHOES[`${type}|${color}`]  || []

    for (const shirt of shirts) {
      for (const tie of ties) {
        for (const pant of pants) {
          for (const shoe of shoes) {
            for (const occ of occasions) {
              // Tie-required check
              if (_TIE_REQUIRED.has(occ) && !tie) continue
              // Per-occasion tie validator
              const tieOk = _TIE_OCC_OK[occ]
              if (tieOk && !tieOk(tie)) continue
              // Funeral: white shirt only
              if (occ === 'funeral' && shirt !== 'white') continue

              for (const season of seasons) {
                // Summer + black blazer + business_casual → skip (too heavy)
                if (season === 'summer' && type === 'blazer' && color === 'black' && occ === 'business_casual') continue
                // Cream shirt: spring / summer / all_season only
                if (shirt === 'cream' && !['spring','summer','all_season'].includes(season)) continue
                // Cream pants: spring / summer only
                if (pant  === 'cream' && !['spring','summer'].includes(season)) continue

                for (const style of styles) {
                  // Modern-classic wedding requires a tie
                  if (style === 'modern_classic' && occ === 'wedding' && !tie) continue

                  const dc  = _dbDressCode(occ, tie)
                  const key = _dbKey(type,color,shirt,tie,pant,shoe,occ,dc,season,style)
                  if (!db.has(key)) {
                    db.set(key, {
                      main_garment_type: type,  main_color: color,
                      shirt_color: shirt,       tie_color: tie,
                      pants_color: pant,        shoes_color: shoe,  belt_color: shoe,
                      occasion: occ,            dress_code: dc,
                      season,                   style,
                      confidence_score: _DB_CONF[occ] || 0.88,
                      combination_key: key,
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return db
})()

// Maps analysisData.suit.colorFamily → DB main_color key
const COLOR_FAMILY_TO_DB = {
  'Classic Navy':'navy',      'Jet Black':'black',     'Charcoal Grey':'charcoal',
  'Medium Grey':'grey',       'Light Grey':'grey',      'Royal Blue':'navy',
  'Burgundy':'black',         'Brown':'brown',          'Beige':'black',
}

// Maps UI occasion pill label → DB occasion key
const OCCASION_LABEL_TO_DB = {
  Office:'office',  Wedding:'wedding',  Formal:'formal',  Date:'date',
  Funeral:'funeral', Church:'church',   Interview:'interview', Casual:'business_casual',
}

const _HEX = {
  white:'#F8F8F8', light_blue:'#89B4D4', light_grey:'#D3D3D3', pink:'#F4B8C1',
  cream:'#FFFDD0', burgundy:'#722F37',   navy:'#191970',        charcoal:'#36454F',
  silver:'#C0C0C0', dark_green:'#355E3B', black:'#1C1C1C',      brown:'#8B6914',
}
const _OCC_LABEL = {
  office:'Board meeting, client pitch',       business_casual:'Smart casual, business casual',
  formal:'Formal event, gala',                wedding:'Wedding, ceremony',
  funeral:'Funeral, memorial service',        church:'Church, religious service',
  date:'Dinner date, evening out',            interview:'Job interview',
  evening_event:'Evening event, cocktail party',
}

function _pretty(s)    { return s ? s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : '' }
function _cap(s)       { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
function _confStars(v) { return v >= 0.97 ? 5 : v >= 0.94 ? 4 : v >= 0.91 ? 3 : 2 }

// Convert a DB combo entry into the Dapper package display format
function _comboToPackage(c) {
  const tie = c.tie_color ? _pretty(c.tie_color) + ' tie' : 'No tie'
  return {
    name:         `${_pretty(c.main_color)} ${_cap(c.main_garment_type)} — ${_pretty(c.occasion)}`,
    suit:         `${_pretty(c.main_color)} ${c.main_garment_type}`,
    shirt:        `${_pretty(c.shirt_color)} poplin`,
    tie,
    pocketSquare: `White linen — ${c.dress_code === 'formal' ? 'TV Fold' : 'Puff Fold'}`,
    shoes:        c.shoes_color === 'black' ? 'Black Cap-Toe Oxford' : 'Brown Derby Brogue',
    belt:         `${_cap(c.belt_color)} leather belt`,
    socks:        c.shoes_color === 'black' ? 'Dark navy, over-the-calf' : 'Brown or burgundy shadow stripe',
    watch:        c.dress_code === 'formal' ? 'Silver dress watch' : 'Casual leather-strap watch',
    occasion:     _OCC_LABEL[c.occasion] || _pretty(c.occasion),
    archetype:    c.style === 'modern_classic' ? 'Continental' : 'British Classic',
    confidence:   _confStars(c.confidence_score),
    tip:          `${_pretty(c.shirt_color)} shirt with ${tie.toLowerCase()} — a ${_pretty(c.dress_code)} ${c.season === 'all_season' ? '' : c.season + ' '}look for ${_pretty(c.occasion)}.`,
    shirtColor:   _HEX[c.shirt_color] || '#F8F8F8',
    tieColor:     _HEX[c.tie_color]   || '#191970',
  }
}

// Return up to `limit` matching packages from OUTFIT_DB as display-ready objects
function lookupOutfitPackages({ mainType, mainColor, occasion, season, limit = 6 }) {
  const results = []
  for (const c of OUTFIT_DB.values()) {
    if (mainType  && c.main_garment_type !== mainType)  continue
    if (mainColor && c.main_color        !== mainColor) continue
    if (occasion  && c.occasion          !== occasion)  continue
    const seasonOk = !season || season === 'all_season' ||
                     c.season === season || c.season === 'all_season'
    if (!seasonOk) continue
    results.push(c)
  }
  results.sort((a, b) => b.confidence_score - a.confidence_score)
  return results.slice(0, limit).map(_comboToPackage)
}

// ─── Occasion keyword map ───────────────────────────────────────────────────
const OCCASION_MAP = {
  Office:    /board|client|pitch|meeting|business|leadership|financial|law|executive|negotiation/i,
  Wedding:   /wedding|garden party|outdoor ceremony|outdoor wedding/i,
  Formal:    /formal|gala|black tie|award|ceremony|keynote|diplomatic/i,
  Date:      /dinner|date|evening|cocktail|restaurant/i,
  Funeral:   /funeral/i,
  Church:    /church|sunday service/i,
  Interview: /interview/i,
  Casual:    /casual|gallery|lunch|creative|media|weekend|studio|smart casual/i,
}

// Returns a copy of analysisObj with packages filtered/enriched by occasion.
// Priority: 1) hand-crafted packages that match  2) OUTFIT_DB local lookup  3) all packages
function filterByOccasion(analysisObj, occasion) {
  if (!occasion || occasion === "All") return analysisObj
  const re = OCCASION_MAP[occasion]
  if (!re) return analysisObj

  // 1 — Try hand-crafted packages first
  const filtered = (analysisObj.packages || []).filter(p => re.test(p.occasion))
  if (filtered.length > 0) return { ...analysisObj, packages: filtered }

  // 2 — Fall back to OUTFIT_DB (thousands of local combos, no AI needed)
  const colorFamily = analysisObj.suit?.colorFamily || ''
  const mainColor   = COLOR_FAMILY_TO_DB[colorFamily]
  const dbOcc       = OCCASION_LABEL_TO_DB[occasion]
  if (mainColor && dbOcc) {
    const dbPkgs = lookupOutfitPackages({ mainColor, occasion: dbOcc, limit: 6 })
    if (dbPkgs.length > 0) return { ...analysisObj, packages: dbPkgs }
  }

  // 3 — Show all packages as last resort
  return analysisObj
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function daysInMonth(y, m)  { return new Date(y, m + 1, 0).getDate() }
function firstDayOf(y, m)   { return new Date(y, m, 1).getDay() }
function fmtDate(y, m, d)   { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` }
function dots(n)             { return Array.from({length:5},(_,i)=>i<n?"●":"○").join("") }

const NAVY = "#0f172a"
const GOLD = "#C9A84C"

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────

function Sidebar({ page, setPage, mobile, onClose, user, onAuthClick, onLogOut }) {
  const items = [
    { id:"analyzer",  icon:Wand2,    label:"AI Analyzer" },
    { id:"validator", icon:Check,    label:"Outfit Validator", badge:"NEW" },
    { id:"closet",    icon:Shirt,    label:"My Closet" },
    { id:"calendar",  icon:Calendar, label:"Outfit Calendar" },
    { id:"community", icon:Users,    label:"Community" },
    { id:"pricing",   icon:Tag,      label:"Upgrade" },
  ]
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest"
  const initials    = displayName[0].toUpperCase()

  return (
    <div style={{background:NAVY,color:"white"}} className={`flex flex-col h-full ${mobile?"w-72":"w-64"} flex-shrink-0`}>
      {/* Logo */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white border-opacity-10">
        <div className="flex items-center gap-2">
          <div style={{background:GOLD}} className="w-8 h-8 rounded-lg flex items-center justify-center">
            <Shirt size={16} color={NAVY} />
          </div>
          <span className="text-xl font-black tracking-widest">DAPPER</span>
        </div>
        {mobile && <button onClick={onClose}><X size={20} /></button>}
      </div>

      {/* Usage badge */}
      <div className="mx-4 mt-4 mb-1 px-3 py-2 rounded-xl" style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.25)"}}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-xs font-bold tracking-widest" style={{color:GOLD}}>FREE TIER</div>
            <div className="text-xs text-gray-400">3 AI analyses / month</div>
          </div>
          <button onClick={()=>{setPage("pricing");if(onClose)onClose()}} className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:GOLD,color:NAVY}}>Pro</button>
        </div>
        <div className="flex gap-1 mt-1">
          {[1,2,3].map(i=><div key={i} className="h-1 flex-1 rounded-full" style={{background:i===1?GOLD:"rgba(255,255,255,0.1)"}} />)}
        </div>
        <div className="text-xs text-gray-500 mt-1">1 of 3 used this month</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {items.map((item)=>{
          const {id,icon:Icon,label,badge} = item
          const active = page===id
          return (
            <button key={id} onClick={()=>{setPage(id);if(onClose)onClose()}}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active?"":"text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5"}`}
              style={active?{background:"rgba(201,168,76,0.15)",color:GOLD}:{}}
            >
              <Icon size={17}/>
              <span>{label}</span>
              {badge && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold" style={{background:GOLD,color:NAVY}}>{badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white border-opacity-10">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{background:GOLD,color:NAVY}}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{displayName}</div>
              <div className="text-xs text-gray-500">Free Member</div>
            </div>
            <button onClick={onLogOut} title="Sign out"
              className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all">
              <LogOut size={15} className="text-gray-500"/>
            </button>
          </div>
        ) : (
          <button onClick={onAuthClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all"
            style={{background:"rgba(201,168,76,0.15)",color:GOLD}}>
            <LogIn size={16}/>
            Sign in to sync data
          </button>
        )}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// SMART RECOMMENDATION HELPERS
// Generate specific tie, PS, and shoe recommendations for a given suit+shirt
// Includes patterned ties when appropriate — not just solids
// ─────────────────────────────────────────────────────────────────────────────

function getBestTiesForCombo(suitPat, shirtPat, suitColor) {
  // Rules:
  // Solid shirt → can have patterned tie (repp, dot, foulard, paisley)
  // Striped shirt → must have solid tie OR very different pattern (dot, foulard)
  // Check shirt → solid tie only
  // Textured shirt (end-on-end, oxford) → repp stripe, polka dot, foulard all work

  const suitColorLower = (suitColor || "").toLowerCase()

  // Color-appropriate tie colors based on suit
  const tieColorMap = {
    navy:     ["Burgundy", "Gold", "Forest Green", "Silver", "Terracotta", "Teal", "Burnt Orange"],
    charcoal: ["Burgundy", "Navy", "Forest Green", "Silver", "Teal", "Mustard", "Terracotta"],
    black:    ["Silver", "Burgundy", "Navy", "Gold", "Deep Teal"],
    grey:     ["Burgundy", "Navy", "Forest Green", "Mustard", "Teal", "Camel"],
    burgundy: ["Navy", "Olive", "Charcoal", "Gold", "Dark Green"],
    brown:    ["Camel", "Olive", "Navy", "Burgundy", "Forest Green"],
    beige:    ["Navy", "Camel", "Olive", "Burgundy", "Terracotta"],
    blue:     ["Burgundy", "Silver", "Navy", "Forest Green", "Gold"],
  }

  let colorKey = "navy"
  if (/charcoal|dark.?gr/.test(suitColorLower)) colorKey = "charcoal"
  else if (/black/.test(suitColorLower)) colorKey = "black"
  else if (/grey|gray/.test(suitColorLower)) colorKey = "grey"
  else if (/burgundy|wine|maroon/.test(suitColorLower)) colorKey = "burgundy"
  else if (/brown|chocolate/.test(suitColorLower)) colorKey = "brown"
  else if (/beige|tan|camel/.test(suitColorLower)) colorKey = "beige"
  else if (/blue/.test(suitColorLower)) colorKey = "blue"

  const colors = tieColorMap[colorKey] || tieColorMap.navy

  // Determine which patterns work given suit + shirt
  let allowedPatterns = []

  if (suitPat === "glen_plaid" || suitPat === "houndstooth") {
    // Solid only with check suits — grenadine and knit count as solid
    allowedPatterns = ["Solid Grenadine", "Wool Knit", "Silk Solid"]
    return [
      `${colors[0]} Grenadine (Solid) — ✓ Rule: solid tie required with plaid suit`,
      `${colors[1]} Wool Knit — ✓ Knit reads as solid, adds texture`,
      `${colors[2] || colors[0]} Silk Solid — ✓ Clean and correct`,
      `${colors[3] || colors[1]} Grenadine — ✓ Different color, same safe rule`,
    ]
  }

  if (suitPat === "chalk_stripe") {
    // Solid, dot, foulard, micro-paisley — no bold stripes
    if (shirtPat === "bengal_stripe" || shirtPat === "fine_stripe") {
      // Shirt already striped → tie MUST be solid
      return [
        `${colors[0]} Solid Grenadine — ✓ Solid tie required: shirt + suit both have stripe`,
        `${colors[1]} Wool Knit — ✓ Knit reads as solid, breaks pattern overlap`,
        `${colors[2] || colors[0]} Silk Solid — ✓ Keep it clean with two stripes in play`,
      ]
    }
    // Solid shirt → more options
    return [
      `${colors[0]} Solid Grenadine — ✓ Always correct with chalk stripe`,
      `${colors[1]} Polka Dot — ✓ Dots and stripes are complementary families`,
      `${colors[2]} Foulard (micro-geo) — ✓ Micro-pattern doesn't compete with the stripe`,
      `${colors[0]} Micro-Paisley — ✓ Small scale, different family from stripe`,
      `${colors[3]} Wool Knit — ✓ Texture against stripe — relaxed authority`,
      `Repp Stripe (narrow) — ✓ Only if dramatically finer than the chalk stripe`,
    ]
  }

  if (suitPat === "herringbone" || suitPat === "tweed") {
    // Texture suits accept more variety
    if (suitPat === "tweed") {
      return [
        `${colors[0]} Wool Knit — ✓ Natural fibre on natural fibre — classic`,
        `${colors[1]} Wool Knit — ✓ Different color, same texture harmony`,
        `${colors[2]} Solid Grenadine — ✓ Grenadine texture complements tweed`,
        `${colors[0]} Repp Stripe — ✓ Clean stripe against textured suit works well`,
        `${colors[3]} Polka Dot — ✓ Dots are a different visual family`,
        `${colors[1]} Knit (no tie option) — ✓ Tweed also works well without a tie`,
      ]
    }
    return [
      `${colors[0]} Solid Grenadine — ✓ Grenadine texture echoes herringbone weave`,
      `${colors[1]} Repp Stripe — ✓ Clean stripe reads beautifully against herringbone`,
      `${colors[2]} Polka Dot — ✓ Circular vs V-weave — excellent contrast`,
      `${colors[0]} Wool Knit — ✓ Wool-on-wool texture dialogue`,
      `${colors[3]} Foulard (micro-geo) — ✓ Small pattern, different family`,
      `${colors[1]} Club Stripe — ✓ Diagonal club stripe against herringbone V-weave`,
    ]
  }

  if (suitPat === "linen") {
    return [
      `No tie — ✓ Linen suit worn open-collar is classic and correct`,
      `${colors[0]} Cotton/Linen Knit — ✓ Natural fibre match for linen`,
      `${colors[1]} Wool Knit — ✓ Texture tie, relaxed register`,
      `${colors[2]} Solid (light) — ✓ Keep it relaxed — no silk repp with linen`,
    ]
  }

  // Solid suit — most freedom
  if (shirtPat === "bengal_stripe" || shirtPat === "fine_stripe") {
    // Striped shirt → solid or dot/foulard tie
    return [
      `${colors[0]} Solid Grenadine — ✓ Solid tie essential when shirt is striped`,
      `${colors[1]} Polka Dot — ✓ Dots are a different family from stripes — expert move`,
      `${colors[2]} Foulard (micro-geo) — ✓ Micro-pattern breaks the stripe family`,
      `${colors[0]} Wool Knit — ✓ Knit reads as solid — always safe`,
      `${colors[3]} Micro-Paisley — ✓ Tiny paisley, completely different from stripes`,
    ]
  }

  if (shirtPat === "gingham") {
    // Check shirt → solid tie only
    return [
      `${colors[0]} Solid Grenadine — ✓ Solid mandatory: gingham shirt + patterned tie = conflict`,
      `${colors[1]} Wool Knit — ✓ Knit reads as solid — great texture contrast`,
      `${colors[2]} Silk Solid — ✓ Any solid color works here`,
      `Repp Stripe — ⚠️ Only acceptable because check and stripe are different families`,
    ]
  }

  if (shirtPat === "end_on_end" || shirtPat === "oxford" || shirtPat === "chambray") {
    // Subtle texture shirt → repp stripe, dot, foulard all work
    return [
      `${colors[0]} Repp Stripe — ✓ Clean stripe on subtle texture shirt is the classic`,
      `${colors[1]} Polka Dot — ✓ Dot on textured shirt — excellent contrast`,
      `${colors[0]} Solid Grenadine — ✓ Always correct`,
      `${colors[2]} Foulard (micro-geo) — ✓ Geometric on textured shirt — refined`,
      `${colors[3]} Micro-Paisley — ✓ Different family, small scale — works perfectly`,
      `${colors[1]} Wool Knit — ✓ Textural richness on textural shirt`,
    ]
  }

  // Solid shirt + solid suit → full freedom
  return [
    `${colors[0]} Repp Stripe — ✓ The classic business tie — always correct`,
    `${colors[1]} Polka Dot — ✓ Sophisticated pattern, different family`,
    `${colors[0]} Solid Grenadine — ✓ Elegant simplicity — texture is the detail`,
    `${colors[2]} Foulard (micro-geo) — ✓ Small geometric — Italian elegance`,
    `${colors[3]} Paisley — ✓ Bold pattern works against solid suit + solid shirt`,
    `${colors[1]} Wool Knit — ✓ Relaxed authority — great for creative environments`,
  ]
}

function getBestPSForShirt(shirtColor) {
  const c = (shirtColor || "").toLowerCase()
  // PS should echo the shirt, not the tie
  // White is always safe
  if (/pink/.test(c)) return ["White Irish Linen", "Pink Silk — Puff Fold", "White Cotton"]
  if (/blue|french/.test(c)) return ["White Irish Linen", "Ivory Cotton", "White Cotton"]
  if (/cream|ivory/.test(c)) return ["Cream Silk — Puff Fold", "White Linen", "Ivory Cotton"]
  if (/yellow/.test(c)) return ["White Irish Linen", "White Cotton", "Ivory Silk"]
  if (/grey|gray/.test(c)) return ["White Irish Linen", "White Cotton", "Silver Silk"]
  return ["White Irish Linen — always correct", "White Cotton — clean and classic", "Ivory Cotton — One Point fold"]
}

function getBestShoesForSuit(suitColor) {
  const c = (suitColor || "").toLowerCase()
  if (/navy|blue/.test(c)) return ["Black Cap-Toe Oxford", "Dark Brown Derby Brogue", "Burgundy Oxford"]
  if (/charcoal/.test(c)) return ["Black Cap-Toe Oxford", "Dark Brown Brogue", "Black Oxford Brogue"]
  if (/black/.test(c)) return ["Black Cap-Toe Oxford", "Black Patent (formal)", "Black Derby"]
  if (/grey|gray/.test(c)) return ["Black Oxford", "Brown Derby Brogue", "Burgundy Oxford"]
  if (/brown/.test(c)) return ["Dark Brown Oxford", "Tan Derby", "Cognac Brogue"]
  if (/beige|tan|camel/.test(c)) return ["Tan Derby", "White Leather Loafer", "Light Brown Oxford"]
  if (/burgundy|wine/.test(c)) return ["Dark Brown Oxford", "Black Oxford", "Cognac Derby"]
  return ["Black Cap-Toe Oxford", "Brown Derby Brogue", "Black Oxford Brogue"]
}

// ─────────────────────────────────────────────
// PAGE: AI ANALYZER
// ─────────────────────────────────────────────

function AnalyzerPage() {
  const { analyzeOutfit, analyzeText, generateExoticAnalysis, isAnalyzing: isVisionAnalyzing } = useClaudeVision()
  const [mode, setMode]               = useState("A")
  const [analyzing, setAnalyzing]     = useState(false)
  const [done, setDone]               = useState(false)
  const [progress, setProgress]       = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [shirtIdx, setShirtIdx]       = useState(0)
  const [comboAssessment, setComboAssessment] = useState(null)
  const [tieIdx, setTieIdx]           = useState(null)
  const [pkgIdx, setPkgIdx]           = useState(null)
  const [textInput, setTextInput]     = useState("")
  const [analysisData, setAnalysisData] = useState(ANALYSIS)
  const [keyError, setKeyError]       = useState("")
  const [isDemo, setIsDemo]           = useState(false)
  const [occasion, setOccasion]       = useState("All")
  const [suitPhoto, setSuitPhoto]     = useState(null)
  const [shirtPhoto, setShirtPhoto]   = useState(null)
  const [photoResult, setPhotoResult]           = useState(null)
  const [shirtPhotoResult, setShirtPhotoResult] = useState(null)
  const [correcting, setCorrecting]             = useState(false)
  const [correction, setCorrection]             = useState({ color:"", pattern:"", fabric:"" })
  const [correctingShirt, setCorrectingShirt]   = useState(false)
  const [shirtCorrection, setShirtCorrection]   = useState({ color:"", pattern:"" })
  const suitInputRef  = { current: null }
  const shirtInputRef = { current: null }

  const [suitFile, setSuitFile] = useState(null)
  const [shirtFile, setShirtFile] = useState(null)

  const handlePhotoSelect = (e, setter) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) return
    if (setter === setSuitPhoto) setSuitFile(file)
    if (setter === setShirtPhoto) setShirtFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setter(ev.target.result)
    reader.readAsDataURL(file)
  }

  const STEPS = [
    "Analyzing fabric & color…",
    "Identifying pattern type…",
    "Calculating formality tier…",
    "Generating shirt pairings…",
    "Computing tie harmonics…",
    "Building outfit packages…",
    "Finalizing style intelligence…",
  ]

  const SYSTEM_PROMPT = "" // removed — text mode uses lightweight analyzeText()

  const runAnalysis = async () => {
    setKeyError("")

    // ── PHOTO MODE — 100% local, no API ──
    if ((mode === "A" || mode === "B") && suitPhoto) {
      setIsDemo(true)
      setAnalyzing(true); setProgress(0); setCurrentStep(0)
      let p = 0
      const iv = setInterval(() => {
        p += Math.random() * 14 + 4
        setCurrentStep(Math.min(Math.floor((p / 100) * STEPS.length), STEPS.length - 1))
        if (p >= 88) clearInterval(iv)
        setProgress(Math.min(p, 88))
      }, 180)

      // Analyze suit photo — Claude Vision AI
      const visionResult = await analyzeOutfit(suitFile);
      if (visionResult.success && visionResult.data) {
        const d = visionResult.data;
        const analysis = getAnalysisFromPhotoResult({
          colorKey: d.suit.color,
          patternInfo: { pattern: d.suit.patternLabel, fabric: d.suit.fabric, formality: 'Business Formal' },
          fabricStr: d.suit.fabric,
          r: 26, g: 39, b: 78
        });
        setAnalysisData(analysis);
        setPhotoResult({
          colorKey: d.suit.color,
          colorLabel: d.suit.colorLabel,
          colorHex: d.suit.colorHex,
          patternInfo: { pattern: d.suit.patternLabel, formality: 'Business Formal' },
          fabricStr: d.suit.fabric,
          confidence: d.suit.confidence,
          visionData: d,
          r: 26, g: 39, b: 78
        });
      } else {
        const suitResult = await analyzePhotoLocally(suitPhoto);
        const analysis = getAnalysisFromPhotoResult(suitResult);
        setAnalysisData(analysis);
        if (suitResult) setPhotoResult(suitResult);
      }
      if (mode === "B" && shirtPhoto) {
        const shirtResult = await analyzePhotoLocally(shirtPhoto);
        if (shirtResult) setShirtPhotoResult(shirtResult);
      }

      clearInterval(iv)
      setProgress(100)
      setTimeout(() => { setAnalyzing(false); setDone(true) }, 400)
      return
    }

        setIsDemo(false)

    // Live AI mode
    const description = mode==="C" && textInput.trim()
      ? textInput.trim()
      : "Please describe the suit you'd like analyzed."

    setAnalyzing(true); setProgress(0); setCurrentStep(0)
    let p=0
    const iv = setInterval(()=>{
      p += Math.random()*8+2
      setCurrentStep(Math.min(Math.floor((p/100)*STEPS.length), STEPS.length-1))
      if(p>=88) clearInterval(iv)
      setProgress(Math.min(p,88))
    },220)

    try {

      // Hybrid: local engine first, Claude only for combo assessment
      const desc = description.toLowerCase()
      const mentionsTie = /tie|corbata|necktie/.test(desc)
      const mentionsShirt = /shirt|camisa/.test(desc)
      const needsComboCheck = mentionsTie || mentionsShirt

      if (needsComboCheck) {
        // User described a specific combo — try AI first, local fallback always
        console.log("[Dapper Text] Combo detected")

        // Always generate a local combo assessment first
        const localCombo = getLocalComboAssessment(description)

        // Try AI for enhanced assessment
        let aiWorked = false
        try {
          const aiResult = await analyzeText(description)
          if (aiResult.success && aiResult.colorKey) {
            const aiDesc = aiResult.colorKey + " " + (aiResult.patternKey || "solid").replace(/_/g, " ") + " " + (aiResult.fabric || "")
            setAnalysisData(getLocalAnalysis(aiDesc))
            setIsDemo(false)
            aiWorked = true
            // Prefer AI assessment if available, otherwise use local
            if (aiResult.assessment) {
              setComboAssessment({
                assessment: aiResult.assessment,
                tie: aiResult.tie,
                shirt: aiResult.shirt,
                suitColor: aiResult.colorKey,
                tips: localCombo?.tips || [],
              })
            } else if (localCombo) {
              setComboAssessment(localCombo)
            }
          }
        } catch(aiErr) {
          console.log("[Dapper Text] AI combo failed, using local assessment")
        }

        // If AI failed or returned nothing useful, use local engine
        if (!aiWorked) {
          setAnalysisData(getLocalAnalysis(description))
          setIsDemo(false)
          if (localCombo) {
            setComboAssessment(localCombo)
          } else {
            setComboAssessment(null)
          }
        }
      } else {
        // Suit only — try local engine first, API only for exotic combos
        console.log("[Dapper Text] Suit only, trying local engine first")
        const localResult = getLocalAnalysis(description)
        if (localResult._isMatrixMatch) {
          console.log("[Dapper Text] Matrix match — 100% local, no API")
          setAnalysisData(localResult)
          setComboAssessment(null)
          setIsDemo(false)
        } else {
          // Exotic combo not in matrix — ask Claude to generate recommendations
          console.log("[Dapper Text] No matrix match for", localResult._detectedColor, localResult._detectedPattern, "— calling AI")
          try {
            const exoticResult = await generateExoticAnalysis(description, localResult._detectedColor, localResult._detectedPattern)
            if (exoticResult) {
              setAnalysisData(exoticResult)
              setIsDemo(false)
            } else {
              setAnalysisData(localResult)
              setIsDemo(false)
            }
          } catch(e) {
            console.log("[Dapper Text] Exotic AI failed, using base fallback")
            setAnalysisData(localResult)
            setIsDemo(false)
          }
          setComboAssessment(null)
        }
      }
    } catch(err) {
      setAnalysisData(getLocalAnalysis(description)); setIsDemo(true)
    } finally {
      clearInterval(iv)
      setProgress(100)
      setTimeout(()=>{ setAnalyzing(false); setDone(true) }, 400)
    }
  }

  const safeShirtIdx = (analysisData?.shirts && shirtIdx < analysisData.shirts.length) ? shirtIdx : 0
  const shirt = analysisData?.shirts?.[safeShirtIdx] ?? {}

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">AI Suit Analyzer</h1>
        <p className="text-gray-500 text-sm mt-1">Upload your suit and receive a complete wardrobe blueprint in seconds.</p>
      </div>

      {!done ? (
        <>
          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[{id:"A",label:"Suit Only",sub:"1 photo"},{id:"B",label:"Suit + Shirt",sub:"2 photos"},{id:"C",label:"Text Description",sub:"Describe it"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)}
                className={`py-3 px-4 rounded-xl border-2 text-left transition-all`}
                style={mode===m.id?{borderColor:GOLD,background:"#fffbeb"}:{borderColor:"#e5e7eb",background:"white"}}>
                <div className="font-bold text-sm text-gray-900">{m.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
              </button>
            ))}
          </div>

          {/* Occasion selector */}
          <div className="mb-6">
            <div className="text-xs font-black tracking-wider text-gray-400 mb-2">OCCASION <span className="text-gray-300 font-normal">(optional — filters outfit packages)</span></div>
            <div className="flex flex-wrap gap-2">
              {["All","Office","Wedding","Formal","Date","Funeral","Church","Interview","Casual"].map(o=>(
                <button key={o} onClick={()=>setOccasion(o)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                  style={occasion===o
                    ? {borderColor:GOLD, background:"#fffbeb", color:"#92400e"}
                    : {borderColor:"#e5e7eb", background:"white", color:"#6b7280"}}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Upload zones — iOS/Android camera compatible */}
          {(mode==="A"||mode==="B") && (
            <div className={`grid gap-4 mb-6 ${mode==="B"?"grid-cols-2":"grid-cols-1"}`}>

              {/* Suit photo */}
              <label htmlFor="suit-upload" style={{display:"block",cursor:"pointer"}}>
                <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:border-yellow-400 hover:bg-yellow-50"
                  style={{borderColor: suitPhoto ? GOLD : "#e5e7eb", background: suitPhoto ? "#fffbeb" : "white"}}>
                  {suitPhoto ? (
                    <div className="relative">
                      <img src={suitPhoto} alt="Suit" className="w-full h-40 object-cover rounded-xl mb-2"/>
                      <div className="text-xs font-bold text-yellow-700">✓ Suit photo ready</div>
                      <div className="text-xs text-gray-400 mt-1">Tap to change</div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-100">
                        <Camera size={26} className="text-gray-300"/>
                      </div>
                      <div className="font-semibold text-gray-700 text-sm mb-1">Your Suit</div>
                      <div className="text-xs text-gray-400">Upload a clear photo of your suit</div>
                      <div className="mt-3 text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-400 inline-block">📷 Tap to take photo or upload</div>
                    </>
                  )}
                </div>
                <input
                  id="suit-upload"
                  type="file"
                  accept="image/*"
                  style={{display:"none"}}
                  onChange={e => handlePhotoSelect(e, setSuitPhoto)}
                />
              </label>

              {/* Shirt photo — only in mode B */}
              {mode==="B" && (
                <label htmlFor="shirt-upload" style={{display:"block",cursor:"pointer"}}>
                  <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:border-yellow-400 hover:bg-yellow-50"
                    style={{borderColor: shirtPhoto ? GOLD : "#e5e7eb", background: shirtPhoto ? "#fffbeb" : "white"}}>
                    {shirtPhoto ? (
                      <div className="relative">
                        <img src={shirtPhoto} alt="Shirt" className="w-full h-40 object-cover rounded-xl mb-2"/>
                        <div className="text-xs font-bold text-yellow-700">✓ Shirt photo ready</div>
                        <div className="text-xs text-gray-400 mt-1">Tap to change</div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-100">
                          <Camera size={26} className="text-gray-300"/>
                        </div>
                        <div className="font-semibold text-gray-700 text-sm mb-1">Your Shirt</div>
                        <div className="text-xs text-gray-400">Upload the shirt you'll pair with it</div>
                        <div className="mt-3 text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-400 inline-block">📷 Tap to take photo or upload</div>
                      </>
                    )}
                  </div>
                  <input
                    id="shirt-upload"
                    type="file"
                    accept="image/*"
                    
                    style={{display:"none"}}
                    onChange={e => handlePhotoSelect(e, setShirtPhoto)}
                  />
                </label>
              )}

            </div>
          )}

          {mode==="C" && (
            <div className="mb-6">
              <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
                placeholder={`Describe your suit in detail…\n\nExample: "A mid-blue slim-fit wool suit with a subtle chalk stripe, notch lapel, and a slightly warm undertone. Brand is Canali."`}
                className="w-full border-2 rounded-2xl p-5 text-sm text-gray-700 resize-none focus:outline-none transition-all"
                style={{borderColor:"#e5e7eb",minHeight:"160px"}}
                onFocus={e=>e.target.style.borderColor=GOLD}
                onBlur={e=>e.target.style.borderColor="#e5e7eb"}
              />
              <div className="text-xs text-gray-400 mt-2">Include: color, pattern, fabric, brand, and formality level for best results.</div>
            </div>
          )}

          {keyError && <p className="text-xs text-red-400 mb-3 px-1">{keyError}</p>}

          {!analyzing ? (
            <button onClick={runAnalysis}
              className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98"
              style={{background:`linear-gradient(135deg,${NAVY} 0%,#1e3a5f 100%)`}}>
              <Wand2 size={20}/> Analyze My Suit
            </button>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{background:NAVY}}>
              <div className="text-white font-bold text-lg mb-1">Analyzing your ensemble…</div>
              <div className="text-sm mb-6" style={{color:"rgba(255,255,255,0.5)"}}>{STEPS[currentStep]}</div>
              <div className="w-full rounded-full h-2 mb-2" style={{background:"rgba(255,255,255,0.1)"}}>
                <div className="h-2 rounded-full transition-all duration-300" style={{width:`${progress}%`,background:`linear-gradient(90deg,${GOLD},#E8C86A)`}}/>
              </div>
              <div className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{Math.round(progress)}% complete</div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900">Analysis Complete ✓</h2>
              {photoResult
                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:"#059669"}}>📷 Photo Analysis — Instant</span>
                : isDemo
                  ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">DEMO — add API key for real results</span>
                  : <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:GOLD}}>✦ AI Analysis</span>
              }
            </div>
            <button onClick={()=>{setDone(false);setShirtIdx(0);setTieIdx(null);setPkgIdx(null);setComboAssessment(null);setPhotoResult(null);setShirtPhotoResult(null);setSuitPhoto(null);setShirtPhoto(null);setCorrecting(false);setCorrection({color:'',pattern:'',fabric:''});setCorrectingShirt(false);setShirtCorrection({color:'',pattern:''})}} className="text-sm text-gray-400 hover:text-gray-600 underline">← New Analysis</button>
          </div>

          {/* Photo detected results — with correction UI */}
          {photoResult && (
            <div className="space-y-3">

              {/* Photo tips banner */}
              <div className="rounded-xl p-3 text-xs" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                <div className="font-black tracking-wider text-gray-500 mb-2">📸 PHOTO TIPS FOR BEST RESULTS</div>
                <div className="space-y-1 text-gray-400 leading-relaxed">
                  <div>✓ <strong>Good lighting</strong> — natural daylight or bright indoor light. Avoid shadows on the fabric.</div>
                  <div>✓ <strong>Flat lay or hanger</strong> — lay the suit flat or hang it. Avoid wearing it in the photo.</div>
                  <div>✓ <strong>Fill the frame</strong> — the suit should take up most of the photo, not the background.</div>
                  <div>✓ <strong>Neutral background</strong> — white wall, light floor. Avoid busy backgrounds.</div>
                  <div>✓ <strong>No flash</strong> — flash washes out colors. Use ambient light instead.</div>
                </div>
              </div>

              {/* Suit detected */}
              <div className="rounded-2xl p-4" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 border-2 border-white shadow overflow-hidden">
                    {suitPhoto
                      ? <img src={suitPhoto} alt="suit" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full" style={{background:`rgb(${photoResult.r},${photoResult.g},${photoResult.b})`}}/>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black tracking-wider text-green-700 mb-1">🎽 SUIT DETECTED</div>
                    {!correcting ? (
                      <>
                        <div className="text-sm font-bold text-gray-900">{photoResult.colorLabel || COLOR_FAMILY_LABELS[photoResult.colorKey]} · {photoResult.patternInfo.pattern}</div>
                        <div className="text-xs text-gray-500 mb-2">{photoResult.fabricStr} · {photoResult.patternInfo.formality}</div>
                        <button onClick={()=>{ setCorrecting(true); setCorrection({ color:COLOR_FAMILY_LABELS[photoResult.colorKey], pattern:photoResult.patternInfo.pattern, fabric:photoResult.fabricStr }) }}
                          className="text-xs px-3 py-1.5 rounded-lg font-bold border-2 transition-all"
                          style={{borderColor:GOLD,color:"#92400e",background:"#fffbeb"}}>
                          ✏️ Correct Detection
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 mb-1">Correct what was detected:</div>
                        <div>
                          <div className="text-xs font-bold text-gray-500 mb-1">COLOR</div>
                          <div className="flex flex-wrap gap-1">
                            {["White","Ivory","Cream","Light Blue","Sky Blue","Powder Blue","Baby Blue","French Blue","Blue","Cobalt","Royal Blue","Navy","Midnight Navy","Indigo","Light Grey","Silver","Grey","Slate","Charcoal","Black","Beige","Tan","Camel","Khaki","Brown","Chocolate","Espresso","Olive","Green","Forest Green","Mint","Sage","Pink","Blush","Rose","Red","Crimson","Burgundy","Wine","Claret","Oxblood","Lavender","Purple","Plum","Yellow","Mustard","Gold","Orange","Rust","Terracotta"].map(c=>(
                              <button key={c} onClick={()=>setCorrection(p=>({...p,color:c}))}
                                className="px-2 py-1 rounded-full text-xs font-bold border transition-all"
                                style={correction.color===c?{borderColor:GOLD,background:"#fffbeb",color:"#92400e"}:{borderColor:"#e5e7eb",color:"#6b7280"}}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-500 mb-1">PATTERN</div>
                          <div className="flex flex-wrap gap-1">
                            {["Solid","Chalk Stripe / Pinstripe","Glen Plaid / Check","Herringbone","Tweed","Houndstooth","Linen"].map(p=>(
                              <button key={p} onClick={()=>setCorrection(pr=>({...pr,pattern:p}))}
                                className="px-2 py-1 rounded-full text-xs font-bold border transition-all"
                                style={correction.pattern===p?{borderColor:GOLD,background:"#fffbeb",color:"#92400e"}:{borderColor:"#e5e7eb",color:"#6b7280"}}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={()=>{
                            // Apply correction and re-run analysis
                            const colorMap = {"White":"white","Ivory":"white","Cream":"white","Light Blue":"blue","Sky Blue":"blue","Powder Blue":"blue","Baby Blue":"blue","French Blue":"blue","Blue":"blue","Cobalt":"blue","Royal Blue":"blue","Navy":"navy","Midnight Navy":"navy","Indigo":"navy","Light Grey":"grey","Silver":"grey","Grey":"grey","Slate":"charcoal","Charcoal":"charcoal","Black":"black","Beige":"beige","Tan":"beige","Camel":"brown","Khaki":"beige","Brown":"brown","Chocolate":"brown","Espresso":"brown","Olive":"green","Green":"green","Forest Green":"green","Mint":"green","Sage":"green","Pink":"burgundy","Blush":"burgundy","Rose":"burgundy","Red":"burgundy","Crimson":"burgundy","Burgundy":"burgundy","Wine":"burgundy","Claret":"burgundy","Oxblood":"burgundy","Lavender":"grey","Purple":"navy","Plum":"burgundy","Yellow":"beige","Mustard":"brown","Gold":"brown","Orange":"brown","Rust":"brown","Terracotta":"brown"}
                            const patMap = {"Solid":"solid","Chalk Stripe / Pinstripe":"chalk_stripe","Glen Plaid / Check":"glen_plaid","Herringbone":"herringbone","Tweed":"tweed","Houndstooth":"glen_plaid","Linen":"linen"}
                            const colorKey  = colorMap[correction.color] || photoResult.colorKey
                            const patternKey = patMap[correction.pattern] || "solid"
                            const patternInfo = { pattern: correction.pattern, fabric: correction.fabric || photoResult.fabricStr, formality: photoResult.patternInfo.formality }
                            const newResult = { ...photoResult, colorKey, colorLabel: correction.color, patternInfo, fabricStr: correction.fabric || photoResult.fabricStr }
                            const analysis = getAnalysisFromPhotoResult(newResult)
                            setAnalysisData(analysis)
                            setPhotoResult(newResult)
                            setCorrecting(false)
                          }}
                            className="flex-1 py-2 rounded-xl text-xs font-black tracking-wider transition-all"
                            style={{background:GOLD,color:NAVY}}>
                            ✓ APPLY CORRECTION
                          </button>
                          <button onClick={()=>setCorrecting(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shirt detected — only in mode B */}
              {mode === "B" && shirtPhotoResult && (
                <div className="rounded-2xl p-4" style={{background:"#eff6ff",border:"1px solid #bfdbfe"}}>
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 border-2 border-white shadow overflow-hidden">
                      {shirtPhoto
                        ? <img src={shirtPhoto} alt="shirt" className="w-full h-full object-cover"/>
                        : <div className="w-full h-full" style={{background:`rgb(${shirtPhotoResult.r},${shirtPhotoResult.g},${shirtPhotoResult.b})`}}/>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black tracking-wider text-blue-700 mb-1">👔 SHIRT DETECTED</div>
                      {!correctingShirt ? (
                        <>
                          <div className="text-sm font-bold text-gray-900">{COLOR_FAMILY_LABELS[shirtPhotoResult.colorKey] || "Light"} · {shirtPhotoResult.patternInfo.pattern}</div>
                          <div className="text-xs text-gray-500 mb-2">{shirtPhotoResult.fabricStr}</div>
                          {/* Compatibility check */}
                          {(() => {
                            const suitPat  = getSuitPatternKey(analysisData.suit?.pattern || '')
                            const shirtPat = classifyShirtPattern(shirtPhotoResult.patternInfo.pattern)
                            const combo    = scorePatternCombo(suitPat, shirtPat, "solid_tie")
                            return (
                              <div className="text-xs rounded-lg px-2 py-1.5 font-semibold mb-2"
                                style={{
                                  background: combo.score >= 8 ? "#dcfce7" : combo.score >= 6 ? "#fef9c3" : "#fee2e2",
                                  color: combo.score >= 8 ? "#166534" : combo.score >= 6 ? "#713f12" : "#991b1b"
                                }}>
                                {combo.score >= 8 ? "✓ This shirt works well with your suit" : combo.score >= 6 ? "⚡ Borderline — see tie recommendations below" : "⚠️ Pattern conflict with suit — check recommendations"}
                              </div>
                            )
                          })()}
                          <button onClick={()=>{ setCorrectingShirt(true); setShirtCorrection({ color: COLOR_FAMILY_LABELS[shirtPhotoResult.colorKey] || "", pattern: shirtPhotoResult.patternInfo.pattern }) }}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold border-2 transition-all"
                            style={{borderColor:"#3b82f6",color:"#1d4ed8",background:"#eff6ff"}}>
                            ✏️ Correct Detection
                          </button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 mb-1">Correct what was detected:</div>
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-1">SHIRT COLOR</div>
                            <div className="flex flex-wrap gap-1">
                              {["White","Pale Blue","French Blue","Light Pink","Light Grey","Cream","Yellow","Pale Green","Oxford White"].map(c=>(
                                <button key={c} onClick={()=>setShirtCorrection(p=>({...p,color:c}))}
                                  className="px-2 py-1 rounded-full text-xs font-bold border transition-all"
                                  style={shirtCorrection.color===c?{borderColor:"#3b82f6",background:"#eff6ff",color:"#1d4ed8"}:{borderColor:"#e5e7eb",color:"#6b7280"}}>
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-1">SHIRT PATTERN</div>
                            <div className="flex flex-wrap gap-1">
                              {["Solid","Bengal Stripe","Fine Stripe","End-on-End","Oxford Weave","Chambray","Gingham","Twill"].map(p=>(
                                <button key={p} onClick={()=>setShirtCorrection(pr=>({...pr,pattern:p}))}
                                  className="px-2 py-1 rounded-full text-xs font-bold border transition-all"
                                  style={shirtCorrection.pattern===p?{borderColor:"#3b82f6",background:"#eff6ff",color:"#1d4ed8"}:{borderColor:"#e5e7eb",color:"#6b7280"}}>
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={()=>{
                              const newShirtResult = {
                                ...shirtPhotoResult,
                                colorKey: "light_grey",
                                patternInfo: { ...shirtPhotoResult.patternInfo, pattern: shirtCorrection.pattern },
                                fabricStr: shirtPhotoResult.fabricStr,
                                correctedColor: shirtCorrection.color,
                                correctedPattern: shirtCorrection.pattern,
                              }
                              setShirtPhotoResult(newShirtResult)
                              setCorrectingShirt(false)
                            }}
                              className="flex-1 py-2 rounded-xl text-xs font-black tracking-wider"
                              style={{background:"#3b82f6",color:"white"}}>
                              ✓ APPLY CORRECTION
                            </button>
                            <button onClick={()=>setCorrectingShirt(false)}
                              className="px-4 py-2 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Shirt not detected yet in mode B */}
              {mode === "B" && !shirtPhotoResult && (
                <div className="rounded-2xl p-3 text-xs text-gray-400" style={{background:"#f8fafc",border:"1px dashed #e2e8f0"}}>
                  👔 Shirt photo not yet analyzed — make sure you selected a shirt photo before running analysis.
                </div>
              )}

            </div>
          )}

          {/* Suit card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-16 h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{background: photoResult ? `rgb(${photoResult.r},${photoResult.g},${photoResult.b})` : "#1B3A6B"}}>
                {suitPhoto
                  ? <img src={suitPhoto} alt="suit" className="w-full h-full object-cover"/>
                  : <Shirt size={24} color="white"/>}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs font-black tracking-wider px-2 py-0.5 rounded-full text-white" style={{background:NAVY}}>SUIT ANALYSIS</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background:"#fef3c7",color:"#92400e"}}>{analysisData?.suit?.formality || ""}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">{analysisData?.suit?.colorFamily || ""}</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs">
                  {[["Fabric",analysisData?.suit?.fabric],["Pattern",analysisData?.suit?.pattern],["Lapel",analysisData?.suit?.lapel],["Fit",analysisData?.suit?.fit],["Undertones",analysisData?.suit?.undertones]].filter(([k,v])=>v).map(([k,v])=>(
                    <div key={k}><span className="text-gray-400">{k}: </span><span className="text-gray-700 font-semibold">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shirt section — adapts based on whether shirt photo was provided */}
          <div>
            {mode === "B" && shirtPhotoResult ? (
              /* ── SHIRT PHOTO PROVIDED: Validate suit+shirt and give specific recommendations ── */
              <div className="space-y-3 mb-4">
                <SectionLabel n={2} label="Your Suit + Shirt Combination"/>

                {/* Suit + Shirt validation card */}
                {(() => {
                  const suitPat  = getSuitPatternKey(analysisData.suit?.pattern || '')
                  const shirtPatName = shirtPhotoResult.correctedPattern || shirtPhotoResult.patternInfo.pattern
                  const shirtPat = classifyShirtPattern(shirtPatName)
                  const combo    = scorePatternCombo(suitPat, shirtPat, "solid_tie")
                  const shirtColor = shirtPhotoResult.correctedColor || (COLOR_FAMILY_LABELS[shirtPhotoResult.colorKey] || "Light")
                  return (
                    <div className="rounded-2xl p-4 border-2" style={{
                      background: combo.score >= 8 ? "#f0fdf4" : combo.score >= 6 ? "#fffbeb" : "#fef2f2",
                      borderColor: combo.score >= 8 ? "#86efac" : combo.score >= 6 ? "#fcd34d" : "#fca5a5"
                    }}>
                      {/* Two pieces side by side */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex gap-2">
                          <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-white shadow">
                            {suitPhoto
                              ? <img src={suitPhoto} alt="suit" className="w-full h-full object-cover"/>
                              : <div className="w-full h-full" style={{background: photoResult ? `rgb(${photoResult.r},${photoResult.g},${photoResult.b})` : "#1B3A6B"}}/>
                            }
                          </div>
                          <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-white shadow">
                            {shirtPhoto
                              ? <img src={shirtPhoto} alt="shirt" className="w-full h-full object-cover"/>
                              : <div className="w-full h-full" style={{background: `rgb(${shirtPhotoResult.r},${shirtPhotoResult.g},${shirtPhotoResult.b})`}}/>
                            }
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-sm" style={{
                            color: combo.score >= 8 ? "#166534" : combo.score >= 6 ? "#92400e" : "#991b1b"
                          }}>
                            {combo.score >= 8 ? "✦ Great combination!" : combo.score >= 6 ? "⚡ Works — with the right tie" : "⚠️ Pattern conflict"}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {analysisData?.suit?.colorFamily || ""} + {shirtColor} {shirtPatName !== "Solid" ? shirtPatName : "shirt"}
                          </div>
                          <div className="text-xs mt-1" style={{
                            color: combo.score >= 8 ? "#166534" : combo.score >= 6 ? "#92400e" : "#991b1b"
                          }}>
                            {combo.tips?.[0] || combo.warnings?.[0] || combo.violations?.[0] || "Pattern combination evaluated."}
                          </div>
                        </div>
                      </div>

                      {/* What to add */}
                      <div className="text-xs font-black tracking-wider text-gray-500 mb-2">WHAT TO ADD</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[
                          { label:"BEST TIES", items: getBestTiesForCombo(suitPat, shirtPat, analysisData.suit.colorFamily) },
                          { label:"POCKET SQUARE", items: getBestPSForShirt(shirtColor) },
                          { label:"SHOES", items: getBestShoesForSuit(analysisData.suit.colorFamily) },
                        ].map(({label, items}) => (
                          <div key={label} className="bg-white rounded-xl p-2">
                            <div className="font-black tracking-wider text-gray-400 mb-1" style={{fontSize:"8px"}}>{label}</div>
                            {items.map((item,i) => (
                              <div key={i} className="text-gray-700 font-semibold leading-tight mb-0.5" style={{fontSize:"10px"}}>{item}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* ── NO SHIRT PHOTO: Show recommended shirts to choose from ── */
              <>
                {/* Combo Assessment — shown when user described a specific combination */}
                {comboAssessment && (
                  <div className="rounded-2xl p-4 mb-4" style={{background:"linear-gradient(135deg,#1a1207,#2a1f0a)",border:"1px solid rgba(201,168,76,0.3)"}}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-xs font-black tracking-wider" style={{color:"#C9A84C"}}>YOUR COMBINATION</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{background:"rgba(201,168,76,0.15)",color:"#C9A84C",border:"1px solid rgba(201,168,76,0.25)",textTransform:"capitalize"}}>{comboAssessment.suitColor} suit</span>
                      {comboAssessment.tie && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{background:"rgba(201,168,76,0.15)",color:"#C9A84C",border:"1px solid rgba(201,168,76,0.25)",textTransform:"capitalize"}}>{comboAssessment.tie.color} {comboAssessment.tie.pattern} tie</span>}
                      {comboAssessment.shirt && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{background:"rgba(201,168,76,0.15)",color:"#C9A84C",border:"1px solid rgba(201,168,76,0.25)",textTransform:"capitalize"}}>{comboAssessment.shirt.color} shirt</span>}
                    </div>
                    <p className="text-sm leading-relaxed" style={{color:"#e8dcc8"}}>{comboAssessment.assessment}</p>
                    {comboAssessment.tips && comboAssessment.tips.length > 0 && (
                      <div className="mt-3 pt-3" style={{borderTop:"1px solid rgba(201,168,76,0.15)"}}>
                        <div className="text-xs font-black tracking-wider mb-2" style={{color:"#C9A84C"}}>SUGGESTIONS</div>
                        <div className="space-y-1.5">
                          {comboAssessment.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs" style={{color:"#d4c9a8"}}>
                              <span style={{color:"#C9A84C"}}>•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <SectionLabel n={2} label="Recommended Shirts"/>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {(analysisData?.shirts || []).map((s,i)=>(
                    <button key={s.id} onClick={()=>{setShirtIdx(i);setTieIdx(null)}}
                      className="p-3 rounded-xl border-2 text-left transition-all bg-white"
                      style={shirtIdx===i?{borderColor:GOLD,boxShadow:"0 2px 12px rgba(201,168,76,0.2)"}:{borderColor:"#f1f5f9"}}>
                      <div className="w-8 h-8 rounded-full border-2 border-gray-100 mb-2" style={{background:s.colorCode}}/>
                      <div className="text-xs font-bold text-gray-800 leading-tight">{s.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.collar}</div>
                    </button>
                  ))}
                </div>
                <div className="rounded-xl p-3 text-sm text-blue-800 mb-4" style={{background:"#eff6ff",border:"1px solid #bfdbfe"}}>
                  <strong>{shirt?.name || "Select a shirt"}</strong>{shirt?.why && <span> — {shirt.why}</span>}
                </div>
              </>
            )}

            {/* Tie selector — Pattern Intelligence */}
            <SectionLabel n={3} label={`Tie Pairings for "${shirt.name}"`}/>
            {(() => {
              if (!shirt || !shirt.ties) return null
              const suitPatKey = getSuitPatternKey(analysisData.suit?.pattern || '')
              const scoredTies = filterTiesForSuitAndShirt(shirt.ties || [], suitPatKey, shirt.name)
              const hasBadTies = scoredTies.some(t => t.isAvoidable)
              return (
                <>
                  {/* Pattern advice banner */}
                  <div className="mb-3 rounded-xl p-3 text-xs" style={{background:"#fffbeb",border:`1px solid ${GOLD}33`}}>
                    <div className="font-black tracking-wider mb-1" style={{color:GOLD}}>🎨 PATTERN INTELLIGENCE</div>
                    <div className="text-gray-600 leading-relaxed">
                      {suitPatKey === "solid_suit"    && "Solid suit: total freedom. Solid, repp stripe, polka dot, foulard, paisley — any pattern works. Mix different pattern families freely."}
                      {suitPatKey === "chalk_stripe"  && "Chalk stripe suit: solid grenadines and knits are safe. But polka dots, foulards, and micro-paisley add personality — they're a different pattern family so they work beautifully. Avoid another bold stripe tie."}
                      {suitPatKey === "glen_plaid"    && "Glen plaid suit: solid tie is the rule. The plaid is already the statement — the tie should never compete. Grenadine and knit ties count as solid."}
                      {suitPatKey === "herringbone"   && "Herringbone suit: reads as near-solid at distance, so it accepts the full range — repp stripes, polka dots, foulards, micro-paisley, and knits all work well."}
                      {suitPatKey === "tweed"         && "Tweed suit: wool knit ties are the natural partner. Bold repp stripes work too. Avoid formal silk — keep it in the natural fibre family."}
                      {suitPatKey === "houndstooth"   && "Houndstooth suit: solid tie mandatory. Grenadine and knit only. Never another check or bold pattern."}
                      {suitPatKey === "linen"         && "Linen suit: often best without a tie. If worn, a cotton or linen knit is ideal. Repp stripes also work — avoid heavy formal silk."}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {(scoredTies || []).map((tie,i)=>(
                      <button key={tie.id} onClick={()=>setTieIdx(tieIdx===i?null:i)}
                        className="p-3 rounded-xl border-2 text-left bg-white transition-all relative"
                        style={tieIdx===i
                          ? {borderColor:GOLD}
                          : tie.isAvoidable
                            ? {borderColor:"#fca5a5",background:"#fff5f5"}
                            : tie.isRecommended
                              ? {borderColor:"#86efac",background:"#f0fdf4"}
                              : {borderColor:"#f1f5f9"}
                        }>
                        {/* Pattern score badge */}
                        <div className="absolute top-2 right-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: tie.patternScore >= 9 ? "#dcfce7" : tie.patternScore >= 7 ? "#fef9c3" : tie.patternScore >= 4 ? "#fed7aa" : "#fee2e2",
                              color: tie.patternScore >= 9 ? "#166534" : tie.patternScore >= 7 ? "#713f12" : tie.patternScore >= 4 ? "#9a3412" : "#991b1b",
                              fontSize: "9px",
                            }}>
                            {tie.patternLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-9 rounded flex-shrink-0" style={{background:tie.color}}/>
                          <div className="pr-10">
                            <div className="text-xs font-bold text-gray-800 leading-tight">{tie.name}</div>
                            <div className="text-xs text-gray-400">{tie.material}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {[tie?.harmony,tie?.knot,tie?.width].filter(Boolean).map(t=>(
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t}</span>
                          ))}
                        </div>

                        {/* Pattern warning/tip */}
                        {tie.patternWarning && (
                          <div className="mt-2 text-xs text-red-500 flex items-start gap-1">
                            <span>⚠️</span><span>{tie.patternWarning}</span>
                          </div>
                        )}
                        {!tie.patternWarning && tie.patternTip && (
                          <div className="mt-2 text-xs text-green-600 flex items-start gap-1">
                            <span>✓</span><span>{tie.patternTip}</span>
                          </div>
                        )}
                        {!tie.patternWarning && !tie.patternTip && tie.patternScore >= 8 && (
                          <div className="mt-2 text-xs text-green-600 flex items-start gap-1">
                            <span>✓</span><span>Works well with your suit and shirt combination.</span>
                          </div>
                        )}

                        {tieIdx===i && (
                          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                            {tie.why}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {hasBadTies && (
                    <div className="mb-3 text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-200"/>
                      <span>Red border = pattern conflict with your suit. Green border = expert recommended.</span>
                    </div>
                  )}
                </>
              )
            })()}

            {/* Pocket square */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-black tracking-wider text-gray-400 mb-1">POCKET SQUARE</div>
              <div className="text-sm font-bold text-gray-800">{shirt?.pocketSquare?.name || "Pocket Square"} — {shirt?.pocketSquare?.fold || ""}</div>
              <div className="text-xs text-gray-400">{shirt?.pocketSquare?.material || ""}</div>
            </div>
          </div>

          {/* Packages */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <SectionLabel n={5} label="Complete Outfit Packages"/>
              {occasion !== "All" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:"#fffbeb",color:"#92400e",border:`1px solid ${GOLD}`}}>
                    Filtered: {occasion}
                  </span>
                  <button onClick={()=>setOccasion("All")} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {(filterByOccasion(analysisData, occasion).packages || []).map((pkg,i)=>(
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button className="w-full p-4 text-left flex items-center justify-between" onClick={()=>setPkgIdx(pkgIdx===i?null:i)}>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[NAVY,pkg?.shirtColor,pkg?.tieColor].filter(Boolean).map((c,j)=>(
                          <div key={j} className="w-7 h-7 rounded-full border-2 border-white" style={{background:c,zIndex:3-j}}/>
                        ))}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{pkg.name}</div>
                        <div className="text-xs text-gray-400">{pkg.archetype} · {dots(pkg.confidence)}</div>
                      </div>
                    </div>
                    <span className="text-gray-300 text-lg">{pkgIdx===i?"−":"+"}</span>
                  </button>
                  {pkgIdx===i && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs mb-3">
                        {[["Suit",pkg?.suit],["Shirt",pkg?.shirt],["Tie",pkg?.tie],["Pocket Square",pkg?.pocketSquare],["Shoes",pkg?.shoes],["Belt",pkg?.belt],["Socks",pkg?.socks],["Watch",pkg?.watch]].filter(([k,v])=>v).map(([k,v])=>(
                          <div key={k}><span className="text-gray-400">{k}: </span><span className="text-gray-700 font-semibold">{v}</span></div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">📅 {pkg.occasion}</div>
                      <div className="rounded-xl p-3 text-xs text-yellow-800" style={{background:"#fffbeb",border:"1px solid #fde68a"}}>
                        <strong>💡 Styling Tip:</strong> {pkg.tip}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Style Mantra */}
          <div className="rounded-2xl p-6 text-center" style={{background:`linear-gradient(135deg,${NAVY},#1e3a5f)`}}>
            <div className="text-xs font-black tracking-widest mb-3" style={{color:GOLD}}>YOUR STYLE MANTRA</div>
            <p className="text-white text-base font-light italic leading-relaxed">
              {analysisData?.styleMantra || "Dress with intention. Every element is a decision — make each one count."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionLabel({n, label}) {
  return (
    <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 text-sm">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-black" style={{background:GOLD}}>{n}</span>
      {label}
    </h3>
  )
}

// ─────────────────────────────────────────────
// PAGE: CLOSET
// ─────────────────────────────────────────────

function ClosetPage({ closetItems, setClosetItems }) {
  const [filter,  setFilter]  = useState("All")
  const items = closetItems || CLOSET_ITEMS_INIT
  const setItems = setClosetItems || (() => {})
  const [modal,   setModal]   = useState(false)
  const [selected,setSelected]= useState(null)
  const [form,    setForm]    = useState({type:"Suit",name:"",brand:"",color:"#1B3A6B"})

  const TYPES = ["All","Suit","Shirt","Tie","Shoes","Accessory"]
  const shown  = filter==="All" ? items : items.filter(i=>i.type===filter)
  const counts = TYPES.reduce((a,t)=>({...a,[t]:t==="All"?items.length:items.filter(i=>i.type===t).length}),{})

  const save = () => {
    if(!form.name.trim()) return
    setItems(p=>[...p,{...form,id:Date.now(),occasions:[]}])
    setModal(false); setForm({type:"Suit",name:"",brand:"",color:"#1B3A6B"})
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Closet</h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} garments · {items.filter(i=>i.type==="Suit").length} suits</p>
        </div>
        <button onClick={()=>setModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{background:NAVY}}>
          <Plus size={15}/> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TYPES.map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter===t?"text-white shadow":""}`}
            style={filter===t?{background:NAVY}:{background:"#f1f5f9",color:"#64748b"}}>
            {t} <span className={`text-xs ml-1 ${filter===t?"text-yellow-400":"text-gray-400"}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* Limit warning */}
      {items.length>=15 && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between" style={{background:"#fffbeb"}}>
          <div className="flex items-center gap-2 text-sm text-yellow-800"><Lock size={14}/><span>Free tier: {items.length}/20 garments</span></div>
          <button className="text-xs font-bold text-yellow-800 underline">Upgrade for unlimited</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {shown.map(item=>(
          <button key={item.id} onClick={()=>setSelected(selected?.id===item.id?null:item)}
            className={`p-4 rounded-2xl border-2 text-left transition-all bg-white hover:shadow-md ${selected?.id===item.id?"shadow-md":""}`}
            style={selected?.id===item.id?{borderColor:GOLD}:{borderColor:"#f1f5f9"}}>
            <div className="w-full h-20 rounded-xl mb-3 flex items-center justify-center" style={{background:item.color+"22"}}>
              <div className="w-10 h-10 rounded-full shadow-inner" style={{background:item.color}}/>
            </div>
            <div className="text-xs font-black tracking-wider text-gray-400 mb-0.5">{item.type.toUpperCase()}</div>
            <div className="text-sm font-bold text-gray-800 leading-tight">{item.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.brand}</div>
          </button>
        ))}
        <button onClick={()=>setModal(true)} className="p-4 rounded-2xl border-2 border-dashed text-center hover:border-gray-300 transition-all" style={{borderColor:"#e5e7eb"}}>
          <div className="h-20 flex items-center justify-center"><Plus size={22} className="text-gray-200"/></div>
          <div className="text-sm text-gray-300">Add item</div>
        </button>
      </div>

      {/* Selected detail */}
      {selected && (
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:selected.color+"22"}}>
              <div className="w-8 h-8 rounded-full" style={{background:selected.color}}/>
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-gray-400">{selected.type.toUpperCase()}</div>
              <h3 className="text-xl font-black text-gray-900">{selected.name}</h3>
              <div className="text-sm text-gray-500">{selected.brand}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {selected.occasions.map(o=><span key={o} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{o}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black">Add Garment</h2>
              <button onClick={()=>setModal(false)}><X size={20} className="text-gray-300"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-5 gap-1.5 mt-1">
                  {["Suit","Shirt","Tie","Shoes","Accessory"].map(t=>(
                    <button key={t} onClick={()=>setForm(p=>({...p,type:t}))}
                      className="py-2 rounded-xl text-xs font-bold transition-all"
                      style={form.type===t?{background:NAVY,color:"white"}:{background:"#f1f5f9",color:"#64748b"}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Name</Label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. Navy Pinstripe" className="w-full mt-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{borderColor:"#f1f5f9"}} onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
              </div>
              <div>
                <Label>Brand</Label>
                <input value={form.brand} onChange={e=>setForm(p=>({...p,brand:e.target.value}))}
                  placeholder="e.g. BOSS" className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{borderColor:"#f1f5f9"}} onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))}
                    className="w-12 h-10 rounded-xl border-2 border-gray-100 cursor-pointer"/>
                  <span className="text-sm text-gray-400 font-mono">{form.color}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                <button onClick={save} disabled={!form.name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all" style={{background:NAVY}}>
                  Add to Closet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({children}) {
  return <div className="text-xs font-black tracking-wider text-gray-400">{children}</div>
}

// ─────────────────────────────────────────────
// PAGE: CALENDAR
// ─────────────────────────────────────────────

const TODAY = "2026-03-30"

function daysAgo(dateStr) {
  const diff = Math.floor((new Date(TODAY) - new Date(dateStr)) / 86400000)
  if(diff === 0) return "hoy"
  if(diff === 1) return "ayer"
  if(diff < 7)  return `hace ${diff} días`
  if(diff < 14) return "hace 1 semana"
  if(diff < 30) return `hace ${Math.floor(diff/7)} semanas`
  return `hace ${Math.floor(diff/30)} mes${Math.floor(diff/30)>1?"es":""}`
}

function LogModal({ onClose, onSave, wornLog, defaultDate, closetItems }) {
  const allItems = closetItems || CLOSET_ITEMS_INIT
  const SUITS = allItems.filter(i=>i.type==="Suit").map(i=>i.name)
  const SHIRTS = allItems.filter(i=>i.type==="Shirt").map(i=>i.name)
  const TIES = allItems.filter(i=>i.type==="Tie").map(i=>i.name)
  const SHOES_LIST = allItems.filter(i=>i.type==="Shoes").map(i=>i.name)
  const ACCESSORIES_LIST = allItems.filter(i=>i.type==="Accessory").map(i=>i.name)
  const [form, setForm] = useState({
    date: defaultDate || TODAY,
    suit: "", shirt: "", tie: "", shoes: "", accessories: "", occasion: "", notes: "", photo: null
  })
  const [dragging, setDragging] = useState(false)

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  // ── Photo handling ──
  const loadPhoto = (file) => {
    if(!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (ev) => set("photo", ev.target.result)
    reader.readAsDataURL(file)
  }
  const handlePhotoInput  = (e) => loadPhoto(e.target.files[0])
  const handleDrop        = (e) => { e.preventDefault(); setDragging(false); loadPhoto(e.dataTransfer.files[0]) }
  const handleDragOver    = (e) => { e.preventDefault(); setDragging(true)  }
  const handleDragLeave   = ()  => setDragging(false)

  // ── Repeat detection: same suit worn in last 14 days ──
  const repeatWarning = (() => {
    if(!form.suit.trim()) return null
    const cutoff = new Date(form.date); cutoff.setDate(cutoff.getDate()-14)
    const cutoffStr = cutoff.toISOString().split("T")[0]
    const recent = wornLog
      .filter(e=>e.suit.toLowerCase().includes(form.suit.toLowerCase()) && e.date>=cutoffStr && e.date!==form.date)
      .sort((a,b)=>b.date.localeCompare(a.date))
    return recent.length>0 ? recent[0] : null
  })()

  // ── Exact combo check ──
  const exactRepeat = (() => {
    if(!form.suit.trim()||!form.shirt.trim()) return null
    return wornLog.find(e=>
      e.suit.toLowerCase().includes(form.suit.toLowerCase()) &&
      e.shirt.toLowerCase().includes(form.shirt.toLowerCase()) &&
      (form.tie ? e.tie.toLowerCase().includes(form.tie.toLowerCase()) : true) &&
      e.date!==form.date
    ) || null
  })()

  const handleSave = () => {
    if(!form.suit.trim()||!form.date) return
    onSave({ id:Date.now(), ...form, suitColor: allItems.find(i=>i.name===form.suit)?.color||NAVY })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" style={{maxHeight:"92vh"}}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0" style={{borderBottom:"1px solid #f1f5f9"}}>
          <div>
            <h2 className="text-xl font-black text-gray-900">Log Outfit</h2>
            <p className="text-xs text-gray-400 mt-0.5">What did you wear today?</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-300"/></button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* ── PHOTO UPLOAD ── */}
          <div>
            <Label>Outfit Photo <span className="font-normal text-gray-400 normal-case">(opcional)</span></Label>
            {form.photo ? (
              /* Preview */
              <div className="relative mt-1 rounded-2xl overflow-hidden" style={{height:"200px"}}>
                <img src={form.photo} alt="outfit preview"
                  className="w-full h-full object-cover"/>
                {/* Overlay gradient */}
                <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)"}}/>
                {/* Change / remove buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-black text-white" style={{background:"rgba(0,0,0,0.5)"}}>
                    Cambiar
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoInput}/>
                  </label>
                  <button onClick={()=>set("photo",null)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center" style={{background:"rgba(0,0,0,0.5)"}}>
                    <X size={14} color="white"/>
                  </button>
                </div>
                {/* Done check */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-black" style={{background:GOLD,color:NAVY}}>
                  <Check size={11}/> Foto lista
                </div>
              </div>
            ) : (
              /* Drop zone */
              <label
                className="block mt-1 rounded-2xl text-center cursor-pointer transition-all"
                style={{
                  border:`2px dashed ${dragging?GOLD:"#e5e7eb"}`,
                  background: dragging?"#fffbeb":"#fafafa",
                  padding:"28px 20px"
                }}
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{background:"#f1f5f9"}}>
                  <Camera size={26} className="text-gray-300"/>
                </div>
                <div className="text-sm font-black text-gray-500 mb-1">Upload a photo of your look</div>
                <div className="text-xs text-gray-300">Tap to select · or drag here</div>
                <div className="text-xs text-gray-200 mt-1">JPG, PNG, WEBP · max. 10 MB</div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoInput}/>
              </label>
            )}
          </div>

          {/* ── DATE ── */}
          <div>
            <Label>Date</Label>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
          </div>

          {/* ── SUIT ── */}
          <div>
            <Label>Suit / Blazer</Label>
            <input value={form.suit} onChange={e=>set("suit",e.target.value)}
              list="suits-list" placeholder="ej. Navy Chalk Stripe"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="suits-list">{SUITS.map(s=><option key={s} value={s}/>)}</datalist>

            {exactRepeat && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-xl text-xs" style={{background:"#fef2f2",border:"1px solid #fecaca"}}>
                <span className="text-base leading-none">🔁</span>
                <div>
                  <strong className="text-red-700">Combinación repetida</strong>
                  <p className="text-red-600 mt-0.5">Usaste exactamente este look <strong>{daysAgo(exactRepeat.date)}</strong>{exactRepeat.occasion?` en "${exactRepeat.occasion}"`:""}.</p>
                </div>
              </div>
            )}
            {!exactRepeat && repeatWarning && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-xl text-xs" style={{background:"#fffbeb",border:"1px solid #fde68a"}}>
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <strong className="text-yellow-800">Traje usado recientemente</strong>
                  <p className="text-yellow-700 mt-0.5">Llevaste el <strong>{repeatWarning.suit}</strong> <strong>{daysAgo(repeatWarning.date)}</strong>{repeatWarning.occasion?` (${repeatWarning.occasion})`:""}.{" "}Cambia la camisa o corbata para un look distinto.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── SHIRT ── */}
          <div>
            <Label>Shirt</Label>
            <input value={form.shirt} onChange={e=>set("shirt",e.target.value)}
              list="shirts-list" placeholder="ej. Crisp White Poplin"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="shirts-list">{SHIRTS.map(s=><option key={s} value={s}/>)}</datalist>
          </div>

          {/* ── TIE ── */}
          <div>
            <Label>Tie <span className="font-normal text-gray-400 normal-case">(or '—' if none)</span></Label>
            <input value={form.tie} onChange={e=>set("tie",e.target.value)}
              list="ties-list" placeholder="ej. Burgundy Grenadine"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="ties-list">{TIES.map(t=><option key={t} value={t}/>)}</datalist>
          </div>

          {/* ── SHOES ── */}
          <div>
            <Label>Shoes <span className="font-normal text-gray-400 normal-case">(opcional)</span></Label>
            <input value={form.shoes} onChange={e=>set("shoes",e.target.value)}
              list="shoes-list" placeholder="ej. Black Cap-Toe Oxford"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="shoes-list">{SHOES_LIST.map(s=><option key={s} value={s}/>)}</datalist>
          </div>

          {/* ── ACCESSORIES ── */}
          <div>
            <Label>Accessories <span className="font-normal text-gray-400 normal-case">(opcional)</span></Label>
            <input value={form.accessories} onChange={e=>set("accessories",e.target.value)}
              list="accessories-list" placeholder="ej. White Linen Square, Silver Watch"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="accessories-list">{ACCESSORIES_LIST.map(a=><option key={a} value={a}/>)}</datalist>
          </div>

          {/* ── OCCASION ── */}
          <div>
            <Label>Occasion</Label>
            <input value={form.occasion} onChange={e=>set("occasion",e.target.value)}
              placeholder="ej. Board Meeting, cena, entrevista…"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
          </div>

          {/* ── NOTES ── */}
          <div>
            <Label>Notes <span className="font-normal text-gray-400 normal-case">(opcional)</span></Label>
            <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
              placeholder="How did it go? Any notes on the look?"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
              style={{borderColor:"#f1f5f9"}} rows={2}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{borderTop:"1px solid #f1f5f9"}}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!form.suit.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-all"
            style={{background:NAVY}}>
            {form.photo ? "Save Look 📸" : "Save Look"}
          </button>
        </div>
      </div>
    </div>
  )
}

function CalendarPage({ closetItems, user }) {
  const [tab,        setTab]      = useState("calendar")
  const [date,       setDate]     = useState(new Date(2026,2,1))
  const [selDay,     setSelDay]   = useState(30)
  const [showLog,    setShowLog]  = useState(false)
  const [logDate,    setLogDate]  = useState(TODAY)
  const [filterSuit, setFilterSuit] = useState("Todos")

  // ── Firestore-backed data ──
  const { wornLog, saveEntry }           = useWornLog(user, WORN_LOG_INIT)
  const { events, saveEvent: saveEvtFn } = useCalendarEvents(user, CALENDAR_EVENTS_INIT)

  const y = date.getFullYear(), m = date.getMonth()
  const totalDays = daysInMonth(y,m), firstDay = firstDayOf(y,m)
  const selectedKey = selDay ? fmtDate(y,m,selDay) : null
  const selectedEvt = selectedKey ? events[selectedKey] : null
  const wornOnSelected = selectedKey ? wornLog.find(e=>e.date===selectedKey) : null

  const saveEvent = (k, occ, outfit) => {
    saveEvtFn(k, occ, outfit)
  }

  const saveLog = (entry) => {
    saveEntry(entry)
    setShowLog(false)
  }

  const upcoming = Object.entries(events)
    .filter(([k])=>k>=fmtDate(y,m,1))
    .sort(([a],[b])=>a.localeCompare(b))
    .slice(0,5)

  // Build set of dates that have a worn log entry for dot markers
  const wornDates = new Set(wornLog.map(e=>e.date))

  // Filter suits for history
  const allSuits = ["Todos", ...new Set(wornLog.map(e=>e.suit))]
  const filteredLog = filterSuit==="Todos" ? wornLog : wornLog.filter(e=>e.suit===filterSuit)

  // Stats
  const last30 = wornLog.filter(e=>e.date>=new Date(new Date(TODAY)-30*86400000).toISOString().split("T")[0])
  const suitCounts = last30.reduce((acc,e)=>{acc[e.suit]=(acc[e.suit]||0)+1;return acc},{})
  const topSuit = Object.entries(suitCounts).sort((a,b)=>b[1]-a[1])[0]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Outfit Calendar</h1>
          <p className="text-gray-400 text-sm mt-0.5">{wornLog.length} looks registrados</p>
        </div>
        {/* Quick log button */}
        <button onClick={()=>{setLogDate(TODAY);setShowLog(true)}}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
          style={{background:`linear-gradient(135deg,${NAVY},#1e3a5f)`}}>
          <Plus size={15}/> Log Today
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{background:"#f1f5f9"}}>
        {[{id:"calendar",label:"📅 Calendario"},{id:"log",label:"📖 Historial"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab===t.id?"bg-white shadow-sm text-gray-900":"text-gray-400"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CALENDAR ── */}
      {tab==="calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <button onClick={()=>setDate(new Date(y,m-1,1))} className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft size={18}/></button>
              <h2 className="font-black text-gray-900">{MONTHS[m]} {y}</h2>
              <button onClick={()=>setDate(new Date(y,m+1,1))} className="p-2 rounded-xl hover:bg-gray-100"><ChevronRight size={18}/></button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d=><div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length:firstDay},(_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:totalDays},(_,i)=>{
                const day=i+1, key=fmtDate(y,m,day)
                const hasPlanned=!!events[key], hasWorn=wornDates.has(key)
                const isToday=key===TODAY, isSel=selDay===day
                return (
                  <button key={day} onClick={()=>setSelDay(isSel?null:day)}
                    className="aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all"
                    style={isSel?{background:NAVY,color:"white"}:isToday?{border:`2px solid ${GOLD}`,fontWeight:"800",color:"#92400e"}:{color:"#374151"}}>
                    <span className="font-semibold">{day}</span>
                    {/* Dot indicators */}
                    <div className="flex gap-0.5 mt-0.5">
                      {hasWorn  && <div className="w-1.5 h-1.5 rounded-full" style={{background:isSel?"white":GOLD}}/>}
                      {hasPlanned && !hasWorn && <div className="w-1.5 h-1.5 rounded-full" style={{background:isSel?"rgba(255,255,255,0.6)":"#94a3b8"}}/>}
                    </div>
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{background:GOLD}}/> Look registrado
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-gray-300"/> Planeado
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {selDay ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-800">{MONTHS[m]} {selDay}</h3>
                  <button onClick={()=>{setLogDate(fmtDate(y,m,selDay));setShowLog(true)}}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{background:NAVY}}>
                    <Plus size={14}/>
                  </button>
                </div>
                {/* Worn entry */}
                {wornOnSelected && (
                  <div className="mb-3 rounded-xl overflow-hidden" style={{border:`1px solid ${GOLD}44`}}>
                    {/* Photo thumbnail if available */}
                    {wornOnSelected.photo && (
                      <div className="relative" style={{height:"120px"}}>
                        <img src={wornOnSelected.photo} alt="outfit"
                          className="w-full h-full object-cover"/>
                        <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(15,23,42,0.6) 0%,transparent 60%)"}}/>
                        <div className="absolute bottom-2 left-3">
                          <div className="text-xs font-black text-white">{wornOnSelected.suit}</div>
                        </div>
                      </div>
                    )}
                    <div className="p-3" style={{background:"#fffbeb"}}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{background:GOLD}}/>
                        <span className="text-xs font-black" style={{color:GOLD}}>REGISTRADO</span>
                      </div>
                      {!wornOnSelected.photo && <div className="text-xs font-bold text-gray-800">{wornOnSelected.suit}</div>}
                      <div className="text-xs text-gray-500 mt-0.5">{wornOnSelected.shirt}{wornOnSelected.tie&&wornOnSelected.tie!=="—"?` · ${wornOnSelected.tie}`:""}{wornOnSelected.shoes?` · 👞 ${wornOnSelected.shoes}`:""}{wornOnSelected.accessories?` · ✦ ${wornOnSelected.accessories}`:""}</div>
                      {wornOnSelected.occasion && <div className="text-xs text-gray-400 mt-0.5">📅 {wornOnSelected.occasion}</div>}
                      {wornOnSelected.notes && <div className="text-xs text-gray-400 italic mt-1">"{wornOnSelected.notes}"</div>}
                    </div>
                  </div>
                )}
                {/* Planned entry */}
                {selectedEvt ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                      <span className="text-xs font-bold text-gray-400">PLANEADO</span>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">{selectedEvt.outfit}</div>
                  </div>
                ) : !wornOnSelected && (
                  <div className="text-center py-4">
                    <Shirt size={20} className="mx-auto text-gray-200 mb-2"/>
                    <p className="text-xs text-gray-300">Sin registro ni plan</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                <Calendar size={20} className="mx-auto text-gray-200 mb-2"/>
                <p className="text-xs text-gray-400">Selecciona un día para ver el detalle</p>
              </div>
            )}

            {/* Upcoming */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-black text-sm text-gray-800 mb-3">Upcoming Occasions</h3>
              <div className="space-y-3">
                {upcoming.map(([k,evt])=>{
                  const d=parseInt(k.split("-")[2])
                  return (
                    <div key={k} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{background:evt.color}}>{d}</div>
                      <div>
                        <div className="text-xs font-bold text-gray-700">{evt.occasion}</div>
                        <div className="text-xs text-gray-400 leading-snug mt-0.5 line-clamp-2">{evt.outfit}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab==="log" && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl font-black" style={{color:NAVY}}>{wornLog.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Looks registrados</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl font-black" style={{color:NAVY}}>{last30.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Últimos 30 días</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              {topSuit ? (
                <>
                  <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{background:CLOSET_ITEMS_INIT.find(i=>i.name===topSuit[0])?.color||NAVY}}/>
                  <div className="text-xs font-black text-gray-700 leading-tight">{topSuit[0].split(" ").slice(0,2).join(" ")}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Traje favorito</div>
                </>
              ) : <div className="text-xs text-gray-300">—</div>}
            </div>
          </div>

          {/* Filter by suit */}
          <div className="flex gap-2 flex-wrap">
            {allSuits.map(s=>(
              <button key={s} onClick={()=>setFilterSuit(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={filterSuit===s?{background:NAVY,color:"white"}:{background:"#f1f5f9",color:"#64748b"}}>
                {s}
              </button>
            ))}
          </div>

          {/* Log entries */}
          <div className="space-y-3">
            {filteredLog.sort((a,b)=>b.date.localeCompare(a.date)).map((entry, idx, arr)=>{
              // Check if same suit was worn within previous 7 days from this entry
              const prev7 = arr.slice(idx+1).filter(e=>{
                const diff = Math.floor((new Date(entry.date)-new Date(e.date))/86400000)
                return diff>0 && diff<=7 && e.suit===entry.suit
              })
              const isRecent = prev7.length > 0

              return (
                <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {isRecent && (
                    <div className="px-4 py-2 text-xs font-bold flex items-center gap-1.5" style={{background:"#fef3c7",color:"#92400e"}}>
                      <span>⚠️</span> Mismo traje usado {daysAgo(prev7[0].date)} — considera variar la camisa o la corbata
                    </div>
                  )}

                  {/* Photo banner (if present) */}
                  {entry.photo && (
                    <div className="relative w-full" style={{height:"200px"}}>
                      <img src={entry.photo} alt="outfit"
                        className="w-full h-full object-cover"/>
                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 55%, transparent 100%)"}}/>
                      {/* Date + suit overlaid on photo */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-xs font-semibold mb-0.5" style={{color:"rgba(255,255,255,0.6)"}}>
                          {new Date(entry.date+"T12:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
                          <span className="ml-2" style={{color:GOLD}}>· {daysAgo(entry.date)}</span>
                        </div>
                        <div className="font-black text-white text-base leading-tight">{entry.suit}</div>
                        {entry.occasion && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-lg font-semibold" style={{background:"rgba(201,168,76,0.3)",color:GOLD}}>
                            {entry.occasion}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Color swatch (only when no photo) */}
                      {!entry.photo && (
                        <div className="w-12 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{background:entry.suitColor+"22"}}>
                          <div className="w-6 h-6 rounded-full" style={{background:entry.suitColor}}/>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Header row — only when no photo (photo already shows it) */}
                        {!entry.photo && (
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="text-xs text-gray-400 font-semibold">
                                {new Date(entry.date+"T12:00:00").toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                                <span className="ml-2 text-gray-300">·</span>
                                <span className="ml-2" style={{color:GOLD}}>{daysAgo(entry.date)}</span>
                              </div>
                              <div className="font-black text-gray-900 text-sm mt-0.5">{entry.suit}</div>
                            </div>
                            {entry.occasion && (
                              <span className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0" style={{background:"#f1f5f9",color:"#64748b"}}>
                                {entry.occasion}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Combination chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.shirt && (
                            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{background:"#f1f5f9",color:"#374151"}}>
                              👔 {entry.shirt}
                            </span>
                          )}
                          {entry.tie && entry.tie!=="—" && (
                            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{background:"#f1f5f9",color:"#374151"}}>
                              🎀 {entry.tie}
                            </span>
                          )}
                          {entry.shoes && (
                            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{background:"#f1f5f9",color:"#374151"}}>
                              👞 {entry.shoes}
                            </span>
                          )}
                          {entry.accessories && (
                            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{background:"#f1f5f9",color:"#374151"}}>
                              ✦ {entry.accessories}
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <div className="mt-2 text-xs text-gray-400 italic border-l-2 pl-2" style={{borderColor:GOLD+"66"}}>
                            "{entry.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA to log more */}
          <button onClick={()=>{setLogDate(TODAY);setShowLog(true)}}
            className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-bold transition-all hover:border-gray-300"
            style={{borderColor:"#e5e7eb",color:"#94a3b8"}}>
            + Log another outfit
          </button>
        </div>
      )}

      {/* Log Modal */}
      {showLog && (
        <LogModal
          onClose={()=>setShowLog(false)}
          onSave={saveLog}
          wornLog={wornLog}
          defaultDate={logDate}
          closetItems={closetItems}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE: COMMUNITY
// ─────────────────────────────────────────────

function CommunityPage() {
  const [tab,   setTab]   = useState("feed")
  const [liked, setLiked] = useState({})

  const CHALLENGES = [
    {id:1,title:"Navy Week Challenge",   desc:"Style your navy suit 5 different ways in 5 days",   participants:847,  daysLeft:3,  color:"#1B3A6B"},
    {id:2,title:"Summer Linen League",   desc:"Best linen suit look wins a Drake's tie",            participants:523,  daysLeft:12, color:"#C4A882"},
    {id:3,title:"Pocket Square Mastery", desc:"Show us your most creative fold technique",          participants:1204, daysLeft:7,  color:"#722F37"},
  ]

  const TRENDING = [
    {rank:1, look:"The Milan Executive",       color:"#1B3A6B", uses:1847, trend:"+23%"},
    {rank:2, look:"The City Banker",           color:"#36454F", uses:1203, trend:"+18%"},
    {rank:3, look:"The Weekend Maverick",      color:"#C4A882", uses:986,  trend:"+31%"},
    {rank:4, look:"The Midnight Sovereign",    color:"#800020", uses:742,  trend:"+12%"},
    {rank:5, look:"The Understated Maverick",  color:"#355E3B", uses:634,  trend:"+8%"},
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Community</h1>
          <p className="text-gray-400 text-sm mt-0.5">Style inspiration from the Dapper community</p>
        </div>
        <div className="flex items-center gap-3">
          <Search size={18} className="text-gray-300 cursor-pointer"/>
          <Bell size={18} className="text-gray-300 cursor-pointer"/>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{background:"#f1f5f9"}}>
        {["feed","challenges","trending"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab===t?"bg-white shadow-sm text-gray-900":"text-gray-400"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==="feed" && (
        <div className="space-y-5">
          {SOCIAL_POSTS.map(post=>(
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4 pb-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{background:post.avatar}}>
                  {post.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-900">{post.user}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-black text-white" style={{background:post.badge==="Elite"?GOLD:NAVY}}>
                      {post.badge}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{post.role} · {post.timeAgo}</div>
                </div>
              </div>
              <div className="mx-4 my-3 rounded-xl p-3" style={{background:post.avatar+"15",border:`1px solid ${post.avatar}25`}}>
                <div className="text-xs font-black tracking-wider text-gray-400 mb-0.5">{post.look}</div>
                <div className="text-sm font-bold text-gray-800">{post.outfit}</div>
              </div>
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-700 leading-relaxed">{post.caption}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {post.tags.map(tag=><span key={tag} className="text-xs text-blue-400 cursor-pointer hover:text-blue-600">{tag}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-50">
                <button onClick={()=>setLiked(p=>({...p,[post.id]:!p[post.id]}))}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${liked[post.id]?"text-red-500":"text-gray-300 hover:text-gray-500"}`}>
                  <Heart size={16} fill={liked[post.id]?"currentColor":"none"}/>
                  <span>{post.likes+(liked[post.id]?1:0)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-gray-500">
                  <MessageCircle size={16}/><span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-gray-500 ml-auto">
                  <TrendingUp size={13}/> Copy Look
                </button>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border-2 border-dashed p-8 text-center" style={{borderColor:"#e5e7eb"}}>
            <Lock size={22} className="mx-auto text-gray-200 mb-2"/>
            <div className="font-bold text-gray-400 mb-1 text-sm">Share your looks with the community</div>
            <div className="text-xs text-gray-300 mb-4">Posting, style duels, and challenges require Dapper Pro</div>
            <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-white" style={{background:NAVY}}>Upgrade to Pro</button>
          </div>
        </div>
      )}

      {tab==="challenges" && (
        <div className="space-y-4">
          {CHALLENGES.map(c=>(
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:c.color}}>
                <Award size={22} color="white"/>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-sm">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11}/> {c.participants} joined</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11}/> {c.daysLeft} days left</span>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-xl text-xs font-black text-white flex-shrink-0" style={{background:c.color}}>Join</button>
            </div>
          ))}
        </div>
      )}

      {tab==="trending" && (
        <div className="space-y-3">
          {TRENDING.map(t=>(
            <div key={t.rank} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              <div className="text-2xl font-black text-gray-100 w-8">#{t.rank}</div>
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{background:t.color}}/>
              <div className="flex-1">
                <div className="font-black text-gray-900 text-sm">{t.look}</div>
                <div className="text-xs text-gray-400">{t.uses.toLocaleString()} outfit logs</div>
              </div>
              <div className="text-xs font-black text-green-500">{t.trend}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE: PRICING
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// OUTFIT VALIDATOR PAGE
// ─────────────────────────────────────────────

// Pocket square rules
const POCKET_SQUARE_RULES = {
  // PS should never match the tie exactly
  // PS should harmonize with shirt, not tie
  // Formality: white linen = most formal, printed silk = least formal
  colorConflict: (tieColor, psColor) => {
    if (!tieColor || !psColor) return false
    // If colors are very similar, flag it
    const tc = tieColor.toLowerCase().replace(/\s/g,'')
    const pc = psColor.toLowerCase().replace(/\s/g,'')
    const tieWords = tc.split(/[,&+]/)[0].trim()
    const psWords  = pc.split(/[,&+]/)[0].trim()
    return tieWords === psWords
  },
  formalityMap: {
    "white linen":    5,
    "white cotton":   4,
    "white silk":     4,
    "cream silk":     3,
    "ivory cotton":   3,
    "pink silk":      2,
    "colored silk":   2,
    "printed silk":   1,
    "patterned silk": 1,
  }
}

// The full outfit validator logic
function validateOutfit({ suit, shirt, tie, pocketSquare, suitPattern }) {
  const issues = []
  const warnings = []
  const compliments = []
  const fixes = []
  let overallScore = 10

  const suitPatKey = getSuitPatternKey(suitPattern || suit || "")

  // ── SUIT + SHIRT check ──
  if (suit && shirt) {
    const shirtPat = classifyShirtPattern(shirt)
    const suitPat  = getSuitPatternKey(suitPattern || suit)

    if (suitPat === "glen_plaid" && shirtPat === "gingham") {
      issues.push({ piece:"Shirt", severity:"error", message:"Check shirt with a check suit — this is the cardinal sin of pattern mixing.", fix:"Switch to a solid or subtly textured shirt (poplin, end-on-end, oxford cloth)." })
      overallScore -= 4
    }
    if (suitPat === "chalk_stripe" && shirtPat === "bengal_stripe") {
      issues.push({ piece:"Shirt", severity:"warning", message:"Bold stripe shirt with chalk stripe suit — two competing bold stripes.", fix:"Use a solid or end-on-end shirt instead. Save the bengal stripe for a solid suit." })
      overallScore -= 2
    }
    if (suitPat === "glen_plaid" && (shirtPat === "bengal_stripe" || shirtPat === "fine_stripe")) {
      warnings.push({ piece:"Shirt", message:"A striped shirt with a plaid suit is risky territory — use only ultra-fine stripes.", fix:"Consider a solid white or pale blue shirt to let the glen plaid breathe." })
      overallScore -= 1
    }
    if (suitPat === "solid_suit" && shirtPat === "solid_shirt") {
      compliments.push("Solid suit with solid shirt — a clean, versatile foundation.")
    }
    if (suitPat === "chalk_stripe" && (shirtPat === "solid_shirt" || shirtPat === "end_on_end" || shirtPat === "oxford")) {
      compliments.push("Excellent shirt choice for a chalk stripe suit — the solid/subtle texture lets the stripe lead.")
    }
  }

  // ── SUIT + TIE check ──
  if (suit && tie) {
    const tiePat  = classifyTiePattern(tie)
    const suitPat = getSuitPatternKey(suitPattern || suit)

    const combo = scorePatternCombo(suitPat, "solid_shirt", tiePat)
    if (combo.score < 4) {
      issues.push({ piece:"Tie", severity:"error", message:combo.violations[0] || "Pattern conflict between suit and tie.", fix: getFixForTieWithSuit(suitPat) })
      overallScore -= 3
    } else if (combo.score < 7) {
      warnings.push({ piece:"Tie", message:combo.warnings[0] || "Borderline pattern combination — tread carefully.", fix: getFixForTieWithSuit(suitPat) })
      overallScore -= 1
    } else if (combo.score >= 9) {
      compliments.push(combo.tips[0] || "Excellent tie and suit pattern pairing.")
    }
  }

  // ── SHIRT + TIE check ──
  if (shirt && tie) {
    const tiePat   = classifyTiePattern(tie)
    const shirtPat = classifyShirtPattern(shirt)

    // Stripe shirt + stripe tie
    if ((shirtPat === "bengal_stripe" || shirtPat === "fine_stripe") && tiePat === "repp_stripe") {
      issues.push({ piece:"Tie", severity:"warning", message:"Stripe shirt with stripe tie — two stripe patterns at potentially similar scale.", fix:"Switch to a solid, polka dot, or foulard tie when wearing a striped shirt." })
      overallScore -= 2
    }

    // Check shirt + check tie
    if ((shirtPat === "gingham") && (tiePat === "bold_plaid")) {
      issues.push({ piece:"Tie", severity:"error", message:"Check shirt with a check tie — same pattern family stacked.", fix:"Use a solid or repp stripe tie with a gingham shirt." })
      overallScore -= 3
    }

    // Good combos
    if (shirtPat === "bengal_stripe" && tiePat === "polka_dot") {
      compliments.push("Stripe shirt with polka dot tie — different families, different scales. This is a classic expert combination.")
    }
    if (shirtPat === "bengal_stripe" && tiePat === "foulard") {
      compliments.push("Bengal stripe with micro-foulard tie — the geometric breaks the stripe family elegantly.")
    }
    if ((shirtPat === "end_on_end" || shirtPat === "oxford") && tiePat === "repp_stripe") {
      compliments.push("Subtle texture shirt with repp stripe tie — the classic business combination done correctly.")
    }
    if (shirtPat === "solid_shirt" && tiePat === "grenadine") {
      compliments.push("Solid shirt with grenadine tie — elegant simplicity. The grenadine texture is the detail.")
    }
  }

  // ── ALL THREE: SUIT + SHIRT + TIE ──
  if (suit && shirt && tie) {
    const tiePat   = classifyTiePattern(tie)
    const shirtPat = classifyShirtPattern(shirt)
    const suitPat  = getSuitPatternKey(suitPattern || suit)

    const combo = scorePatternCombo(suitPat, shirtPat, tiePat)
    if (combo.violations.length > 0 && !issues.find(i => i.piece === "Tie")) {
      issues.push({ piece:"Full Outfit", severity:"error", message:combo.violations[0], fix:"See individual piece recommendations below." })
      overallScore -= 2
    }

    // Three pattern count
    const patternCount = [suitPat, shirtPat, tiePat].filter(p => p !== "solid_suit" && p !== "solid_shirt" && p !== "solid_tie" && p !== "grenadine" && p !== "knit").length
    if (patternCount === 3) {
      if (combo.score >= 7) {
        compliments.push("Three patterns — expertly managed with correct scale and family differentiation. This takes knowledge.")
      } else {
        warnings.push({ piece:"Full Outfit", message:"Three visible patterns is ambitious — scale and family contrast must be perfect.", fix:"Consider dropping one pattern: solid shirt, or solid tie." })
        overallScore -= 1
      }
    }
  }

  // ── POCKET SQUARE check ──
  if (pocketSquare && tie) {
    const ps  = pocketSquare.toLowerCase()
    const ti  = tie.toLowerCase()

    // PS should never exactly match the tie
    const tieMainColor = ti.split(/\s/)[0]
    if (ps.includes(tieMainColor) && ps.includes("silk") && ti.includes("solid")) {
      issues.push({ piece:"Pocket Square", severity:"warning", message:"Pocket square matches the tie too closely — they should complement, not match.", fix:"If tie is burgundy, use white or ivory pocket square. The PS should echo the shirt, not the tie." })
      overallScore -= 1
    }

    // White PS with any suit is always correct
    if (ps.includes("white")) {
      compliments.push("White pocket square — always correct, always refined.")
    }

    // PS and tie should not be same printed pattern
    if (ps.includes("paisley") && ti.includes("paisley")) {
      issues.push({ piece:"Pocket Square", severity:"error", message:"Matching paisley tie and pocket square — this was a 1970s mistake. Don't repeat it.", fix:"Switch to a white linen pocket square when wearing a paisley tie." })
      overallScore -= 2
    }

    // Formality mismatch
    if (ti.includes("knit") && ps.includes("silk") && ps.includes("print")) {
      warnings.push({ piece:"Pocket Square", message:"Printed silk pocket square with knit tie — formality registers don't quite match.", fix:"Use a linen or cotton pocket square with a knit tie for better register consistency." })
    }
  }

  // ── Pocket square without tie ──
  if (pocketSquare && !tie && suit) {
    const ps = pocketSquare.toLowerCase()
    if (ps.includes("white") || ps.includes("linen")) {
      compliments.push("Pocket square only, no tie — white linen is the correct choice for the tieless look.")
    }
  }

  // Clamp score
  overallScore = Math.max(0, Math.min(10, overallScore))

  let verdict = ""
  let verdictColor = ""
  if (overallScore >= 9) { verdict = "✦ Fashion Police Approved"; verdictColor = "#166534" }
  else if (overallScore >= 7) { verdict = "✓ Looks Good — Minor Tweaks"; verdictColor = "#1d4ed8" }
  else if (overallScore >= 5) { verdict = "⚡ Needs Work"; verdictColor = "#92400e" }
  else { verdict = "🚨 Stop Right There"; verdictColor = "#991b1b" }

  return { issues, warnings, compliments, fixes, overallScore, verdict, verdictColor }
}

function getFixForTieWithSuit(suitPat) {
  if (suitPat === "chalk_stripe") return "With a chalk stripe suit, use a solid tie, wool knit, polka dot, or small foulard — never another bold stripe."
  if (suitPat === "glen_plaid")   return "With a glen plaid suit, the tie must be solid. No exceptions. The plaid is the pattern."
  if (suitPat === "herringbone")  return "With a herringbone suit, use solid, repp stripe, polka dot, or foulard ties."
  if (suitPat === "tweed")        return "With tweed, use a wool knit tie — it's the most natural partner."
  return "Use a solid tie when uncertain — it is always correct."
}

// ── OUTFIT VALIDATOR PAGE ──
function OutfitValidatorPage() {
  const [suit,            setSuit]           = useState("")
  const [suitPattern,     setSuitPattern]    = useState("solid")
  const [shirt,           setShirt]          = useState("")
  const [tie,             setTie]            = useState("")
  const [pocketSquare,    setPocketSquare]   = useState("")
  const [result,          setResult]         = useState(null)
  const [analyzing,       setAnalyzing]      = useState(false)
  // Photo uploads for validator
  const [vSuitPhoto,      setVSuitPhoto]     = useState(null)
  const [vShirtPhoto,     setVShirtPhoto]    = useState(null)
  const [vTiePhoto,       setVTiePhoto]      = useState(null)
  const [vPSPhoto,        setVPSPhoto]       = useState(null)
  const [photoAnalyzing,  setPhotoAnalyzing] = useState(false)
  const [photoDetected,   setPhotoDetected]  = useState({})

  const handleValPhoto = async (dataURL, setter, pieceKey) => {
    setter(dataURL)
    if (!dataURL) return
    setPhotoAnalyzing(true)
    const result = await analyzePhotoLocally(dataURL)
    if (result) {
      setPhotoDetected(prev => ({ ...prev, [pieceKey]: result }))
      // Auto-fill color/pattern from photo
      const colorLabel = COLOR_FAMILY_LABELS[result.colorKey] || ""
      const patLabel   = result.patternInfo.pattern || "Solid"
      if (pieceKey === "suit") {
        setSuit(colorLabel)
        const patMap = { "Solid":"solid","Smooth weave":"solid","Chalk Stripe / Pinstripe":"chalk_stripe","Glen Plaid / Check":"glen_plaid","Herringbone":"herringbone","Bold Pattern / Tweed":"tweed","Subtle Texture / Twill":"solid" }
        setSuitPattern(patMap[patLabel] || "solid")
      }
      if (pieceKey === "shirt") {
        const shirtColorMap = { navy:"Pale French Blue", charcoal:"White Oxford Cloth", grey:"Pale Blue Chambray", black:"Crisp White Poplin", beige:"Cream / Ivory Poplin", light_grey:"Pale Blue Chambray" }
        setShirt(shirtColorMap[result.colorKey] || "Crisp White Poplin")
      }
    }
    setPhotoAnalyzing(false)
  }

  const handleValPhotoInput = (e, setter, pieceKey) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = ev => handleValPhoto(ev.target.result, setter, pieceKey)
    reader.readAsDataURL(file)
  }

  const SUIT_COLORS = ["Navy","Charcoal","Black","Medium Grey","Light Grey","Burgundy","Brown","Beige / Tan","Blue (bright)","Olive"]
  const SUIT_PATTERNS = [
    {key:"solid",       label:"Solid"},
    {key:"chalk_stripe",label:"Chalk Stripe / Pinstripe"},
    {key:"glen_plaid",  label:"Glen Plaid / Windowpane"},
    {key:"herringbone", label:"Herringbone"},
    {key:"tweed",       label:"Tweed / Donegal"},
    {key:"houndstooth", label:"Houndstooth"},
    {key:"linen",       label:"Linen"},
  ]
  const SHIRT_OPTIONS = [
    "Crisp White Poplin","Pale Blue Poplin","Pale French Blue End-on-End",
    "Pale Pink Bengal Stripe","White Oxford Cloth","Pale Blue Chambray",
    "White Fine Stripe","Pale Yellow Poplin","Light Grey Poplin",
    "White End-on-End","Cream / Ivory Poplin","Blue Gingham",
  ]
  const TIE_OPTIONS = [
    "Burgundy Grenadine (Solid)","Navy Solid Grenadine","Charcoal Solid Grenadine",
    "Silver Solid Grenadine","Forest Green Solid","Teal Solid Grenadine",
    "Camel Knit","Burgundy Knit","Navy Knit","Olive Knit","Dark Brown Knit",
    "Burgundy & Navy Repp Stripe","Gold & Navy Repp Stripe","Terracotta Repp Stripe",
    "Silver & Blue Repp Stripe","Charcoal & White Repp Stripe",
    "Navy Polka Dot","Silver Polka Dot","Burgundy Polka Dot",
    "Forest Green Foulard","Navy Foulard","Burgundy Micro-Paisley",
    "Camel & Brown Paisley","Burnt Orange Paisley","Maroon Paisley",
    "Gold & Navy Club Stripe","Navy & Green Club Stripe",
  ]
  const PS_OPTIONS = [
    "White Irish Linen","White Cotton","White Silk",
    "Ivory Cotton — One Point","Cream Silk — Puff Fold",
    "Pink Silk — Puff Fold","Blue Silk — Puff Fold",
    "Gold Silk — Puff Fold","Green Silk — Two Point",
    "Burgundy Silk","Patterned Silk",
  ]

  const handleValidate = () => {
    if (!suit && !shirt && !tie && !pocketSquare) return
    setAnalyzing(true)
    setTimeout(() => {
      const r = validateOutfit({ suit, shirt, tie, pocketSquare, suitPattern })
      setResult(r)
      setAnalyzing(false)
    }, 800)
  }

  const handleReset = () => {
    setSuit(""); setSuitPattern("solid"); setShirt("")
    setTie(""); setPocketSquare(""); setResult(null)
  }

  // Suggestions for empty fields
  const getSuggestions = () => {
    const sugg = {}
    if (suit && !shirt) {
      const sp = getSuitPatternKey(suitPattern)
      if (sp === "glen_plaid" || sp === "chalk_stripe") {
        sugg.shirt = ["Crisp White Poplin","Pale Blue Poplin","White End-on-End","White Oxford Cloth"]
      } else {
        sugg.shirt = ["Crisp White Poplin","Pale French Blue End-on-End","Pale Pink Bengal Stripe","Pale Blue Chambray"]
      }
    }
    if ((suit || shirt) && !tie) {
      const sp = getSuitPatternKey(suitPattern)
      const shPat = classifyShirtPattern(shirt)
      if (sp === "glen_plaid") {
        sugg.tie = ["Burgundy Grenadine (Solid)","Camel Knit","Olive Knit","Navy Solid Grenadine"]
      } else if (sp === "chalk_stripe") {
        sugg.tie = ["Burgundy Grenadine (Solid)","Silver Polka Dot","Forest Green Foulard","Navy Polka Dot","Camel Knit"]
      } else if (shPat === "bengal_stripe") {
        sugg.tie = ["Navy Solid Grenadine","Burgundy Knit","Navy Polka Dot","Forest Green Foulard"]
      } else {
        sugg.tie = ["Burgundy & Navy Repp Stripe","Gold & Navy Repp Stripe","Burgundy Grenadine (Solid)","Navy Polka Dot","Burgundy Micro-Paisley"]
      }
    }
    if (!pocketSquare) {
      const tColor = (tie || "").toLowerCase()
      if (tColor.includes("burgundy") || tColor.includes("maroon")) {
        sugg.pocketSquare = ["White Irish Linen","White Cotton","Ivory Cotton — One Point"]
      } else if (tColor.includes("navy") || tColor.includes("blue")) {
        sugg.pocketSquare = ["White Irish Linen","White Cotton","White Silk"]
      } else {
        sugg.pocketSquare = ["White Irish Linen","White Cotton","White Silk"]
      }
    }
    return sugg
  }

  const suggestions = result ? getSuggestions() : {}

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Outfit Validator</h1>
        <p className="text-gray-500 text-sm mt-1">Put together your planned outfit — the Fashion Police will check every combination. Leave any field empty for suggestions.</p>
      </div>

      {/* Photo upload section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="text-xs font-black tracking-wider text-gray-400 mb-3">📷 UPLOAD PHOTOS <span className="text-gray-300 font-normal">(optional — auto-detects color & pattern)</span></div>
        {photoAnalyzing && (
          <div className="text-xs text-center py-2 mb-2 rounded-lg" style={{background:"#fffbeb",color:GOLD}}>
            Analyzing photo…
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[
            {key:"suit",  label:"Suit",         photo:vSuitPhoto,  setter:setVSuitPhoto,  color:"#1B3A6B"},
            {key:"shirt", label:"Shirt",         photo:vShirtPhoto, setter:setVShirtPhoto, color:"#89B4D4"},
            {key:"tie",   label:"Tie",           photo:vTiePhoto,   setter:setVTiePhoto,   color:"#722F37"},
            {key:"ps",    label:"Pocket Square", photo:vPSPhoto,    setter:setVPSPhoto,    color:"#F8F8F8"},
          ].map(({key,label,photo,setter,color}) => (
            <label key={key} htmlFor={`val-${key}`} style={{display:"block",cursor:"pointer"}}>
              <div className="rounded-xl border-2 border-dashed p-3 text-center transition-all"
                style={{borderColor: photo ? GOLD : "#e5e7eb", background: photo ? "#fffbeb" : "#f8fafc"}}>
                {photo ? (
                  <div>
                    <img src={photo} alt={label} className="w-full h-20 object-cover rounded-lg mb-1"/>
                    <div className="text-xs font-bold" style={{color:"#92400e"}}>✓ {label}</div>
                    {photoDetected[key] && (
                      <div className="text-xs text-gray-500 mt-0.5">{COLOR_FAMILY_LABELS[photoDetected[key].colorKey]} · {photoDetected[key].patternInfo.pattern}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">Tap to change</div>
                  </div>
                ) : (
                  <div>
                    <div className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center" style={{background:color+"22"}}>
                      <span style={{color}}>📷</span>
                    </div>
                    <div className="text-xs font-bold text-gray-600">{label}</div>
                    <div className="text-xs text-gray-400">Tap to add</div>
                  </div>
                )}
              </div>
              <input id={`val-${key}`} type="file" accept="image/*"
                style={{display:"none"}}
                onChange={e => handleValPhotoInput(e, setter, key)}/>
            </label>
          ))}
        </div>

        {/* Photo tips */}
        <div className="mt-3 p-3 rounded-xl text-xs text-gray-400 leading-relaxed" style={{background:"#f8fafc"}}>
          <strong className="text-gray-500">📸 Tips:</strong> Use natural light · Lay flat or hang · Fill the frame · Neutral background · No flash
        </div>
      </div>

      <div className="space-y-4 mb-6">

        {/* Suit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="text-xs font-black tracking-wider text-gray-400 mb-3">SUIT COLOR {vSuitPhoto && photoDetected.suit && <span className="font-normal text-green-600 ml-1">· Auto-detected from photo ✓</span>}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUIT_COLORS.map(c => (
              <button key={c} onClick={() => setSuit(suit === c ? "" : c)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={suit === c
                  ? {borderColor:GOLD, background:"#fffbeb", color:"#92400e"}
                  : {borderColor:"#e5e7eb", background:"white", color:"#6b7280"}}>
                {c}
              </button>
            ))}
          </div>
          <div className="text-xs font-black tracking-wider text-gray-400 mb-2">SUIT PATTERN</div>
          <div className="flex flex-wrap gap-2">
            {SUIT_PATTERNS.map(p => (
              <button key={p.key} onClick={() => setSuitPattern(p.key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={suitPattern === p.key
                  ? {borderColor:GOLD, background:"#fffbeb", color:"#92400e"}
                  : {borderColor:"#e5e7eb", background:"white", color:"#6b7280"}}>
                {p.label}
              </button>
            ))}
          </div>
          {!suit && <div className="mt-2 text-xs text-gray-400 italic">Leave empty — we'll give general advice based on shirt & tie</div>}
        </div>

        {/* Shirt */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="text-xs font-black tracking-wider text-gray-400 mb-3">SHIRT <span className="text-gray-300 font-normal">(optional — leave empty for suggestions)</span></div>
          <div className="flex flex-wrap gap-2">
            {SHIRT_OPTIONS.map(s => (
              <button key={s} onClick={() => setShirt(shirt === s ? "" : s)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={shirt === s
                  ? {borderColor:GOLD, background:"#fffbeb", color:"#92400e"}
                  : {borderColor:"#e5e7eb", background:"white", color:"#6b7280"}}>
                {s}
              </button>
            ))}
          </div>
          {!shirt && <div className="mt-2 text-xs text-gray-400 italic">Leave empty — we'll suggest the best shirts for your suit</div>}
        </div>

        {/* Tie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="text-xs font-black tracking-wider text-gray-400 mb-3">TIE <span className="text-gray-300 font-normal">(optional)</span></div>
          <div className="flex flex-wrap gap-2">
            {TIE_OPTIONS.map(t => (
              <button key={t} onClick={() => setTie(tie === t ? "" : t)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={tie === t
                  ? {borderColor:GOLD, background:"#fffbeb", color:"#92400e"}
                  : {borderColor:"#e5e7eb", background:"white", color:"#6b7280"}}>
                {t}
              </button>
            ))}
          </div>
          {!tie && <div className="mt-2 text-xs text-gray-400 italic">Leave empty — we'll recommend ties based on your suit & shirt</div>}
        </div>

        {/* Pocket Square */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="text-xs font-black tracking-wider text-gray-400 mb-3">POCKET SQUARE <span className="text-gray-300 font-normal">(optional)</span></div>
          <div className="flex flex-wrap gap-2">
            {PS_OPTIONS.map(p => (
              <button key={p} onClick={() => setPocketSquare(pocketSquare === p ? "" : p)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={pocketSquare === p
                  ? {borderColor:GOLD, background:"#fffbeb", color:"#92400e"}
                  : {borderColor:"#e5e7eb", background:"white", color:"#6b7280"}}>
                {p}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Validate button */}
      <div className="flex gap-3 mb-6">
        <button onClick={handleValidate} disabled={analyzing || (!suit && !shirt && !tie && !pocketSquare)}
          className="flex-1 py-4 rounded-2xl font-black text-sm tracking-widest transition-all"
          style={{background:(!suit&&!shirt&&!tie&&!pocketSquare)?'#e5e7eb':GOLD, color:(!suit&&!shirt&&!tie&&!pocketSquare)?'#9ca3af':NAVY}}>
          {analyzing ? "Checking with the Fashion Police…" : "🎩 VALIDATE THIS OUTFIT"}
        </button>
        {result && (
          <button onClick={handleReset}
            className="px-4 py-4 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-500 hover:border-gray-300">
            Reset
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">

          {/* Verdict */}
          <div className="rounded-2xl p-5 text-center" style={{background: result.overallScore >= 9 ? "#f0fdf4" : result.overallScore >= 7 ? "#eff6ff" : result.overallScore >= 5 ? "#fffbeb" : "#fef2f2", border:`2px solid ${result.overallScore >= 9 ? "#86efac" : result.overallScore >= 7 ? "#93c5fd" : result.overallScore >= 5 ? "#fcd34d" : "#fca5a5"}`}}>
            <div className="text-2xl font-black mb-1" style={{color:result.verdictColor}}>{result.verdict}</div>
            <div className="text-4xl font-black mb-1">{result.overallScore}/10</div>
            <div className="text-sm text-gray-500">
              {result.overallScore >= 9 ? "This outfit respects all the rules of menswear. Wear it with confidence." :
               result.overallScore >= 7 ? "Solid look with minor issues. Easy fixes below." :
               result.overallScore >= 5 ? "Some pattern violations that need attention before you leave the house." :
               "Multiple violations detected. The Fashion Police would like a word."}
            </div>
          </div>

          {/* Outfit summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs font-black tracking-wider text-gray-400 mb-3">YOUR OUTFIT</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:"SUIT", value: suit ? `${suit} (${SUIT_PATTERNS.find(p=>p.key===suitPattern)?.label})` : "—", empty:!suit},
                {label:"SHIRT", value:shirt||"—", empty:!shirt},
                {label:"TIE", value:tie||"—", empty:!tie},
                {label:"POCKET SQUARE", value:pocketSquare||"—", empty:!pocketSquare},
              ].map(({label,value,empty}) => (
                <div key={label} className="p-3 rounded-xl" style={{background:empty?"#f8fafc":"#f1f5f9",border:empty?"1px dashed #e5e7eb":"1px solid #e2e8f0"}}>
                  <div className="text-xs font-bold tracking-wider text-gray-400">{label}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${empty?"text-gray-300 italic":"text-gray-700"}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 space-y-3">
              <div className="text-xs font-black tracking-wider text-red-600 mb-2">🚨 VIOLATIONS</div>
              {result.issues.map((issue,i) => (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-black text-xs flex-shrink-0 mt-0.5">{issue.piece.toUpperCase()}</span>
                    <p className="text-xs text-red-700 font-semibold">{issue.message}</p>
                  </div>
                  {issue.fix && (
                    <div className="mt-1 ml-0 flex items-start gap-2">
                      <span className="text-green-500 text-xs flex-shrink-0">→</span>
                      <p className="text-xs text-green-700">{issue.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-4 space-y-3">
              <div className="text-xs font-black tracking-wider text-yellow-700 mb-2">⚡ WATCH OUT</div>
              {result.warnings.map((w,i) => (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 font-black text-xs flex-shrink-0 mt-0.5">{w.piece?.toUpperCase()}</span>
                    <p className="text-xs text-yellow-800">{w.message}</p>
                  </div>
                  {w.fix && (
                    <div className="mt-1 flex items-start gap-2">
                      <span className="text-green-500 text-xs flex-shrink-0">→</span>
                      <p className="text-xs text-green-700">{w.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Compliments */}
          {result.compliments.length > 0 && (
            <div className="bg-green-50 rounded-2xl border border-green-200 p-4 space-y-2">
              <div className="text-xs font-black tracking-wider text-green-700 mb-2">✦ WHAT WORKS</div>
              {result.compliments.map((c,i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-green-500 font-black text-xs flex-shrink-0 mt-0.5">✓</span>
                  <p className="text-xs text-green-800">{c}</p>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions for empty fields */}
          {(suggestions.shirt || suggestions.tie || suggestions.pocketSquare) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="text-xs font-black tracking-wider text-gray-400">💡 SUGGESTIONS FOR EMPTY PIECES</div>

              {suggestions.shirt && (
                <div>
                  <div className="text-xs font-bold text-gray-600 mb-2">Best shirts for your {suit ? suit + " " + suitPattern.replace("_"," ") : "outfit"}:</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.shirt.map(s => (
                      <button key={s} onClick={() => setShirt(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                        style={{borderColor:GOLD, background:"#fffbeb", color:"#92400e"}}>
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.tie && (
                <div>
                  <div className="text-xs font-bold text-gray-600 mb-2">Best ties for this combination:</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.tie.map(t => (
                      <button key={t} onClick={() => setTie(t)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                        style={{borderColor:GOLD, background:"#fffbeb", color:"#92400e"}}>
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.pocketSquare && (
                <div>
                  <div className="text-xs font-bold text-gray-600 mb-2">Recommended pocket squares:</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.pocketSquare.map(p => (
                      <button key={p} onClick={() => setPocketSquare(p)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                        style={{borderColor:GOLD, background:"#fffbeb", color:"#92400e"}}>
                        + {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">Tap any suggestion to add it and re-validate.</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}


function PricingPage() {
  const [selectedBilling, setSelectedBilling] = useState({}) // per-tier: "monthly" | "annual"

  const getBilling = (tierName) => selectedBilling[tierName] || "monthly"
  const setBilling = (tierName, val) => setSelectedBilling(p=>({...p,[tierName]:val}))

  const tiers = [
    {
      name:"Free", monthlyPrice:0, annualPrice:0, color:"#64748b", badge:null,
      cta:"Current Plan", ctaBg:"#f1f5f9", ctaColor:"#64748b",
      features:["3 AI analyses / month","Digital closet up to 20 garments","2 saved looks","Style Glossary & daily tips","Community feed (read-only)"],
      locked:["Unlimited AI analyses","Full outfit calendar","Weather integration","Social posting","Shopping integration","Style School"],
    },
    {
      name:"Dapper Pro", monthlyPrice:4.99, annualPrice:39.99, color:NAVY, badge:"Most Popular",
      cta:"Start Free Trial", ctaBg:NAVY, ctaColor:"white",
      features:["Unlimited AI analyses","Unlimited digital closet","Full outfit calendar + weather","Outfit comparison tool","Full social features (post, duel, challenge)","Date Mode complete","Shopping integration","Style School complete","Morning outfit push notifications","Gap Analyzer / Wardrobe Gaps"],
      locked:[],
    },
    {
      name:"Dapper Elite", monthlyPrice:9.99, annualPrice:79.99, color:GOLD, badge:"Ultimate",
      cta:"Go Elite", ctaBg:GOLD, ctaColor:NAVY,
      features:["Everything in Pro","Style DNA deep report","Unlimited AI chat with memory","Priority AI (< 5 seconds)","Couple Style Coordination","Virtual Try-On (when available)","Early access to new features","Exclusive Elite profile badge","Monthly 30-min stylist session"],
      locked:[],
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Dress Better. Every Day.</h1>
        <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
          Sin compromisos — paga mes a mes cuando quieras.<br/>
          <span style={{color:GOLD}} className="font-semibold">Ahorra 33% con el plan anual.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier,i)=>{
          const billing = getBilling(tier.name)
          const isPaid  = tier.monthlyPrice > 0
          const isDark  = i === 1

          // what price to display big
          const bigPrice    = billing==="annual" ? tier.annualPrice : tier.monthlyPrice
          const bigSuffix   = billing==="annual" ? "/yr" : "/mo"
          // equivalent monthly when on annual
          const perMoAnnual = tier.annualPrice > 0 ? (tier.annualPrice/12).toFixed(2) : null

          return (
            <div key={tier.name}
              className={`rounded-2xl border-2 relative flex flex-col transition-all ${i===1?"shadow-2xl":""}`}
              style={isDark?{background:NAVY,borderColor:NAVY}:{background:"white",borderColor:"#f1f5f9"}}>

              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap" style={{background:GOLD,color:NAVY}}>
                  {tier.badge}
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                {/* Plan name */}
                <div className="text-xs font-black tracking-widest mb-3" style={{color:isDark?GOLD:tier.color}}>
                  {tier.name.toUpperCase()}
                </div>

                {/* ── BILLING TOGGLE (only for paid plans) ── */}
                {isPaid && (
                  <div className="flex rounded-xl overflow-hidden mb-4 border" style={{borderColor:isDark?"rgba(255,255,255,0.15)":"#e5e7eb"}}>
                    {["monthly","annual"].map(opt=>{
                      const active = billing===opt
                      return (
                        <button key={opt} onClick={()=>setBilling(tier.name, opt)}
                          className="flex-1 py-2 text-xs font-black transition-all relative"
                          style={active
                            ? {background: isDark ? GOLD : NAVY, color: isDark ? NAVY : "white"}
                            : {background:"transparent", color: isDark?"rgba(255,255,255,0.4)":"#9ca3af"}
                          }>
                          {opt==="monthly" ? "Mensual" : "Anual"}
                          {opt==="annual" && (
                            <span className="ml-1 text-xs" style={{color: active ? (isDark?NAVY:"white") : "#22c55e"}}>
                              −33%
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* ── PRICE DISPLAY ── */}
                <div className="mb-1">
                  {!isPaid ? (
                    <div className={`text-4xl font-black ${isDark?"text-white":"text-gray-900"}`}>Free</div>
                  ) : (
                    <>
                      {/* Big price */}
                      <div className={`text-4xl font-black leading-none ${isDark?"text-white":"text-gray-900"}`}>
                        ${bigPrice}
                        <span className={`text-sm font-normal ml-1 ${isDark?"text-gray-400":"text-gray-400"}`}>{bigSuffix}</span>
                      </div>

                      {/* Contextual sub-line */}
                      {billing==="monthly" ? (
                        // Monthly selected → nudge toward annual
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`text-xs ${isDark?"text-gray-400":"text-gray-400"}`}>Sin compromiso · cancela cuando quieras</span>
                        </div>
                      ) : (
                        // Annual selected → show per-month equivalent
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-xs font-bold" style={{color:"#22c55e"}}>
                            Equivale a ${perMoAnnual}/mo
                          </span>
                          <span className={`text-xs ${isDark?"text-gray-500":"text-gray-400"}`}>· facturado anualmente</span>
                        </div>
                      )}

                      {/* "vs monthly" savings callout when annual */}
                      {billing==="annual" && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black"
                          style={{background:isDark?"rgba(34,197,94,0.15)":"#dcfce7",color:"#15803d"}}>
                          <Check size={11}/> Ahorras ${((tier.monthlyPrice*12)-tier.annualPrice).toFixed(2)}/año
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="my-4 border-t" style={{borderColor:isDark?"rgba(255,255,255,0.08)":"#f1f5f9"}}/>

                {/* Features */}
                <div className="space-y-2 flex-1">
                  {tier.features.map(f=>(
                    <div key={f} className="flex items-start gap-2">
                      <Check size={13} className="flex-shrink-0 mt-0.5" style={{color:isDark?GOLD:"#22c55e"}}/>
                      <span className={`text-xs leading-relaxed ${isDark?"text-gray-300":"text-gray-600"}`}>{f}</span>
                    </div>
                  ))}
                  {tier.locked.slice(0,3).map(f=>(
                    <div key={f} className="flex items-start gap-2 opacity-25">
                      <X size={13} className="flex-shrink-0 mt-0.5 text-gray-400"/>
                      <span className="text-xs text-gray-400">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className="mt-5 w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-98"
                  style={{background:tier.ctaBg,color:tier.ctaColor}}>
                  {tier.cta}
                  {isPaid && billing==="annual" && " (Anual)"}
                </button>

                {/* Fine print */}
                {isPaid && (
                  <div className={`text-center text-xs mt-2 ${isDark?"text-gray-600":"text-gray-300"}`}>
                    {billing==="monthly" ? "Sin permanencia · cancela en cualquier momento" : "Cobro único anual · garantía 7 días"}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom trust bar */}
      <div className="mt-8 text-center flex items-center justify-center gap-6 text-xs text-gray-400 flex-wrap">
        {["Prueba gratis 7 días","Cancela cuando quieras","Sin tarjeta para el plan Free"].map(t=>(
          <span key={t} className="flex items-center gap-1"><Check size={12} className="text-green-400"/>{t}</span>
        ))}
      </div>

      {/* Comparison note */}
      <div className="mt-6 rounded-2xl p-4 text-center" style={{background:"#f8fafc",border:"1px solid #e5e7eb"}}>
        <p className="text-xs text-gray-400">
          💡 <strong className="text-gray-600">Tip:</strong> Si pagas mensual en Pro son <strong>$59.88/año</strong>. Cambiando al plan anual pagas solo <strong>$39.99</strong> — el ahorro equivale a <strong>4 meses gratis.</strong>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────

export default function DapperApp() {
  const [page,        setPage]       = useState("analyzer")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAuth,    setShowAuth]   = useState(false)

  // ── Auth ──
  const authHook = useAuth()
  const { user, logOut } = authHook

  // ── Firestore (falls back to mock data when logged out) ──
  const { items: closetItems, updateCloset } = useCloset(user, CLOSET_ITEMS_INIT)

  const NAV = [
    {id:"analyzer",  icon:Wand2,    label:"Analyzer"},
    {id:"validator", icon:Check,    label:"Validator"},
    {id:"closet",    icon:Shirt,    label:"Closet"},
    {id:"calendar",  icon:Calendar, label:"Calendar"},
    {id:"community", icon:Users,    label:"Community"},
    {id:"pricing",   icon:Tag,      label:"Upgrade"},
  ]

  const Page = {analyzer:AnalyzerPage,validator:OutfitValidatorPage,closet:ClosetPage,calendar:CalendarPage,community:CommunityPage,pricing:PricingPage}[page] || AnalyzerPage

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#f8fafc",fontFamily:"system-ui,-apple-system,sans-serif"}}>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={()=>setShowAuth(false)} useAuthHook={authHook}/>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar page={page} setPage={setPage} user={user} onAuthClick={()=>setShowAuth(true)} onLogOut={logOut}/>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={()=>setSidebarOpen(false)}/>
          <div className="absolute left-0 top-0 h-full z-10">
            <Sidebar page={page} setPage={setPage} mobile onClose={()=>setSidebarOpen(false)}
              user={user} onAuthClick={()=>{setShowAuth(true);setSidebarOpen(false)}} onLogOut={logOut}/>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button onClick={()=>setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600"/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:GOLD}}>
              <Shirt size={14} color={NAVY}/>
            </div>
            <span className="font-black tracking-widest text-gray-900 text-base">DAPPER</span>
          </div>
          {user ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{background:NAVY}}>
              {(user.displayName||user.email||"U")[0].toUpperCase()}
            </div>
          ) : (
            <button onClick={()=>setShowAuth(true)}>
              <LogIn size={20} className="text-gray-400"/>
            </button>
          )}
        </div>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8">
          <Page closetItems={closetItems} setClosetItems={updateCloset} user={user} onAuthClick={()=>setShowAuth(true)}/>
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1 z-40">
          <div className="flex">
            {NAV.map(({id,icon:Icon,label})=>{
              const active = page===id
              return (
                <button key={id} onClick={()=>setPage(id)} className="flex-1 flex flex-col items-center py-2 gap-0.5">
                  <Icon size={18} style={{color:active?GOLD:"#d1d5db"}}/>
                  <span className="text-xs" style={{color:active?GOLD:"#d1d5db",fontWeight:active?700:400}}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
 
