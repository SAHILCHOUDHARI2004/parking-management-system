import { useEffect, useState } from 'react';

export const EMPLOYEE_STORAGE_KEY = 'parking-management-employees';
export const EMPLOYEE_STORAGE_EVENT = 'parking-management-employees-updated';

const fallbackKeys = {
  employeeId: ['employeeId', 'employeeID', 'Employee ID', 'EmployeeID'],
  employeeName: ['employeeName', 'name', 'Employee Name', 'EmployeeName'],
  mobileNumber: ['mobileNumber', 'mobile', 'Mobile Number', 'MobileNumber'],
  aadhaarNumber: ['aadhaarNumber', 'aadhaar', 'Aadhaar Number', 'AadhaarNumber'],
  vehicleNumber: ['vehicleNumber', 'vehicleNo', 'Vehicle Number', 'VehicleNumber'],
  vehicleType: ['vehicleType', 'vehicleSlotType', 'Vehicle Type', 'VehicleType'],
  department: ['department', 'Department'],
};

export function getEmployeeValue(employee, key) {
  const matchingKey = fallbackKeys[key].find((possibleKey) => employee[possibleKey] !== undefined);
  return matchingKey ? employee[matchingKey] : '';
}

export function normalizeEmployee(employee) {
  return {
    employeeId: String(getEmployeeValue(employee, 'employeeId') ?? '').trim(),
    employeeName: String(getEmployeeValue(employee, 'employeeName') ?? '').trim(),
    mobileNumber: String(getEmployeeValue(employee, 'mobileNumber') ?? '').trim(),
    aadhaarNumber: String(getEmployeeValue(employee, 'aadhaarNumber') ?? '').trim(),
    vehicleNumber: String(getEmployeeValue(employee, 'vehicleNumber') ?? '').trim(),
    vehicleType: String(getEmployeeValue(employee, 'vehicleType') ?? '').trim(),
    department: String(getEmployeeValue(employee, 'department') ?? '').trim(),
  };
}

export function readEmployees() {
  try {
    const storedEmployees = window.localStorage.getItem(EMPLOYEE_STORAGE_KEY);
    const parsedEmployees = storedEmployees ? JSON.parse(storedEmployees) : [];

    return Array.isArray(parsedEmployees) ? parsedEmployees.map(normalizeEmployee) : [];
  } catch {
    return [];
  }
}

export function writeEmployees(employees) {
  const normalizedEmployees = employees.map(normalizeEmployee);

  window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(normalizedEmployees));
  window.dispatchEvent(new CustomEvent(EMPLOYEE_STORAGE_EVENT, { detail: normalizedEmployees }));

  return normalizedEmployees;
}

export function addEmployee(employee) {
  const employees = readEmployees();
  return writeEmployees([...employees, normalizeEmployee(employee)]);
}

export function useEmployees() {
  const [employees, setEmployees] = useState(() => readEmployees());

  useEffect(() => {
    const syncEmployees = () => setEmployees(readEmployees());

    window.addEventListener('storage', syncEmployees);
    window.addEventListener(EMPLOYEE_STORAGE_EVENT, syncEmployees);

    return () => {
      window.removeEventListener('storage', syncEmployees);
      window.removeEventListener(EMPLOYEE_STORAGE_EVENT, syncEmployees);
    };
  }, []);

  return employees;
}
