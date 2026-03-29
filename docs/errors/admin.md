### Admin APIs error codes

##### Base Route `/admins`

---

##### Admins `/admins`

---

1. **General**

- `404` `admin-not-found`: Returned when a specific admin ID provided in the request parameters does not exist in the database for retrieval or update operations.

2. **GET** `/`

- `400` `get-admins-error`: Occurs when the paginated results query fails to execute properly during the retrieval of the admin list.
- `400` `get-admins-error-failure`: A generic catch-all error triggered when an unexpected exception occurs during the process of fetching multiple admin records.
- `404` `admins-not-found`: Returned when the request for the admin list is successful but the database contains no records matching the criteria.

3. **GET** `/:id`

- `400` `get-admin-error-failure`: Triggered when an unexpected exception occurs while attempting to fetch a specific admin's details by their ID.

4. **POST** `/`

- `400` `create-admin-error-failure`: A generic catch-all error for failures during the admin creation process that are not caught by the Mongoose error handler.

5. **PUT** `/:id`

- `400` `update-admin-error-failure`: A generic catch-all error for failures during the admin update process that are not caught by the Mongoose error handler.

6. **POST/PUT**

- `400` `admin-unique-error`: Occurs during creation or updates when a value (like an email or username) violates a unique constraint.

7. **GET** `/:id/password`

- `400` `password-fetch-error-failure`: Triggered when an unexpected exception occurs during the retrieval or decryption of the admin's password.

8. **PUT** `/:id/password`

- `400` `admin-same-password`: Returned when the new password provided in the request body is identical to the current password stored in the database.
- `400` `password-change-error-failure`: A generic catch-all error triggered when an unexpected exception occurs during the encryption or updating of the admin's password.

---

##### Amenities `/amenities`

---

1. **General**

- `404` `amenity-not-found`: Returned when a specific amenity ID provided in the request parameters does not exist for retrieval, update, or deletion.

2. **GET** `/`

- `400` `get-amenities-error`: Occurs when the paginated results query fails to execute properly during retrieval.
- `400` `get-amenities-error-failure`: A generic catch-all error triggered when an unexpected exception occurs during the fetching process.
- `404` `amenities-not-found`: Returned when the request for the amenities list is successful but no records match the criteria.

3. **GET** `/:id`

- `400` `get-amenity-error-failure`: Triggered when an unexpected exception occurs while attempting to fetch a specific amenity's details.

4. **POST** `/`

- `400` `create-amenity-error-failure`: A generic catch-all error for failures during the creation process not caught by the Mongoose handler.

5. **PUT** `/:id`

- `400` `update-amenity-error-failure`: A generic catch-all error for failures during the update process not caught by the Mongoose handler.

6. **DELETE** `/:id`

- `400` `delete-amenity-error-failure`: Triggered when an unexpected exception occurs while attempting to delete an amenity record.

7. **POST/PUT**

- `400` `amenity-unique-error`: Occurs during creation or updates when a value violates a unique database constraint.

---

##### Login `/auth`

---

1. **General**

- `404` `admin-not-found`: Returned when no account exists with the provided email address.

2. **POST** `/login`

- `401` `admin-invalid-credentials`: Returned when the provided password does not match the stored encrypted password for the admin account.
- `400` `login-error`: A generic catch-all error triggered when an unexpected exception occurs during the authentication, token generation, or session saving process.

---

##### Operators `/operators`

---

1. **General**

- `404` `operator-not-found`: Returned when a specific operator ID provided in the request parameters does not exist in the database for retrieval, update, or deletion.

2. **GET** `/`

- `400` `get-operators-error`: Occurs when the paginated results query fails to execute properly during the retrieval of the operator list.
- `400` `get-operators-error-failure`: A generic catch-all error triggered when an unexpected exception occurs during the process of fetching multiple operator records.
- `404` `operators-not-found`: Returned when the request for the operators list is successful but the database contains no records matching the criteria.

3. **GET** `/:id`

- `400` `get-operator-error-failure`: Triggered when an unexpected exception occurs while attempting to fetch a specific operator's details by their ID.

4. **POST** `/`

- `400` `create-operator-error-failure`: A generic catch-all error for failures during the operator creation process that are not caught by the Mongoose error handler.

5. **PUT** `/:id`

- `400` `update-operator-error-failure`: A generic catch-all error for failures during the operator update process that are not caught by the Mongoose error handler.

6. **DELETE** `/:id`

- `400` `delete-operator-error-failure`: Triggered when an unexpected exception occurs while attempting to delete an operator record from the database.

7. **POST/PUT**

- `400` `operator-unique-error`: Occurs during creation or updates when a value (like an email or username) violates a unique constraint in the database.

---

##### Spaces `/spaces`

---

1. **General**

- `404` `space-not-found`: Returned when a specific space ID provided in the request parameters does not exist in the database for retrieval, update, or deletion.

2. **GET** `/`

- `400` `get-spaces-error`: Occurs when the paginated results query fails to execute properly during the retrieval of the spaces list.
- `400` `get-spaces-error-failure`: A generic catch-all error triggered when an unexpected exception occurs during the process of fetching multiple space records.
- `404` `spaces-not-found`: Returned when the request for the spaces list is successful but the database contains no records matching the filters.

3. **GET** `/:id`

- `400` `get-space-error-failure`: Triggered when an unexpected exception occurs while attempting to fetch a specific space's details by its ID.

4. **POST** `/`

- `400` `create-user-error-failure`: A generic catch-all error for failures during the space creation process that are not caught by the Mongoose error handler.

5. **PUT** `/:id`

- `400` `update-space-error-failure`: A generic catch-all error for failures during the space update process that are not caught by the Mongoose error handler.

6. **DELETE** `/:id`

- `400` `delete-space-error-failure`: Triggered when an unexpected exception occurs while attempting to delete a space record from the database.

7. **POST/PUT**

- `400` `space-unique-error`: Occurs during creation or updates when a value violates a unique constraint in the database schema.

---
