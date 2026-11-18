import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import { Announcement, AnnouncementDTO } from "../../types/store/announcement";

const announcementsUrl = (suffix = "") => `${storeApiBase()}/store/announcements${suffix}`;



export const AnnouncementService = {
    
    /**
     * Obtener todos los anuncios (Vista de Administrador).
     */
    getAll: async (): Promise<Announcement[]> => {
        const response = await httpStore.get<Announcement[]>(announcementsUrl());
        return response.data;
    },
    /**
     * Obtener solo los anuncios activos y vigentes (Para mostrar al usuario final).
     */
    getActive: async (): Promise<Announcement[]> => {
        const response = await httpStore.get<Announcement[]>(`${announcementsUrl()}/active`);
        return response.data;
    },
    /**
     * Obtener un anuncio por ID.
     */
    getById: async (id: number): Promise<Announcement> => {
        const response = await httpStore.get<Announcement>(`${announcementsUrl()}/${id}`);
        return response.data;
    },

    /**
     * Crear un nuevo anuncio.
     */
    create: async (data: AnnouncementDTO): Promise<Announcement> => {
        const response = await httpStore.post<Announcement>(announcementsUrl(), data);
        return response.data;
    },

    /**
     * Actualizar un anuncio existente.
     */
    update: async (id: number, data: AnnouncementDTO): Promise<Announcement> => {
        const response = await httpStore.put<Announcement>(`${announcementsUrl()}/${id}`, data);
        return response.data;
    },
    
    
    /**
     * Alternar estado Activo/Inactivo rápidamente.
     */
    toggleActive: async (id: number): Promise<Announcement> => {
        const response = await httpStore.patch<Announcement>(`${announcementsUrl()}/${id}/toggle`);
        return response.data;
    },

     /**
     * Eliminar anuncio.
     */
    delete: async (id: number): Promise<void> => {
        await httpStore.delete(`${announcementsUrl()}/${id}`);
    }
    
};