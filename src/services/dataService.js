// Data Service - API'den veri çekme servisi
const API_BASE = '/api/data';

// Helper function for API calls
async function fetchData(endpoint) {
  try {
    // Cache'i tamamen devre dışı bırak
    const timestamp = new Date().getTime();
    const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${timestamp}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
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
// WAREHOUSE VERİLERİ
// ============================================

// Tüm bölgeleri getir
export async function getRegions() {
  return await fetchData('/regions');
}

// Yıllara göre depo istatistikleri
export async function getWarehouseYearlyStats(year = null) {
  const endpoint = year ? `/warehouse-yearly-stats/${year}` : '/warehouse-yearly-stats';
  return await fetchData(endpoint);
}

// Belirli bir bölge için yıllara göre istatistikler
export async function getWarehouseYearlyStatsByRegion(region, year = null) {
  let endpoint = `/warehouse-yearly-stats-by-region/${region}`;
  if (year) {
    endpoint += `/${year}`;
  }
  return await fetchData(endpoint);
}

// ============================================
// SPARE PARTS VERİLERİ
// ============================================

// Tüm yedek parçaları getir (bölge filtresi ile)
export async function getSpareParts(region = null) {
  const endpoint = region && region !== 'all' ? `/spare-parts?region=${region}` : '/spare-parts';
  return await fetchData(endpoint);
}

// Yıllara göre parça kullanım verileri
export async function getSparePartYearlyUsage(year = null) {
  const endpoint = year ? `/spare-part-yearly-usage/${year}` : '/spare-part-yearly-usage';
  return await fetchData(endpoint);
}

// Belirli bir parça için yıllara göre kullanım verileri
export async function getSparePartYearlyUsageByPart(partName, year = null) {
  let endpoint = `/spare-part-yearly-usage-by-part/${partName}`;
  if (year) {
    endpoint += `/${year}`;
  }
  return await fetchData(endpoint);
}

// ============================================
// SECTOR VOLUME BY REGION VERİLERİ
// ============================================

// Bölge/sektör/yıl bazlı hacim verileri
export async function getSectorVolumeByRegion(region = null, sector = null, year = null) {
  let endpoint = '/sector-volume-by-region';
  if (region && region !== 'all') {
    endpoint += `/${region}`;
    if (sector && sector !== 'all') {
      endpoint += `/${sector}`;
      if (year) {
        endpoint += `/${year}`;
      }
    }
  }
  return await fetchData(endpoint);
}

// Tüm bölgeler için yıl bazlı toplam hacim (SUM)
export async function getSectorVolumeTotal(year = null) {
  const endpoint = year ? `/sector-volume-total/${year}` : '/sector-volume-total';
  return await fetchData(endpoint);
}

// ============================================
// SCENARIO RATES VERİLERİ
// ============================================

// Enflasyon oranları
export async function getHistoricalInflation() {
  const data = await fetchData('/inflation-rates');
  // Frontend formatına dönüştür: {year, inflation}
  return data.map(item => ({
    year: item.year,
    inflation: parseFloat(item.inflation_rate)
  }));
}

// Dolar kurları
export async function getDollarRates() {
  const data = await fetchData('/dollar-rates');
  // Frontend formatına dönüştür: {year, rate, change}
  return data.map((item, index) => ({
    year: item.year,
    rate: parseFloat(item.rate),
    change: index === 0 ? 0 : ((parseFloat(item.rate) - parseFloat(data[index - 1].rate)) / parseFloat(data[index - 1].rate)) * 100
  }));
}

// Euro kurları
export async function getEuroRates() {
  const data = await fetchData('/euro-rates');
  // Frontend formatına dönüştür: {year, rate, change}
  return data.map((item, index) => ({
    year: item.year,
    rate: parseFloat(item.rate),
    change: index === 0 ? 0 : ((parseFloat(item.rate) - parseFloat(data[index - 1].rate)) / parseFloat(data[index - 1].rate)) * 100
  }));
}
