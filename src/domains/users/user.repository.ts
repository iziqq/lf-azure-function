import { getContainer } from "../../core/database/cosmos-client";
import { User } from "./user";

const CONTAINER_ID = "Users";

export class UserRepository {
    async create(user: User): Promise<User> {
        try {
            const container = await getContainer(CONTAINER_ID);
            const { resource } = await container.items.create(user);
            if (!resource) {
                throw new Error("Failed to create user in database: No resource returned");
            }
            return resource;
        } catch (error: any) {
            console.error(`UserRepository.create error: ${error.message}`, error);
            throw error;
        }
    }

    async findById(id: string): Promise<User | null> {
        try {
            const container = await getContainer(CONTAINER_ID);
            const { resource } = await container.item(id, id).read<User>();
            return resource ?? null;
        } catch (error: any) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.email = @email",
            parameters: [
                {
                    name: "@email",
                    value: email
                }
            ]
        };

        const container = await getContainer(CONTAINER_ID);
        const { resources } = await container.items.query<User>(querySpec).fetchAll();
        return resources.length > 0 ? resources[0] : null;
    }

    async update(id: string, user: User): Promise<User> {
        const container = await getContainer(CONTAINER_ID);
        const { resource } = await container.item(id, id).replace<User>(user);
        if (!resource) {
            throw new Error("Failed to update user in database");
        }
        return resource;
    }

    async delete(id: string): Promise<void> {
        const container = await getContainer(CONTAINER_ID);
        await container.item(id, id).delete();
    }
}

export const userRepository = new UserRepository();
