import { useState, useEffect, useRef } from "react"
import { useClaudeVision } from './hooks/useClaudeVision.js'
import { useAuth } from './hooks/useAuth.js'
import { useCloset, useWornLog, useCalendarEvents, useEntitlement, useAdminAccess, useAdminUsers, useCommunityPosts, useProblemReports, useAdminProblemReports } from './hooks/useFirestore.js'
import { ensureBrowserImageFile, isHeicLike, prepareVisionImageFile } from './utils/imageFiles.js'
import { PATTERN_MATRIX } from './data/patternMatrix.js'
import AuthModal from './components/AuthModal.jsx'
import {
  Shirt, Calendar, Users, Tag, Upload, Heart,
  MessageCircle, Plus, ChevronLeft, ChevronRight,
  Check, Crown, Camera, Search, Bell, Star, Zap,
  Menu, X, Wand2, TrendingUp, Award, Clock, Lock,
  LogIn, LogOut, User, Shield, Gift
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
  { id:1,  date:"2026-03-28", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Pale French Blue",        tie:"Charcoal Grenadine",       occasion:"Product Launch",        notes:"Very positive team feedback." },
  { id:2,  date:"2026-03-24", suit:"Charcoal Worsted Wool",  suitColor:"#36454F", shirt:"Crisp White Poplin",      tie:"Silver & White Stripe",     occasion:"Executive Presentation", notes:"" },
  { id:3,  date:"2026-03-18", suit:"Charcoal Worsted Wool",  suitColor:"#36454F", shirt:"Pale French Blue",        tie:"Midnight Navy Grenadine",   occasion:"Job Interview",          notes:"Won the contract." },
  { id:4,  date:"2026-03-15", suit:"Mid-Grey Glen Plaid",    suitColor:"#6E7B8B", shirt:"Pale French Blue",        tie:"Forest Green Foulard",      occasion:"Team Offsite",           notes:"" },
  { id:5,  date:"2026-03-10", suit:"Tan Summer Linen",       suitColor:"#C4A882", shirt:"Crisp White Poplin",      tie:"—",                         occasion:"Studio Visit",           notes:"No tie, pocket square only." },
  { id:6,  date:"2026-03-05", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Crisp White Poplin",      tie:"Gold & Navy Repp Stripe",   occasion:"Client Lunch",           notes:"" },
  { id:7,  date:"2026-03-02", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Crisp White Poplin",      tie:"Burgundy Grenadine",        occasion:"Board Meeting",          notes:"Closed the Q1 deal." },
  { id:8,  date:"2026-02-26", suit:"Charcoal Worsted Wool",  suitColor:"#36454F", shirt:"Soft Pink Bengal Stripe", tie:"Navy Polka Dot",            occasion:"Client Dinner",          notes:"The look was very well received." },
  { id:9,  date:"2026-02-20", suit:"Navy Chalk Stripe",      suitColor:"#1B3A6B", shirt:"Pale French Blue",        tie:"Burgundy Micro-Paisley",    occasion:"Conference",             notes:"" },
  { id:10, date:"2026-02-14", suit:"Mid-Grey Glen Plaid",    suitColor:"#6E7B8B", shirt:"Pale Yellow Poplin",      tie:"Camel Knit",                occasion:"Valentine's Dinner",     notes:"She loved it." },
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
  if (l < 22 && s < 28) return "black"
  if (l < 30 && s < 18) return "charcoal"
  if (l < 28 && h >= 10 && h <= 45 && s < 24) return "charcoal"
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
    if (l < 34 && s < 24) return "charcoal"
    if (l < 40 && s < 18) return "charcoal"
    if (l < 35) return "brown"
    if (l < 55) return "brown"
    return "beige"
  }
  if (h >= 40 && h <= 70) return "beige"       // Khaki / tan / camel
  if (h >= 70 && h <= 160) return "grey"       // Olive / green treated as grey
  return "navy" // fallback
}

function scoreSuitColorDecision(colorKey, metrics = {}) {
  const spread = Number(metrics.spread) || 0
  const warmBias = Number(metrics.warmBias) || 0
  const effectiveWarmBias = Number(metrics.effectiveWarmBias) || 0
  const blueBias = Number(metrics.blueBias) || 0
  const greenBias = Number(metrics.greenBias) || 0
  const darkPixelRatio = Number(metrics.darkPixelRatio) || 0
  const darkNeutralPixelRatio = Number(metrics.darkNeutralPixelRatio) || 0
  const sceneNeutralWarmBias = Number(metrics.sceneNeutralWarmBias) || 0
  const l = Number(metrics.l) || 0
  const s = Number(metrics.s) || 0

  let score = 0

  if (LOCAL_DARK_NEUTRAL_KEYS.has(colorKey)) {
    score += darkNeutralPixelRatio * 52
    score += darkPixelRatio * 18
    if (spread <= 34) score += 10
    if (l < 42) score += 8
    if (sceneNeutralWarmBias >= 10) score += 8
    if (effectiveWarmBias > 16) score -= 8
    if (s > 26) score -= 5
    return score
  }

  if (colorKey === "navy") {
    score += darkPixelRatio * 18
    score += Math.max(0, blueBias) * 1.8
    if (l < 52) score += 8
    if (sceneNeutralWarmBias >= 10) score += 3
    if (spread >= 8) score += 4
    if (effectiveWarmBias > 18) score -= 6
    return score
  }

  if (colorKey === "brown") {
    score += Math.max(0, effectiveWarmBias) * 1.35
    score += Math.max(0, s - 10) * 0.45
    if (sceneNeutralWarmBias >= 10) score -= 14
    if (darkNeutralPixelRatio >= 0.16) score -= 12
    if (spread <= 34 && darkPixelRatio >= 0.32) score -= 8
    return score
  }

  if (colorKey === "olive") {
    score += Math.max(0, greenBias) * 1.4
    score += Math.max(0, s - 12) * 0.35
    if (sceneNeutralWarmBias >= 10) score -= 10
    if (darkNeutralPixelRatio >= 0.16) score -= 10
    return score
  }

  score += Math.max(0, warmBias) * 0.5
  return score
}

function buildDarkSuitDecisionContext(r, g, b, h, s, l, options = {}) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const warmBias = r - b
  const blueBias = b - Math.max(r, g)
  const greenBias = g - Math.max(r, b)
  const darkNeutralPixelRatio = Number(options.darkNeutralPixelRatio) || 0
  const darkPixelRatio = Number(options.darkPixelRatio) || 0
  const sceneWarmBias = Number(options.sceneWarmBias) || 0
  const sceneNeutralWarmBias = Number(options.sceneNeutralWarmBias) || 0
  const sceneNeutralPixelRatio = Number(options.sceneNeutralPixelRatio) || 0
  const trustedSceneWarmBias = sceneNeutralPixelRatio >= 0.16
    ? Math.max(sceneNeutralWarmBias, sceneWarmBias * 0.65)
    : sceneWarmBias
  const warmCastBias = Math.max(0, trustedSceneWarmBias - 4)
  const effectiveWarmBias = warmBias - warmCastBias * (darkNeutralPixelRatio >= 0.16 ? 0.88 : 0.62)
  const rawKey = classifyColor(h, s, l)
  const rawMetrics = {
    spread,
    warmBias,
    effectiveWarmBias,
    blueBias,
    greenBias,
    darkPixelRatio,
    darkNeutralPixelRatio,
    sceneNeutralWarmBias,
    l,
    s,
  }
  const rawScore = scoreSuitColorDecision(rawKey, rawMetrics)

  let correctedKey = null
  let correctedMetrics = null
  let correctedScore = Number.NEGATIVE_INFINITY
  let correctedR = null
  let correctedG = null
  let correctedB = null
  let correctedH = null
  let correctedS = null
  let correctedL = null
  if ((warmBias >= 10 || trustedSceneWarmBias >= 12) && darkPixelRatio >= 0.26 && (darkNeutralPixelRatio >= 0.14 || spread <= 36)) {
    const correctionBias = Math.max(warmBias * 0.72, warmCastBias)
    const strength = Math.min(0.66, 0.18 + darkNeutralPixelRatio * 0.9 + Math.min(Math.max(warmBias, trustedSceneWarmBias), 30) / 100)
    correctedR = Math.max(0, Math.min(255, Math.round(r - correctionBias * strength)))
    correctedG = Math.max(0, Math.min(255, Math.round(g + correctionBias * strength * 0.2)))
    correctedB = Math.max(0, Math.min(255, Math.round(b + correctionBias * strength * 0.72)))
    const correctedSpread = Math.max(correctedR, correctedG, correctedB) - Math.min(correctedR, correctedG, correctedB)
    const correctedBlueLead = correctedB - Math.max(correctedR, correctedG)
    const correctedGreenBias = correctedG - Math.max(correctedR, correctedB)
    ;({ h: correctedH, s: correctedS, l: correctedL } = rgbToHsl(correctedR, correctedG, correctedB))
    correctedKey = classifyColor(correctedH, correctedS, correctedL)
    correctedMetrics = {
      spread: correctedSpread,
      warmBias: correctedR - correctedB,
      effectiveWarmBias: correctedR - correctedB,
      blueBias: correctedBlueLead,
      greenBias: correctedGreenBias,
      darkPixelRatio,
      darkNeutralPixelRatio,
      sceneNeutralWarmBias,
      l: correctedL,
      s: correctedS,
    }
    correctedScore = scoreSuitColorDecision(correctedKey, correctedMetrics)
  }

  return {
    spread,
    warmBias,
    blueBias,
    greenBias,
    darkNeutralPixelRatio,
    darkPixelRatio,
    sceneWarmBias,
    sceneNeutralWarmBias,
    sceneNeutralPixelRatio,
    trustedSceneWarmBias,
    warmCastBias,
    effectiveWarmBias,
    rawKey,
    rawMetrics,
    rawScore,
    correctedKey,
    correctedMetrics,
    correctedScore,
    correctedR,
    correctedG,
    correctedB,
    correctedH,
    correctedS,
    correctedL,
  }
}

function classifySuitColor(r, g, b, h, s, l, options = {}) {
  const decision = buildDarkSuitDecisionContext(r, g, b, h, s, l, options)
  const {
    spread,
    warmBias,
    blueBias,
    greenBias,
    darkNeutralPixelRatio,
    darkPixelRatio,
    effectiveWarmBias,
    rawKey,
    rawScore,
    correctedKey,
    correctedScore,
  } = decision

  if (l < 16 && spread < 22) return "black"
  if (l < 22 && spread < 28 && darkNeutralPixelRatio > 0.22) return "black"
  if (l < 32 && spread < 18) return "charcoal"
  if (l < 38 && spread < 24 && darkNeutralPixelRatio > 0.28) return "charcoal"

  if (blueBias >= 10 && l < 48) return "navy"
  if (b >= r + 14 && b >= g + 6 && l < 54) return "navy"
  if (b >= r + 10 && darkPixelRatio > 0.34 && l < 50) return "navy"

  if (correctedKey) {
    if (LOCAL_DARK_AUDIT_KEYS.has(correctedKey) && SUSPICIOUS_DARK_SUIT_KEYS.has(rawKey) && correctedScore >= rawScore - 1.5) {
      return correctedKey
    }
    if (correctedScore >= rawScore + 4) {
      return correctedKey
    }
  }

  if (effectiveWarmBias >= 22 && s > 20 && l > 24) return "brown"
  if (effectiveWarmBias >= 16 && spread > 20 && s > 18 && l > 22 && darkNeutralPixelRatio < 0.2) return "brown"

  if (greenBias >= 14 && g >= b + 10 && s > 22 && l > 24) return "olive"

  return rawKey
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

function averageTrimmedPixelSamples(samples, trimRatio = 0.18) {
  if (!Array.isArray(samples) || !samples.length) return null
  const ordered = [...samples].sort((a, b) => a.brightness - b.brightness)
  const trim = Math.min(Math.floor(ordered.length * trimRatio), Math.floor((ordered.length - 1) / 2))
  const slice = ordered.slice(trim, ordered.length - trim || ordered.length)
  if (!slice.length) return null
  const totals = slice.reduce((acc, sample) => {
    acc.r += sample.r
    acc.g += sample.g
    acc.b += sample.b
    return acc
  }, { r: 0, g: 0, b: 0 })
  return {
    r: Math.round(totals.r / slice.length),
    g: Math.round(totals.g / slice.length),
    b: Math.round(totals.b / slice.length),
    count: slice.length,
  }
}

function analyzePhotoLocally(dataURL, options = {}) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      // Downsample for speed — 120×120 is plenty
      const size = 120
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext("2d")
      const crop = options?.crop
      const sx = crop ? Math.max(0, Math.round(img.width * crop.x)) : 0
      const sy = crop ? Math.max(0, Math.round(img.height * crop.y)) : 0
      const sw = crop ? Math.max(1, Math.round(img.width * crop.width)) : img.width
      const sh = crop ? Math.max(1, Math.round(img.height * crop.height)) : img.height
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size)
      const { data } = ctx.getImageData(0, 0, size, size)

      // Collect all pixel colors (skip near-white background pixels)
      let rSum = 0, gSum = 0, bSum = 0, count = 0
      let darkCount = 0, neutralCount = 0
      let darkRSum = 0, darkGSum = 0, darkBSum = 0
      let neutralRSum = 0, neutralGSum = 0, neutralBSum = 0
      let darkNeutralCount = 0
      let darkNeutralRSum = 0, darkNeutralGSum = 0, darkNeutralBSum = 0
      const darkSamples = []
      const darkNeutralSamples = []
      const pixels = data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
        if (a < 128) continue // skip transparent
        // Skip very bright pixels (background / flash glare)
        const brightness = (r + g + b) / 3
        if (brightness > 220) continue
        const channelSpread = Math.max(r, g, b) - Math.min(r, g, b)
        rSum += r; gSum += g; bSum += b; count++
        if (brightness < 120) {
          darkCount++
          darkRSum += r; darkGSum += g; darkBSum += b
          darkSamples.push({ r, g, b, brightness })
        }
        if (channelSpread < 26) {
          neutralCount++
          neutralRSum += r; neutralGSum += g; neutralBSum += b
        }
        if (brightness < 150 && channelSpread < 34) {
          darkNeutralCount++
          darkNeutralRSum += r; darkNeutralGSum += g; darkNeutralBSum += b
          darkNeutralSamples.push({ r, g, b, brightness })
        }
      }

      if (count === 0) { resolve(null); return }

      let colorRSum = rSum, colorGSum = gSum, colorBSum = bSum, colorCount = count
      let colorSamplingMode = "overall"
      if (options?.preferDarkPixels) {
        if (darkNeutralCount >= Math.max(220, count * 0.16)) {
          const trimmedDarkNeutral = averageTrimmedPixelSamples(darkNeutralSamples)
          if (trimmedDarkNeutral) {
            colorRSum = trimmedDarkNeutral.r * trimmedDarkNeutral.count
            colorGSum = trimmedDarkNeutral.g * trimmedDarkNeutral.count
            colorBSum = trimmedDarkNeutral.b * trimmedDarkNeutral.count
            colorCount = trimmedDarkNeutral.count
            colorSamplingMode = "dark-neutral-trimmed"
          } else {
            colorRSum = darkNeutralRSum
            colorGSum = darkNeutralGSum
            colorBSum = darkNeutralBSum
            colorCount = darkNeutralCount
            colorSamplingMode = "dark-neutral"
          }
        } else if (darkCount >= Math.max(320, count * 0.22)) {
          const trimmedDark = averageTrimmedPixelSamples(darkSamples)
          if (trimmedDark) {
            colorRSum = trimmedDark.r * trimmedDark.count
            colorGSum = trimmedDark.g * trimmedDark.count
            colorBSum = trimmedDark.b * trimmedDark.count
            colorCount = trimmedDark.count
            colorSamplingMode = "dark-trimmed"
          } else {
            colorRSum = darkRSum
            colorGSum = darkGSum
            colorBSum = darkBSum
            colorCount = darkCount
            colorSamplingMode = "dark"
          }
        }
      }

      const r = Math.round(colorRSum / colorCount)
      const g = Math.round(colorGSum / colorCount)
      const b = Math.round(colorBSum / colorCount)
      const { h, s, l } = rgbToHsl(r, g, b)
      const sceneR = Math.round(rSum / count)
      const sceneG = Math.round(gSum / count)
      const sceneB = Math.round(bSum / count)
      const sceneWarmBias = sceneR - sceneB
      const sceneNeutralR = neutralCount ? Math.round(neutralRSum / neutralCount) : sceneR
      const sceneNeutralG = neutralCount ? Math.round(neutralGSum / neutralCount) : sceneG
      const sceneNeutralB = neutralCount ? Math.round(neutralBSum / neutralCount) : sceneB
      const sceneNeutralWarmBias = sceneNeutralR - sceneNeutralB
      const sampleCoverage = count / (size * size)
      const darkPixelRatio = darkCount / count
      const neutralPixelRatio = neutralCount / count
      const darkNeutralPixelRatio = darkNeutralCount / count
      const colorKey  = options?.preferDarkPixels
        ? classifySuitColor(r, g, b, h, s, l, {
            darkPixelRatio,
            darkNeutralPixelRatio,
            sceneWarmBias,
            sceneNeutralWarmBias,
            sceneNeutralPixelRatio: neutralPixelRatio,
          })
        : classifyColor(h, s, l)
      const patternInfo = detectPattern(pixels, size, size)
      const fabricStr = detectFabric(l, s)

      resolve({
        colorKey, h, s, l, r, g, b, patternInfo, fabricStr,
        sampleCoverage, darkPixelRatio, neutralPixelRatio, darkNeutralPixelRatio,
        colorSamplingMode, sceneWarmBias, sceneNeutralWarmBias,
        crop: crop || null,
      })
    }
    img.onerror = () => resolve(null)
    img.src = dataURL
  })
}

const SUIT_LOCAL_CROPS = [
  { label: "broad jacket", rect: { x: 0.12, y: 0.08, width: 0.76, height: 0.74 } },
  { label: "left jacket panel", rect: { x: 0.10, y: 0.16, width: 0.26, height: 0.60 } },
  { label: "right jacket panel", rect: { x: 0.64, y: 0.16, width: 0.26, height: 0.60 } },
  { label: "left lapel body", rect: { x: 0.18, y: 0.16, width: 0.22, height: 0.54 } },
  { label: "right lapel body", rect: { x: 0.60, y: 0.16, width: 0.22, height: 0.54 } },
  { label: "core torso", rect: { x: 0.24, y: 0.12, width: 0.52, height: 0.56 } },
]

const FULL_LOOK_LOCAL_SUIT_CROPS = [
  { label: "broad torso", rect: { x: 0.18, y: 0.08, width: 0.64, height: 0.60 } },
  { label: "left torso panel", rect: { x: 0.16, y: 0.16, width: 0.22, height: 0.50 } },
  { label: "right torso panel", rect: { x: 0.62, y: 0.16, width: 0.22, height: 0.50 } },
  { label: "core torso", rect: { x: 0.24, y: 0.12, width: 0.52, height: 0.54 } },
  { label: "jacket body", rect: { x: 0.20, y: 0.18, width: 0.60, height: 0.46 } },
  { label: "tight jacket", rect: { x: 0.28, y: 0.16, width: 0.44, height: 0.48 } },
]

function scoreFullLookLocalSuitCandidate(result) {
  if (!result) return Number.NEGATIVE_INFINITY
  let score = 0
  const sceneNeutralWarmBias = Number(result.sceneNeutralWarmBias) || 0
  const voteFamily = inferSuitVoteFamily(result)
  const cropTrust = getSuitCropTrustProfile(result.cropLabel)

  score += Math.min(result.sampleCoverage || 0, 0.9) * 16
  score += Math.min(result.darkPixelRatio || 0, 0.9) * 28
  score += Math.min(result.neutralPixelRatio || 0, 0.9) * 24
  score += Math.min(result.darkNeutralPixelRatio || 0, 0.9) * 18

  if (result.colorSamplingMode === "dark-neutral-trimmed") score += 8
  else if (result.colorSamplingMode === "dark-neutral") score += 6
  else if (result.colorSamplingMode === "dark-trimmed") score += 5
  else if (result.colorSamplingMode === "dark") score += 3

  if (voteFamily === "dark-neutral") score += 18
  else if (voteFamily === "navy") score += 10
  else if (SUSPICIOUS_DARK_SUIT_KEYS.has(result.colorKey)) score -= 14

  if (sceneNeutralWarmBias >= 10 && result.darkNeutralPixelRatio >= 0.16) {
    if (voteFamily === "dark-neutral") score += 8
    else if (voteFamily === "navy") score += 5
    else if (SUSPICIOUS_DARK_SUIT_KEYS.has(result.colorKey)) score -= 10
  }

  if (result.l < 18) score += 12
  else if (result.l < 28) score += 8
  else if (result.l < 40) score += 3
  else score -= 8

  if (result.s < 16) score += 10
  else if (result.s < 24) score += 5
  else if (result.s > 36) score -= 8

  const formality = String(result.patternInfo?.formality || "")
  if (formality.includes("Business")) score += 6

  const pattern = String(result.patternInfo?.pattern || "")
  if (pattern.includes("Bold Pattern")) score -= 8
  if (pattern.includes("Horizontal Stripe")) score -= 4

  if (cropTrust.isConsensus) score += 8
  else if (cropTrust.isPanel) score += 10
  else if (cropTrust.isJacketBody) score += 6
  else if (cropTrust.isBroadJacket) score += 3
  else if (cropTrust.isBroadTorso) score -= 2
  else if (cropTrust.isCoreTorso) score -= 7
  else if (cropTrust.isFallback) score -= 5

  if (SUSPICIOUS_DARK_SUIT_KEYS.has(result.colorKey) && (cropTrust.isCoreTorso || cropTrust.isBroadTorso || cropTrust.isFallback)) {
    score -= 6
  }

  if ((voteFamily === "dark-neutral" || voteFamily === "navy") && (cropTrust.isPanel || cropTrust.isJacketBody)) {
    score += 4
  }

  return score
}

function isSuitPanelCrop(label = "") {
  return /panel|lapel/i.test(label)
}

function getSuitCropTrustProfile(label = "") {
  const normalizedLabel = String(label || "").toLowerCase()
  return {
    isPanel: /panel|lapel/.test(normalizedLabel),
    isCoreTorso: normalizedLabel.includes("core torso"),
    isBroadTorso: normalizedLabel.includes("broad torso"),
    isBroadJacket: normalizedLabel.includes("broad jacket"),
    isJacketBody: normalizedLabel.includes("jacket body") || normalizedLabel.includes("tight jacket"),
    isFallback: normalizedLabel.includes("fallback torso"),
    isConsensus: normalizedLabel.startsWith("consensus:"),
  }
}

function averageSuitMetric(candidates, key) {
  if (!candidates.length) return 0
  return candidates.reduce((sum, candidate) => sum + (Number(candidate?.[key]) || 0), 0) / candidates.length
}

function inferCompensatedSuitVoteFamily(candidate) {
  if (!candidate) return null

  const colorKey = String(candidate?.colorKey || "")
  const r = Number(candidate?.r) || 0
  const g = Number(candidate?.g) || 0
  const b = Number(candidate?.b) || 0
  if (r === 0 && g === 0 && b === 0) return null

  const h = Number(candidate?.h)
  const s = Number(candidate?.s)
  const l = Number(candidate?.l)
  const hasHsl = Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(l)
  const hsl = hasHsl ? { h, s, l } : rgbToHsl(r, g, b)
  const decision = buildDarkSuitDecisionContext(r, g, b, hsl.h, hsl.s, hsl.l, {
    darkPixelRatio: Number(candidate?.darkPixelRatio) || 0,
    darkNeutralPixelRatio: Number(candidate?.darkNeutralPixelRatio) || 0,
    sceneWarmBias: Number(candidate?.sceneWarmBias) || 0,
    sceneNeutralWarmBias: Number(candidate?.sceneNeutralWarmBias) || 0,
    sceneNeutralPixelRatio: Number(candidate?.neutralPixelRatio) || 0,
  })

  if (!decision.correctedKey || !LOCAL_DARK_AUDIT_KEYS.has(decision.correctedKey)) return null

  const correctedFamily = LOCAL_DARK_NEUTRAL_KEYS.has(decision.correctedKey) ? "dark-neutral" : decision.correctedKey
  const suspiciousSource = SUSPICIOUS_DARK_SUIT_KEYS.has(colorKey) || SUSPICIOUS_DARK_SUIT_KEYS.has(decision.rawKey)

  if (suspiciousSource && decision.correctedScore >= decision.rawScore - 1.5) return correctedFamily
  if (decision.correctedScore >= decision.rawScore + 3) return correctedFamily

  if (correctedFamily === "dark-neutral" && decision.sceneNeutralWarmBias >= 10 && decision.darkNeutralPixelRatio >= 0.16) {
    return correctedFamily
  }

  if (correctedFamily === "navy" && decision.darkPixelRatio >= 0.28 && decision.correctedScore >= decision.rawScore) {
    return correctedFamily
  }

  return null
}

function inferSuitVoteFamily(candidate) {
  const colorKey = String(candidate?.colorKey || "")
  if (LOCAL_DARK_NEUTRAL_KEYS.has(colorKey)) return "dark-neutral"
  if (colorKey === "navy") return "navy"

  const compensatedFamily = inferCompensatedSuitVoteFamily(candidate)
  if (compensatedFamily) return compensatedFamily

  const darkRatio = Number(candidate?.darkPixelRatio) || 0
  const darkNeutralRatio = Number(candidate?.darkNeutralPixelRatio) || 0
  const sceneNeutralWarmBias = Number(candidate?.sceneNeutralWarmBias) || 0
  const samplingMode = String(candidate?.colorSamplingMode || "")
  const r = Number(candidate?.r) || 0
  const g = Number(candidate?.g) || 0
  const b = Number(candidate?.b) || 0
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const blueLead = b - Math.max(r, g)

  if (darkNeutralRatio >= 0.22 && darkRatio >= 0.34 && spread <= 38 && samplingMode.includes("dark")) {
    return "dark-neutral"
  }

  if (sceneNeutralWarmBias >= 10 && darkNeutralRatio >= 0.16 && darkRatio >= 0.3 && spread <= 40) {
    return "dark-neutral"
  }

  if ((blueLead >= 7 && darkRatio >= 0.28) || (b >= r + 10 && darkRatio >= 0.32 && spread >= 8)) {
    return "navy"
  }

  return colorKey
}

function summarizeLocalSuitCandidate(candidate) {
  if (!candidate) return null
  const r = Number(candidate?.r) || 0
  const g = Number(candidate?.g) || 0
  const b = Number(candidate?.b) || 0
  return {
    cropLabel: String(candidate.cropLabel || ""),
    colorKey: String(candidate.colorKey || ""),
    voteFamily: inferSuitVoteFamily(candidate),
    confidence: Number((Number(candidate.localSuitConfidence) || 0).toFixed(3)),
    score: Number((Number(candidate.localSuitScore) || 0).toFixed(1)),
    voteShare: Number((Number(candidate.localSuitVoteShare) || 0).toFixed(3)),
    voteCount: Number(candidate.localSuitVoteCount) || 0,
    samplingMode: String(candidate.colorSamplingMode || ""),
    darkPixelRatio: Number((Number(candidate.darkPixelRatio) || 0).toFixed(3)),
    darkNeutralPixelRatio: Number((Number(candidate.darkNeutralPixelRatio) || 0).toFixed(3)),
    neutralPixelRatio: Number((Number(candidate.neutralPixelRatio) || 0).toFixed(3)),
    sampleCoverage: Number((Number(candidate.sampleCoverage) || 0).toFixed(3)),
    sceneWarmBias: Number((Number(candidate.sceneWarmBias) || 0).toFixed(1)),
    sceneNeutralWarmBias: Number((Number(candidate.sceneNeutralWarmBias) || 0).toFixed(1)),
    spread: Math.max(r, g, b) - Math.min(r, g, b),
    blueLead: b - Math.max(r, g),
    rgb: { r, g, b },
    colorHex: candidate.colorHex || rgbToHexString(r, g, b),
  }
}

function attachLocalSuitDiagnostics(result, diagnostics) {
  if (!result || !diagnostics) return result
  return {
    ...result,
    localSuitDiagnostics: diagnostics,
  }
}

function buildLocalSuitDiagnostics({ selected, candidates = [], method, notes = [] } = {}) {
  const candidateSummaries = candidates
    .filter(Boolean)
    .sort((a, b) => {
      const confidenceDiff = (Number(b.localSuitConfidence) || 0) - (Number(a.localSuitConfidence) || 0)
      if (Math.abs(confidenceDiff) > 0.0001) return confidenceDiff
      return (Number(b.localSuitScore) || 0) - (Number(a.localSuitScore) || 0)
    })
    .map((candidate) => summarizeLocalSuitCandidate(candidate))

  const selectedSummary = summarizeLocalSuitCandidate(selected)
  return {
    method: String(method || "single-crop"),
    selected: selectedSummary,
    candidateCount: candidateSummaries.length,
    candidates: candidateSummaries,
    notes: notes.filter(Boolean),
  }
}

function normalizeSuitVoteCandidate(candidate) {
  if (!candidate) return null

  const voteFamily = inferSuitVoteFamily(candidate)
  const r = Number(candidate?.r) || 0
  const g = Number(candidate?.g) || 0
  const b = Number(candidate?.b) || 0
  const h = Number(candidate?.h)
  const s = Number(candidate?.s)
  const l = Number(candidate?.l)
  const hasHsl = Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(l)
  const hsl = hasHsl ? { h, s, l } : rgbToHsl(r, g, b)
  const decision = buildDarkSuitDecisionContext(r, g, b, hsl.h, hsl.s, hsl.l, {
    darkPixelRatio: Number(candidate?.darkPixelRatio) || 0,
    darkNeutralPixelRatio: Number(candidate?.darkNeutralPixelRatio) || 0,
    sceneWarmBias: Number(candidate?.sceneWarmBias) || 0,
    sceneNeutralWarmBias: Number(candidate?.sceneNeutralWarmBias) || 0,
    sceneNeutralPixelRatio: Number(candidate?.neutralPixelRatio) || 0,
  })
  const correctedFamily = decision.correctedKey
    ? (LOCAL_DARK_NEUTRAL_KEYS.has(decision.correctedKey) ? "dark-neutral" : decision.correctedKey)
    : null
  const useCorrectedColor = correctedFamily && correctedFamily === voteFamily && Number.isFinite(decision.correctedR)
  const representativeL = useCorrectedColor ? decision.correctedL : hsl.l

  if (voteFamily === "dark-neutral") {
    const forcedColorKey = representativeL < 19 ? "black" : "charcoal"
    if (LOCAL_DARK_NEUTRAL_KEYS.has(candidate.colorKey) && candidate.colorKey === forcedColorKey && !useCorrectedColor) return candidate
    const normalized = {
      ...candidate,
      colorKey: forcedColorKey,
      r: useCorrectedColor ? decision.correctedR : r,
      g: useCorrectedColor ? decision.correctedG : g,
      b: useCorrectedColor ? decision.correctedB : b,
      h: useCorrectedColor ? decision.correctedH : hsl.h,
      s: useCorrectedColor ? decision.correctedS : hsl.s,
      l: useCorrectedColor ? decision.correctedL : hsl.l,
      colorHex: rgbToHexString(
        useCorrectedColor ? decision.correctedR : r,
        useCorrectedColor ? decision.correctedG : g,
        useCorrectedColor ? decision.correctedB : b
      ),
    }
    return {
      ...normalized,
      localSuitScore: scoreFullLookLocalSuitCandidate(normalized),
      localSuitConfidence: calculateLocalSuitConfidence(normalized),
    }
  }

  if (voteFamily === "navy") {
    if (candidate.colorKey === "navy" && !useCorrectedColor) return candidate
    const normalized = {
      ...candidate,
      colorKey: "navy",
      r: useCorrectedColor ? decision.correctedR : r,
      g: useCorrectedColor ? decision.correctedG : g,
      b: useCorrectedColor ? decision.correctedB : b,
      h: useCorrectedColor ? decision.correctedH : hsl.h,
      s: useCorrectedColor ? decision.correctedS : hsl.s,
      l: useCorrectedColor ? decision.correctedL : hsl.l,
      colorHex: rgbToHexString(
        useCorrectedColor ? decision.correctedR : r,
        useCorrectedColor ? decision.correctedG : g,
        useCorrectedColor ? decision.correctedB : b
      ),
    }
    return {
      ...normalized,
      localSuitScore: scoreFullLookLocalSuitCandidate(normalized),
      localSuitConfidence: calculateLocalSuitConfidence(normalized),
    }
  }

  return candidate
}

function recoverReliableSingleSuitCandidate(candidate) {
  if (!candidate) return null
  const normalized = normalizeSuitVoteCandidate(candidate)
  if (!normalized) return null
  if (normalized.colorKey === candidate.colorKey) return null
  if (!LOCAL_DARK_AUDIT_KEYS.has(normalized.colorKey)) return null
  return isReliableLocalDarkSuitAudit(normalized) ? normalized : null
}

function pickStrongestReliableDarkCandidate(candidates, referenceCandidate) {
  if (!Array.isArray(candidates) || !candidates.length) return null

  const recoveredCandidates = candidates
    .map((candidate) => {
      if (!candidate) return null
      const recovered = recoverReliableSingleSuitCandidate(candidate)
      if (recovered) return recovered
      if (LOCAL_DARK_AUDIT_KEYS.has(candidate.colorKey) && isReliableLocalDarkSuitAudit(candidate)) return candidate
      return null
    })
    .filter(Boolean)

  if (!recoveredCandidates.length) return null

  recoveredCandidates.sort((a, b) => {
    const confidenceDiff = (Number(b.localSuitConfidence) || 0) - (Number(a.localSuitConfidence) || 0)
    if (Math.abs(confidenceDiff) > 0.0001) return confidenceDiff
    return (Number(b.localSuitScore) || 0) - (Number(a.localSuitScore) || 0)
  })

  const strongest = recoveredCandidates[0]
  const referenceScore = Number(referenceCandidate?.localSuitScore) || 0
  const referenceConfidence = Number(referenceCandidate?.localSuitConfidence) || 0
  const strongestScore = Number(strongest.localSuitScore) || 0
  const strongestConfidence = Number(strongest.localSuitConfidence) || 0

  if (strongestConfidence >= 0.8) return strongest
  if (strongestConfidence >= 0.74 && strongestScore >= referenceScore - 14) return strongest
  if (strongestConfidence >= referenceConfidence + 0.16 && strongestScore >= referenceScore - 18) return strongest

  return null
}

