import { ActionContext } from 'types';
import { updateControllerConfiguration } from 'resolvers/controller';


export const ACTION_LIGHT_ONTIME = 'setup/light/ontime';

export const ACTION_LIGHT_DURATION = 'setup/light/duration';

export const ACTION_TEMPERATURE_THRESHOLD = 'setup/temperature_threshold';


const setLightOnTime = async ({ controllerId, value }: ActionContext) =>
    updateControllerConfiguration(controllerId, { light: { onTime: String(value) } });

const setLightDuration = ({ controllerId, value }: ActionContext) =>
    updateControllerConfiguration(controllerId, { light: { duration: Number(value) } });

const setTemperatureThreshold = ({ controllerId, value }: ActionContext) =>
    updateControllerConfiguration(controllerId, { light: { temperatureThreshold: Number(value) } });


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
