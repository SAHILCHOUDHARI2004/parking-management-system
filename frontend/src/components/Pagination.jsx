import { MdChevronLeft, MdChevronRight, MdFirstPage, MdLastPage } from 'react-icons/md'

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-navy-100 px-4 py-4 sm:flex-row sm:px-6">
      <p className="text-sm text-navy-500">
        Showing <span className="font-semibold text-navy-700">{startItem}</span> to{' '}
        <span className="font-semibold text-navy-700">{endItem}</span> of{' '}
        <span className="font-semibold text-navy-700">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn-icon text-navy-500 hover:bg-navy-50 disabled:opacity-30"
          aria-label="First page"
        >
          <MdFirstPage className="h-5 w-5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-icon text-navy-500 hover:bg-navy-50 disabled:opacity-30"
          aria-label="Previous page"
        >
          <MdChevronLeft className="h-5 w-5" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              page === currentPage
                ? 'bg-navy-800 text-white shadow-card'
                : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-icon text-navy-500 hover:bg-navy-50 disabled:opacity-30"
          aria-label="Next page"
        >
          <MdChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn-icon text-navy-500 hover:bg-navy-50 disabled:opacity-30"
          aria-label="Last page"
        >
          <MdLastPage className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
