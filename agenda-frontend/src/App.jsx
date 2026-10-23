import { useEffect, useState } from 'react'
import LoginPage from './features/auth/LoginPage.jsx'
import { clearSession, getMyProfile, readSession, saveSession, signIn } from './services/authService.js'
import UsersPage from './features/users/UsersPage.jsx'
import './App.css'

function App() {
  const [session, setSession] = useState(() => readSession())
  const [loginError, setLoginError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(session))
  const [sessionError, setSessionError] = useState('')
  const [restoreAttempt, setRestoreAttempt] = useState(0)

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
    setSession(null)
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="app-brand" href="/" aria-label="AgendaLetric, inicio">
          <span className="app-brand-mark" aria-hidden="true">A</span>
          <span>
            <strong>AgendaLetric</strong>
            <small>Administración del sistema</small>
          </span>
        </a>
        <div className="app-account">
          <span className="app-account-name">{session.user.nombre}</span>
          <button className="button button--quiet" type="button" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <UsersPage session={session} />
    </div>
  )
}

export default App
