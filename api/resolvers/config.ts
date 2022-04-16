import { getDb } from '../db';
import { ControllerConfigRaw } from 'types';


export const setConfig = (controllerId: string, changes: ControllerConfigRaw) =>
    getDb()
        .then(db => db.collection('config').findOneAndUpdate({ controllerId }, { $set: changes }))
        .then(response => ({ success: Boolean(response.ok) }))
        .catch(error => {
            console.error('setConfig', error);

            return { success: false };
        });

export const getConfig = (controllerId: string) =>
    getDb()
        .then(db => db.collection('config').findOne<ControllerConfigRaw>({ controllerId }))
        .catch(error => {
            console.error('getConfig', error);

            return null;
        });
