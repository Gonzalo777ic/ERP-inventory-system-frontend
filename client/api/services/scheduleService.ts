import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import { 
    StoreSchedule, 
    StoreScheduleException, 
    ScheduleExceptionPayload, 
    StoreStatusDTO 
} from "../../types/store/schedule";

const scheduleUrl = (suffix = "") => `${storeApiBase()}/store/schedule${suffix}`;
const statusUrl = (suffix = "") => `${storeApiBase()}/store/status${suffix}`;

export const ScheduleService = {
    
    getWeeklySchedule: async (): Promise<StoreSchedule[]> => {
        const response = await httpStore.get<StoreSchedule[]>(scheduleUrl());
        return response.data;
    },

    updateDaySchedule: async (id: number, data: Partial<StoreSchedule>): Promise<StoreSchedule> => {
        const response = await httpStore.put<StoreSchedule>(scheduleUrl(`/${id}`), data);
        return response.data;
    },

    getUpcomingExceptions: async (): Promise<StoreScheduleException[]> => {
        const response = await httpStore.get<StoreScheduleException[]>(scheduleUrl("/exceptions"));
        return response.data;
    },


    createException: async (data: ScheduleExceptionPayload): Promise<StoreScheduleException> => {
        const response = await httpStore.post<StoreScheduleException>(scheduleUrl("/exceptions"), data);
        return response.data;
    },

    updateException: async (id: number, data: ScheduleExceptionPayload): Promise<StoreScheduleException> => {
        const response = await httpStore.put<StoreScheduleException>(scheduleUrl(`/exceptions/${id}`), data);
        return response.data;
    },

    deleteException: async (id: number): Promise<void> => {
        await httpStore.delete(scheduleUrl(`/exceptions/${id}`));
    },

    getCurrentStatus: async (): Promise<StoreStatusDTO> => {
        const response = await httpStore.get<StoreStatusDTO>(statusUrl("/current"));
        return response.data;
    }
};