"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/* ─── TYPES ───────────────────────────────────────────────────────────────── */
type Cat = "trending" | "finger" | "more" | "family" | "party";
type View = "home" | "detail" | "setup" | "playing" | "profile";
type AuthStep = "choose" | "email" | "phone" | "otp";

interface Game {
  id: string; name: string; emoji: string; cat: Cat;
  desc: string; tagline: string; min: number; max: number;
  premium: boolean; grad: string; color: string;
}
interface Player { id: string; name: string; score: number; }
interface Profile {
  name: string; email: string; avatar: string;
  premium: boolean; gamesPlayed: number; wins: number; streak: number;
}

/* ─── AVATARS ─────────────────────────────────────────────────────────────── */
const AVATARS = ["🦁","🐯","🐺","🦊","🐻","🐼","🐨","🐮","🐷","🐸",
  "🦅","🦉","🦋","🐙","🦈","🐲","🦄","🐬","🦩","🦚","🎃","👻","🤖","💎"];

/* ─── CATEGORIES ──────────────────────────────────────────────────────────── */
const CATS: { id: Cat; label: string; emoji: string }[] = [
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "finger",   label: "Finger",   emoji: "☝️" },
  { id: "more",     label: "More",     emoji: "🎮" },
  { id: "family",   label: "Family",   emoji: "👨‍👩‍👧‍👦" },
  { id: "party",    label: "Party",    emoji: "🎉" },
];

