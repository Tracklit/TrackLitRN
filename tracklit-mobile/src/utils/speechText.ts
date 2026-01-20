export const cleanSpeechText = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/[•\-]\s*/g, '')
    .replace(/\n+/g, '. ');
};

