export const getFormData = (obj: { [k: string]: unknown }): FormData => {
    const keys = Object.keys(obj);
    const result = new FormData();

    keys.forEach(key => result.append(key, String(obj[key])));

    return result;
};
