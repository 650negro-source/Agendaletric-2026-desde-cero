import { useState } from 'react'
import CustomerRegistrationForm from './CustomerRegistrationForm.jsx'
import './LoginPage.css'

function LoginPage({ error, isSubmitting, onSubmit }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [showRegistration, setShowRegistration] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState('')

  if (showRegistration) {
    return (
      <main className="login-page">
        <CustomerRegistrationForm
          onCancel={() => setShowRegistration(false)}
          onSuccess={(registeredEmail) => {
            setCorreo(registeredEmail)
            setContrasena('')
            setRegistrationMessage('Cuenta creada. Ya puedes iniciar sesión.')
            setShowRegistration(false)
          }}
        />
      </main>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ correo, contrasena })
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">A</div>
        <p className="eyebrow">AgendaLetric</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="login-description">
          Ingresa para continuar según los permisos de tu cuenta.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              autoComplete="username"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete="current-password"
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              required
            />
          </label>
          {registrationMessage && (
            <p className="feedback feedback--success" role="status">{registrationMessage}</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validando acceso...' : 'Entrar'}
          </button>
        </form>
        <button
          className="button button--quiet registration-link"
          type="button"
          onClick={() => {
            setRegistrationMessage('')
            setShowRegistration(true)
          }}
        >
          Crear cuenta de cliente
        </button>
      </section>
    </main>
  )
}

export default LoginPage
