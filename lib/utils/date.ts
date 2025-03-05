/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string (YYYY-MM-DD HH:MM:SS)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Format: YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'Invalid date';
  }
} 