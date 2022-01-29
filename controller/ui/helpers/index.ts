export const getFormData = (obj: {[k: string]: string}): FormData => 
    Object
        .keys(obj)
        .reduce((result, key) => {
            result.append(key, obj[key]);
            return result;
        }, new FormData());