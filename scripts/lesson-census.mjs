// Lesson pages call each step a relationship. The census is that array, not a
// second number written into README, CLAUDE.md, or the exporter.

const NUMBER_WORDS = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

function parseCount(token) {
  const word = String(token).toLowerCase();
  if (Object.hasOwn(NUMBER_WORDS, word)) return NUMBER_WORDS[word];
  if (/^\d+$/.test(word)) return Number(word);
  return null;
}

export function lessonCensus(lessons) {
  if (!Array.isArray(lessons) || lessons.some(lesson => !Array.isArray(lesson?.steps))) {
    throw new Error('lessonCensus expects lessons that each have a steps array');
  }
  return {
    lessons: lessons.length,
    relationships: lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0),
  };
}

export function censusMismatches(text, census) {
  const mismatches = [];
  for (const match of String(text).matchAll(/\b(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\s+lessons\b/gi)) {
    const stated = parseCount(match[1]);
    if (stated !== census.lessons) mismatches.push({kind: 'lessons', stated, actual: census.lessons, excerpt: match[0]});
  }
  for (const match of String(text).matchAll(/\b(\d+)\s+(?:anatomical\s+)?relationships\b/gi)) {
    const stated = Number(match[1]);
    if (stated !== census.relationships) mismatches.push({kind: 'relationships', stated, actual: census.relationships, excerpt: match[0]});
  }
  return mismatches;
}
