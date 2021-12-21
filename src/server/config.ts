import {config} from 'dotenv';

config();


export const getConfig = (): Record<string, any> => ({
    db: {
        user: String(process.env.DB_USERNAME),
        pass: String(process.env.DB_PASSWORD),
        host: String(process.env.DB_HOSTNAME),
        db: String(process.env.DB_DATABASE),
    },
    bot: {
        token: String(process.env.BOT_TOKEN),
        path: String(process.env.BOT_PATH),
    },
    port: Number(process.env.SERVER_PORT),
    hostname: String(process.env.SERVER_HOSTNAME),
});