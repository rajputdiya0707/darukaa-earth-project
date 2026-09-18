import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import api from '../api.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function SiteDetail() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/sites/${siteId}/analytics`)
      .then((res) => setAnalytics(res.data))
      .catch(() => setError('Could not load analytics'))
  }, [siteId])

  if (error) return <div className="container error">{error}</div>
  if (!analytics) return <div className="container">Loading…</div>

  const labels = analytics.points.map((p) => p.date)
  const chartData = (key, label, color) => ({
    labels,
    datasets: [
      {
        label,
        data: analytics.points.map((p) => p[key]),
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
      },
    ],
  })

  return (
    <div className="container">
      <button className="secondary" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2>{analytics.site_name} — Analytics</h2>

      <div className="card">
        <h3>Carbon (tonnes)</h3>
        <Line data={chartData('carbon_tonnes', 'Carbon (t)', '#15803d')} />
      </div>
      <div className="card">
        <h3>Canopy Cover (%)</h3>
        <Line data={chartData('canopy_cover_pct', 'Canopy Cover %', '#2563eb')} />
      </div>
      <div className="card">
        <h3>Biodiversity Index</h3>
        <Line data={chartData('biodiversity_index', 'Biodiversity Index', '#d97706')} />
      </div>
    </div>
  )
}
