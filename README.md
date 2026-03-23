# Izi Azure Function

This project is an implementation of Azure Functions for user authentication and management using Azure Cosmos DB.

## Features
- User registration (with duplicate email check).
- User email verification (simulated via logging).
- Login with two-factor authentication (2FA).
- Localization support (CS, EN) using i18next.
- Secure password storage using bcrypt.
- User role management (Admin, Customer).

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
