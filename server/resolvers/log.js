const {
    getLogEntry,
} = require('../helpers/log');

const {
    whereFromObject,
} = require('../helpers');


const DEFAULT_FIELDS = ['type', 'source', 'event', 'timestamp', 'payload'];


const getLog = 
    connection => 
        async (criteria = null, fields = DEFAULT_FIELDS) => new Promise((resolve, reject) => {
            const where = where && ` WHERE ${whereFromObject(criteria)}`;

            connection.query('SELECT ?? FROM log ' + (where || '') + ' ORDER BY timestamp DESC LIMIT 1', [fields], (error, results) => {
                if (!error) {
                    return resolve(results[0]);
                }

                return reject(error);
            });
        });

const saveLog = 
    connection => 
        data => new Promise((resolve, reject) => {
            const log = getLogEntry(data);

            if (!log) {
                return reject({success: false});
            }
            
            connection.query('INSERT INTO log SET ?', log, (error, result) => {
                if (!error) {
                    return resolve({success: true});
                }

                return reject(error);
            });
        });


module.exports = {
    getLog,
    saveLog,
};