/* ─── GAMES (25) ──────────────────────────────────────────────────────────── */
const GAMES: Game[] = [
  // Trending
  { id:"imposter",    name:"Imposter",          emoji:"🕵️", cat:"trending", desc:"One player gets a different word. Spot them before they blend in!", tagline:"Who doesn't belong?",           min:3,  max:12, premium:true,  grad:"linear-gradient(135deg,#667eea,#764ba2)", color:"#764ba2" },
  { id:"never",       name:"Never Have I Ever",  emoji:"🍻", cat:"trending", desc:"Share things you've never done. Find out who's the wildest!",      tagline:"How wild are you really?",      min:2,  max:20, premium:false, grad:"linear-gradient(135deg,#f093fb,#f5576c)", color:"#f5576c" },
  { id:"truth-dare",  name:"Truth or Dare",      emoji:"🎯", cat:"trending", desc:"Choose truth and spill the tea, or accept a wild dare!",           tagline:"The classic party game",        min:2,  max:20, premium:false, grad:"linear-gradient(135deg,#4facfe,#00f2fe)", color:"#4facfe" },
  { id:"who-room",    name:"Who In The Room",    emoji:"👁️", cat:"trending", desc:"Everyone votes on who fits the description. No hiding!",           tagline:"Point the finger",              min:3,  max:20, premium:true,  grad:"linear-gradient(135deg,#43e97b,#38f9d7)", color:"#43e97b" },
  { id:"hot-seat",    name:"Hot Seat",           emoji:"🔥", cat:"trending", desc:"One player answers rapid questions from everyone else!",            tagline:"Can you take the heat?",        min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#fa709a,#fee140)", color:"#fa709a" },
  { id:"2-truths",    name:"2 Truths 1 Lie",     emoji:"🤥", cat:"trending", desc:"Share two truths and one lie. Can anyone spot the fake?",          tagline:"Who's the liar?",               min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#a18cd1,#fbc2eb)", color:"#a18cd1" },
  { id:"spin-wheel",  name:"Spin the Wheel",     emoji:"🎡", cat:"trending", desc:"Spin to pick a random player or action. Luck decides your fate!",  tagline:"Let fate decide",               min:2,  max:12, premium:false, grad:"linear-gradient(135deg,#fccb90,#d57eeb)", color:"#d57eeb" },
  { id:"would-rather",name:"Would You Rather",   emoji:"🤔", cat:"trending", desc:"Choose between two impossible scenarios. No easy answers!",        tagline:"Hard choices only",             min:2,  max:20, premium:false, grad:"linear-gradient(135deg,#89f7fe,#66a6ff)", color:"#66a6ff" },
  { id:"paranoia",    name:"Paranoia",           emoji:"😬", cat:"trending", desc:"Whisper a question, flip a coin — heads means reveal!",           tagline:"Should you know?",              min:3,  max:20, premium:true,  grad:"linear-gradient(135deg,#a1c4fd,#c2e9fb)", color:"#6c92e0" },
  { id:"werewolf",    name:"Werewolf",           emoji:"🐺", cat:"trending", desc:"Social deduction at its finest. Find the wolves before dawn!",    tagline:"Trust no one",                  min:5,  max:20, premium:true,  grad:"linear-gradient(135deg,#4b6cb7,#182848)", color:"#4b6cb7" },
  // Finger
  { id:"finger-spin", name:"Finger Spinner",     emoji:"☝️", cat:"finger",   desc:"All players place a finger. One random finger gets chosen!",       tagline:"Whose finger is it?",           min:2,  max:10, premium:false, grad:"linear-gradient(135deg,#fd7743,#fd3a2d)", color:"#fd7743" },
  { id:"most-likely", name:"Most Likely To",     emoji:"🏆", cat:"finger",   desc:"Vote on who is most likely to do something outrageous!",           tagline:"Who would do it?",              min:3,  max:20, premium:false, grad:"linear-gradient(135deg,#f7971e,#ffd200)", color:"#f7971e" },
  { id:"dare-roulette",name:"Dare Roulette",     emoji:"🎲", cat:"finger",   desc:"Spin for a dare. Whatever it lands on, you must complete!",        tagline:"No backing out",                min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#30cfd0,#330867)", color:"#30cfd0" },
  // More
  { id:"charades",    name:"Charades",           emoji:"🎭", cat:"more",     desc:"Act out words or phrases without speaking a single word!",         tagline:"Silence is golden",             min:2,  max:20, premium:false, grad:"linear-gradient(135deg,#e0c3fc,#8ec5fc)", color:"#8ec5fc" },
  { id:"rapid-fire",  name:"Rapid Fire",         emoji:"⚡", cat:"more",     desc:"Answer as many questions as you can before the clock runs out!",   tagline:"Think fast!",                   min:1,  max:20, premium:true,  grad:"linear-gradient(135deg,#f6d365,#fda085)", color:"#fda085" },
  { id:"word-assoc",  name:"Word Association",   emoji:"💭", cat:"more",     desc:"Say the first word that pops in your head. Keep the chain alive!", tagline:"First thought wins",            min:2,  max:20, premium:false, grad:"linear-gradient(135deg,#84fab0,#8fd3f4)", color:"#84fab0" },
  // Family
  { id:"trivia",      name:"Trivia Battle",      emoji:"🧠", cat:"family",   desc:"Test your knowledge against friends in rapid-fire trivia!",        tagline:"Battle of the brains",          min:2,  max:20, premium:false, grad:"linear-gradient(135deg,#5ee7df,#b490ca)", color:"#5ee7df" },
  { id:"categories",  name:"Categories",         emoji:"📋", cat:"family",   desc:"Name as many things in the category as you can before time's up!", tagline:"How many can you name?",        min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#d4fc79,#96e6a1)", color:"#5aaa6a" },
  { id:"draw-it",     name:"Draw It!",           emoji:"🎨", cat:"family",   desc:"Draw the word, others guess what you're drawing!",                 tagline:"Can they guess your art?",      min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#f093fb,#f5576c)", color:"#f093fb" },
  { id:"hot-potato",  name:"Hot Potato",         emoji:"🥔", cat:"family",   desc:"Pass it around — whoever holds it when the timer stops, loses!",  tagline:"Don't get caught!",             min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#fccb90,#e07b39)", color:"#e07b39" },
  { id:"mime-it",     name:"Mime It",            emoji:"🤡", cat:"family",   desc:"Act it out silently. No words, no sounds, pure mime!",             tagline:"Actions speak louder",          min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#a18cd1,#fbc2eb)", color:"#a18cd1" },
  { id:"story-builder",name:"Story Builder",    emoji:"📖", cat:"family",   desc:"Build a story together, one sentence at a time!",                  tagline:"Your story, their twist",       min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#89f7fe,#66a6ff)", color:"#66a6ff" },
  // Party
  { id:"this-or-that",name:"This or That",       emoji:"⚖️", cat:"party",    desc:"Quick binary choices — no wrong answers, just your vibe!",         tagline:"Make the tough calls",          min:1,  max:20, premium:false, grad:"linear-gradient(135deg,#fd7743,#fd3a2d)", color:"#fd7743" },
  { id:"accent",      name:"Accent Challenge",   emoji:"🗣️", cat:"party",    desc:"Read phrases in hilarious different accents. Funnier is better!",  tagline:"Funny voices only",             min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#4facfe,#00f2fe)", color:"#4facfe" },
  { id:"freeze",      name:"Freeze!",            emoji:"🧊", cat:"party",    desc:"Everyone freezes when the signal hits. Last to freeze is out!",    tagline:"Don't. Move.",                  min:3,  max:50, premium:true,  grad:"linear-gradient(135deg,#43e97b,#38f9d7)", color:"#43e97b" },
  { id:"vibe-check",  name:"Vibe Check",         emoji:"✨", cat:"party",    desc:"Rate the room's energy, assign vibes, find your squad spirit!",    tagline:"What's the vibe?",              min:2,  max:20, premium:true,  grad:"linear-gradient(135deg,#667eea,#764ba2)", color:"#667eea" },
];

/* ─── CONTENT ─────────────────────────────────────────────────────────────── */
const C = {
  never: ["Never have I ever lied to my boss","Never have I ever cheated on a test","Never have I ever ghosted someone for no reason","Never have I ever sent a risky text to the wrong person","Never have I ever pretended to be sick","Never have I ever stalked an ex on social media","Never have I ever eaten food off the floor","Never have I ever hidden in the bathroom to avoid someone","Never have I ever regifted a present","Never have I ever faked a phone call to escape a conversation","Never have I ever called someone by the wrong name on a date","Never have I ever forgotten an important birthday","Never have I ever accidentally liked an old photo while stalking","Never have I ever lied about my age","Never have I ever blamed a smell on someone else","Never have I ever cancelled plans at the last minute for no reason","Never have I ever cried at a movie I said wouldn't affect me","Never have I ever waved back at someone who wasn't waving at me","Never have I ever been asked to leave somewhere","Never have I ever pretended to know a song I didn't"],
  truths: ["What's the most embarrassing thing that's ever happened to you?","What's a secret you've never told anyone in this room?","Who here do you find the most attractive?","What's the most trouble you've ever gotten into?","Have you ever lied to someone in this room?","What's the worst date you've ever been on?","What's something you've done that you'd never tell your parents?","Who was your biggest crush that nobody knows about?","What's the most childish thing you still do?","What's the most money you've wasted on something stupid?","What's one thing you'd change about yourself?","What's the weirdest dream you've ever had?","Have you ever cheated in any way?","What's your biggest fear?","Who in this room do you trust the least?"],
  dares: ["Do your best impression of someone in the room","Let the group look through your phone for 60 seconds","Text your crush something embarrassing right now","Do 10 pushups right now","Speak in a foreign accent for the next 2 rounds","Let someone else post on your social media","Call a family member and tell them a joke","Do your best TikTok dance right now","Let someone write a text to anyone in your contacts","Sit on the floor for the next 3 rounds","Compliment every single person in the room","Do your best celebrity impression","Let the group give you a nickname for the rest of the night","Say something nice about everyone here","Let someone else style your hair for 5 minutes"],
  wouldRather: [["Be invisible for a day","Be able to fly for a day"],["Always be 10 min late","Always be 20 min early"],["Have no internet for a year","Have no phone for a year"],["Only whisper forever","Only shout forever"],["Never sleep again","Never eat again"],["Know when you'll die","Know how you'll die"],["Unlimited money, no time","Unlimited time, no money"],["Only sweet food forever","Only spicy food forever"],["Be famous but hated","Be unknown but deeply loved"],["Travel the world alone","Never leave home but with perfect friends"],["Always be freezing cold","Always be uncomfortably hot"],["Speak every language","Play every instrument perfectly"],["Be the funniest person in the room","Be the smartest person in the room"],["Time travel to the past","Time travel to the future"],["Have no sense of smell","Have no sense of taste"]],
  whoRoom: ["Who is most likely to become famous?","Who would survive longest in a zombie apocalypse?","Who is the biggest drama queen/king?","Who would be the worst at keeping a secret?","Who would win in an arm wrestle?","Who is most likely to be arrested one day?","Who is secretly the messiest person here?","Who is most likely to be on a reality TV show?","Who would survive longest on a desert island?","Who has the biggest ego in this room?","Who would be the best parent?","Who is most likely to cry at a movie tonight?","Who here is hiding the most secrets?","Who gives the absolute worst advice?","Who is most likely to go viral for something embarrassing?"],
  hotSeat: ["What's your biggest pet peeve about someone in this room?","Do you have a secret crush on anyone right now?","What's the most embarrassing thing you've ever done?","What would you change about yourself if you could?","Have you ever dated someone just for their looks?","What's your biggest insecurity?","What's the worst lie you've ever told?","Who in this room do you trust the least, and why?","What's a habit you're embarrassed about?","What's the most extreme thing you'd do for money?"],
  paranoia: ["Who would you call if you needed help hiding a body?","Who here is worst at keeping secrets?","Who has the most fake personality in this room?","Who would you trust least with your diary?","Who here brags the most?","Who has the worst taste in music?","Who would you never want to be stranded with?","Who is most likely to secretly talk trash about their friends?","Who has the messiest love life here?","Who would be the worst business partner?"],
  imposterWords: [["Beach","Pool"],["Dog","Cat"],["Coffee","Tea"],["Car","Bus"],["Pizza","Burger"],["Doctor","Nurse"],["Summer","Spring"],["Mountain","Hill"],["Ocean","Lake"],["Guitar","Violin"],["Castle","Palace"],["Lion","Tiger"],["Apple","Pear"],["Detective","Police Officer"],["Chef","Baker"],["Moon","Star"],["Ship","Boat"],["Forest","Jungle"],["Cinema","Theatre"],["Sushi","Tacos"]],
  charades: ["Moonwalk","Swimming","Playing air guitar","Riding a horse","Surfing a huge wave","Eating spaghetti","Blowing up a balloon","Making a pizza","Rock climbing","Playing tennis","Hailing a cab in the rain","Opening a very stuck jar","Building a sandcastle","Tightrope walking","Conducting an orchestra","Catching butterflies","Using a vending machine","Rowing a boat","Skateboarding downhill","Doing yoga on a beach"],
  rapidFire: ["Cats or dogs?","Morning or night?","Hot or cold?","City or country?","Text or call?","Instagram or TikTok?","Plane or road trip?","Mountains or beach?","Coffee or tea?","Netflix or going out?","Summer or winter?","Sweet or savory?","Plan it or spontaneous?","Introvert or extrovert?","Saver or spender?","Logic or feelings?","Leader or follower?","Fiction or non-fiction?","Fast or slow?","Night in or night out?"],
  wordStarts: ["Banana","Space","Fire","Ocean","Love","Money","Party","Dream","Ice","Gold","Storm","Magic","Wild","Blue","Time"],
  trivia: [
    {q:"Capital of France?",a:"Paris",opts:["Madrid","Paris","Berlin","Rome"]},
    {q:"Largest planet in our solar system?",a:"Jupiter",opts:["Jupiter","Saturn","Neptune","Uranus"]},
    {q:"Who painted the Mona Lisa?",a:"Da Vinci",opts:["Da Vinci","Picasso","Michelangelo","Rembrandt"]},
    {q:"Year the first iPhone launched?",a:"2007",opts:["2005","2006","2007","2008"]},
    {q:"How many continents on Earth?",a:"7",opts:["5","6","7","8"]},
    {q:"Chemical symbol for Gold?",a:"Au",opts:["Go","Gd","Au","Ag"]},
    {q:"Strings on a standard guitar?",a:"6",opts:["4","5","6","7"]},
    {q:"Longest river in the world?",a:"Nile",opts:["Amazon","Nile","Mississippi","Yangtze"]},
    {q:"Language with most native speakers?",a:"Mandarin",opts:["English","Spanish","Hindi","Mandarin"]},
    {q:"WWII ended in which year?",a:"1945",opts:["1943","1944","1945","1946"]},
    {q:"H₂O is commonly known as?",a:"Water",opts:["Hydrogen","Oxygen","Water","Helium"]},
    {q:"Sides on a hexagon?",a:"6",opts:["5","6","7","8"]},
    {q:"Planet closest to the Sun?",a:"Mercury",opts:["Venus","Mercury","Mars","Earth"]},
    {q:"Who wrote Romeo and Juliet?",a:"Shakespeare",opts:["Dickens","Shakespeare","Tolstoy","Hugo"]},
    {q:"Players in a soccer team?",a:"11",opts:["9","10","11","12"]},
  ],
  categories: ["Things in a kitchen","Animals that fly","Countries in Europe","Things that are red","Famous movie sequels","Sports with a ball","Things at a beach","Breakfast foods","Things you do every morning","Famous painters","Video game characters","Types of pasta","Things in a hospital","Car brands","Countries starting with S"],
  drawIt: ["Rollercoaster","Tornado","Haunted house","Submarine","Fireworks","Hot air balloon","Waterfall","Erupting volcano","Rainbow","Quicksand","Solar eclipse","Pirate ship","Space station","Time machine","Bermuda triangle"],
  mimeIt: ["A chicken laying an egg","Someone stuck in quicksand","A conductor","Someone walking into glass","Fishing from a pier","Opening an impossible jar","A baby learning to walk","Playing an invisible piano","Eating soup with chopsticks","Texting while walking","A cat stretching","Being blown by heavy wind","Swimming in mud","Walking on the moon","Eating a too-big burger"],
  storyPrompts: ["Once upon a time, there was a very unusual","Nobody expected what happened when","The strangest thing about that day was","Out of nowhere, a mysterious","Everyone was shocked to discover","The adventure really began when","Things took a sudden turn when","The hero then decided to","Just when all hope seemed lost,","And that's how they ended up"],
  thisOrThat: [["Ketchup 🍅","Mustard 💛"],["Morning 🌅","Night 🦉"],["Introvert 🏠","Extrovert 🎉"],["Comedy 😂","Horror 😱"],["Beer 🍺","Wine 🍷"],["Heels 👠","Sneakers 👟"],["Save 💰","Spend 💸"],["Dogs 🐶","Cats 🐱"],["Summer ☀️","Winter ❄️"],["Brunch 🥞","Late dinner 🍝"],["Street food 🌮","Fine dining 🍽️"],["Book 📚","Movie 🎬"],["Adventure 🗺️","Relaxation 🛋️"],["Text 📱","Call 📞"],["Mountains ⛰️","Beach 🏖️"]],
  accents: [
    {accent:"British 🇬🇧",phrases:["I fancy a cup of tea and some crumpets","Oh blimey, that was absolutely brilliant!","Would you like to pop round for supper tonight?","I'm absolutely knackered after all that"]},
    {accent:"Australian 🇦🇺",phrases:["Chuck another shrimp on the barbie, mate!","She'll be right, no worries at all!","Fair dinkum, that was a ripper of a day!","We had a great arvo down at the servo"]},
    {accent:"American Southern 🤠",phrases:["Well I'll be a monkey's uncle, bless your heart!","Fixin' to head on down to the store real quick","That there is sweeter than sweet tea on a hot day","Y'all come back now, ya hear?"]},
    {accent:"French 🇫🇷",phrases:["Zis is ze most beautiful sing I 'ave ever seen!","Ooh la la, c'est absolument magnifique!","I am so 'ungry I could eat ze 'ole baguette","But of course, we French know ze best cuisine"]},
    {accent:"Pirate 🏴‍☠️",phrases:["Arrr, ye scallywags better walk the plank!","Shiver me timbers, it be a fine day to sail!","Ahoy there matey, what be yer name?","Blimey, I spotted treasure on yonder island!"]},
  ],
  vibeCheck: ["Rate the energy in this room right now from 1-10","This group has the vibe of: 🎪 Circus / 🏡 Cozy home / 🎮 Game night / 🎭 Drama club","If this group were a movie genre, what would it be?","Rate each other's 'main character energy' right now","What's our collective mood? 😴 Sleepy → 🤪 Chaotic","How would you describe tonight's vibe in one emoji?","Is this group more 🌊 Go with the flow or 📋 Stick to the plan?","What snack best represents the current mood of this group?","Tonight's theme song would be... (everyone names one)","This group's spirit animal tonight is..."],
  mostLikelyTo: ["Most likely to accidentally text the wrong person","Most likely to become a millionaire","Most likely to get lost in a foreign country","Most likely to forget your birthday","Most likely to be on a reality TV show","Most likely to eat an entire pizza alone at 2am","Most likely to be arrested at an airport","Most likely to go viral for something embarrassing","Most likely to cry at a movie tonight","Most likely to become president","Most likely to still be up at 4am","Most likely to start a random business","Most likely to be last standing at a party","Most likely to accidentally start a fire cooking","Most likely to become internet famous"],
  dareRoulette: ["Do your best robot dance for 30 seconds","Let someone draw on your face with a marker","Text 'I love you' to the 5th person in your contacts","Do a full impression of the person on your left","Share the most embarrassing photo in your camera roll","Speak only in questions for the next 3 rounds","Give a 60-second speech on why you're the best person here","Do 15 jumping jacks right now","Share the last thing you searched on your phone","Let someone else choose your next drink or snack","Call someone and sing them happy birthday","Let the group scroll your recent texts for 30 seconds","Do your best news anchor impression for 1 minute","Let someone style your hair however they want","Send a voice note saying whatever the group decides"],
};

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function useTimer(sec: number, onDone?: () => void) {
  const [t, setT] = useState(sec);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!running) return;
    if (t <= 0) { setRunning(false); onDone?.(); return; }
    ref.current = setTimeout(() => setT(n => n - 1), 1000);
    return () => clearTimeout(ref.current);
  }, [t, running]);
  return {
    t, running,
    start: (initial?: number) => { setT(initial ?? sec); setRunning(true); },
    stop:  () => setRunning(false),
    reset: () => { setT(sec); setRunning(false); },
  };
}

/* ─── PROMPT CARD GAME ────────────────────────────────────────────────────── */
function PromptGame({ prompts, accent, footer }: { prompts: string[]; accent?: string; footer?: string }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * prompts.length));
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24, padding:"24px 0" }}>
      <div className="pg-prompt-card" style={accent ? { borderColor: accent + "44" } : {}}>
        <p style={{ fontSize:22, fontWeight:600, textAlign:"center", lineHeight:1.4 }}>
          {prompts[idx % prompts.length]}
        </p>
      </div>
      {footer && <p style={{ fontSize:13, color:"var(--t2)", textAlign:"center" }}>{footer}</p>}
      <button className="pg-btn-primary" onClick={() => setIdx(i => (i + 1) % prompts.length)}>
        Next →
      </button>
    </div>
  );
}

/* ─── NEVER HAVE I EVER ───────────────────────────────────────────────────── */
function NeverGame() {
  return <PromptGame prompts={C.never} footer="Drink / lose a point if you HAVE done it!" />;
}

/* ─── TRUTH OR DARE ───────────────────────────────────────────────────────── */
function TruthDareGame() {
  const [mode, setMode] = useState<"truth"|"dare"|null>(null);
  const [idx, setIdx] = useState(0);
  if (!mode) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:32 }}>
      <p style={{ fontSize:18, color:"var(--t2)", marginBottom:8 }}>What will it be?</p>
      <div style={{ display:"flex", gap:16 }}>
        <button className="pg-choice-btn" style={{ background:"linear-gradient(135deg,#4facfe,#00f2fe)" }} onClick={() => { setMode("truth"); setIdx(Math.floor(Math.random()*C.truths.length)); }}>
          <span style={{ fontSize:32 }}>💬</span>
          <span style={{ fontWeight:700, fontSize:18 }}>Truth</span>
        </button>
        <button className="pg-choice-btn" style={{ background:"linear-gradient(135deg,#f5576c,#f093fb)" }} onClick={() => { setMode("dare"); setIdx(Math.floor(Math.random()*C.dares.length)); }}>
          <span style={{ fontSize:32 }}>🔥</span>
          <span style={{ fontWeight:700, fontSize:18 }}>Dare</span>
        </button>
      </div>
    </div>
  );
  const list = mode === "truth" ? C.truths : C.dares;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <span className="pg-mode-badge" style={{ background: mode==="truth" ? "rgba(79,172,254,0.2)" : "rgba(245,87,108,0.2)", color: mode==="truth" ? "#4facfe" : "#f5576c" }}>{mode === "truth" ? "💬 Truth" : "🔥 Dare"}</span>
      <div className="pg-prompt-card">
        <p style={{ fontSize:20, fontWeight:600, textAlign:"center", lineHeight:1.4 }}>{list[idx % list.length]}</p>
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button className="pg-btn-ghost" onClick={() => setMode(null)}>Switch</button>
        <button className="pg-btn-primary" onClick={() => { setIdx(i => (i+1)%list.length); }}>Next →</button>
      </div>
    </div>
  );
}

