import mongodb from 'mongodb';
import {ControllerConfigRaw} from 'types';


export const setConfig = async (db: mongodb.Db, controllerId: string, updatedParams: ControllerConfigRaw): Promise<{success: boolean}> => {
    const {ok} = await db.collection('config').findOneAndUpdate({controllerId}, {$set: updatedParams});

    return {
        success: Boolean(ok),
    };
};

export const getConfig = async (db: mongodb.Db, controllerId: string): Promise<ControllerConfigRaw | null> => {
    const config = await db.collection('config').findOne<ControllerConfigRaw>({controllerId});

    return config;
};