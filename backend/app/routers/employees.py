from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin, require_security
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeOut, EmployeeUpdate

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.get("", response_model=list[EmployeeOut])
def read_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    employees = db.query(Employee).offset(skip).limit(limit).all()
    return employees

@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    # Check if employee_id already exists
    existing = db.query(Employee).filter(Employee.employee_id == employee_in.employee_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID {employee_in.employee_id} already exists"
        )
    
    new_employee = Employee(**employee_in.dict())
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

@router.get("/{employee_id_val}", response_model=EmployeeOut)
def read_employee(
    employee_id_val: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    employee = db.query(Employee).filter(Employee.id == employee_id_val).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee not found"
        )
    return employee

@router.put("/{employee_id_val}", response_model=EmployeeOut)
def update_employee(
    employee_id_val: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    employee = db.query(Employee).filter(Employee.id == employee_id_val).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee not found"
        )
    
    update_data = employee_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
        
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id_val}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id_val: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    employee = db.query(Employee).filter(Employee.id == employee_id_val).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee not found"
        )
    db.delete(employee)
    db.commit()
    return None
