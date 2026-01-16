// Fleet Service - API'den filo verilerini çekme servisi
const API_BASE = '/api/fleet';

// Helper function for API calls
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'API error');
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================
// FLEET SUMMARY
// ============================================

export async function getFleetSummary() {
  return await fetchData('/summary');
}

// ============================================
// FLEET SECTORS
// ============================================

export async function getFleetSectors() {
  return await fetchData('/sectors');
}

// ============================================
// FLEET TRUCKS
// ============================================

export async function getFleetTrucks(sector = null) {
  const endpoint = sector ? `/trucks?sector=${sector}` : '/trucks';
  return await fetchData(endpoint);
}

// ============================================
// FLEET TRAILERS
// ============================================

export async function getFleetTrailers(sector = null) {
  const endpoint = sector ? `/trailers?sector=${sector}` : '/trailers';
  return await fetchData(endpoint);
}

// ============================================
// FLEET BY SECTOR (Tüm verileri bir arada)
// ============================================

export async function getFleetBySector(sector = null) {
  const endpoint = sector ? `/by-sector/${sector}` : '/by-sector';
  return await fetchData(endpoint);
}

// ============================================
// FLEET REGION DISTRIBUTION
// Bölgeye göre filo dağılımı (donut grafiği için)
// ============================================

export async function getFleetRegionDistribution(region = null) {
  const endpoint = region && region !== 'all' ? `/region-distribution?region=${region}` : '/region-distribution';
  return await fetchData(endpoint);
}

