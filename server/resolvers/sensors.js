const FIELDS = ['timestamp', 'humidity', 'temperature'];


/**
 * @returns {Promise<GarduinoDataEntry|Error>}
 */
const getLastAvailableData = connection => () => new Promise((resolve, reject) => {
    connection.query('SELECT ?? from data ORDER BY timestamp DESC LIMIT 1', [FIELDS],(error, results) => {
        if (!error) {
            const { temperature, humidity, timestamp } = results[0];

            return resolve({
            humidity,
            temperature,
            timestamp,
            });
        }

        return reject(error);
    });
});
  
/**
 * @returns {Promise<Object|Error>}
 */
const addData = connection => ({humidity, temperature}) => new Promise((resolve, reject) => {
    connection.query('INSERT INTO data SET ?', {humidity, temperature}, error => {
        if (!error) {
            return resolve({success: true});
        }

        return reject(error);
    });
});


module.exports = {
    addData,
    getLastAvailableData,
};