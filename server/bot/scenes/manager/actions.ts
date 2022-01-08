import {addController, removeController} from '../../../resolvers/controller';
import type {ActionContext, ActionResult, ControllerConfigRaw} from 'types';


export const ACTION_CONTROLLER_ADD = 'setup/controller/add';

export const ACTION_CONTROLLER_REMOVE = 'setup/controller/remove';

export const DEFAULT_CONFIG: ControllerConfigRaw = {
    light: {
        onTime: '09:00',
        duration: 43200000,
    },
    fan: {
        onTime: '09:00',
        duration: 43200000,
    },
    temperatureThreshold: 35,
};


const add = async ({db, chatId, controllerId}: ActionContext): Promise<ActionResult> => addController(db, controllerId, chatId, DEFAULT_CONFIG);

const remove = async ({db, chatId, controllerId}: ActionContext): Promise<ActionResult> => removeController(db, controllerId, chatId);

export const actionHandler = async (action: string | undefined, context: ActionContext):  Promise<ActionResult> => {
    switch (action) {
        case ACTION_CONTROLLER_ADD:
            return await add(context);
        case ACTION_CONTROLLER_REMOVE:
            return await remove(context);
        default:
            return {
                text: 'action is not supported',
            };
    }
};