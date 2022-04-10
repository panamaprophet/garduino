import mongodb from 'mongodb';
import { ControllerConfigRaw, ControllerEntity } from 'types';
import { WEBSOCKET_ACTIONS } from '../constants';

/**
 * @returns {Promise<String[]>}
 */
export const getControllerIds = async (db: mongodb.Db, options = {}): Promise<string[]> => {
    const result = await db.collection('config').find<ControllerEntity>(options).project({ controllerId: 1 }).toArray();

    if (!result) {
        return [];
    }

    return result.map(({ controllerId }) => controllerId);
};

export const addController = async (
    db: mongodb.Db,
    controllerId: string,
    chatId: number,
    configuration: ControllerConfigRaw
): Promise<{
    error?: Error,
    success: boolean,
}> => {
    return db
        .collection('config').insertOne({
            controllerId,
            chatId,
            ...configuration,
        })
        .then(() => ({ success: true }))
        .catch((error: Error) => ({ error, success: false }));
};

export const removeController = async (db: mongodb.Db, controllerId: string, chatId: number): Promise<{ error?: Error, success: boolean }> => {
    return db
        .collection('config')
        .deleteOne({ controllerId, chatId })
        .then(() => ({ success: true }))
        .catch((error: Error) => ({ error, success: false }));
};

export const rebootController = (controllerId: string, ws: WebSocket): { success: boolean } => {
    ws.send(JSON.stringify({
        action: WEBSOCKET_ACTIONS.REBOOT,
        payload: { controllerId },
    }));

    // @todo: fix with actual response
    return { success: true };
};
