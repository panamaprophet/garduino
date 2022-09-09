import { getDb } from '../db';
import { ControllerConfigRaw } from 'types';
import { WEBSOCKET_ACTIONS } from '../constants';
import { mapDataToControllerConfiguration } from 'helpers/validation';
import { flattenObject, returnDefault } from 'helpers';


export const getControllerIds = (options = {}) => {
    return getDb()
        .then(db => db.collection('config').find(options).project<{ controllerId: string }>({ controllerId: 1 }).toArray())
        .then(result => result || [])
        .then(result => result.map(({ controllerId }) => controllerId))
        .catch(returnDefault([]));
};

export const addController = (controllerId: string, chatId: number, configuration: ControllerConfigRaw) => {
    return getDb()
        .then(db => db.collection('config').insertOne({ controllerId, chatId, ...configuration }))
        .then(() => ({ success: true }))
        .catch(returnDefault({ success: false }));
};

export const removeController = (controllerId: string, chatId: number) => {
    return getDb()
        .then(db => db.collection('config').deleteOne({ controllerId, chatId }))
        .then(() => ({ success: true }))
        .catch(returnDefault({ success: false }));
};

export const rebootController = (controllerId: string, ws: WebSocket): { success: boolean } => {
    ws.send(JSON.stringify({
        action: WEBSOCKET_ACTIONS.REBOOT,
        payload: { controllerId },
    }));

    // @todo: fix with actual response
    return { success: true };
};

export const updateControllerConfiguration = (controllerId: string, changes: { [k: string]: unknown }) => {
    return getDb()
        .then(db => db.collection('config').findOneAndUpdate({ controllerId }, { $set: flattenObject(changes) }))
        .then(response => ({ success: Boolean(response.ok) }))
        .catch(returnDefault({ success: false }));
};

export const getControllerConfiguration = (controllerId: string) => {
    return getDb()
        .then(db => db.collection('config').findOne({ controllerId }))
        .then(mapDataToControllerConfiguration)
        .catch(returnDefault(null));
};
