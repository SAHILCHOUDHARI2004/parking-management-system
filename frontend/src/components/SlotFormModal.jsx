import { useState, useEffect } from 'react'
import Modal from './Modal'

const emptySlot = {
  basement: 'B1',
  cameraNumber: '',
  puzzleNumber: '',
  slotNumber: '',
  vehicleSlotType: 'Sedan',
  parkingType: 'Employee',
  height: '1.8m',
  allocation: 'Available',
}

export default function SlotFormModal({ isOpen, onClose, onSubmit, initialData, mode = 'add' }) {
  const [formData, setFormData] = useState(emptySlot)
  const isViewMode = mode === 'view'

  useEffect(() => {
    if (initialData) {
      // Merge over emptySlot so older records missing `status` still get a
      // sane default instead of an undefined/uncontrolled select value.
      setFormData({ ...emptySlot, ...initialData })
    } else {
      setFormData(emptySlot)
    }
  }, [initialData, isOpen])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const titles = {
    add: 'Add New Parking Slot',
    edit: 'Edit Parking Slot',
    view: 'Parking Slot Details',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[mode]} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Basement">
            <select
              disabled={isViewMode}
              value={formData.basement}
              onChange={(e) => handleChange('basement', e.target.value)}
              className="input-field disabled:bg-navy-50"
            >
              {['B1', 'B2', 'B3'].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Camera Number">
            <input
              disabled={isViewMode}
              required
              value={formData.cameraNumber}
              onChange={(e) => handleChange('cameraNumber', e.target.value)}
              placeholder="B1-C01"
              className="input-field disabled:bg-navy-50"
            />
          </Field>

          <Field label="Puzzle Number">
            <input
              disabled={isViewMode}
              value={formData.puzzleNumber}
              onChange={(e) => handleChange('puzzleNumber', e.target.value)}
              placeholder="B1-P01 or -"
              className="input-field disabled:bg-navy-50"
            />
          </Field>

          <Field label="Slot Number">
            <input
              disabled={isViewMode}
              required
              value={formData.slotNumber}
              onChange={(e) => handleChange('slotNumber', e.target.value)}
              placeholder="B1-P01-S1"
              className="input-field disabled:bg-navy-50"
            />
          </Field>

          <Field label="Vehicle Slot Type">
            <select
              disabled={isViewMode}
              value={formData.vehicleSlotType}
              onChange={(e) => handleChange('vehicleSlotType', e.target.value)}
              className="input-field disabled:bg-navy-50"
            >
              {['Sedan', 'CSUV'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Parking Type">
            <select
              disabled={isViewMode}
              value={formData.parkingType}
              onChange={(e) => handleChange('parkingType', e.target.value)}
              className="input-field disabled:bg-navy-50"
            >
              {['Employee', 'Visitor', 'Puzzle', 'Stack'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Height">
            <input
              disabled={isViewMode}
              required
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              placeholder="2m"
              className="input-field disabled:bg-navy-50"
            />
          </Field>

          <Field label="Allocation">
            <select
              disabled={isViewMode}
              value={formData.allocation}
              onChange={(e) => handleChange('allocation', e.target.value)}
              className="input-field disabled:bg-navy-50"
            >
              {['Available', 'Maintenance'].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-navy-100 pt-5">
          <button type="button" onClick={onClose} className="btn-outline">
            {isViewMode ? 'Close' : 'Cancel'}
          </button>
          {!isViewMode && (
            <button type="submit" className="btn-teal">
              {mode === 'add' ? 'Add Slot' : 'Save Changes'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy-700">{label}</label>
      {children}
    </div>
  )
}
