// Cache-busting ile fetch helper fonksiyonu
export async function fetchWithCacheBust(url, options = {}) {
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  const urlWithTimestamp = `${url}${separator}_t=${timestamp}`;
  
  const response = await fetch(urlWithTimestamp, {
    ...options,
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers
    }
  });
  
  return response;
}