/* ─── WHO IN THE ROOM ─────────────────────────────────────────────────────── */
function WhoRoomGame() {
  return <PromptGame prompts={C.whoRoom} footer="Everyone points at someone simultaneously on 3-2-1!" />;
}

/* ─── HOT SEAT ────────────────────────────────────────────────────────────── */
function HotSeatGame({ players }: { players: Player[] }) {
  const [playerIdx, setPlayerIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const current = players[playerIdx % players.length];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 20px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        <span style={{ fontSize:20 }}>🔥</span>
        <span style={{ fontWeight:600 }}>{current.name} is in the hot seat!</span>
      </div>
      <div className="pg-prompt-card">
        <p style={{ fontSize:20, fontWeight:600, textAlign:"center", lineHeight:1.4 }}>{C.hotSeat[qIdx % C.hotSeat.length]}</p>
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button className="pg-btn-ghost" onClick={() => setPlayerIdx(i => i+1)}>Next player</button>
        <button className="pg-btn-primary" onClick={() => setQIdx(i => i+1)}>Next question →</button>
      </div>
    </div>
  );
}

/* ─── 2 TRUTHS 1 LIE ──────────────────────────────────────────────────────── */
function TwoTruthsGame({ players }: { players: Player[] }) {
  const [step, setStep] = useState<"write"|"guess"|"reveal">("write");
  const [playerIdx, setPlayerIdx] = useState(0);
  const [stmts, setStmts] = useState(["","",""]);
  const [lieIdx, setLieIdx] = useState(0);
  const [shuffled, setShuffled] = useState<{text:string;origIdx:number}[]>([]);
  const [guessed, setGuessed] = useState<number|null>(null);
  const current = players[playerIdx % players.length];

  const submit = () => {
    const s = stmts.map((text,origIdx) => ({text, origIdx}));
    setShuffled(shuffle(s));
    setStep("guess");
  };
  const reveal = (idx: number) => { setGuessed(idx); setStep("reveal"); };
  const nextPlayer = () => { setStep("write"); setStmts(["","",""]); setLieIdx(0); setGuessed(null); setPlayerIdx(i => i+1); };

  if (step === "write") return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, paddingTop:16 }}>
      <p style={{ textAlign:"center", color:"var(--t2)" }}><b style={{ color:"var(--text)" }}>{current.name}</b>, enter 2 truths and 1 lie</p>
      {stmts.map((s,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setLieIdx(i)} style={{ fontSize:18, flexShrink:0, width:36, height:36, borderRadius:"50%", border:`2px solid ${lieIdx===i?"#f5576c":"rgba(255,255,255,0.15)"}`, background:lieIdx===i?"rgba(245,87,108,0.15)":"transparent", cursor:"pointer" }}>
            {lieIdx===i?"🤥":"✓"}
          </button>
          <input className="pg-input" value={s} onChange={e => setStmts(ss => ss.map((x,j) => j===i ? e.target.value : x))} placeholder={lieIdx===i ? `Statement ${i+1} (this is your LIE)` : `Statement ${i+1} (truth)`} />
        </div>
      ))}
      <p style={{ fontSize:12, color:"var(--t2)", textAlign:"center" }}>Tap 🤥 to mark which one is the lie</p>
      <button className="pg-btn-primary" disabled={stmts.some(s=>!s.trim())} onClick={submit}>Show to others →</button>
    </div>
  );

  if (step === "guess") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, paddingTop:16 }}>
      <p style={{ textAlign:"center", color:"var(--t2)" }}>Which one is <b style={{ color:"#f5576c" }}>{current.name}&apos;s</b> lie?</p>
      {shuffled.map((s,i) => (
        <button key={i} className="pg-option-btn" onClick={() => reveal(i)}>{s.text}</button>
      ))}
    </div>
  );

  const correct = shuffled[guessed!]?.origIdx === lieIdx;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ fontSize:64 }}>{correct ? "✅" : "❌"}</div>
      <p style={{ fontSize:20, fontWeight:700, textAlign:"center" }}>{correct ? "Correct! You spotted the lie!" : "Wrong! You were fooled!"}</p>
      <p style={{ color:"var(--t2)", textAlign:"center" }}>The lie was: <b style={{ color:"#f5576c" }}>{stmts[lieIdx]}</b></p>
      <button className="pg-btn-primary" onClick={nextPlayer}>Next player →</button>
    </div>
  );
}

/* ─── SPIN THE WHEEL ──────────────────────────────────────────────────────── */
const WHEEL_COLORS = ["#f5576c","#f7971e","#43e97b","#4facfe","#a18cd1","#fccb90","#89f7fe","#fa709a","#30cfd0","#d57eeb","#84fab0","#fee140"];
function SpinWheelGame({ players }: { players: Player[] }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string|null>(null);
  const n = players.length;

  const spin = () => {
    if (spinning || n < 2) return;
    const extra = 1440 + Math.random() * 720;
    const next = rotation + extra;
    setRotation(next);
    setSpinning(true);
    setWinner(null);
    setTimeout(() => {
      setSpinning(false);
      const norm = next % 360;
      const degPer = 360 / n;
      const idx = Math.floor(((360 - norm) % 360) / degPer) % n;
      setWinner(players[idx].name);
    }, 3200);
  };

  const slices = players.map((p, i) => {
    const a1 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x1 = Math.cos(a1) * 90, y1 = Math.sin(a1) * 90;
    const x2 = Math.cos(a2) * 90, y2 = Math.sin(a2) * 90;
    const large = 1 / n > 0.5 ? 1 : 0;
    const mid = (a1 + a2) / 2;
    return { p, color: WHEEL_COLORS[i % WHEEL_COLORS.length], path: `M0 0 L${x1} ${y1} A90 90 0 ${large} 1 ${x2} ${y2}Z`, tx: Math.cos(mid)*58, ty: Math.sin(mid)*58 };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      <div style={{ position:"relative", width:220, height:220 }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) translateY(-10px)", fontSize:24, zIndex:10 }}>▼</div>
        <svg viewBox="-100 -100 200 200" width={220} height={220} style={{ transform:`rotate(${rotation}deg)`, transition: spinning ? "transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)" : "none" }}>
          {slices.map((s,i) => (
            <g key={i}>
              <path d={s.path} fill={s.color} stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
              <text x={s.tx} y={s.ty} textAnchor="middle" dominantBaseline="middle" fontSize={n>6?"7":"9"} fill="white" fontWeight="700" style={{ pointerEvents:"none" }}>
                {s.p.name.slice(0,8)}
              </text>
            </g>
          ))}
          <circle r="12" fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
          <text textAnchor="middle" dominantBaseline="middle" fontSize="10">🎯</text>
        </svg>
      </div>
      {winner && <div className="pg-winner-badge">🎉 {winner}!</div>}
      <button className="pg-btn-primary" onClick={spin} disabled={spinning}>{spinning ? "Spinning…" : "Spin!"}</button>
    </div>
  );
}

/* ─── WOULD YOU RATHER ────────────────────────────────────────────────────── */
function WouldRatherGame() {
  const [idx, setIdx] = useState(0);
  const [voted, setVoted] = useState<number|null>(null);
  const [counts, setCounts] = useState([0,0]);
  const pair = C.wouldRather[idx % C.wouldRather.length];
  const total = counts[0] + counts[1];
  const vote = (side: number) => { if (voted !== null) return; setVoted(side); setCounts(c => c.map((v,i) => i===side ? v+1 : v) as [number,number]); };
  const next = () => { setIdx(i => i+1); setVoted(null); setCounts([0,0]); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, paddingTop:8 }}>
      <p style={{ textAlign:"center", fontSize:13, color:"var(--t2)" }}>Would you rather…</p>
      {pair.map((opt,i) => (
        <button key={i} onClick={() => vote(i)} className={`pg-wyr-btn ${voted===i?"pg-wyr-selected":""}`} style={voted!==null ? { opacity: voted===i?1:0.6 } : {}}>
          <span style={{ fontSize:17, fontWeight:600, flex:1, textAlign:"left" }}>{opt}</span>
          {voted !== null && (
            <span style={{ fontSize:13, fontWeight:700, color: voted===i?"#fff":"var(--t2)", whiteSpace:"nowrap" }}>
              {total > 0 ? Math.round(counts[i]/total*100) : 0}%
            </span>
          )}
        </button>
      ))}
      {voted !== null && <button className="pg-btn-primary" onClick={next}>Next →</button>}
      {voted === null && <p style={{ textAlign:"center", fontSize:12, color:"var(--t2)" }}>Tap to vote</p>}
    </div>
  );
}

