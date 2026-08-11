# Admin Builder API

Base path: `/admin/builder`

---

## GET `/admins/builder`

Get a paginated list of all builders.

### Query Parameters

| Parameter | Type     | Required | Description                                           |
| --------- | -------- | -------- | ----------------------------------------------------- |
| `page`    | `number` | No       | Page number for pagination (default: 1)               |
| `limit`   | `number` | No       | Number of results per page (default: 10)              |
| `fields`  | `string` | No       | Comma-separated list of fields to include in response |
| `name`    | `string` | No       | Filter by builder name                                |
| `email`   | `string` | No       | Filter by builder email                               |
| `search`  | `string` | No       | Search across name and email fields                   |

### Response

Returns paginated builders with `totalSpaces` count from related spaces.

---

## GET `/admins/builder/:id`

Get details of a specific builder by ID.

### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

### Query Parameters

| Parameter | Type     | Required | Description                                           |
| --------- | -------- | -------- | ----------------------------------------------------- |
| `fields`  | `string` | No       | Comma-separated list of fields to include in response |

### Response

Returns builder details including `totalSpaces` count.

---

## POST /admins/builder

Create a new builder.

### Body

| Field                   | Type      | Required | Description                                                               |
| ----------------------- | --------- | -------- | ------------------------------------------------------------------------- |
| `name`                  | `string`  | Yes      | Builder's official name (minimum 4 characters, alphanumeric with hyphens) |
| `email`                 | `string`  | Yes      | Unique and valid email address for the builder                            |
| `password`              | `string`  | Yes      | Secure password (minimum 4 characters, requires lowercase, uppercase, number, and symbol) |
| `slug`                  | `string`  | Yes      | URL-friendly identifier for the builder (auto-lowercased, hyphens allowed) |
| `brandName`             | `string`  | Yes      | Display name of the builder's brand (minimum 4 characters, alphanumeric with hyphens) |
| `gstNo`                 | `string`  | Yes      | 15-character Goods and Services Tax identification number                 |
| `cinNo`                 | `string`  | No       | Corporate Identification Number (no spaces allowed)                       |
| `headquarter`           | `object`  | Yes      | Information about the builder's primary headquarters                      |
| `headquarter.address`   | `string`  | Yes      | Full physical address of the headquarters                                 |
| `headquarter.contactNo` | `string`  | Yes      | Valid phone number for headquarters contact                               |
| `branches`              | `array`   | No       | List of associated branch offices                                         |
| `branches[].code`       | `string`  | No       | State code for the branch location                                        |
| `branches[].name`       | `string`  | No       | Name of the branch office                                                 |
| `branches[].address`    | `string`  | No       | Full physical address of the branch                                       |
| `branches[].city`       | `string`  | No       | City where the branch is located                                          |
| `branches[].gstNo`      | `string`  | No       | 15-character GST number for the branch                                    |
| `branches[].postalCode` | `string`  | No       | Postal code of the branch (minimum 3 alphanumeric characters)             |
| `branches[].person`     | `object`  | No       | Contact person details for this branch                                    |
| `branches[].isPrimary`  | `boolean` | No       | Indicates if this is the primary branch (default: `false`)                |
| `isActive`              | `boolean` | No       | Status indicating whether the builder is active (default: `true`)         |

### Branch Person Object (nested)

| Field       | Type     | Required | Description                         |
| ----------- | -------- | -------- | ----------------------------------- |
| `name`      | `string` | No       | Full name of the contact person     |
| `email`     | `string` | No       | Email address of the contact person |
| `contactNo` | `string` | No       | Phone number of the contact person  |
| `role`      | `string` | No       | Role of the contact person at the branch |

### Response

Returns the newly created builder object.

---

## PUT `/admins/builder/:id`

Update an existing builder's details (excludes password).

### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

### Body

All fields are optional. Same structure as POST, excluding `password`.

| Field         | Type      | Required | Description                                           |
| ------------- | --------- | -------- | ----------------------------------------------------- |
| `name`        | `string`  | No       | Builder's official name                               |
| `email`       | `string`  | No       | Valid email address                                   |
| `slug`        | `string`  | No       | URL-friendly identifier for the builder               |
| `brandName`   | `string`  | No       | Display name of the builder's brand                   |
| `gstNo`       | `string`  | No       | 15-character Goods and Services Tax identification number |
| `cinNo`       | `string`  | No       | Corporate Identification Number                       |
| `headquarter` | `object`  | No       | Updated headquarters information                      |
| `branches`    | `array`   | No       | List of updated branch objects                        |
| `isActive`    | `boolean` | No       | Status indicating whether the builder is active       |

### Response

Returns the updated builder object.

---

## DELETE `/admins/builder/:id`

Delete a builder by ID.

### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

### Response

Returns a confirmation message and the ID of the deleted builder.

---

## GET `/admins/builder/:id/password`

Retrieve the decoded password of a builder (admin only, excludes support level).

### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

### Authorization

Requires admin level: `super-admin`, `admin`, or `builder` (not `support`).

### Response

Returns builder data including the `decodedPassword` field.

---

## PUT `/admins/builder/:id/password`

Update the password of a builder (admin only, excludes support level).

### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

### Authorization

Requires admin level: `super-admin`, `admin`, or `builder` (not `support`).

### Body

| Field      | Type     | Required | Description                                                               |
| ---------- | -------- | -------- | ------------------------------------------------------------------------- |
| `password` | `string` | Yes      | New password (minimum 4 characters, requires lowercase, uppercase, number, and symbol) |

### Validation

- The new password provided cannot be the same as the current password.

### Response

Returns a confirmation message upon successful password update.

---

## Error Types

| Error Type               | Status Code | Description                                                                   |
| ------------------------ | ----------- | ----------------------------------------------------------------------------- |
| `get-builders-error`     | 400         | An unexpected error occurred while retrieving the builders list.              |
| `builders-not-found`     | 404         | No builders could be found based on the provided criteria.                    |
| `builder-not-found`      | 404         | The specific builder requested by ID was not found.                           |
| `duplicate-email`        | 409         | A builder with the provided email address already exists, as emails must be unique. |
| `builder-unique-error`   | 409         | A violation of a unique field constraint (e.g., slug, GST number) occurred during creation or update. |
| `password-matched`       | 400         | The new password provided is identical to the current password, which is not allowed for security reasons. |
| `dump-unauthorized`      | 403         | The user attempting a dump action is not authorized to perform this operation. |
| `validation-error`       | 400         | One or more fields in the request body failed validation checks.              |
| `authorization-error`    | 401         | The authenticated user does not have the necessary permissions to access this resource. |
| `invalid-id`             | 400         | The provided ID in the path parameters is not a valid MongoDB ObjectId.       |
| `operation-error`        | 500         | A general error occurred during the execution of the API operation.           |
