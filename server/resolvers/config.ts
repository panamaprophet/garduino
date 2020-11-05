import mongodb from 'mongodb';

import type {ControllerConfigRaw} from '../helpers/config';


export const setConfig = async (db: mongodb.Db, controllerId: string, updatedParams: ControllerConfigRaw): Promise<any> => {
    const {ok} = await db.collection('config').findOneAndUpdate({controllerId}, {$set: updatedParams});

    return {
        success: Boolean(ok),
    };
};

export const getConfig = async (db: mongodb.Db, controllerId: string): Promise<ControllerConfigRaw> => {
    const config = await db.collection('config').findOne({controllerId});

    return config;
};