/* ─── PARANOIA ────────────────────────────────────────────────────────────── */
function ParanoiaGame() {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState<boolean|null>(null);
  const [flipping, setFlipping] = useState(false);
  const flip = () => {
    setFlipping(true);
    setTimeout(() => { setFlipped(Math.random() > 0.5); setFlipping(false); }, 600);
  };
  const next = () => { setIdx(i => i+1); setFlipped(null); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div className="pg-prompt-card" style={{ minHeight:100 }}>
        <p style={{ fontSize:18, fontWeight:600, textAlign:"center", lineHeight:1.4, color:"var(--t2)" }}>Whisper to the person next to you:</p>
        <p style={{ fontSize:18, fontWeight:700, textAlign:"center", marginTop:8 }}>{C.paranoia[idx % C.paranoia.length]}</p>
      </div>
      {flipped === null ? (
        <button className="pg-btn-primary" onClick={flip} disabled={flipping}>{flipping ? "🪙 Flipping…" : "🪙 Flip the Coin"}</button>
      ) : (
        <>
          <div style={{ fontSize:64, animation:"bounce-in 0.4s ease" }}>{flipped ? "😱" : "😅"}</div>
          <p style={{ fontSize:20, fontWeight:700, textAlign:"center" }}>{flipped ? "HEADS — Reveal the answer!" : "TAILS — The secret stays!"}</p>
          <button className="pg-btn-primary" onClick={next}>Next →</button>
        </>
      )}
    </div>
  );
}

/* ─── IMPOSTER ────────────────────────────────────────────────────────────── */
function ImposterGame({ players }: { players: Player[] }) {
  const [wordPair] = useState(() => pick(C.imposterWords));
  const [imposterIdx] = useState(() => Math.floor(Math.random() * players.length));
  const [revealed, setRevealed] = useState<number[]>([]);
  const [showing, setShowing] = useState<number|null>(null);

  useEffect(() => {
    if (showing !== null) {
      const t = setTimeout(() => { setRevealed(r => [...r, showing]); setShowing(null); }, 2500);
      return () => clearTimeout(t);
    }
  }, [showing]);

  const allRevealed = revealed.length === players.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, paddingTop:16 }}>
      <p style={{ textAlign:"center", color:"var(--t2)", fontSize:14 }}>Each player taps their card to secretly see their word.</p>
      {players.map((p, i) => {
        const isShowing = showing === i;
        const isDone = revealed.includes(i);
        const word = i === imposterIdx ? wordPair[1] : wordPair[0];
        return (
          <button key={p.id} className="pg-player-reveal-btn" onClick={() => { if (!isDone && showing === null) setShowing(i); }}
            style={{ opacity: isDone ? 0.5 : 1 }}>
            <span style={{ fontSize:18 }}>{isDone ? "✅" : isShowing ? "👁️" : "🃏"}</span>
            <span style={{ fontWeight:600 }}>{p.name}</span>
            <span style={{ marginLeft:"auto", fontSize:18, color:"#4facfe", fontWeight:700 }}>
              {isShowing ? word : isDone ? "seen" : "tap"}
            </span>
          </button>
        );
      })}
      {allRevealed && (
        <div className="pg-prompt-card" style={{ marginTop:8, borderColor:"rgba(245,87,108,0.3)" }}>
          <p style={{ textAlign:"center", fontWeight:600 }}>Now discuss! 🕵️ Find the imposter!</p>
          <p style={{ textAlign:"center", fontSize:13, color:"var(--t2)", marginTop:4 }}>One player has a different word — who is it?</p>
        </div>
      )}
    </div>
  );
}

/* ─── WEREWOLF ────────────────────────────────────────────────────────────── */
const WW_ROLES = [
  { role:"Werewolf", emoji:"🐺", desc:"Kill a villager each night. Stay hidden!" },
  { role:"Villager", emoji:"👤", desc:"Find and eliminate the werewolves!" },
  { role:"Seer",     emoji:"🔮", desc:"Each night, learn if one player is a wolf." },
  { role:"Doctor",   emoji:"💊", desc:"Each night, save one player from being killed." },
  { role:"Hunter",   emoji:"🏹", desc:"If eliminated, you take someone with you!" },
  { role:"Witch",    emoji:"🧙", desc:"One heal potion, one poison potion." },
];
function WerewolfGame({ players }: { players: Player[] }) {
  const [assignments] = useState(() => {
    const n = players.length;
    const roles: typeof WW_ROLES[0][] = [];
    const wolves = Math.max(1, Math.floor(n / 4));
    for (let i = 0; i < wolves; i++) roles.push(WW_ROLES[0]);
    if (n >= 5) roles.push(WW_ROLES[2]);
    if (n >= 6) roles.push(WW_ROLES[3]);
    if (n >= 8) roles.push(WW_ROLES[4]);
    while (roles.length < n) roles.push(WW_ROLES[1]);
    return shuffle(roles);
  });
  const [revealed, setRevealed] = useState<number[]>([]);
  const [showing, setShowing] = useState<number|null>(null);
  useEffect(() => {
    if (showing !== null) {
      const t = setTimeout(() => { setRevealed(r => [...r, showing]); setShowing(null); }, 3000);
      return () => clearTimeout(t);
    }
  }, [showing]);
  const allRevealed = revealed.length === players.length;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, paddingTop:16 }}>
      <p style={{ textAlign:"center", color:"var(--t2)", fontSize:14 }}>Tap your card to secretly reveal your role (3 seconds).</p>
      {players.map((p, i) => {
        const isShowing = showing === i;
        const isDone = revealed.includes(i);
        const role = assignments[i];
        return (
          <button key={p.id} className="pg-player-reveal-btn" onClick={() => { if (!isDone && showing === null) setShowing(i); }}
            style={{ opacity: isDone ? 0.5 : 1 }}>
            <span style={{ fontSize:18 }}>{isDone ? "✅" : isShowing ? role.emoji : "🃏"}</span>
            <span style={{ fontWeight:600 }}>{p.name}</span>
            <span style={{ marginLeft:"auto", fontSize:isShowing?14:18, color:isShowing&&role.role==="Werewolf"?"#f5576c":"#4facfe", fontWeight:700 }}>
              {isShowing ? role.role : isDone ? "seen" : "tap"}
            </span>
          </button>
        );
      })}
      {allRevealed && <div className="pg-prompt-card" style={{ marginTop:8 }}><p style={{ textAlign:"center", fontWeight:600 }}>Everyone close your eyes. Werewolves, open your eyes and agree on a victim… 🐺</p></div>}
    </div>
  );
}

/* ─── FINGER SPINNER ──────────────────────────────────────────────────────── */
function FingerSpinGame({ players }: { players: Player[] }) {
  const [checkedIn, setCheckedIn] = useState<number[]>([]);
  const [winner, setWinner] = useState<string|null>(null);
  const [spinning, setSpinning] = useState(false);

  const checkIn = (i: number) => { if (!checkedIn.includes(i)) setCheckedIn(c => [...c, i]); };
  const spin = () => {
    setSpinning(true);
    setWinner(null);
    setTimeout(() => {
      const lucky = checkedIn[Math.floor(Math.random() * checkedIn.length)];
      setWinner(players[lucky].name);
      setSpinning(false);
    }, 1500);
  };
  const reset = () => { setCheckedIn([]); setWinner(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, paddingTop:16 }}>
      {!winner ? (
        <>
          <p style={{ color:"var(--t2)", textAlign:"center" }}>Each player taps their name to check in</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
            {players.map((p, i) => (
              <button key={p.id} className={`pg-finger-btn ${checkedIn.includes(i) ? "pg-finger-checked" : ""}`} onClick={() => checkIn(i)}>
                {checkedIn.includes(i) ? "☝️ " : ""}{p.name}
              </button>
            ))}
          </div>
          {checkedIn.length >= 2 && (
            <button className="pg-btn-primary" onClick={spin} disabled={spinning}>
              {spinning ? "Choosing…" : `Spin (${checkedIn.length} fingers)`}
            </button>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize:80, animation:"bounce-in 0.5s ease" }}>☝️</div>
          <div className="pg-winner-badge">🎯 {winner}&apos;s finger!</div>
          <button className="pg-btn-ghost" onClick={reset}>Play again</button>
        </>
      )}
    </div>
  );
}

/* ─── MOST LIKELY TO ──────────────────────────────────────────────────────── */
function MostLikelyGame() {
  return <PromptGame prompts={C.mostLikelyTo} footer="Everyone points at the same time on 3-2-1 GO!" />;
}

