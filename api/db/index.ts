import { Db, MongoClient } from 'mongodb';


export const getMongoDb = async (config: {[k: string]: string}): Promise<[Db, MongoClient]> => {
    const uri = `mongodb+srv://${config.user}:${config.pass}@${config.host}/${config.db}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri);

    await client.connect();

    return [client.db(), client];
};
