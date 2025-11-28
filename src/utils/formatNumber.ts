/**
 * Format large numbers with K, M, B suffixes
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string
 */
export function formatNumber(
  num: number | undefined | null,
  decimals: number = 1
): string {
  if (num === undefined || num === null || num === 0) {
    return '0';
  }

  const absNum = Math.abs(num);

  if (absNum >= 1000000000) {
    // Billions
    return (num / 1000000000).toFixed(decimals).replace(/\.0$/, '') + 'B';
  } else if (absNum >= 1000000) {
    // Millions
    return (num / 1000000).toFixed(decimals).replace(/\.0$/, '') + 'M';
  } else if (absNum >= 1000) {
    // Thousands
    return (num / 1000).toFixed(decimals).replace(/\.0$/, '') + 'K';
  }

  return num.toString();
}

/**
 * Format number with commas for readability (no suffix)
 * Use this for smaller numbers where K/M/B isn't needed
 */
export function formatNumberWithCommas(num: number | undefined | null): string {
  if (num === undefined || num === null) {
    return '0';
  }
  return num.toLocaleString();
}