function clampSuitConfidence(value) {
  return Math.max(0.05, Math.min(0.99, value))
}

function calculateLocalSuitConfidence(result) {
  if (!result) return 0

  const score = Number(result.localSuitScore) || 0
  const darkRatio = Number(result.darkPixelRatio) || 0
  const darkNeutralRatio = Number(result.darkNeutralPixelRatio) || 0
  const sceneNeutralWarmBias = Number(result.sceneNeutralWarmBias) || 0
  const samplingMode = String(result.colorSamplingMode || "")
  const cropLabel = String(result.cropLabel || "")
  const colorKey = String(result.colorKey || "")
  const r = Number(result.r) || 0
  const g = Number(result.g) || 0
  const b = Number(result.b) || 0
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const blueLead = b - Math.max(r, g)
  const hasConsensus = cropLabel.startsWith("consensus:")
  const voteShare = Number(result.localSuitVoteShare) || 0
  const voteCount = Number(result.localSuitVoteCount) || 0
  const voteFamily = inferSuitVoteFamily(result)
  const cropTrust = getSuitCropTrustProfile(cropLabel)

  let confidence = 0.16
  confidence += Math.max(0, Math.min(0.42, score / 105))
  confidence += Math.min(darkRatio, 0.9) * 0.12
  confidence += Math.min(darkNeutralRatio, 0.9) * 0.16

  if (samplingMode === "dark-neutral-trimmed") confidence += 0.12
  else if (samplingMode === "dark-neutral") confidence += 0.09
  else if (samplingMode === "dark-trimmed") confidence += 0.07
  else if (samplingMode === "dark") confidence += 0.04

  if (hasConsensus) confidence += 0.12
  confidence += Math.min(voteShare, 0.95) * 0.12
  confidence += Math.min(voteCount, 4) * 0.02

  if (cropTrust.isPanel) confidence += 0.06
  else if (cropTrust.isJacketBody) confidence += 0.04
  else if (cropTrust.isBroadJacket) confidence += 0.02
  else if (cropTrust.isBroadTorso) confidence -= 0.04
  else if (cropTrust.isCoreTorso) confidence -= 0.08
  else if (cropTrust.isFallback) confidence -= 0.05

  if (LOCAL_DARK_NEUTRAL_KEYS.has(colorKey)) {
    if (spread <= 34) confidence += 0.06
    if (sceneNeutralWarmBias >= 10 && darkNeutralRatio >= 0.16) confidence += 0.05
  } else if (colorKey === "navy") {
    if (blueLead >= 8) confidence += 0.08
    if (sceneNeutralWarmBias >= 10 && darkRatio >= 0.28) confidence += 0.03
  } else if (voteFamily === "dark-neutral") {
    if (spread <= 38) confidence += 0.06
    if (darkNeutralRatio >= 0.16) confidence += 0.05
    if (sceneNeutralWarmBias >= 10) confidence += 0.05
  } else if (voteFamily === "navy") {
    confidence += 0.05
    if (blueLead >= 5) confidence += 0.05
    if (darkRatio >= 0.28) confidence += 0.03
  } else if (SUSPICIOUS_DARK_SUIT_KEYS.has(colorKey)) {
    confidence -= 0.14
    if (sceneNeutralWarmBias >= 10 && darkNeutralRatio >= 0.14) confidence -= 0.08
    if (cropTrust.isCoreTorso || cropTrust.isBroadTorso || cropTrust.isFallback) confidence -= 0.06
  }

  return clampSuitConfidence(confidence)
}

function buildConsensusSuitCandidate(candidates, forcedColorKey) {
  if (!candidates.length) return null
  const normalizedCandidates = candidates.map((candidate) => normalizeSuitVoteCandidate(candidate)).filter(Boolean)
  const sourceCandidates = normalizedCandidates.length ? normalizedCandidates : candidates
  const base = [...sourceCandidates].sort((a, b) => b.localSuitScore - a.localSuitScore)[0]
  const avgL = averageSuitMetric(sourceCandidates, "l")
  const avgS = averageSuitMetric(sourceCandidates, "s")
  const avgH = averageSuitMetric(sourceCandidates, "h")
  const avgR = averageSuitMetric(sourceCandidates, "r")
  const avgG = averageSuitMetric(sourceCandidates, "g")
  const avgB = averageSuitMetric(sourceCandidates, "b")

  const consensusResult = {
    ...base,
    colorKey: forcedColorKey || base.colorKey,
    h: avgH,
    s: avgS,
    l: avgL,
    r: Math.round(avgR),
    g: Math.round(avgG),
    b: Math.round(avgB),
    colorHex: rgbToHexString(Math.round(avgR), Math.round(avgG), Math.round(avgB)),
    sampleCoverage: averageSuitMetric(sourceCandidates, "sampleCoverage"),
    darkPixelRatio: averageSuitMetric(sourceCandidates, "darkPixelRatio"),
    neutralPixelRatio: averageSuitMetric(sourceCandidates, "neutralPixelRatio"),
    darkNeutralPixelRatio: averageSuitMetric(sourceCandidates, "darkNeutralPixelRatio"),
    cropLabel: `consensus: ${sourceCandidates.map((candidate) => candidate.cropLabel).join(", ")}`,
    localSuitScore: averageSuitMetric(sourceCandidates, "localSuitScore"),
  }
  return {
    ...consensusResult,
    localSuitConfidence: calculateLocalSuitConfidence(consensusResult),
  }
}

function buildWeightedSuitVoteCandidate(candidates) {
  if (!candidates.length) return null

  const buckets = new Map()
  let totalWeight = 0

  for (const candidate of candidates) {
    const familyKey = inferSuitVoteFamily(candidate)
    if (familyKey !== "dark-neutral" && familyKey !== "navy") continue

    const confidence = Number(candidate.localSuitConfidence) || calculateLocalSuitConfidence(candidate)
    const score = Number(candidate.localSuitScore) || 0
    const weight = Math.max(0.08, confidence) * Math.max(10, score)
    totalWeight += weight

    const existing = buckets.get(familyKey) || { familyKey, weight: 0, candidates: [] }
    existing.weight += weight
    existing.candidates.push(candidate)
    buckets.set(familyKey, existing)
  }

  if (!buckets.size || totalWeight <= 0) return null

  const winner = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0]
  const voteShare = winner.weight / totalWeight
  if (winner.candidates.length < 2 || voteShare < 0.58) return null

  const forcedColorKey = winner.familyKey === "dark-neutral"
    ? (averageSuitMetric(winner.candidates, "l") < 19 ? "black" : "charcoal")
    : "navy"

  const votedResult = buildConsensusSuitCandidate(winner.candidates, forcedColorKey)
  if (!votedResult) return null

  return {
    ...votedResult,
    localSuitVoteShare: voteShare,
    localSuitVoteCount: winner.candidates.length,
    localSuitConfidence: calculateLocalSuitConfidence({
      ...votedResult,
      localSuitVoteShare: voteShare,
      localSuitVoteCount: winner.candidates.length,
    }),
  }
}

function buildPreparedLocalSuitCandidate(result, cropLabel, extra = {}) {
  if (!result) return null

  const baseCandidate = {
    ...result,
    cropLabel,
    localSuitScore: scoreFullLookLocalSuitCandidate(result),
    localSuitConfidence: 0,
    localSuitVoteShare: 0,
    localSuitVoteCount: 1,
    ...extra,
  }
  baseCandidate.localSuitConfidence = calculateLocalSuitConfidence(baseCandidate)
  return normalizeSuitVoteCandidate(baseCandidate)
}

async function analyzeSuitLocally(dataURL, cropSet = SUIT_LOCAL_CROPS) {
  const candidates = []

  for (const crop of cropSet) {
    const result = await analyzePhotoLocally(dataURL, { crop: crop.rect, preferDarkPixels: true })
    if (!result) continue
    const candidate = buildPreparedLocalSuitCandidate(result, crop.label)
    if (candidate) candidates.push(candidate)
  }

  if (!candidates.length) {
    const fallbackResult = await analyzePhotoLocally(dataURL, {
      crop: { x: 0.2, y: 0.08, width: 0.6, height: 0.62 },
      preferDarkPixels: true,
    })
    if (!fallbackResult) return null
    const fallbackCandidate = buildPreparedLocalSuitCandidate(fallbackResult, "fallback torso")
    if (!fallbackCandidate) return null
    const recoveredFallback = recoverReliableSingleSuitCandidate(fallbackCandidate)
    const selected = recoveredFallback || fallbackCandidate
    return attachLocalSuitDiagnostics(selected, buildLocalSuitDiagnostics({
      selected,
      candidates: [fallbackCandidate, recoveredFallback].filter(Boolean),
      method: recoveredFallback ? "strongest-single-crop-recovery" : "fallback-single-crop",
      notes: ["No standard crop candidates succeeded, so the fallback torso crop was used."],
    }))
  }

  candidates.sort((a, b) => b.localSuitScore - a.localSuitScore)

  const best = candidates[0]
  const panelCandidates = candidates.filter((candidate) => isSuitPanelCrop(candidate.cropLabel))
  const darkNeutralPanels = panelCandidates.filter((candidate) =>
    inferSuitVoteFamily(candidate) === "dark-neutral" &&
    candidate.darkPixelRatio >= 0.42 &&
    candidate.neutralPixelRatio >= 0.36
  )
  if (darkNeutralPanels.length >= 2) {
    const avgL = averageSuitMetric(darkNeutralPanels, "l")
    const forcedColorKey = avgL < 19 ? "black" : "charcoal"
    const selected = buildConsensusSuitCandidate(darkNeutralPanels, forcedColorKey)
    return attachLocalSuitDiagnostics(selected, buildLocalSuitDiagnostics({
      selected,
      candidates,
      method: "consensus-dark-neutral-panels",
      notes: ["Multiple trusted panel/lapel crops agreed on a dark-neutral read."],
    }))
  }

  const navyPanels = panelCandidates.filter((candidate) =>
    inferSuitVoteFamily(candidate) === "navy" &&
    candidate.darkPixelRatio >= 0.35
  )
  if (navyPanels.length >= 2 && SUSPICIOUS_DARK_SUIT_KEYS.has(best.colorKey)) {
    const selected = buildConsensusSuitCandidate(navyPanels, "navy")
    return attachLocalSuitDiagnostics(selected, buildLocalSuitDiagnostics({
      selected,
      candidates,
      method: "consensus-navy-panels",
      notes: ["Multiple trusted panel crops recovered navy from a suspicious broad read."],
    }))
  }

  const weightedVoteResult = buildWeightedSuitVoteCandidate(panelCandidates)
  if (weightedVoteResult && SUSPICIOUS_DARK_SUIT_KEYS.has(best.colorKey)) {
    return attachLocalSuitDiagnostics(weightedVoteResult, buildLocalSuitDiagnostics({
      selected: weightedVoteResult,
      candidates,
      method: "weighted-panel-vote",
      notes: ["Panel crops were weighted by score and confidence to break a suspicious broad result."],
    }))
  }

  const bestDarkNeutral = candidates.find((candidate) => inferSuitVoteFamily(candidate) === "dark-neutral")
  const bestNavy = candidates.find((candidate) => inferSuitVoteFamily(candidate) === "navy")

  if (bestDarkNeutral && bestDarkNeutral.localSuitScore >= best.localSuitScore - 8) {
    const selected = normalizeSuitVoteCandidate(bestDarkNeutral)
    return attachLocalSuitDiagnostics(selected, buildLocalSuitDiagnostics({
      selected,
      candidates,
      method: "strongest-dark-neutral-crop",
      notes: ["A trusted dark-neutral crop beat or nearly matched the broad best crop."],
    }))
  }

  if (bestNavy && SUSPICIOUS_DARK_SUIT_KEYS.has(best.colorKey) && bestNavy.localSuitScore >= best.localSuitScore - 6) {
    const selected = normalizeSuitVoteCandidate(bestNavy)
    return attachLocalSuitDiagnostics(selected, buildLocalSuitDiagnostics({
      selected,
      candidates,
      method: "strongest-navy-crop",
      notes: ["A trusted navy crop rescued a suspicious warm-cast broad result."],
    }))
  }

  if (SUSPICIOUS_DARK_SUIT_KEYS.has(best.colorKey)) {
    const strongestRecoveredCandidate = pickStrongestReliableDarkCandidate(candidates, best)
    if (strongestRecoveredCandidate) {
      return attachLocalSuitDiagnostics(strongestRecoveredCandidate, buildLocalSuitDiagnostics({
        selected: strongestRecoveredCandidate,
        candidates,
        method: "strongest-single-crop-recovery",
        notes: ["A single crop recovered a stronger dark-suit candidate than the broad best crop."],
      }))
    }
    const recoveredBest = recoverReliableSingleSuitCandidate(best)
    if (recoveredBest) {
      return attachLocalSuitDiagnostics(recoveredBest, buildLocalSuitDiagnostics({
        selected: recoveredBest,
        candidates,
        method: "best-crop-recovery",
        notes: ["The broad best crop was corrected locally into a reliable dark-suit candidate."],
      }))
    }
  }

  return attachLocalSuitDiagnostics(best, buildLocalSuitDiagnostics({
    selected: best,
    candidates,
    method: "best-single-crop",
    notes: ["No stronger consensus or rescue path beat the highest-scoring crop."],
  }))
}

async function analyzeFullLookSuitLocally(dataURL) {
  return analyzeSuitLocally(dataURL, FULL_LOOK_LOCAL_SUIT_CROPS)
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
  if (/solid|s[oó]lid[ao]|lis[ao]|grenadine/.test(n) && !/stripe|ray|dot|punto|lunar|paisley|cachemira|plaid|cuadro|foulard|fular|geometric|geom[eé]tric|check/.test(n)) return "grenadine"
  if (/knit|tejid[ao]|punto/.test(n)) return "knit"
  if (/repp|stripe|rayad[ao]|rayas?/.test(n)) return "repp_stripe"
  if (/polka|dot|lunar|puntos?/.test(n)) return "polka_dot"
  if (/foulard|fular|geometric|geom[eé]tric/.test(n)) return "foulard"
  if (/micro.?paisley|paisley.*micro|micro.?cachemira|cachemira.*micro/.test(n)) return "micro_paisley"
  if (/paisley|cachemira/.test(n)) return "paisley"
  if (/club/.test(n))          return "club_stripe"
  if (/plaid|check|cuadros?/.test(n)) return "bold_plaid"
  return "solid_tie"
}

function classifyShirtPattern(shirtName) {
  const n = shirtName.toLowerCase()
  if (/bengal|bold stripe|raya bengala/.test(n)) return "bengal_stripe"
  if (/fine stripe|thin stripe|raya fina|rayas finas/.test(n)) return "fine_stripe"
  if (/end.on.end|end on end/.test(n)) return "end_on_end"
  if (/oxford/.test(n)) return "oxford"
  if (/chambray/.test(n)) return "chambray"
  if (/gingham|vichy|guinga|cuadros?/.test(n)) return "gingham"
  if (/poplin|popelina|voile|solid|s[oó]lid[ao]|lis[ao]/.test(n)) return "solid_shirt"
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
  if (/chalk|pinstripe|pin stripe|chalk stripe|raya diplom[aá]tica|raya tiza|rayas?/.test(p)) return "chalk_stripe"
  if (/glen|windowpane|window pane|plaid|check|pr[ií]ncipe de gales|cuadros?|ventana/.test(p)) return "glen_plaid"
  if (/herringbone|espiga/.test(p)) return "herringbone"
  if (/tweed|donegal|harris/.test(p)) return "tweed"
  if (/linen|lino/.test(p)) return "linen"
  if (/houndstooth|hounds tooth|pata de gallo/.test(p)) return "houndstooth"
  return "solid_suit"
}


// ─────────────────────────────────────────────────────────────────────────────
// PATTERN × COLOR COMBINATION MATRIX
// 8 colors × 6 patterns = 48 unique suit profiles
// Each profile overrides shirts[], packages[], and suit metadata
// Patterns: solid | chalk_stripe | glen_plaid | herringbone | tweed | linen
// Colors:   navy | charcoal | grey | black | brown | beige | burgundy | blue
// ─────────────────────────────────────────────────────────────────────────────


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


const _BASE_MAP = {
  // Original families
  black:        ANALYSIS_BLACK,
  charcoal:     ANALYSIS_CHARCOAL,
  navy:         ANALYSIS,
  grey:         ANALYSIS_GREY,
  blue:         ANALYSIS_BLUE,
  burgundy:     ANALYSIS_BURGUNDY,
  brown:        ANALYSIS_BROWN,
  green:        ANALYSIS,
  white:        ANALYSIS,
  purple:       ANALYSIS,
  red:          ANALYSIS,
  // Named families — all map to nearest base
  lightblue:    ANALYSIS_BLUE,
  cobalt:       ANALYSIS_BLUE,
  midnight:     ANALYSIS,
  slate:        ANALYSIS_CHARCOAL,
  dovegrey:     ANALYSIS_GREY,
  gunmetal:     ANALYSIS_CHARCOAL,
  pewter:       ANALYSIS_GREY,
  camel:        ANALYSIS_BROWN,
  tan:          ANALYSIS_BROWN,
  beige:        ANALYSIS_BEIGE,
  taupe:        ANALYSIS_BEIGE,
  wheat:        ANALYSIS_BEIGE,
  fawn:         ANALYSIS_BEIGE,
  caramel:      ANALYSIS_BROWN,
  chocolate:    ANALYSIS_BROWN,
  copper:       ANALYSIS_BROWN,
  rust:         ANALYSIS_BROWN,
  terracotta:   ANALYSIS_BROWN,
  coral:        ANALYSIS_BURGUNDY,
  oxblood:      ANALYSIS_BURGUNDY,
  wine:         ANALYSIS_BURGUNDY,
  scarlet:      ANALYSIS_BURGUNDY,
  pink:         ANALYSIS_BURGUNDY,
  blush:        ANALYSIS_BURGUNDY,
  lavender:     ANALYSIS_GREY,
  aubergine:    ANALYSIS_BURGUNDY,
  olive:        ANALYSIS_GREY,
  forestgreen:  ANALYSIS_GREY,
  sage:         ANALYSIS_GREY,
  moss:         ANALYSIS_GREY,
  teal:         ANALYSIS_BLUE,
  teal2:        ANALYSIS_BLUE,
  jade:         ANALYSIS_GREY,
  bottle:       ANALYSIS_GREY,
  mustard:      ANALYSIS_BROWN,
  champagne:    ANALYSIS_BEIGE,
  ecru:         ANALYSIS_BEIGE,
  cream:        ANALYSIS,
  ivory:        ANALYSIS,
}

const COLOR_TO_HEX = {
  "White":"#F8F8F8","Ivory White":"#FFFFF0","Ivory":"#FFFFF0","Crisp White":"#F8F8F8",
  "Pale Blue":"#B8D4E8","Pale Pink":"#F8D7DA","Light Blue":"#ADD8E6","Sky Blue":"#87CEEB",
  "Blue Oxford":"#89B4D4","Cream":"#FFFDD0","Ecru":"#F5F0E1","Pale Yellow":"#FDFFC2",
  "Champagne":"#F7E7CE","Blush":"#F4C2C2","Lavender":"#E6E6FA","Sage":"#B2AC88",
  "Navy":"#1B2A4A","Burgundy":"#6D1A2A","Forest Green":"#228B22","Rust":"#B7410E",
  "Olive":"#6B8E23","Chocolate":"#3D2B1F","Brown":"#5C4033","Tan":"#D2B48C",
  "Camel":"#C19A6B","Charcoal":"#36454F","Grey":"#808080","Gray":"#808080",
  "Black":"#1A1A1A","Gold":"#C9A84C","Mustard":"#D4A017","Terracotta":"#C46B4C",
  "Copper":"#B87333","Wine":"#722F37","Coral":"#F88379","Teal":"#2A7F7F",
  "Slate":"#6A7BA2","Silver":"#C0C0C0","Pink":"#E8A5B5","Salmon":"#FA8072",
}
// Case-insensitive, partial-match hex lookup for free-form color names
// coming from the data matrix or the AI ("Deep Burgundy" → Burgundy hex).
function hexForColorName(name, fallback) {
  if (!name) return fallback
  if (COLOR_TO_HEX[name]) return COLOR_TO_HEX[name]
  const n = String(name).toLowerCase()
  for (const [key, hex] of Object.entries(COLOR_TO_HEX)) {
    if (n.includes(key.toLowerCase())) return hex
  }
  return fallback
}
function normalizeMatrixResult(entry) {
  if (!entry) return entry

  // Normalize shirts from new-style {color,pattern,fabric,ties[]} 
  // to old-style {id,name,colorCode,why,ties[{id,name,color,pattern,material,width,knot,harmony,why}]}
  const rawShirts = entry.shirts || []
  const needsShirtNorm = rawShirts.length > 0 && !rawShirts[0].colorCode
  const shirts = needsShirtNorm ? rawShirts.map((s, si) => ({
    id: si + 1,
    name: (s.color || "White") + (s.pattern && s.pattern !== "Solid" ? " " + s.pattern : "") + " " + (s.fabric || ""),
    colorCode: hexForColorName(s.color, "#F8F8F8"),
    why: s.fabric ? s.fabric + " — " + (s.collar || "spread") + " collar, " + (s.cuffs || "button") + " cuffs." : "A versatile choice that complements this suit beautifully.",
    collar: s.collar,
    ties: (s.ties || []).map((t, ti) => ({
      id: ti + 1,
      name: (t.color || "") + " " + (t.pattern || "Solid"),
      color: hexForColorName(t.color, "#555555"),
      pattern: t.pattern || "Solid",
      material: t.fabric || "Silk",
      width: t.width === "Slim" ? '2.5"' : '3"',
      knot: t.knot || "Four-in-Hand",
      harmony: "Complementary",
      why: (t.color || "") + " " + (t.pattern || "") + " tie — a classic pairing with this suit.",
    })),
  })) : rawShirts

  // Collect packages from top level or from inside shirts
  let packages = entry.packages && entry.packages.length > 0
    ? entry.packages
    : shirts.flatMap(s => s.packages || [])

  // Normalize packages: old-style entries use {label, pocket_square, ...}
  // and omit the fields the package cards render (name, suit, archetype,
  // confidence, tip, shirtColor/tieColor). Map + default them here so every
  // data family renders, instead of patching each family's data by hand.
  const suitDesc = entry.suit
    ? [entry.suit.colorFamily || entry.suit.color, entry.suit.pattern].filter(Boolean).join(" ")
    : ""
  packages = packages.map(p => ({
    ...p,
    name: p.name || p.label || "Signature Look",
    suit: p.suit || suitDesc,
    pocketSquare: p.pocketSquare || p.pocket_square,
    archetype: p.archetype || "Classic",
    confidence: p.confidence || 4,
    tip: p.tip || (p.pocketSquare || p.pocket_square
      ? "Anchor the look with the " + (p.pocketSquare || p.pocket_square).toLowerCase() + " and keep the rest understated."
      : "Keep the accessories in the same temperature family as the suit."),
    shirtColor: p.shirtColor || (shirts[0] && shirts[0].colorCode) || "#F8F8F8",
    tieColor: p.tieColor || hexForColorName(p.tie, "#555555"),
    occasion: p.occasion || "Business Casual",
  }))

  return { ...entry, shirts, packages }
}

function getAnalysisFromPhotoResult(result) {
  if (!result) return ANALYSIS

  // Map color key to base analysis

  // Map detected pattern string to matrix key
  const patternToKey = {
    "Solid":                    "solid",
    "Smooth weave":             "solid",
    "Subtle Texture / Twill":   "solid",
    "Chalk Stripe / Pinstripe": "chalk_stripe",
    "Chalk Stripe":             "chalk_stripe",
    "Pin Stripe":               "chalk_stripe",
    "Pinstripe":                "chalk_stripe",
    "Horizontal Stripe":        "chalk_stripe",
    "Glen Plaid":               "glen_plaid",
    "Glen Plaid / Check":       "glen_plaid",
    "Bold Pattern / Tweed":     "tweed",
    "Tweed":                    "tweed",
    "Herringbone":              "herringbone",
    "Houndstooth":              "houndstooth",
    "Linen":                    "linen",
    "Linen plain weave":        "linen",
  }

  const colorKey   = result.colorKey === "light_grey" ? "grey" : result.colorKey
  const patternKey = patternToKey[result.patternInfo.pattern] || "solid"

  // Check if fabric looks like linen
  const isLinen = result.fabricStr && result.fabricStr.toLowerCase().includes("linen")
  const finalPatternKey = isLinen ? "linen" : patternKey

  // Look up in PATTERN_MATRIX first
  const matrixKey = colorKey + "|" + finalPatternKey
  if (PATTERN_MATRIX[matrixKey]) {
    const matrixResult = normalizeMatrixResult(PATTERN_MATRIX[matrixKey])
    if (result.colorLabel) {
      return { ...matrixResult, suit: { ...matrixResult.suit, colorFamily: result.colorLabel } }
    }
    return matrixResult
  }

  // Fallback: use base analysis + inject detected metadata
  const base = buildGeneratedLocalAnalysis(colorKey, finalPatternKey)
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
  midnight:   "Midnight Navy",
  grey:       "Medium Grey",
  light_grey: "Light Grey",
  dovegrey:   "Dove Grey",
  gunmetal:   "Gunmetal",
  pewter:     "Pewter",
  blue:       "Blue",
  lightblue:  "Pale Blue",
  cobalt:     "Cobalt Blue",
  burgundy:   "Burgundy / Wine",
  oxblood:    "Oxblood",
  wine:       "Wine",
  brown:      "Brown",
  chocolate:  "Chocolate Brown",
  cognac:     "Cognac",
  camel:      "Camel",
  tan:        "Tan",
  beige:      "Beige / Tan",
  white:      "White / Ivory",
  cream:      "Cream / Ivory",
  ecru:       "Ecru",
  green:      "Green",
  olive:      "Olive Green",
  forestgreen:"Forest Green",
  bottle:     "Bottle Green",
  sage:       "Sage Green",
  moss:       "Moss Green",
  teal:       "Teal",
  pink:       "Pink",
  blush:      "Blush Pink",
  purple:     "Purple",
  lavender:   "Lavender",
  aubergine:  "Aubergine",
  rust:       "Rust",
  terracotta: "Terracotta",
  copper:     "Copper",
  red:        "Red",
  scarlet:    "Scarlet",
  coral:      "Coral",
  gold:       "Gold",
  mustard:    "Mustard",
  champagne:  "Champagne",
  wheat:      "Wheat",
  fawn:       "Fawn",
  taupe:      "Taupe",
  caramel:    "Caramel",
  jade:       "Jade Green",
}

const SUSPICIOUS_DARK_SUIT_KEYS = new Set(["brown","chocolate","olive","green","forestgreen","bottle","sage","moss","jade"])
const LOCAL_DARK_NEUTRAL_KEYS = new Set(["black","charcoal"])
const LOCAL_DARK_AUDIT_KEYS = new Set(["black","charcoal","navy"])

function rgbToHexString(r, g, b) {
  const values = [r, g, b].map((value) => {
    const clamped = Math.max(0, Math.min(255, Math.round(Number(value) || 0)))
    return clamped.toString(16).padStart(2, "0")
  })
  return `#${values.join("")}`
}

function isReliableLocalDarkSuitAudit(localSuitResult) {
  if (!localSuitResult) return false

  const colorKey = localSuitResult.colorKey
  const score = Number(localSuitResult.localSuitScore) || 0
  const confidence = Number(localSuitResult.localSuitConfidence) || 0
  const darkRatio = Number(localSuitResult.darkPixelRatio) || 0
  const darkNeutralRatio = Number(localSuitResult.darkNeutralPixelRatio) || 0
  const samplingMode = String(localSuitResult.colorSamplingMode || "")
  const cropLabel = String(localSuitResult.cropLabel || "")
  const hasConsensus = cropLabel.startsWith("consensus:")
  const r = Number(localSuitResult.r) || 0
  const g = Number(localSuitResult.g) || 0
  const b = Number(localSuitResult.b) || 0
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const blueLead = b - Math.max(r, g)

  if (LOCAL_DARK_NEUTRAL_KEYS.has(colorKey)) {
    if (hasConsensus && confidence >= 0.68 && darkNeutralRatio >= 0.16 && samplingMode.includes("dark")) return true
    if (confidence >= 0.78) return true
    return confidence >= 0.62 && score >= 44 && darkNeutralRatio >= 0.18 && spread <= 34
  }

  if (colorKey === "navy") {
    if (hasConsensus && confidence >= 0.66 && darkRatio >= 0.28 && blueLead >= 6) return true
    if (confidence >= 0.76) return true
    return confidence >= 0.6 && score >= 42 && darkRatio >= 0.3 && blueLead >= 8
  }

  return false
}

function reconcileDarkSuitPhotoRead(visionSuitResult, localSuitResult) {
  if (!visionSuitResult || !localSuitResult) return visionSuitResult
  if (!SUSPICIOUS_DARK_SUIT_KEYS.has(visionSuitResult.colorKey)) return visionSuitResult
  if (!LOCAL_DARK_AUDIT_KEYS.has(localSuitResult.colorKey)) return visionSuitResult
  if (!isReliableLocalDarkSuitAudit(localSuitResult)) return visionSuitResult
  const correctedLabel = COLOR_FAMILY_LABELS[localSuitResult.colorKey] || visionSuitResult.colorLabel
  return {
    ...visionSuitResult,
    colorKey: localSuitResult.colorKey,
    colorLabel: correctedLabel,
    colorHex: localSuitResult.colorHex || rgbToHexString(localSuitResult.r, localSuitResult.g, localSuitResult.b) || visionSuitResult.colorHex,
    r: localSuitResult.r,
    g: localSuitResult.g,
    b: localSuitResult.b,
    localSuitDiagnostics: localSuitResult.localSuitDiagnostics || visionSuitResult.localSuitDiagnostics,
    colorCorrectionNote: visionSuitResult.colorCorrectionNote || `Local color sanity check changed ${visionSuitResult.colorLabel || visionSuitResult.colorKey} to ${correctedLabel}.`,
  }
}

function reconcileDarkFullLookRead(fullLookResult, localSuitResult) {
  if (!fullLookResult?.suit?.visible) return fullLookResult
  const visionSuitResult = fullLookSuitPhotoResult(fullLookResult)
  const correctedSuit = reconcileDarkSuitPhotoRead(visionSuitResult, localSuitResult)
  if (!correctedSuit) return fullLookResult
  if (correctedSuit.colorKey === visionSuitResult.colorKey) return fullLookResult

  const correctionNote = correctedSuit.colorCorrectionNote || `Local suit audit rechecked the outfit as ${correctedSuit.colorLabel}.`
  return {
    ...fullLookResult,
    suit: {
      ...fullLookResult.suit,
      color: correctedSuit.colorKey,
      colorLabel: correctedSuit.colorLabel,
      colorHex: correctedSuit.colorHex || rgbToHexString(correctedSuit.r, correctedSuit.g, correctedSuit.b) || fullLookResult.suit.colorHex,
      localSuitDiagnostics: correctedSuit.localSuitDiagnostics || localSuitResult.localSuitDiagnostics,
      colorCorrectionNote: correctionNote,
    },
    fashionPolice: fullLookResult.fashionPolice ? {
      ...fullLookResult.fashionPolice,
      assessment: [fullLookResult.fashionPolice.assessment, `Local suit audit rechecked the suit as ${correctedSuit.colorLabel}.`].filter(Boolean).join(" "),
    } : fullLookResult.fashionPolice,
    notes: [fullLookResult.notes, correctionNote].filter(Boolean).join(" "),
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// LOCAL COMBO ASSESSMENT ENGINE
// Evaluates suit + tie + shirt + accessory combos WITHOUT any API call.
// Provides expert menswear advice for common and uncommon combinations.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeMenswearText(text = "") {
  return String(text).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\bazul marino\b/g, "navy")
    .replace(/\bazul cielo\b|\bazul claro\b|\bceleste\b/g, "light blue")
    .replace(/\bazul electrico\b|\bazul rey\b/g, "cobalt")
    .replace(/\bgris carbon\b|\bgris oscuro\b/g, "charcoal")
    .replace(/\bgris\b/g, "grey")
    .replace(/\bnegro\b|\bnegra\b/g, "black")
    .replace(/\bblanco\b|\bblanca\b/g, "white")
    .replace(/\bmarfil\b|\bcrema\b/g, "cream")
    .replace(/\bcrudo\b/g, "ecru")
    .replace(/\bmarron\b|\bcafe\b/g, "brown")
    .replace(/\bborgona\b|\bburdeos\b|\bvino\b/g, "burgundy")
    .replace(/\bverde oliva\b/g, "olive")
    .replace(/\bverde bosque\b/g, "forest green")
    .replace(/\bverde\b/g, "green")
    .replace(/\brojo\b|\broja\b/g, "red")
    .replace(/\bmostaza\b/g, "mustard")
    .replace(/\boxido\b/g, "rust")
    .replace(/\blino\b/g, "linen")
    .replace(/\braya diplomatica\b|\braya tiza\b|\brayas?\b/g, "chalk stripe")
    .replace(/\bcuadros?\b|\bcuadriculado\b/g, "glen plaid")
    .replace(/\bpata de gallo\b/g, "houndstooth")
    .replace(/\bespiga\b/g, "herringbone")
    .replace(/\btraje\b/g, "suit")
    .replace(/\bsaco\b|\bblazer\b/g, "blazer")
    .replace(/\bcamisa\b/g, "shirt")
    .replace(/\bcorbata\b/g, "tie")
    .replace(/\bpanuelos? de bolsillo\b|\bpocket square\b/g, "pocket square")
    .replace(/\bzapatos?\b/g, "shoes")
    .replace(/\bcinturon\b/g, "belt")
}

