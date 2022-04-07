import { getFormData } from '../helpers/index';


interface Settings {
    controllerId: string,
    ssid: string,
    password: string,
}

interface Status {
    humidity: number,
    temperature: number,
    lastError: string,
}


export const getSettings = async (): Promise<Settings> => {
    const response = await fetch('api/configuration');
    const result = await response.json() as Settings;

    return result;
};

export const saveSettings = async <T extends { success: boolean }>(settings: Settings): Promise<T> => {
    const options = {
        method: 'POST',
        body: getFormData({ ...settings }),
    };

    const response = await fetch('/api/configuration', options);
    const result = await response.json() as T;

    return result;
};

export const getStatus = async (): Promise<Status> => {
    const response = await fetch('/api/status');
    const result = await response.json() as Status;

    return result;
};

export const reboot = async <T extends { success: boolean }>(): Promise<T> => {
    const response = await fetch('/api/reboot');
    const result = await response.json() as T;

    return result;
};
