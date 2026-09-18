import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadProjects = async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.data)
    } catch (err) {
      setError('Could not load projects')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/projects', { name, description })
      setName('')
      setDescription('')
      loadProjects()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create project')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>New Project</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleCreate}>
          <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <button type="submit">Create Project</button>
        </form>
      </div>

      <h2>Your Projects</h2>
      <div className="project-grid">
        {projects.map((p) => (
          <div key={p.id} className="card project-card" onClick={() => navigate(`/projects/${p.id}`)}>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
          </div>
        ))}
        {projects.length === 0 && <p>No projects yet — create one above.</p>}
      </div>
    </div>
  )
}
