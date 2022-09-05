import { mergeDeepRight } from 'ramda';
import { setConfig, getConfig } from '../../../resolvers/config';
import { ActionContext, ControllerConfigRaw } from 'types';


export const ACTION_LIGHT_ONTIME = 'setup/light/ontime';

export const ACTION_LIGHT_DURATION = 'setup/light/duration';

export const ACTION_TEMPERATURE_THRESHOLD = 'setup/temperature_threshold';


type PartialControllerConfig = {
    light?: {
        onTime?: string,
        duration?: number,
    },
    temperatureThreshold?: number,
}


const setLightOnTime = async ({ controllerId, value }: ActionContext) => {
    const currentConfig = await getConfig(controllerId);

    if (!currentConfig) {
        return { success: false };
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
        light: {
            onTime: value,
        },
    });

    return setConfig(controllerId, updatedConfig);
};

const setLightDuration = async ({ controllerId, value }: ActionContext) => {
    const currentConfig = await getConfig(controllerId);

    if (!currentConfig) {
        return { success: false };
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(currentConfig, {
        light: {
            duration: Number(value),
        },
    });

    return setConfig(controllerId, updatedConfig);
};

const setTemperatureThreshold = async ({ controllerId, value }: ActionContext) => {
    const currentConfig = await getConfig(controllerId);

    if (!currentConfig) {
        return { success: false };
    }

    const updatedConfig = mergeDeepRight<ControllerConfigRaw, PartialControllerConfig>(
        currentConfig,
        { temperatureThreshold: Number(value) }
    );

    return setConfig(controllerId, updatedConfig);
};


export const actionHandler = (action: string | undefined, context: ActionContext) => {
    switch (action) {
        case ACTION_LIGHT_ONTIME:
            return setLightOnTime(context);
        case ACTION_LIGHT_DURATION:
            return setLightDuration(context);
        case ACTION_TEMPERATURE_THRESHOLD:
            return setTemperatureThreshold(context);
        default:
            return {
                success: false,
                text: 'action is not supported',
            };
    }
};
