import { addController, removeController } from '../../../resolvers/controller';
import type { ActionContext } from 'types';


export const ACTION_CONTROLLER_ADD = 'setup/controller/add';

export const ACTION_CONTROLLER_REMOVE = 'setup/controller/remove';

export const DEFAULT_CONFIG = {
    chatId: -1,
    controllerId: '',
    light: {
        onTime: '09:00',
        duration: 43200000,
        temperatureThreshold: 35,
    },
};


const add = ({ chatId, controllerId }: ActionContext) => addController(controllerId, chatId, DEFAULT_CONFIG);

const remove = ({ chatId, controllerId }: ActionContext) => removeController(controllerId, chatId);

export const actionHandler = (action: string, context: ActionContext) => {
    switch (action) {
        case ACTION_CONTROLLER_ADD:
            return add(context);
        case ACTION_CONTROLLER_REMOVE:
            return remove(context);
        default:
            throw new Error(`action is not supported: ${String(action)}`);
    }
};
