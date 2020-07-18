const {getConfigEntity, extractConfig} = require('../helpers');
const {CONFIG_FIELDS} = require('../constants');


/**
 * updates config table with passed params
 * @param {Object} params 
 */
const setConfig = connection => params => new Promise((resolve, reject) => {
    const queryParams = extractConfig(params);
  
    connection.query('UPDATE config SET ?', queryParams, error => {
        if (!error) {
            return resolve({success: true});
        }
    
        return reject(error);
    });
});

/**
 * @returns {Promise<GarduinoConfig|Error>}
 */
const getConfig = connection => () => new Promise((resolve, reject) => {
    connection.query('SELECT ?? FROM config', [CONFIG_FIELDS], (error, results) => {
        if (!error) {
            const { lightCycleDurationMs, fanCycleDurationMs, lightCycleOnTime, fanCycleOnTime } = results[0];
            const light = getConfigEntity(lightCycleDurationMs, lightCycleOnTime);
            const fan = getConfigEntity(fanCycleDurationMs, fanCycleOnTime);

            return resolve({ light, fan });
        }

        return reject(error);
    });
});

module.exports = {
    getConfig,
    setConfig,
};