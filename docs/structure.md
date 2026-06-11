# Title

Base path: `/<base-route>`

---

<!-- Example of endpoints -->

## Endpoints Overview

| Method | Endpoint                     | Description                    | Auth Level Required |
| ------ | ---------------------------- | ------------------------------ | ------------------- |
| GET    | `/<base-route>/`             | Get paginated list of builders | Admin (any level)   |
| GET    | `/<base-route>/:id`          | Get builder by ID              | Admin (any level)   |
| POST   | `/<base-route>/`             | Create new builder             | Admin (any level)   |
| PUT    | `/<base-route>/:id`          | Update builder details         | Admin (any level)   |
| DELETE | `/<base-route>/:id`          | Delete builder                 | Admin (any level)   |
| GET    | `/<base-route>/:id/password` | Get decoded password           | Admin (not support) |
| PUT    | `/<base-route>/:id/password` | Update builder password        | Admin (not support) |

<!--  -->

<!-- These are the route patterns to be listed. Dont include these below lines in docs -->

1. GET list (general path `/`) - used for retrieving lists of data objects
2. GET single (general path `/:id`) - used for retrieving a data object
3. POST (general path `/`) - used for creating data objects
4. PUT (general path `/:id`) - used for updating data objects
5. DELETE (general path `/:id`) - used for removing data objects
Follow up reference with the doc patterns listed below for all type of reqs
<!-- Dont include these above lines  -->

<!-- GET list route example pattern -->

## GET `/<base-route>/<path>`

Get a paginated list of all data objects.

### Query Parameters

1. General query params
   | Parameter | Type | Required | Default | Description |
   | --------- | -------- | -------- | ------- | ----------------------------------------------------- |
   | `field` | `string` | No | - | Multiple list of fields to include in response (ex, field=name&field=email) |

<!-- These below query parameters were taken from paginatedResults function -->

2. Pagination query params
   | Parameter | Type | Required | Default | Description |
   | --------- | -------- | -------- | ------- | ----------------------------------------------------- |
   | `page` | `number` | No | 1 | Page number for pagination |
   | `limit` | `number` | No | 10 | Number of results per page |

<!-- These below query parameters were taken from getSearchFilters function -->

3. Search Field query params (patterned field names as `s<field-name-capitalized>`)
    <!-- Example -->
   | Parameter | Type     | Required | Default | Description                |
   | --------- | -------- | -------- | ------- | -------------------------- |
   | `sName`   | `string` | No       | -       | Filter by data field name  |
   | `sEmail`  | `string` | No       | -       | Filter by data field email |

### Response

Returns matched paginated data objects with more things if any

<!--  -->

---

<!-- GET single route example pattern -->

## GET `/<base-route>/<path>/:id`

Get details of a specific builder by ID.

### Path Parameters

| Parameter | Type     | Required | Description                        |
| --------- | -------- | -------- | ---------------------------------- |
| `id`      | `string` | Yes      | Hex ObjectId string of the builder |

### Query Parameters

1. General query params
   | Parameter | Type | Required | Default | Description |
   | --------- | -------- | -------- | ------- | ----------------------------------------------------- |
   | `field` | `string` | No | - | Multiple list of fields to include in response (ex, field=name&field=email) |

<!-- These below query parameters were taken from getSearchFilters function -->

2. Search Field query params (patterned field names as `s<field-name-capitalized>`)
    <!-- Example -->

   | Parameter | Type     | Required | Default | Description                |
   | --------- | -------- | -------- | ------- | -------------------------- |
   | `sName`   | `string` | No       | -       | Filter by data field name  |
   | `sEmail`  | `string` | No       | -       | Filter by data field email |

   ## <!--  -->

### Response

Returns matched single data objects with more things if any
