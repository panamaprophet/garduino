import { mapDataToModuleConfiguration } from "./validation";


const suite = {
    'onTime 21:00 should return 9 hours before off for current time 00:00': () => {
        const referenceDate = new Date('2022-01-01 00:00:00Z');
        const config = {
            duration: 12 * 60 * 60 * 1000,
            onTime: '21:00',
        };

        const result = mapDataToModuleConfiguration(config, referenceDate);
        const expected = {
            msBeforeSwitch: 9 * 60 * 60 * 1000,
            isOn: true,
        };

        return expected.msBeforeSwitch === result.msBeforeSwitch && expected.isOn === result.isOn;
    },
    'onTime 09:00 should return 9 hours before on for current time 00:00': () => {
        const referenceDate = new Date('2022-01-01 00:00:00Z');
        const config = {
            duration: 12 * 60 * 60 * 1000,
            onTime: '09:00',
        };

        const result = mapDataToModuleConfiguration(config, referenceDate);
        const expected = {
            msBeforeSwitch: 9 * 60 * 60 * 1000,
            isOn: false,
        };

        return expected.msBeforeSwitch === result.msBeforeSwitch && expected.isOn === result.isOn;
    },
    'onTime 00:00 should return 12 hours before off for current time 00:00': () => {
        const referenceDate = new Date('2022-01-01 00:00:00Z');
        const config = {
            duration: 12 * 60 * 60 * 1000,
            onTime: '00:00',
        };

        const result = mapDataToModuleConfiguration(config, referenceDate);
        const expected = {
            msBeforeSwitch: 12 * 60 * 60 * 1000,
            isOn: true,
        };

        return expected.msBeforeSwitch === result.msBeforeSwitch && expected.isOn === result.isOn;
    },
};

Object
    .entries(suite)
    .forEach(([
        description,
        test,
    ]) => console.log(description, '=', test()));
