import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const keys = {
  employeeId: ['employeeId'],
  employeeName: ['employeeName'],
  mobileNumber: ['mobileNumber'],
  aadhaarNumber: ['aadhaarNumber'],
  vehicleNumber: ['vehicleNumber'],
  department: ['department']
};

export function getEmployeeValue(employee, key) {
  return keys[key]?.find((name) => employee[name] !== undefined) ? employee[key] : '';
}

function mapEmployee(item) {
  return {
    id: item.id,
    employeeId: item.employee_id,
    employeeName: item.name,
    mobileNumber: item.contact_details || '',
    aadhaarNumber: item.aadhaar_number || '',
    vehicleNumber: item.vehicle_number,
    department: item.department || ''
  };
}

export async function addEmployee(employee) {
  return mapEmployee(
    await api('/api/employees', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: employee.employeeId,
        name: employee.employeeName,
        vehicle_number: employee.vehicleNumber,
        department: employee.department || null,
        contact_details: employee.mobileNumber || null,
        aadhaar_number: employee.aadhaarNumber || null
      })
    })
  );
}

export function useEmployees(enabled = true) {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api('/api/employees');
      // If backend returns a paginated list or plain list, support both
      const list = Array.isArray(data) ? data : (data.items || []);
      setEmployees(list.map(mapEmployee));
      setError('');
    } catch (e) {
      setError(e.message || 'Unable to load employee details');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      refresh();
    } else {
      setIsLoading(false);
    }
  }, [refresh, enabled]);

  return { employees, error, isLoading, refresh };
}

