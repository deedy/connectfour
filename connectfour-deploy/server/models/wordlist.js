// List of 4-letter nouns to generate readable, fun game IDs
const fourLetterNouns = [
  "ball", "book", "cake", "door", "fire", "fish", "food", "game", "gold", "hand",
  "home", "king", "lake", "lamp", "land", "leaf", "moon", "park", "path", "rock",
  "rose", "ship", "shoe", "shop", "snow", "star", "time", "tree", "wind", "wolf",
  "bird", "boat", "city", "desk", "face", "girl", "hair", "hill", "idea", "kite",
  "lion", "meal", "milk", "mind", "nail", "name", "nest", "news", "note", "page",
  "plan", "rain", "road", "roof", "room", "sand", "seed", "sign", "sock", "song",
  "soup", "team", "test", "town", "user", "view", "wall", "wave", "wire", "wood",
  "bear", "belt", "bike", "bowl", "card", "chef", "coat", "corn", "dice", "drum",
  "duck", "dust", "farm", "fork", "frog", "gear", "goat", "hero", "joke", "jump",
  "knot", "mask", "meat", "pear", "pony", "ring", "salt", "seat", "skin", "sofa",
  "stem", "tent", "tool", "yarn", "year", "zone", "apex", "atom", "cave", "chef",
  "clay", "code", "coin", "crab", "crew", "data", "dawn", "deer", "disc", "dock"
];

// Function to get a random word from the list
function getRandomWord() {
  return fourLetterNouns[Math.floor(Math.random() * fourLetterNouns.length)];
}

// Generate a fun game ID - three 4-letter nouns with a hyphen between them
function generateGameId() {
  return `${getRandomWord()}-${getRandomWord()}-${getRandomWord()}`;
}

module.exports = {
  generateGameId
};