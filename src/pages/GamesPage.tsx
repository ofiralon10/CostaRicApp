import { useState, useEffect, useCallback, useRef } from 'react'
import { RotateCcw, Brain, Grid3X3, Languages, Star, Check, X, Puzzle, Hash, Volume2, Palette, Search, Eye, Trophy } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import { spanishCategories } from '../data/spanish'
import type { SpanishPhrase } from '../data/spanish'
import { crosswordPuzzles } from '../data/crosswords'
import type { CrosswordLevel } from '../data/crosswords'

interface AlbumPhoto { id: string; url: string; caption: string; captionHe: string; uploadedBy: string; timestamp: number }

type GameId = 'trivia' | 'memory' | 'scramble' | 'jigsaw' | 'crossword' | 'spanish' | 'coloring' | 'imposter' | 'millionaire'

// ─── TRIVIA DATA ───
interface TriviaQuestion {
  question: string
  questionEn: string
  options: string[]
  optionsEn: string[]
  correct: number
  fact: string
  factEn: string
}

const triviaQuestions: TriviaQuestion[] = [
  { question: 'מה השם של הר הגעש המפורסם ביותר בקוסטה ריקה?', questionEn: 'What is the most famous volcano in Costa Rica?', options: ['פואס', 'ארנל', 'טנוריו', 'רינקון דה לה ויאחה'], optionsEn: ['Poás', 'Arenal', 'Tenorio', 'Rincón de la Vieja'], correct: 1, fact: 'הר ארנל היה פעיל 42 שנה ברציפות בין 1968 ל-2010!', factEn: 'Arenal was continuously active for 42 years from 1968 to 2010!' },
  { question: 'למה ריו סלסטה כחול בצורה כל כך מיוחדת?', questionEn: 'Why is Rio Celeste so uniquely blue?', options: ['צבע מלאכותי', 'השתקפות השמיים', 'חלקיקים מינרליים מפזרים אור', 'אצות כחולות'], optionsEn: ['Artificial dye', 'Sky reflection', 'Mineral particles scatter light', 'Blue algae'], correct: 2, fact: 'התופעה נקראת "פיזור מי" — חלקיקי סיליקה וגופרית מפזרים אור כחול!', factEn: 'It\'s called "Mie Scattering" — silica and sulfur particles scatter blue light!' },
  { question: 'מה המשמעות של "פורה וידה"?', questionEn: 'What does "Pura Vida" mean?', options: ['חיים טובים', 'חיים טהורים', 'חיים יפים', 'חיים ארוכים'], optionsEn: ['Good life', 'Pure life', 'Beautiful life', 'Long life'], correct: 1, fact: 'פורה וידה הוא הביטוי הלאומי של קוסטה ריקה — משמש לשלום, תודה, ו"הכל טוב"!', factEn: '"Pura Vida" is Costa Rica\'s national phrase — used for hello, thanks, and "all good"!' },
  { question: 'כמה מיני קופים יש בקוסטה ריקה?', questionEn: 'How many monkey species are found in Costa Rica?', options: ['2', '3', '4', '6'], optionsEn: ['2', '3', '4', '6'], correct: 2, fact: 'קוף עכביש, קוף יללן, קפוצ\'ין, וסנאי — 4 מינים שונים!', factEn: 'Spider, Howler, Capuchin, and Squirrel — 4 different species!' },
  { question: 'באיזו שנה ביטלה קוסטה ריקה את הצבא?', questionEn: 'In what year did Costa Rica abolish its army?', options: ['1920', '1948', '1975', '1991'], optionsEn: ['1920', '1948', '1975', '1991'], correct: 1, fact: 'מאז 1948, התקציב שהלך לצבא מושקע בחינוך ובריאות!', factEn: 'Since 1948, the military budget has been invested in education and health!' },
  { question: 'מה המיוחד ביער הענן של מונטה ורדה?', questionEn: 'What is special about Monteverde Cloud Forest?', options: ['הוא מעל 3000 מטר', 'עננים נוגעים בעצים', 'יש בו שלג', 'הוא מדבר'], optionsEn: ['It\'s above 3000m', 'Clouds touch the trees', 'It has snow', 'It\'s a desert'], correct: 1, fact: 'ביער ענן, העננים ממש נוגעים בצמחייה — זה יוצר ערפל תמידי ולחות גבוהה!', factEn: 'In a cloud forest, clouds literally touch the vegetation — creating constant mist and high humidity!' },
  { question: 'איזה ציפור מיוחדת אפשר לראות בסן חרארדו דה דוטה?', questionEn: 'Which special bird can you see in San Gerardo de Dota?', options: ['תוכי ארה', 'קצאל מבריק', 'נשר חרפה', 'טוקן'], optionsEn: ['Scarlet Macaw', 'Resplendent Quetzal', 'Harpy Eagle', 'Toucan'], correct: 1, fact: 'הקצאל המבריק היה קדוש לעמי המאיה והאצטקים — נוצותיו שימשו כמטבע!', factEn: 'The Resplendent Quetzal was sacred to the Maya and Aztecs — its feathers were used as currency!' },
  { question: 'מה צורת ה"זנב הלוויתן" באוויטה?', questionEn: 'What is the "Whale\'s Tail" shape in Uvita?', options: ['סלע ענק', 'רצועת חול טבעית', 'שונית אלמוגים', 'גשר תלוי'], optionsEn: ['Giant rock', 'Natural sand formation', 'Coral reef', 'Suspension bridge'], correct: 1, fact: 'הטומבולו (רצועת חול) נראה בדיוק כמו זנב לוויתן — ובאמת באות לשם לווייתנים!', factEn: 'The tombolo (sand bar) looks exactly like a whale\'s tail — and real whales visit there too!' },
  { question: 'מדריד היא הבירה הגבוהה ביותר באירופה. כמה מטרים מעל פני הים?', questionEn: 'Madrid is Europe\'s highest capital. How many meters above sea level?', options: ['250 מטר', '450 מטר', '650 מטר', '850 מטר'], optionsEn: ['250m', '450m', '650m', '850m'], correct: 2, fact: 'מדריד ממוקמת 650 מטר מעל פני הים — ובקיץ יכול להגיע ל-40 מעלות!', factEn: 'Madrid sits at 650m above sea level — and summer temps can reach 40°C!' },
  { question: 'כמה אחוז מהמגוון הביולוגי העולמי נמצא בקוסטה ריקה?', questionEn: 'What percentage of global biodiversity is found in Costa Rica?', options: ['1%', '3%', '6%', '10%'], optionsEn: ['1%', '3%', '6%', '10%'], correct: 2, fact: 'קוסטה ריקה מכילה 6% מכלל המגוון הביולוגי בעולם — למרות שהיא רק 0.03% משטח היבשה!', factEn: 'Costa Rica holds 6% of global biodiversity — despite being only 0.03% of Earth\'s land area!' },
  { question: 'מה הצבע של צפרדע חץ הרעל?', questionEn: 'What color is the poison dart frog?', options: ['חום', 'ירוק כהה', 'אדום וכחול בהיר', 'שחור'], optionsEn: ['Brown', 'Dark green', 'Bright red and blue', 'Black'], correct: 2, fact: 'הצבעים הבוהקים מזהירים טורפים: "אל תאכל אותי!" — זה נקרא אזהרת צבע (aposematism).', factEn: 'The bright colors warn predators: "Don\'t eat me!" — this is called aposematism.' },
  { question: 'מהו ה"גאיו פינטו" — המנה הלאומית של קוסטה ריקה?', questionEn: 'What is "Gallo Pinto" — Costa Rica\'s national dish?', options: ['עוף צלוי', 'אורז ושעועית', 'מרק ירקות', 'טורטייה עם גבינה'], optionsEn: ['Roasted chicken', 'Rice and beans', 'Vegetable soup', 'Tortilla with cheese'], correct: 1, fact: 'גאיו פינטו פירושו "תרנגול צבוע" — בגלל המראה הנקודתי של האורז עם השעועית!', factEn: '"Gallo Pinto" means "painted rooster" — because of the speckled look of rice mixed with beans!' },
]

// ─── MEMORY DATA ───
interface MemoryCard {
  id: number
  emoji: string
  name: string
  nameEn: string
  matched: boolean
}

const memoryPairs = [
  { emoji: '🌋', name: 'הר געש', nameEn: 'Volcano' },
  { emoji: '🦜', name: 'תוכי', nameEn: 'Parrot' },
  { emoji: '🐒', name: 'קוף', nameEn: 'Monkey' },
  { emoji: '🦥', name: 'עצלן', nameEn: 'Sloth' },
  { emoji: '🐊', name: 'תנין', nameEn: 'Crocodile' },
  { emoji: '🐢', name: 'צב ים', nameEn: 'Sea Turtle' },
  { emoji: '🦋', name: 'פרפר', nameEn: 'Butterfly' },
  { emoji: '🐸', name: 'צפרדע', nameEn: 'Frog' },
  { emoji: '🐆', name: 'יגואר', nameEn: 'Jaguar' },
  { emoji: '🦎', name: 'אגואנה', nameEn: 'Iguana' },
  { emoji: '🐬', name: 'דולפין', nameEn: 'Dolphin' },
  { emoji: '🐋', name: 'לוויתן', nameEn: 'Whale' },
  { emoji: '🦈', name: 'כריש', nameEn: 'Shark' },
  { emoji: '🐝', name: 'דבורה', nameEn: 'Bee' },
  { emoji: '🕷️', name: 'עכביש', nameEn: 'Spider' },
  { emoji: '🦇', name: 'עטלף', nameEn: 'Bat' },
  { emoji: '🌴', name: 'דקל', nameEn: 'Palm Tree' },
  { emoji: '🌺', name: 'פרח', nameEn: 'Flower' },
  { emoji: '🍌', name: 'בננה', nameEn: 'Banana' },
  { emoji: '🥥', name: 'קוקוס', nameEn: 'Coconut' },
  { emoji: '☕', name: 'קפה', nameEn: 'Coffee' },
  { emoji: '🍫', name: 'שוקולד', nameEn: 'Cacao' },
  { emoji: '🏄', name: 'גלישה', nameEn: 'Surfing' },
  { emoji: '🌊', name: 'גל', nameEn: 'Wave' },
  { emoji: '🏖️', name: 'חוף', nameEn: 'Beach' },
  { emoji: '🐜', name: 'נמלה', nameEn: 'Ant' },
  { emoji: '🦩', name: 'פלמינגו', nameEn: 'Flamingo' },
  { emoji: '🦌', name: 'צבי', nameEn: 'Deer' },
]

interface MemorySize {
  id: string
  rows: number
  cols: number
  label: string
}

const memorySizes: MemorySize[] = [
  { id: '4x4', rows: 4, cols: 4, label: '4×4' },
  { id: '4x5', rows: 4, cols: 5, label: '4×5' },
  { id: '5x6', rows: 5, cols: 6, label: '5×6' },
  { id: '6x7', rows: 6, cols: 7, label: '6×7' },
  { id: '7x8', rows: 7, cols: 8, label: '7×8' },
]

interface MemoryRecord {
  seconds: number
  moves: number
  memberId: string
  memberName: string
  at: number
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── SCRAMBLE DATA ───
interface ScrambleWord {
  word: string
  wordEn: string
  scrambled: string
  hint: string
  hintEn: string
}

function shuffleString(str: string): string {
  const arr = str.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  const result = arr.join('')
  return result === str ? shuffleString(str) : result
}

const scrambleWords: Omit<ScrambleWord, 'scrambled'>[] = [
  { word: 'QUETZAL', wordEn: 'קצאל', hint: 'ציפור קדושה למאיה', hintEn: 'Sacred bird of the Maya' },
  { word: 'ARENAL', wordEn: 'ארנל', hint: 'הר געש מפורסם', hintEn: 'Famous volcano' },
  { word: 'TOUCAN', wordEn: 'טוקן', hint: 'ציפור עם מקור ענק', hintEn: 'Bird with a giant beak' },
  { word: 'JAGUAR', wordEn: 'יגואר', hint: 'החתול הגדול ביותר באמריקה', hintEn: 'Largest cat in the Americas' },
  { word: 'SLOTH', wordEn: 'עצלן', hint: 'החיה האיטית ביותר', hintEn: 'The slowest animal' },
  { word: 'CORCOVADO', wordEn: 'קורקובדו', hint: 'פארק לאומי עם 2.5% מהמגוון הביולוגי', hintEn: 'National park with 2.5% of world biodiversity' },
  { word: 'TAPIR', wordEn: 'טפיר', hint: 'מאובן חי — קיים 20 מיליון שנה', hintEn: 'Living fossil — existed for 20 million years' },
  { word: 'MONTEVERDE', wordEn: 'מונטה ורדה', hint: 'יער ענן מפורסם', hintEn: 'Famous cloud forest' },
  { word: 'MACAW', wordEn: 'מקאו', hint: 'תוכי אדום גדול', hintEn: 'Large red parrot' },
  { word: 'CAPUCHIN', wordEn: 'קפוצ\'ין', hint: 'הקוף החכם ביותר בקוסטה ריקה', hintEn: 'The smartest monkey in Costa Rica' },
]

// ─── JIGSAW DATA ───
const jigsawImages = [
  { src: '/images/jigsaw-arenal.jpg', name: 'הר הגעש ארנל', nameEn: 'Arenal Volcano' },
  { src: '/images/jigsaw-sloth.jpg', name: 'עצלן', nameEn: 'Sloth' },
  { src: '/images/jigsaw-rio-celeste.jpg', name: 'ריו סלסטה', nameEn: 'Rio Celeste' },
  { src: '/images/jigsaw-monteverde.jpg', name: 'מונטה ורדה', nameEn: 'Monteverde' },
  { src: '/images/jigsaw-beach.jpg', name: 'מנואל אנטוניו', nameEn: 'Manuel Antonio' },
  { src: '/images/jigsaw-macaw.jpg', name: 'מקאו ארגמני', nameEn: 'Scarlet Macaws' },
  { src: '/images/jigsaw-whale.jpg', name: 'לוויתן באוויטה', nameEn: 'Whale at Uvita' },
  { src: '/images/jigsaw-frog.jpg', name: 'צפרדע עצים', nameEn: 'Tree Frog' },
]

// ─── CROSSWORD DATA ───
interface CrosswordClue {
  number: number
  direction: 'across' | 'down'
  clue: string
  clueEn: string
  answer: string
  row: number
  col: number
}

// Convert a final Hebrew letter to its regular form (puzzles are normalized)
const HEB_FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }
const normHeb = (s: string) => [...s].map(c => HEB_FINALS[c] || c).join('')

