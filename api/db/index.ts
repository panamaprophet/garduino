import { getConfig } from '../config';
import { MongoClient } from 'mongodb';


let instance: MongoClient | null = null;


const getUri = ({ user, pass, host, db }: { [k: string]: string }) => `mongodb+srv://${user}:${pass}@${host}/${db}?retryWrites=true&w=majority`;

const createConnection = async (config: { [k: string]: string }) => MongoClient.connect(getUri(config));


export const getDb = async () => {
    if (!instance) {
        const { db } = getConfig();

        instance = await createConnection(db);
    }

    return instance.db();
};
