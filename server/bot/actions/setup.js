const {setConfig, getConfig} = require('../../resolvers/config');
const {mergeDeepRight} = require('ramda');


const ACTION_LIGHT_ONTIME = 'setup/light/ontime';

const ACTION_FAN_ONTIME = 'setup/fan/ontime';

const ACTION_LIGHT_DURATION = 'setup/light/duration';

const ACTION_FAN_DURATION = 'setup/fan/duration';

const ACTION_TEMPERATURE_THRESHOLD = 'setup/temperature_threshold';


const setLightOnTime = async ({db, controllerId, value = null}) => {
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, {
        light: {
            onTime: value,
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setFanOnTime = async ({db, controllerId, value = null}) => {
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, {
        fan: {
            onTime: value,
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setFanDuration = async ({db, controllerId, value = null}) => {
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, {
        fan: {
            duration: Number(value),
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setLightDuration = async ({db, controllerId, value = null}) => {
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, {
        light: {
            duration: Number(value),
        },
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};

const setTemperatureThreshold = async ({db, controllerId, value = null}) => {
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, {
        temperatureThreshold: Number(value),
    });

    const result = await setConfig(db, controllerId, updatedConfig);

    return result;
};


const actionHandler = async (action, context) => {
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
            return 'action is not supported';
    };
};


module.exports = {
    ACTION_LIGHT_ONTIME,
    ACTION_LIGHT_DURATION,
    ACTION_FAN_ONTIME,
    ACTION_FAN_DURATION,
    ACTION_TEMPERATURE_THRESHOLD,
    actionHandler,
}