function buildCrosswordGrid(clues: CrosswordClue[], size: number) {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  const numberGrid: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  for (const clue of clues) {
    for (let i = 0; i < clue.answer.length; i++) {
      const r = clue.direction === 'across' ? clue.row : clue.row + i
      const c = clue.direction === 'across' ? clue.col + i : clue.col
      if (r < size && c < size) grid[r][c] = clue.answer[i]
    }
    if (numberGrid[clue.row][clue.col] == null) numberGrid[clue.row][clue.col] = clue.number
  }
  return { grid, numberGrid }
}

// ─── SPANISH PHRASEBOOK DATA ───
const allPhrases = spanishCategories.flatMap(c => c.phrases)
const totalPhraseCount = allPhrases.length

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'es-ES'
  u.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  const esVoice = voices.find(v => v.lang.startsWith('es'))
  if (esVoice) u.voice = esVoice
  window.speechSynthesis.speak(u)
}

// ─── COLORING DATA ───
interface ColoringImage {
  id: string
  name: string
  nameEn: string
  emoji: string
  src: string
}

const coloringImages: ColoringImage[] = [
  { id: 'toucan', name: 'טוקן', nameEn: 'Toucan', emoji: '🦜', src: '/images/coloring-toucan.jpg' },
  { id: 'sloth', name: 'עצלן', nameEn: 'Sloth', emoji: '🦥', src: '/images/coloring-sloth.jpg' },
  { id: 'frog', name: 'צפרדע', nameEn: 'Tree Frog', emoji: '🐸', src: '/images/coloring-frog.jpg' },
  { id: 'turtle', name: 'צב ים', nameEn: 'Sea Turtle', emoji: '🐢', src: '/images/coloring-turtle.jpg' },
  { id: 'volcano', name: 'הר געש', nameEn: 'Volcano', emoji: '🌋', src: '/images/coloring-volcano.jpg' },
  { id: 'quetzal', name: 'קצאל', nameEn: 'Quetzal', emoji: '🐦', src: '/images/coloring-quetzal.jpg' },
  { id: 'monkey-howler', name: 'קוף יללן', nameEn: 'Howler Monkey', emoji: '🐒', src: '/images/coloring-monkey-howler.jpg' },
  { id: 'monkey-spider', name: 'קוף עכביש', nameEn: 'Spider Monkey', emoji: '🐵', src: '/images/coloring-monkey-spider.jpg' },
  { id: 'jaguar', name: 'יגואר', nameEn: 'Jaguar', emoji: '🐆', src: '/images/coloring-jaguar.jpg' },
  { id: 'tapir', name: 'טפיר', nameEn: 'Tapir', emoji: '🦏', src: '/images/coloring-tapir.jpg' },
  { id: 'morpho', name: 'פרפר מורפו', nameEn: 'Morpho Butterfly', emoji: '🦋', src: '/images/coloring-morpho.jpg' },
  { id: 'hummingbird', name: 'יונק דבש', nameEn: 'Hummingbird', emoji: '🐦', src: '/images/coloring-hummingbird.jpg' },
  { id: 'macaw', name: 'מקאו', nameEn: 'Scarlet Macaw', emoji: '🦜', src: '/images/coloring-macaw.jpg' },
  { id: 'iguana', name: 'אגואנה', nameEn: 'Iguana', emoji: '🦎', src: '/images/coloring-iguana.jpg' },
  { id: 'crocodile', name: 'תנין', nameEn: 'Crocodile', emoji: '🐊', src: '/images/coloring-crocodile.jpg' },
  { id: 'ocelot', name: 'אוצלוט', nameEn: 'Ocelot', emoji: '🐱', src: '/images/coloring-ocelot.jpg' },
  { id: 'dart-frog', name: 'צפרדע חץ', nameEn: 'Poison Dart Frog', emoji: '🐸', src: '/images/coloring-dart-frog.jpg' },
  { id: 'coati', name: 'קואטי', nameEn: 'Coati', emoji: '🦝', src: '/images/coloring-coati.jpg' },
  { id: 'dolphin', name: 'דולפין', nameEn: 'Dolphins', emoji: '🐬', src: '/images/coloring-dolphin.jpg' },
  { id: 'whale', name: 'לוויתן', nameEn: 'Humpback Whale', emoji: '🐋', src: '/images/coloring-whale.jpg' },
  { id: 'anteater', name: 'אוכל נמלים', nameEn: 'Anteater', emoji: '🐜', src: '/images/coloring-anteater.jpg' },
  { id: 'waterfall', name: 'מפל', nameEn: 'Waterfall', emoji: '💧', src: '/images/coloring-waterfall.jpg' },
  { id: 'rio-celeste', name: 'ריו סלסטה', nameEn: 'Rio Celeste', emoji: '🏞️', src: '/images/coloring-rio-celeste.jpg' },
  { id: 'cloud-forest', name: 'יער ענן', nameEn: 'Cloud Forest', emoji: '🌿', src: '/images/coloring-cloud-forest.jpg' },
  { id: 'coral-reef', name: 'שונית אלמוגים', nameEn: 'Coral Reef', emoji: '🐠', src: '/images/coloring-coral-reef.jpg' },
  { id: 'mangrove', name: 'מנגרוב', nameEn: 'Mangrove', emoji: '🌳', src: '/images/coloring-mangrove.jpg' },
  { id: 'beach', name: 'חוף טרופי', nameEn: 'Tropical Beach', emoji: '🏖️', src: '/images/coloring-beach.jpg' },
  { id: 'hot-springs', name: 'מעיינות חמים', nameEn: 'Hot Springs', emoji: '♨️', src: '/images/coloring-hot-springs.jpg' },
  { id: 'bridges', name: 'גשרים תלויים', nameEn: 'Hanging Bridges', emoji: '🌉', src: '/images/coloring-bridges.jpg' },
  { id: 'canopy', name: 'חופת יער', nameEn: 'Rainforest Canopy', emoji: '🌴', src: '/images/coloring-canopy.jpg' },
  { id: 'orchid', name: 'סחלב', nameEn: 'Orchid', emoji: '🌺', src: '/images/coloring-orchid.jpg' },
  { id: 'heliconia', name: 'הליקוניה', nameEn: 'Heliconia', emoji: '🌸', src: '/images/coloring-heliconia.jpg' },
  { id: 'coffee', name: 'קפה', nameEn: 'Coffee Plantation', emoji: '☕', src: '/images/coloring-coffee.jpg' },
  { id: 'cacao', name: 'קקאו', nameEn: 'Cacao Tree', emoji: '🍫', src: '/images/coloring-cacao.jpg' },
  { id: 'banana', name: 'בננה', nameEn: 'Banana Tree', emoji: '🍌', src: '/images/coloring-banana.jpg' },
  { id: 'zipline', name: 'זיפליין', nameEn: 'Zipline', emoji: '🧗', src: '/images/coloring-zipline.jpg' },
  { id: 'rafting', name: 'רפטינג', nameEn: 'White Water Rafting', emoji: '🚣', src: '/images/coloring-rafting.jpg' },
  { id: 'surfing', name: 'גלישה', nameEn: 'Surfing', emoji: '🏄', src: '/images/coloring-surfing.jpg' },
  { id: 'snorkeling', name: 'שנורקלינג', nameEn: 'Snorkeling', emoji: '🤿', src: '/images/coloring-snorkeling.jpg' },
  { id: 'horseback', name: 'רכיבה על סוסים', nameEn: 'Horseback Riding', emoji: '🐴', src: '/images/coloring-horseback.jpg' },
  { id: 'kayak', name: 'קיאק', nameEn: 'Kayaking', emoji: '🛶', src: '/images/coloring-kayak.jpg' },
  { id: 'oxcart', name: 'עגלת שוורים', nameEn: 'Painted Oxcart', emoji: '🎨', src: '/images/coloring-oxcart.jpg' },
  { id: 'gallo-pinto', name: 'גאיו פינטו', nameEn: 'Gallo Pinto', emoji: '🍳', src: '/images/coloring-gallo-pinto.jpg' },
  { id: 'fruits', name: 'פירות טרופיים', nameEn: 'Tropical Fruits', emoji: '🥭', src: '/images/coloring-fruits.jpg' },
  { id: 'seahorse', name: 'סוסון ים', nameEn: 'Seahorse', emoji: '🐴', src: '/images/coloring-seahorse.jpg' },
  { id: 'pelican', name: 'שקנאי', nameEn: 'Pelican', emoji: '🐦', src: '/images/coloring-pelican.jpg' },
  { id: 'toucan-family', name: 'משפחת טוקנים', nameEn: 'Toucan Family', emoji: '🦜', src: '/images/coloring-toucan-family.jpg' },
  { id: 'parrot', name: 'תוכי', nameEn: 'Green Parrot', emoji: '🦜', src: '/images/coloring-parrot.jpg' },
  { id: 'tree-boa', name: 'נחש עצים', nameEn: 'Tree Boa', emoji: '🐍', src: '/images/coloring-tree-boa.jpg' },
  { id: 'sunset', name: 'שקיעה', nameEn: 'Pacific Sunset', emoji: '🌅', src: '/images/coloring-sunset.jpg' },
]

// ─── TRIVIA GAME ───
function TriviaGame({ t }: { t: (he: string, en: string) => string }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [questions] = useState(() => [...triviaQuestions].sort(() => Math.random() - 0.5).slice(0, 10))

  const q = questions[current]
  const isLast = current === questions.length - 1

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === q.correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (isLast) { setShowResult(true) } else { setCurrent(c => c + 1); setSelected(null) }
  }

  const handleRestart = () => { setCurrent(0); setSelected(null); setScore(0); setShowResult(false) }

  if (showResult) {
    const pct = Math.round((score / questions.length) * 100)
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🌟' : pct >= 40 ? '👍' : '📚'
    return (
      <div className="game-result">
        <div className="game-result-emoji">{emoji}</div>
        <h3>{t('תוצאה', 'Result')}</h3>
        <div className="game-result-score">{score}/{questions.length}</div>
        <p className="game-result-pct">{pct}%</p>
        <p className="game-result-msg">
          {pct >= 80 ? t('מדהים! אתם מוכנים לקוסטה ריקה!', 'Amazing! You\'re ready for Costa Rica!')
            : pct >= 60 ? t('יופי! יודעים הרבה!', 'Great! You know a lot!')
            : t('יש עוד מה ללמוד — נסו שוב!', 'More to learn — try again!')}
        </p>
        <button className="game-btn" onClick={handleRestart}><RotateCcw size={16} /> {t('שחק שוב', 'Play Again')}</button>
      </div>
    )
  }

  return (
    <div className="trivia-game">
      <div className="trivia-progress">
        <span>{current + 1}/{questions.length}</span>
        <div className="trivia-progress-bar"><div className="trivia-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
        <span className="trivia-score"><Star size={14} /> {score}</span>
      </div>
      <h3 className="trivia-question">{t(q.question, q.questionEn)}</h3>
      <div className="trivia-options">
        {(t(q.options.join('||'), q.optionsEn.join('||'))).split('||').map((opt, i) => {
          let cls = 'trivia-option'
          if (selected !== null) { if (i === q.correct) cls += ' correct'; else if (i === selected) cls += ' wrong' }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={selected !== null}>
              <span className="trivia-option-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
              {selected !== null && i === q.correct && <Check size={18} />}
              {selected !== null && i === selected && i !== q.correct && <X size={18} />}
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <div className="trivia-fact">
          <span className="trivia-fact-label">{t('ידעת?', 'Did you know?')}</span>
          <p>{t(q.fact, q.factEn)}</p>
          <button className="game-btn" onClick={handleNext}>{isLast ? t('ראה תוצאות', 'See Results') : t('הבא', 'Next')}</button>
        </div>
      )}
    </div>
  )
}

