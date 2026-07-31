# Operator APIs

Domain may be `admin|user|general|operator`

Base path: `/<domain>/operators`

---

## GET `/`

Get a paginated list of all operators.

### Query Parameters

1. **Search Filters**
   Searches values by keyword inclusion (case-insensitive)  
   _Format_ - `s<field-name>`

| Field Name  | Type     | Required | Description                    |
| :---------- | :------- | :------- | :----------------------------- |
| `Name`      | `string` | No       | Searches for `name` field      |
| `Email`     | `string` | No       | Searches for `email` field     |
| `Slug`      | `string` | No       | Searches for `slug` field      |
| `BrandName` | `string` | No       | Searches for `brandName` field |

2. **Multi Filters**
   Searches exact values existence  
   _Format_ - `f<field-name>`

| Field Name      | Type     | Required | Description                       |
| :-------------- | :------- | :------- | :-------------------------------- |
| `Name`          | `string` | No       | Matches for `name` field          |
| `Email`         | `string` | No       | Matches for `email` field         |
| `Slug`          | `string` | No       | Matches for `slug` field          |
| `BrandName`     | `string` | No       | Matches for `brandName` field     |
| `EstablishedOn` | `string` | No       | Matches for `establishedOn` field |
