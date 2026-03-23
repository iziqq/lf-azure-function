import {CosmosClient, Database, Container} from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT || "";
const key = process.env.COSMOS_KEY || "";
const databaseId = process.env.COSMOS_DATABASE || "LifeforgeDB";

if (!endpoint || !key) {
  console.warn("Chybí konfigurace Cosmos DB (COSMOS_ENDPOINT, COSMOS_KEY).");
}

const client = endpoint && key ? new CosmosClient({ endpoint, key }) : null;
let database: Database | null = null;
const containers: Map<string, Container> = new Map();

export async function initializeDatabase(): Promise<Database> {
  if (!client) {
    throw new Error("Cannot initialize database: Cosmos client is null. Check COSMOS_ENDPOINT and COSMOS_KEY.");
  }
  
  const { database: db } = await client.databases.createIfNotExists({
    id: databaseId,
    throughput: 400
  });

  database = db;
  console.log(`Database ${databaseId} initialized with shared 400 RU/s`);
  return db;
}

export async function getContainer(containerId: string): Promise<Container> {
    if (!database) {
        await initializeDatabase();
    }

    if (!database) {
        throw new Error("Cosmos DB database is not initialized");
    }

    if (containers.has(containerId)) {
        return containers.get(containerId)!;
    }

    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: ["/id"] },
    });

    containers.set(containerId, container);
    return container;
}

export { client, database };
