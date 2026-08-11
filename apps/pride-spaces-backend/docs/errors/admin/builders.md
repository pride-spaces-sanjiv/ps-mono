##### Builders `/admin/builders`

---

1. **General**

- `404` `builder-not-found`: Returned when a specific builder from some query does not exist in the database for retrieval, update, deletion, or password modifications.
- `400` `builder-unique-error`: Occurs during creation or updates when an entered value violates a unique constraint (such as duplicate emails) within the database schema.

2. **GET** `/`

- `400` `get-builders-error`: Occurs when the paginated results query fails to execute properly during the retrieval of the builders list.
- `400` `get-builders-error-failure`: A generic catch-all error triggered when an unexpected server exception occurs while fetching multiple builder records.

3. **GET** `/:id`

- `400` `get-builder-error-failure`: Triggered when an unexpected exception occurs while attempting to fetch a specific builder's details by its ID.

4. **POST** `/`

- `400` `create-builder-error-failure`: A generic catch-all error for failures during the builder creation process that are not handled by the specialized Mongoose error processor.

5. **PUT** `/:id`

- `400` `update-builder-error-failure`: A generic catch-all error for failures during the builder record update process that are not handled by the specialized Mongoose error processor.

6. **DELETE** `/:id`

- `400` `delete-builder-error-failure`: Triggered when an unexpected exception occurs while attempting to delete a builder record or queue its removal from the database.

7. **GET** `/:id/password`

- `400` `get-builder-password-error-failure`: Triggered when an unexpected server exception occurs while fetching and decoding a builder's credentials.

8. **PUT** `/:id/password`

- `400` `password-matched`: Returned when a user attempts to update a builder's credential but the new password matches the currently stored password.
- `400` `update-builder-password-error-failure`: A catch-all error for failures encountered while attempting to update and encode a builder's password.
