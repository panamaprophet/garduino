const getContext = request => ({
    db: request.app.locals.db,
    params: request.params,
    body: request.body,
    controllerId: request.params.controllerId,
});

const getSensorDataByKey = (haystack, needle) => haystack.filter(({key}) => key === needle);

const range = (from, to, step = 1) => {
    const result = [];

    for (let i = from; i <= to; i += step) {
        result.push(i);
    }

    return result;
};

const reduceItemsCountBy = (items, limit) => {
    if (items.length <= limit) {
        return items;
    }

    const result = items.filter((item, index) => index % limit === 0);

    return result;
};

// function distributedCopy(items, n) {
//     const result = [items[0]];
//     const totalItems = items.length - 2;
//     const interval = Math.floor(totalItems / (n - 2));
//
//     for (let i = 1; i < n - 1; i++) {
//         result.push(items[i * interval]);
//     }
//
//     result.push(items[items.length - 1]);
//
//     return result;
// }

module.exports = {
    getContext,
    getSensorDataByKey,
    range,
    reduceItemsCountBy,
};