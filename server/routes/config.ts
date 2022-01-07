import Router from '@koa/router';
import {mergeDeepRight} from 'ramda';
import {getConfig, setConfig} from '../resolvers/config';
import {extractConfig, getConfigEntity} from '../helpers/config';
import {ControllerConfigRaw} from 'types';


const router = new Router();

router.get('/', async (ctx) => {
    const {controllerId} = ctx.params;
    const controllerConfig = await getConfig(ctx.db, controllerId);

    if (!controllerConfig) {
        ctx.body = {success: false};
        return;
    }

    const {temperatureThreshold, ...config} = controllerConfig;
    const light = getConfigEntity(config.light);
    const fan = getConfigEntity(config.fan);

    ctx.body = {light, fan, temperatureThreshold};
});

router.post('/', async (ctx) => {
    const {controllerId} = ctx.params;
    const updatedParams = extractConfig<ControllerConfigRaw>(ctx.request.body) || {};
    const currentConfig = await getConfig(ctx.db, controllerId);

    if (!currentConfig) {
        ctx.body = {success: false};
        return;
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, ControllerConfigRaw>(currentConfig, updatedParams);
    const result = await setConfig(ctx.db, controllerId, updatedConfig);

    ctx.body = result;
});


export default router;