import { useMemo, useState } from 'react';
import { FaDownload, FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader.jsx';
import { addEmployee, getEmployeeValue, useEmployees } from '../utils/employeeStorage.js';

const tableColumns = [
  { label: 'Employee ID', key: 'employeeId' },
  { label: 'Employee Name', key: 'employeeName' },
  { label: 'Mobile Number', key: 'mobileNumber' },
  { label: 'Aadhaar Number', key: 'aadhaarNumber' },
  { label: 'Vehicle Number', key: 'vehicleNumber' },
  { label: 'Vehicle Type', key: 'vehicleType' },
  { label: 'Department', key: 'department' },
];

// Vehicle Type must match the parking slot's vehicleSlotType values exactly
// so slot filtering (Reserved Parking dialog) works reliably.
const vehicleTypeOptions = ['Sedan', 'CSUV'];

const initialFormState = {
  employeeId: '',
  employeeName: '',
  mobileNumber: '',
  aadhaarNumber: '',
  vehicleNumber: '',
  vehicleType: '',
  department: '',
};

function downloadCsv(rows) {
  const header = tableColumns.map((column) => column.label);
  const csvRows = rows.map((employee) =>
    tableColumns.map((column) => {
      const value = String(getEmployeeValue(employee, column.key) ?? '');
      return `"${value.replaceAll('"', '""')}"`;
    }).join(','),
  );
  const csvContent = [header.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'employee-master.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function validateEmployee(formData, employees) {
  const errors = {};

  tableColumns.forEach((column) => {
    if (!formData[column.key].trim()) {
      errors[column.key] = `${column.label} is required`;
    }
  });

  const isDuplicateId = employees.some(
    (employee) => getEmployeeValue(employee, 'employeeId').toLowerCase() === formData.employeeId.trim().toLowerCase(),
  );

  if (isDuplicateId) {
    errors.employeeId = 'Employee ID already exists';
  }

  return errors;
}

export default function EmployeeMaster() {
  const employees = useEmployees();
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return employees;
    }

    return employees.filter((employee) => {
      const searchable = [
        getEmployeeValue(employee, 'employeeId'),
        getEmployeeValue(employee, 'employeeName'),
        getEmployeeValue(employee, 'mobileNumber'),
        getEmployeeValue(employee, 'vehicleNumber'),
        getEmployeeValue(employee, 'vehicleType'),
        getEmployeeValue(employee, 'department'),
      ].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [employees, query]);

  const hasEmployeeData = employees.length > 0;
  const hasFilteredData = filteredEmployees.length > 0;

  const handleFormChange = (key, value) => {
    setFormData((currentFormData) => ({ ...currentFormData, [key]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [key]: '' }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value.trim()]),
    );
    const validationErrors = validateEmployee(trimmedFormData, employees);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    addEmployee(trimmedFormData);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Employee Master"
        description="Manage employee parking eligibility, contact details, vehicle mapping, and department-level parking records."
        actions={
          <>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasEmployeeData}
              onClick={() => downloadCsv(filteredEmployees)}
              title={hasEmployeeData ? 'Export employee records' : 'No data available'}
              type="button"
            >
              <FaDownload />
              Export
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <FaPlus />
              Add Employee
            </button>
          </>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-teal-600 focus-within:bg-white">
          <FaSearch className="shrink-0 text-slate-400" />
          <input
            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
            placeholder="Search employee ID, name, mobile, vehicle number, vehicle type, department..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Employee Records</h2>
              <p className="text-sm text-slate-500">
                {hasEmployeeData ? `${filteredEmployees.length} records found` : 'No data available'}
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Browser localStorage
            </span>
          </div>
        </div>

        <div className="scrollbar-thin overflow-x-auto">
          <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                {tableColumns.map((column) => (
                  <th key={column.key} className="px-4 py-4 font-bold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hasFilteredData ? (
                filteredEmployees.map((employee, index) => (
                  <tr key={getEmployeeValue(employee, 'employeeId') || index} className="hover:bg-slate-50">
                    {tableColumns.map((column) => (
                      <td key={column.key} className="px-4 py-4 text-slate-700">
                        {getEmployeeValue(employee, column.key) || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableColumns.length} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                    No employee records found. Employee data will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Employee Master</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Add Employee</h2>
                <p className="mt-1 text-sm text-slate-500">Employee details will be saved in browser localStorage.</p>
              </div>
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                onClick={closeModal}
                type="button"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {tableColumns.map((column) => (
                  <label key={column.key} className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      {column.label}
                      {['employeeName', 'vehicleNumber', 'vehicleType'].includes(column.key) && (
                        <span className="ml-1 text-rose-500">*</span>
                      )}
                    </span>

                    {column.key === 'vehicleType' ? (
                      <select
                        className={`mt-2 w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:bg-white ${
                          errors[column.key] ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-teal-600'
                        }`}
                        value={formData.vehicleType}
                        onChange={(event) => handleFormChange('vehicleType', event.target.value)}
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={`mt-2 w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:bg-white ${
                          errors[column.key] ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-teal-600'
                        }`}
                        value={formData[column.key]}
                        onChange={(event) => handleFormChange(column.key, event.target.value)}
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                      />
                    )}

                    {errors[column.key] ? (
                      <span className="mt-1 block text-xs font-semibold text-rose-600">{errors[column.key]}</span>
                    ) : null}
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-800"
                  type="submit"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
