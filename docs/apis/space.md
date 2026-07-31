# Space (Centre) APIs

Domain may be `admin|user|general|operator`

Base path: `/<domain>/spaces`

---

## GET `/`

Get a paginated list of all spaces.

### Query Parameters

1. **Search Filters**
   Searches values by keyword inclusion (case-insensitive)
   _Format_ - `s<field-name>`

| Field Name  | Type     | Required | Description                          |
| :---------- | :------- | :------- | :----------------------------------- |
| `Name`      | `string` | No       | Searches for `name` field            |
| `Email`     | `string` | No       | Searches for `email` field           |
| `City`      | `string` | No       | Searches for `location.city` field   |
| `State`     | `string` | No       | Searches for `location.state` field  |
| `Area`      | `string` | No       | Searches for `location.area` field   |
| `SpaceType` | `string` | No       | Searches for `specs.spaceType` field |
| `Category`  | `string` | No       | Searches for `specs.category` field  |

2. **Multi Filters**
   Searches exact values existence
   _Format_ - `f<field-name>`

| Field Name  | Type      | Required | Description                         |
| :---------- | :-------- | :------- | :---------------------------------- |
| `City`      | `string`  | No       | Matches for `location.city` field   |
| `State`     | `string`  | No       | Matches for `location.state` field  |
| `Area`      | `string`  | No       | Matches for `location.area` field   |
| `Category`  | `string`  | No       | Matches for `specs.category` field  |
| `SpaceType` | `string`  | No       | Matches for `specs.spaceType` field |
| `Grade`     | `string`  | No       | Matches for `specs.grade` field     |
| `Oc`        | `boolean` | No       | Matches for `flags.isOc` field      |
| `Sez`       | `boolean` | No       | Matches for `flags.isSez` field     |
| `Operator`  | `string`  | No       | Matches for `operator` field        |

3. **Ranged Filters**
   Filter results within predefined numeric ranges using range IDs  
   _Format_ - `r<field-name>`

| Field Name | Type     | Required | Ranges / Options                                                            | Description                    |
| :--------- | :------- | :------- | :-------------------------------------------------------------------------- | :----------------------------- |
| `Seats`    | `number` | No       | `1`: 0 - 10<br>`2`: 10 - 50<br>`3`: 50 - 100<br>`4`: 100 - 500<br>`5`: 500+ | Ranges for `seats.total` field |