/* ─── DARE ROULETTE ───────────────────────────────────────────────────────── */
function DareRouletteGame() {
  const [spinning, setSpinning] = useState(false);
  const [dare, setDare] = useState<string|null>(null);
  const [angle, setAngle] = useState(0);
  const spin = () => {
    if (spinning) return;
    const next = angle + 1440 + Math.random() * 720;
    setAngle(next);
    setSpinning(true);
    setDare(null);
    setTimeout(() => { setSpinning(false); setDare(pick(C.dareRoulette)); }, 3000);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div onClick={spin} style={{ width:180, height:180, borderRadius:"50%", background:"conic-gradient(#f5576c,#f7971e,#43e97b,#4facfe,#a18cd1,#f5576c)", transform:`rotate(${angle}deg)`, transition:spinning?"transform 3s cubic-bezier(0.17,0.67,0.12,0.99)":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 40px rgba(108,99,255,0.4)" }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🎲</div>
      </div>
      {dare ? (
        <div className="pg-prompt-card" style={{ borderColor:"rgba(245,87,108,0.4)" }}>
          <p style={{ fontSize:18, fontWeight:600, textAlign:"center", lineHeight:1.5 }}>{dare}</p>
        </div>
      ) : (
        <p style={{ color:"var(--t2)" }}>{spinning ? "Spinning…" : "Tap the wheel to spin!"}</p>
      )}
      {dare && <button className="pg-btn-primary" onClick={spin}>Spin again</button>}
    </div>
  );
}

/* ─── CHARADES ────────────────────────────────────────────────────────────── */
function CharadesGame({ players }: { players: Player[] }) {
  const [pIdx, setPIdx] = useState(0);
  const [word, setWord] = useState(() => pick(C.charades));
  const [shown, setShown] = useState(false);
  const timer = useTimer(60, () => {});
  const next = () => { setWord(pick(C.charades)); setShown(false); timer.stop(); setPIdx(i => i+1); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 16px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        <span>🎭</span><span style={{ fontWeight:600 }}>{players[pIdx % players.length].name}&apos;s turn</span>
      </div>
      {!shown ? (
        <button className="pg-btn-primary" style={{ fontSize:18, padding:"20px 40px" }} onClick={() => { setShown(true); timer.start(); }}>
          Reveal Word
        </button>
      ) : (
        <>
          <div className="pg-big-word">{word}</div>
          <div className={`pg-timer ${timer.t <= 10 ? "pg-timer-urgent" : ""}`}>{timer.t}s</div>
        </>
      )}
      {shown && <button className="pg-btn-ghost" onClick={next}>Guessed! Next →</button>}
      {!shown && <p style={{ color:"var(--t2)", fontSize:13 }}>Only the actor sees the word</p>}
    </div>
  );
}

/* ─── RAPID FIRE ──────────────────────────────────────────────────────────── */
function RapidFireGame({ players }: { players: Player[] }) {
  const [pIdx, setPIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState<Record<string,number>>({});
  const [started, setStarted] = useState(false);
  const timer = useTimer(30, () => { setStarted(false); });
  const shuffledQs = useRef(shuffle(C.rapidFire));
  const current = players[pIdx % players.length];
  const hit = () => { setScore(s => ({...s, [current.id]: (s[current.id]||0)+1})); setQIdx(i => i+1); };
  const start = () => { setQIdx(0); setStarted(true); timer.start(30); };
  const next = () => { setPIdx(i => i+1); setStarted(false); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 16px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        <span>⚡</span><span style={{ fontWeight:600 }}>{current.name}&apos;s turn</span>
        {score[current.id] !== undefined && <span style={{ color:"#f7971e" }}>• {score[current.id]} pts</span>}
      </div>
      {!started ? (
        <button className="pg-btn-primary" style={{ fontSize:18, padding:"18px 40px" }} onClick={start}>Start 30s!</button>
      ) : (
        <>
          <div className={`pg-timer ${timer.t <= 10 ? "pg-timer-urgent" : ""}`}>{timer.t}s</div>
          <div className="pg-big-word" style={{ fontSize:22 }}>{shuffledQs.current[qIdx % shuffledQs.current.length]}</div>
          <div style={{ display:"flex", gap:12 }}>
            <button className="pg-btn-danger" onClick={() => setQIdx(i=>i+1)}>Skip</button>
            <button className="pg-btn-primary" onClick={hit}>✓ Got it!</button>
          </div>
        </>
      )}
      {!started && pIdx > 0 && <button className="pg-btn-ghost" onClick={next}>Next player →</button>}
      {!started && Object.keys(score).length > 0 && (
        <div style={{ width:"100%", background:"rgba(255,255,255,0.04)", borderRadius:14, padding:16 }}>
          {players.map(p => score[p.id] !== undefined && (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <span>{p.name}</span><span style={{ color:"#f7971e", fontWeight:700 }}>{score[p.id]} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── WORD ASSOCIATION ────────────────────────────────────────────────────── */
function WordAssocGame({ players }: { players: Player[] }) {
  const [chain, setChain] = useState<string[]>([pick(C.wordStarts)]);
  const [input, setInput] = useState("");
  const [pIdx, setPIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const submit = () => {
    const w = input.trim();
    if (!w) return;
    setChain(c => [...c, w]);
    setInput("");
    setPIdx(i => (i+1) % players.length);
  };
  const handleKey = (e: { key: string }) => { if (e.key === "Enter") submit(); };
  if (failed) return (
    <div style={{ textAlign:"center", paddingTop:32 }}>
      <div style={{ fontSize:64 }}>💥</div>
      <p style={{ fontSize:20, fontWeight:700, marginTop:16 }}>{players[(pIdx-1+players.length)%players.length].name} broke the chain!</p>
      <p style={{ color:"var(--t2)", marginTop:8 }}>Chain length: {chain.length - 1}</p>
      <button className="pg-btn-primary" style={{ marginTop:20 }} onClick={() => { setChain([pick(C.wordStarts)]); setPIdx(0); setFailed(false); }}>Play again</button>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, paddingTop:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", maxHeight:100, overflowY:"auto", padding:"8px 0" }}>
        {chain.map((w,i) => <span key={i} style={{ background:"rgba(255,255,255,0.08)", borderRadius:100, padding:"4px 12px", fontSize:14, color: i===chain.length-1?"#4facfe":"var(--t2)" }}>{w}</span>)}
      </div>
      <p style={{ textAlign:"center", color:"var(--t2)" }}>
        <b style={{ color:"var(--text)" }}>{players[pIdx % players.length].name}</b> — say a word associated with <b style={{ color:"#4facfe" }}>"{chain[chain.length-1]}"</b>
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <input className="pg-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type a word…" autoFocus />
        <button className="pg-btn-primary" style={{ flexShrink:0 }} onClick={submit}>→</button>
      </div>
      <button className="pg-btn-danger" style={{ alignSelf:"center", fontSize:13 }} onClick={() => setFailed(true)}>💥 Hesitated!</button>
    </div>
  );
}

/* ─── TRIVIA BATTLE ───────────────────────────────────────────────────────── */
function TriviaGame({ players }: { players: Player[] }) {
  const qs = useRef(shuffle(C.trivia));
  const [qIdx, setQIdx] = useState(0);
  const [pIdx, setPIdx] = useState(0);
  const [score, setScore] = useState<Record<string,number>>({});
  const [chosen, setChosen] = useState<string|null>(null);
  const q = qs.current[qIdx % qs.current.length];
  const current = players[pIdx % players.length];
  const answer = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === q.a) setScore(s => ({...s, [current.id]: (s[current.id]||0)+1}));
  };
  const next = () => { setChosen(null); setQIdx(i => i+1); setPIdx(i => (i+1)%players.length); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, paddingTop:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color:"var(--t2)" }}>Q{qIdx+1}</span>
        <span style={{ fontSize:13, padding:"4px 12px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}><b style={{ color:"var(--text)" }}>{current.name}</b>&apos;s turn</span>
        <span style={{ fontSize:13, color:"var(--t2)" }}>{score[current.id]||0} pts</span>
      </div>
      <div className="pg-prompt-card"><p style={{ fontSize:18, fontWeight:600, textAlign:"center" }}>{q.q}</p></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {q.opts.map(opt => (
          <button key={opt} onClick={() => answer(opt)} className="pg-option-btn"
            style={chosen ? { background: opt===q.a ? "rgba(67,233,123,0.2)" : opt===chosen ? "rgba(245,87,108,0.2)" : "rgba(255,255,255,0.04)", borderColor: opt===q.a ? "#43e97b" : opt===chosen ? "#f5576c" : "rgba(255,255,255,0.1)", pointerEvents:"none" } : {}}>
            {opt}
          </button>
        ))}
      </div>
      {chosen && (
        <div style={{ textAlign:"center" }}>
          <p style={{ color: chosen===q.a ? "#43e97b" : "#f5576c", fontWeight:700, marginBottom:12 }}>{chosen===q.a?"✅ Correct!":"❌ Wrong!"}</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            {players.length > 1 && <span style={{ fontSize:13, color:"var(--t2)" }}>Top: {[...players].sort((a,b)=>(score[b.id]||0)-(score[a.id]||0))[0].name} {score[[...players].sort((a,b)=>(score[b.id]||0)-(score[a.id]||0))[0].id]||0}pts</span>}
            <button className="pg-btn-primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CATEGORIES ──────────────────────────────────────────────────────────── */
function CategoriesGame({ players }: { players: Player[] }) {
  const [cat] = useState(() => pick(C.categories));
  const [pIdx, setPIdx] = useState(0);
  const timer = useTimer(30, () => {});
  const [started, setStarted] = useState(false);
  const next = () => { setStarted(false); timer.stop(); setPIdx(i => i+1); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ padding:"8px 20px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        Category: <b style={{ color:"#43e97b" }}>{cat}</b>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span>📋</span><span style={{ fontWeight:600 }}>{players[pIdx%players.length].name}&apos;s turn — 30 seconds!</span>
      </div>
      {!started ? (
        <button className="pg-btn-primary" style={{ fontSize:18, padding:"18px 40px" }} onClick={() => { setStarted(true); timer.start(30); }}>Start!</button>
      ) : (
        <>
          <div className={`pg-timer ${timer.t<=10?"pg-timer-urgent":""}`}>{timer.t}s</div>
          <p style={{ color:"var(--t2)", textAlign:"center" }}>Name things in: <b style={{ color:"var(--text)" }}>{cat}</b></p>
          <button className="pg-btn-ghost" onClick={next}>Done — Next player →</button>
        </>
      )}
    </div>
  );
}

/* ─── DRAW IT ─────────────────────────────────────────────────────────────── */
function DrawItGame({ players }: { players: Player[] }) {
  const [pIdx, setPIdx] = useState(0);
  const [word] = useState(() => pick(C.drawIt));
  const [shown, setShown] = useState(false);
  const timer = useTimer(60, () => {});
  const next = () => { setPIdx(i => i+1); setShown(false); timer.stop(); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ padding:"6px 16px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        🎨 <b>{players[pIdx%players.length].name}</b> is drawing
      </div>
      {!shown ? (
        <button className="pg-btn-primary" style={{ fontSize:18, padding:"20px 40px" }} onClick={() => { setShown(true); timer.start(); }}>See Your Word</button>
      ) : (
        <>
          <div className="pg-big-word">{word}</div>
          <div className={`pg-timer ${timer.t<=15?"pg-timer-urgent":""}`}>{timer.t}s</div>
          <p style={{ color:"var(--t2)", fontSize:13 }}>Draw it on paper — others guess!</p>
        </>
      )}
      {shown && <button className="pg-btn-ghost" onClick={next}>Guessed! Next →</button>}
    </div>
  );
}

/* ─── HOT POTATO ──────────────────────────────────────────────────────────── */
function HotPotatoGame({ players }: { players: Player[] }) {
  const [duration] = useState(() => 10 + Math.floor(Math.random() * 20));
  const [running, setRunning] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [pIdx, setPIdx] = useState(0);
  const timer = useTimer(duration, () => { setRunning(false); setExploded(true); });
  const start = () => { setExploded(false); timer.start(duration); setRunning(true); };
  const reset = () => { setExploded(false); setRunning(false); setPIdx(0); timer.reset(); };
  if (exploded) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:32, textAlign:"center" }}>
      <div style={{ fontSize:80, animation:"bounce-in 0.4s ease" }}>💥</div>
      <p style={{ fontSize:22, fontWeight:700 }}>{players[pIdx%players.length].name} loses!</p>
      <p style={{ color:"var(--t2)" }}>The potato exploded in their hands!</p>
      <button className="pg-btn-primary" onClick={reset}>Play again</button>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ fontSize:80 }}>🥔</div>
      {running && (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span>Now with:</span><b style={{ fontSize:20 }}>{players[pIdx%players.length].name}</b>
          <button className="pg-btn-ghost" style={{ fontSize:12, padding:"4px 12px" }} onClick={() => setPIdx(i => (i+1)%players.length)}>Pass →</button>
        </div>
      )}
      {!running ? (
        <button className="pg-btn-primary" style={{ fontSize:18, padding:"18px 40px" }} onClick={start}>Start!</button>
      ) : (
        <p style={{ color:"var(--t2)" }}>Pass it fast! Timer is secret… 🤫</p>
      )}
    </div>
  );
}

/* ─── MIME IT ─────────────────────────────────────────────────────────────── */
function MimeItGame({ players }: { players: Player[] }) {
  const [pIdx, setPIdx] = useState(0);
  const [action, setAction] = useState(() => pick(C.mimeIt));
  const [shown, setShown] = useState(false);
  const timer = useTimer(45, () => {});
  const next = () => { setAction(pick(C.mimeIt)); setShown(false); timer.stop(); setPIdx(i => i+1); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ padding:"6px 16px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        🤡 <b>{players[pIdx%players.length].name}</b> is miming
      </div>
      {!shown ? (
        <button className="pg-btn-primary" style={{ fontSize:18, padding:"20px 40px" }} onClick={() => { setShown(true); timer.start(); }}>See Action</button>
      ) : (
        <>
          <div className="pg-big-word" style={{ fontSize:20 }}>{action}</div>
          <div className={`pg-timer ${timer.t<=10?"pg-timer-urgent":""}`}>{timer.t}s</div>
        </>
      )}
      {shown && <button className="pg-btn-ghost" onClick={next}>Guessed! Next →</button>}
    </div>
  );
}

/* ─── STORY BUILDER ───────────────────────────────────────────────────────── */
function StoryBuilderGame({ players }: { players: Player[] }) {
  const [pIdx, setPIdx] = useState(0);
  const [story, setStory] = useState<string[]>([pick(C.storyPrompts)]);
  const [input, setInput] = useState("");
  const add = () => {
    const s = input.trim();
    if (!s) return;
    setStory(st => [...st, s]);
    setInput("");
    setPIdx(i => (i+1)%players.length);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, paddingTop:16 }}>
      <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:14, padding:16, maxHeight:180, overflowY:"auto" }}>
        <p style={{ lineHeight:1.8, fontSize:15 }}>
          {story.map((s,i) => <span key={i} style={{ color: i===story.length-1?"#4facfe":i===0?"#f7971e":undefined }}>{s} </span>)}
        </p>
      </div>
      <p style={{ textAlign:"center", color:"var(--t2)", fontSize:14 }}>
        <b style={{ color:"var(--text)" }}>{players[pIdx%players.length].name}</b>, continue the story…
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <input className="pg-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&add()} placeholder="Add a sentence…" />
        <button className="pg-btn-primary" style={{ flexShrink:0 }} onClick={add}>→</button>
      </div>
    </div>
  );
}

/* ─── THIS OR THAT ────────────────────────────────────────────────────────── */
function ThisOrThatGame() {
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<number[]>([0,0]);
  const [voted, setVoted] = useState(false);
  const pair = C.thisOrThat[idx % C.thisOrThat.length];
  const total = votes[0] + votes[1];
  const vote = (side: number) => { setVotes(v => v.map((x,i) => i===side?x+1:x) as [number,number]); setVoted(true); };
  const next = () => { setIdx(i => i+1); setVotes([0,0]); setVoted(false); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, paddingTop:8 }}>
      <p style={{ textAlign:"center", fontSize:13, color:"var(--t2)" }}>Everyone votes at once!</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {pair.map((opt,i) => (
          <button key={i} onClick={() => !voted && vote(i)} className="pg-tot-btn"
            style={{ background: i===0 ? "linear-gradient(135deg,#f5576c,#f093fb)" : "linear-gradient(135deg,#4facfe,#00f2fe)", opacity: voted&&votes[i]===0?0.5:1 }}>
            <span style={{ fontSize:16, fontWeight:600 }}>{opt}</span>
            {voted && <span style={{ fontSize:22, fontWeight:800 }}>{total>0?Math.round(votes[i]/total*100):0}%</span>}
          </button>
        ))}
      </div>
      {voted && <button className="pg-btn-primary" onClick={next}>Next →</button>}
    </div>
  );
}

/* ─── ACCENT CHALLENGE ────────────────────────────────────────────────────── */
function AccentGame({ players }: { players: Player[] }) {
  const [accentIdx, setAccentIdx] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [pIdx, setPIdx] = useState(0);
  const a = C.accents[accentIdx];
  const next = () => { setPhraseIdx(i => (i+1) % a.phrases.length); setPIdx(i => (i+1)%players.length); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {C.accents.map((acc,i) => (
          <button key={i} onClick={() => { setAccentIdx(i); setPhraseIdx(0); }} className={`pg-tag-btn ${accentIdx===i?"pg-tag-active":""}`}>{acc.accent}</button>
        ))}
      </div>
      <div style={{ padding:"6px 16px", background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        🗣️ <b>{players[pIdx%players.length].name}</b> — read this in {a.accent}
      </div>
      <div className="pg-prompt-card">
        <p style={{ fontSize:20, fontWeight:600, textAlign:"center", lineHeight:1.5 }}>"{a.phrases[phraseIdx]}"</p>
      </div>
      <button className="pg-btn-primary" onClick={next}>Next →</button>
    </div>
  );
}

/* ─── FREEZE ──────────────────────────────────────────────────────────────── */
function FreezeGame() {
  const [state, setState] = useState<"idle"|"running"|"freeze">("idle");
  const [countdown, setCountdown] = useState(0);
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = () => {
    setState("running");
    const wait = 5000 + Math.random() * 15000;
    tRef.current = setTimeout(() => setState("freeze"), wait);
  };
  const reset = () => { clearTimeout(tRef.current); setState("idle"); };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:32, textAlign:"center" }}>
      {state === "idle" && (
        <>
          <div style={{ fontSize:64 }}>🧊</div>
          <p style={{ color:"var(--t2)" }}>Music plays — when FREEZE appears, everyone must freeze!</p>
          <button className="pg-btn-primary" style={{ fontSize:18, padding:"18px 40px" }} onClick={start}>Start Music 🎵</button>
        </>
      )}
      {state === "running" && (
        <>
          <div style={{ fontSize:64, animation:"float 1s ease-in-out infinite" }}>🎵</div>
          <p style={{ fontSize:24, fontWeight:700 }}>Dance! Keep moving!</p>
          <p style={{ color:"var(--t2)" }}>FREEZE could come at any moment…</p>
          <button className="pg-btn-ghost" onClick={reset}>Stop</button>
        </>
      )}
      {state === "freeze" && (
        <>
          <div style={{ fontSize:80, animation:"bounce-in 0.3s ease" }}>🧊</div>
          <div style={{ fontSize:48, fontWeight:900, color:"#89f7fe", letterSpacing:4, animation:"pulse-glow 1s ease-in-out infinite" }}>FREEZE!</div>
          <p style={{ color:"var(--t2)" }}>Last to freeze is out!</p>
          <button className="pg-btn-primary" onClick={start}>Next Round</button>
          <button className="pg-btn-ghost" onClick={reset}>End Game</button>
        </>
      )}
    </div>
  );
}

/* ─── VIBE CHECK ──────────────────────────────────────────────────────────── */
function VibeCheckGame() {
  return <PromptGame prompts={C.vibeCheck} footer="Discuss as a group — everyone shares their answer!" />;
}

/* ─── PLAYING SCREEN (game router) ───────────────────────────────────────── */
function PlayingScreen({ game, players, onBack }: { game: Game; players: Player[]; onBack: () => void }) {
  const GameComponent = () => {
    switch (game.id) {
      case "never":       return <NeverGame />;
      case "truth-dare":  return <TruthDareGame />;
      case "who-room":    return <WhoRoomGame />;
      case "hot-seat":    return <HotSeatGame players={players} />;
      case "2-truths":    return <TwoTruthsGame players={players} />;
      case "spin-wheel":  return <SpinWheelGame players={players} />;
      case "would-rather":return <WouldRatherGame />;
      case "paranoia":    return <ParanoiaGame />;
      case "imposter":    return <ImposterGame players={players} />;
      case "werewolf":    return <WerewolfGame players={players} />;
      case "finger-spin": return <FingerSpinGame players={players} />;
      case "most-likely": return <MostLikelyGame />;
      case "dare-roulette":return <DareRouletteGame />;
      case "charades":    return <CharadesGame players={players} />;
      case "rapid-fire":  return <RapidFireGame players={players} />;
      case "word-assoc":  return <WordAssocGame players={players} />;
      case "trivia":      return <TriviaGame players={players} />;
      case "categories":  return <CategoriesGame players={players} />;
      case "draw-it":     return <DrawItGame players={players} />;
      case "hot-potato":  return <HotPotatoGame players={players} />;
      case "mime-it":     return <MimeItGame players={players} />;
      case "story-builder":return <StoryBuilderGame players={players} />;
      case "this-or-that":return <ThisOrThatGame />;
      case "accent":      return <AccentGame players={players} />;
      case "freeze":      return <FreezeGame />;
      case "vibe-check":  return <VibeCheckGame />;
      default:            return <div style={{ textAlign:"center", padding:32, color:"var(--t2)" }}>Game coming soon!</div>;
    }
  };

  return (
    <div className="pg-screen">
      <div className="pg-playing-header" style={{ background: game.grad }}>
        <button className="pg-back-btn" onClick={onBack}>← Back</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>{game.emoji}</span>
          <span style={{ fontWeight:700, fontSize:16 }}>{game.name}</span>
        </div>
        <div style={{ width:60 }} />
      </div>
      <div className="pg-playing-body">
        <div className="pg-playing-inner">
          <GameComponent />
        </div>
      </div>
    </div>
  );
}

/* ─── HOME SCREEN ─────────────────────────────────────────────────────────── */
function HomeScreen({ profile, onSelectGame, onProfile }: {
  profile: Profile | null;
  onSelectGame: (g: Game) => void;
  onProfile: () => void;
}) {
  const [activeCat, setActiveCat] = useState<Cat>("trending");
  const [search, setSearch] = useState("");
  const filtered = GAMES.filter(g =>
    g.cat === activeCat &&
    (!search || g.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pg-screen">
      {/* Header */}
      <div className="pg-home-header">
        <div>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:-0.5 }}>WHAT DO I? 🎉</div>
          <div style={{ fontSize:12, color:"var(--t2)", marginTop:1 }}>25 party games</div>
        </div>
        <button className="pg-avatar-btn" onClick={onProfile}>
          <span style={{ fontSize:22 }}>{profile?.avatar || "👤"}</span>
          {profile?.premium && <span className="pg-premium-dot">★</span>}
        </button>
      </div>

      {/* Search */}
      <div style={{ padding:"0 16px 12px" }}>
        <div className="pg-search-wrap">
          <span style={{ fontSize:16 }}>🔍</span>
          <input className="pg-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search games…" />
          {search && <button style={{ background:"none", border:"none", color:"var(--t2)", cursor:"pointer", fontSize:16 }} onClick={() => setSearch("")}>×</button>}
        </div>
      </div>

      {/* Category tabs */}
      <div className="pg-cats">
        {CATS.map(c => (
          <button key={c.id} className={`pg-cat-tab ${activeCat===c.id?"pg-cat-active":""}`} onClick={() => setActiveCat(c.id)}>
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <div className="pg-game-grid">
        {filtered.map(g => (
          <button key={g.id} className="pg-game-card" onClick={() => onSelectGame(g)}>
            <div className="pg-game-card-top" style={{ background: g.grad }}>
              <span style={{ fontSize:36 }}>{g.emoji}</span>
              {g.premium && !(profile?.premium) && <span className="pg-lock">🔒</span>}
            </div>
            <div className="pg-game-card-body">
              <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{g.name}</div>
              <div style={{ fontSize:11, color:"var(--t2)", lineHeight:1.3 }}>{g.tagline}</div>
              <div style={{ fontSize:11, color:"var(--t3)", marginTop:6 }}>{g.min}{g.max!==g.min?`–${g.max}`:""} players</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--t2)" }}>No games found</div>
        )}
      </div>
    </div>
  );
}

/* ─── DETAIL SCREEN ───────────────────────────────────────────────────────── */
function DetailScreen({ game, profile, onStart, onBack, onPremium, onAuth }: {
  game: Game; profile: Profile | null;
  onStart: () => void; onBack: () => void;
  onPremium: () => void; onAuth: () => void;
}) {
  const locked = game.premium && !(profile?.premium);
  return (
    <div className="pg-screen">
      <div className="pg-detail-hero" style={{ background: game.grad }}>
        <button className="pg-back-btn" onClick={onBack}>← Back</button>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:64 }}>{game.emoji}</span>
          <h1 style={{ fontWeight:900, fontSize:24, textAlign:"center" }}>{game.name}</h1>
          <span style={{ fontSize:13, opacity:0.85 }}>{game.tagline}</span>
        </div>
        <div style={{ height:24 }} />
      </div>
      <div style={{ padding:"24px 20px", display:"flex", flexDirection:"column", gap:20 }}>
        <p style={{ color:"var(--t2)", textAlign:"center", lineHeight:1.6 }}>{game.desc}</p>
        <div style={{ display:"flex", justifyContent:"center", gap:24 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700 }}>{game.min}{game.max!==game.min?`–${game.max}`:""}</div>
            <div style={{ fontSize:12, color:"var(--t3)" }}>players</div>
          </div>
          <div style={{ width:1, background:"rgba(255,255,255,0.1)" }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700 }}>{game.premium?"⭐":"🆓"}</div>
            <div style={{ fontSize:12, color:"var(--t3)" }}>{game.premium?"Premium":"Free"}</div>
          </div>
        </div>
        {locked ? (
          <>
            <div className="pg-locked-banner">
              <div style={{ fontSize:24 }}>🔒</div>
              <div>
                <div style={{ fontWeight:700 }}>Premium Game</div>
                <div style={{ fontSize:13, color:"var(--t2)" }}>Unlock all 25 games with a pass</div>
              </div>
            </div>
            <button className="pg-btn-premium" onClick={onPremium}>⭐ Get Premium — from ฿23.67</button>
            {!profile && <button className="pg-btn-ghost" style={{ textAlign:"center" }} onClick={onAuth}>Log in to play</button>}
          </>
        ) : (
          <button className="pg-btn-primary" style={{ fontSize:18, padding:"18px" }} onClick={onStart}>Play Now →</button>
        )}
      </div>
    </div>
  );
}

