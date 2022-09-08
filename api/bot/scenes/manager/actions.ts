import { addController, removeController } from '../../../resolvers/controller';
import type { ActionContext, ControllerConfigRaw } from 'types';


export const ACTION_CONTROLLER_ADD = 'setup/controller/add';

export const ACTION_CONTROLLER_REMOVE = 'setup/controller/remove';

export const DEFAULT_CONFIG: ControllerConfigRaw = {
    light: {
        onTime: '09:00',
        duration: 43200000,
        temperatureThreshold: 35,
    },
};


const add = ({ chatId, controllerId }: ActionContext) => addController(controllerId, chatId, DEFAULT_CONFIG);

const remove = ({ chatId, controllerId }: ActionContext) => removeController(controllerId, chatId);

export const actionHandler = (action: string | undefined, context: ActionContext) => {
    switch (action) {
        case ACTION_CONTROLLER_ADD:
            return add(context);
        case ACTION_CONTROLLER_REMOVE:
            return remove(context);
        default:
            return {
                success: false,
                text: 'action is not supported',
            };
    }
};
