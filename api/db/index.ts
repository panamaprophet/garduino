import mongodb from 'mongodb';


export const getMongoDb = async (config: {[k: string]: string}): Promise<[mongodb.Db, mongodb.MongoClient]> => {
    const uri = `mongodb+srv://${config.user}:${config.pass}@${config.host}/${config.db}?retryWrites=true&w=majority`;
    const client = new mongodb.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    await client.connect();

    return [client.db(), client];
};