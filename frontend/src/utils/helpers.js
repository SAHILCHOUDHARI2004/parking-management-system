/**
 * Utility helpers for the Parking Management System.
 * Pure functions only — no side effects, no React dependencies.
 */

/**
 * Calculate dashboard statistics dynamically from the parking data set.
 * @param {Array} data - Array of parking slot records
 * @returns {Object} computed statistics
 */
export function calculateStats(data = []) {
  const totalSlots = data.length
  const employeeSlots = data.filter((d) => d.allocation === 'Employee').length
  const visitorSlots = data.filter((d) => d.allocation === 'Visitor').length
  const reservedSlots = data.filter((d) => d.allocation === 'Reserved').length
  const vacantSlots = data.filter((d) => d.allocation === 'Vacant').length
  const sedanSlots = data.filter((d) => d.vehicleSlotType === 'Sedan').length
  const csuvSlots = data.filter((d) => d.vehicleSlotType === 'CSUV').length
  const puzzleSlots = data.filter((d) => d.parkingType === 'Puzzle').length
  const stackSlots = data.filter((d) => d.parkingType === 'Stack').length
  const openSlots = data.filter((d) => d.parkingType === 'Open').length

  return {
    totalSlots,
    employeeSlots,
    visitorSlots,
    reservedSlots,
    vacantSlots,
    sedanSlots,
    csuvSlots,
    puzzleSlots,
    stackSlots,
    openSlots,
    occupancyRate: totalSlots ? Math.round(((totalSlots - vacantSlots) / totalSlots) * 100) : 0,
  }
}

/**
 * Group slot count by basement — used for the parking overview panel.
 */
export function groupByBasement(data = []) {
  const map = {}
  data.forEach((item) => {
    if (!map[item.basement]) {
      map[item.basement] = { total: 0, vacant: 0, occupied: 0 }
    }
    map[item.basement].total += 1
    if (item.allocation === 'Vacant') {
      map[item.basement].vacant += 1
    } else {
      map[item.basement].occupied += 1
    }
  })
  return Object.entries(map).map(([basement, values]) => ({ basement, ...values }))
}

/**
 * Return a Tailwind color class pairing for a given allocation status.
 */
export function getAllocationColor(allocation) {
  switch (allocation) {
    case 'Employee':
      return { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', ring: 'ring-teal-200' }
    case 'Visitor':
      return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-200' }
    case 'Reserved':
      return { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', ring: 'ring-violet-200' }
    case 'Vacant':
      return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', ring: 'ring-slate-200' }
    default:
      return { bg: 'bg-navy-50', text: 'text-navy-700', dot: 'bg-navy-500', ring: 'ring-navy-200' }
  }
}

/**
 * Return a Tailwind color class for a given parking type badge.
 */
export function getParkingTypeColor(parkingType) {
  switch (parkingType) {
    case 'Puzzle':
      return 'bg-indigo-50 text-indigo-700'
    case 'Stack':
      return 'bg-cyan-50 text-cyan-700'
    case 'Open':
      return 'bg-emerald-50 text-emerald-700'
    default:
      return 'bg-navy-50 text-navy-700'
  }
}

/**
 * Simple debounce utility for search inputs.
 */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Paginate an array of items.
 */
export function paginate(items, currentPage, pageSize) {
  const start = (currentPage - 1) * pageSize
  return items.slice(start, start + pageSize)
}
