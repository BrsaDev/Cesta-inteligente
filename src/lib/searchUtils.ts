/**
 * Normalizes a string by removing accents, converting to lowercase,
 * and removing common Portuguese stop words (prepositions/articles).
 */
export const normalizeString = (str: string): string => {
  if (!str) return '';
  
  // Basic normalization: lowercase and remove accents
  let normalized = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Remove common Portuguese stop words (prepositions and articles)
  // Example: "massa para pastel" -> "massa pastel", "massa de pastel" -> "massa pastel"
  const stopWords = ['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'sem', 'em', 'no', 'na', 'nos', 'nas', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'];
  
  // Create a regex to match stop words as whole words
  const stopWordsRegex = new RegExp(`\\b(${stopWords.join('|')})\\b`, 'gi');
  
  return normalized
    .replace(stopWordsRegex, '')
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();
};