/* ─── SETUP SCREEN ────────────────────────────────────────────────────────── */
function SetupScreen({ game, onPlay, onBack }: { game: Game; onPlay: (players: Player[]) => void; onBack: () => void }) {
  const [players, setPlayers] = useState<Player[]>([
    { id: uid(), name: "Player 1", score: 0 },
    { id: uid(), name: "Player 2", score: 0 },
  ]);
  const [newName, setNewName] = useState("");
  const add = () => {
    const n = newName.trim() || `Player ${players.length + 1}`;
    if (players.length < (game.max || 20)) { setPlayers(p => [...p, { id:uid(), name:n, score:0 }]); setNewName(""); }
  };
  const remove = (id: string) => setPlayers(p => p.filter(x => x.id !== id));
  const rename = (id: string, name: string) => setPlayers(p => p.map(x => x.id===id ? {...x, name} : x));
  const canPlay = players.length >= game.min;

  return (
    <div className="pg-screen">
      <div className="pg-setup-header">
        <button className="pg-back-btn-dark" onClick={onBack}>← Back</button>
        <span style={{ fontWeight:700 }}>Add Players</span>
        <div style={{ width:60 }} />
      </div>
      <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ fontSize:32 }}>{game.emoji}</div>
          <div>
            <div style={{ fontWeight:700 }}>{game.name}</div>
            <div style={{ fontSize:13, color:"var(--t2)" }}>{game.min}+ players needed</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {players.map(p => (
            <div key={p.id} className="pg-player-row">
              <span style={{ fontSize:18 }}>👤</span>
              <input className="pg-input" style={{ flex:1, padding:"8px 12px" }} value={p.name} onChange={e => rename(p.id, e.target.value)} />
              <button onClick={() => remove(p.id)} style={{ background:"none", border:"none", color:"var(--t2)", cursor:"pointer", fontSize:20, padding:"4px 8px" }}>×</button>
            </div>
          ))}
        </div>

        {players.length < (game.max || 20) && (
          <div style={{ display:"flex", gap:8 }}>
            <input className="pg-input" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==="Enter"&&add()} placeholder="Player name…" />
            <button className="pg-btn-ghost" style={{ flexShrink:0 }} onClick={add}>+ Add</button>
          </div>
        )}

        <button className="pg-btn-primary" style={{ fontSize:18, padding:"18px", marginTop:8 }} disabled={!canPlay} onClick={() => onPlay(players)}>
          {canPlay ? `Start with ${players.length} players →` : `Need ${game.min - players.length} more player${game.min-players.length>1?"s":""}`}
        </button>
      </div>
    </div>
  );
}

