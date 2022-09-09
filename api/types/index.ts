import { Scenes, Context, Telegraf } from 'telegraf';
import { WebSocket, WebSocketServer } from 'ws';
import koa from 'koa';


type ErrorEventPayload = { error: string };

type RunEventPayload = { isLightOn: boolean };

type SwitchEventPayload = { isLightOn: boolean, isEmergencySwitch: boolean };

type UpdateEventPayload = { humidity: number, temperature: number };


export type ControllerEventPayload = ErrorEventPayload | RunEventPayload | SwitchEventPayload | UpdateEventPayload;


export interface ControllerEvent {
    controllerId: string,
    date: Date,
    event: string,
    payload: ControllerEventPayload,
}

export interface ModuleConfiguration {
    isOn: boolean,
    duration: number,
    msBeforeSwitch: number,
}

export interface ModuleConfigurationSerialized {
    onTime: string,
    duration: number,
    temperatureThreshold: number,
}

export interface ControllerStatus {
    temperature: number,
    humidity: number,
    lastError: string,
    light: ModuleConfiguration,
}

export interface ControllerConfigurationSerialized {
    controllerId: string,
    chatId: number,
    light: ModuleConfigurationSerialized,
}


export type ActionContext = {
    chatId: number,
    controllerId: string,
    value?: string,
}

// will be available under ctx.session[.prop]
export interface SceneSession extends Scenes.SceneSession<Scenes.WizardSessionData> {
    controllerId: string,
    action: string,
}

// will be available under ctx[.prop]
export interface BotContext extends Context {
    ws: {
        ws: WebSocketServer,
        cache: Map<string, WebSocket>,
    },
    session: SceneSession,
    scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>,
    wizard: Scenes.WizardContextWizard<BotContext>,
}

export interface ICustomAppContext extends koa.Context {
    bot: Telegraf<BotContext>,
    ws: {
        ws: WebSocketServer,
        cache: Map<string, WebSocket>,
    },
    params: {
        controllerId: string,
    },
}

export type ICustomAppState = koa.DefaultState
