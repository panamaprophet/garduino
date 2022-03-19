import { Scenes, Context, Telegraf } from 'telegraf';
import { Db } from 'mongodb';
import { Readable } from 'stream';
import { WebSocket, WebSocketServer } from 'ws';
import koa from 'koa';


export type EventType = 'CONFIG' | 'UPDATE' | 'ERROR' | 'SWITCH' | 'RUN';

export interface EventData {
    key: string,
    value: string | number,
}

export interface LogEntityRaw {
    event: EventType,
    payload: EventData[],
}

export interface LogEntity {
    event: string,
    date: Date,
    payload: EventData[],
}

export interface SensorLogEntity {
    humidity: number,
    temperature: number,
    date: number,
}

export interface SensorLogEntityAggregated {
    dates: number[],
    temperature: number[],
    humidity: number[],
    maxHumidity: SensorLogEntity,
    minHumidity: SensorLogEntity,
    maxTemperature: SensorLogEntity,
    minTemperature: SensorLogEntity,
}

export interface ControllerEntity {
    controllerId: string,
}

export interface ConfigEntityRaw {
    duration: number,
    onTime: string,
}

export interface ConfigEntity {
    isOn: boolean,
    duration: number,
    msBeforeSwitch: number,
}

export interface ControllerConfigRaw {
    controllerId?: string,
    chatId?: number,
    light: ConfigEntityRaw,
    fan: ConfigEntityRaw,
    temperatureThreshold: number,
}

export interface StatusResponseError {
    controllerId: string,
    error: {
        message: string,
    },
}

export interface StatusResponseSuccess {
    controllerId: string,
    temperature: number,
    humidity: number,
    lastError: {
        payload: EventData[],
    },
    light: ConfigEntity,
    fan: ConfigEntity,
}

export type StatusResponse = StatusResponseError | StatusResponseSuccess;

export type ActionContext = {
    db: Db,
    chatId: number,
    controllerId: string,
    value?: string,
}

export type ActionResult = {
    text?: string,
    image?: Readable,
    success?: boolean,
}

// will be available under ctx.session[.prop]
export interface SceneSession extends Scenes.SceneSession<Scenes.WizardSessionData> {
    controllerId: string,
    action: string,
}

// will be available under ctx[.prop]
export interface BotContext extends Context {
    db: Db,
    ws: {
        ws: WebSocketServer,
        cache: Map<string, WebSocket>,
    },
    session: SceneSession,
    scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>,
    wizard: Scenes.WizardContextWizard<BotContext>,
}

export interface ICustomAppContext extends koa.Context {
    db: Db,
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
