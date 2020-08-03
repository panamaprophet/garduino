const {parse, addMilliseconds, compareDesc, differenceInMilliseconds} = require('date-fns');
const {identity} = require('ramda');


const getConfigEntity = ({duration, onTime: onTimeString}) => {
    const currentDate = Date.now();
    const onTime = parse(onTimeString, 'HH:mm', currentDate);
    const offTime = addMilliseconds(onTime, duration);
    const isOn = compareDesc(onTime, currentDate) >= 0 && compareDesc(offTime, currentDate) < 0;
    const msBeforeSwitch = differenceInMilliseconds(isOn ? offTime : onTime, currentDate);

    return {
        isOn,
        duration,
        msBeforeSwitch,
    };
};

// @todo: add validation
const extractConfig = data => identity(data);

const flattenConfig = ({light, fan}) => ({
    isLightOn: light.isOn,
    lightCycleDurationMs: light.duration,
    msBeforeLightSwitch: light.msBeforeSwitch,
    isFanOn: fan.isOn,
    fanCycleDurationMs: fan.duration,
    msBeforeFanSwitch: fan.msBeforeSwitch,
});


module.exports = {
    getConfigEntity,
    flattenConfig,
    extractConfig,
};