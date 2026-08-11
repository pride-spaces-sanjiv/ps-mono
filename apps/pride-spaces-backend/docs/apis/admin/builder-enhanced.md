# Admin Builder API Documentation

**Base Path:** `/admin/builder`

**Authentication:** Required for all endpoints (Bearer token or session-based)

---

## Table of Contents

1. [Endpoints Overview](#endpoints-overview)
2. [Data Models](#data-models)
3. [Validation Rules](#validation-rules)
4. [Endpoints](#endpoints)
5. [Error Handling](#error-handling)
6. [Middleware Chain](#middleware-chain)

---

## Endpoints Overview

| Method | Endpoint                      | Description                           | Auth Level Required       |
| ------ | ----------------------------- | ------------------------------------- | ------------------------- |
| GET    | `/`                           | Get paginated list of builders        | Admin (any level)         |
| GET    | `/:id`                        | Get builder by ID                     | Admin (any level)         |
| POST   | `/`                           | Create new builder                    | Admin (any level)         |
| PUT    | `/:id`                        | Update builder details                | Admin (any level)         |
| DELETE | `/:id`                        | Delete builder                        | Admin (any level)         |
| GET    | `/:id/password`               | Get decoded password                  | Admin (not support)       |
| PUT    | `/:id/password`               | Update builder password               | Admin (not support)       |

---

## Data Models

### Builder Schema

The complete builder object structure:

```typescript
{
  name: string;              // Builder's official name
  email: string;             // Unique email address
  password: string;          // Encrypted password
  slug: string;              // URL-friendly unique identifier
  brandName: string;         // Display name of the brand
  gstNo?: string;            // 15-character GST number (optional)
  cinNo?: string;            // Corporate Identification Number (optional)
  headquarter: HeadQuarter;  // Headquarters information
  branches?: Branch[];       // Array of branch offices (optional)
  isActive: boolean;         // Active status (default: true)
  approval?: Approval;       // Approval metadata (optional)
  createdAt: Date;           // Auto-generated timestamp
  updatedAt: Date;           // Auto-generated timestamp
}
```

### HeadQuarter Schema

```typescript
{
  address: string;    // Full physical address
  contactNo: string;  // Valid phone number (international format)
}
```

### Branch Schema

```typescript
{
  code: string;           // State/region code
  name: string;           // Branch name
  address: string;        // Full physical address
  city: string;           // City name
  postalCode: string;     // Postal/ZIP code (min 3 alphanumeric chars)
  gstNo?: string;         // 15-character GST number (optional)
  person?: Person;        // Contact person details (optional)
  isPrimary: boolean;     // Primary branch flag (default: false)
}
```

### Person Schema

```typescript
{
  name: string;       // Full name (min 4 chars, alphanumeric)
  email: string;      // Valid email address
  contactNo: string;  // Valid phone number (international format)
  role: string;       // Role/designation
}
```

### Approval Schema

```typescript
{
  status: string;     // Approval status
  approvedBy?: string;
  approvedAt?: Date;
  // Additional approval metadata
}
```

---

## Validation Rules

### Field-Level Validation

#### Name Fields (name, brandName)
- **Type:** String
- **Min Length:** 4 characters
- **Pattern:** `/^[A-Za-z0-9,\- ]+$/`
- **Rules:** Only alphanumeric characters, commas, hyphens, and spaces allowed
- **Trimmed:** Yes

#### Email
- **Type:** String (email format)
- **Validation:** Must be valid email format
- **Unique:** Yes (database constraint)
- **Trimmed:** Yes

#### Password
- **Type:** String
- **Min Length:** 4 characters
- **Required Patterns:**
  - At least one lowercase letter (`/[a-z]/`)
  - At least one uppercase letter (`/[A-Z]/`)
  - At least one number (`/[0-9]/`)
  - At least one symbol (`/[^a-zA-Z0-9 ]/`)
- **Trimmed:** Yes
- **Storage:** Encrypted using crypto utility

#### Slug
- **Type:** String
- **Pattern:** `/^[a-z0-9][a-z0-9\-]+[a-z0-9]$/`
- **Transform:** Auto-converted to lowercase, spaces removed
- **Unique:** Yes (database constraint)
- **Rules:** Must start and end with alphanumeric, hyphens allowed in middle
- **Trimmed:** Yes

#### GST Number (gstNo)
- **Type:** String
- **Length:** Exactly 15 characters
- **Pattern:** `/^[A-Za-z0-9]{15}$/`
- **Required:** Yes for builder, optional for branches
- **Trimmed:** Yes

#### CIN Number (cinNo)
- **Type:** String
- **Rules:** No spaces allowed
- **Required:** No
- **Trimmed:** Yes

#### Phone Numbers (contactNo)
- **Type:** String
- **Min Length:** 4 characters
- **Validation:** Must be valid international phone number (uses libphonenumber-js)
- **Trimmed:** Yes

#### Postal Code
- **Type:** String
- **Min Length:** 3 characters
- **Pattern:** `/^[A-Za-z0-9]+$/`
- **Transform:** Non-alphanumeric characters removed
- **Trimmed:** Yes

#### MongoDB ObjectId (for :id params)
- **Validation:** Must be valid MongoDB ObjectId or 24-character hex string
- **Validator:** `isObjectIdOrHexString()` from mongoose

---

## Endpoints

### 1. GET `/` - Get Builders List

Get a paginated list of all builders with optional filtering and field selection.

#### Query Parameters

| Parameter | Type     | Required | Default | Description                                           |
| --------- | -------- | -------- | ------- | ----------------------------------------------------- |
| `page`    | `number` | No       | 1       | Page number for pagination                            |
| `limit`   | `number` | No       | 10      | Number of results per page                            |
| `fields`  | `string` | No       | all     | Comma-separated list of fields to include in response |
| `name`    | `string` | No       | -       | Filter by builder name (exact match)                  |
| `email`   | `string` | No       | -       | Filter by builder email (exact match)                 |
| `search`  | `string` | No       | -       | Search across name and email fields                   |

#### Middleware Chain

1. No authentication required (handled at router level)
2. Query parameter validation (optional)
3. Controller execution

#### Response Structure

**Success (200):**
```json
{
  "success": true,
  "message": "Got builders list",
  "data": {
    "results": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "ABC Builders",
        "email": "contact@abc.com",
        "slug": "abc-builders",
        "brandName": "ABC Construction",
        "gstNo": "29ABCDE1234F1Z5",
        "cinNo": "U12345KA2020PTC123456",
        "headquarter": {
          "address": "123 Main St, City",
          "contactNo": "+911234567890"
        },
        "branches": [...],
        "isActive": true,
        "totalSpaces": 15,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "page": {
      "current": 1,
      "total": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "metrics": {
      "total": 50,
      "limit": 10,
      "skip": 0
    }
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "errorType": "builders-not-found",
  "message": "No builders found",
  "data": {
    "results": [],
    "page": {...},
    "metrics": {...}
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "errorType": "get-builders-error",
  "message": "Failed to get builders list"
}
```

#### Implementation Details

- **Projection:** Excludes `password` field by default
- **Aggregation:** Adds `totalSpaces` count from related spaces collection
- **Search:** Uses field mapping for name and email searches
- **Filtering:** Empty string values are excluded from filters

---

### 2. GET `/:id` - Get Builder by ID

Retrieve detailed information about a specific builder.

#### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

#### Query Parameters

| Parameter | Type     | Required | Description                                           |
| --------- | -------- | -------- | ----------------------------------------------------- |
| `fields`  | `string` | No       | Comma-separated list of fields to include in response |

#### Middleware Chain

1. **Param Validation:** Validates `id` is valid MongoDB ObjectId
   - Schema: `getIdSchema()`
   - Error Type: `param-validation`
2. Controller execution

#### Response Structure

**Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Builders",
    "email": "contact@abc.com",
    "slug": "abc-builders",
    "brandName": "ABC Construction",
    "gstNo": "29ABCDE1234F1Z5",
    "headquarter": {...},
    "branches": [...],
    "isActive": true,
    "totalSpaces": 15,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "errorType": "builder-not-found",
  "message": "Builder not found"
}
```

**Invalid ID (400):**
```json
{
  "success": false,
  "errorType": "param-validation",
  "message": "Id is invalid",
  "validationError": true,
  "field": "id",
  "errors": [...]
}
```

---

### 3. POST `/` - Create Builder

Create a new builder with complete details.

#### Request Body

All fields from the Builder Schema. See [Data Models](#data-models) section.

**Required Fields:**
- `name`
- `email`
- `password`
- `slug`
- `brandName`
- `gstNo`
- `headquarter` (with `address` and `contactNo`)

**Optional Fields:**
- `cinNo`
- `branches`
- `isActive` (default: true)

#### Middleware Chain

1. **Body Validation:** Validates against `operatorSchema`
   - Options: `validateOnlyPresent: false`, `overridePostValidation: true`, `extractOnlyRequiredFields: true`
   - Error Type: `body-validation`
2. **User Existence Check:** Ensures email doesn't already exist
   - Model: `Builder`
   - Field: `email`
   - Error Type: `user-exists` (if email exists)
3. Controller execution

#### Response Structure

**Success - Direct Creation (201):**
```json
{
  "success": true,
  "message": "Created builder successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Builders",
    "email": "contact@abc.com",
    ...
  }
}
```

**Success - Dumped for Approval (201):**
```json
{
  "success": true,
  "message": "Dumped new builder successfully",
  "data": {
    "name": "ABC Builders",
    "email": "contact@abc.com",
    ...
  }
}
```

**Duplicate Email (409):**
```json
{
  "success": false,
  "errorType": "user-exists",
  "message": "user already exists"
}
```

**Unique Constraint Violation (409):**
```json
{
  "success": false,
  "errorType": "builder-unique-error",
  "message": "Builder [field] already exists"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "errorType": "body-validation",
  "message": "[Validation error message]",
  "validationError": true,
  "field": "email",
  "errors": [
    {
      "code": "invalid_string",
      "path": ["email"],
      "message": "Email is invalid"
    }
  ],
  "fields": ["email"]
}
```

#### Implementation Details

- **Password Encryption:** Password is encrypted using `encodeCrypto()` before storage
- **Dump System:** 
  - Support level users: Creates dump with `PENDING` status (requires approval)
  - Admin/Builder level: Creates dump with `APPROVED` status and directly creates builder
- **Unique Fields:** `email` and `slug` must be unique (database constraints)

---

### 4. PUT `/:id` - Update Builder

Update an existing builder's details (excluding password).

#### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

#### Request Body

All fields from Builder Schema are optional. Password field is excluded.

**Allowed Fields:**
- `name`
- `email`
- `slug`
- `brandName`
- `gstNo`
- `cinNo`
- `headquarter`
- `branches`
- `isActive`

#### Middleware Chain

1. **Param Validation:** Validates `id` is valid MongoDB ObjectId
   - Schema: `getIdSchema()`
2. **Body Validation:** Validates against `operatorSchema.omit({ password: true })`
   - Options: `allowEmpty: true`, `validateOnlyPresent: true`, `overridePostValidation: true`, `extractOnlyRequiredFields: true`
   - Error Type: `body-validation`
3. Controller execution

#### Response Structure

**Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Builder Name",
    "email": "updated@email.com",
    "totalSpaces": 15,
    ...
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "errorType": "builder-not-found",
  "message": "Builder not found"
}
```

**Unique Constraint Violation (409):**
```json
{
  "success": false,
  "errorType": "builder-unique-error",
  "message": "Builder [field] already exists"
}
```

#### Implementation Details

- **Dump System:** All updates go through dump system
  - Support level: Creates dump with `PENDING` status
  - Admin/Builder level: Creates dump with `APPROVED` status and directly updates
- **Partial Updates:** Only provided fields are updated
- **Field Extraction:** Only schema-defined fields are processed
- **Aggregation:** Response includes `totalSpaces` count

---

### 5. DELETE `/:id` - Delete Builder

Delete a builder by ID.

#### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

#### Middleware Chain

1. **Param Validation:** Validates `id` is valid MongoDB ObjectId
   - Schema: `getIdSchema()`
2. Controller execution

#### Response Structure

**Success - Direct Deletion (200):**
```json
{
  "success": true,
  "message": "Builder deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

**Success - Dumped for Approval (200):**
```json
{
  "success": true,
  "message": "Dumped builder-removal successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "errorType": "builder-not-found",
  "message": "Builder not found"
}
```

**Unauthorized (403):**
```json
{
  "success": false,
  "errorType": "dump-unauthorized",
  "message": "Dump action was unauthorized"
}
```

#### Implementation Details

- **Dump System:** Deletion goes through dump system
  - Support level: Creates dump with `PENDING` status (no actual deletion)
  - Admin/Builder level: Creates dump with `APPROVED` status and performs deletion
- **Soft Delete:** Actual deletion behavior depends on implementation

---

### 6. GET `/:id/password` - Get Builder Password

Retrieve the decoded password of a builder (restricted access).

#### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

#### Authorization

**Allowed Admin Levels:**
- `super-admin`
- `admin`
- `builder`

**Restricted:**
- `support` level is NOT allowed

#### Middleware Chain

1. **Param Validation:** Validates `id` is valid MongoDB ObjectId
   - Schema: `getIdSchema()`
2. **Admin Level Check:** Ensures user has required admin level
   - Middleware: `allowAdminLevelsToPass()`
   - Allowed: All admin levels except `support`
   - Error Type: `admin-level-unauthorized`
3. Controller execution

#### Response Structure

**Success (200):**
```json
{
  "success": true,
  "message": "Builder password retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "password": "[encrypted]",
    "decodedPassword": "ActualP@ssw0rd"
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "errorType": "builder-not-found",
  "message": "Builder not found"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "errorType": "admin-level-unauthorized",
  "message": "You are not authorized to this admin-level"
}
```

#### Implementation Details

- **Projection:** Only fetches `password` and `_id` fields
- **Decryption:** Uses `decodeCrypto()` to decode encrypted password
- **Security:** Restricted to higher admin levels only

---

### 7. PUT `/:id/password` - Update Builder Password

Update the password of a builder (restricted access).

#### Path Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `id`      | `string` | Yes      | MongoDB ObjectId of the builder |

#### Request Body

| Field      | Type     | Required | Description                                                               |
| ---------- | -------- | -------- | ------------------------------------------------------------------------- |
| `password` | `string` | Yes      | New password (min 4 chars, requires lowercase, uppercase, number, symbol) |

#### Authorization

**Allowed Admin Levels:**
- `super-admin`
- `admin`
- `builder`

**Restricted:**
- `support` level is NOT allowed

#### Middleware Chain

1. **Param Validation:** Validates `id` is valid MongoDB ObjectId
   - Schema: `getIdSchema()`
2. **Admin Level Check:** Ensures user has required admin level
   - Middleware: `allowAdminLevelsToPass()`
   - Allowed: All admin levels except `support`
3. **Body Validation:** Validates password field
   - Schema: `operatorSchema.pick({ password: true })`
   - Options: `validateOnlyPresent: true`, `overridePostValidation: true`, `extractOnlyRequiredFields: true`
4. Controller execution

#### Response Structure

**Success (200):**
```json
{
  "success": true,
  "message": "Builder password updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "password": "[encrypted]"
  }
}
```

**Password Same as Current (400):**
```json
{
  "success": false,
  "errorType": "password-matched",
  "message": "New password cannot be the same as the current password"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "errorType": "builder-not-found",
  "message": "Builder not found"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "errorType": "body-validation",
  "message": "Password must contain at least one lowercase letter",
  "validationError": true,
  "field": "password",
  "errors": [...]
}
```

#### Implementation Details

- **Password Comparison:** Checks if new password matches current password
- **Encryption:** New password is encrypted using `encodeCrypto()` before storage
- **Dump System:** Password updates go through dump system
  - Support level: Creates dump with `PENDING` status
  - Admin/Builder level: Creates dump with `APPROVED` status and directly updates
- **Validation:** Full password validation rules apply (see [Validation Rules](#validation-rules))

---

## Error Handling

### Error Response Structure

All error responses follow this structure:

```json
{
  "success": false,
  "errorType": "error-type-identifier",
  "message": "Human-readable error message",
  "data": null,
  // Additional fields may be present based on error type
}
```

### Common Error Types

| Error Type                    | Status | Description                                                                   |
| ----------------------------- | ------ | ----------------------------------------------------------------------------- |
| `get-builders-error`          | 400    | Failed to retrieve builders list                                              |
| `get-builders-error-failure`  | 400    | Unexpected error during builders list retrieval                               |
| `builders-not-found`          | 404    | No builders found matching criteria                                           |
| `builder-not-found`           | 404    | Specific builder not found by ID                                              |
| `get-builder-error-failure`   | 400    | Unexpected error during builder retrieval                                     |
| `user-exists`                 | 400    | Email already exists (from checkUser middleware)                              |
| `builder-unique-error`        | 409    | Unique constraint violation (email, slug, etc.)                               |
| `create-builder-error-failure`| 400    | Unexpected error during builder creation                                      |
| `update-builder-error-failure`| 400    | Unexpected error during builder update                                        |
| `delete-builder-error-failure`| 400    | Unexpected error during builder deletion                                      |
| `password-matched`            | 400    | New password same as current password                                         |
| `get-builder-password-error-failure` | 400 | Unexpected error retrieving password                                   |
| `update-builder-password-error-failure` | 400 | Unexpected error updating password                                  |
| `dump-unauthorized`           | 403    | User not authorized for dump action                                           |
| `dump-failed`                 | 400    | Dump action failed                                                            |
| `admin-level-unauthorized`    | 401    | User's admin level insufficient for action                                    |
| `admin-level-empty`           | 404    | Admin level not found in session                                              |
| `param-validation`            | 400    | Path parameter validation failed                                              |
| `body-validation`             | 400    | Request body validation failed                                                |
| `body-invalid`                | 400    | Request body is not a valid object                                            |
| `body-empty`                  | 400    | Request body is empty                                                         |
| `body-validation-parser`      | 400    | Body validation parser error                                                  |

### Validation Error Structure

Validation errors include additional details:

```json
{
  "success": false,
  "errorType": "body-validation",
  "message": "Email is invalid",
  "validationError": true,
  "field": "email",
  "errors": [
    {
      "code": "invalid_string",
      "path": ["email"],
      "message": "Email is invalid"
    }
  ],
  "fields": ["email"]
}
```

---

## Middleware Chain

### Authentication Middleware

Applied at router level (not visible in route file but required):
- Validates Bearer token or session
- Populates `req.session.user` with authenticated user details
- Required for all endpoints

### Request Validation Middleware

#### 1. RequestMiddleware.paramValidator()

Validates path parameters using Zod schemas.

**Usage:**
```typescript
RequestMiddleware.paramValidator(getIdSchema(), "id")
```

**Validation:**
- Checks if parameter is valid MongoDB ObjectId
- Returns 400 with validation error if invalid

#### 2. RequestMiddleware.bodyValidator()

Validates request body using Zod schemas.

**Options:**
- `allowEmpty`: Allow empty body
- `validateOnlyPresent`: Only validate fields present in body
- `overridePostValidation`: Override body with validated data
- `extractOnlyRequiredFields`: Extract only schema-defined fields

**Usage:**
```typescript
RequestMiddleware.bodyValidator(operatorSchema, {
  validateOnlyPresent: false,
  overridePostValidation: true,
  extractOnlyRequiredFields: true
})
```

### Authorization Middleware

#### 1. checkUserExistenceByBodyValue()

Checks if user exists by field value in request body.

**Usage:**
```typescript
checkUserExistenceByBodyValue(Builder, "email")
```

**Behavior:**
- Queries database for existing record with specified field value
- Returns error if user already exists (for creation)
- Can be configured to pass only if exists (for updates)

#### 2. allowAdminLevelsToPass()

Restricts access based on admin level.

**Usage:**
```typescript
allowAdminLevelsToPass({
  allowedLevels: adminLevels.filter((level) => level !== "support")
})
```

**Behavior:**
- Checks `req.session.user.userType` against allowed levels
- Returns 401 if user level not in allowed list

#### 3. authorizeAdminDetailsByParam()

Authorizes admin actions based on target admin's level (commented out in routes).

**Behavior:**
- Compares session user's level with target user's level
- Ensures user can only act on lower-level admins

---

## Additional Notes

### Dump System

The application uses a "dump" system for change management:

- **Support Level Users:** All create/update/delete operations create a dump record with `PENDING` status. Changes require approval before being applied.
- **Admin/Builder Level Users:** Operations create a dump record with `APPROVED` status and are immediately applied to the database.

### Password Security

- Passwords are encrypted using a custom crypto utility (`encodeCrypto()`)
- Decryption is available only to authorized admin levels
- Password validation ensures strong passwords with mixed case, numbers, and symbols

### Field Projection

- The `fields` query parameter allows clients to request specific fields
- Password field is always excluded from GET responses (except password-specific endpoints)
- Uses MongoDB projection for efficient queries

### Pagination

- Default page size: 10 items
- Pagination metadata includes:
  - Current page number
  - Total pages
  - Has next/previous page flags
  - Total count
  - Skip and limit values

### Search and Filtering

- Search functionality uses field mapping for flexible queries
- Empty string values are automatically excluded from filters
- Supports exact match filtering on name and email fields

### Related Data

- Builder responses include `totalSpaces` count from related spaces collection
- Uses aggregation pipeline for efficient counting

---

## Example Requests

### Create Builder

```bash
POST /admin/builder
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "ABC Builders",
  "email": "contact@abc.com",
  "password": "SecureP@ss123",
  "slug": "abc-builders",
  "brandName": "ABC Construction",
  "gstNo": "29ABCDE1234F1Z5",
  "cinNo": "U12345KA2020PTC123456",
  "headquarter": {
    "address": "123 Main Street, Bangalore, Karnataka",
    "contactNo": "+911234567890"
  },
  "branches": [
    {
      "code": "KA",
      "name": "Bangalore Branch",
      "address": "456 Branch Road, Bangalore",
      "city": "Bangalore",
      "postalCode": "560001",
      "gstNo": "29ABCDE1234F1Z5",
      "person": {
        "name": "John Doe",
        "email": "john@abc.com",
        "contactNo": "+919876543210",
        "role": "Branch Manager"
      },
      "isPrimary": true
    }
  ],
  "isActive": true
}
```

### Update Builder

```bash
PUT /admin/builder/507f1f77bcf86cd799439011
Content-Type: application/json
Authorization: Bearer <token>

{
  "brandName": "ABC Premium Construction",
  "isActive": true
}
```

### Get Builders with Filtering

```bash
GET /admin/builder?page=1&limit=20&search=ABC&fields=name,email,brandName
Authorization: Bearer <token>
```

### Update Password

```bash
PUT /admin/builder/507f1f77bcf86cd799439011/password
Content-Type: application/json
Authorization: Bearer <token>

{
  "password": "NewSecureP@ss456"
}
```

---

## Schema Dependencies

This API documentation is generated from the following source files:

- **Route:** `src/routes/admin/builder.ts`
- **Controller:** `src/controllers/admin/builder.ts`
- **Schemas:**
  - `src/database/schemas/operator.ts` (used for builder validation)
  - `src/database/schemas/builder.ts`
  - `src/database/schemas/string.ts`
  - `src/database/schemas/person.ts`
- **Models:** `src/database/models/builder.ts`
- **Middlewares:**
  - `src/middlewares/request.ts`
  - `src/middlewares/checkUser.ts`

---

**Generated:** 2026-06-11  
**Version:** 1.0.0  
**API Base:** `/admin/builder`
