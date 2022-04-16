import { getDb } from '../db';
import { ControllerConfigRaw, ControllerEntity } from 'types';
import { WEBSOCKET_ACTIONS } from '../constants';


/**
 * @returns {Promise<String[]>}
 */
export const getControllerIds = (options = {}) =>
    getDb()
        .then(db => db.collection('config').find<ControllerEntity>(options).project({ controllerId: 1 }).toArray())
        .then(result => result || [])
        .then(result => result.map<string>(({ controllerId }) => controllerId))
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
