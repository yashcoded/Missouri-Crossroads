/**
 * Returns the appropriate badge class for a given category
 * Categories are color-coded:
 * - Red: Historic Markers
 * - Blue: Interpretive/Educational/Library
 * - Green: Monuments and everything else
 */
export function getCategoryBadgeClass(category: string): string {
  if (!category) return "bg-gray-500 text-white";
  
  const categoryLower = category.toLowerCase();
  
  // Red = Historic Markers
  if (categoryLower.includes('historic marker')) {
    return "bg-red-500 text-white border-red-600";
  }
  
  // Blue = Interpretive/Educational/Library
  if (categoryLower.includes('interpretive') || 
      categoryLower.includes('interpetive') || 
      categoryLower.includes('library') || 
      categoryLower.includes('educational')) {
    return "bg-blue-500 text-white border-blue-600";
  }
  
  // Green = Monuments and everything else
  return "bg-green-500 text-white border-green-600";
}


