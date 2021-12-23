export const getSettings = async () => fetch('/api/configuration', {
    method: 'GET',
}).then(response => response.json());

export const setSettings = async (data: Record<string, string>) => {
    const body = new FormData();

    Object.keys(data).forEach(key => body.append(key, data[key]));

    return fetch('/api/configuration', {
        body,
        method: 'POST',
    }).then(response => response.json());
}

export const reboot = async () => fetch('/api/reboot').then(response => response.json());