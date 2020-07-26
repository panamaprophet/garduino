const getContext = request => ({
    db: request.app.locals.db,
    params: request.params,
    body: request.body,
    controllerId: request.params.controllerId,
});

const getSensorDataByKey = (haystack, needle) => haystack.filter(({key}) => key === needle);

module.exports = {
    getContext,
    getSensorDataByKey,
};