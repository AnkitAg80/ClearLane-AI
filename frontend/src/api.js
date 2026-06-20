const jsonHeaders = {
  Accept: 'application/json',
};

async function request(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, { headers: jsonHeaders });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

export function getOverview() {
  return request('/api/overview');
}

export function getMapRows(filters) {
  return request('/api/map', filters);
}

export function getHotspots(filters) {
  return request('/api/hotspots', filters);
}

export function getHotspotDetail(h3) {
  return request(`/api/hotspots/${encodeURIComponent(h3)}`);
}

export function getDeployment() {
  return request('/api/deployment');
}

export function getEvidence() {
  return request('/api/evidence');
}
