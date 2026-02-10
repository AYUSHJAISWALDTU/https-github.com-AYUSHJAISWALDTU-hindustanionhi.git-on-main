/**
 * Confirmation modal — used for delete actions
 */
export default function ConfirmModal({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'Confirm Action'}</h3>
        </div>
        <div className="modal-body">
          <p>{message || 'Are you sure you want to proceed?'}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
