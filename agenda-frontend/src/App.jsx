import { useEffect, useState } from 'react'
import LoginPage from './features/auth/LoginPage.jsx'
import PasswordChangeForm from './features/auth/PasswordChangeForm.jsx'
import ClienteProfilePage from './features/clientes/ClienteProfilePage.jsx'
import ClientesPage from './features/clientes/ClientesPage.jsx'
import { clearSession, getMyProfile, readSession, saveSession, signIn } from './services/authService.js'
import UsersPage from './features/users/UsersPage.jsx'
import { ADMIN_ROLE_ID, CUSTOMER_ROLE_ID, getRoleLabel } from './shared/userRoles.js'
import './App.css'

function App() {
  const [session, setSession] = useState(() => readSession())
  const [loginError, setLoginError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(session))
  const [sessionError, setSessionError] = useState('')
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [adminSection, setAdminSection] = useState('users')

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

  if (!session) {
    return (
      <LoginPage
        error={loginError}
        isSubmitting={isSigningIn}
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
              className={adminSection === 'users' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'users' ? 'page' : undefined}
              onClick={() => setAdminSection('users')}
            >
              Usuarios
            </button>
            <button
              className={adminSection === 'clients' ? 'app-navigation-link is-active' : 'app-navigation-link'}
              type="button"
              aria-current={adminSection === 'clients' ? 'page' : undefined}
              onClick={() => setAdminSection('clients')}
            >
              Clientes
            </button>
          </nav>
          {adminSection === 'clients' ? (
            <ClientesPage session={session} />
          ) : (
            <UsersPage session={session} />
          )}
        </>
      ) : roleId === CUSTOMER_ROLE_ID ? (
        <ClienteProfilePage
          session={session}
          onProfileUpdated={handleCustomerProfileUpdated}
        />
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
