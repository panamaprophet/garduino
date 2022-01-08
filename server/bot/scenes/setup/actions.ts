import {mergeDeepRight} from 'ramda';
import {setConfig, getConfig} from '../../../resolvers/config';
import {ActionContext, ActionResult, ControllerConfigRaw} from 'types';


export const ACTION_LIGHT_ONTIME = 'setup/light/ontime';

export const ACTION_FAN_ONTIME = 'setup/fan/ontime';

export const ACTION_LIGHT_DURATION = 'setup/light/duration';

export const ACTION_FAN_DURATION = 'setup/fan/duration';

export const ACTION_TEMPERATURE_THRESHOLD = 'setup/temperature_threshold';


type PartialControllerConfig = {
    light?: {
        onTime?: string,
        duration?: number,
    },
    fan?: {
        onTime?: string,
        duration?: number,
    },
    temperatureThreshold?: number,
}


const setLightOnTime = async ({db, controllerId, value}: ActionContext): Promise<ActionResult> => {
    const currentConfig = await getConfig(db, controllerId);

    if (!currentConfig) {
        return {success: false};
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
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

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
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

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
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

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
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

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
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
    }
};