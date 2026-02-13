import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ReviewerPage } from '@/pages/ReviewerPage'
import { ConfigFileGeneratorPage } from '@/pages/ConfigFileGeneratorPage'
import { MapperPage } from '@/pages/MapperPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReviewerPage />} />
        <Route path="/mapper" element={<MapperPage />} />
        <Route path="/config-file-generator" element={<ConfigFileGeneratorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
