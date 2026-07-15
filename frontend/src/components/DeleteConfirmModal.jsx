import { MdWarningAmber } from 'react-icons/md'
import Modal from './Modal'

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, slotNumber }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Parking Slot" size="sm">
      <div className="flex flex-col items-center py-2 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <MdWarningAmber className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-sm text-navy-600">
          Are you sure you want to delete slot{' '}
          <span className="font-semibold text-navy-900">{slotNumber}</span>? This action cannot be
          undone.
        </p>

        <div className="mt-6 flex w-full justify-center gap-3">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1">
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
