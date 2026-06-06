import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Chatbot } from './components/Chatbot'
import { RequireAuth } from './components/RequireAuth'
import { RequireRole } from './components/RequireRole'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { SimulationPage } from './pages/SimulationPage'
import { DemandePage } from './pages/DemandePage'
import { DossiersPage } from './pages/DossiersPage'
import { CreditDetailPage } from './pages/CreditDetailPage'

import { AssistantPage } from './pages/AssistantPage'
import { HomePage } from './pages/HomePage'
//import { AccountPage } from './pages/AccountPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { HistoriquePage } from './pages/HistoriquePage'
import { DocumentsHubPage } from './pages/DocumentsHubPage'
import { ActivatePage } from './pages/ActivatePage'
import { ChefComptesPage } from './pages/ChefComptesPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="activate" element={<ActivatePage />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route
            path="dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          
          
          <Route
            path="demande"
            element={
              <RequireAuth>
                <RequireRole roles={['CLIENT']}>
                  <DemandePage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="dossiers"
            element={
              <RequireAuth>
                <DossiersPage />
              </RequireAuth>
            }
          />
          <Route
            path="dossiers/:id"
            element={
              <RequireAuth>
                <CreditDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="historique"
            element={
              <RequireAuth>
                <HistoriquePage />
              </RequireAuth>
            }
          />
          <Route
            path="documents"
            element={
              <RequireAuth>
                <DocumentsHubPage />
              </RequireAuth>
            }
          />
          
          
          <Route
            path="chef/comptes"
            element={
              <RequireAuth>
                <RequireRole roles={['CHEF_AGENCE']}>
                  <ChefComptesPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Chatbot />
    </>
  )
}
