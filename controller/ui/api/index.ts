import {getFormData} from '../helpers/index';


export const getSettings = async (): Promise<{[k: string]: string}> => {
    return fetch('/api/configuration').then(response => response.json());
};

export const setSettings = async (data: {[k: string]: string}): Promise<{[k: string]: string}> => {
    return fetch('/api/configuration', {
        method: 'POST',
        body: getFormData(data),
    }).then(response => response.json());
};

export const getStatus = async (): Promise<{[k: string]: string}> => {
    return fetch('/api/status').then(response => response.json());
};

export const reboot = async (): Promise<{[k: string]: string}> => {
    return fetch('/api/reboot').then(response => response.json());
};