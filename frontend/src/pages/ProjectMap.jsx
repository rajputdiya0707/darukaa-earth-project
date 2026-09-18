import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import api from '../api.js'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

export default function ProjectMap() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const drawRef = useRef(null)
  const [sites, setSites] = useState([])
  const [siteName, setSiteName] = useState('')
  const [pendingGeometry, setPendingGeometry] = useState(null)
  const [error, setError] = useState('')

  const loadSites = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/sites`)
      setSites(res.data)
    } catch (err) {
      setError('Could not load sites')
    }
  }

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      setError('Set VITE_MAPBOX_TOKEN in your .env file to enable the map.')
      return
    }
    if (mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [78.9629, 20.5937], // India center as default
      zoom: 4,
    })
    mapRef.current = map

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    })
    drawRef.current = draw
    map.addControl(draw)

    map.on('draw.create', (e) => {
      const feature = e.features[0]
      setPendingGeometry(feature.geometry)
    })
    map.on('draw.delete', () => setPendingGeometry(null))

    loadSites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || sites.length === 0) return
    sites.forEach((site) => {
      const sourceId = `site-${site.id}`
      if (map.getSource(sourceId)) return
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: site.geometry, properties: { name: site.name } },
      })
      map.addLayer({
        id: `${sourceId}-fill`,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.35 },
      })
      map.addLayer({
        id: `${sourceId}-line`,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#15803d', 'line-width': 2 },
      })
    })
  }, [sites])

  const saveSite = async (e) => {
    e.preventDefault()
    if (!pendingGeometry) {
      setError('Draw a polygon on the map first (use the polygon tool, top-right).')
      return
    }
    try {
      await api.post(`/projects/${projectId}/sites`, {
        name: siteName,
        geometry: pendingGeometry,
        area_hectares: 0,
      })
      setSiteName('')
      setPendingGeometry(null)
      drawRef.current.deleteAll()
      loadSites()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save site')
    }
  }

  return (
    <div className="container">
      <button className="secondary" onClick={() => navigate('/')}>
        ← Back to Projects
      </button>
      <h2>Project Sites Map</h2>
      {error && <div className="error">{error}</div>}
      <div id="map" ref={mapContainer}></div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Add a site</h3>
        <p>Use the polygon tool on the map (top-right corner) to draw a site boundary, then name and save it.</p>
        <form onSubmit={saveSite}>
          <input placeholder="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
          <button type="submit">Save Site</button>
        </form>
      </div>

      <div className="card">
        <h3>Sites in this project</h3>
        <ul className="site-list">
          {sites.map((s) => (
            <li key={s.id} onClick={() => navigate(`/sites/${s.id}`)}>
              {s.name}
            </li>
          ))}
          {sites.length === 0 && <li>No sites yet — draw one above.</li>}
        </ul>
      </div>
    </div>
  )
}
