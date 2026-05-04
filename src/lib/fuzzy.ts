// Snap coordinates to a ~10km grid before any public exposure.
// Exact coords are stored separately and never leave the server.
const GRID_DEG = 0.09 // ≈ 10 km at mid-latitudes

export function fuzzyCoords(lat: number, lng: number) {
  return {
    latFuzzy: Math.round(lat / GRID_DEG) * GRID_DEG,
    lngFuzzy: Math.round(lng / GRID_DEG) * GRID_DEG,
  }
}
