##### Admin Dumps `/admin/dumps` (or Inline Actions)

---

1. **General**

- `401` `dump-unauthorized`: Occurs during creation, update, or deletion when the operating user's role is unauthorized or carries an invalid tier level to initiate a data change request.
- `400` `dump-failed`: Triggered when the underlying administrative tracking framework fails to record, authorize, or queue the requested entity changes.
