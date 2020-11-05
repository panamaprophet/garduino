import {mergeDeepRight} from 'ramda';
import {setConfig, getConfig} from '../../../resolvers/config';

import type {ActionContext, ActionResult} from '../../index';
import type {ControllerConfigRaw} from '../../../helpers/config';


export const ACTION_LIGHT_ONTIME: string = 'setup/light/ontime';

export const ACTION_FAN_ONTIME: string = 'setup/fan/ontime';

export const ACTION_LIGHT_DURATION: string = 'setup/light/duration';

export const ACTION_FAN_DURATION: string = 'setup/fan/duration';

export const ACTION_TEMPERATURE_THRESHOLD: string = 'setup/temperature_threshold';


const setLightOnTime = async ({db, controllerId, value}: ActionContext): Promise<ActionResult> => {
    const currentConfig = await getConfig(db, controllerId);

    if (!currentConfig) {
        return {success: false};
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, object>(currentConfig, {
        light: {
            onTime: value,
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setFanOnTime = async ({db, controllerId, value}: ActionContext): Promise<ActionResult> => {
    const currentConfig = await getConfig(db, controllerId);

    if (!currentConfig) {
        return {success: false};
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, object>(currentConfig, {
        fan: {
            onTime: value,
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setFanDuration = async ({db, controllerId, value}: ActionContext): Promise<ActionResult> => {
    const currentConfig = await getConfig(db, controllerId);

    if (!currentConfig) {
        return {success: false};
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, object>(currentConfig, {
        fan: {
            duration: Number(value),
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setLightDuration = async ({db, controllerId, value}: ActionContext): Promise<ActionResult> => {
    const currentConfig = await getConfig(db, controllerId);

    if (!currentConfig) {
        return {success: false};
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, object>(currentConfig, {
        light: {
            duration: Number(value),
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setTemperatureThreshold = async ({db, controllerId, value}: ActionContext): Promise<ActionResult> => {
    const currentConfig = await getConfig(db, controllerId);

    if (!currentConfig) {
        return {success: false};
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, object>(currentConfig, {
        temperatureThreshold: Number(value),
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};


export const actionHandler = async (action: string | undefined, context: ActionContext): Promise<ActionResult> => {
    switch (action) {
        case ACTION_LIGHT_ONTIME:
            return await setLightOnTime(context);
        case ACTION_LIGHT_DURATION:
            return await setLightDuration(context);
        case ACTION_FAN_ONTIME:
            return await setFanOnTime(context);
        case ACTION_FAN_DURATION:
            return await setFanDuration(context);
        case ACTION_TEMPERATURE_THRESHOLD:
            return await setTemperatureThreshold(context);
        default:
            return {
                text: 'action is not supported',
            };
    };
};