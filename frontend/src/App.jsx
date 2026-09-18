import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProjectMap from './pages/ProjectMap.jsx'
import SiteDetail from './pages/SiteDetail.jsx'

function isAuthed() {
  return !!localStorage.getItem('token')
}

function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />
}

function Navbar() {
  const navigate = useNavigate()
  const authed = isAuthed()
  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }
  return (
    <div className="navbar">
      <div>
        <Link to="/">🌍 Darukaa.Earth</Link>
      </div>
      <div>
        {authed ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <PrivateRoute>
              <ProjectMap />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId"
          element={
            <PrivateRoute>
              <SiteDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  )
}
