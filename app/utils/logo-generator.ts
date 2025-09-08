
const GRADIENT_PAIRS = [
  ['#FF6B6B', '#FF8E53'], // Red to Orange
  ['#4ECDC4', '#556270'], // Teal to Dark Blue
  ['#45B7D1', '#96D5E4'], // Light Blue to Lighter Blue
  ['#F9A826', '#F9D423'], // Orange to Yellow
  ['#6C5CE7', '#A29BFE'], // Purple to Light Purple
  ['#00B4DB', '#0083B0'], // Blue to Dark Blue
  ['#11998e', '#38ef7d'], // Green to Light Green
  ['#FF512F', '#DD2476'], // Red to Pink
  ['#1A2980', '#26D0CE'], // Dark Blue to Teal
  ['#FF5F6D', '#FFC371'], // Coral to Peach
];


const ACADEMIC_ICONS = [
  '🎓', '📚', '🏫', '📝', '🔬', '🧪', '🧮', '🌍', '💡', '⚖️',
  '🧬', '📊', '💻', '🏛️', '🎨', '🎵', '⚽', '🔍', '📖', '🌟'
];

export function generateUniversityLogo(universityName: string, slug?: string): string {
  const identifier = slug || universityName.toLowerCase().replace(/\s+/g, '-');
  
  // Create a deterministic hash from the identifier
  const hash = stringToHash(identifier);
  
  // Select gradient based on hash
  const gradientIndex = hash % GRADIENT_PAIRS.length;
  const [color1, color2] = GRADIENT_PAIRS[gradientIndex];
  
  // Select icon based on hash
  const iconIndex = hash % ACADEMIC_ICONS.length;
  const icon = ACADEMIC_ICONS[iconIndex];
  
  // Get initials from university name
  const initials = getInitials(universityName);
  
  // Return SVG data URL
  return generateSvgLogo(initials, icon, color1, color2);
}

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return 'U';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  
  // Take first 2-3 letters based on name structure
  if (words.length >= 2) {
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    
    // For names like "University of X", use "UX"
    if (firstWord.toLowerCase() === 'university' && words.length > 1) {
      return `U${lastWord.charAt(0).toUpperCase()}`;
    }
    
    // For names like "X State University", use "XSU"
    if (words.length >= 3 && words[words.length - 2].toLowerCase() === 'state') {
      return `${words[0].charAt(0).toUpperCase()}S${lastWord.charAt(0).toUpperCase()}`;
    }
    
    return `${firstWord.charAt(0).toUpperCase()}${lastWord.charAt(0).toUpperCase()}`;
  }
  
  return words[0].charAt(0).toUpperCase();
}

function generateSvgLogo(initials: string, icon: string, color1: string, color2: string): string {
  const svg = `
    <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="300" height="200" fill="url(#gradient)" rx="15" />
      
      <text x="150" y="110" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="48" font-weight="bold" fill="white" opacity="0.9">
        ${initials}
      </text>
      
      <text x="150" y="160" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="36" fill="white" opacity="0.8">
        ${icon}
      </text>
    </svg>
  `;
  
  // Convert SVG to data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Alternative: Use a canvas-based approach for more complex designs
export function generateCanvasLogo(universityName: string): string {
  // This would be more complex but could create nicer-looking logos
  // For now, we'll stick with SVG for simplicity
  return generateUniversityLogo(universityName);
}