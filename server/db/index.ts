import mongodb from 'mongodb';


export const getMongoClient = (config: Record<string, string>): Promise<mongodb.MongoClient> => {
    const uri = `mongodb+srv://${config.user}:${config.pass}@${config.host}/${config.db}?retryWrites=true&w=majority`;

    const client = new mongodb.MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    return client.connect();
};