function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <aside className="auth-promo">
        <div className="auth-brand" aria-label="AgendaLetric">
          <span className="auth-brand-mark" aria-hidden="true">⚡</span>
          <strong>AgendaLetric</strong>
        </div>

        <div className="auth-promo-copy">
          <h2>Agenda fácilmente el servicio eléctrico y electrónico de tu vehículo</h2>
          <p>
            Programa mantenimientos, sigue el estado de tus citas y recibe
            recordatorios, todo desde un mismo lugar.
          </p>
        </div>

        <p className="auth-promo-note">
          Atención especializada para vehículos eléctricos e híbridos.
        </p>
      </aside>

      <section className="auth-panel" aria-label="Acceso a AgendaLetric">
        {children}
      </section>
    </main>
  )
}

export default AuthLayout
