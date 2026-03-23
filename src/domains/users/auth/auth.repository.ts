import { getContainer } from "../../../core/database/cosmos-client";
import { AuthSession } from "./auth-session";

const CONTAINER_ID = "AuthSessions";

export class AuthRepository {
    async create(session: AuthSession): Promise<AuthSession> {
        const container = await getContainer(CONTAINER_ID);
        const { resource } = await container.items.create(session);
        if (!resource) {
            throw new Error("Failed to create auth session in database");
        }
        return resource;
    }

    async findById(id: string): Promise<AuthSession | null> {
        try {
            const container = await getContainer(CONTAINER_ID);
            const { resource } = await container.item(id, id).read<AuthSession>();
            return resource ?? null;
        } catch (error: any) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async findByEmail(email: string): Promise<AuthSession[]> {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.email = @email",
            parameters: [{ name: "@email", value: email }]
        };

        const container = await getContainer(CONTAINER_ID);
        const { resources } = await container.items.query<AuthSession>(querySpec).fetchAll();
        return resources;
    }

    async findActiveByEmail(email: string): Promise<AuthSession | null> {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.email = @email AND c.isActive = false ORDER BY c.createdAt DESC",
            parameters: [
                { name: "@email", value: email }
            ]
        };

        const container = await getContainer(CONTAINER_ID);
        const { resources } = await container.items.query<AuthSession>(querySpec).fetchAll();
        return resources.length > 0 ? resources[0] : null;
    }

    async findActiveByEmailAndCode(email: string, code: string): Promise<AuthSession | null> {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.email = @email AND c.code2fa = @code AND c.isActive = false",
            parameters: [
                { name: "@email", value: email },
                { name: "@code", value: code }
            ]
        };

        const container = await getContainer(CONTAINER_ID);
        const { resources } = await container.items.query<AuthSession>(querySpec).fetchAll();
        return resources.length > 0 ? resources[0] : null;
    }

    async update(id: string, session: AuthSession): Promise<AuthSession> {
        const container = await getContainer(CONTAINER_ID);
        const { resource } = await container.item(id, id).replace<AuthSession>(session);
        if (!resource) {
            throw new Error("Failed to update auth session in database");
        }
        return resource;
    }

    async delete(id: string): Promise<void> {
        const container = await getContainer(CONTAINER_ID);
        await container.item(id, id).delete();
    }
}

export const authRepository = new AuthRepository();
