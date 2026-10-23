import { useState } from 'react'
import './LoginPage.css'

function LoginPage({ error, isSubmitting, onSubmit }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')

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
          Ingresa con tu cuenta para administrar los usuarios del sistema.
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
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validando acceso...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
