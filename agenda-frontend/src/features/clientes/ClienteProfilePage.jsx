import { useCallback, useEffect, useState } from 'react'
import {
  createMyCustomer,
  getMyCustomer,
  updateMyCustomer,
} from '../../services/customerService.js'
import ClienteForm from './ClienteForm.jsx'
import './ClientesPage.css'
import '../users/ConfirmDialog.css'
import '../users/UserForm.css'
import '../users/UsersPage.css'

function ClienteProfilePage({ session, onProfileUpdated }) {
  const [cliente, setCliente] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [profileMissing, setProfileMissing] = useState(false)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    setProfileMissing(false)
    try {
      setCliente(await getMyCustomer(session.token))
      setProfileMissing(false)
    } catch (error) {
      if (error.status === 404) {
        setCliente(null)
        setProfileMissing(true)
      } else {
        setPageError(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    let isCurrent = true
    getMyCustomer(session.token)
      .then((profile) => {
        if (isCurrent) {
          setCliente(profile)
          setProfileMissing(false)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          if (error.status === 404) {
            setCliente(null)
            setProfileMissing(true)
          } else {
            setPageError(error.message)
          }
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [session.token])

  async function handleSave(customerData) {
    setPageError('')
    setSuccessMessage('')
    const updatedProfile = profileMissing
      ? await createMyCustomer(session.token, customerData)
      : await updateMyCustomer(session.token, customerData)
    setCliente(updatedProfile)
    setProfileMissing(false)
    onProfileUpdated(updatedProfile)
    setIsEditing(false)
    setSuccessMessage(
      profileMissing
        ? 'Tu perfil se creó correctamente. Ya puedes registrar vehículos y solicitar citas.'
        : 'Tus datos se actualizaron correctamente.'
    )
  }

  return (
    <main className="users-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">Cuenta de cliente</p>
          <h1>Mi perfil</h1>
          <p className="users-subtitle">Consulta y actualiza tus datos de contacto.</p>
        </div>
        {cliente && !isEditing && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setSuccessMessage('')
              setIsEditing(true)
            }}
          >
            Editar perfil
          </button>
        )}
      </div>

      {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
      {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}
      {isLoading ? (
        <p className="users-state" role="status">Cargando perfil...</p>
      ) : cliente && isEditing ? (
        <section className="users-card client-profile-card" aria-label="Editar perfil">
          <ClienteForm
            cliente={cliente}
            onCancel={() => setIsEditing(false)}
            onSubmit={handleSave}
          />
        </section>
      ) : profileMissing ? (
        <section className="users-card client-profile-card" aria-label="Completar perfil">
          <h2>Completa tu perfil de cliente</h2>
          <p>
            Esta cuenta antigua no tiene un perfil asociado. Completa tus datos para
            habilitar tus vehículos y citas.
          </p>
          <ClienteForm
            cliente={{
              nombre_completo: session.user.nombre,
              correo: session.user.correo,
            }}
            onSubmit={handleSave}
            submitLabel="Completar perfil"
          />
        </section>
      ) : cliente ? (
        <section className="users-card client-profile-card" aria-label="Datos del perfil">
          <dl className="client-summary-grid">
            <div><dt>Nombre completo</dt><dd>{cliente.nombre_completo}</dd></div>
            <div><dt>Cédula</dt><dd>{cliente.documento_identidad}</dd></div>
            <div><dt>Celular</dt><dd>{cliente.telefono}</dd></div>
            <div><dt>Correo</dt><dd>{cliente.correo}</dd></div>
            <div><dt>Dirección</dt><dd>{cliente.direccion || 'No registrada'}</dd></div>
          </dl>
        </section>
      ) : (
        <section className="notice-card">
          <h2>No se encontró tu perfil de cliente</h2>
          <p>La cuenta no tiene un perfil asociado. Intenta cargarlo de nuevo o contacta a administración.</p>
          <button className="button button--secondary" type="button" onClick={() => void loadProfile()}>
            Reintentar
          </button>
        </section>
      )}
    </main>
  )
}

export default ClienteProfilePage
