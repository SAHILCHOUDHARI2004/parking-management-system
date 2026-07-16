"""Apply deployment hardening to databases created by earlier revisions."""

from alembic import op

revision = "82b91f3ea2c4"
down_revision = "224fca431a07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # IF NOT EXISTS keeps this safe after the corrected initial migration while
    # bringing forward databases that used the previous incomplete revision.
    op.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(30)")
    op.execute("UPDATE employees SET vehicle_type = 'Car' WHERE vehicle_type IS NULL")
    op.execute("ALTER TABLE employees ALTER COLUMN vehicle_type SET NOT NULL")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_user_id ON employees (user_id) WHERE user_id IS NOT NULL")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_bookings_active_slot ON bookings (parking_slot_id) WHERE status IN ('Booked', 'Entered')")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_bookings_active_slot")
    op.execute("DROP INDEX IF EXISTS uq_employees_user_id")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS vehicle_type")