function parseComboFromText(text) {
  const t = normalizeMenswearText(text)

  // Extract suit color. A color counts as the SUIT color only when it sits
  // before "suit" (up to two words away: "navy solid wool suit") or in a
  // "suit in X / suit is X" phrase — a color attached to another garment
  // ("burgundy tie with a green suit") must not win.
  const SUIT_COLOR_DEFS = [
    ["charcoal", "charcoal|dark\\s*gr[ae]y"],
    ["navy",     "navy|midnight|dark\\s*blue"],
    ["black",    "black"],
    ["grey",     "grey|gray|silver"],
    ["blue",     "blue|cobalt|royal"],
    ["burgundy", "burgundy|wine|oxblood|maroon"],
    ["brown",    "brown|chocolate|cognac|tobacco"],
    ["beige",    "beige|tan|camel|sand"],
    ["green",    "green|olive|sage|forest"],
    ["white",    "white|cream|ivory"],
    ["purple",   "purple|violet|plum"],
    ["red",      "red|crimson|scarlet"],
  ]
  let suitColor = null
  for (const [color, src] of SUIT_COLOR_DEFS) {
    if (new RegExp("(?:" + src + ")(?:\\s+\\w+){0,2}\\s+suit").test(t)) { suitColor = color; break }
  }
  if (!suitColor) {
    for (const [color, src] of SUIT_COLOR_DEFS) {
      if (new RegExp("suit\\s+(?:in|is)\\s+(?:" + src + ")").test(t)) { suitColor = color; break }
    }
  }
  // Fallback: any color word NOT attached to another garment
  if (!suitColor) {
    const colorWords = ["black","charcoal","navy","grey","gray","blue","burgundy","brown","beige","tan","green","olive","white","cream","ivory","purple","red","crimson"]
    for (const c of colorWords) {
      const attachedToOtherGarment = new RegExp(c + "\\s+(?:\\w+\\s+)?(?:shirt|tie|belt|shoes?|loafers?|pocket)").test(t)
      if (t.includes(c) && !attachedToOtherGarment) { suitColor = c === "gray" ? "grey" : c === "tan" ? "beige" : c === "cream" || c === "ivory" ? "white" : c === "olive" ? "green" : c === "crimson" ? "red" : c; break }
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

  const tieContext = ((t.split(/\btie\b/)[0] || "").split(/\b(?:shirt|suit|blazer|jacket)\b/).pop() || "").trim()
  if (/\bblue\b.*\bgreen\b|\bgreen\b.*\bblue\b/.test(tieContext)) tieColor = "blue and green"
  if (/stripe|striped|stripes|repp/.test(tieContext)) tiePattern = "striped"

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
  const full = normalizeMenswearText(text)
  // For SUIT-color detection, blank out clauses describing other garments so
  // their colors aren't read as the suit color ("burgundy tie with a green
  // suit" must resolve to green, not burgundy). Pattern detection still uses
  // the full text below.
  const t = full.replace(
    /\b(?:\w+\s+){1,2}(?:shirt|tie|necktie|bow\s+tie|belt|shoes?|loafers?|oxfords?|derbys?|brogues?|boots?|pocket\s+square|socks?|watch)\b/g,
    " "
  )

  // Detect color (with match tracking)
  let colorKey = "navy"

    let colorMatched = false
  if (/black/.test(t))                                                      { colorKey = "black"; colorMatched = true }
  else if (/charcoal|dark[\s-]?gr[ae]y/.test(t))                          { colorKey = "charcoal"; colorMatched = true }
  else if (/navy|midnight blue|dark blue/.test(t))                         { colorKey = "navy"; colorMatched = true }
  else if (/light[\s-]?gr[ae]y|pale gr[ae]y|silver gr[ae]y/.test(t))    { colorKey = "grey"; colorMatched = true }
  else if (/medium gr[ae]y|gr[ae]y|grey/.test(t))                         { colorKey = "grey"; colorMatched = true }
  else if (/burgundy|oxblood|wine suit|maroon|claret/.test(t))            { colorKey = "burgundy"; colorMatched = true }
  else if (/camel suit|suit.*camel|camel wool|camel tweed|camel linen|camel hound/.test(t)) { colorKey = "camel"; colorMatched = true }
  else if (/cream suit|ivory suit|cream wool|ivory blazer|cream blazer|cream tweed|cream linen/.test(t)) { colorKey = "cream"; colorMatched = true }
  else if (/powder blue|light blue suit|sky blue suit|baby blue|cornflower blue/.test(t)) { colorKey = "lightblue"; colorMatched = true }
  else if (/pink suit|blush suit|rose suit|pink blazer|blush blazer/.test(t)) { colorKey = "pink"; colorMatched = true }
  else if (/teal suit|petrol suit|teal blazer|teal wool|teal linen/.test(t)) { colorKey = "teal"; colorMatched = true }
  else if (/tan suit|khaki suit|tan blazer|khaki blazer|tan wool|tan linen/.test(t)) { colorKey = "tan"; colorMatched = true }
  else if (/olive suit|forest green suit|olive blazer|olive wool|olive linen|army green suit/.test(t)) { colorKey = "olive"; colorMatched = true }
    else if (/rust suit|rust blazer|rust jacket|rust wool|rust linen|rust tweed|rust houndstooth|rust herringbone|rust plaid|orange suit|burnt orange suit|terracotta suit|copper suit|cinnamon suit/.test(t)) { colorKey = "rust"; colorMatched = true }
    else if (/mustard suit|mustard blazer|mustard jacket|mustard wool|mustard linen|mustard tweed|mustard houndstooth|gold suit|gold blazer|golden suit|ochre suit|amber suit|saffron suit|yellow suit|marigold suit/.test(t)) { colorKey = "mustard"; colorMatched = true }
    else if (/navy herringbone|navy glen plaid|navy tweed|navy houndstooth|navy chalk stripe|navy linen suit|navy flannel|midnight navy|dark navy suit|indigo suit|navy wool suit|bengal stripe navy/.test(t)) { colorKey = "navyexpanded"; colorMatched = true }
    else if (/forest green suit|forest green blazer|dark green suit|deep green suit|hunter green suit|bottle green suit|racing green suit|emerald suit|emerald blazer|pine green suit|woodland green suit|forest green tweed|forest green herringbone|forest green houndstooth|forest green wool/.test(t)) { colorKey = "forestgreen"; colorMatched = true }
    else if (/slate suit|slate blazer|slate blue suit|slate grey suit|slate gray suit|steel blue suit|steel grey suit|steel gray suit|slate wool|slate linen|slate tweed|slate herringbone|slate houndstooth|slate glen plaid|slate flannel|gunmetal suit|pewter suit/.test(t)) { colorKey = "slate"; colorMatched = true }
    else if (/chocolate suit|chocolate blazer|chocolate brown suit|chocolate wool|chocolate tweed|chocolate herringbone|chocolate houndstooth|chocolate linen|dark brown suit|deep brown suit|espresso suit|mahogany suit|walnut suit|mocha suit|cocoa suit/.test(t)) { colorKey = "chocolate"; colorMatched = true }
    else if (/charcoal herringbone|charcoal glen plaid|charcoal tweed|charcoal houndstooth|charcoal chalk stripe|charcoal linen suit|charcoal flannel|charcoal wool suit|charcoal plaid|dark grey suit|dark gray suit|graphite suit|anthracite suit|charcoal stripe/.test(t)) { colorKey = "charcoalexpanded"; colorMatched = true }
    else if (/dove grey suit|dove gray suit|dove grey blazer|mid grey suit|mid gray suit|medium grey suit|medium gray suit|grey flannel suit|gray flannel suit|grey wool suit|gray wool suit|grey herringbone|gray herringbone|grey glen plaid|gray glen plaid|grey tweed suit|gray tweed suit|grey chalk stripe|gray chalk stripe|silver grey suit|light grey suit|light gray suit|pearl grey suit|ash grey suit/.test(t)) { colorKey = "dovegrey"; colorMatched = true }
    else if (/oxblood suit|oxblood blazer|oxblood wool|oxblood tweed|oxblood herringbone|oxblood houndstooth|oxblood linen|deep burgundy suit|dark burgundy suit|wine suit|wine blazer|claret suit|claret blazer|bordeaux suit|garnet suit|deep red suit|crimson suit|port suit|maroon suit/.test(t)) { colorKey = "oxblood"; colorMatched = true }
    else if (/cobalt suit|cobalt blazer|cobalt blue suit|royal blue suit|royal blue blazer|electric blue suit|bright blue suit|vivid blue suit|sapphire suit|sapphire blazer|cobalt wool|cobalt tweed|cobalt herringbone|cobalt houndstooth|cobalt linen|klein blue suit/.test(t)) { colorKey = "cobalt"; colorMatched = true }
        else if (/sage suit|sage blazer|sage green suit|sage green blazer|sage wool|sage tweed|sage linen|sage herringbone|sage glen plaid|sage houndstooth|dusty green suit|muted green suit|grey green suit|gray green suit|sage chalk stripe|soft green suit|pale green suit|sage flannel/.test(t)) { colorKey = "sage"; colorMatched = true }
        else if (/terracotta suit|terracotta blazer|brick suit|brick red suit|clay suit|clay blazer|burnt orange suit|terra cotta suit|terracotta wool|terracotta linen|terracotta tweed|terracotta herringbone|terracotta houndstooth|brick houndstooth|clay tweed|brick tweed|warm orange suit|adobe suit|sienna suit/.test(t)) { colorKey = "terracotta"; colorMatched = true }
        else if (/lavender suit|lavender blazer|lilac suit|lilac blazer|soft purple suit|light purple suit|pale purple suit|lavender wool|lavender linen|lavender tweed|lavender herringbone|lavender houndstooth|lilac tweed|lilac linen|lilac herringbone|dusty purple suit|lavender glen plaid|lilac glen plaid|soft violet suit/.test(t)) { colorKey = "lavender"; colorMatched = true }
        else if (/ecru suit|ecru blazer|off white suit|off-white suit|raw linen suit|natural linen suit|unbleached suit|ecru wool|ecru linen|ecru tweed|ecru herringbone|ecru houndstooth|ecru glen plaid|warm white suit|natural white suit|greige suit|raw silk suit|ecru chalk stripe|parchment suit|warm off white suit/.test(t)) { colorKey = "ecru"; colorMatched = true }
        else if (/copper suit|copper blazer|bronze suit|bronze blazer|burnished suit|metallic brown suit|copper wool|copper linen|copper tweed|copper herringbone|copper houndstooth|copper glen plaid|bronze tweed|bronze linen|bronze herringbone|burnished brown suit|copper chalk stripe|warm metallic suit|antique gold suit/.test(t)) { colorKey = "copper"; colorMatched = true }
        else if (/gunmetal suit|gunmetal blazer|smoke suit|smoke grey suit|dark grey suit|dark cool grey suit|gunmetal wool|gunmetal linen|gunmetal tweed|gunmetal herringbone|gunmetal houndstooth|gunmetal glen plaid|smoke tweed|smoke linen|smoke herringbone|dark metallic suit|anthracite suit|iron grey suit|steel grey suit|dark charcoal suit/.test(t)) { colorKey = "gunmetal"; colorMatched = true }
        else if (/blush suit|blush blazer|dusty pink suit|dusty pink blazer|soft pink suit|pale pink suit|blush wool|blush linen|blush tweed|blush herringbone|blush houndstooth|blush glen plaid|dusty rose suit|rose suit|pink suit|soft rose suit|powder pink suit|blush chalk stripe|light pink suit/.test(t)) { colorKey = "blush"; colorMatched = true }
        else if (/aubergine suit|aubergine blazer|plum suit|plum blazer|deep purple suit|dark purple suit|eggplant suit|aubergine wool|aubergine linen|aubergine tweed|aubergine herringbone|aubergine houndstooth|plum tweed|plum linen|plum herringbone|plum houndstooth|dark plum suit|eggplant blazer|aubergine glen plaid|deep violet suit/.test(t)) { colorKey = "aubergine"; colorMatched = true }
        else if (/champagne suit|champagne blazer|champagne linen|champagne tweed|champagne wool|champagne herringbone|champagne houndstooth|champagne glen plaid|pale gold suit|light gold suit|warm white suit|golden suit|golden blazer|champagne chalk stripe|pale champagne suit|luminous suit|straw suit|wheat suit/.test(t)) { colorKey = "champagne"; colorMatched = true }
        else if (/moss suit|moss blazer|moss green suit|moss green blazer|moss wool|moss linen|moss tweed|moss herringbone|moss houndstooth|moss glen plaid|moss chalk stripe|lichen suit|lichen green suit|murky green suit|yellow green suit|muted yellow green suit|dark sage suit|swamp green suit|fern suit|fern green suit/.test(t)) { colorKey = "moss"; colorMatched = true }
        else if (/midnight blue suit|midnight blue blazer|midnight suit|midnight blazer|dark navy suit|deep blue suit|ink blue suit|midnight wool|midnight linen|midnight tweed|midnight herringbone|midnight houndstooth|midnight glen plaid|midnight chalk stripe|deep ink suit|dark ink suit|near black blue suit|indigo suit|dark indigo suit/.test(t)) { colorKey = "midnight"; colorMatched = true }
        else if (/bottle green suit|bottle green blazer|bottle suit|deep green suit|dark green suit|rich green suit|hunter green suit|bottle wool|bottle linen|bottle tweed|bottle herringbone|bottle houndstooth|bottle glen plaid|hunter green blazer|british racing green suit|deep bottle suit|saturated green suit|dark hunter suit/.test(t)) { colorKey = "bottle"; colorMatched = true }
        else if (/caramel suit|caramel blazer|caramel brown suit|golden brown suit|warm brown suit|caramel wool|caramel linen|caramel tweed|caramel herringbone|caramel houndstooth|caramel glen plaid|caramel chalk stripe|mid brown suit|golden mid brown|toffee suit|amber brown suit|warm mid brown suit/.test(t)) { colorKey = "caramel"; colorMatched = true }
        else if (/coral suit|coral blazer|coral linen|coral tweed|coral wool|coral herringbone|coral houndstooth|coral glen plaid|coral chalk stripe|orange pink suit|warm pink suit|vivid pink suit|bright pink suit|salmon suit|salmon blazer|melon suit|tropical pink suit|summer coral suit/.test(t)) { colorKey = "coral"; colorMatched = true }
        else if (/teal suit|teal blazer|teal linen|teal tweed|teal wool|teal herringbone|teal houndstooth|teal glen plaid|teal chalk stripe|blue green suit|blue-green suit|jewel blue suit|vivid teal suit|teal green suit|peacock suit|peacock blazer|teal colored suit/.test(t)) { colorKey = "teal2"; colorMatched = true }
        else if (/wine suit|wine blazer|claret suit|claret blazer|deep red suit|dark red suit|wine wool|wine linen|wine tweed|wine herringbone|wine houndstooth|wine glen plaid|wine chalk stripe|claret wool|claret tweed|claret herringbone|dark crimson suit|rich red suit|deep burgundy suit|dark wine suit/.test(t)) { colorKey = "wine"; colorMatched = true }
        else if (/taupe suit|taupe blazer|greige suit|greige blazer|taupe wool|taupe linen|taupe tweed|taupe herringbone|taupe houndstooth|taupe glen plaid|taupe chalk stripe|warm grey suit|warm gray suit|grey brown suit|gray brown suit|mushroom suit|stone suit|stone blazer|warm neutral suit|mink suit|mink blazer/.test(t)) { colorKey = "taupe"; colorMatched = true }
        else if (/pewter suit|pewter blazer|pewter grey suit|pewter gray suit|pewter wool|pewter linen|pewter tweed|pewter herringbone|pewter houndstooth|pewter glen plaid|pewter chalk stripe|metallic grey suit|metallic gray suit|light gunmetal suit|cool mid grey suit|cool mid gray suit|steel grey suit|steel gray suit/.test(t)) { colorKey = "pewter"; colorMatched = true }
        else if (/jade suit|jade blazer|jade green suit|jade green blazer|jade wool|jade linen|jade tweed|jade herringbone|jade houndstooth|jade glen plaid|jade chalk stripe|emerald suit|emerald blazer|emerald green suit|rich green suit|bright green suit|vivid green suit|jewel green suit|gemstone green suit/.test(t)) { colorKey = "jade"; colorMatched = true }
        else if (/wheat suit|wheat blazer|straw suit|straw blazer|pale yellow suit|light yellow suit|wheat wool|wheat linen|wheat tweed|wheat herringbone|wheat houndstooth|wheat glen plaid|wheat chalk stripe|straw linen|straw tweed|golden yellow suit|harvest suit|pale gold suit|hay suit/.test(t)) { colorKey = "wheat"; colorMatched = true }
        else if (/scarlet suit|scarlet blazer|crimson suit|crimson blazer|bright red suit|vivid red suit|scarlet wool|scarlet linen|scarlet tweed|scarlet herringbone|scarlet houndstooth|scarlet glen plaid|scarlet chalk stripe|crimson wool|crimson tweed|fire red suit|bold red suit|vermillion suit|signal red suit/.test(t)) { colorKey = "scarlet"; colorMatched = true }
        else if (/fawn suit|fawn blazer|buff suit|buff blazer|fawn wool|fawn linen|fawn tweed|fawn herringbone|fawn houndstooth|fawn glen plaid|fawn chalk stripe|buff wool|buff linen|buff tweed|buff herringbone|buff houndstooth|buff glen plaid|buff chalk stripe|pale tan suit|pale tan blazer|warm buff suit|warm buff blazer|light fawn suit|soft fawn suit/.test(t)) { colorKey = "fawn"; colorMatched = true }
  else if (/olive suit|forest green suit|olive blazer|olive wool|olive linen|army green suit/.test(t)) { colorKey = "olive"; colorMatched = true }
  else if (/beige|tan suit|sand suit/.test(t))                  { colorKey = "beige"; colorMatched = true }
  else if (/brown|chocolate|cognac suit|tobacco/.test(t))                  { colorKey = "brown"; colorMatched = true }
  else if (/\bgreen\s+suit\b|\bsuit\s+(?:in\s+)?green\b|\bgreen\s+blazer\b/.test(t)) { colorKey = "green"; colorMatched = true }
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

  const suitPatternContext = (t.match(/(.{0,80}?\bsuit\b)/)?.[1] || t).trim()
  if (patternKey === "chalk_stripe" && /stripe|striped|stripes|repp/.test(t) && !/stripe|striped|stripes|repp/.test(suitPatternContext)) {
    patternKey = "solid"
    patternMatched = false
  }

  // Lookup in matrix
  const matrixKey = colorKey + "|" + patternKey
  if (PATTERN_MATRIX[matrixKey]) return { ...normalizeMatrixResult(PATTERN_MATRIX[matrixKey]), _isMatrixMatch: true }
  // Color or pattern detected but not in matrix: generate the full outfit locally.
  if (colorMatched || patternMatched) return { ...buildGeneratedLocalAnalysis(colorKey, patternKey), _detectedColor: colorKey, _detectedPattern: patternKey }

  // Fallback to navy, still local.
  return { ...buildGeneratedLocalAnalysis(colorKey, patternKey), _detectedColor: colorKey, _detectedPattern: patternKey }
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTFIT COMBINATION ENGINE
// Generates every valid combination locally using stylist rules.
// Mirrors the SQL stylist_rules logic — no AI needed for standard lookups.
// Covers standard and unusual suit descriptions without calling the API.
// ─────────────────────────────────────────────────────────────────────────────

const _LOCAL_COLOR_PROFILES = {
  black:       { label:"Black",             base:"black",    group:"dark_neutral", shirts:['white','light_blue','light_grey'],              ties:['silver','burgundy','navy','charcoal','black','dark_green',null], shoes:['black'] },
  navy:        { label:"Navy",              base:"navy",     group:"cool_dark",    shirts:['white','light_blue','pink','cream'],           ties:['burgundy','navy','gold','silver','dark_green','teal','rust','black',null], shoes:['black','brown','burgundy'] },
  midnight:    { label:"Midnight Navy",     base:"navy",     group:"cool_dark",    shirts:['white','light_blue','light_grey','cream'],     ties:['burgundy','silver','gold','navy','black','dark_green',null], shoes:['black','brown'] },
  cobalt:      { label:"Cobalt Blue",       base:"blue",     group:"cool_bright",  shirts:['white','light_blue','light_grey','pink'],      ties:['burgundy','navy','silver','gold','dark_green','terracotta',null], shoes:['black','brown'] },
  lightblue:   { label:"Light Blue",        base:"blue",     group:"cool_light",   shirts:['white','cream','light_blue','pink'],           ties:['navy','burgundy','brown','dark_green','gold','charcoal',null], shoes:['brown','tan','burgundy','black'] },
  blue:        { label:"Blue",              base:"blue",     group:"cool_bright",  shirts:['white','light_blue','pink','light_grey'],      ties:['burgundy','navy','silver','gold','dark_green','terracotta',null], shoes:['black','brown'] },
  charcoal:    { label:"Charcoal Grey",     base:"charcoal", group:"dark_neutral", shirts:['white','light_blue','pink','light_grey'],      ties:['burgundy','navy','charcoal','silver','black','dark_green','teal',null], shoes:['black','brown'] },
  grey:        { label:"Medium Grey",       base:"grey",     group:"neutral",      shirts:['white','light_blue','pink','light_grey'],      ties:['burgundy','navy','dark_green','silver','charcoal','camel','teal',null], shoes:['black','brown','burgundy'] },
  dovegrey:    { label:"Dove Grey",         base:"grey",     group:"light_neutral",shirts:['white','light_blue','pink','cream'],           ties:['navy','burgundy','dark_green','silver','camel','teal',null], shoes:['brown','black','burgundy'] },
  slate:       { label:"Slate",             base:"charcoal", group:"cool_dark",    shirts:['white','light_blue','light_grey','cream'],     ties:['burgundy','navy','silver','teal','dark_green','black',null], shoes:['black','brown'] },
  gunmetal:    { label:"Gunmetal",          base:"charcoal", group:"dark_neutral", shirts:['white','light_blue','light_grey'],             ties:['burgundy','navy','silver','black','teal','dark_green',null], shoes:['black','brown'] },
  pewter:      { label:"Pewter",            base:"grey",     group:"neutral",      shirts:['white','light_blue','light_grey','cream'],     ties:['navy','burgundy','silver','charcoal','teal','dark_green',null], shoes:['black','brown'] },
  brown:       { label:"Brown",             base:"brown",    group:"earth",        shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','dark_green','charcoal','gold','rust',null], shoes:['brown','tan'] },
  chocolate:   { label:"Chocolate Brown",   base:"brown",    group:"earth_dark",   shirts:['white','light_blue','cream','light_grey'],     ties:['navy','burgundy','dark_green','gold','rust','charcoal',null], shoes:['brown','tan'] },
  camel:       { label:"Camel",             base:"brown",    group:"earth_light",  shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','dark_green','brown','rust','gold',null], shoes:['brown','tan'] },
  tan:         { label:"Tan",               base:"beige",    group:"earth_light",  shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','dark_green','brown','terracotta','gold',null], shoes:['brown','tan'] },
  beige:       { label:"Beige",             base:"beige",    group:"earth_light",  shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','dark_green','brown','terracotta','gold',null], shoes:['brown','tan'] },
  taupe:       { label:"Taupe",             base:"beige",    group:"earth_neutral",shirts:['white','light_blue','cream','light_grey'],     ties:['navy','burgundy','dark_green','brown','charcoal','teal',null], shoes:['brown','black'] },
  wheat:       { label:"Wheat",             base:"beige",    group:"earth_light",  shirts:['white','light_blue','cream'],                  ties:['navy','burgundy','dark_green','brown','terracotta','gold',null], shoes:['tan','brown'] },
  fawn:        { label:"Fawn",              base:"beige",    group:"earth_light",  shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','dark_green','brown','rust','gold',null], shoes:['brown','tan'] },
  caramel:     { label:"Caramel",           base:"brown",    group:"earth",        shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','dark_green','brown','gold','rust',null], shoes:['brown','tan'] },
  cream:       { label:"Cream",             base:"beige",    group:"light_neutral",shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','brown','dark_green','gold','charcoal',null], shoes:['tan','brown'] },
  ecru:        { label:"Ecru",              base:"beige",    group:"light_neutral",shirts:['white','light_blue','cream'],                  ties:['navy','burgundy','brown','dark_green','gold','charcoal',null], shoes:['tan','brown'] },
  champagne:   { label:"Champagne",         base:"beige",    group:"light_neutral",shirts:['white','light_blue','cream'],                  ties:['navy','burgundy','brown','dark_green','gold','charcoal',null], shoes:['tan','brown'] },
  white:       { label:"White / Ivory",     base:"beige",    group:"light_neutral",shirts:['white','light_blue','cream','pink'],           ties:['navy','burgundy','black','brown','dark_green','gold',null], shoes:['tan','brown','black'] },
  burgundy:    { label:"Burgundy",          base:"burgundy", group:"warm_dark",    shirts:['white','light_blue','light_grey','pink'],      ties:['navy','charcoal','dark_green','gold','black','silver',null], shoes:['black','brown','burgundy'] },
  oxblood:     { label:"Oxblood",           base:"burgundy", group:"warm_dark",    shirts:['white','light_blue','light_grey','cream'],     ties:['navy','charcoal','dark_green','gold','black','silver',null], shoes:['black','brown','burgundy'] },
  wine:        { label:"Wine",              base:"burgundy", group:"warm_dark",    shirts:['white','light_blue','light_grey','pink'],      ties:['navy','charcoal','dark_green','gold','black','silver',null], shoes:['black','brown','burgundy'] },
  scarlet:     { label:"Scarlet",           base:"burgundy", group:"statement",    shirts:['white','light_blue','light_grey'],             ties:['black','charcoal','navy','gold','silver',null], shoes:['black'] },
  red:         { label:"Red",               base:"burgundy", group:"statement",    shirts:['white','light_blue','light_grey'],             ties:['black','charcoal','navy','gold','silver',null], shoes:['black'] },
  rust:        { label:"Rust",              base:"brown",    group:"earth_warm",   shirts:['white','light_blue','cream','light_grey'],     ties:['navy','dark_green','brown','charcoal','burgundy','gold',null], shoes:['brown','tan'] },
  terracotta:  { label:"Terracotta",        base:"brown",    group:"earth_warm",   shirts:['white','light_blue','cream'],                  ties:['navy','dark_green','brown','charcoal','burgundy','gold',null], shoes:['brown','tan'] },
  copper:      { label:"Copper",            base:"brown",    group:"earth_warm",   shirts:['white','light_blue','cream'],                  ties:['navy','dark_green','brown','charcoal','burgundy','gold',null], shoes:['brown','tan'] },
  mustard:     { label:"Mustard",           base:"brown",    group:"statement",    shirts:['white','cream','light_blue'],                  ties:['navy','brown','dark_green','burgundy','charcoal',null], shoes:['brown','tan'] },
  olive:       { label:"Olive Green",       base:"grey",     group:"earth_green",  shirts:['white','cream','light_blue','light_grey'],     ties:['burgundy','navy','brown','gold','charcoal','dark_green',null], shoes:['brown','tan','black'] },
  forestgreen: { label:"Forest Green",      base:"grey",     group:"earth_green",  shirts:['white','light_blue','cream','light_grey'],     ties:['burgundy','navy','brown','gold','charcoal',null], shoes:['brown','black'] },
  sage:        { label:"Sage Green",        base:"grey",     group:"earth_green",  shirts:['white','cream','light_blue','pink'],           ties:['navy','burgundy','brown','gold','charcoal','dark_green',null], shoes:['brown','tan'] },
  moss:        { label:"Moss Green",        base:"grey",     group:"earth_green",  shirts:['white','cream','light_blue','light_grey'],     ties:['burgundy','navy','brown','gold','charcoal',null], shoes:['brown','tan'] },
  bottle:      { label:"Bottle Green",      base:"grey",     group:"earth_green",  shirts:['white','light_blue','cream','light_grey'],     ties:['burgundy','navy','brown','gold','charcoal','black',null], shoes:['brown','black'] },
  teal:        { label:"Teal",              base:"blue",     group:"cool_bright",  shirts:['white','light_blue','cream','light_grey'],     ties:['burgundy','navy','gold','charcoal','brown','silver',null], shoes:['brown','black'] },
  jade:        { label:"Jade Green",        base:"grey",     group:"statement",    shirts:['white','light_blue','cream'],                  ties:['navy','burgundy','gold','charcoal','brown',null], shoes:['brown','black'] },
  purple:      { label:"Purple",            base:"burgundy", group:"statement",    shirts:['white','light_grey','light_blue'],             ties:['silver','charcoal','navy','gold','black',null], shoes:['black','brown'] },
  lavender:    { label:"Lavender",          base:"grey",     group:"statement",    shirts:['white','light_blue','cream','light_grey'],     ties:['navy','charcoal','silver','burgundy','dark_green',null], shoes:['brown','black'] },
  aubergine:   { label:"Aubergine",         base:"burgundy", group:"warm_dark",    shirts:['white','light_grey','light_blue','cream'],     ties:['silver','charcoal','navy','gold','dark_green',null], shoes:['black','brown'] },
  pink:        { label:"Pink",              base:"burgundy", group:"statement",    shirts:['white','light_blue','cream','light_grey'],     ties:['navy','charcoal','burgundy','dark_green','silver',null], shoes:['brown','black'] },
  blush:       { label:"Blush Pink",        base:"burgundy", group:"statement",    shirts:['white','light_blue','cream','light_grey'],     ties:['navy','charcoal','burgundy','dark_green','silver',null], shoes:['brown','black'] },
  coral:       { label:"Coral",             base:"burgundy", group:"statement",    shirts:['white','cream','light_blue'],                  ties:['navy','charcoal','burgundy','dark_green','gold',null], shoes:['brown','tan'] },
}

const _DB_COLOR_ALIASES = {
  navyexpanded:"navy",
  charcoalexpanded:"charcoal",
  light_grey:"grey",
  teal2:"teal",
  green:"olive",
}

function _dbColorKey(color) {
  return _DB_COLOR_ALIASES[color] || color || "navy"
}

function _dbProfile(color) {
  return _LOCAL_COLOR_PROFILES[_dbColorKey(color)] || _LOCAL_COLOR_PROFILES.navy
}

const _DB_SHIRTS = Object.fromEntries(
  Object.entries(_LOCAL_COLOR_PROFILES).map(([color, profile]) => [color, profile.shirts])
)

const _DB_TIES = Object.fromEntries(
  Object.entries(_LOCAL_COLOR_PROFILES).map(([color, profile]) => [color, profile.ties])
)

const _DB_TIE_PATTERNS = ['grenadine','solid','repp_stripe','polka_dot','foulard','knit','paisley']

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

function _tiePatternsForCombo(color, tieColor) {
  if (!tieColor) return [null]
  if (['black','silver','charcoal'].includes(tieColor)) return ['grenadine','solid','knit','foulard']
  if (['gold','rust','terracotta','camel'].includes(tieColor)) return ['grenadine','repp_stripe','knit','foulard']
  if (['burgundy','navy','dark_green','teal','brown'].includes(tieColor)) return _DB_TIE_PATTERNS
  return ['grenadine','solid','repp_stripe','foulard','knit']
}

function _fallbackPants(type, color) {
  if (type === 'suit') return [color]
  const group = _dbProfile(color).group
  if (group === 'earth_light' || group === 'light_neutral') return ['navy','brown','grey']
  if (group === 'earth_green' || group === 'earth_warm') return ['beige','cream','grey','navy']
  if (group === 'statement') return ['charcoal','navy','cream']
  return ['grey','charcoal','beige']
}

function _fallbackShoes(type, color) {
  return _dbProfile(color).shoes || (type === 'suit' ? ['black','brown'] : ['brown','black'])
}

function _dbKey(type,color,shirt,tie,tiePattern,pants,shoe,occ,dc,season,style) {
  return `${type}|${color}|${shirt}|${tie||'NO_TIE'}|${tiePattern||'NO_PATTERN'}|${pants}|${shoe}|${occ}|${dc}|${season}|${style}`
}

// Build the full combination database once at module load (tens of thousands of local looks).
const OUTFIT_DB = (() => {
  const db = new Map()
  const suitColors = Object.keys(_LOCAL_COLOR_PROFILES)
  const blazerColors = ['black','navy','charcoal','grey','brown','camel','tan','beige','olive','forestgreen','cream']
  const garments   = [
    ...suitColors.map(color => ['suit', color]),
    ...blazerColors.map(color => ['blazer', color]),
  ]
  const occasions  = ['office','business_casual','formal','wedding','funeral','church','date','interview','evening_event']
  const seasons    = ['all_season','spring','summer','fall','winter']
  const styles     = ['classic','modern_classic']

  for (const [type, color] of garments) {
    const colorKey = _dbColorKey(color)
    const shirts = _DB_SHIRTS[colorKey]              || _DB_SHIRTS.navy
    const ties   = _DB_TIES[colorKey]                || _DB_TIES.navy
    const pants  = _DB_PANTS[`${type}|${colorKey}`]  || _fallbackPants(type, colorKey)
    const shoes  = _DB_SHOES[`${type}|${colorKey}`]  || _fallbackShoes(type, colorKey)

    for (const shirt of shirts) {
      for (const tie of ties) {
        for (const tiePattern of _tiePatternsForCombo(colorKey, tie)) {
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
                  // Summer + black blazer + business_casual is usually too heavy.
                  if (season === 'summer' && type === 'blazer' && colorKey === 'black' && occ === 'business_casual') continue
                  // Cream shirt: spring / summer / all_season only
                  if (shirt === 'cream' && !['spring','summer','all_season'].includes(season)) continue
                  // Cream pants: spring / summer only
                  if (pant  === 'cream' && !['spring','summer'].includes(season)) continue

                  for (const style of styles) {
                    // Modern-classic wedding requires a tie
                    if (style === 'modern_classic' && occ === 'wedding' && !tie) continue

                    const dc  = _dbDressCode(occ, tie)
                    const key = _dbKey(type,colorKey,shirt,tie,tiePattern,pant,shoe,occ,dc,season,style)
                    if (!db.has(key)) {
                      db.set(key, {
                        main_garment_type: type,  main_color: colorKey,
                        shirt_color: shirt,       tie_color: tie, tie_pattern: tiePattern,
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
  }
  return db
})()

// Maps analysisData.suit.colorFamily → DB main_color key
const COLOR_FAMILY_TO_DB = {
  'Classic Navy':'navy',      'Jet Black':'black',     'Charcoal Grey':'charcoal',
  'Medium Grey':'grey',       'Light Grey':'grey',      'Royal Blue':'navy',
  'Burgundy':'burgundy',      'Brown':'brown',          'Beige':'beige',
  'Navy Blue':'navy',         'Midnight Navy':'midnight','Blue':'blue',
  'Pale Blue':'lightblue',    'Burgundy / Wine':'burgundy', 'Oxblood':'oxblood',
  'Wine':'wine',              'Chocolate Brown':'chocolate', 'Camel':'camel',
  'Tan':'tan',                'Beige / Tan':'beige',    'White / Ivory':'white',
  'Cream / Ivory':'cream',    'Ecru':'ecru',            'Olive Green':'olive',
  'Forest Green':'forestgreen','Sage Green':'sage',      'Moss Green':'moss',
  'Bottle Green':'bottle',    'Teal':'teal',            'Lavender':'lavender',
  'Aubergine':'aubergine',    'Rust':'rust',            'Terracotta':'terracotta',
  'Red':'red',                'Mustard':'mustard',      'Champagne':'champagne',
}

// Maps UI occasion pill label → DB occasion key
const OCCASION_LABEL_TO_DB = {
  Office:'office',  Wedding:'wedding',  Formal:'formal',  Date:'date',
  Funeral:'funeral', Church:'church',   Interview:'interview', Casual:'business_casual',
}

function inferDbColorFromLabel(label = "") {
  const lower = String(label).toLowerCase()
  const direct = Object.entries(_LOCAL_COLOR_PROFILES).find(([key, profile]) =>
    lower === key || lower.includes(profile.label.toLowerCase())
  )
  if (direct) return direct[0]
  if (/midnight|navy|indigo/.test(lower)) return "navy"
  if (/charcoal|graphite|anthracite|gunmetal/.test(lower)) return "charcoal"
  if (/grey|gray|pewter|slate/.test(lower)) return "grey"
  if (/cobalt|royal|blue|teal/.test(lower)) return "blue"
  if (/burgundy|wine|oxblood|claret|maroon/.test(lower)) return "burgundy"
  if (/brown|chocolate|camel|caramel|copper|rust|terracotta/.test(lower)) return "brown"
  if (/beige|tan|cream|ivory|ecru|champagne|wheat|fawn/.test(lower)) return "beige"
  if (/green|olive|sage|moss|forest|bottle|jade/.test(lower)) return "olive"
  if (/purple|lavender|aubergine|plum/.test(lower)) return "purple"
  if (/pink|blush|coral/.test(lower)) return "pink"
  if (/red|scarlet/.test(lower)) return "red"
  if (/black/.test(lower)) return "black"
  return "navy"
}

function inferPatternKeyFromLabel(label = "") {
  const lower = String(label).toLowerCase()
  if (/linen/.test(lower)) return "linen"
  if (/chalk|pinstripe|pin stripe|stripe/.test(lower)) return "chalk_stripe"
  if (/glen|plaid|check|windowpane/.test(lower)) return "glen_plaid"
  if (/herringbone/.test(lower)) return "herringbone"
  if (/houndstooth/.test(lower)) return "houndstooth"
  if (/tweed|donegal|harris/.test(lower)) return "tweed"
  if (/birdseye|nailhead/.test(lower)) return "birdseye"
  if (/seersucker/.test(lower)) return "seersucker"
  if (/flannel/.test(lower)) return "flannel"
  return "solid"
}

const _HEX = {
  white:'#F8F8F8', light_blue:'#89B4D4', light_grey:'#D3D3D3', pink:'#F4B8C1',
  cream:'#FFFDD0', burgundy:'#722F37',   navy:'#191970',        charcoal:'#36454F',
  silver:'#C0C0C0', dark_green:'#355E3B', black:'#1C1C1C',      brown:'#8B6914',
  gold:'#C9A84C', teal:'#008080', rust:'#B7410E', terracotta:'#CB6D51',
  tan:'#C19A6B', grey:'#6E7B8B',
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
function _dbColorLabel(color) { return _dbProfile(color).label || _pretty(color) }
function _dbTiePatternLabel(pattern) {
  const labels = {
    grenadine:"Grenadine",
    solid:"Solid",
    repp_stripe:"Repp Stripe",
    polka_dot:"Polka Dot",
    foulard:"Foulard",
    knit:"Knit",
    paisley:"Paisley",
  }
  return labels[pattern] || _pretty(pattern)
}
function _dbPatternLabel(patternKey) {
  const labels = {
    solid:"Solid",
    chalk_stripe:"Chalk Stripe",
    glen_plaid:"Glen Plaid",
    herringbone:"Herringbone",
    tweed:"Tweed",
    linen:"Linen",
    houndstooth:"Houndstooth",
    birdseye:"Birdseye",
    seersucker:"Seersucker",
    flannel:"Flannel",
  }
  return labels[patternKey] || _pretty(patternKey)
}
function _dbSuitName(color, type, patternKey = "solid") {
  const patternLabel = patternKey && patternKey !== "solid" ? `${_dbPatternLabel(patternKey)} ` : ""
  return `${_dbColorLabel(color)} ${patternLabel}${_cap(type)}`
}
function _dbTieName(color, pattern) {
  if (!color) return "No tie"
  return `${_pretty(color)} ${_dbTiePatternLabel(pattern)} tie`
}
function _dbShoeName(color) {
  const names = {
    black:"Black Cap-Toe Oxford",
    brown:"Dark Brown Derby Brogue",
    tan:"Tan Suede Loafer",
    burgundy:"Burgundy Cap-Toe Oxford",
  }
  return names[color] || `${_pretty(color)} leather shoes`
}

// Convert a DB combo entry into the Dapper package display format
function _comboToPackage(c) {
  const tie = _dbTieName(c.tie_color, c.tie_pattern)
  return {
    name:         `${_dbColorLabel(c.main_color)} ${_pretty(c.occasion)}`,
    suit:         _dbSuitName(c.main_color, c.main_garment_type, c.patternKey),
    shirt:        `${_pretty(c.shirt_color)} poplin`,
    tie,
    pocketSquare: `White linen — ${c.dress_code === 'formal' ? 'TV Fold' : 'Puff Fold'}`,
    shoes:        _dbShoeName(c.shoes_color),
    belt:         `${_cap(c.belt_color)} leather belt`,
    socks:        c.shoes_color === 'black' ? 'Dark navy, over-the-calf' : 'Brown or burgundy shadow stripe',
    watch:        c.dress_code === 'formal' ? 'Silver dress watch' : 'Casual leather-strap watch',
    occasion:     _OCC_LABEL[c.occasion] || _pretty(c.occasion),
    archetype:    c.style === 'modern_classic' ? 'Continental' : 'British Classic',
    confidence:   _confStars(c.confidence_score),
    tip:          `${_pretty(c.shirt_color)} shirt with ${tie.toLowerCase()} - a ${_pretty(c.dress_code)} ${c.season === 'all_season' ? '' : c.season + ' '}look for ${_pretty(c.occasion)}.`,
    shirtColor:   _HEX[c.shirt_color] || '#F8F8F8',
    tieColor:     _HEX[c.tie_color]   || '#191970',
  }
}

// Return up to `limit` matching packages from OUTFIT_DB as display-ready objects
function lookupOutfitPackages({ mainType, mainColor, patternKey, occasion, season, limit = 6 }) {
  const colorKey = mainColor ? _dbColorKey(mainColor) : null
  const results = []
  for (const c of OUTFIT_DB.values()) {
    if (mainType  && c.main_garment_type !== mainType)  continue
    if (colorKey  && c.main_color        !== colorKey)  continue
    if (occasion  && c.occasion          !== occasion)  continue
    const seasonOk = !season || season === 'all_season' ||
                     c.season === season || c.season === 'all_season'
    if (!seasonOk) continue
    results.push(patternKey ? { ...c, patternKey } : c)
  }
  results.sort((a, b) => b.confidence_score - a.confidence_score)
  return results.slice(0, limit).map(_comboToPackage)
}

const _LOCAL_PATTERN_META = {
  solid:        { pattern:"Solid",                 fabric:"Worsted wool",           formality:"Business Formal / Smart Casual", note:"solid cloth gives maximum freedom for shirt and tie patterns" },
  chalk_stripe: { pattern:"Chalk Stripe",          fabric:"Wool twill",             formality:"Business Formal",                note:"the stripe already leads, so keep tie scale smaller" },
  glen_plaid:   { pattern:"Glen Plaid / Check",    fabric:"Worsted wool check",     formality:"Business Casual / Smart Formal", note:"plaid asks for restrained ties and clean shirts" },
  herringbone:  { pattern:"Herringbone",           fabric:"Herringbone wool",       formality:"Business Formal / Smart Casual", note:"the weave reads as quiet texture from a distance" },
  tweed:        { pattern:"Tweed",                 fabric:"Donegal or Harris Tweed",formality:"Smart Casual / Country",         note:"natural texture pairs best with knits and suede" },
  linen:        { pattern:"Linen",                 fabric:"100% linen",             formality:"Smart Casual / Summer",          note:"linen is strongest open-collar or with relaxed knit ties" },
  houndstooth:  { pattern:"Houndstooth",           fabric:"Wool houndstooth",       formality:"Smart Casual / Statement",       note:"the bold geometry needs a solid tie" },
  birdseye:     { pattern:"Birdseye",              fabric:"Birdseye wool",          formality:"Business Formal",                note:"micro texture behaves almost like a solid" },
  seersucker:   { pattern:"Seersucker",            fabric:"Cotton seersucker",      formality:"Summer Smart Casual",            note:"summer cloth calls for light shirts and relaxed ties" },
  flannel:      { pattern:"Flannel",               fabric:"Wool flannel",           formality:"Business Casual / Winter",       note:"soft texture pairs beautifully with grenadine and knit ties" },
}

const _SHIRT_META = {
  white:       { name:"Crisp White Poplin",      colorCode:"#F8F8F8", collar:"Spread collar",      pattern:"Solid" },
  light_blue:  { name:"Pale Blue Poplin",        colorCode:"#89B4D4", collar:"Semi-spread collar", pattern:"Solid" },
  light_grey:  { name:"Light Grey End-on-End",   colorCode:"#D3D3D3", collar:"Spread collar",      pattern:"End-on-End" },
  pink:        { name:"Pale Pink Poplin",        colorCode:"#F4B8C1", collar:"Button-down collar", pattern:"Solid" },
  cream:       { name:"Cream Poplin",            colorCode:"#FFFDD0", collar:"Soft spread collar", pattern:"Solid" },
}

function _localPatternMeta(patternKey) {
  return _LOCAL_PATTERN_META[patternKey] || _LOCAL_PATTERN_META.solid
}

function _localBaseAnalysis(colorKey) {
  const profile = _dbProfile(colorKey)
  return _BASE_MAP[colorKey] || _BASE_MAP[profile.base] || ANALYSIS
}

function _localTiePatternsForSuit(suitPatternKey, shirtKey) {
  if (suitPatternKey === "glen_plaid" || suitPatternKey === "houndstooth") return ['grenadine','solid','knit']
  if (suitPatternKey === "chalk_stripe") return shirtKey === "light_grey" ? ['grenadine','solid','foulard','knit'] : ['grenadine','polka_dot','foulard','knit','solid']
  if (suitPatternKey === "tweed") return ['knit','grenadine','repp_stripe','solid']
  if (suitPatternKey === "linen" || suitPatternKey === "seersucker") return ['knit','solid','grenadine']
  if (suitPatternKey === "herringbone" || suitPatternKey === "flannel" || suitPatternKey === "birdseye") return ['grenadine','repp_stripe','polka_dot','foulard','knit','solid']
  return ['repp_stripe','grenadine','polka_dot','foulard','knit','solid','paisley']
}

function _localTieWhy(colorKey, suitPatternKey, tieColor, tiePattern) {
  const suitName = _dbColorLabel(colorKey).toLowerCase()
  const patternNote = _localPatternMeta(suitPatternKey).note
  if (!tieColor) return "Open-collar is a valid relaxed choice for this suit."
  return `${_pretty(tieColor)} ${_dbTiePatternLabel(tiePattern).toLowerCase()} gives contrast against a ${suitName} suit; ${patternNote}.`
}

function _localTieObject(colorKey, suitPatternKey, tieColor, tiePattern, id) {
  return {
    id,
    name: `${_pretty(tieColor)} ${_dbTiePatternLabel(tiePattern)}`,
    color: _HEX[tieColor] || "#555555",
    pattern: _dbTiePatternLabel(tiePattern),
    material: tiePattern === "knit" ? "Silk knit" : tiePattern === "grenadine" ? "Grenadine silk" : "Silk twill",
    width: '3"',
    knot: tiePattern === "knit" ? "Four-in-Hand" : "Half Windsor",
    harmony: ['gold','rust','terracotta','brown','camel'].includes(tieColor) ? "Warm contrast" : "Classic contrast",
    why: _localTieWhy(colorKey, suitPatternKey, tieColor, tiePattern),
  }
}

function _localShirts(colorKey, patternKey) {
  const shirtKeys = (_DB_SHIRTS[_dbColorKey(colorKey)] || _DB_SHIRTS.navy).slice(0, 4)
  const tieColors = (_DB_TIES[_dbColorKey(colorKey)] || _DB_TIES.navy).filter(Boolean)
  return shirtKeys.map((shirtKey, shirtIdx) => {
    const shirtMeta = _SHIRT_META[shirtKey] || _SHIRT_META.white
    const tiePatterns = _localTiePatternsForSuit(patternKey, shirtKey)
    const ties = tieColors.slice(0, 6).map((tieColor, idx) => {
      const tiePattern = tiePatterns[idx % tiePatterns.length]
      return _localTieObject(colorKey, patternKey, tieColor, tiePattern, idx + 1)
    })
    return {
      id: shirtIdx + 1,
      ...shirtMeta,
      why: `${shirtMeta.name} gives the ${_dbColorLabel(colorKey).toLowerCase()} suit a clean foundation while leaving room for ${patternKey === "solid" ? "patterned" : "controlled"} tie contrast.`,
      ties,
    }
  })
}

function buildGeneratedLocalAnalysis(colorKey, patternKey = "solid") {
  const dbColor = _dbColorKey(colorKey)
  const profile = _dbProfile(dbColor)
  const base = _localBaseAnalysis(dbColor)
  const patternMeta = _localPatternMeta(patternKey)
  const packages = lookupOutfitPackages({ mainType:"suit", mainColor:dbColor, patternKey, limit:8 })
  const fallbackPackages = (base.packages || []).map(pkg => ({
    ...pkg,
    suit: _dbSuitName(dbColor, "suit", patternKey),
    tie: pkg.tie === "See shirt recommendations" ? _dbTieName((_DB_TIES[dbColor] || _DB_TIES.navy).find(Boolean), "grenadine") : pkg.tie,
  }))

  return {
    ...base,
    suit: {
      ...base.suit,
      colorFamily: profile.label,
      fabric: patternMeta.fabric,
      pattern: patternMeta.pattern,
      formality: patternMeta.formality,
      undertones: profile.group.replace(/_/g, " "),
    },
    shirts: _localShirts(dbColor, patternKey),
    packages: packages.length ? packages : fallbackPackages,
    styleMantra: `${profile.label} ${patternMeta.pattern.toLowerCase()} rewards balance: a clean shirt foundation, deliberate tie contrast, quiet linen at the pocket, and leather that anchors the whole look.`,
    _isMatrixMatch: true,
    _isLocalGenerated: true,
    _localColorKey: dbColor,
    _localPatternKey: patternKey,
  }
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
  const mainColor   = analysisObj._localColorKey || COLOR_FAMILY_TO_DB[colorFamily] || inferDbColorFromLabel(colorFamily)
  const patternKey  = analysisObj._localPatternKey || inferPatternKeyFromLabel(analysisObj.suit?.pattern || '')
  const dbOcc       = OCCASION_LABEL_TO_DB[occasion]
  if (mainColor && dbOcc) {
    const dbPkgs = lookupOutfitPackages({ mainColor, patternKey, occasion: dbOcc, limit: 6 })
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

const STYLE_LENSES = [
  {
    id: "classic",
    label: "Classic Menswear",
    sub: "Savile Row rules",
    prompt: "Judge by permanent classic menswear: proportion, restraint, formality, clean contrast, and rule-aware pattern mixing. Reward timeless combinations and penalize gimmicks.",
    mantra: "Classic menswear wins by restraint: fit, proportion, contrast, and one deliberate detail.",
    comboNote: "Through the classic menswear lens, this should feel restrained, proportionate, and correct before it feels daring.",
    tips: ["Keep contrast clean and avoid letting more than one element shout.", "When unsure, let the shirt and pocket square stay quiet."],
  },
  {
    id: "gq",
    label: "GQ Editorial",
    sub: "Modern magazine polish",
    prompt: "Judge through a GQ editorial lens: sharper modern presence, intentional color, confident pattern or texture, and one strong point of view. Reward stylish risk when it is controlled; penalize boring execution and costume energy.",
    mantra: "GQ Editorial wants a point of view: clean silhouette, one confident move, no costume energy.",
    comboNote: "Through the GQ Editorial lens, this needs a crisp point of view: one confident statement, controlled by clean supporting pieces.",
    tips: ["Choose one editorial statement: tie, suit texture, pocket square, or shoes.", "Keep the remaining pieces sharp and quiet so the look photographs well."],
  },
  {
    id: "quiet_luxury",
    label: "Quiet Luxury",
    sub: "Understated wealth",
    prompt: "Judge through a quiet luxury lens: soft tonal harmony, elite fabrics, subtle texture, very little visible flash, and impeccable fit. Reward understated richness; penalize loud contrast, novelty, and over-accessorizing.",
    mantra: "Quiet Luxury is texture, tone, and fit doing the work without announcing themselves.",
    comboNote: "Through the Quiet Luxury lens, the look should rely on fabric, tone, and fit rather than loud contrast.",
    tips: ["Use tonal ties, matte texture, and restrained pocket squares.", "Avoid novelty patterns or high-shine accessories."],
  },
  {
    id: "power_business",
    label: "Power Business",
    sub: "Boardroom authority",
    prompt: "Judge through a power business lens: executive credibility, darker tailoring, decisive contrast, conservative shoes, and no distracting flourishes. Reward authority and clarity; penalize playful styling in serious settings.",
    mantra: "Power Business is clarity: dark tailoring, crisp shirt, decisive tie, polished leather.",
    comboNote: "Through the Power Business lens, the outfit should project authority before personality.",
    tips: ["Prioritize white or pale blue shirts and disciplined tie color.", "Use black or dark brown polished leather to anchor the outfit."],
  },
  {
    id: "italian",
    label: "Italian Sprezzatura",
    sub: "Relaxed tailoring",
    prompt: "Judge through an Italian sprezzatura lens: relaxed confidence, softer contrast, natural fabrics, tonal warmth, and ease. Reward tasteful looseness and texture; penalize stiffness, heavy corporate severity, or over-matching.",
    mantra: "Italian Sprezzatura is relaxed precision: warm tones, natural texture, and nothing too forced.",
    comboNote: "Through the Italian Sprezzatura lens, the outfit should feel relaxed, tactile, and intentional without looking stiff.",
    tips: ["Lean into texture: grenadine, knit ties, linen, suede, and warmer leather.", "Let the pocket square feel relaxed rather than perfectly matched."],
  },
]

function styleLensById(id) {
  return STYLE_LENSES.find(lens => lens.id === id) || STYLE_LENSES[0]
}

function applyStyleLensToAnalysis(analysisObj, lens) {
  if (!analysisObj) return analysisObj
  const active = lens || STYLE_LENSES[0]
  if (active.id === "classic") return analysisObj
  return {
    ...analysisObj,
    styleMantra: `${active.label}: ${active.mantra}`,
  }
}

function applyStyleLensToCombo(combo, lens) {
  if (!combo) return combo
  const active = lens || STYLE_LENSES[0]
  if (active.id === "classic") return combo
  const existingTips = Array.isArray(combo.tips) ? combo.tips : []
  return {
    ...combo,
    assessment: `${combo.assessment} ${active.comboNote}`,
    tips: [...active.tips, ...existingTips].slice(0, 5),
    styleLens: active.label,
  }
}

function accountPlanLabel(entitlement) {
  if (!entitlement || entitlement.plan === "free") return "Free"
  if (entitlement.plan === "elite") return "Elite"
  if (entitlement.plan === "pro") return "Pro"
  return entitlement.label || "Free"
}

function accountPlanCaption(entitlement) {
  const plan = entitlement?.plan || "free"
  if (plan === "elite") return "Elite access"
  if (plan === "pro") return entitlement?.source === "admin_comp" ? "Complimentary Pro" : "Pro access"
  return "3 AI analyses / month"
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────

function Sidebar({ page, setPage, mobile, onClose, user, onAuthClick, onLogOut, onReportProblem, entitlement, isAdmin, collapsed = false }) {
  const items = [
    { id:"analyzer",  icon:Wand2,    label:"AI Analyzer" },
    { id:"validator", icon:Check,    label:"Outfit Validator", badge:"NEW" },
    { id:"closet",    icon:Shirt,    label:"My Closet" },
    { id:"calendar",  icon:Calendar, label:"Outfit Calendar" },
    { id:"community", icon:Users,    label:"Community" },
    { id:"pricing",   icon:Tag,      label:"Upgrade" },
  ]
  if (isAdmin) items.push({ id:"admin", icon:Shield, label:"Admin", badge:"OWNER" })
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest"
  const initials    = displayName[0].toUpperCase()
  const planLabel   = accountPlanLabel(entitlement)
  const planCaption = accountPlanCaption(entitlement)
  const planUsed    = entitlement?.plan === "free" ? "1 of 3 used this month" : "Unlimited access"
  const isCompact   = !mobile && collapsed
  const widthClass  = mobile ? "w-72" : (isCompact ? "w-16" : "w-64")

  return (
    <div style={{background:NAVY,color:"white"}} className={`flex flex-col h-full ${widthClass} flex-shrink-0 transition-[width] duration-200 ease-out overflow-hidden`}>
      {/* Logo */}
      <div className={`${isCompact?"px-3":"px-6"} py-5 flex items-center justify-between border-b border-white border-opacity-10`}>
        <div className="flex items-center gap-2 min-w-0">
          <div style={{background:GOLD}} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shirt size={16} color={NAVY} />
          </div>
          {!isCompact && <span className="text-xl font-black tracking-widest whitespace-nowrap">DAPPER</span>}
        </div>
        {mobile && <button onClick={onClose}><X size={20} /></button>}
      </div>

      {/* Usage badge */}
      {!isCompact && (
        <div className="mx-4 mt-4 mb-1 px-3 py-2 rounded-xl" style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.25)"}}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs font-bold tracking-widest" style={{color:GOLD}}>{planLabel.toUpperCase()} TIER</div>
              <div className="text-xs text-gray-400">{planCaption}</div>
            </div>
            {entitlement?.plan !== "elite" && (
              <button onClick={()=>{setPage("pricing");if(onClose)onClose()}} className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:GOLD,color:NAVY}}>Pro</button>
            )}
          </div>
          <div className="flex gap-1 mt-1">
            {[1,2,3].map(i=><div key={i} className="h-1 flex-1 rounded-full" style={{background:entitlement?.plan !== "free" || i===1?GOLD:"rgba(255,255,255,0.1)"}} />)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{planUsed}</div>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 ${isCompact?"px-2":"px-3"} py-3 space-y-0.5`}>
        {items.map((item)=>{
          const {id,icon:Icon,label,badge} = item
          const active = page===id
          return (
            <button key={id} onClick={()=>{setPage(id);if(onClose)onClose()}}
              title={isCompact ? label : undefined}
              className={`w-full flex items-center ${isCompact?"justify-center px-0":"gap-3 px-4"} py-2.5 rounded-xl text-sm font-medium transition-all ${active?"":"text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5"}`}
              style={active?{background:"rgba(201,168,76,0.15)",color:GOLD}:{}}
            >
              <Icon size={17}/>
              {!isCompact && <span className="whitespace-nowrap">{label}</span>}
              {!isCompact && badge && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold" style={{background:GOLD,color:NAVY}}>{badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* Report problem */}
      <div className={`${isCompact?"px-2":"px-4"} pb-3`}>
        <button onClick={()=>{ onReportProblem?.(); if(onClose)onClose() }}
          title={isCompact ? "Report a Problem" : undefined}
          className={`w-full flex items-center ${isCompact?"justify-center px-0 py-2.5":"gap-3 px-4 py-3"} rounded-xl text-sm font-bold transition-all text-gray-300 hover:text-white`}
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)"}}>
          <MessageCircle size={16}/>
          {!isCompact && <span className="whitespace-nowrap">Report a Problem</span>}
        </button>
      </div>

      {/* User */}
      <div className={`${isCompact?"p-2":"p-4"} border-t border-white border-opacity-10`}>
        {user ? (
          isCompact ? (
            <button onClick={onLogOut} title={`${displayName} — sign out`}
              className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{background:GOLD,color:NAVY}}>
                {initials}
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{background:GOLD,color:NAVY}}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{displayName}</div>
                <div className="text-xs text-gray-500">{planLabel} Member{isAdmin ? " · Owner" : ""}</div>
              </div>
              <button onClick={onLogOut} title="Sign out"
                className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all">
                <LogOut size={15} className="text-gray-500"/>
              </button>
            </div>
          )
        ) : (
          <button onClick={onAuthClick}
            title={isCompact ? "Sign in to sync data" : undefined}
            className={`w-full flex items-center ${isCompact?"justify-center px-0 py-2.5":"gap-3 px-4 py-3"} rounded-xl text-sm font-bold transition-all`}
            style={{background:"rgba(201,168,76,0.15)",color:GOLD}}>
            <LogIn size={16}/>
            {!isCompact && <span className="whitespace-nowrap">Sign in to sync data</span>}
          </button>
        )}
      </div>
    </div>
  )
}

function DesktopSidebarShell(props) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="hidden lg:flex" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      <Sidebar {...props} collapsed={!hovered} />
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

function shouldUseApiForTextDescription(text) {
  const t = normalizeMenswearText(text)
  const hasTie = /\btie\b|\bnecktie\b/.test(t)
  const tieContext = ((t.split(/\btie\b/)[0] || "").split(/\b(?:shirt|suit|blazer|jacket)\b/).pop() || "").trim()
  const colorPattern = /\b(black|charcoal|navy|grey|gray|silver|blue|cobalt|royal|burgundy|wine|oxblood|maroon|brown|chocolate|cognac|beige|tan|camel|green|olive|sage|forest|hunter|bottle|moss|emerald|white|cream|ivory|purple|violet|plum|red|crimson|scarlet|gold|mustard|yellow|orange|rust|terracotta|pink|coral|blush)\b/g
  const colorHits = t.match(colorPattern) || []
  const tieColorHits = tieContext.match(colorPattern) || []
  const tieHasJoiner = /(?:\band\b|\bwith\b|&|\/|-)/.test(tieContext)
  const tieHasPattern = /stripe|striped|stripes|repp|plaid|check|paisley|foulard/.test(tieContext)
  const multicolorTie = hasTie && tieColorHits.length >= 2 && (tieHasJoiner || tieHasPattern)
  const tooManyGarmentsAndColors = hasTie && /\bshirt\b/.test(t) && /\bsuit\b/.test(t) && colorHits.length >= 4 && tieColorHits.length >= 2
  return multicolorTie || tooManyGarmentsAndColors
}

function textColorLabelFromKey(key) {
  const labels = {
    lightblue: "light blue", forestgreen: "forest green", dovegrey: "dove grey",
    dark_green: "dark green", teal2: "teal", navyexpanded: "navy", charcoalexpanded: "charcoal",
  }
  return labels[key] || String(key || "navy").replace(/_/g, " ")
}

function textPatternLabelFromKey(key) {
  if (!key || key === "solid") return ""
  return String(key).replace(/_/g, " ")
}

function comboTextFromParsedDescription(parsedText, fallbackText) {
  if (!parsedText?.success || !parsedText.colorKey) return fallbackText
  const suit = [textColorLabelFromKey(parsedText.colorKey), textPatternLabelFromKey(parsedText.patternKey), "suit"].filter(Boolean).join(" ")
  const shirt = parsedText.shirt ? [parsedText.shirt.color, parsedText.shirt.pattern && parsedText.shirt.pattern !== "solid" ? parsedText.shirt.pattern : "", "shirt"].filter(Boolean).join(" ") : ""
  const tie = parsedText.tie ? [parsedText.tie.color, parsedText.tie.pattern && parsedText.tie.pattern !== "solid" ? parsedText.tie.pattern : "", "tie"].filter(Boolean).join(" ") : ""
  return [suit, shirt, tie].filter(Boolean).join(" with ")
}

function fullLookPieceLabel(piece, noun) {
  if (!piece?.visible) return ""
  const color = piece.colorLabel || displayColorLabel(piece.color)
  const pattern = piece.patternLabel && piece.patternLabel !== "solid" ? piece.patternLabel : ""
  const fabric = piece.fabric && piece.fabric !== "Unknown" && noun !== "tie" && noun !== "pocket square" ? piece.fabric : ""
  const style = piece.style && piece.style !== "Unknown" ? piece.style : ""
  return [color, pattern, style || fabric || noun].filter(Boolean).join(" ").trim()
}

function fullLookValidatorState(fullLook, occasion) {
  return {
    suit: fullLookPieceLabel(fullLook?.suit, "suit"),
    suitPattern: validatorPatternKeyFromLabel(fullLook?.suit?.patternLabel || fullLook?.suit?.pattern || "solid"),
    shirt: fullLookPieceLabel(fullLook?.shirt, "shirt"),
    tie: fullLookPieceLabel(fullLook?.tie, "tie"),
    pocketSquare: fullLookPieceLabel(fullLook?.pocketSquare, "pocket square"),
    shoes: fullLookPieceLabel(fullLook?.shoes, "shoes"),
    belt: fullLookPieceLabel(fullLook?.belt, "belt"),
    occasion,
  }
}

function fullLookSuitPhotoResult(fullLook) {
  if (!fullLook?.suit?.visible) return null
  return {
    colorKey: fullLook.suit.color || "navy",
    colorLabel: fullLook.suit.colorLabel || displayColorLabel(fullLook.suit.color),
    colorHex: fullLook.suit.colorHex || "#1B3A6B",
    patternInfo: {
      pattern: fullLook.suit.patternLabel || fullLook.suit.pattern || "Solid",
      formality: "Detected from full look",
    },
    fabricStr: fullLook.suit.fabric || "Detected fabric",
    confidence: fullLook.suit.confidence || 0.5,
    visionData: fullLook,
    r: 26,
    g: 39,
    b: 78,
  }
}

const FULL_LOOK_SUIT_COLOR_OPTIONS = [
  "Black", "Charcoal Grey", "Navy Blue", "Midnight Navy", "Medium Grey",
  "Blue", "Brown", "Olive Green", "Forest Green", "Burgundy", "Beige / Tan", "White / Ivory",
]

function fullLookColorKeyFromLabel(label, fallback = "navy") {
  const value = String(label || "").toLowerCase()
  if (/midnight/.test(value)) return "midnight"
  if (/navy|indigo/.test(value)) return "navy"
  if (/charcoal|graphite|anthracite/.test(value)) return "charcoal"
  if (/black|onyx|ebony/.test(value)) return "black"
  if (/forest|hunter|bottle/.test(value)) return "forestgreen"
  if (/sage/.test(value)) return "sage"
  if (/olive|green/.test(value)) return "olive"
  const validatorKey = classifyValidatorColorText(label)
  return validatorKey || fallback || "navy"
}

function LocalSuitDebugCard({ diagnostics }) {
  if (!diagnostics?.selected) return null
  const selected = diagnostics.selected
  const candidateRows = Array.isArray(diagnostics.candidates) ? diagnostics.candidates : []

  return (
    <div className="rounded-xl p-4" style={{ background:"#fff7ed", border:"1px solid #fdba74" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs font-black tracking-wider" style={{ color:"#9a3412" }}>LOCAL SUIT DEBUG</div>
          <div className="text-sm font-bold text-gray-900">
            {selected.colorKey} via {diagnostics.method}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Confidence</div>
          <div className="text-sm font-black text-gray-900">{Math.round((selected.confidence || 0) * 100)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          ["Winning crop", selected.cropLabel || "n/a"],
          ["Winning family", selected.voteFamily || "n/a"],
          ["Score", selected.score],
          ["Dark neutral", selected.darkNeutralPixelRatio],
          ["Dark ratio", selected.darkPixelRatio],
          ["Warm bias", selected.sceneNeutralWarmBias],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg p-2" style={{ background:"rgba(255,255,255,0.65)", border:"1px solid rgba(251,146,60,0.25)" }}>
            <div className="text-[10px] font-black tracking-wider text-gray-400">{label.toUpperCase()}</div>
            <div className="text-xs font-semibold text-gray-700 mt-1 break-words">{String(value ?? "n/a")}</div>
          </div>
        ))}
      </div>

      {diagnostics.notes?.length > 0 && (
        <div className="mb-3 text-xs text-gray-600">
          {diagnostics.notes.join(" ")}
        </div>
      )}

      <div className="space-y-2">
        {candidateRows.slice(0, 6).map((candidate, index) => (
          <div key={`${candidate.cropLabel || "crop"}-${index}`} className="rounded-lg p-2" style={{ background:"rgba(255,255,255,0.55)", border:"1px solid rgba(148,163,184,0.2)" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-gray-900">{candidate.cropLabel || "crop"}</div>
              <div className="text-[11px] font-semibold text-gray-500">
                {candidate.colorKey} / {candidate.voteFamily}
              </div>
            </div>
            <div className="mt-1 text-[11px] text-gray-600">
              conf {Math.round((candidate.confidence || 0) * 100)}% · score {candidate.score} · dark {candidate.darkPixelRatio} · neutral {candidate.darkNeutralPixelRatio}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SHARED UI: SelectableCard
// One canonical card treatment for single-select choices
// (analyzer modes, style lens, etc.). Keeps the selected/
// non-selected visual language consistent across the app.
// ─────────────────────────────────────────────

function SelectableCard({ selected, onClick, title, subtitle, icon, className = "", size = "md" }) {
  const padding = size === "sm" ? "py-3 px-4" : "p-4"
  const titleSize = size === "sm" ? "text-sm" : "text-sm"
  return (
    <button type="button" onClick={onClick}
      className={`${padding} rounded-xl border-2 text-left transition-all hover:shadow-sm ${className}`}
      style={selected
        ? {borderColor:GOLD, background:"#fffbeb", boxShadow:"0 2px 12px rgba(201,168,76,0.15)"}
        : {borderColor:"#e5e7eb", background:"white"}}>
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5 flex-shrink-0" style={{color: selected ? "#92400e" : "#9ca3af"}}>{icon}</span> : null}
        <div className="min-w-0">
          <div className={`font-bold ${titleSize} text-gray-900`}>{title}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// PAGE: AI ANALYZER
// ─────────────────────────────────────────────

function AnalyzerPage() {
  const { analyzeOutfit, analyzeFullLook, analyzeText } = useClaudeVision()
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
  const [styleLens, setStyleLens]     = useState("classic")
  const [refineOpen, setRefineOpen]   = useState(false)
  const [suitPhoto, setSuitPhoto]     = useState(null)
  const [shirtPhoto, setShirtPhoto]   = useState(null)
  const [fullLookPhoto, setFullLookPhoto] = useState(null)
  const [previewRenderFailed, setPreviewRenderFailed] = useState(false)
  const [photoResult, setPhotoResult]           = useState(null)
  const [shirtPhotoResult, setShirtPhotoResult] = useState(null)
  const [fullLookResult, setFullLookResult]     = useState(null)
  const [correcting, setCorrecting]             = useState(false)
  const [correction, setCorrection]             = useState({ color:"", pattern:"", fabric:"" })
  const [correctingShirt, setCorrectingShirt]   = useState(false)
  const [shirtCorrection, setShirtCorrection]   = useState({ color:"", pattern:"" })
  const [correctingFullLook, setCorrectingFullLook] = useState(false)
  const [fullLookCorrection, setFullLookCorrection] = useState({ suitColor:"", suitPattern:"" })
  const suitInputRef  = { current: null }
  const shirtInputRef = { current: null }
  const progressTimerRef = useRef(null)
  const analyzeInFlightRef = useRef(false)

  // Clear any running progress interval if the user navigates away mid-analysis
  // (prevents a leaked timer + setState-on-unmounted warnings).
  useEffect(() => () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current) }, [])

  const [suitFile, setSuitFile] = useState(null)
  const [shirtFile, setShirtFile] = useState(null)
  const [fullLookFile, setFullLookFile] = useState(null)
  const [preparingPhoto, setPreparingPhoto] = useState("")
  const [showAnalyzerDebug, setShowAnalyzerDebug] = useState(false)
  const selectedStyleLens = styleLensById(styleLens)
  const isPreparingUpload = Boolean(preparingPhoto)

  useEffect(() => () => releaseObjectUrl(suitPhoto), [suitPhoto])
  useEffect(() => () => releaseObjectUrl(shirtPhoto), [shirtPhoto])
  useEffect(() => () => releaseObjectUrl(fullLookPhoto), [fullLookPhoto])
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const enabled = params.get("analyzerDebug") === "1" || window.localStorage.getItem("dapper.analyzerDebug") === "1"
    if (enabled) setShowAnalyzerDebug(true)
  }, [])

  const handlePhotoSelect = async (e, setter) => {
    const rawFile = e.target.files[0]
    if (!isImageFileLike(rawFile)) {
      setKeyError("Please upload an image file: JPG, PNG, WebP, GIF, HEIC, or HEIF.")
      return
    }
    e.target.value = ""
    setKeyError("")
    setPreviewRenderFailed(false)
    const slotLabel = setter === setSuitPhoto ? "suit" : setter === setShirtPhoto ? "shirt" : "full look"
    setPreparingPhoto(isHeicLike(rawFile) ? `Converting ${slotLabel} photo from HEIC...` : `Preparing ${slotLabel} photo...`)

    let file = rawFile
    try {
      file = await prepareVisionImageFile(rawFile)
    } catch (err) {
      setKeyError(err.message || "Could not prepare that photo.")
      if (setter === setSuitPhoto) setSuitFile(null)
      if (setter === setShirtPhoto) setShirtFile(null)
      if (setter === setFullLookPhoto) setFullLookFile(null)
      setter(null)
      setPreparingPhoto("")
      return
    }

    let nextPreview
    try {
      nextPreview = await readFileDataUrl(file)
    } catch (err) {
      setKeyError(err.message || "Could not read that photo for preview.")
      if (setter === setSuitPhoto) setSuitFile(null)
      if (setter === setShirtPhoto) setShirtFile(null)
      if (setter === setFullLookPhoto) setFullLookFile(null)
      setter(null)
      setPreparingPhoto("")
      return
    }
    if (setter === setSuitPhoto) releaseObjectUrl(suitPhoto)
    if (setter === setShirtPhoto) releaseObjectUrl(shirtPhoto)
    if (setter === setFullLookPhoto) releaseObjectUrl(fullLookPhoto)
    if (setter === setSuitPhoto) setSuitFile(file)
    if (setter === setShirtPhoto) setShirtFile(file)
    if (setter === setFullLookPhoto) setFullLookFile(file)
    setter(nextPreview)

    if ((isHeicLike(rawFile) && !isHeicLike(file)) || (rawFile.type && file.type && rawFile.type !== file.type)) {
      setKeyError("Photo optimized to JPG for compatibility.")
    }
    setPreparingPhoto("")
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

  // Re-entrancy guard: a second click mid-analysis would fire duplicate
  // (paid) API calls and race on the result state. The ref blocks rapid
  // double-clicks even before the disabled button re-renders.
  const runAnalysis = async () => {
    if (analyzeInFlightRef.current) return
    analyzeInFlightRef.current = true
    try { await runAnalysisImpl() }
    finally { analyzeInFlightRef.current = false }
  }

  const runAnalysisImpl = async () => {
    setKeyError("")
    setFullLookResult(null)
    setCorrectingFullLook(false)
    const activeStyleLens = styleLensById(styleLens)

    // ── FULL LOOK MODE — API reads and judges the worn outfit ──
    if (mode === "D") {
      if (!fullLookPhoto || !fullLookFile) {
        setKeyError("Upload a full look photo first.")
        return
      }

      setIsDemo(false)
      setComboAssessment(null)
      setPhotoResult(null)
      setShirtPhotoResult(null)
      setAnalyzing(true); setProgress(0); setCurrentStep(0)
      let p = 0
      const iv = setInterval(() => {
        p += Math.random() * 10 + 3
        setCurrentStep(Math.min(Math.floor((p / 100) * STEPS.length), STEPS.length - 1))
        if (p >= 88) clearInterval(iv)
        setProgress(Math.min(p, 88))
      }, 220)
      progressTimerRef.current = iv

      try {
        const visionResult = await analyzeFullLook(fullLookFile, activeStyleLens)
        clearInterval(iv)

        if (!visionResult.success) {
          const localFallback = await analyzeFullLookSuitLocally(fullLookPhoto)
          if (localFallback) {
            const partialResult = {
              ...localFallback,
              colorCorrectionNote: "Full Look AI could not process this photo, so Dapper checked multiple torso crops and used the best local suit read from the outfit image."
            }
            const analysis = getAnalysisFromPhotoResult(partialResult)
            setAnalysisData(applyStyleLensToAnalysis(analysis, activeStyleLens))
            setPhotoResult(partialResult)
            setFullLookResult(null)
            setProgress(100)
            setTimeout(() => { setAnalyzing(false); setDone(true) }, 400)
            return
          }
          setProgress(0)
          setAnalyzing(false)
          setKeyError(visionResult.error ? `Full Look analysis failed: ${visionResult.error}` : "Full Look could not read this photo. Please reselect a JPG, PNG, or WebP image and try again.")
          return
        }

        const localFullLookSuitResult = await analyzeFullLookSuitLocally(fullLookPhoto)
        const reconciledFullLook = reconcileDarkFullLookRead(visionResult.data, localFullLookSuitResult)
        const d = localFullLookSuitResult?.localSuitDiagnostics ? {
          ...reconciledFullLook,
          suit: reconciledFullLook?.suit ? {
            ...reconciledFullLook.suit,
            localSuitDiagnostics: reconciledFullLook.suit?.localSuitDiagnostics || localFullLookSuitResult.localSuitDiagnostics,
          } : reconciledFullLook?.suit,
        } : reconciledFullLook
        const suitResult = fullLookSuitPhotoResult(d)
        if (suitResult) setAnalysisData(applyStyleLensToAnalysis(getAnalysisFromPhotoResult(suitResult), activeStyleLens))
        else setAnalysisData(ANALYSIS)

        const outfitState = fullLookValidatorState(d, occasion)
        const validatorResult = validateOutfit(outfitState)
        setFullLookCorrection({
          suitColor: d.suit?.colorLabel || displayColorLabel(d.suit?.color) || "",
          suitPattern: d.suit?.patternLabel || d.suit?.pattern || "Solid",
        })
        setFullLookResult({ ...d, outfitState, validatorResult })
        setProgress(100)
        setTimeout(() => { setAnalyzing(false); setDone(true) }, 400)
        return
      } catch (err) {
        clearInterval(iv)
        setProgress(0)
        setAnalyzing(false)
        setKeyError(`Full Look analysis hit an unexpected error: ${err?.message || "please try another photo."}`)
        return
      }
    }

    // ── PHOTO MODE — vision with local fallback ──
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
      progressTimerRef.current = iv

      try {
      // Analyze suit photo — Claude Vision AI
      const visionResult = await analyzeOutfit(suitFile);
      if (visionResult.success && visionResult.data?.suit?.visible !== false && visionResult.data?.suit?.color) {
        const d = visionResult.data;
        const localSuitResult = await analyzeSuitLocally(suitPhoto)
        const correctedPhotoResult = reconcileDarkSuitPhotoRead({
          colorKey: d.suit.color,
          patternInfo: { pattern: d.suit.patternLabel, fabric: d.suit.fabric, formality: 'Business Formal' },
          fabricStr: d.suit.fabric,
          colorLabel: d.suit.colorLabel,
          colorHex: d.suit.colorHex,
          colorCorrectionNote: d.suit.colorCorrectionNote,
          confidence: d.suit.confidence,
          visionData: d,
          r: 26, g: 39, b: 78
        }, localSuitResult)
        const finalPhotoResult = localSuitResult?.localSuitDiagnostics ? {
          ...correctedPhotoResult,
          localSuitDiagnostics: correctedPhotoResult?.localSuitDiagnostics || localSuitResult.localSuitDiagnostics,
        } : correctedPhotoResult
        const analysis = getAnalysisFromPhotoResult(finalPhotoResult);
        setAnalysisData(applyStyleLensToAnalysis(analysis, activeStyleLens));
        setPhotoResult(finalPhotoResult);
        setIsDemo(false);
      } else {
        const suitResult = await analyzeSuitLocally(suitPhoto);
        if (suitResult) {
          const analysis = getAnalysisFromPhotoResult(suitResult);
          setAnalysisData(applyStyleLensToAnalysis(analysis, activeStyleLens));
          setPhotoResult(suitResult);
          setIsDemo(false);
        } else {
          // Both Claude vision and local fallback failed. Show a real error instead
          // of silently displaying the hardcoded ANALYSIS demo data.
          clearInterval(iv)
          setAnalyzing(false)
          setProgress(0)
          const apiErr = visionResult?.error ? ` (${visionResult.error})` : ""
          setKeyError(`Suit analysis could not read this photo${apiErr}. Try a tighter crop or a different JPG/PNG.`)
          return
        }
      }
      if (mode === "B" && shirtPhoto) {
        const shirtResult = await analyzePhotoLocally(shirtPhoto);
        if (shirtResult) setShirtPhotoResult(shirtResult);
      }

      clearInterval(iv)
      setProgress(100)
      setTimeout(() => { setAnalyzing(false); setDone(true) }, 400)
      return
      } catch (err) {
        clearInterval(iv)
        setProgress(0)
        setAnalyzing(false)
        setKeyError(`Suit analysis hit an unexpected error: ${err?.message || "please try another photo."}`)
        return
      }
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
    progressTimerRef.current = iv

    try {

      // Text mode: local engine first. API is reserved for vision / true edge cases.
      const desc = description.toLowerCase()
      const mentionsTie = /tie|corbata|necktie/.test(desc)
      const mentionsShirt = /shirt|camisa/.test(desc)
      const needsComboCheck = mentionsTie || mentionsShirt

      if (needsComboCheck) {
        const useApiParser = shouldUseApiForTextDescription(description)
        let resolvedDescription = description
        let apiAssessment = null

        if (useApiParser) {
          const parsedText = await analyzeText(description, activeStyleLens)
          if (parsedText?.success) {
            resolvedDescription = comboTextFromParsedDescription(parsedText, description)
            apiAssessment = parsedText.assessment || null
          } else {
            console.warn("[Dapper Text] API parser failed, falling back to local engine")
          }
        }

        const localCombo = applyStyleLensToCombo(getLocalComboAssessment(resolvedDescription), activeStyleLens)
        setAnalysisData(applyStyleLensToAnalysis(getLocalAnalysis(resolvedDescription), activeStyleLens))
        setIsDemo(false)
        setComboAssessment(localCombo ? { ...localCombo, assessment: apiAssessment || localCombo.assessment } : null)
      } else {
        // Suit only - use the expanded local matrix.
        const localResult = getLocalAnalysis(description)
        setAnalysisData(applyStyleLensToAnalysis(localResult, activeStyleLens))
        setComboAssessment(null)
        setIsDemo(false)
      }
    } catch(err) {
      setAnalysisData(applyStyleLensToAnalysis(getLocalAnalysis(description), activeStyleLens)); setIsDemo(true)
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
        <h1 className="text-3xl font-black text-gray-900 font-display">AI Suit Analyzer</h1>
        <p className="text-gray-500 text-sm mt-1">Upload a suit, describe a combination, or send the Fashion Police a full worn look.</p>
      </div>

      {!done ? (
        <>
          {/* Mode selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[{id:"A",label:"Suit Only",sub:"1 photo"},{id:"B",label:"Suit + Shirt",sub:"2 photos"},{id:"D",label:"Full Look",sub:"Fashion Police"},{id:"C",label:"Text Description",sub:"Describe it"}].map(m=>(
              <SelectableCard key={m.id} selected={mode===m.id} onClick={()=>setMode(m.id)}
                title={m.label} subtitle={m.sub} size="sm" />
            ))}
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
                  accept="image/*,.heic,.heif"
                  disabled={isPreparingUpload}
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
                    accept="image/*,.heic,.heif"
                    disabled={isPreparingUpload}
                    style={{display:"none"}}
                    onChange={e => handlePhotoSelect(e, setShirtPhoto)}
                  />
                </label>
              )}

            </div>
          )}

          {mode==="D" && (
            <div className="mb-6">
              <label htmlFor="full-look-upload" style={{display:"block",cursor:"pointer"}}>
                <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:border-yellow-400 hover:bg-yellow-50"
                  style={{borderColor: fullLookPhoto ? GOLD : "#e5e7eb", background: fullLookPhoto ? "#fffbeb" : "white"}}>
                  {fullLookPhoto ? (
                    <div className="relative">
                      {previewRenderFailed ? (
                        <div className="w-full py-10 rounded-xl mb-3 flex flex-col items-center justify-center gap-2"
                          style={{background:"#fffbeb", border:`1px dashed ${GOLD}`}}>
                          <Shield size={32} style={{color: GOLD}}/>
                          <div className="text-sm font-bold text-gray-700">
                            {fullLookFile?.name || "Photo loaded"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {fullLookFile?.size ? `${Math.round(fullLookFile.size/1024)} KB · ` : ""}
                            preview unavailable — photo will still be analyzed
                          </div>
                        </div>
                      ) : (
                        <img
                          src={fullLookPhoto}
                          alt="Full look"
                          className="w-full max-h-[420px] object-cover rounded-xl mb-3"
                          onError={() => setPreviewRenderFailed(true)}
                        />
                      )}
                      <div className="text-xs font-black text-yellow-700">Fashion Police photo ready</div>
                      <div className="text-xs text-gray-400 mt-1">Tap to change</div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-100">
                        <Shield size={26} className="text-gray-300"/>
                      </div>
                      <div className="font-black text-gray-800 text-sm mb-1">Full Look Photo</div>
                      <div className="text-xs text-gray-400 max-w-sm mx-auto">Upload yourself already dressed with the suit, shirt, tie, and pocket square. Dapper will read the outfit with AI and judge the whole combination.</div>
                      <div className="mt-3 text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-400 inline-block">Tap to take photo or upload</div>
                    </>
                  )}
                </div>
                <input
                  id="full-look-upload"
                  type="file"
                  accept="image/*,.heic,.heif"
                  disabled={isPreparingUpload}
                  style={{display:"none"}}
                  onChange={e => handlePhotoSelect(e, setFullLookPhoto)}
                />
              </label>
              <div className="text-xs text-gray-400 mt-2">Best results: full torso visible, natural light, tie and pocket square unobstructed.</div>
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

          {/* Refine panel — collapsible occasion + style lens */}
          <div className="mb-6 rounded-2xl border transition-all" style={{borderColor:refineOpen?"rgba(201,168,76,0.35)":"#e5e7eb", background:refineOpen?"#fffdf6":"white"}}>
            <button type="button" onClick={()=>setRefineOpen(v=>!v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-gray-700">REFINE</span>
                <span className="text-xs text-gray-400">(optional)</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"#fffbeb", color:"#92400e", border:`1px solid ${GOLD}`}}>
                  {occasion} · {selectedStyleLens.label}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-400">{refineOpen ? "−" : "+"}</span>
            </button>
            {refineOpen && (
              <div className="px-4 pb-4 space-y-5">
                <div>
                  <div className="text-[11px] font-black tracking-wider text-gray-400 mb-2">OCCASION <span className="text-gray-300 font-normal">— filters outfit packages</span></div>
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
                <div>
                  <div className="text-[11px] font-black tracking-wider text-gray-400 mb-2">STYLE LENS <span className="text-gray-300 font-normal">— how Dapper judges the look</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {STYLE_LENSES.map(lens=>(
                      <SelectableCard key={lens.id} selected={styleLens===lens.id} onClick={()=>setStyleLens(lens.id)}
                        title={lens.label} subtitle={lens.sub} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {preparingPhoto && <p className="text-xs text-blue-600 mb-3 px-1">{preparingPhoto}</p>}
          {keyError && <p className="text-xs text-red-400 mb-3 px-1">{keyError}</p>}

          {!analyzing ? (
            <button onClick={runAnalysis} disabled={isPreparingUpload || analyzing}
              className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98"
              style={{background:`linear-gradient(135deg,${NAVY} 0%,#1e3a5f 100%)`,opacity:isPreparingUpload?0.55:1}}>
              {isPreparingUpload
                ? <>Preparing Photo…</>
                : mode === "D"
                  ? <><Shield size={20}/> Fashion Police This Look</>
                  : <><Wand2 size={20}/> Analyze My Suit</>}
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
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:"#fffbeb",color:"#92400e",border:`1px solid ${GOLD}`}}>{selectedStyleLens.label}</span>
              {fullLookResult
                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:"#991b1b"}}>Fashion Police Review</span>
                : photoResult
                  ? <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:"#059669"}}>📷 Photo Analysis — Instant</span>
                : isDemo
                  ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">DEMO — add API key for real results</span>
                  : <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:GOLD}}>✦ AI Analysis</span>
              }
            </div>
            <button onClick={()=>{setDone(false);setShirtIdx(0);setTieIdx(null);setPkgIdx(null);setComboAssessment(null);setPhotoResult(null);setShirtPhotoResult(null);setFullLookResult(null);setSuitPhoto(null);setShirtPhoto(null);setFullLookPhoto(null);setSuitFile(null);setShirtFile(null);setFullLookFile(null);setCorrecting(false);setCorrection({color:'',pattern:'',fabric:''});setCorrectingShirt(false);setShirtCorrection({color:'',pattern:''});setCorrectingFullLook(false);setFullLookCorrection({suitColor:'',suitPattern:''})}} className="text-sm text-gray-400 hover:text-gray-600 underline">← New Analysis</button>
          </div>

          {/* FULL LOOK FASHION POLICE RESULT */}
          {fullLookResult && (() => {
            const fp = fullLookResult.fashionPolice || {}
            const local = fullLookResult.validatorResult || {}
            const score = fp.score ?? local.overallScore ?? 0
            const verdict = fp.score == null ? (local.verdict || fp.verdict || "Fashion Police Review") : (fp.verdict || local.verdict || "Fashion Police Review")
            const verdictColor = local.verdictColor || (score >= 9 ? "#166534" : score >= 7 ? "#1d4ed8" : score >= 5 ? "#92400e" : "#991b1b")
            const strengths = fp.strengths?.length ? fp.strengths : (local.compliments || [])
            const recommendations = fp.recommendations?.length
              ? fp.recommendations
              : [...(local.issues || []), ...(local.warnings || [])].map(item => item.fix || item.message).filter(Boolean)
            const priorityFix = fp.priorityFix && fp.priorityFix !== "null" ? fp.priorityFix : null
            const rows = [
              ["Suit", fullLookResult.outfitState?.suit],
              ["Shirt", fullLookResult.outfitState?.shirt],
              ["Tie", fullLookResult.outfitState?.tie || "No tie detected"],
              ["Pocket Square", fullLookResult.outfitState?.pocketSquare || "Not visible"],
              ["Shoes", fullLookResult.outfitState?.shoes || "Not visible"],
              ["Belt", fullLookResult.outfitState?.belt || "Not visible"],
            ]
            const detectedSuitColor = fullLookResult.suit?.colorLabel || displayColorLabel(fullLookResult.suit?.color) || "Unknown"
            const detectedSuitPattern = fullLookResult.suit?.patternLabel || fullLookResult.suit?.pattern || "Solid"
            return (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                  {fullLookPhoto && <img src={fullLookPhoto} alt="Full outfit" className="w-full max-h-[520px] object-cover"/>}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="text-xs font-black tracking-widest text-gray-400 mb-1">FASHION POLICE</div>
                        <h3 className="text-2xl font-black" style={{color:verdictColor}}>{verdict}</h3>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{fp.assessment || local.issues?.[0]?.message || "Dapper reviewed the visible outfit elements."}</p>
                      </div>
                      <div className="text-center rounded-2xl px-4 py-3 flex-shrink-0" style={{background:"#f8fafc",border:"1px solid #e5e7eb"}}>
                        <div className="text-3xl font-black" style={{color:verdictColor}}>{score}</div>
                        <div className="text-xs font-black text-gray-400">/10</div>
                      </div>
                    </div>

	                    <div className="grid grid-cols-2 gap-2 mb-4">
	                      {rows.map(([label, value]) => (
	                        <div key={label} className="rounded-xl p-3" style={{background:value && !/not visible|no tie detected/i.test(value) ? "#f1f5f9" : "#f8fafc",border:"1px solid #e5e7eb"}}>
	                          <div className="text-xs font-black tracking-wider text-gray-400">{label.toUpperCase()}</div>
	                          <div className="text-xs font-semibold text-gray-700 mt-1">{value || "Not visible"}</div>
	                        </div>
	                      ))}
	                    </div>

	                    <div className="rounded-xl p-4 mb-4" style={{background:"#f8fafc",border:"1px solid #e5e7eb"}}>
	                      <div className="flex items-start justify-between gap-3">
	                        <div>
	                          <div className="text-xs font-black tracking-wider text-gray-400 mb-1">SUIT COLOR CHECK</div>
	                          <div className="text-sm font-bold text-gray-900">{detectedSuitColor} · {detectedSuitPattern}</div>
	                          {fullLookResult.suit?.colorCorrectionNote && (
	                            <div className="text-xs text-yellow-700 mt-1">{fullLookResult.suit.colorCorrectionNote}</div>
	                          )}
	                        </div>
	                        <button onClick={()=>{setCorrectingFullLook(true);setFullLookCorrection({suitColor:detectedSuitColor,suitPattern:detectedSuitPattern})}}
	                          className="px-3 py-1.5 rounded-lg text-xs font-black border-2 flex-shrink-0"
	                          style={{borderColor:GOLD,color:"#92400e",background:"#fffbeb"}}>
	                          Correct Suit
	                        </button>
	                      </div>
	                      {correctingFullLook && (
	                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
	                          <div>
	                            <div className="text-xs font-black text-gray-500 mb-2">COLOR</div>
	                            <div className="flex flex-wrap gap-1.5">
	                              {FULL_LOOK_SUIT_COLOR_OPTIONS.map(c=>(
	                                <button key={c} onClick={()=>setFullLookCorrection(p=>({...p,suitColor:c}))}
	                                  className="px-2 py-1 rounded-full text-xs font-bold border transition-all"
	                                  style={fullLookCorrection.suitColor===c?{borderColor:GOLD,background:"#fffbeb",color:"#92400e"}:{borderColor:"#e5e7eb",color:"#6b7280",background:"white"}}>
	                                  {c}
	                                </button>
	                              ))}
	                            </div>
	                          </div>
	                          <div>
	                            <div className="text-xs font-black text-gray-500 mb-2">PATTERN</div>
	                            <div className="flex flex-wrap gap-1.5">
	                              {["Solid","Chalk Stripe","Pin Stripe","Glen Plaid","Herringbone","Tweed","Houndstooth","Linen"].map(p=>(
	                                <button key={p} onClick={()=>setFullLookCorrection(v=>({...v,suitPattern:p}))}
	                                  className="px-2 py-1 rounded-full text-xs font-bold border transition-all"
	                                  style={fullLookCorrection.suitPattern===p?{borderColor:GOLD,background:"#fffbeb",color:"#92400e"}:{borderColor:"#e5e7eb",color:"#6b7280",background:"white"}}>
	                                  {p}
	                                </button>
	                              ))}
	                            </div>
	                          </div>
	                          <div className="flex gap-2">
	                            <button onClick={()=>{
	                              const colorKey = fullLookColorKeyFromLabel(fullLookCorrection.suitColor, fullLookResult.suit?.color)
	                              const patternLabel = fullLookCorrection.suitPattern || detectedSuitPattern
	                              const next = {
	                                ...fullLookResult,
	                                suit: {
	                                  ...fullLookResult.suit,
	                                  color: colorKey,
	                                  colorLabel: fullLookCorrection.suitColor || displayColorLabel(colorKey),
	                                  pattern: validatorPatternKeyFromLabel(patternLabel),
	                                  patternLabel,
	                                  confidence: 1,
	                                  colorCorrectionNote: "Manually corrected by user.",
	                                },
	                                fashionPolice: {
	                                  ...(fullLookResult.fashionPolice || {}),
	                                  score: null,
	                                  verdict: "Corrected Fashion Police Review",
	                                  assessment: `Rechecked using corrected suit color: ${fullLookCorrection.suitColor || displayColorLabel(colorKey)}.`,
	                                  strengths: [],
	                                  recommendations: [],
	                                  priorityFix: null,
	                                },
	                              }
	                              const suitResult = fullLookSuitPhotoResult(next)
	                              if (suitResult) setAnalysisData(applyStyleLensToAnalysis(getAnalysisFromPhotoResult(suitResult), selectedStyleLens))
	                              const outfitState = fullLookValidatorState(next, occasion)
	                              const validatorResult = validateOutfit(outfitState)
	                              setFullLookResult({ ...next, outfitState, validatorResult })
	                              setCorrectingFullLook(false)
	                            }}
	                              className="flex-1 py-2 rounded-xl text-xs font-black tracking-wider transition-all"
	                              style={{background:GOLD,color:NAVY}}>
	                              Apply Correction
	                            </button>
	                            <button onClick={()=>setCorrectingFullLook(false)}
	                              className="px-4 py-2 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500">
	                              Cancel
	                            </button>
	                          </div>
	                        </div>
	                      )}
	                    </div>

	                    {strengths.length > 0 && (
                      <div className="rounded-xl p-4 mb-3" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
                        <div className="text-xs font-black tracking-wider text-green-700 mb-2">WHAT WORKS</div>
                        <ul className="space-y-1 text-sm text-green-800">
                          {strengths.slice(0,3).map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {(recommendations.length > 0 || priorityFix) && (
                      <div className="rounded-xl p-4" style={{background:"#fffbeb",border:"1px solid " + GOLD}}>
                        <div className="text-xs font-black tracking-wider text-yellow-700 mb-2">HOW TO IMPROVE IT</div>
                        {priorityFix && <p className="text-sm font-bold text-yellow-900 mb-2">Priority: {priorityFix}</p>}
                        <ul className="space-y-1 text-sm text-yellow-900">
                          {recommendations.slice(0,4).map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-400">
                      AI read: {fullLookResult.imageQuality || "unknown"} image, {fullLookResult.lighting || "unknown"} lighting. {fullLookResult.notes || ""}
                    </div>
                    {showAnalyzerDebug && fullLookResult.suit?.localSuitDiagnostics && (
                      <div className="mt-4">
                        <LocalSuitDebugCard diagnostics={fullLookResult.suit.localSuitDiagnostics} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

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
                    {(mode === "D" ? (fullLookPhoto || suitPhoto) : suitPhoto)
                      ? <img src={(mode === "D" ? (fullLookPhoto || suitPhoto) : suitPhoto)} alt="suit" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full" style={{background:`rgb(${photoResult.r},${photoResult.g},${photoResult.b})`}}/>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black tracking-wider text-green-700 mb-1">🎽 SUIT DETECTED</div>
                    {!correcting ? (
                      <>
                        <div className="text-sm font-bold text-gray-900">{photoResult.colorLabel || COLOR_FAMILY_LABELS[photoResult.colorKey]} · {photoResult.patternInfo.pattern}</div>
                        <div className="text-xs text-gray-500 mb-2">{photoResult.fabricStr} · {photoResult.patternInfo.formality}</div>
                        {photoResult.colorCorrectionNote && (
                          <div className="text-xs text-yellow-700 mb-2">{photoResult.colorCorrectionNote}</div>
                        )}
                        <button onClick={()=>{ setCorrecting(true); setCorrection({ color:COLOR_FAMILY_LABELS[photoResult.colorKey], pattern:photoResult.patternInfo.pattern, fabric:photoResult.fabricStr }) }}
                          className="text-xs px-3 py-1.5 rounded-lg font-bold border-2 transition-all"
                          style={{borderColor:GOLD,color:"#92400e",background:"#fffbeb"}}>
                          ✏️ Correct Detection
                        </button>
                        {showAnalyzerDebug && photoResult.localSuitDiagnostics && (
                          <div className="mt-3">
                            <LocalSuitDebugCard diagnostics={photoResult.localSuitDiagnostics} />
                          </div>
                        )}
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
                            const colorMap = {
                              // Whites & creams
                              "White":"white","Oyster White":"white","Off-White":"white",
                              "Ivory":"white","Ivory White":"white",
                              "Cream":"cream","Cream White":"cream",
                              "Ecru":"ecru","Parchment":"ecru","Sand":"ecru",
                              "Champagne":"champagne","Champagne Gold":"champagne",
                              // Blues — light
                              "Light Blue":"lightblue","Sky Blue":"lightblue","Powder Blue":"lightblue",
                              "Baby Blue":"lightblue","Pale Blue":"lightblue","Cornflower Blue":"lightblue",
                              "Dusty Blue":"lightblue","Soft Blue":"lightblue",
                              // Blues — mid
                              "Blue":"blue","French Blue":"blue","Royal Blue":"blue",
                              "Bright Blue":"blue","Electric Blue":"blue",
                              "Cobalt":"cobalt","Cobalt Blue":"cobalt",
                              "Periwinkle":"blue","Steel Blue":"slate",
                              // Blues — dark
                              "Navy":"navy","Navy Blue":"navy","Midnight Navy":"navy",
                              "Midnight Blue":"midnight","Midnight":"midnight",
                              "Indigo":"navy","Dark Blue":"navy",
                              // Greys
                              "Light Grey":"grey","Silver":"grey","Pale Grey":"grey",
                              "Grey":"grey","Medium Grey":"grey","Gray":"grey",
                              "Dove Grey":"dovegrey","Dove Gray":"dovegrey","Dove":"dovegrey",
                              "Slate":"slate","Slate Grey":"slate","Slate Blue":"slate",
                              "Charcoal":"charcoal","Charcoal Grey":"charcoal","Dark Grey":"charcoal","Anthracite":"charcoal",
                              "Gunmetal":"gunmetal","Gunmetal Grey":"gunmetal","Pewter":"pewter",
                              // Black
                              "Black":"black","Jet Black":"black","Onyx":"black","Ebony":"black",
                              // Browns — light/warm
                              "Beige":"beige","Sand Beige":"beige","Khaki":"beige","Taupe":"taupe",
                              "Wheat":"wheat","Straw":"wheat","Golden Wheat":"wheat",
                              "Fawn":"fawn","Buff":"fawn","Pale Tan":"fawn",
                              "Tan":"tan","Tan Beige":"tan","Khaki Tan":"tan",
                              "Camel":"camel","Camel Tan":"camel","Warm Camel":"camel",
                              "Caramel":"caramel","Caramel Brown":"caramel","Warm Caramel":"caramel",
                              // Browns — mid/dark
                              "Brown":"brown","Medium Brown":"brown","Walnut":"brown",
                              "Chocolate":"chocolate","Chocolate Brown":"chocolate","Dark Chocolate":"chocolate","Espresso":"chocolate",
                              "Copper":"copper","Copper Brown":"copper","Burnt Orange":"copper",
                              // Greens
                              "Green":"green","Bright Green":"green","Emerald":"green",
                              "Olive":"olive","Olive Green":"olive","Army Green":"olive","Military Green":"olive",
                              "Forest Green":"forestgreen","Dark Green":"forestgreen","Hunter Green":"forestgreen","Bottle Green":"bottle","Bottle":"bottle","Racing Green":"bottle",
                              "Sage":"sage","Sage Green":"sage","Muted Green":"sage","Soft Green":"sage",
                              "Moss":"moss","Moss Green":"moss","Deep Moss":"moss",
                              "Jade":"jade","Jade Green":"jade",
                              "Teal":"teal","Petrol":"teal","Teal Blue":"teal",
                              // Reds & pinks
                              "Red":"red","Bright Red":"red","Vivid Red":"red",
                              "Scarlet":"scarlet","Crimson":"scarlet","Fire Red":"scarlet","Vermillion":"scarlet",
                              "Burgundy":"burgundy","Wine":"wine","Claret":"burgundy","Dark Red":"burgundy",
                              "Oxblood":"oxblood","Deep Burgundy":"oxblood",
                              "Rust":"rust","Rust Orange":"rust","Burnt Sienna":"rust","Terracotta":"terracotta","Clay":"terracotta",
                              "Coral":"coral","Salmon":"coral","Coral Pink":"coral",
                              // Pinks & blush
                              "Pink":"pink","Rose Pink":"pink","Dusty Pink":"blush",
                              "Blush":"blush","Blush Pink":"blush","Pale Pink":"blush","Soft Pink":"blush",
                              // Purples
                              "Purple":"purple","Violet":"purple","Bright Purple":"purple",
                              "Lavender":"lavender","Pale Purple":"lavender","Soft Lavender":"lavender",
                              "Plum":"aubergine","Aubergine":"aubergine","Eggplant":"aubergine","Deep Purple":"aubergine",
                              // Yellows & mustards
                              "Mustard":"mustard","Gold":"mustard","Golden":"mustard","Mustard Yellow":"mustard",
                              "Yellow":"mustard",
                            }
                            const patMap = {"Solid":"solid","Chalk Stripe / Pinstripe":"chalk_stripe","Glen Plaid / Check":"glen_plaid","Herringbone":"herringbone","Tweed":"tweed","Houndstooth":"houndstooth","Linen":"linen"}
                            const colorKey  = colorMap[correction.color] || photoResult.colorKey
                            const patternKey = patMap[correction.pattern] || "solid"
                            const patternInfo = { pattern: correction.pattern, fabric: correction.fabric || photoResult.fabricStr, formality: photoResult.patternInfo.formality }
                            const newResult = { ...photoResult, colorKey, colorLabel: correction.color, patternInfo, fabricStr: correction.fabric || photoResult.fabricStr }
                            const analysis = getAnalysisFromPhotoResult(newResult)
                            if (!analysis) { console.error('[Dapper Correct] getAnalysisFromPhotoResult returned null'); return; }
                            setAnalysisData(applyStyleLensToAnalysis(analysis, selectedStyleLens))
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
                              const shirtColorMap = {
                                "White": "white",
                                "Pale Blue": "lightblue",
                                "French Blue": "blue",
                                "Light Pink": "blush",
                                "Light Grey": "light_grey",
                                "Cream": "cream",
                                "Yellow": "mustard",
                                "Pale Green": "sage",
                                "Oxford White": "white",
                              }
                              const newShirtResult = {
                                ...shirtPhotoResult,
                                colorKey: shirtColorMap[shirtCorrection.color] || shirtPhotoResult.colorKey,
                                patternInfo: { ...shirtPhotoResult.patternInfo, pattern: shirtCorrection.pattern || shirtPhotoResult.patternInfo.pattern },
                                fabricStr: shirtPhotoResult.fabricStr,
                                correctedColor: shirtCorrection.color || (COLOR_FAMILY_LABELS[shirtPhotoResult.colorKey] || ""),
                                correctedPattern: shirtCorrection.pattern || shirtPhotoResult.patternInfo.pattern,
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
                          { label:"BEST TIES", items: getBestTiesForCombo(suitPat, shirtPat, analysisData?.suit?.colorFamily) },
                          { label:"POCKET SQUARE", items: getBestPSForShirt(shirtColor) },
                          { label:"SHOES", items: getBestShoesForSuit(analysisData?.suit?.colorFamily) },
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

function isImageFileLike(file) {
  return Boolean(file && (file.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || "")))
}

function isObjectUrl(value) {
  return typeof value === "string" && value.startsWith("blob:")
}

function releaseObjectUrl(value) {
  if (isObjectUrl(value)) URL.revokeObjectURL(value)
}

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read this image."))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error("Could not load this image."))
    image.onload = () => resolve(image)
    image.src = src
  })
}

async function decodeImageBitmap(file) {
  if (typeof createImageBitmap !== "function") throw new Error("createImageBitmap is not available.")
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return createImageBitmap(file)
  }
}

function drawInlinePhoto(image, width, height, { maxSide, quality, maxLength }) {
  if (!width || !height) throw new Error("Could not read this image size.")
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not prepare this image.")
  ctx.drawImage(image, 0, 0, w, h)
  let workingCanvas = canvas
  let workingQuality = quality
  const minQuality = 0.28
  const minSide = 220

  for (let attempt = 0; attempt < 12; attempt++) {
    const dataUrl = workingCanvas.toDataURL("image/jpeg", workingQuality)
    if (dataUrl.length <= maxLength) return dataUrl

    if (workingQuality > minQuality + 0.04) {
      workingQuality = Math.max(minQuality, workingQuality - 0.08)
      continue
    }

    if (Math.max(workingCanvas.width, workingCanvas.height) <= minSide) break

    const nextCanvas = document.createElement("canvas")
    nextCanvas.width = Math.max(1, Math.round(workingCanvas.width * 0.76))
    nextCanvas.height = Math.max(1, Math.round(workingCanvas.height * 0.76))
    const nextCtx = nextCanvas.getContext("2d")
    if (!nextCtx) break
    nextCtx.drawImage(workingCanvas, 0, 0, nextCanvas.width, nextCanvas.height)
    workingCanvas = nextCanvas
  }

  const finalDataUrl = workingCanvas.toDataURL("image/jpeg", Math.max(minQuality, workingQuality))
  if (finalDataUrl.length > maxLength) throw new Error("This photo is too large. Try a tighter crop or a screenshot of just the suit.")
  return finalDataUrl
}

async function resizeInlinePhoto(file, { maxSide = 900, quality = 0.76, maxLength = 680000 } = {}) {
  if (!isImageFileLike(file)) throw new Error("Please choose an image file.")

  const compatibleFile = await ensureBrowserImageFile(file)
  const options = { maxSide, quality, maxLength }
  const objectUrl = URL.createObjectURL(compatibleFile)
  const decodeAttempts = []
  try {
    const img = await loadImageFromSrc(objectUrl)
    return drawInlinePhoto(img, img.width, img.height, options)
  } catch (imgErr) {
    decodeAttempts.push(imgErr)
    try {
      const bitmap = await decodeImageBitmap(compatibleFile)
      try {
        return drawInlinePhoto(bitmap, bitmap.width, bitmap.height, options)
      } finally {
        bitmap.close?.()
      }
    } catch (bitmapErr) {
      decodeAttempts.push(bitmapErr)
    }
    const dataUrl = await readFileDataUrl(compatibleFile)
    const looksLikeHeic = /\.(heic|heif)$/i.test(compatibleFile.name || "") || /heic|heif/i.test(compatibleFile.type || "")
    if (looksLikeHeic) throw new Error("This looks like a HEIC/HEIF photo. Please export it as JPG or PNG and try again.")
    try {
      const dataUrlImage = await loadImageFromSrc(dataUrl)
      return drawInlinePhoto(dataUrlImage, dataUrlImage.width, dataUrlImage.height, options)
    } catch (dataUrlErr) {
      decodeAttempts.push(dataUrlErr)
    }
    if (dataUrl.length <= maxLength) return dataUrl
    throw decodeAttempts[decodeAttempts.length - 1] || new Error("Could not prepare this image.")
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const CLOSET_FORM_INIT = { type:"Suit", name:"", brand:"", color:"#1B3A6B", photo:null, photoName:"", photoError:"" }

// ─────────────────────────────────────────────
// PAGE: CLOSET
// ─────────────────────────────────────────────

function ClosetPage({ closetItems, setClosetItems, addClosetItem, user, onAuthClick, closetSaving, closetError }) {
  const [filter,  setFilter]  = useState("All")
  const items = closetItems || CLOSET_ITEMS_INIT
  const setItems = setClosetItems || (() => {})
  const [modal,   setModal]   = useState(false)
  const [selected,setSelected]= useState(null)
  const [form,    setForm]    = useState(CLOSET_FORM_INIT)
  const [saveError, setSaveError] = useState("")

  const TYPES = ["All","Suit","Shirt","Tie","Shoes","Accessory"]
  const shown  = filter==="All" ? items : items.filter(i=>i.type===filter)
  const counts = TYPES.reduce((a,t)=>({...a,[t]:t==="All"?items.length:items.filter(i=>i.type===t).length}),{})

  const resetClosetForm = () => setForm(CLOSET_FORM_INIT)
  const openClosetModal = () => {
    setSaveError("")
    resetClosetForm()
    setModal(true)
  }

  const handleClosetPhotoSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setForm(p => ({ ...p, photoError:"" }))
    try {
      const photo = await resizeInlinePhoto(file, { maxSide:720, quality:0.72, maxLength:460000 })
      setForm(p => ({ ...p, photo, photoName:file.name, photoError:"" }))
    } catch (err) {
      setForm(p => ({ ...p, photo:null, photoName:"", photoError:err.message || "Could not add this photo." }))
    }
  }

  const save = async () => {
    if(!form.name.trim()) return
    const { photoError, ...itemForm } = form
    const item = {...itemForm,id:`closet-${Date.now()}`,occasions:[]}
    setSaveError("")
    try {
      if (addClosetItem) await addClosetItem(item)
      else setItems(p=>[...p,item])
      setModal(false); resetClosetForm()
    } catch (err) {
      console.error("[Dapper] Closet save failed", err)
      setSaveError("Could not save this garment. Check your connection and try again.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display">My Closet</h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} garments · {items.filter(i=>i.type==="Suit").length} suits</p>
        </div>
        <button onClick={openClosetModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{background:NAVY}}>
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
      {user === null && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between gap-3" style={{background:"#eff6ff",border:"1px solid #bfdbfe"}}>
          <div className="text-sm text-blue-900">
            <strong>Guest mode:</strong> closet changes are saved on this browser only. Sign in to sync them with Firebase.
          </div>
          <button onClick={onAuthClick} className="px-3 py-2 rounded-xl text-xs font-black text-white whitespace-nowrap" style={{background:NAVY}}>
            Sign in
          </button>
        </div>
      )}

      {(closetError || saveError) && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700" style={{background:"#fef2f2",border:"1px solid #fecaca"}}>
          {saveError || closetError}
        </div>
      )}

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
            <div className="w-full h-20 rounded-xl mb-3 flex items-center justify-center overflow-hidden" style={{background:item.color+"22"}}>
              {item.photo
                ? <img src={item.photo} alt={item.name} className="w-full h-full object-cover"/>
                : <div className="w-10 h-10 rounded-full shadow-inner" style={{background:item.color}}/>}
            </div>
            <div className="text-xs font-black tracking-wider text-gray-400 mb-0.5">{item.type.toUpperCase()}</div>
            <div className="text-sm font-bold text-gray-800 leading-tight">{item.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.brand}</div>
          </button>
        ))}
        <button onClick={openClosetModal} className="p-4 rounded-2xl border-2 border-dashed text-center hover:border-gray-300 transition-all" style={{borderColor:"#e5e7eb"}}>
          <div className="h-20 flex items-center justify-center"><Plus size={22} className="text-gray-200"/></div>
          <div className="text-sm text-gray-300">Add item</div>
        </button>
      </div>

      {/* Selected detail */}
      {selected && (
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{background:selected.color+"22"}}>
              {selected.photo
                ? <img src={selected.photo} alt={selected.name} className="w-full h-full object-cover"/>
                : <div className="w-8 h-8 rounded-full" style={{background:selected.color}}/>}
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-gray-400">{selected.type.toUpperCase()}</div>
              <h3 className="text-xl font-black text-gray-900">{selected.name}</h3>
              <div className="text-sm text-gray-500">{selected.brand}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(selected.occasions || []).map(o=><span key={o} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{o}</span>)}
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
              <button onClick={()=>{ setModal(false); resetClosetForm() }}><X size={20} className="text-gray-300"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Photo</Label>
                {form.photo ? (
                  <div className="mt-1 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                    <img src={form.photo} alt="Garment preview" className="w-full h-44 object-cover"/>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="text-xs font-bold text-gray-500 truncate">{form.photoName || "Garment photo"}</div>
                      <button onClick={()=>setForm(p=>({...p,photo:null,photoName:"",photoError:""}))}
                        className="flex items-center gap-1.5 text-xs font-black text-red-500">
                        <X size={13}/> Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm font-black text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                    <Camera size={17}/>
                    Add Garment Photo
                    <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleClosetPhotoSelect}/>
                  </label>
                )}
                {form.photoError && <div className="mt-2 rounded-xl bg-red-50 text-red-600 text-xs p-3">{form.photoError}</div>}
              </div>
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
                <button onClick={()=>{ setModal(false); resetClosetForm() }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                <button onClick={save} disabled={!form.name.trim() || closetSaving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all" style={{background:NAVY}}>
                  {closetSaving ? "Saving..." : "Add to Closet"}
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

function todayKey(date = new Date()) { return fmtDate(date.getFullYear(), date.getMonth(), date.getDate()) }
const TODAY = todayKey()

function daysAgo(dateStr) {
  const diff = Math.floor((new Date(TODAY) - new Date(dateStr)) / 86400000)
  if(diff === 0) return "today"
  if(diff === 1) return "yesterday"
  if(diff < 7)  return `${diff} days ago`
  if(diff < 14) return "1 week ago"
  if(diff < 30) return `${Math.floor(diff/7)} weeks ago`
  const months = Math.floor(diff/30)
  return `${months} month${months>1?"s":""} ago`
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
  const [photoError, setPhotoError] = useState("")

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  // ── Photo handling ──
  const loadPhoto = async (file) => {
    if(!file) return
    setPhotoError("")
    try {
      const photo = await resizeInlinePhoto(file, { maxSide:900, quality:0.76, maxLength:680000 })
      set("photo", photo)
    } catch (err) {
      set("photo", null)
      setPhotoError(err.message || "Could not add this photo.")
    }
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
      .filter(e=>(e.suit||"").toLowerCase().includes(form.suit.toLowerCase()) && e.date>=cutoffStr && e.date!==form.date)
      .sort((a,b)=>b.date.localeCompare(a.date))
    return recent.length>0 ? recent[0] : null
  })()

  // ── Exact combo check ──
  const exactRepeat = (() => {
    if(!form.suit.trim()||!form.shirt.trim()) return null
    return wornLog.find(e=>
      (e.suit||"").toLowerCase().includes(form.suit.toLowerCase()) &&
      (e.shirt||"").toLowerCase().includes(form.shirt.toLowerCase()) &&
      (form.tie ? (e.tie||"").toLowerCase().includes(form.tie.toLowerCase()) : true) &&
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
            <Label>Outfit Photo <span className="font-normal text-gray-400 normal-case">(optional)</span></Label>
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
                    Change
                    <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handlePhotoInput}/>
                  </label>
                  <button onClick={()=>{set("photo",null);setPhotoError("")}}
                    className="w-7 h-7 rounded-xl flex items-center justify-center" style={{background:"rgba(0,0,0,0.5)"}}>
                    <X size={14} color="white"/>
                  </button>
                </div>
                {/* Done check */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-black" style={{background:GOLD,color:NAVY}}>
                  <Check size={11}/> Photo ready
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
                <div className="text-xs text-gray-200 mt-1">JPG, PNG, WEBP · HEIC when supported</div>
                <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handlePhotoInput}/>
              </label>
            )}
            {photoError && <div className="mt-2 rounded-xl bg-red-50 text-red-600 text-xs p-3">{photoError}</div>}
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
              list="suits-list" placeholder="e.g. Navy Chalk Stripe"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="suits-list">{SUITS.map(s=><option key={s} value={s}/>)}</datalist>

            {exactRepeat && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-xl text-xs" style={{background:"#fef2f2",border:"1px solid #fecaca"}}>
                <span className="text-base leading-none">🔁</span>
                <div>
                  <strong className="text-red-700">Repeated combination</strong>
                  <p className="text-red-600 mt-0.5">You wore this exact look <strong>{daysAgo(exactRepeat.date)}</strong>{exactRepeat.occasion?` for "${exactRepeat.occasion}"`:""}.</p>
                </div>
              </div>
            )}
            {!exactRepeat && repeatWarning && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-xl text-xs" style={{background:"#fffbeb",border:"1px solid #fde68a"}}>
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <strong className="text-yellow-800">Suit worn recently</strong>
                  <p className="text-yellow-700 mt-0.5">You wore <strong>{repeatWarning.suit}</strong> <strong>{daysAgo(repeatWarning.date)}</strong>{repeatWarning.occasion?` (${repeatWarning.occasion})`:""}.{" "}Change the shirt or tie for a distinct look.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── SHIRT ── */}
          <div>
            <Label>Shirt</Label>
            <input value={form.shirt} onChange={e=>set("shirt",e.target.value)}
              list="shirts-list" placeholder="e.g. Crisp White Poplin"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="shirts-list">{SHIRTS.map(s=><option key={s} value={s}/>)}</datalist>
          </div>

          {/* ── TIE ── */}
          <div>
            <Label>Tie <span className="font-normal text-gray-400 normal-case">(or '—' if none)</span></Label>
            <input value={form.tie} onChange={e=>set("tie",e.target.value)}
              list="ties-list" placeholder="e.g. Burgundy Grenadine"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="ties-list">{TIES.map(t=><option key={t} value={t}/>)}</datalist>
          </div>

          {/* ── SHOES ── */}
          <div>
            <Label>Shoes <span className="font-normal text-gray-400 normal-case">(optional)</span></Label>
            <input value={form.shoes} onChange={e=>set("shoes",e.target.value)}
              list="shoes-list" placeholder="e.g. Black Cap-Toe Oxford"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="shoes-list">{SHOES_LIST.map(s=><option key={s} value={s}/>)}</datalist>
          </div>

          {/* ── ACCESSORIES ── */}
          <div>
            <Label>Accessories <span className="font-normal text-gray-400 normal-case">(optional)</span></Label>
            <input value={form.accessories} onChange={e=>set("accessories",e.target.value)}
              list="accessories-list" placeholder="e.g. White Linen Square, Silver Watch"
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
            <datalist id="accessories-list">{ACCESSORIES_LIST.map(a=><option key={a} value={a}/>)}</datalist>
          </div>

          {/* ── OCCASION ── */}
          <div>
            <Label>Occasion</Label>
            <input value={form.occasion} onChange={e=>set("occasion",e.target.value)}
              placeholder="e.g. Board Meeting, dinner, interview..."
              className="w-full mt-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{borderColor:"#f1f5f9"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="#f1f5f9"}/>
          </div>

          {/* ── NOTES ── */}
          <div>
            <Label>Notes <span className="font-normal text-gray-400 normal-case">(optional)</span></Label>
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
  const initialDate = new Date()
  const [tab,        setTab]      = useState("calendar")
  const [date,       setDate]     = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const [selDay,     setSelDay]   = useState(() => initialDate.getDate())
  const [showLog,    setShowLog]  = useState(false)
  const [logDate,    setLogDate]  = useState(TODAY)
  const [filterSuit, setFilterSuit] = useState("All")
  const [planning,   setPlanning] = useState(false)
  const [planForm,   setPlanForm] = useState({ occasion:"Office", outfit:"" })

  // ── Firestore-backed data ──
  const { wornLog, saveEntry }           = useWornLog(user, WORN_LOG_INIT)
  const { events, saveEvent: saveEvtFn, deleteEvent } = useCalendarEvents(user, CALENDAR_EVENTS_INIT)

  const y = date.getFullYear(), m = date.getMonth()
  const totalDays = daysInMonth(y,m), firstDay = firstDayOf(y,m)
  const selectedKey = selDay ? fmtDate(y,m,selDay) : null
  const selectedEvt = selectedKey ? events[selectedKey] : null
  const wornOnSelected = selectedKey ? wornLog.find(e=>e.date===selectedKey) : null

  const saveEvent = (k, occ, outfit) => {
    saveEvtFn(k, occ, outfit)
  }

  const submitPlan = () => {
    if (!selectedKey || !planForm.outfit.trim()) return
    saveEvent(selectedKey, planForm.occasion, planForm.outfit.trim())
    setPlanning(false)
    setPlanForm({ occasion:"Office", outfit:"" })
  }

  // Close the inline plan editor when the selected day changes.
  useEffect(() => { setPlanning(false); setPlanForm({ occasion:"Office", outfit:"" }) }, [selectedKey])

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
  const allSuits = ["All", ...new Set(wornLog.map(e=>e.suit))]
  const filteredLog = filterSuit==="All" ? wornLog : wornLog.filter(e=>e.suit===filterSuit)

  // Stats
  const last30 = wornLog.filter(e=>e.date>=new Date(new Date(TODAY)-30*86400000).toISOString().split("T")[0])
  const suitCounts = last30.reduce((acc,e)=>{acc[e.suit]=(acc[e.suit]||0)+1;return acc},{})
  const topSuit = Object.entries(suitCounts).sort((a,b)=>b[1]-a[1])[0]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display">Outfit Calendar</h1>
          <p className="text-gray-400 text-sm mt-0.5">{wornLog.length} logged looks</p>
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
        {[{id:"calendar",label:"📅 Calendar"},{id:"log",label:"📖 History"}].map(t=>(
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
                <div className="w-2 h-2 rounded-full" style={{background:GOLD}}/> Logged look
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-gray-300"/> Planned
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
                        <span className="text-xs font-black" style={{color:GOLD}}>LOGGED</span>
                      </div>
                      {!wornOnSelected.photo && <div className="text-xs font-bold text-gray-800">{wornOnSelected.suit}</div>}
                      <div className="text-xs text-gray-500 mt-0.5">{wornOnSelected.shirt}{wornOnSelected.tie&&wornOnSelected.tie!=="—"?` · ${wornOnSelected.tie}`:""}{wornOnSelected.shoes?` · 👞 ${wornOnSelected.shoes}`:""}{wornOnSelected.accessories?` · ✦ ${wornOnSelected.accessories}`:""}</div>
                      {wornOnSelected.occasion && <div className="text-xs text-gray-400 mt-0.5">📅 {wornOnSelected.occasion}</div>}
                      {wornOnSelected.notes && <div className="text-xs text-gray-400 italic mt-1">"{wornOnSelected.notes}"</div>}
                    </div>
                  </div>
                )}
                {/* Planned entry */}
                {selectedEvt && !planning && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                        <span className="text-xs font-bold text-gray-400">PLANNED{selectedEvt.occasion?` · ${selectedEvt.occasion}`:""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>{setPlanForm({occasion:selectedEvt.occasion||"Office",outfit:selectedEvt.outfit||""});setPlanning(true)}}
                          className="text-xs font-bold text-gray-400 hover:text-gray-600">Edit</button>
                        <button onClick={()=>deleteEvent(selectedKey)}
                          className="text-xs font-bold text-red-300 hover:text-red-500">Clear</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">{selectedEvt.outfit}</div>
                  </div>
                )}

                {/* Inline plan editor */}
                {planning ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                      <span className="text-xs font-bold text-gray-400">PLAN THIS DAY</span>
                    </div>
                    <select aria-label="Occasion" value={planForm.occasion}
                      onChange={e=>setPlanForm(p=>({...p,occasion:e.target.value}))}
                      className="w-full text-xs rounded-lg border border-gray-200 px-2 py-2 bg-white">
                      {["Office","Wedding","Formal","Date","Funeral","Church","Interview","Casual"].map(o=><option key={o}>{o}</option>)}
                    </select>
                    <input aria-label="Planned outfit" value={planForm.outfit}
                      onChange={e=>setPlanForm(p=>({...p,outfit:e.target.value}))}
                      onKeyDown={e=>{if(e.key==="Enter")submitPlan()}}
                      placeholder="e.g. Navy suit, white shirt, burgundy tie"
                      className="w-full text-xs rounded-lg border border-gray-200 px-2 py-2"/>
                    <div className="flex gap-2">
                      <button onClick={()=>{setPlanning(false);setPlanForm({occasion:"Office",outfit:""})}}
                        className="flex-1 text-xs font-bold text-gray-400 rounded-lg py-2 border border-gray-200">Cancel</button>
                      <button onClick={submitPlan} disabled={!planForm.outfit.trim()}
                        className="flex-1 text-xs font-black text-white rounded-lg py-2 disabled:opacity-40" style={{background:NAVY}}>Save Plan</button>
                    </div>
                  </div>
                ) : !selectedEvt && !wornOnSelected && (
                  <div className="text-center py-4">
                    <Shirt size={20} className="mx-auto text-gray-200 mb-2"/>
                    <p className="text-xs text-gray-300 mb-2">No log or plan</p>
                    <button onClick={()=>setPlanning(true)}
                      className="text-xs font-bold" style={{color:GOLD}}>+ Plan an outfit</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                <Calendar size={20} className="mx-auto text-gray-200 mb-2"/>
                <p className="text-xs text-gray-400">Select a day to see details</p>
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

      {/* ── TAB: HISTORY ── */}
      {tab==="log" && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl font-black" style={{color:NAVY}}>{wornLog.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Logged looks</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl font-black" style={{color:NAVY}}>{last30.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Last 30 days</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              {topSuit ? (
                <>
                  <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{background:CLOSET_ITEMS_INIT.find(i=>i.name===topSuit[0])?.color||NAVY}}/>
                  <div className="text-xs font-black text-gray-700 leading-tight">{topSuit[0].split(" ").slice(0,2).join(" ")}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Favorite suit</div>
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
                      <span>⚠️</span> Same suit worn {daysAgo(prev7[0].date)} - consider changing the shirt or tie
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
                          {new Date(entry.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long"})}
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
                                {new Date(entry.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
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

const COMMUNITY_DRAFT_INIT = { look:"", outfit:"", caption:"", tags:"", photo:null, photoName:"", photoError:"" }

function resizeCommunityPhoto(file) {
  return resizeInlinePhoto(file, { maxSide:960, quality:0.78, maxLength:780000 })
}

function CommunityPage({ user, entitlement, isAdmin, onAuthClick, setPage }) {
  const [tab,   setTab]   = useState("feed")
  const [liked, setLiked] = useState({})
  const [draft, setDraft] = useState(COMMUNITY_DRAFT_INIT)
  const [showComposer, setShowComposer] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [joinNote, setJoinNote] = useState(null)

  const copyLook = (post) => {
    const parts = [post.look, post.outfit, post.caption].filter(Boolean)
    const text = parts.join(" — ") || "Dapper look"
    try { navigator.clipboard?.writeText(text) } catch {}
    setCopiedId(post.id)
    setTimeout(() => setCopiedId((id) => id === post.id ? null : id), 1600)
  }
  const { posts, loading, saving, error, createPost, toggleLike } = useCommunityPosts(user)
  const plan = entitlement?.plan || "free"
  const canPost = Boolean(user && (isAdmin || plan === "pro" || plan === "elite"))
  const displayPosts = posts.length > 0 ? posts : SOCIAL_POSTS.map(post => ({ ...post, _demo:true }))
  const accountBadge = isAdmin ? "Elite" : plan === "elite" ? "Elite" : plan === "pro" ? "Pro" : "Free"

  const openComposer = () => {
    if (!user) { onAuthClick?.(); return }
    if (!canPost) { setPage?.("pricing"); return }
    setTab("feed")
    setShowComposer(true)
  }

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setDraft(p => ({ ...p, photoError:"" }))
    try {
      const photo = await resizeCommunityPhoto(file)
      setDraft(p => ({ ...p, photo, photoName:file.name, photoError:"" }))
    } catch (err) {
      setDraft(p => ({ ...p, photo:null, photoName:"", photoError:err.message || "Could not add this photo." }))
    }
  }

  const submitPost = async () => {
    const outfit = draft.outfit.trim()
    const caption = draft.caption.trim()
    if (!caption && !draft.photo) return
    const tags = [...new Set(
      draft.tags
        .split(/[\s,]+/)
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => tag.startsWith("#") ? tag : `#${tag}`)
    )].slice(0, 6)
    try {
      await createPost({
        look: draft.look.trim(),
        outfit,
        caption,
        tags,
        badge: accountBadge,
        photo: draft.photo || null,
      })
      setDraft(COMMUNITY_DRAFT_INIT)
      setShowComposer(false)
    } catch {
      // useCommunityPosts surfaces a user-facing error message.
    }
  }

  const renderPostForm = () => (
    <div>
      <div className="mb-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
        <div className="text-xs font-black text-gray-700">Feed Information</div>
        <div className="text-xs text-gray-400 mt-0.5">Share a photo, note, outfit detail, or styling question directly to the Community feed.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <Label>Feed Title</Label>
          <input value={draft.look} onChange={e=>setDraft(p=>({...p,look:e.target.value}))}
            placeholder="Optional, e.g. Sunday fit check"
            className="mt-1 w-full border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300"/>
        </div>
        <div>
          <Label>Outfit Details</Label>
          <input value={draft.outfit} onChange={e=>setDraft(p=>({...p,outfit:e.target.value}))}
            placeholder="Optional, e.g. Navy suit · white shirt"
            className="mt-1 w-full border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300"/>
        </div>
      </div>
      <div>
        <Label>Feed Text</Label>
        <textarea value={draft.caption} onChange={e=>setDraft(p=>({...p,caption:e.target.value}))}
          placeholder="Write your feed post, question, or style note..."
          rows={3}
          className="mt-1 w-full border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 resize-none"/>
      </div>
      <div className="mt-3">
        <Label>Photo</Label>
        {draft.photo ? (
          <div className="mt-1 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
            <img src={draft.photo} alt="Look preview" className="w-full max-h-[360px] object-cover"/>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="text-xs font-bold text-gray-500 truncate">{draft.photoName || "Community photo"}</div>
              <button onClick={()=>setDraft(p=>({...p,photo:null,photoName:"",photoError:""}))}
                className="flex items-center gap-1.5 text-xs font-black text-red-500">
                <X size={13}/> Remove Photo
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm font-black text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
            <Camera size={17}/>
            Add Photo
            <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handlePhotoSelect}/>
          </label>
        )}
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
          <Upload size={12}/> Photos are compressed before posting.
        </div>
        {draft.photoError && <div className="mt-2 rounded-xl bg-red-50 text-red-600 text-xs p-3">{draft.photoError}</div>}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-3">
        <div className="flex-1">
          <Label>Tags</Label>
          <input value={draft.tags} onChange={e=>setDraft(p=>({...p,tags:e.target.value}))}
            placeholder="#navy #business #grenadine"
            className="mt-1 w-full border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300"/>
        </div>
        <button onClick={submitPost} disabled={saving || (!draft.caption.trim() && !draft.photo)}
          className="px-5 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40 sm:self-end"
          style={{background:NAVY}}>
          {saving ? "Posting..." : "Publish to Feed"}
        </button>
      </div>
      {error && <div className="mt-3 rounded-xl bg-red-50 text-red-600 text-xs p-3">{error}</div>}
    </div>
  )

  const likePost = async (post) => {
    if (post._demo) {
      setLiked(p=>({...p,[post.id]:!p[post.id]}))
      return
    }
    if (!user) { onAuthClick?.(); return }
    await toggleLike(post)
  }

  const postAuthor = (post) => post.authorName || post.user || "Dapper Member"
  const postInitials = (post) => post.authorInitials || post.initials || "DM"
  const postBadge = (post) => post.badge || "Member"
  const postRole = (post) => post.role || (postBadge(post) === "Elite" ? "Elite Member" : postBadge(post) === "Pro" ? "Pro Member" : "Member")
  const postTime = (post) => {
    if (post.timeAgo) return post.timeAgo
    const date = post.createdAt?.toDate ? post.createdAt.toDate() : null
    if (!date) return "Just now"
    const diff = Date.now() - date.getTime()
    const mins = Math.max(1, Math.floor(diff / 60000))
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }
  const postLikeCount = (post) => post._demo ? post.likes + (liked[post.id] ? 1 : 0) : Object.keys(post.likedBy || {}).length
  const postIsLiked = (post) => post._demo ? liked[post.id] : Boolean(user && post.likedBy?.[user.uid])

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
          <h1 className="text-3xl font-black text-gray-900 font-display">Community</h1>
          <p className="text-gray-400 text-sm mt-0.5">Style inspiration from the Dapper community</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openComposer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white shadow-sm"
            style={{background:NAVY}}>
            <Plus size={15}/> Share to Feed
          </button>
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

      {showComposer && canPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xl font-black text-gray-900">Share to Feed</div>
                <div className="text-xs text-gray-400">Post a photo, thought, question, or outfit note</div>
              </div>
              <button onClick={()=>setShowComposer(false)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-50">
                <X size={19} className="text-gray-300"/>
              </button>
            </div>
            {renderPostForm()}
          </div>
        </div>
      )}

      {tab==="feed" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            {canPost ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{background:NAVY}}>
                    {(user.displayName || user.email || "D")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900">Feed Composer</div>
                    <div className="text-xs text-gray-400">Post directly to the Community feed</div>
                  </div>
                </div>
                {renderPostForm()}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="font-black text-gray-900 text-sm">Share your looks with the community</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {user ? "Posting is available for Dapper Pro and Elite members." : "Sign in first, then upgrade to post looks."}
                  </div>
                </div>
                <button onClick={()=> user ? setPage?.("pricing") : onAuthClick?.()}
                  className="px-5 py-3 rounded-xl font-black text-sm text-white"
                  style={{background:NAVY}}>
                  {user ? "Upgrade to Pro" : "Sign In"}
                </button>
              </div>
            )}
          </div>

          {loading && posts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              Loading community...
            </div>
          )}

          {displayPosts.map(post=>(
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4 pb-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{background:post.avatar}}>
                  {postInitials(post)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-900">{postAuthor(post)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-black text-white" style={{background:postBadge(post)==="Elite"?GOLD:NAVY}}>
                      {postBadge(post)}
                    </span>
                    {post._demo && <span className="text-xs px-1.5 py-0.5 rounded-md font-black bg-gray-100 text-gray-400">DEMO</span>}
                  </div>
                  <div className="text-xs text-gray-400">{postRole(post)} · {postTime(post)}</div>
                </div>
              </div>
              {post.photo && (
                <div className="mx-4 mt-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={post.photo} alt={post.look || "Community look"} className="w-full max-h-[460px] object-cover"/>
                </div>
              )}
              {(post.look || post.outfit) && (
                <div className="mx-4 my-3 rounded-xl p-3" style={{background:post.avatar+"15",border:`1px solid ${post.avatar}25`}}>
                  {post.look && <div className="text-xs font-black tracking-wider text-gray-400 mb-0.5">{post.look}</div>}
                  {post.outfit && <div className="text-sm font-bold text-gray-800">{post.outfit}</div>}
                </div>
              )}
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-700 leading-relaxed">{post.caption}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(post.tags || []).map(tag=><span key={tag} className="text-xs text-blue-400 cursor-pointer hover:text-blue-600">{tag}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-50">
                <button onClick={()=>likePost(post)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${postIsLiked(post)?"text-red-500":"text-gray-300 hover:text-gray-500"}`}>
                  <Heart size={16} fill={postIsLiked(post)?"currentColor":"none"}/>
                  <span>{postLikeCount(post)}</span>
                </button>
                <div className="flex items-center gap-1.5 text-sm text-gray-300" title="Comments coming soon">
                  <MessageCircle size={16}/><span>{post.commentCount ?? post.comments ?? 0}</span>
                </div>
                <button onClick={()=>copyLook(post)}
                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-gray-500 ml-auto">
                  <TrendingUp size={13}/> {copiedId===post.id ? "Copied!" : "Copy Look"}
                </button>
              </div>
            </div>
          ))}
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
              <button onClick={()=>{setJoinNote(c.id);setTimeout(()=>setJoinNote(n=>n===c.id?null:n),1800)}}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-white flex-shrink-0 transition-all" style={{background:c.color}}>
                {joinNote===c.id ? "Soon" : "Join"}
              </button>
            </div>
          ))}
          <p className="text-xs text-center text-gray-300">Challenges are a preview — joining opens soon.</p>
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

function displayColorLabel(colorKey) {
  if (!colorKey) return ""
  return COLOR_FAMILY_LABELS[colorKey] || String(colorKey)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, c => c.toUpperCase())
}

function classifyValidatorColorText(text) {
  const v = String(text || "").toLowerCase()
  if (!v) return null
  if (/midnight|navy|indigo|azul marino|marino/.test(v)) return "navy"
  if (/charcoal|graphite|anthracite|gunmetal|dark gr[ae]y|gris oscuro|grafito|antracita/.test(v)) return "charcoal"
  if (/black|onyx|ebony|negr[oa]s?|negro/.test(v)) return "black"
  if (/light gr[ae]y|light gray|silver|pearl|ash|gris claro|platead[oa]|plata|perla|ceniza/.test(v)) return "light_grey"
  if (/gr[ae]y|slate|pewter|gris|pizarra/.test(v)) return "grey"
  if (/burgundy|wine|claret|maroon|oxblood|borgoñ[ao]|burdeos|vino|guinda|granate/.test(v)) return "burgundy"
  if (/cognac/.test(v)) return "cognac"
  if (/chocolate|espresso|brown|walnut|mahogany|mocha|marr[oó]n|caf[eé]|casta[nñ]o|caoba/.test(v)) return "brown"
  if (/white|oyster|cream|ivory|ecru|off[\s-]?white|blanc[oa]s?|crema|marfil|crudo/.test(v)) return "white"
  if (/camel|tan|beige|khaki|sand|taupe|fawn|wheat|camello|caqui|arena|trigo/.test(v)) return "beige"
  if (/olive|forest|hunter|bottle|moss|sage|green|oliva|verde|salvia|musgo|botella/.test(v)) return "olive"
  if (/teal|petrol|petr[oó]leo|verde azulado/.test(v)) return "teal"
  if (/pink|blush|rose|rosad[oa]|rosa/.test(v)) return "pink"
  if (/purple|violet|lavender|plum|aubergine|morado|p[uú]rpura|violeta|lavanda|berenjena/.test(v)) return "purple"
  if (/rust|terracotta|burnt orange|orange|copper|[oó]xido|terracota|naranja|cobre/.test(v)) return "rust"
  if (/red|scarlet|crimson|roj[oa]|escarlata|carmes[ií]/.test(v)) return "red"
  if (/gold|mustard|yellow|dorad[oa]|oro|mostaza|amarill[oa]/.test(v)) return "gold"
  if (/blue|cobalt|royal|french|sky|azul|celeste/.test(v)) return "blue"
  return null
}

function normalizeValidatorColor(value) {
  const v = String(value || "").toLowerCase()
  if (!v || v === "—" || v.includes("no tie")) return null
  const primary = v
    .split(/[,&/+()]/)[0]
    .replace(/\s+[-\u2013\u2014]\s+.*/, "")
    .trim()
  return classifyValidatorColorText(primary) || classifyValidatorColorText(v)
}

function validatorPatternKeyFromLabel(label) {
  const p = String(label || "").toLowerCase()
  if (/houndstooth|hounds tooth|pata de gallo/.test(p)) return "houndstooth"
  if (/linen|lino/.test(p)) return "linen"
  if (/herringbone|herring bone|espiga/.test(p)) return "herringbone"
  if (/tweed|donegal|harris/.test(p)) return "tweed"
  if (/chalk|pinstripe|pin stripe|stripe|raya diplom[aá]tica|raya tiza|rayas?/.test(p)) return "chalk_stripe"
  if (/glen|windowpane|window pane|plaid|check|pr[ií]ncipe de gales|cuadros?|ventana/.test(p)) return "glen_plaid"
  return "solid"
}

function validatorOccasionKey(occasion) {
  const o = String(occasion || "").toLowerCase()
  if (/funeral|memorial/.test(o)) return "funeral"
  if (/interview|entrevista/.test(o)) return "interview"
  if (/wedding|boda/.test(o)) return "wedding"
  if (/formal|gala|black tie|evening/.test(o)) return "formal"
  if (/business|office|board|client|meeting|negocio|oficina|cliente|reuni[oó]n|trabajo/.test(o)) return "business"
  if (/church|iglesia/.test(o)) return "church"
  if (/date|dinner|cena|cita/.test(o)) return "date"
  if (/casual|weekend|resort|fin de semana/.test(o)) return "casual"
  if (/creative|gallery|brand|creativ[oa]|galer[ií]a|marca/.test(o)) return "creative"
  return "all"
}

function suggestedShoeForSuit(suitColor) {
  if (suitColor === "black" || suitColor === "charcoal") return "Black Cap-Toe Oxford"
  if (suitColor === "navy") return "Dark Brown Oxford"
  if (["beige", "brown", "olive", "rust"].includes(suitColor)) return "Dark Brown Derby"
  if (suitColor === "burgundy") return "Black Oxford"
  return "Dark Brown Oxford"
}

function beltForShoes(shoes) {
  const shoeColor = normalizeValidatorColor(shoes)
  if (shoeColor === "black") return "Black Leather Belt"
  if (shoeColor === "cognac") return "Cognac Leather Belt"
  if (shoeColor === "beige") return "Tan Leather Belt"
  if (shoeColor === "burgundy") return "Oxblood Leather Belt"
  return "Dark Brown Leather Belt"
}

function suggestedTieForSuit(suitColor, occasion) {
  if (occasion === "funeral") return "Black Grenadine (Solid)"
  if (occasion === "interview") return "Navy Solid Grenadine"
  if (suitColor === "navy") return "Burgundy Grenadine (Solid)"
  if (suitColor === "charcoal" || suitColor === "grey") return "Burgundy Grenadine (Solid)"
  if (suitColor === "black") return "Silver Solid Grenadine"
  if (["beige", "brown", "olive"].includes(suitColor)) return "Navy Solid Grenadine"
  return "Navy Solid Grenadine"
}

function dedupeFixes(fixes) {
  const seen = new Set()
  return fixes.filter(f => {
    const key = f.label + JSON.stringify(f.updates || {})
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function cleanValidatorCorrectionValue(value) {
  const cleaned = String(value || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return ""
  if (/[A-Z]/.test(cleaned)) return cleaned
  return cleaned.replace(/\b\w/g, c => c.toUpperCase())
}

function normalizeValidatorOccasionLabel(value) {
  const key = validatorOccasionKey(value)
  const labels = {
    all: "All",
    business: "Business",
    interview: "Interview",
    wedding: "Wedding",
    formal: "Formal",
    funeral: "Funeral",
    church: "Church",
    date: "Date",
    casual: "Casual",
    creative: "Creative",
  }
  return labels[key] || cleanValidatorCorrectionValue(value)
}

function parseValidatorCorrection(text) {
  const raw = String(text || "").trim()
  if (!raw) return {}

  const fields = [
    { key: "occasion", labels: ["occasion", "ocasion", "ocasión", "event", "evento"] },
    { key: "suit", labels: ["suit", "traje", "blazer", "jacket", "saco"] },
    { key: "suitPattern", labels: ["suit pattern", "pattern", "patron traje", "patrón traje", "patron", "patrón", "estampado"] },
    { key: "shirt", labels: ["shirt", "camisa"] },
    { key: "tie", labels: ["tie", "corbata"] },
    { key: "pocketSquare", labels: ["pocket square", "pañuelo de bolsillo", "panuelo de bolsillo", "pañuelo", "panuelo", "square", "ps"] },
    { key: "shoes", labels: ["shoes", "shoe", "zapatos", "zapato"] },
    { key: "belt", labels: ["belt", "cinturon", "cinturón"] },
  ]

  const labelPattern = fields
    .flatMap(field => field.labels)
    .sort((a, b) => b.length - a.length)
    .map(label => escapeRegExp(label))
    .join("|")

  const updates = {}
  for (const field of fields) {
    const fieldPattern = field.labels
      .sort((a, b) => b.length - a.length)
      .map(label => escapeRegExp(label))
      .join("|")
    const rx = new RegExp(
      `(?:^|[\\n;,.])\\s*(?:${fieldPattern})\\s*(?:is|es|:|=|-)?\\s*([^\\n;,.]+?)(?=\\s*(?:[\\n;,.]|$|(?:${labelPattern})\\s*(?:is|es|:|=|-)))`,
      "i"
    )
    const match = raw.match(rx)
    if (match?.[1]) updates[field.key] = cleanValidatorCorrectionValue(match[1])
  }

  if (updates.suit && /^pattern[:\s]/i.test(updates.suit)) delete updates.suit
  if (updates.suit) updates.suitPattern = updates.suitPattern || validatorPatternKeyFromLabel(updates.suit)
  if (updates.suitPattern) updates.suitPattern = validatorPatternKeyFromLabel(updates.suitPattern)
  if (updates.occasion) updates.occasion = normalizeValidatorOccasionLabel(updates.occasion)
  return updates
}

// The full outfit validator logic
function validateOutfit({ suit, shirt, tie, pocketSquare, suitPattern, occasion, shoes, belt }) {
  const issues = []
  const warnings = []
  const compliments = []
  const fixes = []
  let overallScore = 10

  const suitPatKey = getSuitPatternKey(suitPattern || suit || "")
  const suitColor = normalizeValidatorColor(suit)
  const shirtColor = normalizeValidatorColor(shirt)
  const tieColor = normalizeValidatorColor(tie)
  const psColor = normalizeValidatorColor(pocketSquare)
  const shoeColor = normalizeValidatorColor(shoes)
  const beltColor = normalizeValidatorColor(belt)
  const occasionKey = validatorOccasionKey(occasion)
  const hasTie = !!tie && !/no tie|none|sin corbata|—/.test(String(tie).toLowerCase())

  const addIssue = (piece, message, fix, updates, score = 2) => {
    issues.push({ piece, severity: "error", message, fix, updates })
    if (fix && updates) fixes.push({ piece, label: fix, updates })
    overallScore -= score
  }
  const addWarning = (piece, message, fix, updates, score = 1) => {
    warnings.push({ piece, severity: "warning", message, fix, updates })
    if (fix && updates) fixes.push({ piece, label: fix, updates })
    overallScore -= score
  }

  // ── SUIT + SHIRT check ──
  if (suit && shirt) {
    const shirtPat = classifyShirtPattern(shirt)
    const suitPat  = getSuitPatternKey(suitPattern || suit)

    if (suitPat === "glen_plaid" && shirtPat === "gingham") {
      addIssue("Shirt", "Check shirt with a check suit — this is the cardinal sin of pattern mixing.", "Switch to Crisp White Poplin", { shirt: "Crisp White Poplin" }, 4)
    }
    if (suitPat === "chalk_stripe" && shirtPat === "bengal_stripe") {
      addWarning("Shirt", "Bold stripe shirt with chalk stripe suit — two competing bold stripes.", "Switch to Pale French Blue End-on-End", { shirt: "Pale French Blue End-on-End" }, 2)
    }
    if (suitPat === "glen_plaid" && (shirtPat === "bengal_stripe" || shirtPat === "fine_stripe")) {
      addWarning("Shirt", "A striped shirt with a plaid suit is risky territory — use only ultra-fine stripes.", "Switch to solid white", { shirt: "Crisp White Poplin" })
    }
    if (suitPat === "solid_suit" && shirtPat === "solid_shirt") {
      compliments.push("Solid suit with solid shirt — a clean, versatile foundation.")
    }
    if (suitPat === "chalk_stripe" && (shirtPat === "solid_shirt" || shirtPat === "end_on_end" || shirtPat === "oxford")) {
      compliments.push("Excellent shirt choice for a chalk stripe suit — the solid/subtle texture lets the stripe lead.")
    }
  }

  // ── SUIT + TIE check ──
  // Only run this pairwise check when no shirt was provided; otherwise the full
  // outfit check below evaluates the real three-piece combination.
  if (suit && hasTie && !shirt) {
    const tiePat  = classifyTiePattern(tie)
    const suitPat = getSuitPatternKey(suitPattern || suit)

    const combo = scorePatternCombo(suitPat, "solid_shirt", tiePat)
    if (combo.score < 4) {
      addIssue("Tie", combo.violations[0] || "Pattern conflict between suit and tie.", getFixForTieWithSuit(suitPat), { tie: suggestedTieForSuit(suitColor, occasionKey) }, 3)
    } else if (combo.score < 7) {
      addWarning("Tie", combo.warnings[0] || "Borderline pattern combination — tread carefully.", getFixForTieWithSuit(suitPat), { tie: suggestedTieForSuit(suitColor, occasionKey) })
    } else if (combo.score >= 9) {
      compliments.push(combo.tips[0] || "Excellent tie and suit pattern pairing.")
    }
  }

  // ── SHIRT + TIE check ──
  if (shirt && hasTie) {
    const tiePat   = classifyTiePattern(tie)
    const shirtPat = classifyShirtPattern(shirt)

    // Stripe shirt + stripe tie
    if ((shirtPat === "bengal_stripe" || shirtPat === "fine_stripe") && tiePat === "repp_stripe") {
      addWarning("Tie", "Stripe shirt with stripe tie — two stripe patterns at potentially similar scale.", "Switch to Navy Solid Grenadine", { tie: "Navy Solid Grenadine" }, 2)
    }

    // Check shirt + check tie
    if ((shirtPat === "gingham") && (tiePat === "bold_plaid")) {
      addIssue("Tie", "Check shirt with a check tie — same pattern family stacked.", "Switch to Burgundy Grenadine", { tie: "Burgundy Grenadine (Solid)" }, 3)
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
  if (suit && shirt && hasTie) {
    const tiePat   = classifyTiePattern(tie)
    const shirtPat = classifyShirtPattern(shirt)
    const suitPat  = getSuitPatternKey(suitPattern || suit)

    const combo = scorePatternCombo(suitPat, shirtPat, tiePat)
    if (combo.violations.length > 0 && !issues.find(i => i.piece === "Tie")) {
      addIssue("Full Outfit", combo.violations[0], "Use a solid tie", { tie: suggestedTieForSuit(suitColor, occasionKey) }, 2)
    }

    // Three pattern count
    const patternCount = [suitPat, shirtPat, tiePat].filter(p => p !== "solid_suit" && p !== "solid_shirt" && p !== "solid_tie" && p !== "grenadine" && p !== "knit").length
    if (patternCount === 3) {
      if (combo.score >= 7) {
        compliments.push("Three patterns — expertly managed with correct scale and family differentiation. This takes knowledge.")
      } else {
        addWarning("Full Outfit", "Three visible patterns is ambitious — scale and family contrast must be perfect.", "Drop one pattern", { shirt: "Crisp White Poplin", tie: suggestedTieForSuit(suitColor, occasionKey) })
      }
    }
  }

  // ── COLOR HARMONY ──
  if (suitColor && shirtColor && suitColor === shirtColor && !["white", "light_grey"].includes(suitColor)) {
    addWarning("Shirt", "The shirt is too close to the suit color. You need contrast at the chest and collar.", "Switch to Crisp White Poplin", { shirt: "Crisp White Poplin" })
  }

  if (suitColor && tieColor && suitColor === tieColor && classifyTiePattern(tie) === "solid_tie") {
    addWarning("Tie", "The tie matches the suit too closely. Tonal dressing works best with a visibly different shade or texture.", "Add contrast with a classic tie", { tie: suggestedTieForSuit(suitColor, occasionKey) })
  }

  if (suitColor === "black" && ["brown", "beige", "olive", "rust"].includes(tieColor)) {
    addWarning("Tie", "Earth-tone ties usually fight a black suit's formal register.", "Use silver or burgundy instead", { tie: "Silver Solid Grenadine" })
  }

  if (["beige", "brown", "olive"].includes(suitColor) && tieColor === "black") {
    addWarning("Tie", "A black tie is too severe for a warm earth-tone suit unless the event is intentionally formal.", "Use navy instead", { tie: "Navy Solid Grenadine" })
  }

  // ── POCKET SQUARE check ──
  if (pocketSquare && hasTie) {
    const ps  = pocketSquare.toLowerCase()
    const ti  = tie.toLowerCase()

    // PS should never exactly match the tie
    const tieMainColor = ti.split(/\s/)[0]
    if ((ps.includes(tieMainColor) || (psColor && tieColor && psColor === tieColor)) && ps.includes("silk") && ti.includes("solid")) {
      addWarning("Pocket Square", "Pocket square matches the tie too closely — they should complement, not match.", "Use white linen instead", { pocketSquare: "White Irish Linen" })
    }

    // White PS with any suit is always correct
    if (ps.includes("white")) {
      compliments.push("White pocket square — always correct, always refined.")
    }

    // PS and tie should not be same printed pattern
    if (ps.includes("paisley") && ti.includes("paisley")) {
      addIssue("Pocket Square", "Matching paisley tie and pocket square — this was a 1970s mistake. Don't repeat it.", "Switch to white linen", { pocketSquare: "White Irish Linen" }, 2)
    }

    // Formality mismatch
    if (ti.includes("knit") && ps.includes("silk") && ps.includes("print")) {
      addWarning("Pocket Square", "Printed silk pocket square with knit tie — formality registers don't quite match.", "Use white cotton", { pocketSquare: "White Cotton" })
    }
  }

  // ── Pocket square without tie ──
  if (pocketSquare && !tie && suit) {
    const ps = pocketSquare.toLowerCase()
    if (ps.includes("white") || ps.includes("linen")) {
      compliments.push("Pocket square only, no tie — white linen is the correct choice for the tieless look.")
    }
  }

  // ── SHOES + BELT ──
  if (shoes && belt && shoeColor && beltColor && shoeColor !== beltColor) {
    const equivalentBrown = ["brown", "cognac", "beige"].includes(shoeColor) && ["brown", "cognac", "beige"].includes(beltColor)
    if (!equivalentBrown) {
      addIssue("Belt", "Shoes and belt should live in the same leather family.", "Match belt to shoes", { belt: beltForShoes(shoes) }, 2)
    } else {
      compliments.push("Shoes and belt are in the same brown leather family — good.")
    }
  }

  if (suitColor && shoes && shoeColor) {
    const shoeOk = {
      black: ["black"],
      charcoal: ["black", "brown"],
      navy: ["black", "brown", "cognac", "burgundy"],
      grey: ["black", "brown", "cognac", "burgundy"],
      burgundy: ["black", "brown", "burgundy"],
      beige: ["brown", "cognac", "beige"],
      brown: ["brown", "cognac", "beige"],
      olive: ["brown", "cognac", "beige"],
      blue: ["black", "brown", "cognac"],
    }[suitColor]
    if (shoeOk && !shoeOk.includes(shoeColor)) {
      addWarning("Shoes", "The shoe color does not match the suit's formality and color family.", `Use ${suggestedShoeForSuit(suitColor)}`, { shoes: suggestedShoeForSuit(suitColor), belt: beltForShoes(suggestedShoeForSuit(suitColor)) })
    }
  }

  // ── OCCASION / FORMALITY ──
  if (occasionKey === "funeral") {
    if (suitColor && !["black", "charcoal", "navy"].includes(suitColor)) {
      addIssue("Suit", "Funeral dressing should stay black, charcoal, or very dark navy.", "Switch to Charcoal", { suit: "Charcoal", suitPattern: "solid" }, 4)
    }
    if (shirt && !["white", "blue", "light_grey"].includes(shirtColor)) {
      addWarning("Shirt", "For a funeral, keep the shirt white or very pale blue.", "Switch to Crisp White Poplin", { shirt: "Crisp White Poplin" }, 2)
    }
    if (hasTie && !["black", "charcoal", "navy"].includes(tieColor)) {
      addWarning("Tie", "Funeral ties should be quiet: black, charcoal, or dark navy.", "Switch to Black Grenadine", { tie: "Black Grenadine (Solid)" }, 2)
    }
    if (shoes && shoeColor !== "black") {
      addWarning("Shoes", "Black shoes are the safest and most respectful choice for a funeral.", "Use black oxfords", { shoes: "Black Cap-Toe Oxford", belt: "Black Leather Belt" }, 2)
    }
  }

  if (occasionKey === "interview" || occasionKey === "business") {
    if (suitColor && !["navy", "charcoal", "grey", "black"].includes(suitColor)) {
      addWarning("Suit", "For interviews and business settings, navy, charcoal, or grey read more authoritative.", "Switch to Navy", { suit: "Navy", suitPattern: "solid" })
    }
    if (!hasTie) {
      addWarning("Tie", "This occasion benefits from a tie. It signals intention and finish.", "Add a conservative tie", { tie: suggestedTieForSuit(suitColor, occasionKey) })
    }
    if (shirt && !["white", "blue", "light_grey", "pink"].includes(shirtColor)) {
      addWarning("Shirt", "Business shirts should stay white, blue, or very pale pink.", "Switch to white", { shirt: "Crisp White Poplin" })
    }
  }

  if (occasionKey === "formal") {
    if (suitColor && !["black", "navy", "charcoal"].includes(suitColor)) {
      addWarning("Suit", "Formal evening dress is strongest in black, midnight navy, or charcoal.", "Switch to black", { suit: "Black", suitPattern: "solid" }, 2)
    }
    if (shirt && shirtColor !== "white") {
      addWarning("Shirt", "Formal looks need a white shirt for maximum contrast and polish.", "Switch to white", { shirt: "Crisp White Poplin" })
    }
    if (shoes && shoeColor !== "black") {
      addWarning("Shoes", "Formal shoes should usually be black.", "Use black oxfords", { shoes: "Black Cap-Toe Oxford", belt: "Black Leather Belt" })
    }
  }

  if (occasionKey === "wedding") {
    if (suitColor === "black") {
      addWarning("Suit", "A black suit can read too severe for many daytime weddings.", "Use navy instead", { suit: "Navy", suitPattern: suitPattern || "solid" })
    }
    if (!hasTie) {
      addWarning("Tie", "A wedding usually deserves a tie unless the invitation says casual.", "Add a wedding-safe tie", { tie: "Burgundy Grenadine (Solid)" })
    }
    if (tieColor === "black") {
      addWarning("Tie", "Black ties can feel too somber at weddings unless it is black tie.", "Switch to burgundy", { tie: "Burgundy Grenadine (Solid)" })
    }
  }

  if (occasionKey === "church" && ["red", "rust", "purple"].includes(suitColor)) {
    addWarning("Suit", "For church, quieter colors read more respectful.", "Switch to navy", { suit: "Navy", suitPattern: "solid" })
  }

  if (occasionKey === "casual" && hasTie && !/knit|grenadine|cotton|linen/i.test(tie)) {
    addWarning("Tie", "For casual settings, a knit or textured tie feels easier than formal silk.", "Switch to Navy Knit", { tie: "Navy Knit" })
  }

  // Clamp score
  overallScore = Math.max(0, Math.min(10, overallScore))

  let verdict = ""
  let verdictColor = ""
  if (overallScore >= 9) { verdict = "✦ Fashion Police Approved"; verdictColor = "#166534" }
  else if (overallScore >= 7) { verdict = "✓ Looks Good — Minor Tweaks"; verdictColor = "#1d4ed8" }
  else if (overallScore >= 5) { verdict = "⚡ Needs Work"; verdictColor = "#92400e" }
  else { verdict = "🚨 Stop Right There"; verdictColor = "#991b1b" }

  return {
    issues,
    warnings,
    compliments,
    fixes: dedupeFixes(fixes),
    overallScore,
    verdict,
    verdictColor,
    meta: { suitColor, shirtColor, tieColor, psColor, shoeColor, beltColor, occasionKey, suitPatKey },
  }
}

function getFixForTieWithSuit(suitPat) {
  if (suitPat === "chalk_stripe") return "With a chalk stripe suit, use a solid tie, wool knit, polka dot, or small foulard — never another bold stripe."
  if (suitPat === "glen_plaid")   return "With a glen plaid suit, the tie must be solid. No exceptions. The plaid is the pattern."
  if (suitPat === "houndstooth")   return "With houndstooth, use a solid grenadine or knit tie. The check is already the statement."
  if (suitPat === "herringbone")  return "With a herringbone suit, use solid, repp stripe, polka dot, or foulard ties."
  if (suitPat === "tweed")        return "With tweed, use a wool knit tie — it's the most natural partner."
  if (suitPat === "linen")        return "With linen, use no tie or a light knit/cotton tie."
  return "Use a solid tie when uncertain — it is always correct."
}

// ── OUTFIT VALIDATOR PAGE ──
function OutfitValidatorPage() {
  const { analyzeOutfit: analyzeValidatorPhoto } = useClaudeVision()
  const [suit,            setSuit]           = useState("")
  const [suitPattern,     setSuitPattern]    = useState("solid")
  const [shirt,           setShirt]          = useState("")
  const [tie,             setTie]            = useState("")
  const [pocketSquare,    setPocketSquare]   = useState("")
  const [occasion,        setOccasion]       = useState("All")
  const [shoes,           setShoes]          = useState("")
  const [belt,            setBelt]           = useState("")
  const [result,          setResult]         = useState(null)
  const [analyzing,       setAnalyzing]      = useState(false)
  // Photo uploads for validator
  const [vSuitPhoto,      setVSuitPhoto]     = useState(null)
  const [vShirtPhoto,     setVShirtPhoto]    = useState(null)
  const [vTiePhoto,       setVTiePhoto]      = useState(null)
  const [vPSPhoto,        setVPSPhoto]       = useState(null)
  const [photoAnalyzing,  setPhotoAnalyzing] = useState(false)
  const [photoDetected,   setPhotoDetected]  = useState({})
  const [photoError,      setPhotoError]     = useState("")
  const [manualCorrection, setManualCorrection] = useState("")
  const [correctionFeedback, setCorrectionFeedback] = useState("")

  const applyDetectedPiece = (pieceKey, detected) => {
    if (!detected) return
    const colorLabel = detected.colorLabel || displayColorLabel(detected.colorKey)
    const patLabel = detected.patternInfo?.pattern || detected.patternLabel || "Solid"
    const patKey = validatorPatternKeyFromLabel(patLabel)

    if (pieceKey === "suit") {
      setSuit(colorLabel)
      setSuitPattern(patKey)
    }
    if (pieceKey === "shirt") {
      const base = colorLabel || "White"
      setShirt(`${base} ${patKey === "solid" ? "Poplin" : patLabel}`.trim())
    }
    if (pieceKey === "tie") {
      const base = colorLabel || "Navy"
      setTie(`${base} ${patKey === "solid" ? "Solid Grenadine" : patLabel}`.trim())
    }
    if (pieceKey === "ps") {
      const base = colorLabel || "White"
      setPocketSquare(`${base} ${patKey === "solid" ? "Pocket Square" : patLabel}`.trim())
    }
  }

  const visionPieceToDetection = (visionData, pieceKey) => {
    const key = pieceKey === "ps" ? "pocketSquare" : pieceKey
    const piece = visionData?.[key]
    if (!piece || piece.visible === false) return null
    return {
      source: "Claude Vision",
      colorKey: piece.color,
      colorLabel: piece.colorLabel || displayColorLabel(piece.color),
      colorHex: piece.colorHex,
      patternInfo: {
        pattern: piece.patternLabel || piece.pattern || "Solid",
        formality: "Detected from photo",
      },
      fabricStr: piece.fabric || piece.material || "Detected fabric",
      confidence: piece.confidence,
    }
  }

  const localDetectionForPiece = (localResult, pieceKey) => {
    if (!localResult) return null
    const colorLabel = COLOR_FAMILY_LABELS[localResult.colorKey] || displayColorLabel(localResult.colorKey)
    const pattern = localResult.patternInfo?.pattern || "Solid"
    return {
      ...localResult,
      source: "Local photo scan",
      colorLabel,
      patternInfo: { ...localResult.patternInfo, pattern },
    }
  }

  const handleValPhoto = async (file, dataURL, setter, pieceKey) => {
    setter(dataURL)
    if (!dataURL) return
    setPhotoAnalyzing(true)
    setPhotoError("")
    try {
      let detected = null
      try {
        const visionResult = await analyzeValidatorPhoto(file)
        if (visionResult.success) detected = visionPieceToDetection(visionResult.data, pieceKey)
      } catch (visionErr) {
        console.warn("[Dapper Validator] Vision failed, using local detection", visionErr)
      }
      if (!detected) {
        const localScan = pieceKey === "suit"
          ? await analyzeSuitLocally(dataURL)
          : await analyzePhotoLocally(dataURL)
        detected = localDetectionForPiece(localScan, pieceKey)
      }
      if (detected) {
        setPhotoDetected(prev => ({ ...prev, [pieceKey]: detected }))
        applyDetectedPiece(pieceKey, detected)
        setResult(null)
      }
    } finally {
      setPhotoAnalyzing(false)
    }
  }

  const handleValPhotoInput = async (e, setter, pieceKey) => {
    const file = e.target.files[0]
    e.target.value = ""
    if (!file) return
    setPhotoError("")
    try {
      const dataUrl = await resizeInlinePhoto(file, { maxSide:900, quality:0.76, maxLength:680000 })
      handleValPhoto(file, dataUrl, setter, pieceKey)
    } catch (err) {
      setter(null)
      setPhotoError(err.message || "Could not add this photo.")
    }
  }

  const SUIT_PATTERNS = [
    {key:"solid",       label:"Solid"},
    {key:"chalk_stripe",label:"Chalk Stripe / Pinstripe"},
    {key:"glen_plaid",  label:"Glen Plaid / Windowpane"},
    {key:"herringbone", label:"Herringbone"},
    {key:"tweed",       label:"Tweed / Donegal"},
    {key:"houndstooth", label:"Houndstooth"},
    {key:"linen",       label:"Linen"},
  ]

  const buildValidatorState = (updates = {}) => ({
    suit,
    suitPattern,
    shirt,
    tie,
    pocketSquare,
    occasion,
    shoes,
    belt,
    ...updates,
  })

  const applyValidatorState = (next) => {
    setSuit(next.suit || "")
    setSuitPattern(next.suitPattern || "solid")
    setShirt(next.shirt || "")
    setTie(next.tie || "")
    setPocketSquare(next.pocketSquare || "")
    setOccasion(next.occasion || "All")
    setShoes(next.shoes || "")
    setBelt(next.belt || "")
  }

  const hasValidatorInput = (input) => !!(input.suit || input.shirt || input.tie || input.pocketSquare || input.shoes || input.belt)

  const describeCorrectionUpdates = (updates) => {
    const labels = {
      occasion: "occasion",
      suit: "suit",
      suitPattern: "pattern",
      shirt: "shirt",
      tie: "tie",
      pocketSquare: "pocket square",
      shoes: "shoes",
      belt: "belt",
    }
    return Object.keys(updates).map(key => labels[key] || key).join(", ")
  }

  const handleValidate = () => {
    const correctionUpdates = manualCorrection.trim() ? parseValidatorCorrection(manualCorrection) : {}
    if (manualCorrection.trim() && Object.keys(correctionUpdates).length === 0) {
      setCorrectionFeedback("I could not read that correction. Use labels like Suit:, Shirt:, Tie:, Shoes:, or Belt:.")
    }
    const next = buildValidatorState(correctionUpdates)
    if (!hasValidatorInput(next)) return
    if (Object.keys(correctionUpdates).length > 0) {
      applyValidatorState(next)
      setCorrectionFeedback(`Correction applied: ${describeCorrectionUpdates(correctionUpdates)}.`)
    }
    setAnalyzing(true)
    setTimeout(() => {
      const r = validateOutfit(next)
      setResult(r)
      setAnalyzing(false)
    }, 800)
  }

  const handleReset = () => {
    setSuit(""); setSuitPattern("solid"); setShirt("")
    setTie(""); setPocketSquare(""); setShoes(""); setBelt(""); setOccasion("All"); setResult(null)
    setVSuitPhoto(null); setVShirtPhoto(null); setVTiePhoto(null); setVPSPhoto(null)
    setPhotoDetected({})
    setPhotoError("")
    setManualCorrection("")
    setCorrectionFeedback("")
  }

  const applyFix = (updates) => {
    const next = buildValidatorState(updates)
    applyValidatorState(next)
    setResult(validateOutfit(next))
  }

  const applyManualCorrection = () => {
    const updates = parseValidatorCorrection(manualCorrection)
    if (Object.keys(updates).length === 0) {
      setCorrectionFeedback("I could not read that correction. Example: Suit: navy houndstooth; Shirt: white poplin; Tie: burgundy grenadine.")
      return
    }
    applyFix(updates)
    setCorrectionFeedback(`Correction applied: ${describeCorrectionUpdates(updates)}.`)
  }

  const pendingCorrection = manualCorrection.trim() ? parseValidatorCorrection(manualCorrection) : {}
  const canValidate = hasValidatorInput(buildValidatorState(pendingCorrection))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 font-display">Outfit Validator</h1>
        <p className="text-gray-500 text-sm mt-1">Build the look from photos, then correct anything in text. The validator checks pattern, color, formality, occasion, shoes, and belt.</p>
      </div>

      {/* Photo upload section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="text-xs font-black tracking-wider text-gray-400 mb-3">📷 UPLOAD PHOTOS <span className="text-gray-300 font-normal">(optional — auto-detects color & pattern)</span></div>
        {photoAnalyzing && (
          <div className="text-xs text-center py-2 mb-2 rounded-lg" style={{background:"#fffbeb",color:GOLD}}>
            Analyzing photo…
          </div>
        )}
        {photoError && <div className="text-xs py-2 px-3 mb-2 rounded-lg bg-red-50 text-red-600">{photoError}</div>}
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
                      <div className="text-xs text-gray-500 mt-0.5">{photoDetected[key].colorLabel || displayColorLabel(photoDetected[key].colorKey)} · {photoDetected[key].patternInfo?.pattern}</div>
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
              <input id={`val-${key}`} type="file" accept="image/*,.heic,.heif"
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

      {/* Manual correction */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="text-xs font-black tracking-wider text-gray-400 mb-2">CORRECT DETECTION</div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          If Dapper reads the photo wrong, write the correction here. English and Spanish labels both work.
        </p>
        <textarea
          value={manualCorrection}
          onChange={e => { setManualCorrection(e.target.value); setCorrectionFeedback(""); setResult(null) }}
          rows={4}
          className="w-full rounded-xl border-2 border-gray-100 p-3 text-sm text-gray-700 outline-none focus:border-yellow-500 resize-none"
          placeholder="Example: Occasion: wedding; Suit: navy houndstooth; Shirt: white poplin; Tie: burgundy grenadine; Pocket square: white linen; Shoes: black oxford; Belt: black leather"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={applyManualCorrection}
            disabled={!manualCorrection.trim()}
            className="flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all"
            style={{background:manualCorrection.trim()?GOLD:"#e5e7eb",color:manualCorrection.trim()?NAVY:"#9ca3af"}}>
            APPLY CORRECTION
          </button>
          <button
            onClick={() => { setManualCorrection(""); setCorrectionFeedback(""); setResult(null) }}
            className="px-4 py-3 rounded-xl font-bold text-xs border-2 border-gray-100 text-gray-400">
            Clear
          </button>
        </div>
        {correctionFeedback && (
          <div className="mt-3 text-xs font-semibold rounded-xl p-3" style={{background:"#f8fafc",color:"#64748b"}}>
            {correctionFeedback}
          </div>
        )}
        {hasValidatorInput({ suit, shirt, tie, pocketSquare, shoes, belt }) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              {label:"OCCASION", value:occasion || "All", empty:!occasion || occasion==="All"},
              {label:"SUIT", value:suit ? `${suit} (${SUIT_PATTERNS.find(p=>p.key===suitPattern)?.label || "Solid"})` : "—", empty:!suit},
              {label:"SHIRT", value:shirt || "—", empty:!shirt},
              {label:"TIE", value:tie || "—", empty:!tie},
              {label:"POCKET SQUARE", value:pocketSquare || "—", empty:!pocketSquare},
              {label:"SHOES", value:shoes || "—", empty:!shoes},
              {label:"BELT", value:belt || "—", empty:!belt},
            ].map(({label,value,empty}) => (
              <div key={label} className="p-3 rounded-xl" style={{background:empty?"#f8fafc":"#f1f5f9",border:empty?"1px dashed #e5e7eb":"1px solid #e2e8f0"}}>
                <div className="text-xs font-bold tracking-wider text-gray-400">{label}</div>
                <div className={`text-xs font-semibold mt-0.5 ${empty?"text-gray-300 italic":"text-gray-700"}`}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validate button */}
      <div className="flex gap-3 mb-6">
        <button onClick={handleValidate} disabled={analyzing || !canValidate}
          className="flex-1 py-4 rounded-2xl font-black text-sm tracking-widest transition-all"
          style={{background:!canValidate?'#e5e7eb':GOLD, color:!canValidate?'#9ca3af':NAVY}}>
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

          {/* Quick fixes */}
          {result.fixes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs font-black tracking-wider text-gray-400 mb-3">⚒ QUICK FIXES</div>
              <div className="flex flex-wrap gap-2">
                {result.fixes.map((fix, i) => (
                  <button key={i} onClick={() => applyFix(fix.updates)}
                    className="px-3 py-2 rounded-xl text-xs font-black transition-all"
                    style={{background:"#fffbeb",color:"#92400e",border:`1px solid ${GOLD}`}}>
                    {fix.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">Tap a fix to apply it and re-run the validation.</p>
            </div>
          )}

          {/* Outfit summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs font-black tracking-wider text-gray-400 mb-3">YOUR OUTFIT</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:"OCCASION", value:occasion || "All", empty:!occasion || occasion==="All"},
                {label:"SUIT", value: suit ? `${suit} (${SUIT_PATTERNS.find(p=>p.key===suitPattern)?.label})` : "—", empty:!suit},
                {label:"SHIRT", value:shirt||"—", empty:!shirt},
                {label:"TIE", value:tie||"—", empty:!tie},
                {label:"POCKET SQUARE", value:pocketSquare||"—", empty:!pocketSquare},
                {label:"SHOES", value:shoes||"—", empty:!shoes},
                {label:"BELT", value:belt||"—", empty:!belt},
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
                      <div>
                        <p className="text-xs text-green-700">{issue.fix}</p>
                        {issue.updates && (
                          <button onClick={() => applyFix(issue.updates)}
                            className="mt-1 px-2 py-1 rounded-lg text-xs font-black"
                            style={{background:"#dcfce7",color:"#166534"}}>
                            Apply fix
                          </button>
                        )}
                      </div>
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
                      <div>
                        <p className="text-xs text-green-700">{w.fix}</p>
                        {w.updates && (
                          <button onClick={() => applyFix(w.updates)}
                            className="mt-1 px-2 py-1 rounded-lg text-xs font-black"
                            style={{background:"#dcfce7",color:"#166534"}}>
                            Apply fix
                          </button>
                        )}
                      </div>
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

        </div>
      )}
    </div>
  )
}


function PricingPage({ entitlement, user, onAuthClick }) {
  const [selectedBilling, setSelectedBilling] = useState({}) // per-tier: "monthly" | "annual"
  const [checkoutBusy, setCheckoutBusy] = useState("") // tierPlan currently being started
  const [checkoutError, setCheckoutError] = useState("")

  const getBilling = (tierName) => selectedBilling[tierName] || "monthly"
  const setBilling = (tierName, val) => setSelectedBilling(p=>({...p,[tierName]:val}))
  const currentPlan = entitlement?.plan || "free"

  // ── Stripe Checkout ──
  // Requires the /api/create-checkout-session endpoint + Stripe price IDs
  // configured in the deployment env (see STRIPE-SETUP.md).
  const startCheckout = async (tierPlan, billing) => {
    setCheckoutError("")
    if (!user) { onAuthClick?.(); return }
    setCheckoutBusy(tierPlan)
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tierPlan, billing, uid: user.uid, email: user.email || "" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not start checkout. Please try again.")
      }
      window.location.href = data.url
    } catch (err) {
      console.error("[Dapper Checkout] failed", err)
      setCheckoutError(err.message || "Could not start checkout. Please try again.")
      setCheckoutBusy("")
    }
  }

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
        <h1 className="text-4xl font-black text-gray-900 mb-2 font-display">Dress Better. Every Day.</h1>
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
          const tierPlan = tier.name === "Dapper Elite" ? "elite" : tier.name === "Dapper Pro" ? "pro" : "free"
          const isCurrent = currentPlan === tierPlan

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
                <button
                  disabled={isCurrent || (isPaid && checkoutBusy===tierPlan)}
                  onClick={isPaid && !isCurrent ? () => startCheckout(tierPlan, billing) : undefined}
                  aria-label={isCurrent ? `${tier.name} is your current plan` : isPaid ? `Subscribe to ${tier.name}` : tier.cta}
                  className="mt-5 w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-98 disabled:opacity-70"
                  style={{background:tier.ctaBg,color:tier.ctaColor}}>
                  {isCurrent ? "Current Plan" : (isPaid && checkoutBusy===tierPlan) ? "Redirecting…" : tier.cta}
                  {!isCurrent && isPaid && checkoutBusy!==tierPlan && billing==="annual" && " (Anual)"}
                </button>
                {isPaid && checkoutError && checkoutBusy==="" && (
                  <div className="mt-2 text-center text-xs font-semibold text-red-600">{checkoutError}</div>
                )}

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

function formatAdminDate(value) {
  if (!value) return "No expiration"
  const date = value?.toDate ? value.toDate() : value
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "No expiration"
  return date.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
}

function reportDate(value) {
  const date = value?.toDate ? value.toDate() : value
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Just now"
  return date.toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })
}

function problemTypeLabel(type) {
  const labels = {
    bug: "Bug",
    not_working: "Not Working",
    feature_suggestion: "Feature Suggestion",
    other: "Other",
  }
  return labels[type] || "Report"
}

const REPORT_PAGE_OPTIONS = [
  { id: "whole_app", label: "Whole App" },
  { id: "analyzer", label: "AI Analyzer" },
  { id: "validator", label: "Outfit Validator" },
  { id: "closet", label: "My Closet" },
  { id: "calendar", label: "Outfit Calendar" },
  { id: "community", label: "Community" },
  { id: "pricing", label: "Upgrade / Billing" },
  { id: "login", label: "Sign In / Account" },
  { id: "admin", label: "Admin" },
  { id: "other", label: "Other / Not Sure" },
]

function problemPageLabel(page) {
  return REPORT_PAGE_OPTIONS.find((option) => option.id === page)?.label || page || "Whole App"
}

function reportStatusStyle(status) {
  if (status === "resolved") return { background:"#dcfce7", color:"#166534" }
  if (status === "reviewing") return { background:"#fffbeb", color:"#92400e" }
  return { background:"#fee2e2", color:"#991b1b" }
}

function planBadgeStyle(plan) {
  if (plan === "elite") return { background:GOLD, color:NAVY }
  if (plan === "pro") return { background:NAVY, color:"white" }
  return { background:"#f1f5f9", color:"#64748b" }
}

function AdminPage({ user, isAdmin, adminAccessError, onAuthClick }) {
  const {
    profiles,
    entitlements,
    emailEntitlements,
    loading,
    saving,
    error,
    grantEntitlement,
    revokeEntitlement,
    grantEmailEntitlement,
    revokeEmailEntitlement,
  } = useAdminUsers(user, isAdmin)
  const {
    reports: problemReports,
    loading: reportsLoading,
    saving: reportsSaving,
    error: reportsError,
    updateReportStatus,
  } = useAdminProblemReports(user, isAdmin)
  const [search, setSearch] = useState("")
  const [selectedUid, setSelectedUid] = useState("")
  const [plan, setPlan] = useState("pro")
  const [expiresAt, setExpiresAt] = useState("")
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")
  const [compEmail, setCompEmail] = useState("")
  const [compPlan, setCompPlan] = useState("pro")
  const [compExpiresAt, setCompExpiresAt] = useState("")
  const [compNote, setCompNote] = useState("")
  const [compMessage, setCompMessage] = useState("")

  const filteredProfiles = profiles.filter((profile) => {
    const haystack = `${profile.email || ""} ${profile.displayName || ""} ${profile.uid || ""}`.toLowerCase()
    return haystack.includes(search.trim().toLowerCase())
  })
  const selectedUser = profiles.find((profile) => profile.uid === selectedUid) || filteredProfiles[0]
  const selectedEntitlement = selectedUser ? entitlements[selectedUser.uid] : null
  const emailComps = Object.values(emailEntitlements || {})
    .filter((entitlement) => entitlement.email)
    .sort((a, b) => String(a.email).localeCompare(String(b.email)))
  const openProblemReports = problemReports.filter((report) => report.status !== "resolved")
  const visibleProblemReports = [...openProblemReports, ...problemReports.filter((report) => report.status === "resolved")].slice(0, 8)

  useEffect(() => {
    if (!selectedUid && filteredProfiles[0]?.uid) setSelectedUid(filteredProfiles[0].uid)
  }, [filteredProfiles, selectedUid])

  const applyGrant = async () => {
    if (!selectedUser) { setMessage("Select a user first."); return }
    setMessage("")
    try {
      if (plan === "free") {
        await revokeEntitlement({ uid:selectedUser.uid, email:selectedUser.email, note:note || "Set to Free from Admin." })
        setMessage(`${selectedUser.email || selectedUser.uid} is now on Free.`)
      } else {
        await grantEntitlement({ uid:selectedUser.uid, email:selectedUser.email, plan, expiresAt, note })
        setMessage(`${selectedUser.email || selectedUser.uid} now has complimentary ${plan === "elite" ? "Elite" : "Pro"}.`)
      }
    } catch {
      setMessage("Could not update this account. Check Firestore rules and admin access.")
    }
  }

  const revokeSelected = async () => {
    if (!selectedUser) { setMessage("Select a user first."); return }
    if (!window.confirm(`Move ${selectedUser.email || selectedUser.uid} back to Free? This removes their paid access.`)) return
    setMessage("")
    try {
      await revokeEntitlement({ uid:selectedUser.uid, email:selectedUser.email, note:note || "Revoked from Admin." })
      setMessage(`${selectedUser.email || selectedUser.uid} was moved back to Free.`)
    } catch {
      setMessage("Could not revoke this account. Check Firestore rules and admin access.")
    }
  }

  const applyEmailComp = async () => {
    if (!compEmail.trim()) { setCompMessage("Enter an email first."); return }
    setCompMessage("")
    try {
      if (compPlan === "free") {
        await revokeEmailEntitlement({ email:compEmail, note:compNote || "Set to Free from Admin." })
        setCompMessage(`${compEmail.trim().toLowerCase()} was moved back to Free.`)
      } else {
        await grantEmailEntitlement({ email:compEmail, plan:compPlan, expiresAt:compExpiresAt, note:compNote })
        setCompMessage(`${compEmail.trim().toLowerCase()} now has complimentary ${compPlan === "elite" ? "Elite" : "Pro"}.`)
      }
    } catch {
      setCompMessage("Could not update this email comp. Check Firestore rules and admin access.")
    }
  }

  const revokeEmailComp = async (email = compEmail) => {
    if (!String(email).trim()) { setCompMessage("Enter an email first."); return }
    if (!window.confirm(`Move ${String(email).trim().toLowerCase()} back to Free? This removes their paid access.`)) return
    setCompMessage("")
    try {
      await revokeEmailEntitlement({ email, note:compNote || "Revoked from Admin." })
      setCompMessage(`${String(email).trim().toLowerCase()} was moved back to Free.`)
    } catch {
      setCompMessage("Could not revoke this email comp. Check Firestore rules and admin access.")
    }
  }

  const setReportStatus = async (report, status) => {
    try {
      await updateReportStatus(report.id, status)
    } catch {
      setMessage("Could not update this problem report.")
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:"#f8fafc",color:NAVY}}>
            <Shield size={26}/>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Admin Access</h1>
          <p className="text-sm text-gray-500 mb-5">Sign in with the owner account to manage complimentary plans.</p>
          <button onClick={onAuthClick} className="px-5 py-3 rounded-xl text-sm font-black" style={{background:NAVY,color:"white"}}>
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{background:"#fff7ed",color:"#c2410c"}}>
            <Lock size={26}/>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-sm text-gray-500 mb-4">
            Create a Firestore document at <span className="font-mono text-gray-800">admins/{user.uid}</span> to unlock this dashboard for this signed-in owner.
          </p>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-500 break-all">
            <span className="font-black text-gray-700">Your UID:</span> {user.uid}
          </div>
          {(adminAccessError) && <p className="mt-3 text-xs text-red-500">{adminAccessError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:GOLD,color:NAVY}}>
              <Shield size={18}/>
            </div>
            <span className="text-xs font-black tracking-widest" style={{color:GOLD}}>OWNER DASHBOARD</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Grant complimentary Pro or Elite access by user account or by email before they sign in.</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4 min-w-[220px]">
          <div className="text-xs font-black text-gray-400 tracking-widest">SIGNED IN AS</div>
          <div className="text-sm font-bold text-gray-900 truncate">{user.email || user.uid}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} style={{color:GOLD}}/>
            <div>
              <h2 className="font-black text-gray-900">Problem Reports</h2>
              <p className="text-xs text-gray-400 mt-0.5">Bugs, broken flows, and feature suggestions from users.</p>
            </div>
          </div>
          <span className="text-xs font-black px-2 py-1 rounded-lg" style={reportStatusStyle("open")}>
            {openProblemReports.length} open
          </span>
        </div>
        {reportsLoading && <div className="text-sm text-gray-400 py-6 text-center">Loading reports...</div>}
        {!reportsLoading && visibleProblemReports.length === 0 && (
          <div className="text-sm text-gray-400 py-6 text-center">No problem reports yet.</div>
        )}
        <div className="space-y-3">
          {visibleProblemReports.map((report) => (
            <div key={report.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black px-2 py-1 rounded-lg bg-gray-100 text-gray-600">{problemTypeLabel(report.type)}</span>
                    <span className="text-xs font-black px-2 py-1 rounded-lg" style={reportStatusStyle(report.status)}>{report.status || "open"}</span>
                    <span className="text-xs text-gray-400">{reportDate(report.createdAt)}</span>
                  </div>
                  <h3 className="font-black text-gray-900 mt-2 break-words">{report.title || "Untitled report"}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{report.message}</p>
                  <div className="text-xs text-gray-400 mt-2 break-all">
                    {report.contactEmail || report.userEmail || "No email"} · {problemPageLabel(report.page)} · {report.url || ""}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={()=>setReportStatus(report, "reviewing")} disabled={reportsSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-black border border-gray-200 text-gray-700 disabled:opacity-50">
                  Mark Reviewing
                </button>
                <button onClick={()=>setReportStatus(report, "resolved")} disabled={reportsSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-black text-white disabled:opacity-50"
                  style={{background:NAVY}}>
                  Mark Resolved
                </button>
                <button onClick={()=>setReportStatus(report, "open")} disabled={reportsSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-black border border-gray-200 text-gray-700 disabled:opacity-50">
                  Reopen
                </button>
              </div>
            </div>
          ))}
        </div>
        {reportsError && <div className="mt-4 rounded-xl bg-red-50 text-red-700 text-sm p-3">{reportsError}</div>}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift size={18} style={{color:GOLD}}/>
          <div>
            <h2 className="font-black text-gray-900">Grant By Email</h2>
            <p className="text-xs text-gray-400 mt-0.5">Use this for people who do not appear in Users yet. The comp applies when they sign in with that email.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <label className="block lg:col-span-2">
            <span className="text-xs font-black text-gray-400 tracking-widest">EMAIL</span>
            <input value={compEmail} onChange={(e)=>setCompEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300"/>
          </label>
          <label className="block">
            <span className="text-xs font-black text-gray-400 tracking-widest">PLAN</span>
            <select value={compPlan} onChange={(e)=>setCompPlan(e.target.value)}
              className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300">
              <option value="pro">Pro Comp</option>
              <option value="elite">Elite Comp</option>
              <option value="free">Free</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black text-gray-400 tracking-widest">EXPIRES</span>
            <input type="date" value={compExpiresAt} onChange={(e)=>setCompExpiresAt(e.target.value)}
              className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300"/>
          </label>
        </div>
        <label className="block mt-3">
          <span className="text-xs font-black text-gray-400 tracking-widest">INTERNAL NOTE</span>
          <input value={compNote} onChange={(e)=>setCompNote(e.target.value)}
            placeholder="Friend, tester, VIP, stylist partner..."
            className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300"/>
        </label>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button onClick={applyEmailComp} disabled={saving || !compEmail.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-black disabled:opacity-50"
            style={{background:NAVY,color:"white"}}>
            {saving ? "Saving..." : "Apply Email Comp"}
          </button>
          <button onClick={()=>revokeEmailComp()} disabled={saving || !compEmail.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-black border border-gray-200 text-gray-700 disabled:opacity-50">
            Revoke Email Comp
          </button>
        </div>
        {(compMessage || error) && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {error || compMessage}
          </div>
        )}
        {emailComps.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="text-xs font-black text-gray-400 tracking-widest mb-2">EMAIL COMPS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {emailComps.map((entitlement) => (
                <button key={entitlement.id || entitlement.email}
                  onClick={()=>{ setCompEmail(entitlement.email); setCompPlan(entitlement.plan || "free"); setCompExpiresAt(""); setCompNote(entitlement.note || "") }}
                  className="text-left border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">{entitlement.email}</div>
                      <div className="text-xs text-gray-400 truncate">{entitlement.source || "email_comp"} · expires {formatAdminDate(entitlement.expiresAt)}</div>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0" style={planBadgeStyle(entitlement.plan)}>
                      {accountPlanLabel(entitlement)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">Users</h2>
            <span className="text-xs font-black text-gray-400">{profiles.length} total</span>
          </div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
            <input value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search email, name, or UID"
              className="w-full border border-gray-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-gray-300"/>
          </div>
          {loading && <div className="text-sm text-gray-400 py-8 text-center">Loading users...</div>}
          {!loading && filteredProfiles.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center">
              No users found yet. Users appear here after their first sign-in.
            </div>
          )}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredProfiles.map((profile) => {
              const active = selectedUser?.uid === profile.uid
              const entitlement = entitlements[profile.uid] || { plan:"free", label:"Free" }
              return (
                <button key={profile.uid} onClick={()=>setSelectedUid(profile.uid)}
                  className={`w-full text-left border rounded-xl p-3 transition-all ${active ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">{profile.email || "No email"}</div>
                      <div className="text-xs text-gray-400 truncate">{profile.displayName || profile.uid}</div>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0" style={planBadgeStyle(entitlement.plan)}>
                      {accountPlanLabel(entitlement)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-black tracking-widest text-gray-400 mb-1">SELECTED ACCOUNT</div>
                <h2 className="text-xl font-black text-gray-900 break-all">{selectedUser?.email || "No user selected"}</h2>
                {selectedUser && <p className="text-xs text-gray-400 break-all mt-1">{selectedUser.uid}</p>}
              </div>
              {selectedUser && (
                <span className="text-xs font-black px-3 py-1.5 rounded-lg" style={planBadgeStyle(selectedEntitlement?.plan || "free")}>
                  {accountPlanLabel(selectedEntitlement)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs font-black text-gray-400 tracking-widest">CURRENT PLAN</div>
                <div className="text-lg font-black text-gray-900">{accountPlanLabel(selectedEntitlement)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs font-black text-gray-400 tracking-widest">SOURCE</div>
                <div className="text-lg font-black text-gray-900">{selectedEntitlement?.source || "default"}</div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-xs font-black text-gray-400 tracking-widest">EXPIRES</div>
                <div className="text-lg font-black text-gray-900">{formatAdminDate(selectedEntitlement?.expiresAt)}</div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift size={18} style={{color:GOLD}}/>
                <h3 className="font-black text-gray-900">Grant Complimentary Access</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-black text-gray-400 tracking-widest">PLAN</span>
                  <select value={plan} onChange={(e)=>setPlan(e.target.value)}
                    className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300">
                    <option value="pro">Pro Comp</option>
                    <option value="elite">Elite Comp</option>
                    <option value="free">Free</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-gray-400 tracking-widest">EXPIRATION OPTIONAL</span>
                  <input type="date" value={expiresAt} onChange={(e)=>setExpiresAt(e.target.value)}
                    className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300"/>
                </label>
              </div>
              <label className="block mt-4">
                <span className="text-xs font-black text-gray-400 tracking-widest">INTERNAL NOTE</span>
                <input value={note} onChange={(e)=>setNote(e.target.value)}
                  placeholder="Friend, tester, stylist partner, VIP..."
                  className="w-full mt-1 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gray-300"/>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button onClick={applyGrant} disabled={saving || !selectedUser}
                  className="flex-1 py-3 rounded-xl text-sm font-black disabled:opacity-50"
                  style={{background:NAVY,color:"white"}}>
                  {saving ? "Saving..." : "Apply Plan"}
                </button>
                <button onClick={revokeSelected} disabled={saving || !selectedUser}
                  className="flex-1 py-3 rounded-xl text-sm font-black border border-gray-200 text-gray-700 disabled:opacity-50">
                  Revoke To Free
                </button>
              </div>
              {(message || error) && (
                <div className={`mt-4 rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {error || message}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-gray-900 mb-2">Security Note</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              This dashboard depends on Firestore rules. The first owner document must be created manually at <span className="font-mono text-gray-800">admins/{user.uid}</span>. After that, only admins should be able to edit entitlements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const REPORT_FORM_INIT = {
  type: "bug",
  title: "",
  message: "",
  email: "",
  page: "whole_app",
}

function ReportProblemModal({ user, page, onClose }) {
  const [form, setForm] = useState(() => ({ ...REPORT_FORM_INIT, email:user?.email || "" }))
  const [sent, setSent] = useState(false)
  const [deliveryNotice, setDeliveryNotice] = useState("")
  const { saving, error, submitReport } = useProblemReports(user)

  const submit = async () => {
    if ((!form.title.trim() && !form.message.trim()) || saving) return
    try {
      const result = await submitReport({
        type: form.type,
        title: form.title,
        message: form.message,
        email: form.email,
        page: form.page,
        url: typeof window !== "undefined" ? window.location.href : "",
      })
      setDeliveryNotice(result?.emailSent
        ? "It also emailed alecorahoy@gmail.com."
        : "It is saved in the Admin problem report inbox.")
      setSent(true)
      setForm({ ...REPORT_FORM_INIT, email:user?.email || "" })
    } catch {
      // useProblemReports surfaces the user-facing error.
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{borderBottom:"1px solid #f1f5f9"}}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:GOLD,color:NAVY}}>
                <MessageCircle size={16}/>
              </div>
              <span className="text-xs font-black tracking-widest" style={{color:GOLD}}>REPORT</span>
            </div>
            <h2 className="text-xl font-black text-gray-900">Report a Problem</h2>
            <p className="text-xs text-gray-400 mt-0.5">Bugs, things not working, and feature suggestions.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-400"/>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {sent ? (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-5 text-center">
              <div className="font-black text-green-700">Report sent</div>
              <div className="text-sm text-green-600 mt-1">Thanks. {deliveryNotice}</div>
              <button onClick={onClose} className="mt-4 px-5 py-3 rounded-xl text-sm font-black text-white" style={{background:NAVY}}>
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    ["bug","Bug"],
                    ["not_working","Not Working"],
                    ["feature_suggestion","Feature Suggestion"],
                    ["other","Other"],
                  ].map(([id,label]) => (
                    <button key={id} onClick={()=>setForm(p=>({...p,type:id}))}
                      className="py-2.5 rounded-xl text-xs font-black border transition-all"
                      style={form.type===id ? {background:NAVY,color:"white",borderColor:NAVY} : {background:"#f8fafc",color:"#64748b",borderColor:"#e5e7eb"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Where is the problem?</Label>
                <select value={form.page} onChange={(e)=>setForm(p=>({...p,page:e.target.value}))}
                  className="w-full mt-1 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 bg-white">
                  {REPORT_PAGE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Current screen: {problemPageLabel(page)}. Choose Whole App if it affects everything.</p>
              </div>

              <div>
                <Label>Title</Label>
                <input value={form.title} onChange={(e)=>setForm(p=>({...p,title:e.target.value}))}
                  placeholder="Short summary"
                  className="w-full mt-1 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300"/>
              </div>

              <div>
                <Label>What happened?</Label>
                <textarea value={form.message} onChange={(e)=>setForm(p=>({...p,message:e.target.value}))}
                  placeholder="Tell us what broke, what you expected, or what feature you want..."
                  rows={5}
                  className="w-full mt-1 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 resize-none"/>
              </div>

              <div>
                <Label>Email</Label>
                <input value={form.email} onChange={(e)=>setForm(p=>({...p,email:e.target.value}))}
                  placeholder="Optional contact email"
                  className="w-full mt-1 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300"/>
              </div>

              {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={submit} disabled={saving || (!form.title.trim() && !form.message.trim())}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40"
                  style={{background:NAVY}}>
                  {saving ? "Sending..." : "Send Report"}
                </button>
              </div>
            </>
          )}
        </div>
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
  const [showReport,  setShowReport] = useState(false)

  // ── Auth ──
  const authHook = useAuth()
  const { user, logOut } = authHook
  const { entitlement } = useEntitlement(user)
  const { isAdmin, adminProfile, error: adminAccessError } = useAdminAccess(user)

  // ── Firestore (falls back to mock data when logged out) ──
  const { items: closetItems, addItem: addClosetItem, updateCloset, saving: closetSaving, error: closetError } = useCloset(user, CLOSET_ITEMS_INIT)

  useEffect(() => {
    if (!isAdmin && page === "admin") setPage("analyzer")
  }, [isAdmin, page])

  const NAV = [
    {id:"analyzer",  icon:Wand2,    label:"Analyzer"},
    {id:"validator", icon:Check,    label:"Validator"},
    {id:"closet",    icon:Shirt,    label:"Closet"},
    {id:"calendar",  icon:Calendar, label:"Calendar"},
    {id:"community", icon:Users,    label:"Community"},
    {id:"pricing",   icon:Tag,      label:"Upgrade"},
  ]
  if (isAdmin) NAV.push({id:"admin", icon:Shield, label:"Admin"})

  const Page = {analyzer:AnalyzerPage,validator:OutfitValidatorPage,closet:ClosetPage,calendar:CalendarPage,community:CommunityPage,pricing:PricingPage,admin:AdminPage}[page] || AnalyzerPage

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#f8fafc",fontFamily:"system-ui,-apple-system,sans-serif"}}>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={()=>setShowAuth(false)} useAuthHook={authHook}/>
      )}

      {showReport && (
        <ReportProblemModal user={user} page={page} onClose={()=>setShowReport(false)}/>
      )}

      {/* Desktop sidebar — collapsible, expands on hover */}
      <DesktopSidebarShell page={page} setPage={setPage} user={user} onAuthClick={()=>setShowAuth(true)} onLogOut={logOut}
        onReportProblem={()=>setShowReport(true)} entitlement={entitlement} isAdmin={isAdmin}/>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={()=>setSidebarOpen(false)}/>
          <div className="absolute left-0 top-0 h-full z-10">
            <Sidebar page={page} setPage={setPage} mobile onClose={()=>setSidebarOpen(false)}
              user={user} onAuthClick={()=>{setShowAuth(true);setSidebarOpen(false)}} onLogOut={logOut}
              onReportProblem={()=>setShowReport(true)} entitlement={entitlement} isAdmin={isAdmin}/>
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
          <Page
            closetItems={closetItems}
            setClosetItems={updateCloset}
            addClosetItem={addClosetItem}
            user={user}
            closetSaving={closetSaving}
            closetError={closetError}
            entitlement={entitlement}
            isAdmin={isAdmin}
            adminProfile={adminProfile}
            adminAccessError={adminAccessError}
            setPage={setPage}
            onAuthClick={()=>setShowAuth(true)}
          />
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
 


