# Izi Azure Function

This project is an implementation of Azure Functions for user authentication and management using Azure Cosmos DB.

## Features
- User registration (with duplicate email check).
- User email verification (simulated via logging).
- Login with two-factor authentication (2FA).
- **SeatId Management**: Registration and tracking of requests per seat.
- **Automatic User-to-Seat Mapping**: Linking authenticated users to their SeatId.
- Localization support (CS, EN) using i18next.
- Secure password storage using bcrypt.
- User role management (Admin, Customer).

## SeatId
Every request to the API (except for SeatId registration) must include a valid `x-seat-id` header. Without this header or with an invalid ID, the request will be rejected (401 Unauthorized).

### Registering a SeatId
To obtain or register a `SeatId` (which must be a GUID), use the following endpoint:

- **Endpoint**: `POST /api/seats/register`
- **Body**:
  ```json
  {
    "seatId": "your-guid-here"
  }
  ```
- **Response**: `201 Created` with the registered SeatId.

### Request Tracking
The system automatically tracks the number of requests made with each `SeatId`.

### User Assignment
When a user successfully completes the 2FA login process, their `UserId` is automatically assigned to the current `SeatId` in the database.

## Requirements
- [Node.js](https://nodejs.org/) (version 18 or newer)
- [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools)
- [Azure Cosmos DB](https://azure.microsoft.com/services/cosmos-db/) (or local emulator)

## Installation and Startup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the configuration file `local.settings.json` in the root directory (see the Configuration section below).

3. Compile the project:
   ```bash
   npm run build
   ```

4. Run functions locally:
   ```bash
   npm start
   ```

## Configuration

For local execution, it is essential to create a `local.settings.json` file. This file is ignored by Git as it contains sensitive data.

### local.settings.json Template

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "<your-cosmos-db-endpoint>",
    "COSMOS_KEY": "<your-cosmos-db-key>",
    "COSMOS_DATABASE": "<your-cosmos-db-database>"
  }
}
```

## Testing

The project includes a set of unit tests using Jest. You can run the tests with the following command:

```bash
npm test
```
