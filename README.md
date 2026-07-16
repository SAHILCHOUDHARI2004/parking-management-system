# Parking Management System

React/Vite frontend with a FastAPI and PostgreSQL backend for booking, entry, and exit of employee vehicles.

## Deployment

The API requires `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, and `BOOTSTRAP_ADMIN_TOKEN` in `backend/.env`. In production also set `COOKIE_SECURE=true` and use HTTPS. Apply the schema before starting the service:

```powershell
npm run install:all
npm run db:migrate
```

Create the one initial administrator once, then remove `BOOTSTRAP_ADMIN_TOKEN` from the running environment:

```http
POST /api/auth/register
X-Bootstrap-Token: <BOOTSTRAP_ADMIN_TOKEN>
Content-Type: application/json
```

The bootstrap endpoint creates an Admin only while the users table is empty. All later account creation should be controlled through an authenticated administrative workflow.

## Vehicle gate API

The booking is the source of truth for vehicle number, employee, and parking slot. Therefore, an entry or exit request only needs the `bookingId` in its URL. Do not send a vehicle number, slot, or timestamp from the browser: the API gets those from the booking and records the server time, which avoids incorrect or tampered gate records.

Both endpoints require an authenticated user with the `Admin` or `Security` role.

| Gate event | HTTP request | Request body | Successful result |
| --- | --- | --- | --- |
| Vehicle entered | `PATCH /api/bookings/{bookingId}/enter` | None | Changes booking from `Booked` to `Entered`, saves `check_in_time`, and marks its slot `Allocated`. |
| Vehicle exited | `PATCH /api/bookings/{bookingId}/exit` | None | Changes booking from `Entered` to `Exited`, saves `check_out_time`, and makes its slot `Available`. |

Send the access token in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

Example calls:

```js
await api(`/api/bookings/${bookingId}/enter`, { method: 'PATCH' });
await api(`/api/bookings/${bookingId}/exit`, { method: 'PATCH' });
```

The API response contains the updated booking record:

```json
{
  "id": 42,
  "employee_id": 7,
  "parking_slot_id": 18,
  "status": "Entered",
  "check_in_time": "2026-07-15T10:25:31.123Z",
  "check_out_time": null,
  "created_at": "2026-07-15T08:00:00Z"
}
```

For a number-plate reader or gate device, first locate the active booking through `GET /api/bookings?search=<vehicle-number>`, then use its `id` for the entry/exit call. The system also stores an audit record with employee ID, employee name, vehicle number, slot number, and basement for every entry and exit.

## Project layout

- `frontend/` — React 19, Vite, Tailwind CSS
- `backend/` — Python FastAPI, SQLAlchemy, PostgreSQL

The FastAPI interactive API documentation is available at `/docs` while the backend is running.