/* ─── PROFILE SCREEN ──────────────────────────────────────────────────────── */
function ProfileScreen({ profile, onClose, onSave, onLogin, onLogout, onPremium }: {
  profile: Profile | null;
  onClose: () => void;
  onSave: (p: Profile) => void;
  onLogin: () => void;
  onLogout: () => void;
  onPremium: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile || { name:"Guest", email:"", avatar:"🦁", premium:false, gamesPlayed:0, wins:0, streak:0 });
  const [pickingAvatar, setPickingAvatar] = useState(false);

  return (
    <div className="pg-screen">
      <div className="pg-profile-header">
        <button className="pg-back-btn-dark" onClick={onClose}>← Back</button>
        <span style={{ fontWeight:700 }}>Profile</span>
        <button style={{ background:"none", border:"none", color:"var(--accent-p)", cursor:"pointer", fontWeight:600 }} onClick={() => { if(editing) { onSave(draft); } setEditing(e => !e); }}>
          {editing ? "Save" : "Edit"}
        </button>
      </div>
      <div style={{ padding:"24px 16px", display:"flex", flexDirection:"column", gap:24 }}>
        {/* Avatar + name */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <button onClick={() => editing && setPickingAvatar(p => !p)} style={{ fontSize:72, background:"none", border:editing?"2px dashed rgba(255,255,255,0.2)":"none", borderRadius:16, padding:8, cursor:editing?"pointer":"default" }}>
            {draft.avatar}
          </button>
          {pickingAvatar && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, background:"rgba(255,255,255,0.06)", borderRadius:16, padding:12 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => { setDraft(d => ({...d, avatar:a})); setPickingAvatar(false); }} style={{ fontSize:28, background:draft.avatar===a?"rgba(108,99,255,0.3)":"none", border:"none", borderRadius:10, padding:6, cursor:"pointer" }}>{a}</button>
              ))}
            </div>
          )}
          {editing ? (
            <input className="pg-input" value={draft.name} onChange={e => setDraft(d => ({...d, name:e.target.value}))} style={{ textAlign:"center", fontSize:20, fontWeight:700 }} />
          ) : (
            <div style={{ fontSize:22, fontWeight:800 }}>{draft.name}</div>
          )}
          {profile?.email && <div style={{ fontSize:13, color:"var(--t2)" }}>{profile.email}</div>}
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          {[
            { label:"Games", value: draft.gamesPlayed },
            { label:"Wins",  value: draft.wins },
            { label:"Streak",value: `${draft.streak}🔥` },
          ].map(s => (
            <div key={s.label} className="pg-stat-card">
              <div style={{ fontSize:24, fontWeight:800 }}>{s.value}</div>
              <div style={{ fontSize:12, color:"var(--t2)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Premium */}
        {profile?.premium ? (
          <div className="pg-premium-banner">
            <span style={{ fontSize:24 }}>👑</span>
            <div>
              <div style={{ fontWeight:700 }}>Premium Active</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>All 25 games unlocked!</div>
            </div>
          </div>
        ) : (
          <button className="pg-btn-premium" onClick={onPremium}>⭐ Get Premium — from ฿23.67</button>
        )}

        {/* Auth */}
        {!profile ? (
          <button className="pg-btn-ghost" style={{ textAlign:"center" }} onClick={onLogin}>Log in / Sign up</button>
        ) : (
          <button className="pg-btn-ghost" style={{ textAlign:"center", color:"#f5576c" }} onClick={onLogout}>Log out</button>
        )}
      </div>
    </div>
  );
}

/* ─── AUTH MODAL ──────────────────────────────────────────────────────────── */
function AuthModal({ onClose, onDone }: { onClose: () => void; onDone: (p: Profile) => void }) {
  const [step, setStep] = useState<AuthStep>("choose");
  const [method, setMethod] = useState<"email"|"phone">("email");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement|null)[]>([]);

  const sendCode = () => {
    if (!value.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("otp"); }, 1200);
  };

  const handleOtp = (i: number, v: string) => {
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
    if (v && i < 5) otpRefs.current[i+1]?.focus();
    if (next.every(x => x)) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onDone({ name: method==="email" ? value.split("@")[0] : "Player", email: method==="email"?value:"", avatar:"🦁", premium:false, gamesPlayed:12, wins:4, streak:3 });
      }, 1000);
    }
  };

  return (
    <div className="pg-modal-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="pg-modal">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 20px 0" }}>
          <h2 style={{ fontWeight:800, fontSize:20 }}>{step==="choose"?"Sign in":"Verify"}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--t2)", cursor:"pointer", fontSize:24 }}>×</button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
          {step === "choose" && (
            <>
              <button className="pg-social-btn" onClick={() => { setMethod("email"); setStep("email"); }}>
                <span>✉️</span> Continue with Email
              </button>
              <button className="pg-social-btn" onClick={() => { setMethod("phone"); setStep("phone"); }}>
                <span>📱</span> Continue with Phone
              </button>
              <div className="pg-divider"><span>or</span></div>
              <button className="pg-social-btn pg-google-btn">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button className="pg-social-btn" style={{ background:"#000", border:"1px solid rgba(255,255,255,0.15)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Continue with Apple
              </button>
            </>
          )}

          {(step === "email" || step === "phone") && (
            <>
              <div style={{ display:"flex", gap:8, background:"rgba(255,255,255,0.04)", borderRadius:12, padding:4 }}>
                {(["email","phone"] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)} style={{ flex:1, padding:"8px", borderRadius:9, border:"none", background:method===m?"rgba(255,255,255,0.1)":"transparent", color:method===m?"var(--text)":"var(--t2)", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                    {m === "email" ? "✉️ Email" : "📱 Phone"}
                  </button>
                ))}
              </div>
              <input className="pg-input" type={method==="email"?"email":"tel"} value={value} onChange={e => setValue(e.target.value)} placeholder={method==="email"?"your@email.com":"+66 xxx xxx xxxx"} onKeyDown={e => e.key==="Enter"&&sendCode()} autoFocus />
              <button className="pg-btn-primary" onClick={sendCode} disabled={loading||!value.trim()}>
                {loading ? "Sending…" : "Send Code →"}
              </button>
              <button className="pg-btn-ghost" style={{ textAlign:"center" }} onClick={() => setStep("choose")}>← Back</button>
            </>
          )}

          {step === "otp" && (
            <>
              <p style={{ color:"var(--t2)", textAlign:"center", fontSize:14 }}>Enter the 6-digit code sent to <b style={{ color:"var(--text)" }}>{value}</b></p>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                {otp.map((d, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }} value={d} onChange={e => handleOtp(i, e.target.value)} onKeyDown={e => { if(e.key==="Backspace"&&!otp[i]&&i>0) otpRefs.current[i-1]?.focus(); }} className="pg-otp-input" maxLength={1} inputMode="numeric" autoFocus={i===0} />
                ))}
              </div>
              {loading && <p style={{ textAlign:"center", color:"var(--t2)" }}>Verifying…</p>}
              <button className="pg-btn-ghost" style={{ textAlign:"center" }} onClick={() => { setStep("email"); setOtp(["","","","","",""]); }}>Resend code</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── PREMIUM MODAL ───────────────────────────────────────────────────────── */
const PLANS = [
  { id:"day",    emoji:"🌙", label:"Day Pass",  price:"฿23.67", sub:"~$0.69", original:null,    popular:false, desc:"Try everything for 24 hours" },
  { id:"week",   emoji:"⚡", label:"Weekly",    price:"฿50",    sub:"~$1.46", original:"฿69",   popular:true,  desc:"Best deal · Save 28%" },
  { id:"monthly",emoji:"👑", label:"Monthly",   price:"฿299",   sub:"~$8.73", original:null,    popular:false, desc:"Full access for a month" },
];
function PremiumModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const [selected, setSelected] = useState("week");
  return (
    <div className="pg-modal-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="pg-modal">
        <div style={{ textAlign:"center", padding:"24px 20px 0" }}>
          <div style={{ fontSize:48 }}>⭐</div>
          <h2 style={{ fontWeight:900, fontSize:22, marginTop:8 }}>Get Premium</h2>
          <p style={{ color:"var(--t2)", fontSize:14, marginTop:4 }}>Unlock all 25 games. Play unlimited.</p>
        </div>
        <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:12 }}>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)} className={`pg-plan-btn ${selected===p.id?"pg-plan-selected":""}`}>
              <span style={{ fontSize:24 }}>{p.emoji}</span>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:700 }}>{p.label} {p.popular && <span className="pg-badge-hot">HOT DEAL</span>}</div>
                <div style={{ fontSize:12, color:"var(--t2)" }}>{p.desc}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800, fontSize:18, color: selected===p.id ? "#f7971e" : "var(--text)" }}>{p.price}</div>
                {p.original && <div style={{ fontSize:11, color:"var(--t3)", textDecoration:"line-through" }}>{p.original}</div>}
                <div style={{ fontSize:11, color:"var(--t2)" }}>{p.sub}</div>
              </div>
            </button>
          ))}
          <button className="pg-btn-premium" style={{ marginTop:8 }} onClick={onUnlock}>
            Unlock {PLANS.find(p => p.id===selected)?.label} →
          </button>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--t2)", cursor:"pointer", fontSize:14, textAlign:"center" }}>Maybe later</button>
          <p style={{ fontSize:11, color:"var(--t3)", textAlign:"center" }}>Prices in Thai Baht. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── TOAST ───────────────────────────────────────────────────────────────── */
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="pg-toast">{msg}</div>;
}

