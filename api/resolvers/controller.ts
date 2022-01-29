import mongodb from 'mongodb';
import {ControllerConfigRaw, ControllerEntity} from 'types';
import {WEBSOCKET_ACTIONS} from '../constants';

/**
 * @returns {Promise<String[]>}
 */
export const getControllerIds = async (db: mongodb.Db, options = {}): Promise<string[]> => {
    const result = await db.collection('config').find<ControllerEntity>(options).project({controllerId: 1}).toArray();

    if (!result) {
        return [];
    }

    return result.map(({controllerId}) => controllerId);
};

export const addController = async (db: mongodb.Db, controllerId: string, chatId: number, configuration: ControllerConfigRaw): Promise<{success: boolean}> => {
    const {result} = await db.collection('config').insertOne({
        controllerId,
        chatId,
        ...configuration,
    });

    return {
        success: Boolean(result.ok),
    };
};

export const removeController = async (db: mongodb.Db, controllerId: string, chatId: number): Promise<{success: boolean}> => {
    const {result} = await db.collection('config').deleteOne({controllerId, chatId});

    return {
        success: Boolean(result.ok),
    };
};

export const rebootController = async (controllerId: string, ws: WebSocket): Promise<{success: boolean}> => {
    ws.send(JSON.stringify({
        action: WEBSOCKET_ACTIONS.REBOOT,
        payload: { controllerId },
    }));

    // @todo: fix with actual response
    return { success: true };
};