/**
 * Vibe Configuration for WeeVocab Application
 * Theme: Scottish Junior Tartan & Contemporary Highland Light
 * Target Audience: Scottish Students Aged 10–15 (P6 to S4)
 */
export default {
  theme: {
    name: 'Scottish Junior Tartan Explorer',
    primaryColor: '#2563eb', // Saltire Blue
    accentColor: '#f59e0b',  // Highland Gold
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    mood: 'Energetic, Friendly, Educational, Gamified',
  },
  soundEffects: {
    enabled: true,
    engine: 'Web Audio API Synthesizer (100% Offline)',
  },
  voiceStudio: {
    speechEngine: 'Web Speech API (en-GB/Scottish)',
    speechRecognition: 'Web Speech Recognition',
  },
  dictionary: {
    regionCoverage: [
      'Glasgow & West',
      'Edinburgh & East',
      'Highlands & Islands',
      'Aberdeen & Doric',
      'Dundee & Angus',
      'General Scots & UK Academic',
    ],
    features: [
      'Min 2 Examples Per Word',
      'Synonyms & Antonyms',
      'A to Z Letter Jump',
      'Daily Word Quest',
      'Interactive Games Arcade',
    ],
  },
};