/* ─── MAIN APP ────────────────────────────────────────────────────────────── */
type NavTab = "games" | "profile" | "premium";

export default function WhatApp() {
  const [view, setView]           = useState<View>("home");
  const [selectedGame, setSG]     = useState<Game | null>(null);
  const [players, setPlayers]     = useState<Player[]>([]);
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [showAuth, setShowAuth]   = useState(false);
  const [showPrem, setShowPrem]   = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [navTab, setNavTab]       = useState<NavTab>("games");

  const go = (v: View) => setView(v);

  const handleSelectGame = (g: Game) => {
    setSG(g);
    go("detail");
  };

  const handleStart = () => {
    if (!selectedGame) return;
    go("setup");
  };

  const handlePlay = (ps: Player[]) => {
    setPlayers(ps);
    go("playing");
    setProfile(p => p ? { ...p, gamesPlayed: p.gamesPlayed + 1 } : null);
  };

  const handleUnlock = () => {
    setProfile(p => p ? { ...p, premium: true } : { name:"Guest", email:"", avatar:"🦁", premium:true, gamesPlayed:0, wins:0, streak:0 });
    setShowPrem(false);
    setToast("🎉 Premium unlocked! All games available!");
  };

  const handleAuthDone = (p: Profile) => {
    setProfile(p);
    setShowAuth(false);
    setToast(`Welcome, ${p.name}! 🎉`);
  };

  return (
    <div className="pg-root">
      {/* Screens */}
      {view === "home" && (
        <HomeScreen
          profile={profile}
          onSelectGame={handleSelectGame}
          onProfile={() => { setNavTab("profile"); go("profile"); }}
        />
      )}
      {view === "detail" && selectedGame && (
        <DetailScreen
          game={selectedGame}
          profile={profile}
          onStart={handleStart}
          onBack={() => go("home")}
          onPremium={() => setShowPrem(true)}
          onAuth={() => setShowAuth(true)}
        />
      )}
      {view === "setup" && selectedGame && (
        <SetupScreen
          game={selectedGame}
          onPlay={handlePlay}
          onBack={() => go("detail")}
        />
      )}
      {view === "playing" && selectedGame && (
        <PlayingScreen
          game={selectedGame}
          players={players}
          onBack={() => go("setup")}
        />
      )}
      {view === "profile" && (
        <ProfileScreen
          profile={profile}
          onClose={() => go("home")}
          onSave={p => { setProfile(p); setToast("Profile saved!"); }}
          onLogin={() => setShowAuth(true)}
          onLogout={() => { setProfile(null); go("home"); setToast("Logged out"); }}
          onPremium={() => setShowPrem(true)}
        />
      )}

      {/* Bottom nav */}
      {(view === "home" || view === "profile") && (
        <nav className="pg-bottom-nav">
          {([
            { id:"games",   emoji:"🎮", label:"Games"   },
            { id:"profile", emoji:"👤", label:"Profile"  },
            { id:"premium", emoji:"⭐", label:"Premium"  },
          ] as { id: NavTab; emoji: string; label: string }[]).map(n => (
            <button key={n.id} className={`pg-nav-item ${navTab===n.id?"pg-nav-active":""}`}
              onClick={() => {
                setNavTab(n.id);
                if (n.id === "premium") setShowPrem(true);
                else if (n.id === "games") go("home");
                else go("profile");
              }}>
              <span style={{ fontSize:22 }}>{n.emoji}</span>
              <span style={{ fontSize:11 }}>{n.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onDone={handleAuthDone} />}
      {showPrem && <PremiumModal onClose={() => setShowPrem(false)} onUnlock={handleUnlock} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
