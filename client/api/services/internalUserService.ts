import { identityApiBase } from "../apiBases";
import { http } from '../http';
import { httpAuth } from '../httpAuth';

const usersUrl = (suffix = "") => `${identityApiBase()}/auth/users${suffix}`;
const rolesUrl = () => `${identityApiBase()}/auth/roles`; 

export interface InternalUser {
    id: number;
    username: string;
    auth0Id: string | null;
    firstName?: string;
    lastName?: string;
    roles: string[];
    supplierId: number | null; 
}

export const InternalUserService = {
    /**
     * Obtener todos los usuarios internos (trabajadores).
     * GET /api/auth/users/internal
     */
    getAll: async (): Promise<InternalUser[]> => {
        const response = await httpAuth.get<InternalUser[]>(usersUrl("/internal"));
        const links = await http.get<Array<{ userId: number; supplierId: number | null }>>("/procurement/supplier-accounts");
        return response.data.map((user) => ({
            ...user,
            supplierId: links.data.find((link) => link.userId === user.id)?.supplierId ?? null,
        }));
    },

    updateSupplierAssignment: async (userId: number, username: string, supplierId: number | null): Promise<void> => {
        await http.put("/procurement/supplier-accounts", { userId, username, supplierId });
    },

    /**
     * Obtiene solo los usuarios con el rol de Vendedor.
     */
    getSellers: async (): Promise<Array<{ id: number; name: string }>> => {
        const users = await InternalUserService.getAll();
        const SELLER_ROLE_NAME = "ROLE_SELLER"; 

        return users
            .filter(user => user.roles.includes(SELLER_ROLE_NAME))
            .map(user => ({
                id: user.id,
                name: (user.firstName && user.lastName) 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username
            }));
    },

    /**
     * Obtener la lista de roles disponibles.
     */
    getAvailableRoles: async (): Promise<string[]> => {
        const response = await httpAuth.get<string[]>(rolesUrl()); 
        return response.data.filter((role: string) => role !== 'ROLE_CLIENT'); 
    },
};