import { Navigate, Route, Routes } from 'react-router-dom'
import GamePage from './pages/GamePage'
import MenuPage from './pages/MenuPage'
import { PATH } from './routes/Routes'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path={PATH.menu} element={<MenuPage />} />
      <Route path={PATH.game} element={<GamePage />} />
      <Route path="*" element={<Navigate to={PATH.menu} replace />} />
    </Routes>
  )
}

export default App
