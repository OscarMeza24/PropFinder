/**
 * Utilidades para manejar imágenes y URLs
 */

/**
 * Valida si una URL de imagen es válida y accesible
 * @param url - URL de la imagen a validar
 * @returns true si la URL es válida, false en caso contrario
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Rechazar URLs blob malformadas
  if (url.startsWith('blob:') && !url.includes('localhost')) return false;
  
  // Rechazar URLs que no son válidas
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtiene una URL de imagen segura, con fallback a placeholder
 * @param imageUrl - URL de la imagen original
 * @param fallbackUrl - URL de fallback (opcional)
 * @returns URL de imagen válida
 */
export const getSafeImageUrl = (
  imageUrl: string | undefined | null, 
  fallbackUrl: string = '/placeholder-property.jpg'
): string => {
  if (!imageUrl) return fallbackUrl;
  
  return isValidImageUrl(imageUrl) ? imageUrl : fallbackUrl;
};

/**
 * Filtra un array de URLs de imágenes para obtener solo las válidas
 * @param images - Array de URLs de imágenes
 * @returns Array de URLs válidas
 */
export const filterValidImages = (images: (string | null | undefined)[]): string[] => {
  if (!Array.isArray(images)) return [];
  
  return images
    .filter((img): img is string => Boolean(img))
    .filter(isValidImageUrl);
};

/**
 * Obtiene la primera imagen válida de un array
 * @param images - Array de URLs de imágenes
 * @param fallbackUrl - URL de fallback
 * @returns Primera imagen válida o fallback
 */
export const getFirstValidImage = (
  images: (string | null | undefined)[] = [], 
  fallbackUrl: string = '/placeholder-property.jpg'
): string => {
  const validImages = filterValidImages(images);
  return validImages.length > 0 ? validImages[0] : fallbackUrl;
};