// ─── MEMORY GAME ───
function MemoryGame({ t }: { t: (he: string, en: string) => string }) {
  const { member } = useAuth()
  const [size, setSize] = useState<MemorySize | null>(null)
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  // Timer: accumulated ms from prior segments + current running segment (pausable)
  const [accumulated, setAccumulated] = useState(0)
  const [runningSince, setRunningSince] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [finalTime, setFinalTime] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const lockRef = useRef(false)

  // Family records live in Firestore; personal records in localStorage
  const [familyRecords, setFamilyRecords] = useSharedState<Record<string, MemoryRecord>>('memory-records', {})
  const [personalRecords, setPersonalRecords] = useState<Record<string, MemoryRecord>>(() => {
    try { return JSON.parse(localStorage.getItem('memory-records-personal') || '{}') } catch { return {} }
  })

  const started = accumulated > 0 || runningSince !== null
  const isPaused = started && runningSince === null && !gameWon
  const currentMs = accumulated + (runningSince !== null ? now - runningSince : 0)

  // Live timer tick (only while running)
  useEffect(() => {
    if (runningSince === null || gameWon) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [runningSince, gameWon])

  const pauseTimer = () => {
    if (runningSince === null || flipped.length > 0) return
    setAccumulated(a => a + (Date.now() - runningSince))
    setRunningSince(null)
  }
  const resumeTimer = () => {
    if (runningSince !== null) return
    setRunningSince(Date.now()); setNow(Date.now())
  }

  const startGame = (s: MemorySize) => {
    const pairCount = (s.rows * s.cols) / 2
    const chosen = [...memoryPairs].sort(() => Math.random() - 0.5).slice(0, pairCount)
    const pairs = chosen.flatMap((p, i) => [
      { id: i * 2, emoji: p.emoji, name: p.name, nameEn: p.nameEn, matched: false },
      { id: i * 2 + 1, emoji: p.emoji, name: p.name, nameEn: p.nameEn, matched: false },
    ])
    for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]] }
    setSize(s); setCards(pairs); setFlipped([]); setMoves(0); setGameWon(false)
    setAccumulated(0); setRunningSince(null); setNow(0); setFinalTime(0); setIsNewRecord(false); lockRef.current = false
  }

  const finishGame = (elapsedSec: number) => {
    setFinalTime(elapsedSec)
    setGameWon(true)
    if (!size || !member) return
    const rec: MemoryRecord = { seconds: elapsedSec, moves, memberId: member.id, memberName: member.name, at: Date.now() }
    // Personal record
    const pPrev = personalRecords[size.id]
    if (!pPrev || elapsedSec < pPrev.seconds) {
      const next = { ...personalRecords, [size.id]: rec }
      setPersonalRecords(next)
      localStorage.setItem('memory-records-personal', JSON.stringify(next))
      setIsNewRecord(true)
    }
    // Family record
    const fPrev = familyRecords[size.id]
    if (!fPrev || elapsedSec < fPrev.seconds) {
      setFamilyRecords(prev => ({ ...prev, [size.id]: rec }))
      setIsNewRecord(true)
    }
  }

  const handleFlip = (idx: number) => {
    if (lockRef.current || isPaused || flipped.includes(idx) || cards[idx].matched) return
    if (!started) { setRunningSince(Date.now()); setNow(Date.now()) }
    const newFlipped = [...flipped, idx]
    setFlipped(newFlipped)
    if (newFlipped.length === 2) {
      lockRef.current = true; setMoves(m => m + 1)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c))
          setFlipped([]); lockRef.current = false
          if (cards.every((c, i) => (i === a || i === b) ? true : c.matched)) {
            const elapsed = Math.round((accumulated + (runningSince !== null ? Date.now() - runningSince : 0)) / 1000)
            finishGame(elapsed)
          }
        }, 500)
      } else { setTimeout(() => { setFlipped([]); lockRef.current = false }, 800) }
    }
  }

  const elapsedSec = Math.round(currentMs / 1000)

  // ── Size selection screen ──
  if (!size) {
    return (
      <div className="memory-game">
        <p className="coloring-subtitle">{t('בחרו גודל לוח', 'Choose board size')}</p>
        <div className="memory-size-grid">
          {memorySizes.map(s => {
            const pr = personalRecords[s.id]
            const fr = familyRecords[s.id]
            return (
              <button key={s.id} className="memory-size-card" onClick={() => startGame(s)}>
                <span className="memory-size-label">{s.label}</span>
                <span className="memory-size-count">{s.rows * s.cols} {t('קלפים', 'cards')}</span>
                <div className="memory-size-records">
                  <span>🏅 {pr ? formatTime(pr.seconds) : '—'}</span>
                  <span>👑 {fr ? `${formatTime(fr.seconds)} (${fr.memberName})` : '—'}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Win screen ──
  if (gameWon) {
    const fr = familyRecords[size.id]
    const pr = personalRecords[size.id]
    return (
      <div className="game-result">
        <div className="game-result-emoji">{isNewRecord ? '🏆' : '⭐'}</div>
        <h3>{isNewRecord ? t('שיא חדש!', 'New Record!') : t('כל הכבוד!', 'Well Done!')}</h3>
        <p>{t(`זמן: ${formatTime(finalTime)} · ${moves} מהלכים`, `Time: ${formatTime(finalTime)} · ${moves} moves`)}</p>
        <div className="memory-record-box">
          <div><span>🏅 {t('שיא אישי', 'Personal best')}</span><span>{pr ? formatTime(pr.seconds) : '—'}</span></div>
          <div><span>👑 {t('שיא משפחתי', 'Family best')}</span><span>{fr ? `${formatTime(fr.seconds)} · ${fr.memberName}` : '—'}</span></div>
        </div>
        <button className="game-btn" onClick={() => startGame(size)}><RotateCcw size={16} /> {t('שחק שוב', 'Play Again')}</button>
        <button className="game-btn secondary" style={{ marginTop: 8 }} onClick={() => setSize(null)}>{t('שנה גודל', 'Change Size')}</button>
      </div>
    )
  }

  // ── Board ──
  const canPause = started && flipped.length === 0
  return (
    <div className="memory-game">
      <div className="memory-stats">
        <span>⏱️ {formatTime(elapsedSec)}</span>
        <span>{t('מהלכים', 'Moves')}: {moves}</span>
        <span>{t('זוגות', 'Pairs')}: {cards.filter(c => c.matched).length / 2}/{cards.length / 2}</span>
      </div>
      <div className="memory-controls">
        {isPaused ? (
          <button className="memory-pause-btn" onClick={resumeTimer}>▶️ {t('המשך', 'Resume')}</button>
        ) : (
          <button className="memory-pause-btn" onClick={pauseTimer} disabled={!canPause}>⏸️ {t('השהה', 'Pause')}</button>
        )}
      </div>
      <div className="memory-grid-wrap">
        <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)` }}>
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || card.matched
            return (
              <button key={card.id} className={`memory-card ${isFlipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`} onClick={() => handleFlip(idx)}>
                <div className="memory-card-inner">
                  <div className="memory-card-front">🌿</div>
                  <div className="memory-card-back">
                    <span className="memory-emoji">{card.emoji}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {isPaused && (
          <div className="memory-pause-overlay" onClick={resumeTimer}>
            <span>⏸️</span>
            <p>{t('מושהה — הקש להמשך', 'Paused — tap to resume')}</p>
          </div>
        )}
      </div>
      <button className="game-btn secondary" style={{ marginTop: 12 }} onClick={() => setSize(null)}>{t('שנה גודל', 'Change Size')}</button>
    </div>
  )
}

// ─── WORD SCRAMBLE GAME ───
function ScrambleGame({ t }: { t: (he: string, en: string) => string }) {
  const [words] = useState(() => [...scrambleWords].sort(() => Math.random() - 0.5).slice(0, 8).map(w => ({ ...w, scrambled: shuffleString(w.word) })))
  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing')
  const [done, setDone] = useState(false)

  const w = words[current]

  const handleSubmit = () => { if (input.toUpperCase().trim() === w.word) { setScore(s => s + (showHint ? 1 : 2)); setStatus('correct') } else { setStatus('wrong') } }
  const handleNext = () => { if (current >= words.length - 1) { setDone(true) } else { setCurrent(c => c + 1); setInput(''); setShowHint(false); setStatus('playing') } }
  const handleRestart = () => { setCurrent(0); setInput(''); setScore(0); setShowHint(false); setStatus('playing'); setDone(false) }

  if (done) {
    const max = words.length * 2; const pct = Math.round((score / max) * 100)
    return (
      <div className="game-result">
        <div className="game-result-emoji">{pct >= 75 ? '🏆' : pct >= 50 ? '🌟' : '📚'}</div>
        <h3>{t('תוצאה', 'Result')}</h3>
        <div className="game-result-score">{score}/{max}</div>
        <p className="game-result-pct">{pct}%</p>
        <button className="game-btn" onClick={handleRestart}><RotateCcw size={16} /> {t('שחק שוב', 'Play Again')}</button>
      </div>
    )
  }

  return (
    <div className="scramble-game">
      <div className="trivia-progress">
        <span>{current + 1}/{words.length}</span>
        <div className="trivia-progress-bar"><div className="trivia-progress-fill" style={{ width: `${((current + 1) / words.length) * 100}%` }} /></div>
        <span className="trivia-score"><Star size={14} /> {score}</span>
      </div>
      <div className="scramble-word">{w.scrambled}</div>
      <p className="scramble-he">{t(w.wordEn, w.word)}</p>
      {showHint && <p className="scramble-hint">{t(w.hint, w.hintEn)}</p>}
      {status === 'playing' ? (
        <>
          <input className="scramble-input" value={input} onChange={e => setInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && input.trim() && handleSubmit()} placeholder={t('הקלד את התשובה באנגלית...', 'Type your answer...')} autoComplete="off" autoCapitalize="characters" />
          <div className="scramble-actions">
            {!showHint && <button className="game-btn secondary" onClick={() => setShowHint(true)}>{t('רמז', 'Hint')}</button>}
            <button className="game-btn" onClick={handleSubmit} disabled={!input.trim()}>{t('בדוק', 'Check')}</button>
          </div>
        </>
      ) : (
        <div className={`scramble-feedback ${status}`}>
          <p>{status === 'correct' ? t('נכון! 🎉', 'Correct! 🎉') : t(`לא נכון — התשובה: ${w.word}`, `Incorrect — answer: ${w.word}`)}</p>
          <button className="game-btn" onClick={handleNext}>{current >= words.length - 1 ? t('ראה תוצאות', 'See Results') : t('הבא', 'Next')}</button>
        </div>
      )}
    </div>
  )
}

// ─── JIGSAW PUZZLE GAME ───
interface JigsawPiece {
  id: number
  row: number
  col: number
  x: number
  y: number
  placed: boolean
  edges: [number, number, number, number]
}

function generateEdges(rows: number, cols: number): [number, number, number, number][] {
  const edges: [number, number, number, number][] = []
  const hEdges: number[][] = []
  const vEdges: number[][] = []
  for (let r = 0; r <= rows; r++) {
    hEdges[r] = []
    for (let c = 0; c < cols; c++) hEdges[r][c] = (r === 0 || r === rows) ? 0 : (Math.random() > 0.5 ? 1 : -1)
  }
  for (let r = 0; r < rows; r++) {
    vEdges[r] = []
    for (let c = 0; c <= cols; c++) vEdges[r][c] = (c === 0 || c === cols) ? 0 : (Math.random() > 0.5 ? 1 : -1)
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      edges.push([hEdges[r][c], vEdges[r][c + 1], -hEdges[r + 1][c], -vEdges[r][c]])
    }
  }
  return edges
}

// Draw one jigsaw edge from (x0,y0) to (x1,y1) with outward normal (nx,ny).
// value>0 → tab (bulges outward), value<0 → blank (indents inward), 0 → flat.
// Because neighboring pieces receive exactly opposite values AND opposite
// normals for the shared edge, both render the IDENTICAL curve → perfect fit.
function jigsawEdge(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  nx: number, ny: number, value: number, tab: number
) {
  if (value === 0) { ctx.lineTo(x1, y1); return }
  const lerp = (a: number, b: number, tt: number) => a + (b - a) * tt
  const ax = lerp(x0, x1, 0.35), ay = lerp(y0, y1, 0.35)
  const mx = lerp(x0, x1, 0.5), my = lerp(y0, y1, 0.5)
  const cx = lerp(x0, x1, 0.65), cy = lerp(y0, y1, 0.65)
  const dp = value * tab * 0.85   // peak protrusion along normal
  const dn = value * tab * 0.12   // small kick at the neck
  ctx.lineTo(ax, ay)
  ctx.bezierCurveTo(ax + nx * dn, ay + ny * dn, ax + nx * dp, ay + ny * dp, mx + nx * dp, my + ny * dp)
  ctx.bezierCurveTo(cx + nx * dp, cy + ny * dp, cx + nx * dn, cy + ny * dn, cx, cy)
  ctx.lineTo(x1, y1)
}

function drawJigsawPiece(
  ctx: CanvasRenderingContext2D, source: HTMLCanvasElement,
  col: number, row: number, pw: number, ph: number, edges: [number, number, number, number],
  tab: number
) {
  const sx = col * pw, sy = row * ph
  const pad = tab
  // Corners of the piece body (clockwise): TL, TR, BR, BL
  const TL = [pad, pad], TR = [pad + pw, pad], BR = [pad + pw, pad + ph], BL = [pad, pad + ph]
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(TL[0], TL[1])
  jigsawEdge(ctx, TL[0], TL[1], TR[0], TR[1], 0, -1, edges[0], tab) // top
  jigsawEdge(ctx, TR[0], TR[1], BR[0], BR[1], 1, 0, edges[1], tab)  // right
  jigsawEdge(ctx, BR[0], BR[1], BL[0], BL[1], 0, 1, edges[2], tab)  // bottom
  jigsawEdge(ctx, BL[0], BL[1], TL[0], TL[1], -1, 0, edges[3], tab) // left
  ctx.closePath()
  ctx.clip()
  // Source canvas already contains the image scaled to board size, offset by tab.
  // Copy pixels 1:1 — no rescaling, so pieces align exactly with the board grid.
  ctx.drawImage(source, sx, sy, pw + pad * 2, ph + pad * 2, 0, 0, pw + pad * 2, ph + pad * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

interface JigsawSize { id: string; cols: number; rows: number; label: string }
const jigsawSizes: JigsawSize[] = [
  { id: '4x6', cols: 4, rows: 6, label: '4×6' },
  { id: '6x9', cols: 6, rows: 9, label: '6×9' },
  { id: '8x12', cols: 8, rows: 12, label: '8×12' },
  { id: '10x15', cols: 10, rows: 15, label: '10×15' },
]

function JigsawGame({ t }: { t: (he: string, en: string) => string }) {
  const { member } = useAuth()
  const [size, setSize] = useState<JigsawSize | null>(null)
  const [imgIdx, setImgIdx] = useState(() => Math.floor(Math.random() * jigsawImages.length))
  const [round, setRound] = useState(0)
  // Pausable timer: accumulated ms + current running segment
  const [accumulated, setAccumulated] = useState(0)
  const [runningSince, setRunningSince] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [finalTime, setFinalTime] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)

  const [familyRecords, setFamilyRecords] = useSharedState<Record<string, MemoryRecord>>('jigsaw-records', {})
  const [personalRecords, setPersonalRecords] = useState<Record<string, MemoryRecord>>(() => {
    try { return JSON.parse(localStorage.getItem('jigsaw-records-personal') || '{}') } catch { return {} }
  })
  const [pieces, setPieces] = useState<JigsawPiece[]>([])
  const [renderTick, setRenderTick] = useState(0)
  const [solved, setSolved] = useState(false)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [placedCount, setPlacedCount] = useState(0)
  const boardRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({})
  const sourceRef = useRef<HTMLCanvasElement | null>(null)
  const sizeRef = useRef({ pw: 0, ph: 0, tab: 0, boardW: 0, boardH: 0, trayH: 0 })

  const imgData = jigsawImages[imgIdx]
  const COLS = size?.cols ?? 6
  const ROWS = size?.rows ?? 8
  const TOTAL = COLS * ROWS
  const RECORD_KEY = size?.id ?? ''

  const started = accumulated > 0 || runningSince !== null
  const isPaused = started && runningSince === null && !solved
  const currentMs = accumulated + (runningSince !== null ? now - runningSince : 0)

  const resetTimer = () => { setAccumulated(0); setRunningSince(null); setNow(0); setFinalTime(0); setIsNewRecord(false) }

  const startPuzzle = (s: JigsawSize) => {
    setSize(s); setRound(r => r + 1); resetTimer()
    setSolved(false); setPlacedCount(0); setDragging(null)
  }

  const newImage = () => {
    setImgIdx(prev => {
      let next = Math.floor(Math.random() * jigsawImages.length)
      if (jigsawImages.length > 1 && next === prev) next = (next + 1) % jigsawImages.length
      return next
    })
    setRound(r => r + 1); resetTimer()
    setSolved(false); setPlacedCount(0); setDragging(null)
  }

  const pauseTimer = () => {
    if (runningSince === null || dragging !== null) return
    setAccumulated(a => a + (Date.now() - runningSince))
    setRunningSince(null)
  }
  const resumeTimer = () => {
    if (runningSince !== null) return
    setRunningSince(Date.now()); setNow(Date.now())
  }

  // Live timer tick (only while running)
  useEffect(() => {
    if (runningSince === null || solved) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [runningSince, solved])

  useEffect(() => {
    if (!size) return
    let cancelled = false
    const cols = size.cols, rows = size.rows, total = cols * rows
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      const maxW = Math.min(window.innerWidth - 16, 460)
      const pw = Math.floor(maxW / cols)
      const boardW = pw * cols
      const ph = Math.floor(boardW * (img.naturalHeight / img.naturalWidth) / rows)
      const boardH = ph * rows
      const tab = Math.max(4, Math.floor(Math.min(pw, ph) * 0.22))
      // Lay tray pieces out in a NON-overlapping grid so every piece is reachable
      const trayCols = cols
      const trayRows = Math.ceil(total / trayCols)
      const cellH = ph + tab + 6
      const trayH = trayRows * cellH + 12
      sizeRef.current = { pw, ph, tab, boardW, boardH, trayH }

      // Pre-scale the image once into an offscreen canvas (padded by tab on all sides)
      const source = document.createElement('canvas')
      source.width = boardW + tab * 2
      source.height = boardH + tab * 2
      source.getContext('2d')!.drawImage(img, tab, tab, boardW, boardH)
      sourceRef.current = source

      const edges = generateEdges(rows, cols)
      const newPieces: JigsawPiece[] = []
      for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols), col = i % cols
        newPieces.push({ id: i, row, col, placed: false, x: 0, y: 0, edges: edges[i] })
      }
      // Shuffle which piece lands in which tray slot
      for (let i = newPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPieces[i], newPieces[j]] = [newPieces[j], newPieces[i]]
      }
      // Assign a distinct tray-grid slot to each piece (small jitter for organic look)
      newPieces.forEach((p, slot) => {
        const tCol = slot % trayCols, tRow = Math.floor(slot / trayCols)
        const jitter = (Math.random() - 0.5) * 5
        p.x = tCol * pw + jitter
        p.y = boardH + 18 + tRow * cellH + jitter
      })
      setPieces(newPieces)
      setPlacedCount(0)
      setSolved(false)
      setDragging(null)
      setRenderTick(k => k + 1)
    }
    img.src = imgData.src
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgData.src, round, size])

  useEffect(() => {
    const source = sourceRef.current
    if (!source || pieces.length === 0) return
    const { pw, ph, tab } = sizeRef.current
    pieces.forEach(p => {
      const canvas = canvasRefs.current[p.id]
      if (!canvas) return
      canvas.width = pw + tab * 2
      canvas.height = ph + tab * 2
      const ctx = canvas.getContext('2d')!
      drawJigsawPiece(ctx, source, p.col, p.row, pw, ph, p.edges, tab)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick, pieces.length])

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const board = boardRef.current!
    const rect = board.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent, pieceId: number) => {
    if (solved || isPaused) return
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece || piece.placed) return
    if (!started) { setRunningSince(Date.now()); setNow(Date.now()) }
    const pos = getPointerPos(e)
    setDragOffset({ x: pos.x - piece.x, y: pos.y - piece.y })
    setDragging(pieceId)
    setPieces(prev => {
      const idx = prev.findIndex(p => p.id === pieceId)
      const moved = [...prev]
      moved.push(moved.splice(idx, 1)[0])
      return moved
    })
  }

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragging === null) return
    if ('touches' in e) e.preventDefault()
    const pos = getPointerPos(e)
    setPieces(prev => prev.map(p =>
      p.id === dragging ? { ...p, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : p
    ))
  }

  const onPointerUp = () => {
    if (dragging === null) return
    const { pw, ph } = sizeRef.current
    const snapDist = pw * 0.3
    setPieces(prev => {
      const updated = prev.map(p => {
        if (p.id !== dragging) return p
        const targetX = p.col * pw
        const targetY = p.row * ph
        const dx = Math.abs(p.x - targetX)
        const dy = Math.abs(p.y - targetY)
        if (dx < snapDist && dy < snapDist) {
          return { ...p, x: targetX, y: targetY, placed: true }
        }
        return p
      })
      const newPlaced = updated.filter(p => p.placed).length
      setPlacedCount(newPlaced)
      if (newPlaced === TOTAL) {
        const elapsed = Math.round((accumulated + (runningSince !== null ? Date.now() - runningSince : 0)) / 1000)
        recordWin(elapsed)
        setSolved(true)
      }
      return updated
    })
    setDragging(null)
  }

  const recordWin = (elapsedSec: number) => {
    setFinalTime(elapsedSec)
    if (!member) return
    const rec: MemoryRecord = { seconds: elapsedSec, moves: 0, memberId: member.id, memberName: member.name, at: Date.now() }
    const pPrev = personalRecords[RECORD_KEY]
    if (!pPrev || elapsedSec < pPrev.seconds) {
      const next = { ...personalRecords, [RECORD_KEY]: rec }
      setPersonalRecords(next)
      localStorage.setItem('jigsaw-records-personal', JSON.stringify(next))
      setIsNewRecord(true)
    }
    const fPrev = familyRecords[RECORD_KEY]
    if (!fPrev || elapsedSec < fPrev.seconds) {
      setFamilyRecords(prev => ({ ...prev, [RECORD_KEY]: rec }))
      setIsNewRecord(true)
    }
  }

  // ── Size selection screen ──
  if (!size) {
    return (
      <div className="jigsaw-game">
        <p className="coloring-subtitle">{t('בחרו גודל פאזל', 'Choose puzzle size')}</p>
        <div className="memory-size-grid">
          {jigsawSizes.map(s => {
            const pr = personalRecords[s.id]
            const fr = familyRecords[s.id]
            return (
              <button key={s.id} className="memory-size-card" onClick={() => startPuzzle(s)}>
                <span className="memory-size-label">{s.label}</span>
                <span className="memory-size-count">{s.cols * s.rows} {t('חלקים', 'pieces')}</span>
                <div className="memory-size-records">
                  <span>🏅 {pr ? formatTime(pr.seconds) : '—'}</span>
                  <span>👑 {fr ? `${formatTime(fr.seconds)} (${fr.memberName})` : '—'}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const { pw, ph, tab, boardW, boardH, trayH } = sizeRef.current

  if (solved) {
    const fr = familyRecords[RECORD_KEY]
    const pr = personalRecords[RECORD_KEY]
    return (
      <div className="game-result">
        <div className="game-result-emoji">{isNewRecord ? '🏆' : '🧩🎉'}</div>
        <h3>{isNewRecord ? t('שיא חדש!', 'New Record!') : t('כל הכבוד!', 'Well Done!')}</h3>
        <p>{t(`זמן: ${formatTime(finalTime)}`, `Time: ${formatTime(finalTime)}`)}</p>
        <div className="jigsaw-complete-img"><img src={imgData.src} alt={t(imgData.name, imgData.nameEn)} /><p>{t(imgData.name, imgData.nameEn)}</p></div>
        <div className="memory-record-box">
          <div><span>🏅 {t('שיא אישי', 'Personal best')}</span><span>{pr ? formatTime(pr.seconds) : '—'}</span></div>
          <div><span>👑 {t('שיא משפחתי', 'Family best')}</span><span>{fr ? `${formatTime(fr.seconds)} · ${fr.memberName}` : '—'}</span></div>
        </div>
        <button className="game-btn" onClick={newImage}><RotateCcw size={16} /> {t('תמונה חדשה', 'New Image')}</button>
        <button className="game-btn secondary" style={{ marginTop: 8 }} onClick={() => setSize(null)}>{t('שנה גודל', 'Change Size')}</button>
      </div>
    )
  }

  const elapsedSec = Math.round(currentMs / 1000)
  const canPause = started && dragging === null

  return (
    <div className="jigsaw-game">
      <div className="memory-stats">
        <span>⏱️ {formatTime(elapsedSec)}</span>
        <span>🧩 {placedCount}/{TOTAL}</span>
        <span>👑 {familyRecords[RECORD_KEY] ? formatTime(familyRecords[RECORD_KEY].seconds) : '—'}</span>
      </div>
      <div className="memory-controls">
        {isPaused ? (
          <button className="memory-pause-btn" onClick={resumeTimer}>▶️ {t('המשך', 'Resume')}</button>
        ) : (
          <button className="memory-pause-btn" onClick={pauseTimer} disabled={!canPause}>⏸️ {t('השהה', 'Pause')}</button>
        )}
      </div>
      <div className="jigsaw-board-wrap">
        <div
          ref={boardRef}
          className={`jigsaw-board ${isPaused ? 'paused' : ''}`}
          style={{ width: boardW || '100%', height: (boardH || 400) + (trayH || 160) + 16 }}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          {/* Empty target grid — dashed cells only, no image preview */}
          <div className="jigsaw-target-grid" style={{ width: boardW, height: boardH }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i} className="jigsaw-target-cell" style={{
                width: pw, height: ph,
                left: (i % COLS) * pw, top: Math.floor(i / COLS) * ph,
                opacity: pieces.find(p => p.id === i)?.placed ? 0 : 0.3,
              }} />
            ))}
          </div>
          {/* Pieces */}
          {pieces.map(p => (
            <canvas
              key={p.id}
              ref={el => { canvasRefs.current[p.id] = el }}
              className={`jigsaw-drag-piece ${p.placed ? 'placed' : ''} ${dragging === p.id ? 'dragging' : ''}`}
              style={{
                left: p.x - tab,
                top: p.y - tab,
                width: pw + tab * 2,
                height: ph + tab * 2,
                zIndex: p.placed ? 1 : dragging === p.id ? 100 : 10,
                pointerEvents: (p.placed || isPaused) ? 'none' : 'auto',
              }}
              onMouseDown={e => onPointerDown(e, p.id)}
              onTouchStart={e => onPointerDown(e, p.id)}
            />
          ))}
        </div>
        {isPaused && (
          <div className="jigsaw-pause-banner" onClick={resumeTimer}>
            <span>⏸️</span> {t('מושהה — הקש להמשך', 'Paused — tap to resume')}
          </div>
        )}
      </div>
      <div className="jigsaw-btn-row">
        <button className="game-btn secondary" onClick={newImage}>
          <RotateCcw size={16} /> {t('תמונה אחרת', 'Different Image')}
        </button>
        <button className="game-btn secondary" onClick={() => setSize(null)}>
          {t('שנה גודל', 'Change Size')}
        </button>
      </div>
    </div>
  )
}

// ─── CROSSWORD GAME ───
const CW_LEVELS: { id: CrosswordLevel; he: string; en: string; emoji: string }[] = [
  { id: 'easy', he: 'קל', en: 'Easy', emoji: '🟢' },
  { id: 'medium', he: 'בינוני', en: 'Medium', emoji: '🟡' },
  { id: 'hard', he: 'קשה', en: 'Hard', emoji: '🔴' },
]

function CrosswordGame({ t }: { t: (he: string, en: string) => string }) {
  const [level, setLevel] = useState<CrosswordLevel | null>(null)
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [userGrid, setUserGrid] = useState<string[][]>([])
  const [activeClue, setActiveClue] = useState<CrosswordClue | null>(null)
  const [checked, setChecked] = useState(false)
  const [solved, setSolved] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const levelPuzzles = level ? crosswordPuzzles.filter(p => p.level === level) : []
  const puzzle = levelPuzzles[puzzleIdx] || null
  const size = puzzle?.size ?? 0
  const clues: CrosswordClue[] = puzzle?.clues ?? []

  const startLevel = (lvl: CrosswordLevel) => {
    const count = crosswordPuzzles.filter(p => p.level === lvl).length
    const idx = Math.floor(Math.random() * count)
    setLevel(lvl)
    setPuzzleIdx(idx)
    setUserGrid(Array.from({ length: crosswordPuzzles.filter(p => p.level === lvl)[idx].size }, () => Array(crosswordPuzzles.filter(p => p.level === lvl)[idx].size).fill('')))
    setActiveClue(null); setChecked(false); setSolved(false)
  }

  const nextPuzzle = () => {
    if (!level) return
    const count = levelPuzzles.length
    const idx = count > 1 ? (puzzleIdx + 1 + Math.floor(Math.random() * (count - 1))) % count : 0
    setPuzzleIdx(idx)
    setUserGrid(Array.from({ length: levelPuzzles[idx].size }, () => Array(levelPuzzles[idx].size).fill('')))
    setActiveClue(null); setChecked(false); setSolved(false)
  }

  // Level selection screen
  if (!level || !puzzle) {
    return (
      <div className="crossword-game">
        <p className="coloring-subtitle">{t('בחרו רמת קושי', 'Choose difficulty')}</p>
        <div className="memory-size-grid">
          {CW_LEVELS.map(l => {
            const n = crosswordPuzzles.filter(p => p.level === l.id).length
            return (
              <button key={l.id} className="memory-size-card" onClick={() => startLevel(l.id)}>
                <span className="memory-size-label">{l.emoji} {t(l.he, l.en)}</span>
                <span className="memory-size-count">{n} {t('תשבצים', 'puzzles')}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const { grid, numberGrid } = buildCrosswordGrid(clues, size)

  const clueAt = (r: number, c: number, prefer?: 'across' | 'down') => {
    const matches = clues.filter(cl => {
      for (let i = 0; i < cl.answer.length; i++) {
        const cr = cl.direction === 'across' ? cl.row : cl.row + i
        const cc = cl.direction === 'across' ? cl.col + i : cl.col
        if (cr === r && cc === c) return true
      }
      return false
    })
    if (prefer) return matches.find(m => m.direction === prefer) || matches[0]
    return matches[0]
  }

  const isActiveCell = (r: number, c: number) => {
    if (!activeClue) return false
    for (let i = 0; i < activeClue.answer.length; i++) {
      const cr = activeClue.direction === 'across' ? activeClue.row : activeClue.row + i
      const cc = activeClue.direction === 'across' ? activeClue.col + i : activeClue.col
      if (cr === r && cc === c) return true
    }
    return false
  }

  const handleCellChange = (r: number, c: number, val: string) => {
    const ch = normHeb(val).replace(/[^א-ת]/g, '').slice(-1)
    setUserGrid(prev => { const next = prev.map(row => [...row]); next[r][c] = ch; return next })
    setChecked(false)
    if (ch && activeClue) {
      const cells: [number, number][] = []
      for (let i = 0; i < activeClue.answer.length; i++) {
        const cr = activeClue.direction === 'across' ? activeClue.row : activeClue.row + i
        const cc = activeClue.direction === 'across' ? activeClue.col + i : activeClue.col
        cells.push([cr, cc])
      }
      const idx = cells.findIndex(([cr, cc]) => cr === r && cc === c)
      if (idx >= 0 && idx < cells.length - 1) inputRefs.current[`${cells[idx + 1][0]}-${cells[idx + 1][1]}`]?.focus()
    }
  }

  const handleCheck = () => {
    setChecked(true)
    if (grid.every((row, r) => row.every((cell, c) => cell === null || userGrid[r][c] === cell))) setSolved(true)
  }

  const getCellStatus = (r: number, c: number) => { if (!checked || grid[r][c] === null) return ''; return userGrid[r][c] === grid[r][c] ? 'correct' : userGrid[r][c] ? 'wrong' : '' }

  const acrossClues = clues.filter(c => c.direction === 'across').sort((a, b) => a.number - b.number)
  const downClues = clues.filter(c => c.direction === 'down').sort((a, b) => a.number - b.number)

  // Cell size: fill the screen for small grids, shrink (and scroll) for big ones
  const cwViewport = typeof window !== 'undefined' ? Math.min(window.innerWidth, 460) : 380
  const cwCell = Math.max(22, Math.min(38, Math.floor((cwViewport - 36) / size)))

  return (
    <div className="crossword-game">
      <div className="crossword-topbar">
        <button className="game-btn secondary crossword-level-btn" onClick={() => setLevel(null)}>{t('רמה', 'Level')}</button>
        <span className="crossword-level-tag">{t(CW_LEVELS.find(l => l.id === level)!.he, CW_LEVELS.find(l => l.id === level)!.en)} · {puzzleIdx + 1}/{levelPuzzles.length}</span>
      </div>
      {solved && <div className="crossword-solved"><span>🎉</span> {t('פתרתם את התשבץ!', 'You solved the crossword!')}</div>}
      <div className="crossword-grid-wrap">
        <div className="crossword-grid" style={{ gridTemplateColumns: `repeat(${size}, ${cwCell}px)`, direction: 'rtl' }}>
          {grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`crossword-cell ${cell === null ? 'blocked' : ''} ${isActiveCell(r, c) ? 'active-clue' : ''} ${getCellStatus(r, c)}`}
              onClick={() => { if (cell !== null) { const clue = clueAt(r, c); if (clue) setActiveClue(clue) } }}>
              {numberGrid[r][c] && <span className="crossword-number">{numberGrid[r][c]}</span>}
              {cell !== null && <input ref={el => { inputRefs.current[`${r}-${c}`] = el }} className="crossword-input" value={userGrid[r]?.[c] || ''} onChange={e => handleCellChange(r, c, e.target.value)}
                onFocus={() => { const clue = clueAt(r, c); if (clue) setActiveClue(clue) }}
                maxLength={1} disabled={solved} autoComplete="off" autoCapitalize="characters" />}
            </div>
          )))}
        </div>
      </div>
      <div className="crossword-clues">
        <div className="crossword-clue-section">
          <h4>{t('מאוזן', 'Across')}</h4>
          {acrossClues.map(c => (
            <button key={`a${c.number}-${c.row}-${c.col}`} className={`crossword-clue-btn ${activeClue === c ? 'active' : ''}`} onClick={() => { setActiveClue(c); inputRefs.current[`${c.row}-${c.col}`]?.focus() }}>
              <span className="crossword-clue-num">{c.number}</span>{t(c.clue, c.clueEn)}
            </button>
          ))}
        </div>
        <div className="crossword-clue-section">
          <h4>{t('מאונך', 'Down')}</h4>
          {downClues.map(c => (
            <button key={`d${c.number}-${c.row}-${c.col}`} className={`crossword-clue-btn ${activeClue === c ? 'active' : ''}`} onClick={() => { setActiveClue(c); inputRefs.current[`${c.row}-${c.col}`]?.focus() }}>
              <span className="crossword-clue-num">{c.number}</span>{t(c.clue, c.clueEn)}
            </button>
          ))}
        </div>
      </div>
      <div className="crossword-actions">
        <button className="game-btn" onClick={handleCheck} disabled={solved}><Check size={16} /> {t('בדוק', 'Check')}</button>
        <button className="game-btn secondary" onClick={() => { setUserGrid(grid.map(row => row.map(cell => cell || ''))); setChecked(true); setSolved(true) }} disabled={solved}>{t('חשוף', 'Reveal')}</button>
        <button className="game-btn secondary" onClick={() => { setUserGrid(Array.from({ length: size }, () => Array(size).fill(''))); setChecked(false); setSolved(false); setActiveClue(null) }}><RotateCcw size={16} /> {t('אפס', 'Reset')}</button>
        <button className="game-btn secondary" onClick={nextPuzzle}>{t('תשבץ חדש', 'New Puzzle')} →</button>
      </div>
    </div>
  )
}

// ─── SPANISH PHRASEBOOK GAME ───
function SpanishGame({ t }: { t: (he: string, en: string) => string }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizRevealed, setQuizRevealed] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizPhrases, setQuizPhrases] = useState<SpanishPhrase[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)

  const cat = spanishCategories.find(c => c.id === activeCategory)

  const searchResults = searchQuery.length >= 2
    ? allPhrases.filter(p =>
        p.spanish.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hebrew.includes(searchQuery)
      ).slice(0, 50)
    : []

  const startQuiz = (catId: string) => {
    const c = spanishCategories.find(x => x.id === catId)!
    const shuffled = [...c.phrases].sort(() => Math.random() - 0.5).slice(0, 20)
    setQuizPhrases(shuffled)
    setQuizMode(true)
    setQuizIdx(0)
    setQuizRevealed(false)
    setQuizScore(0)
    setActiveCategory(catId)
  }

  if (quizMode && quizPhrases.length > 0) {
    if (quizIdx >= quizPhrases.length) {
      return (
        <div className="game-result">
          <div className="game-result-emoji">🇨🇷</div>
          <h3>{t('סיימת!', 'Done!')}</h3>
          <p>{t(`למדת ${quizPhrases.length} ביטויים`, `You learned ${quizPhrases.length} phrases`)}</p>
          <p className="game-result-msg">{t(`זכרת ${quizScore} מתוכם`, `Remembered ${quizScore} of them`)}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="game-btn" onClick={() => startQuiz(activeCategory!)}><RotateCcw size={16} /> {t('שוב', 'Again')}</button>
            <button className="game-btn secondary" onClick={() => { setQuizMode(false); setActiveCategory(null) }}>{t('חזרה', 'Back')}</button>
          </div>
        </div>
      )
    }

    const phrase = quizPhrases[quizIdx]
    return (
      <div className="spanish-quiz">
        <div className="trivia-progress">
          <span>{quizIdx + 1}/{quizPhrases.length}</span>
          <div className="trivia-progress-bar"><div className="trivia-progress-fill" style={{ width: `${((quizIdx + 1) / quizPhrases.length) * 100}%` }} /></div>
        </div>
        <div className="spanish-quiz-card">
          <span className="spanish-quiz-emoji">{cat?.emoji}</span>
          <p className="spanish-quiz-hebrew">{t(phrase.hebrew, phrase.english)}</p>
          {!quizRevealed ? (
            <button className="game-btn" onClick={() => setQuizRevealed(true)}>{t('גלה בספרדית', 'Reveal Spanish')}</button>
          ) : (
            <>
              <p className="spanish-quiz-spanish">{phrase.spanish}</p>
              <p className="spanish-quiz-pron">{phrase.pronunciation}</p>
              <button className="spanish-speak-btn" onClick={() => speak(phrase.spanish)}>
                <Volume2 size={16} /> {t('השמע', 'Listen')}
              </button>
              {phrase.tip && <p className="spanish-quiz-tip">{phrase.tip}</p>}
              <p className="spanish-quiz-q">{t('זכרת?', 'Did you remember?')}</p>
              <div className="spanish-quiz-actions">
                <button className="game-btn secondary" onClick={() => { setQuizIdx(i => i + 1); setQuizRevealed(false) }}>{t('לא 😅', 'No 😅')}</button>
                <button className="game-btn" onClick={() => { setQuizScore(s => s + 1); setQuizIdx(i => i + 1); setQuizRevealed(false) }}>{t('כן! ✅', 'Yes! ✅')}</button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (searchMode) {
    return (
      <div className="spanish-category">
        <div className="spanish-cat-header">
          <button className="games-back" onClick={() => { setSearchMode(false); setSearchQuery('') }}>{t('→', '←')}</button>
          <h3>🔍 {t('חיפוש', 'Search')}</h3>
        </div>
        <div className="spanish-search-bar">
          <Search size={16} />
          <input
            className="spanish-search-input"
            placeholder={t('חפש בספרדית, עברית או אנגלית...', 'Search in Spanish, Hebrew or English...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="spanish-phrases">
          {searchResults.length === 0 && searchQuery.length >= 2 && (
            <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>{t('לא נמצאו תוצאות', 'No results found')}</p>
          )}
          {searchResults.map((p, i) => (
            <div key={i} className="spanish-phrase-card">
              <div className="spanish-phrase-top">
                <button className="spanish-speak-btn-sm" onClick={() => speak(p.spanish)}>
                  <Volume2 size={14} />
                </button>
                <div className="spanish-phrase-text">
                  <span className="spanish-phrase-es">{p.spanish}</span>
                  <span className="spanish-phrase-pron">{p.pronunciation}</span>
                  <span className="spanish-phrase-he">{t(p.hebrew, p.english)}</span>
                </div>
              </div>
              {p.tip && <p className="spanish-phrase-tip">{p.tip}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (cat) {
    return (
      <div className="spanish-category">
        <div className="spanish-cat-header">
          <button className="games-back" onClick={() => setActiveCategory(null)}>{t('→', '←')}</button>
          <h3>{cat.emoji} {t(cat.name, cat.nameEn)}</h3>
          <button className="game-btn" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => startQuiz(cat.id)}>
            {t('תרגול', 'Quiz')}
          </button>
        </div>
        <div className="spanish-phrases">
          {cat.phrases.map((p, i) => (
            <div key={i} className="spanish-phrase-card">
              <div className="spanish-phrase-top">
                <button className="spanish-speak-btn-sm" onClick={() => speak(p.spanish)}>
                  <Volume2 size={14} />
                </button>
                <div className="spanish-phrase-text">
                  <span className="spanish-phrase-es">{p.spanish}</span>
                  <span className="spanish-phrase-pron">{p.pronunciation}</span>
                  <span className="spanish-phrase-he">{t(p.hebrew, p.english)}</span>
                </div>
              </div>
              {p.tip && <p className="spanish-phrase-tip">{p.tip}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="spanish-game">
      <p className="spanish-subtitle">
        {t(`${totalPhraseCount} מילים וביטויים — בחרו קטגוריה`, `${totalPhraseCount} words & phrases — choose a category`)}
      </p>
      <button className="spanish-search-btn" onClick={() => setSearchMode(true)}>
        <Search size={16} /> {t('חיפוש מילה', 'Search words')}
      </button>
      <div className="spanish-categories">
        {spanishCategories.map(cat => (
          <button key={cat.id} className="spanish-cat-card" onClick={() => setActiveCategory(cat.id)}>
            <span className="spanish-cat-card-emoji">{cat.emoji}</span>
            <span className="spanish-cat-name">{t(cat.name, cat.nameEn)}</span>
            <span className="spanish-cat-count">{cat.phrases.length}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── COLORING GAME ───
function buildBoundaryMap(imageData: ImageData, dilateRadius: number): Uint8Array {
  const { width: w, height: h, data } = imageData
  const threshold = 160
  const binary = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const gray = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    binary[i] = gray < threshold ? 1 : 0
  }
  // Separable dilation: horizontal pass then vertical pass (box structuring element)
  const hPass = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const rowStart = y * w
    for (let x = 0; x < w; x++) {
      const lo = Math.max(0, x - dilateRadius), hi = Math.min(w - 1, x + dilateRadius)
      let found = 0
      for (let nx = lo; nx <= hi; nx++) { if (binary[rowStart + nx]) { found = 1; break } }
      hPass[rowStart + x] = found
    }
  }
  const dilated = new Uint8Array(w * h)
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const lo = Math.max(0, y - dilateRadius), hi = Math.min(h - 1, y + dilateRadius)
      let found = 0
      for (let ny = lo; ny <= hi; ny++) { if (hPass[ny * w + x]) { found = 1; break } }
      dilated[y * w + x] = found
    }
  }
  return dilated
}

function floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: [number, number, number], boundaryMap: Uint8Array) {
  const w = ctx.canvas.width, h = ctx.canvas.height
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const idx = (y * w + x) * 4
  if (boundaryMap[y * w + x]) return
  const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2]
  if (targetR === fillColor[0] && targetG === fillColor[1] && targetB === fillColor[2]) return
  const tolerance = 30
  const match = (i: number) => {
    const pi = Math.floor(i / 4)
    if (boundaryMap[pi]) return false
    return Math.abs(data[i] - targetR) < tolerance && Math.abs(data[i + 1] - targetG) < tolerance && Math.abs(data[i + 2] - targetB) < tolerance
  }
  const stack = [[x, y]]
  const visited = new Uint8Array(w * h)
  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!
    const ci = (cy * w + cx) * 4
    const vi = cy * w + cx
    if (cx < 0 || cx >= w || cy < 0 || cy >= h || visited[vi] || !match(ci)) continue
    visited[vi] = 1
    data[ci] = fillColor[0]; data[ci + 1] = fillColor[1]; data[ci + 2] = fillColor[2]; data[ci + 3] = 255
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }
  ctx.putImageData(imageData, 0, 0)
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function ColoringGame({ t }: { t: (he: string, en: string) => string }) {
  const { member } = useAuth()
  const [, setAlbumPhotos] = useSharedState<AlbumPhoto[]>('album', [])
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState('#22c55e')
  const [mode, setMode] = useState<'paint' | 'pan'>('paint')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  const boundaryMapRef = useRef<Uint8Array>(new Uint8Array(0))
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null)

  const colors = ['#22c55e', '#16a34a', '#064e3b', '#2563eb', '#06b6d4', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#8b5cf6', '#000000', '#ffffff', '#d4a574']
  const image = coloringImages.find(i => i.id === activeImage)

  const postToGallery = async () => {
    const canvas = canvasRef.current
    if (!canvas || posting) return
    setPosting(true)
    try {
      const blob: Blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('no blob')), 'image/jpeg', 0.9))
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const sRef = storageRef(storage, `album/${id}.jpg`)
      await uploadBytes(sRef, blob)
      const url = await getDownloadURL(sRef)
      const caption = t(`ציור: ${image?.name ?? ''}`, `Coloring: ${image?.nameEn ?? ''}`)
      const photo: AlbumPhoto = { id, url, caption, captionHe: caption, uploadedBy: member?.id || 'unknown', timestamp: Date.now() }
      setAlbumPhotos(prev => [photo, ...prev])
      setPosted(true)
    } catch (err) {
      console.error('Post to gallery failed:', err)
    }
    setPosting(false)
  }

  const loadImage = useCallback((src: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      // High internal resolution (CSS scales it down) → crisp lines and precise fills
      const targetW = Math.min(img.width, 800)
      const scale = targetW / img.width
      canvas.width = targetW
      canvas.height = Math.floor(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      originalDataRef.current = imgData
      boundaryMapRef.current = buildBoundaryMap(imgData, 2)
    }
    img.src = src
  }, [])

  useEffect(() => {
    if (image) { loadImage(image.src); setZoom(1); setPan({ x: 0, y: 0 }); setMode('paint'); setPosted(false) }
  }, [image, loadImage])

  const getTouchDist = (e: React.TouchEvent) => {
    const t0 = e.touches[0], t1 = e.touches[1]
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
  }

  const handleCanvasTap = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'paint') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)
    const ctx = canvas.getContext('2d')!
    floodFill(ctx, x, y, hexToRgb(activeColor), boundaryMapRef.current)
    setPosted(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      pinchStartRef.current = { dist: getTouchDist(e), zoom }
      panStartRef.current = null
      return
    }
    if (mode === 'pan' && e.touches.length === 1) {
      e.preventDefault()
      panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y }
      return
    }
    if (mode === 'paint' && e.touches.length === 1) {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
      const x = Math.floor((e.touches[0].clientX - rect.left) * scaleX)
      const y = Math.floor((e.touches[0].clientY - rect.top) * scaleY)
      const ctx = canvas.getContext('2d')!
      floodFill(ctx, x, y, hexToRgb(activeColor), boundaryMapRef.current)
      setPosted(false)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      e.preventDefault()
      const newDist = getTouchDist(e)
      const scale = newDist / pinchStartRef.current.dist
      setZoom(Math.min(5, Math.max(1, pinchStartRef.current.zoom * scale)))
      return
    }
    if (panStartRef.current && e.touches.length === 1) {
      e.preventDefault()
      const dx = e.touches[0].clientX - panStartRef.current.x
      const dy = e.touches[0].clientY - panStartRef.current.y
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy })
    }
  }

  const handleTouchEnd = () => {
    pinchStartRef.current = null
    panStartRef.current = null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'pan') return
    e.preventDefault()
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panStartRef.current || mode !== 'pan') return
    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy })
  }

  const handleMouseUp = () => { panStartRef.current = null }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.min(5, Math.max(1, z * delta)))
  }

  const handleReset = () => {
    const canvas = canvasRef.current
    if (!canvas || !originalDataRef.current) return
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(originalDataRef.current, 0, 0)
  }

  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  if (image) {
    return (
      <div className="coloring-active">
        <div className="coloring-mode-toggle">
          <button className={`coloring-mode-btn ${mode === 'paint' ? 'active' : ''}`} onClick={() => setMode('paint')}>
            🎨 {t('צביעה', 'Paint')}
          </button>
          <button className={`coloring-mode-btn ${mode === 'pan' ? 'active' : ''}`} onClick={() => setMode('pan')}>
            🔍 {t('זום/הזזה', 'Zoom/Pan')}
          </button>
          {zoom > 1 && (
            <button className="coloring-mode-btn" onClick={resetZoom}>
              ↩ {Math.round(zoom * 100)}%
            </button>
          )}
        </div>
        <div
          ref={viewportRef}
          className="coloring-viewport"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: mode === 'pan' ? (panStartRef.current ? 'grabbing' : 'grab') : 'crosshair' }}
        >
          <div className="coloring-canvas" style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}>
            <canvas
              ref={canvasRef}
              className="coloring-canvas-el"
              onClick={handleCanvasTap}
            />
          </div>
        </div>
        <div className="coloring-palette">
          {colors.map(c => (
            <button
              key={c}
              className={`coloring-color ${activeColor === c ? 'active' : ''}`}
              style={{ background: c, borderColor: c === '#ffffff' ? '#ccc' : c }}
              onClick={() => setActiveColor(c)}
            />
          ))}
        </div>
        <div className="coloring-actions">
          <button className="game-btn secondary" onClick={handleReset}><RotateCcw size={16} /> {t('נקה', 'Clear')}</button>
          <button className="game-btn secondary" onClick={() => { setActiveImage(null); originalDataRef.current = null }}>{t('חזרה', 'Back')}</button>
        </div>
        <button className="game-btn coloring-post-btn" onClick={postToGallery} disabled={posting || posted}>
          {posted ? `✓ ${t('פורסם לאלבום', 'Posted to album')}` : posting ? t('מפרסם...', 'Posting...') : `🖼️ ${t('פרסם לאלבום המשפחה', 'Post to family album')}`}
        </button>
      </div>
    )
  }

  return (
    <div className="coloring-game">
      <p className="coloring-subtitle">{t('בחרו ציור', 'Choose a drawing')}</p>
      <div className="coloring-grid">
        {coloringImages.map(img => (
          <button key={img.id} className="coloring-template-card" onClick={() => setActiveImage(img.id)}>
            <div className="coloring-template-preview">
              <img src={img.src} alt={img.nameEn} loading="lazy" />
            </div>
            <span className="coloring-template-name">{img.emoji} {t(img.name, img.nameEn)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── IMPOSTER GAME ───
interface ImposterWord { word: string; wordHe: string }
interface ImposterCategory { name: string; nameHe: string; emoji: string; words: ImposterWord[] }

const IMPOSTER_CATEGORIES: ImposterCategory[] = [
  { name: 'Animals', nameHe: 'חיות', emoji: '🦥', words: [
    { word: 'Sloth', wordHe: 'עצלן' }, { word: 'Toucan', wordHe: 'טוקן' }, { word: 'Monkey', wordHe: 'קוף' },
    { word: 'Frog', wordHe: 'צפרדע' }, { word: 'Crocodile', wordHe: 'תנין' }, { word: 'Whale', wordHe: 'לוויתן' },
    { word: 'Turtle', wordHe: 'צב' }, { word: 'Butterfly', wordHe: 'פרפר' }, { word: 'Parrot', wordHe: 'תוכי' },
    { word: 'Iguana', wordHe: 'אגואנה' }, { word: 'Jaguar', wordHe: 'יגואר' }, { word: 'Dolphin', wordHe: 'דולפין' },
    { word: 'Hummingbird', wordHe: 'יונק דבש' }, { word: 'Bat', wordHe: 'עטלף' }, { word: 'Snake', wordHe: 'נחש' },
  ]},
  { name: 'Places', nameHe: 'מקומות', emoji: '🌋', words: [
    { word: 'Volcano', wordHe: 'הר געש' }, { word: 'Waterfall', wordHe: 'מפל' }, { word: 'Beach', wordHe: 'חוף' },
    { word: 'Cloud forest', wordHe: 'יער ענן' }, { word: 'Hot springs', wordHe: 'מעיינות חמים' },
    { word: 'National park', wordHe: 'פארק לאומי' }, { word: 'River', wordHe: 'נהר' }, { word: 'Cave', wordHe: 'מערה' },
    { word: 'Island', wordHe: 'אי' }, { word: 'Market', wordHe: 'שוק' }, { word: 'Airport', wordHe: 'שדה תעופה' },
    { word: 'Museum', wordHe: 'מוזיאון' }, { word: 'Swimming pool', wordHe: 'בריכה' }, { word: 'Restaurant', wordHe: 'מסעדה' },
  ]},
  { name: 'Food', nameHe: 'אוכל', emoji: '🍽️', words: [
    { word: 'Gallo Pinto', wordHe: 'גאיו פינטו' }, { word: 'Casado', wordHe: 'קאסאדו' },
    { word: 'Ceviche', wordHe: 'סביצ\'ה' }, { word: 'Empanada', wordHe: 'אמפנדה' },
    { word: 'Coffee', wordHe: 'קפה' }, { word: 'Plantain', wordHe: 'פלנטיין' },
    { word: 'Coconut', wordHe: 'קוקוס' }, { word: 'Mango', wordHe: 'מנגו' },
    { word: 'Chocolate', wordHe: 'שוקולד' }, { word: 'Pineapple', wordHe: 'אננס' },
    { word: 'Rice', wordHe: 'אורז' }, { word: 'Tamale', wordHe: 'טמלה' },
    { word: 'Tortilla', wordHe: 'טורטייה' }, { word: 'Ice cream', wordHe: 'גלידה' },
  ]},
  { name: 'Activities', nameHe: 'פעילויות', emoji: '🧗', words: [
    { word: 'Zip line', wordHe: 'זיפליין' }, { word: 'Rafting', wordHe: 'רפטינג' },
    { word: 'Surfing', wordHe: 'גלישה' }, { word: 'Hiking', wordHe: 'טיול רגלי' },
    { word: 'Snorkeling', wordHe: 'שנירקול' }, { word: 'Horseback riding', wordHe: 'רכיבה על סוסים' },
    { word: 'Kayaking', wordHe: 'קיאקינג' }, { word: 'Bird watching', wordHe: 'צפרות' },
    { word: 'Swimming', wordHe: 'שחייה' }, { word: 'Fishing', wordHe: 'דיג' },
    { word: 'Camping', wordHe: 'קמפינג' }, { word: 'Diving', wordHe: 'צלילה' },
    { word: 'Dancing', wordHe: 'ריקוד' }, { word: 'Photography', wordHe: 'צילום' },
  ]},
  { name: 'Objects', nameHe: 'חפצים', emoji: '🎒', words: [
    { word: 'Sunscreen', wordHe: 'קרם הגנה' }, { word: 'Binoculars', wordHe: 'משקפת' },
    { word: 'Backpack', wordHe: 'תיק גב' }, { word: 'Camera', wordHe: 'מצלמה' },
    { word: 'Umbrella', wordHe: 'מטריה' }, { word: 'Passport', wordHe: 'דרכון' },
    { word: 'Hammock', wordHe: 'ערסל' }, { word: 'Sunglasses', wordHe: 'משקפי שמש' },
    { word: 'Map', wordHe: 'מפה' }, { word: 'Flashlight', wordHe: 'פנס' },
    { word: 'Towel', wordHe: 'מגבת' }, { word: 'Water bottle', wordHe: 'בקבוק מים' },
    { word: 'Hat', wordHe: 'כובע' }, { word: 'Flip flops', wordHe: 'כפכפים' },
  ]},
]

const IMPOSTER_FAMILY = [
  { id: 'ofir', name: 'Ofir', nameHe: 'אופיר', avatar: '/images/avatar-ofir.jpg' },
  { id: 'merav', name: 'Merav', nameHe: 'מירב', avatar: '/images/avatar-merav.jpg' },
  { id: 'maya', name: 'Maya', nameHe: 'מאיה', avatar: '/images/avatar-maya.jpg' },
  { id: 'matan', name: 'Matan', nameHe: 'מתן', avatar: '/images/avatar-matan.jpg' },
  { id: 'yoav', name: 'Yoav', nameHe: 'יואב', avatar: '/images/avatar-yoav.jpg' },
]

interface ImposterState {
  round: number
  categoryIdx: number
  wordIdx: number
  imposterId: string
  hostId: string
  players: string[]
  joinedPlayers: string[]
  firstTurnId: string
  phase: 'setup' | 'waiting' | 'playing' | 'discuss' | 'reveal'
}

function ImposterGame({ t }: { t: (he: string, en: string) => string }) {
  const { member } = useAuth()
  const [game, setGame] = useSharedState<ImposterState | null>('imposter-game', null)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [screen, setScreen] = useState<'home' | 'setup'>('home')
  const [inviteInfo, setInviteInfo] = useState<string | null>(null)
  const [sendingInvites, setSendingInvites] = useState(false)

  const myId = member?.id || 'unknown'

  const sendGameInvites = async (playerIds: string[]) => {
    const targets = playerIds.filter(id => id !== myId)
    if (targets.length === 0) { setInviteInfo(t('אין למי לשלוח הזמנות', 'No one to invite')); return }
    setSendingInvites(true)
    try {
      const { httpsCallable } = await import('firebase/functions')
      const { functions } = await import('../firebase')
      const sendNotification = httpsCallable(functions, 'sendNotification')
      const res = await sendNotification({
        targetMemberIds: targets,
        title: t('🕵️ מי המרגל?', '🕵️ Who\'s the Imposter?'),
        body: t(
          `${member?.name || ''} מזמין אותך למשחק מרגל!`,
          `${member?.nameEn || ''} invited you to play Imposter!`
        ),
        data: { url: '/games' },
      })
      const sent = (res?.data as { sent?: number })?.sent ?? 0
      setInviteInfo(sent > 0
        ? t(`נשלחו התראות ל-${sent} מכשירים 📨`, `Notifications sent to ${sent} device(s) 📨`)
        : t('אף אחד מהמוזמנים לא הפעיל התראות — בקשו מהם לפתוח את האפליקציה 📱', 'None of the invitees have notifications on — ask them to open the app 📱'))
    } catch {
      setInviteInfo(t('לא הצלחנו לשלוח התראות — בקשו מהם לפתוח את האפליקציה 📱', 'Could not send notifications — ask them to open the app 📱'))
    }
    setSendingInvites(false)
  }

  const openSetup = () => {
    setSelectedPlayers([myId])
    setInviteInfo(null)
    setScreen('setup')
  }

  const launchGame = async () => {
    if (selectedPlayers.length < 3) return
    const catIdx = Math.floor(Math.random() * IMPOSTER_CATEGORIES.length)
    const wordIdx = Math.floor(Math.random() * IMPOSTER_CATEGORIES[catIdx].words.length)
    const impIdx = Math.floor(Math.random() * selectedPlayers.length)
    const imposterId = selectedPlayers[impIdx]
    const nonImposters = selectedPlayers.filter(id => id !== imposterId)
    const firstTurnId = nonImposters[Math.floor(Math.random() * nonImposters.length)]

    const newGame: ImposterState = {
      round: (game?.round || 0) + 1,
      categoryIdx: catIdx,
      wordIdx: wordIdx,
      imposterId,
      hostId: myId,
      players: selectedPlayers,
      joinedPlayers: [myId],
      firstTurnId,
      phase: 'waiting',
    }
    setGame(newGame)
    setScreen('home')
    await sendGameInvites(selectedPlayers)
  }

  const joinGame = () => {
    if (!game || game.joinedPlayers.includes(myId)) return
    setGame({ ...game, joinedPlayers: [...game.joinedPlayers, myId] })
  }

  const startPlaying = () => {
    if (!game) return
    // Re-pick imposter + first turn from players who ACTUALLY joined
    const active = game.joinedPlayers
    if (active.length < 3) return
    const imposterId = active[Math.floor(Math.random() * active.length)]
    const nonImposters = active.filter(id => id !== imposterId)
    const firstTurnId = nonImposters[Math.floor(Math.random() * nonImposters.length)]
    setGame({ ...game, players: active, imposterId, firstTurnId, phase: 'playing' })
  }

  const goToDiscuss = () => {
    if (!game) return
    setGame({ ...game, phase: 'discuss' })
  }

  const reveal = () => {
    if (!game) return
    setGame({ ...game, phase: 'reveal' })
  }

  // ── Player-selection screen (initiator chooses who to invite) ──
  if (screen === 'setup') {
    return (
      <div className="imposter-setup">
        <div className="imposter-icon">🕵️</div>
        <h3>{t('מי המרגל?', 'Who\'s the Imposter?')}</h3>
        <p className="imposter-rules">
          {t(
            'בחרו את מי להזמין — כל אחד ישחק מהמכשיר שלו וישלחו לו התראה!',
            'Choose who to invite — everyone plays on their own device and gets a notification!'
          )}
        </p>
        <p style={{ fontWeight: 600, marginTop: 12 }}>{t('בחרו מוזמנים (מינימום 3):', 'Choose invitees (minimum 3):')}</p>
        <div className="imposter-player-select">
          {IMPOSTER_FAMILY.map(p => (
            <button
              key={p.id}
              className={`imposter-player-chip ${selectedPlayers.includes(p.id) ? 'selected' : ''}`}
              onClick={() => {
                if (selectedPlayers.includes(p.id)) {
                  if (p.id === myId) return
                  setSelectedPlayers(s => s.filter(x => x !== p.id))
                } else {
                  setSelectedPlayers(s => [...s, p.id])
                }
              }}
            >
              <img src={p.avatar} alt={p.name} />
              <span>{t(p.nameHe, p.name)}</span>
              {selectedPlayers.includes(p.id) && <span className="imposter-chip-check">✓</span>}
            </button>
          ))}
        </div>
        <p className="imposter-selected-count">{t(`${selectedPlayers.length} נבחרו`, `${selectedPlayers.length} selected`)}</p>
        <button
          className="game-btn imposter-start-btn"
          onClick={launchGame}
          disabled={selectedPlayers.length < 3}
          style={{ opacity: selectedPlayers.length < 3 ? 0.5 : 1 }}
        >
          {t('📨 שלח הזמנות ופתח משחק', '📨 Send Invites & Open Game')}
        </button>
        <button className="game-btn secondary" style={{ marginTop: 8 }} onClick={() => setScreen('home')}>
          {t('ביטול', 'Cancel')}
        </button>
      </div>
    )
  }

  // ── Landing screen: not a player in the current game → let anyone start a new one ──
  const iAmPlayer = !!game && game.players.includes(myId)
  if (!iAmPlayer) {
    return (
      <div className="imposter-setup">
        <div className="imposter-icon">🕵️</div>
        <h3>{t('מי המרגל?', 'Who\'s the Imposter?')}</h3>
        <p className="imposter-rules">
          {t(
            'משחק מסיבה רב-מכשירי: המארגן בוחר מי משתתף, כולם מקבלים התראה ומצטרפים מהטלפון שלהם. אחד מכם הוא מרגל שלא יודע את המילה!',
            'A multi-device party game: the host picks who plays, everyone gets a notification and joins from their own phone. One of you is an imposter who doesn\'t know the word!'
          )}
        </p>
        <button className="game-btn imposter-start-btn" onClick={openSetup}>
          {t('🎮 משחק חדש — בחרו את מי להזמין', '🎮 New Game — Choose Who to Invite')}
        </button>
        {game && game.phase !== 'reveal' && (
          <p className="imposter-active-note">
            {t('יש משחק פעיל שאינך משתתף בו', 'There is an active game you are not part of')}
          </p>
        )}
      </div>
    )
  }

  // Waiting for players to join
  if (game.phase === 'waiting') {
    const allJoined = game.players.every(id => game.joinedPlayers.includes(id))
    const iAmInGame = game.players.includes(myId)
    const iJoined = game.joinedPlayers.includes(myId)

    if (!iAmInGame) {
      return (
        <div className="imposter-waiting">
          <div className="imposter-icon">🕵️</div>
          <p>{t('יש משחק פעיל — אתה לא משתתף בסיבוב הזה', 'There\'s an active game — you\'re not in this round')}</p>
        </div>
      )
    }

    const isHost = game.hostId === myId
    return (
      <div className="imposter-waiting">
        <div className="imposter-icon">🕵️</div>
        <h3>{t('ממתינים שהשחקנים יצטרפו...', 'Waiting for players to join...')}</h3>
        <div className="imposter-players-joined">
          {game.players.map(id => {
            const p = IMPOSTER_FAMILY.find(f => f.id === id)!
            const joined = game.joinedPlayers.includes(id)
            return (
              <div key={id} className="imposter-join-status">
                <img src={p.avatar} alt={p.name} className={`imposter-joined-avatar ${joined ? 'joined' : ''}`} title={t(p.nameHe, p.name)} />
                <span className={`imposter-join-badge ${joined ? 'in' : 'pending'}`}>{joined ? '✓' : '…'}</span>
              </div>
            )
          })}
        </div>
        <p>{t(`${game.joinedPlayers.length}/${game.players.length} הצטרפו`, `${game.joinedPlayers.length}/${game.players.length} joined`)}</p>

        {/* Notification status + resend, host only */}
        {isHost && inviteInfo && <p className="imposter-invite-info">{inviteInfo}</p>}
        {isHost && (
          <button className="game-btn secondary" style={{ marginTop: 4 }} onClick={() => sendGameInvites(game.players)} disabled={sendingInvites}>
            {sendingInvites ? t('שולח...', 'Sending...') : t('🔔 שלח התראה שוב', '🔔 Resend Notification')}
          </button>
        )}

        {!iJoined && (
          <button className="game-btn imposter-start-btn" onClick={joinGame}>
            {t('🙋 הצטרף למשחק', '🙋 Join Game')}
          </button>
        )}
        {iJoined && !allJoined && <div className="imposter-waiting-spinner" />}
        {game.joinedPlayers.length >= 3 && isHost && (
          <button className="game-btn imposter-start-btn" onClick={startPlaying}>
            {allJoined
              ? t('🚀 כולם כאן — התחילו!', '🚀 Everyone\'s here — Start!')
              : t(`🚀 התחילו עם ${game.joinedPlayers.length} שחקנים`, `🚀 Start with ${game.joinedPlayers.length} players`)}
          </button>
        )}
        {allJoined && !isHost && (
          <p>{t('ממתינים למארגן להתחיל...', 'Waiting for host to start...')}</p>
        )}
        {isHost && (
          <button className="game-btn secondary" style={{ marginTop: 8 }} onClick={openSetup}>
            {t('↩ התחל מחדש', '↩ Start Over')}
          </button>
        )}
      </div>
    )
  }

  const cat = IMPOSTER_CATEGORIES[game.categoryIdx]
  const secretWord = cat.words[game.wordIdx]
  const isImposter = myId === game.imposterId
  const imposterMember = IMPOSTER_FAMILY.find(m => m.id === game.imposterId)
  const isFirstTurn = myId === game.firstTurnId
  const firstTurnMember = IMPOSTER_FAMILY.find(m => m.id === game.firstTurnId)

  // Playing: each player sees their role on their own device
  if (game.phase === 'playing') {
    return (
      <div className="imposter-role-reveal">
        <p className="imposter-round">{t(`סיבוב ${game.round}`, `Round ${game.round}`)}</p>
        <p className="imposter-cat-hint">{t(`קטגוריה: ${cat.emoji} ${cat.nameHe}`, `Category: ${cat.emoji} ${cat.name}`)}</p>
        <div className={`imposter-role-card ${isImposter ? 'spy' : 'normal'}`}>
          {isImposter ? (
            <>
              <span className="role-icon">🕵️</span>
              <p className="role-text">{t('אתה המרגל!', 'You\'re the Imposter!')}</p>
              <p className="role-word">{t('???', '???')}</p>
              <p style={{ marginTop: 8, opacity: 0.8, fontSize: '0.9rem' }}>{t('נסה להשתלב בלי להיתפס!', 'Try to blend in without getting caught!')}</p>
            </>
          ) : (
            <>
              <span className="role-icon">{cat.emoji}</span>
              <p className="role-text">{t('המילה הסודית:', 'The secret word:')}</p>
              <p className="role-word">{t(secretWord.wordHe, secretWord.word)}</p>
              <p style={{ marginTop: 8, opacity: 0.8, fontSize: '0.9rem' }}>{t('אל תגלה את המילה!', 'Don\'t reveal the word!')}</p>
            </>
          )}
        </div>
        {isFirstTurn && (
          <div className="imposter-turn-badge">
            ⭐ {t('אתה מתחיל!', 'You go first!')}
          </div>
        )}
        {!isFirstTurn && firstTurnMember && (
          <p style={{ opacity: 0.7 }}>
            {t(`${firstTurnMember.nameHe} מתחיל/ה`, `${firstTurnMember.name} goes first`)}
          </p>
        )}
        {game.hostId === myId && (
          <button className="game-btn" onClick={goToDiscuss} style={{ marginTop: 16 }}>
            🗣️ {t('עבור לדיון', 'Start Discussion')}
          </button>
        )}
      </div>
    )
  }

  // Discuss phase
  if (game.phase === 'discuss') {
    return (
      <div className="imposter-lobby">
        <div className="imposter-icon">🗣️</div>
        <h3>{t('דיון והצבעה!', 'Discuss & Vote!')}</h3>
        <p className="imposter-rules">
          {t(
            'כל אחד מתאר את המילה בלי לומר אותה. הצביעו מי לדעתכם המרגל!',
            'Each person describes the word without saying it. Vote on who you think is the imposter!'
          )}
        </p>
        <p className="imposter-discuss-hint">
          {t(`קטגוריה: ${cat.emoji} ${cat.nameHe}`, `Category: ${cat.emoji} ${cat.name}`)}
        </p>
        <div className="imposter-discuss-players">
          {game.players.map(id => {
            const p = IMPOSTER_FAMILY.find(f => f.id === id)!
            return (
              <div key={id} className={`imposter-discuss-player ${id === game.firstTurnId ? 'first-turn' : ''}`}>
                <img src={p.avatar} alt={p.name} />
                <span>{t(p.nameHe, p.name)}</span>
                {id === game.firstTurnId && <span style={{ fontSize: '0.7rem' }}>⭐</span>}
              </div>
            )
          })}
        </div>
        {game.hostId === myId && (
          <button className="game-btn imposter-reveal-btn" onClick={reveal}>
            🎭 {t('חשוף את המרגל!', 'Reveal the Imposter!')}
          </button>
        )}
      </div>
    )
  }

  // Reveal phase
  return (
    <div className="imposter-lobby">
      <div className="imposter-icon">🎭</div>
      <h3>{t('החשיפה!', 'The Reveal!')}</h3>
      <div className="imposter-reveal-card">
        <p className="imposter-reveal-label">{t('המרגל היה:', 'The imposter was:')}</p>
        <p className="imposter-reveal-name">{t(imposterMember?.nameHe || '', imposterMember?.name || '')}</p>
      </div>
      <div className="imposter-reveal-card">
        <p className="imposter-reveal-label">{t('המילה הסודית:', 'The secret word:')}</p>
        <p className="imposter-reveal-word">{t(secretWord.wordHe, secretWord.word)}</p>
        <p className="imposter-reveal-cat">{cat.emoji} {t(cat.nameHe, cat.name)}</p>
      </div>
      <button className="game-btn imposter-start-btn" onClick={openSetup}>
        {t('🎮 סיבוב חדש', '🎮 New Round')}
      </button>
    </div>
  )
}

// ─── MILLIONAIRE GAME ───
import { millionaireEasy, millionaireMedium, millionaireHard } from '../data/millionaire'
import type { MillionaireQ } from '../data/millionaire'

const PRIZE_LADDER = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000,
]
const SAFE_LEVELS = [4, 9]

function MillionaireGame({ t }: { t: (he: string, en: string) => string }) {
  const [level, setLevel] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'correct' | 'wrong' | 'won'>('playing')
  const [selected, setSelected] = useState<number | null>(null)
  const [fiftyFifty, setFiftyFifty] = useState(true)
  const [phoneFriend, setPhoneFriend] = useState(true)
  const [audience, setAudience] = useState(true)
  const [eliminated, setEliminated] = useState<number[]>([])
  const [friendHint, setFriendHint] = useState<string | null>(null)
  const [audienceData, setAudienceData] = useState<number[] | null>(null)
  const [showLadder, setShowLadder] = useState(false)
  const pickQuestions = () => {
    const shuffle = <T,>(arr: T[]): T[] => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }
    const pickFromPool = (pool: MillionaireQ[], n: number, storageKey: string) => {
      const recentRaw = localStorage.getItem(storageKey)
      const recent: number[] = recentRaw ? JSON.parse(recentRaw) : []
      const available = pool.map((q, i) => ({ q, i })).filter(x => !recent.includes(x.i))
      const source = available.length >= n ? available : pool.map((q, i) => ({ q, i }))
      const picked = shuffle(source).slice(0, n)
      const usedIndices = [...recent, ...picked.map(x => x.i)].slice(-Math.floor(pool.length * 0.7))
      localStorage.setItem(storageKey, JSON.stringify(usedIndices))
      return picked.map(x => x.q)
    }
    const raw = [
      ...pickFromPool(millionaireEasy, 5, 'mill-used-easy'),
      ...pickFromPool(millionaireMedium, 5, 'mill-used-medium'),
      ...pickFromPool(millionaireHard, 5, 'mill-used-hard'),
    ]
    return raw.map(q => {
      const indices = shuffle([0, 1, 2, 3])
      return {
        ...q,
        options: indices.map(i => q.options[i]) as [string, string, string, string],
        optionsEn: indices.map(i => q.optionsEn[i]) as [string, string, string, string],
        correct: indices.indexOf(q.correct),
      }
    })
  }
  const [questions, setQuestions] = useState(pickQuestions)

  const q = questions[level]
  const prizeFormatted = (n: number) => n >= 1000000 ? `$${n / 1000000}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`
  const safeNet = () => {
    for (let i = SAFE_LEVELS.length - 1; i >= 0; i--) {
      if (level > SAFE_LEVELS[i]) return PRIZE_LADDER[SAFE_LEVELS[i]]
    }
    return 0
  }

  const handleAnswer = (idx: number) => {
    if (phase !== 'playing' || eliminated.includes(idx)) return
    setSelected(idx)
    setTimeout(() => {
      if (idx === q.correct) {
        if (level === 14) {
          setPhase('won')
        } else {
          setPhase('correct')
        }
      } else {
        setPhase('wrong')
      }
    }, 1500)
  }

  const nextQuestion = () => {
    setLevel(l => l + 1)
    setPhase('playing')
    setSelected(null)
    setEliminated([])
    setFriendHint(null)
    setAudienceData(null)
  }

  const restart = () => {
    setQuestions(pickQuestions())
    setLevel(0)
    setPhase('playing')
    setSelected(null)
    setFiftyFifty(true)
    setPhoneFriend(true)
    setAudience(true)
    setEliminated([])
    setFriendHint(null)
    setAudienceData(null)
    setShowLadder(false)
  }

  const useFiftyFifty = () => {
    if (!fiftyFifty || phase !== 'playing') return
    setFiftyFifty(false)
    const wrong = [0, 1, 2, 3].filter(i => i !== q.correct)
    const toRemove = wrong.sort(() => Math.random() - 0.5).slice(0, 2)
    setEliminated(toRemove)
  }

  const usePhoneFriend = () => {
    if (!phoneFriend || phase !== 'playing') return
    setPhoneFriend(false)
    const isRight = Math.random() > 0.25
    const answer = isRight ? q.correct : [0, 1, 2, 3].filter(i => i !== q.correct)[Math.floor(Math.random() * 3)]
    const letters = ['A', 'B', 'C', 'D']
    const confidence = isRight ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 30) + 40
    setFriendHint(t(
      `"אני חושב שהתשובה היא ${letters[answer]}, אני ${confidence}% בטוח"`,
      `"I think the answer is ${letters[answer]}, I'm ${confidence}% sure"`
    ))
  }

  const useAudience = () => {
    if (!audience || phase !== 'playing') return
    setAudience(false)
    const data = [0, 0, 0, 0]
    const correctPct = Math.floor(Math.random() * 30) + 45
    data[q.correct] = correctPct
    let remaining = 100 - correctPct
    for (let i = 0; i < 4; i++) {
      if (i === q.correct) continue
      const pct = i === 3 || (i === 2 && data[3] === 0) ? remaining : Math.floor(Math.random() * remaining)
      data[i] = pct
      remaining -= pct
    }
    setAudienceData(data)
  }

  const letters = ['A', 'B', 'C', 'D']

  if (phase === 'won') {
    return (
      <div className="mill-end mill-won">
        <div className="mill-end-emoji">🎉🏆🎉</div>
        <h3>{t('מיליונר!', 'Millionaire!')}</h3>
        <p className="mill-end-prize">{prizeFormatted(1000000)}</p>
        <p>{t('ענית נכון על כל 15 השאלות!', 'You answered all 15 questions correctly!')}</p>
        <button className="game-btn" onClick={restart}>
          <RotateCcw size={16} /> {t('שחק שוב', 'Play Again')}
        </button>
      </div>
    )
  }

  if (phase === 'wrong') {
    const winnings = safeNet()
    return (
      <div className="mill-end mill-lost">
        <div className="mill-end-emoji">😔</div>
        <h3>{t('טעות!', 'Wrong Answer!')}</h3>
        <p>{t('התשובה הנכונה:', 'The correct answer was:')} <strong>{t(q.options[q.correct], q.optionsEn[q.correct])}</strong></p>
        <p className="mill-end-prize">{t('זכית ב: ', 'You won: ')}{prizeFormatted(winnings)}</p>
        <button className="game-btn" onClick={restart}>
          <RotateCcw size={16} /> {t('שחק שוב', 'Play Again')}
        </button>
      </div>
    )
  }

  return (
    <div className="mill-game">
      <div className="mill-top-bar">
        <button className={`mill-ladder-toggle ${showLadder ? 'active' : ''}`} onClick={() => setShowLadder(!showLadder)}>
          💰 {prizeFormatted(PRIZE_LADDER[level])}
        </button>
        <div className="mill-level-dots">
          {PRIZE_LADDER.map((_, i) => (
            <span key={i} className={`mill-dot ${i === level ? 'current' : i < level ? 'done' : ''} ${SAFE_LEVELS.includes(i) ? 'safe' : ''}`} />
          ))}
        </div>
      </div>

      {showLadder && (
        <div className="mill-ladder">
          {[...PRIZE_LADDER].reverse().map((p, ri) => {
            const i = 14 - ri
            return (
              <div key={i} className={`mill-ladder-row ${i === level ? 'current' : i < level ? 'done' : ''} ${SAFE_LEVELS.includes(i) ? 'safe' : ''}`}>
                <span className="mill-ladder-num">{i + 1}</span>
                <span className="mill-ladder-prize">{prizeFormatted(p)}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="mill-question-num">
        {t(`שאלה ${level + 1} מתוך 15`, `Question ${level + 1} of 15`)}
      </div>
      <div className="mill-question">
        {t(q.question, q.questionEn)}
      </div>

      <div className="mill-options">
        {q.options.map((_, idx) => {
          const isEliminated = eliminated.includes(idx)
          const isSelected = selected === idx
          const isCorrect = idx === q.correct
          let cls = 'mill-option'
          if (isEliminated) cls += ' eliminated'
          else if (phase === 'correct' && isCorrect) cls += ' correct'
          else if (phase === 'correct' && isSelected && !isCorrect) cls += ' wrong'
          else if (selected !== null && isSelected) cls += ' selected'
          return (
            <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={phase !== 'playing' || isEliminated}>
              <span className="mill-option-letter">{letters[idx]}</span>
              <span className="mill-option-text">{t(q.options[idx], q.optionsEn[idx])}</span>
            </button>
          )
        })}
      </div>

      {friendHint && <div className="mill-hint">📞 {friendHint}</div>}
      {audienceData && (
        <div className="mill-audience">
          <div className="mill-audience-title">👥 {t('קהל:', 'Audience:')}</div>
          <div className="mill-audience-bars">
            {audienceData.map((pct, i) => (
              <div key={i} className="mill-audience-bar-wrap">
                <div className="mill-audience-bar" style={{ height: `${pct}%` }} />
                <span>{letters[i]}: {pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mill-lifelines">
        <button className={`mill-lifeline ${!fiftyFifty ? 'used' : ''}`} onClick={useFiftyFifty} disabled={!fiftyFifty}>
          50:50
        </button>
        <button className={`mill-lifeline ${!phoneFriend ? 'used' : ''}`} onClick={usePhoneFriend} disabled={!phoneFriend}>
          📞
        </button>
        <button className={`mill-lifeline ${!audience ? 'used' : ''}`} onClick={useAudience} disabled={!audience}>
          👥
        </button>
      </div>

      {phase === 'correct' && (
        <div className="mill-correct-bar">
          <span>✅ {t('נכון!', 'Correct!')} +{prizeFormatted(PRIZE_LADDER[level])}</span>
          <button className="game-btn" onClick={nextQuestion}>{t('השאלה הבאה', 'Next Question')} →</button>
        </div>
      )}
    </div>
  )
}

// ─── GAMES PAGE ───
interface GameDef {
  id: GameId
  icon: typeof Brain
  name: string
  nameEn: string
  desc: string
  descEn: string
  color: string
  image: string
}

const games: GameDef[] = [
  { id: 'spanish', icon: Volume2, name: 'ספרדית', nameEn: 'Spanish', desc: 'למדו ביטויים חשובים לטיול!', descEn: 'Learn essential travel phrases!', color: '#dc2626', image: '/images/game-spanish.jpg' },
  { id: 'trivia', icon: Brain, name: 'טריוויה', nameEn: 'Trivia', desc: 'כמה אתם יודעים על קוסטה ריקה?', descEn: 'How much do you know about Costa Rica?', color: '#059669', image: '/images/game-trivia.jpg' },
  { id: 'memory', icon: Grid3X3, name: 'זיכרון', nameEn: 'Memory', desc: 'מצאו את זוגות החיות!', descEn: 'Find the animal pairs!', color: '#2563eb', image: '/images/game-memory.jpg' },
  { id: 'coloring', icon: Palette, name: 'ציור', nameEn: 'Coloring', desc: 'צבעו חיות מקוסטה ריקה!', descEn: 'Color Costa Rican animals!', color: '#a855f7', image: '/images/game-coloring.jpg' },
  { id: 'jigsaw', icon: Puzzle, name: 'פאזל', nameEn: 'Jigsaw', desc: 'הרכיבו תמונות מהטיול!', descEn: 'Assemble trip photos!', color: '#7c3aed', image: '/images/game-jigsaw.jpg' },
  { id: 'crossword', icon: Hash, name: 'תשבץ', nameEn: 'Crossword', desc: 'פתרו תשבץ טרופי!', descEn: 'Solve a tropical crossword!', color: '#ea580c', image: '/images/game-crossword.jpg' },
  { id: 'scramble', icon: Languages, name: 'פאזל מילים', nameEn: 'Word Scramble', desc: 'פענחו מילים באנגלית!', descEn: 'Unscramble the words!', color: '#d97706', image: '/images/game-scramble.jpg' },
  { id: 'imposter', icon: Eye, name: 'מי המרגל?', nameEn: 'Imposter', desc: 'גלו מי המרגל ביניכם!', descEn: 'Find the spy among you!', color: '#0f172a', image: '/images/game-memory.jpg' },
  { id: 'millionaire', icon: Trophy, name: 'מי רוצה להיות מיליונר?', nameEn: 'Who Wants to Be a Millionaire?', desc: 'ענו על 15 שאלות וזכו במיליון!', descEn: 'Answer 15 questions to win a million!', color: '#1e3a5f', image: '/images/game-trivia.jpg' },
]

export default function GamesPage() {
  const { t } = useLang()
  const [activeGame, setActiveGame] = useState<GameId | null>(null)

  if (activeGame) {
    const game = games.find(g => g.id === activeGame)!
    return (
      <div className="games-page">
        <div className="games-header">
          <button className="games-back-menu" onClick={() => setActiveGame(null)}>
            <span aria-hidden="true">{t('→', '←')}</span>
            {t('כל המשחקים', 'All Games')}
          </button>
          <h2>{t(game.name, game.nameEn)}</h2>
        </div>
        {activeGame === 'trivia' && <TriviaGame t={t} />}
        {activeGame === 'memory' && <MemoryGame t={t} />}
        {activeGame === 'scramble' && <ScrambleGame t={t} />}
        {activeGame === 'jigsaw' && <JigsawGame t={t} />}
        {activeGame === 'crossword' && <CrosswordGame t={t} />}
        {activeGame === 'spanish' && <SpanishGame t={t} />}
        {activeGame === 'coloring' && <ColoringGame t={t} />}
        {activeGame === 'imposter' && <ImposterGame t={t} />}
        {activeGame === 'millionaire' && <MillionaireGame t={t} />}
      </div>
    )
  }

  return (
    <div className="games-page games-adventure">
      {/* Adventure Map Header */}
      <div className="games-map-hero">
        <div className="games-map-hero-bg" />
        <div className="games-map-hero-content">
          <span className="games-map-compass">🧭</span>
          <h2>{t('משחקי ההרפתקה', 'Adventure Games')}</h2>
          <p>{t('השלימו אתגרים כדי לזכות במדבקות!', 'Complete challenges to earn stickers!')}</p>
        </div>
      </div>

      {/* Trail of Games */}
      <div className="games-trail">
        <div className="games-trail-line" />
        {games.map((g, i) => {
          const Icon = g.icon
          const isLeft = i % 2 === 0
          return (
            <div key={g.id} className={`games-trail-stop ${isLeft ? 'left' : 'right'}`}>
              <div className="games-trail-marker" style={{ background: g.color }}>
                <span>{i + 1}</span>
              </div>
              <button className="game-card-parchment" onClick={() => setActiveGame(g.id)}>
                <div className="parchment-img-wrap">
                  <img src={g.image} alt={t(g.name, g.nameEn)} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <div className="parchment-img-overlay" />
                  <div className="parchment-badge" style={{ background: g.color }}>
                    <Icon size={18} color="white" />
                  </div>
                </div>
                <div className="parchment-body">
                  <h3 className="parchment-title">{t(g.name, g.nameEn)}</h3>
                  <p className="parchment-desc">{t(g.desc, g.descEn)}</p>
                  <span className="parchment-play" style={{ color: g.color }}>
                    {t('שחק עכשיו ←', 'Play now →')}
                  </span>
                </div>
              </button>
            </div>
          )
        })}
        <div className="games-trail-end">
          <span>🏆</span>
        </div>
      </div>
    </div>
  )
}
