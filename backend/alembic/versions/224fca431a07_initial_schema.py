"""Create the complete deployable parking-management schema."""

from alembic import op
import sqlalchemy as sa

revision = "224fca431a07"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="Employee"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("role IN ('Admin', 'Security', 'Employee')", name="ck_users_role"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.String(50), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("department", sa.String(120)),
        sa.Column("vehicle_number", sa.String(30), nullable=False),
        sa.Column("vehicle_type", sa.String(30), nullable=False),
        sa.Column("contact_details", sa.String(100)),
        sa.Column("aadhaar_number", sa.String(20)),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.UniqueConstraint("employee_id"),
        sa.UniqueConstraint("aadhaar_number"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_employees_employee_id", "employees", ["employee_id"])

    op.create_table(
        "parking_slots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("basement", sa.String(30), nullable=False),
        sa.Column("slot_number", sa.String(50), nullable=False),
        sa.Column("vehicle_type", sa.String(30), nullable=False, server_default="Car"),
        sa.Column("parking_type", sa.String(30), nullable=False, server_default="Employee"),
        sa.Column("allocation_type", sa.String(30), nullable=False, server_default="Employee"),
        sa.Column("camera_number", sa.String(50)),
        sa.Column("puzzle_number", sa.String(50)),
        sa.Column("height", sa.String(30)),
        sa.Column("status", sa.String(20), nullable=False, server_default="Available"),
        sa.CheckConstraint("status IN ('Available', 'Reserved', 'Allocated', 'Maintenance')", name="ck_parking_slots_status"),
        sa.UniqueConstraint("slot_number"),
    )
    op.create_index("ix_parking_slots_slot_number", "parking_slots", ["slot_number"])

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=False),
        sa.Column("parking_slot_id", sa.Integer(), sa.ForeignKey("parking_slots.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="Booked"),
        sa.Column("check_in_time", sa.DateTime(timezone=True)),
        sa.Column("check_out_time", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("status IN ('Booked', 'Entered', 'Exited', 'Cancelled')", name="ck_bookings_status"),
    )
    op.create_index("ix_bookings_active_employee", "bookings", ["employee_id"], unique=True, postgresql_where=sa.text("status IN ('Booked', 'Entered')"))
    op.create_index("ix_bookings_active_slot", "bookings", ["parking_slot_id"], unique=True, postgresql_where=sa.text("status IN ('Booked', 'Entered')"))

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("booking_id", sa.Integer(), sa.ForeignKey("bookings.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("performed_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("details", sa.String()),
    )
    op.create_index("ix_audit_logs_id", "audit_logs", ["id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("bookings")
    op.drop_table("parking_slots")
    op.drop_table("employees")
    op.drop_table("users")
