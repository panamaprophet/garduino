import {addController, removeController} from '../../../resolvers/controller';
import {DEFAULT_CONFIG} from '../../../constants';

import type {ActionContext, ActionResult} from '../../index';


export const ACTION_CONTROLLER_ADD: string = 'setup/controller/add';

export const ACTION_CONTROLLER_REMOVE: string = 'setup/controller/remove';


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