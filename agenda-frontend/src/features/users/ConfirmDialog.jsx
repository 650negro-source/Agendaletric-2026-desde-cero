function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmingLabel = 'Eliminando...',
  isConfirming,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="button button--secondary" type="button" onClick={onCancel} disabled={isConfirming}>
            Cancelar
          </button>
          <button className="button button--danger" type="button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
