import { useEffect, useState } from 'react'
import AuthLayout from './features/auth/AuthLayout.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import PasswordRecoveryPage from './features/auth/PasswordRecoveryPage.jsx'
import PasswordChangeForm from './features/auth/PasswordChangeForm.jsx'
import ClienteProfilePage from './features/clientes/ClienteProfilePage.jsx'
import ClientesPage from './features/clientes/ClientesPage.jsx'
import VehiculosPage from './features/vehiculos/VehiculosPage.jsx'
import CitasPage from './features/citas/CitasPage.jsx'
import TecnicosPage from './features/tecnicos/TecnicosPage.jsx'
import ReportesPage from './features/reportes/ReportesPage.jsx'
import CatalogosPage from './features/catalogos/CatalogosPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import { clearSession, getMyProfile, readSession, saveSession, signIn } from './services/authService.js'
import UsersPage from './features/users/UsersPage.jsx'
import {
  ADMIN_ROLE_ID,
  CUSTOMER_ROLE_ID,
  TECHNICIAN_ROLE_ID,
  getRoleLabel,
} from './shared/userRoles.js'
import './App.css'

function App() {
  const [session, setSession] = useState(() => readSession())
  const [passwordResetToken, setPasswordResetToken] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('resetToken')
      || new URLSearchParams(window.location.search).get('resetToken')
      || ''
  )
  const [loginError, setLoginError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(session))
  const [sessionError, setSessionError] = useState('')
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [adminSection, setAdminSection] = useState('dashboard')
  const [adminDashboardFilter, setAdminDashboardFilter] = useState(null)
  const [customerSection, setCustomerSection] = useState('profile')
  const [technicianSection, setTechnicianSection] = useState('appointments')

  function navigateAdminSection(section) {
    setAdminDashboardFilter(null)
    setAdminSection(section)
  }

  function navigateFromDashboard(section, filters) {
    setAdminDashboardFilter({ section, filters })
    setAdminSection(section)
  }

  useEffect(() => {
    const token = session?.token
    if (!token) return undefined

    let isCurrent = true

    getMyProfile(token)
      .then((user) => {
        if (!isCurrent) return
        const restoredSession = { token, user }
        saveSession(restoredSession)
        setSession(restoredSession)
      })
      .catch((error) => {
        if (!isCurrent) return
        if (error.status === 401 || error.status === 404) {
          clearSession()
          setSession(null)
          setLoginError('La sesión venció o la cuenta ya no está activa. Inicia sesión nuevamente.')
          return
        }
        setSessionError(error.message)
      })
      .finally(() => {
        if (isCurrent) setIsRestoringSession(false)
      })

    return () => {
      isCurrent = false
    }
  }, [restoreAttempt, session?.token])

  useEffect(() => {
    function handleUnauthorized() {
      clearSession()
      setSession(null)
      setIsChangingPassword(false)
      setPasswordMessage('')
      setLoginError('La sesión venció. Inicia sesión nuevamente.')
    }

    window.addEventListener('agendaletric:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('agendaletric:unauthorized', handleUnauthorized)
  }, [])

  async function handleSignIn(credentials) {
    setLoginError('')
    setIsSigningIn(true)

    try {
      const nextSession = await signIn(credentials)
      saveSession(nextSession)
      setLoginError('')
      setSessionError('')
      setIsRestoringSession(true)
      setSession(nextSession)
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsSigningIn(false)
    }
  }

  function handleSignOut() {
    clearSession()
    setSessionError('')
    setPasswordMessage('')
    setIsChangingPassword(false)
    setSession(null)
  }

  function handleCustomerProfileUpdated(customer) {
    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        nombre: customer.nombre_completo,
        correo: customer.correo,
      },
    }
    saveSession(updatedSession)
    setSession(updatedSession)
  }

  if (passwordResetToken) {
    return (
      <AuthLayout>
        <PasswordRecoveryPage
          token={passwordResetToken}
          onBack={() => {
            setPasswordResetToken('')
            const url = new URL(window.location.href)
            url.searchParams.delete('resetToken')
            url.hash = ''
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
          }}
          onResetSuccess={() => {
            clearSession()
            setSession(null)
            const url = new URL(window.location.href)
            url.searchParams.delete('resetToken')
            url.hash = ''
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
          }}
        />
      </AuthLayout>
    )
  }

  if (!session) {
    return (
      <LoginPage
        error={loginError}
        isSubmitting={isSigningIn}
        onClearError={() => setLoginError('')}
        onSubmit={handleSignIn}
      />
    )
  }

  if (isRestoringSession || sessionError) {
    return (
      <main className="session-state">
        <section className="notice-card" role={sessionError ? 'alert' : 'status'}>
          <h1>{sessionError ? 'No fue posible validar la sesión' : 'Verificando sesión...'}</h1>
          {sessionError && (
            <>
              <p>{sessionError}</p>
              <div className="session-actions">
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => {
                    setSessionError('')
                    setIsRestoringSession(true)
                    setRestoreAttempt((attempt) => attempt + 1)
                  }}
                >
                  Reintentar
                </button>
                <button className="button button--secondary" type="button" onClick={handleSignOut}>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    )
  }

  const roleId = Number(session.user.id_rol)
  const roleLabel = getRoleLabel(roleId)

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="app-brand" href="/" aria-label="AgendaLetric, inicio">
          <span className="app-brand-mark" aria-hidden="true">A</span>
          <span>
            <strong>AgendaLetric</strong>
            <small>{roleLabel}</small>
          </span>
        </a>
        <div className="app-account">
          <span className="app-account-name">{session.user.nombre}</span>
          <div className="app-account-actions">
            <button
              className="button button--quiet"
              type="button"
              onClick={() => {
                setPasswordMessage('')
                setIsChangingPassword(true)
              }}
            >
              Cambiar contraseña
            </button>
            <button className="button button--quiet" type="button" onClick={handleSignOut}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      {passwordMessage && <p className="password-notice" role="status">{passwordMessage}</p>}
      {roleId === ADMIN_ROLE_ID ? (
        <>
          <nav className="app-navigation" aria-label="Módulos de administración">
            <button
              className={adminSection === 'dashboard' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'dashboard' ? 'page' : undefined}
              onClick={() => navigateAdminSection('dashboard')}
            >
              Resumen
            </button>
            <button
              className={adminSection === 'users' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'users' ? 'page' : undefined}
              onClick={() => navigateAdminSection('users')}
            >
              Usuarios
            </button>
            <button
              className={adminSection === 'clients' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'clients' ? 'page' : undefined}
              onClick={() => navigateAdminSection('clients')}
            >
              Clientes
            </button>
            <button
              className={adminSection === 'vehicles' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'vehicles' ? 'page' : undefined}
              onClick={() => navigateAdminSection('vehicles')}
            >
              Vehículos
            </button>
            <button
              className={adminSection === 'appointments' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'appointments' ? 'page' : undefined}
              onClick={() => navigateAdminSection('appointments')}
            >
              Citas
            </button>
            <button
              className={adminSection === 'technicians' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'technicians' ? 'page' : undefined}
              onClick={() => navigateAdminSection('technicians')}
            >
              Técnicos y horarios
            </button>
            <button
              className={adminSection === 'reports' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'reports' ? 'page' : undefined}
              onClick={() => navigateAdminSection('reports')}
            >
              Reportes técnicos
            </button>
            <button
              className={adminSection === 'catalogs' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'catalogs' ? 'page' : undefined}
              onClick={() => navigateAdminSection('catalogs')}
            >
              Catálogos
            </button>
          </nav>
          {adminSection === 'dashboard' ? (
            <DashboardPage session={session} onNavigate={navigateFromDashboard} />
          ) : adminSection === 'catalogs' ? (
            <CatalogosPage session={session} />
          ) : adminSection === 'reports' ? (
            <ReportesPage
              key={adminDashboardFilter?.section === 'reports'
                ? adminDashboardFilter.filters.publicationState
                : 'all-reports'}
              session={session}
              initialPublicationState={
                adminDashboardFilter?.section === 'reports'
                  ? adminDashboardFilter.filters.publicationState
                  : ''
              }
            />
          ) : adminSection === 'technicians' ? (
            <TecnicosPage
              key={adminDashboardFilter?.section === 'technicians' &&
                adminDashboardFilter.filters.activeOnly
                ? 'active-technicians'
                : 'all-technicians'}
              session={session}
              initialActiveOnly={
                adminDashboardFilter?.section === 'technicians' &&
                adminDashboardFilter.filters.activeOnly
              }
            />
          ) : adminSection === 'appointments' ? (
            <CitasPage
              key={adminDashboardFilter?.section === 'appointments'
                ? JSON.stringify(adminDashboardFilter.filters)
                : 'all-appointments'}
              session={session}
              dashboardFilter={
                adminDashboardFilter?.section === 'appointments'
                  ? adminDashboardFilter.filters
                  : null
              }
            />
          ) : adminSection === 'vehicles' ? (
            <VehiculosPage session={session} />
          ) : adminSection === 'clients' ? (
            <ClientesPage
              key={adminDashboardFilter?.section === 'clients' &&
                adminDashboardFilter.filters.activeOnly
                ? 'active-clients'
                : 'all-clients'}
              session={session}
              initialActiveOnly={
                adminDashboardFilter?.section === 'clients' &&
                adminDashboardFilter.filters.activeOnly
              }
            />
          ) : (
            <UsersPage session={session} />
          )}
        </>
      ) : roleId === CUSTOMER_ROLE_ID ? (
        <>
          <nav className="app-navigation" aria-label="Módulos de cliente">
            <button
              className={customerSection === 'profile' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={customerSection === 'profile' ? 'page' : undefined}
              onClick={() => setCustomerSection('profile')}
            >
              Mi perfil
            </button>
            <button
              className={customerSection === 'vehicles' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={customerSection === 'vehicles' ? 'page' : undefined}
              onClick={() => setCustomerSection('vehicles')}
            >
              Mis vehículos
            </button>
            <button
              className={customerSection === 'appointments' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={customerSection === 'appointments' ? 'page' : undefined}
              onClick={() => setCustomerSection('appointments')}
            >
              Mis citas
            </button>
            <button
              className={customerSection === 'reports' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={customerSection === 'reports' ? 'page' : undefined}
              onClick={() => setCustomerSection('reports')}
            >
              Mis reportes
            </button>
          </nav>
          {customerSection === 'reports' ? (
            <ReportesPage session={session} />
          ) : customerSection === 'appointments' ? (
            <CitasPage session={session} />
          ) : customerSection === 'vehicles' ? (
            <VehiculosPage session={session} />
          ) : (
            <ClienteProfilePage
              session={session}
              onProfileUpdated={handleCustomerProfileUpdated}
            />
          )}
        </>
      ) : roleId === TECHNICIAN_ROLE_ID ? (
        <>
          <nav className="app-navigation" aria-label="Módulos de técnico">
            <button
              className={technicianSection === 'appointments' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={technicianSection === 'appointments' ? 'page' : undefined}
              onClick={() => setTechnicianSection('appointments')}
            >
              Mis citas
            </button>
            <button
              className={technicianSection === 'profile' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={technicianSection === 'profile' ? 'page' : undefined}
              onClick={() => setTechnicianSection('profile')}
            >
              Mi perfil y horario
            </button>
            <button
              className={technicianSection === 'reports' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={technicianSection === 'reports' ? 'page' : undefined}
              onClick={() => setTechnicianSection('reports')}
            >
              Reportes técnicos
            </button>
          </nav>
          {technicianSection === 'reports' ? (
            <ReportesPage session={session} />
          ) : technicianSection === 'profile' ? (
            <TecnicosPage session={session} />
          ) : (
            <CitasPage session={session} />
          )}
        </>
      ) : (
        <main className="users-page">
          <section className="notice-card">
            <p className="eyebrow">{roleLabel}</p>
            <h1>Hola, {session.user.nombre}</h1>
            <p>Tu cuenta está activa. Los módulos correspondientes a tu rol se habilitarán en las siguientes etapas.</p>
          </section>
        </main>
      )}
      {isChangingPassword && (
        <PasswordChangeForm
          token={session.token}
          onCancel={() => setIsChangingPassword(false)}
          onSuccess={() => {
            setIsChangingPassword(false)
            setPasswordMessage('La contraseña se actualizó correctamente.')
          }}
        />
      )}
    </div>
  )
}

export default App
