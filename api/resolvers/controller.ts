import { getDb } from '../db';
import { ControllerConfigRaw } from 'types';
import { WEBSOCKET_ACTIONS } from '../constants';


/**
 * @returns {Promise<String[]>}
 */
export const getControllerIds = (options = {}) =>
    getDb()
        .then(db => db.collection('config').find(options).project<{ controllerId: string }>({ controllerId: 1 }).toArray())
        .then(result => result || [])
        .then(result => result.map(({ controllerId }) => controllerId))
        .catch<string[]>(error => {
            console.error('getControllerIds', error);

            return [];
        });

export const addController = (
    controllerId: string,
    chatId: number,
    configuration: ControllerConfigRaw
) =>
    getDb()
        .then(db => db.collection('config').insertOne({ controllerId, chatId, ...configuration }))
        .then(() => ({ success: true }))
        .catch(error => {
            console.error('addController', error);

            return { success: false };
        });

export const removeController = (controllerId: string, chatId: number) =>
    getDb()
        .then(db => db.collection('config').deleteOne({ controllerId, chatId }))
        .then(() => ({ success: true }))
        .catch(error => {
            console.error('removeController', error);

            return { success: false };
        });

export const rebootController = (controllerId: string, ws: WebSocket): { success: boolean } => {
    ws.send(JSON.stringify({
        action: WEBSOCKET_ACTIONS.REBOOT,
        payload: { controllerId },
    }));

    // @todo: fix with actual response
    return { success: true };
};

export const updateControllerConfiguration = (controllerId: string, changes: ControllerConfigRaw) =>
    getDb()
        .then(db => db.collection('config').findOneAndUpdate({ controllerId }, { $set: changes }))
        .then(response => ({ success: Boolean(response.ok) }))
        .catch(error => {
            console.error('updateControllerConfiguration', error);

            return { success: false };
        });

export const getControllerConfiguration = (controllerId: string) =>
    getDb()
        .then(db => db.collection('config').findOne<ControllerConfigRaw>({ controllerId }))
        .catch(error => {
            console.error('getConfig', error);

            return null;
        });

