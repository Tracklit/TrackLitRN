// Track & Field Coaching Specialties
export const TRACK_FIELD_SPECIALTIES = [
  // Sprint coach
  'Sprint coach',
  '100 m',
  '200 m',
  '400 m',
  '4×100 m relay',
  '4×400 m relay',
  
  // Hurdles coach
  'Hurdles coach',
  '100 m hurdles',
  '110 m hurdles',
  '400 m hurdles',
  
  // Middle-distance coach
  'Middle-distance coach',
  '800 m',
  '1500 m',
  'Mile',
  
  // Long-distance / Endurance coach
  'Long-distance / Endurance coach',
  '3000 m',
  '5000 m',
  '10,000 m',
  'Cross-country',
  
  // Race walking coach
  'Race walking coach',
  '20 km race walk',
  '35 km race walk',
  
  // Jumps coach
  'Jumps coach',
  'Long jump',
  'Triple jump',
  'High jump',
  'Pole vault',
  
  // Throws coach
  'Throws coach',
  'Shot put',
  'Discus throw',
  'Hammer throw',
  'Javelin throw',
  
  // Combined events coach
  'Combined events coach',
  'Decathlon',
  'Heptathlon',
  
  // Strength & conditioning coach
  'Strength & conditioning coach',
  
  // Performance / mental skills coach
  'Performance / mental skills coach',
] as const;

export const SPECIALTY_CATEGORIES = {
  'Sprint coach': ['100 m', '200 m', '400 m', '4×100 m relay', '4×400 m relay'],
  'Hurdles coach': ['100 m hurdles', '110 m hurdles', '400 m hurdles'],
  'Middle-distance coach': ['800 m', '1500 m', 'Mile'],
  'Long-distance / Endurance coach': ['3000 m', '5000 m', '10,000 m', 'Cross-country'],
  'Race walking coach': ['20 km race walk', '35 km race walk'],
  'Jumps coach': ['Long jump', 'Triple jump', 'High jump', 'Pole vault'],
  'Throws coach': ['Shot put', 'Discus throw', 'Hammer throw', 'Javelin throw'],
  'Combined events coach': ['Decathlon', 'Heptathlon'],
  'Strength & conditioning coach': ['All track and field events'],
  'Performance / mental skills coach': ['All track and field events'],
} as const;

export type TrackFieldSpecialty = typeof TRACK_FIELD_SPECIALTIES[number];
