/**
 * @returns {Array<String>}
 */
const getControllerIds = async db => {
    const result = await db.collection('config').find({}).project({controllerId: 1}).toArray();
    const controllerIds = result.map(({controllerId}) => controllerId);

    return controllerIds;
};


module.exports = {
    getControllerIds,
}