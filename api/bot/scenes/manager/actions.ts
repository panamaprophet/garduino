import { addController, removeController } from '../../../resolvers/controller';
import type { ActionContext, ActionResult, ControllerConfigRaw } from 'types';


export const ACTION_CONTROLLER_ADD = 'setup/controller/add';

export const ACTION_CONTROLLER_REMOVE = 'setup/controller/remove';

export const DEFAULT_CONFIG: ControllerConfigRaw = {
    light: {
        onTime: '09:00',
        duration: 43200000,
    },
    temperatureThreshold: 35,
};


const add = async ({ chatId, controllerId }: ActionContext): Promise<ActionResult> => addController(controllerId, chatId, DEFAULT_CONFIG);

const remove = async ({ chatId, controllerId }: ActionContext): Promise<ActionResult> => removeController(controllerId, chatId);

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
