import { useState } from 'react'
import AuthLayout from './AuthLayout.jsx'
import CustomerRegistrationForm from './CustomerRegistrationForm.jsx'
import PasswordRecoveryPage from './PasswordRecoveryPage.jsx'
import { clearRememberedEmail, readRememberedEmail, saveRememberedEmail } from '../../services/authService.js'
import { getEmailValidationMessage } from '../../shared/emailValidation.js'
import './LoginPage.css'

function LoginPage({ error, isSubmitting, onSubmit, onClearError }) {
  const [correo, setCorreo] = useState(() => readRememberedEmail())
  const [contrasena, setContrasena] = useState('')
  const [recordarCorreo, setRecordarCorreo] = useState(() => Boolean(readRememberedEmail()))
  const [validationError, setValidationError] = useState('')
  const [screen, setScreen] = useState('welcome')
  const [registrationMessage, setRegistrationMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')

    const emailError = getEmailValidationMessage(correo)
    if (emailError) {
      setValidationError(emailError)
      return
    }
    if (!contrasena) {
      setValidationError('Ingresa tu contraseña.')
      return
    }

    if (recordarCorreo) {
      saveRememberedEmail(correo)
    } else {
      clearRememberedEmail()
    }
    onSubmit({ correo: correo.trim(), contrasena })
  }

  let content

  if (screen === 'register') {
    content = (
      <CustomerRegistrationForm
        onCancel={() => setScreen('welcome')}
        onSuccess={(registeredEmail) => {
          setCorreo(registeredEmail)
          setContrasena('')
          setRegistrationMessage('Cuenta creada. Ya puedes iniciar sesión.')
          setScreen('login')
        }}
      />
    )
  } else if (screen === 'recover') {
    content = (
      <PasswordRecoveryPage
        token=""
        onBack={() => setScreen('login')}
      />
    )
  } else if (screen === 'login') {
    content = (
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">⚡</div>
        <p className="eyebrow">AgendaLetric</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="login-description">
          Ingresa para continuar según los permisos de tu cuenta.
        </p>

        <form className="login-form" noValidate onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              autoComplete="username"
              name="correo"
              type="email"
              value={correo}
              onChange={(event) => {
                setCorreo(event.target.value)
                setValidationError('')
                onClearError()
              }}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete="current-password"
              name="contrasena"
              type="password"
              value={contrasena}
              onChange={(event) => {
                setContrasena(event.target.value)
                setValidationError('')
                onClearError()
              }}
              required
            />
          </label>
          <label className="remember-email-option">
            <input
              checked={recordarCorreo}
              onChange={(event) => {
                const shouldRemember = event.target.checked
                setRecordarCorreo(shouldRemember)
                if (!shouldRemember) clearRememberedEmail()
              }}
              type="checkbox"
            />
            Recordar mi correo en este dispositivo
          </label>
          {registrationMessage && (
            <p className="feedback feedback--success" role="status">{registrationMessage}</p>
          )}
          {validationError && <p className="form-error" role="alert">{validationError}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validando acceso...' : 'Entrar'}
          </button>
        </form>
        <button
          className="button button--quiet login-recovery-link"
          type="button"
          onClick={() => {
            setValidationError('')
            onClearError()
            setScreen('recover')
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <button
          className="button button--quiet registration-link"
          type="button"
          onClick={() => {
            setValidationError('')
            onClearError()
            setScreen('register')
          }}
        >
          Crear cuenta de cliente
        </button>
        <button
          className="button button--quiet auth-back-link"
          type="button"
          onClick={() => {
            setValidationError('')
            onClearError()
            setScreen('welcome')
          }}
        >
          Volver al inicio
        </button>
      </section>
    )
  } else {
    content = (
      <section className="login-card auth-welcome" aria-labelledby="welcome-title">
        <div className="login-brand-mark" aria-hidden="true">⚡</div>
        <p className="eyebrow">AgendaLetric</p>
        <h1 id="welcome-title">Bienvenido a AgendaLetric</h1>
        <p className="login-description">
          El taller especializado en vehículos eléctricos e híbridos, a un clic de distancia.
        </p>
        <div className="auth-choice-actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setRegistrationMessage('')
              setScreen('login')
            }}
          >
            Iniciar sesión
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setScreen('register')}
          >
            Crear una cuenta
          </button>
        </div>
        <p className="auth-welcome-note">
          Agenda tus mantenimientos y mantente al tanto de cada servicio.
        </p>
      </section>
    )
  }

  return (
    <AuthLayout>{content}</AuthLayout>
  )
}

export default LoginPage
