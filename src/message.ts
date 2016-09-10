import { EventEmitter } from 'events';
import { Work } from './type';

export type Message = Command | Event;

export type Command = DecrementCommand | IncrementCommand;

export interface DecrementCommand {
  type: 'decrement';
  week: string;
}

export interface IncrementCommand {
  type: 'increment';
  week: string;
}

export type Event = UpdatedEvent;

export interface UpdatedEvent {
  type: 'updated';
  state: { works: Work[]; };
}

export type Listener = (event: Event) => void;
export type Handler = (message: Message) => Message | undefined;
export type Publish = (command: Command) => void;
export type Subscribe = (listener: Listener) => Unsubscribe;
export type Unsubscribe = () => void;
export type Handle = (handler: Handler) => Unhandle;
export type Unhandle = () => void;
export type MessageBus = {
  publish: Publish; subscribe: Subscribe; handle: Handle;
};

const decrementCommand = (week: string): DecrementCommand => {
  return { type: 'decrement', week };
};

const incrementCommand = (week: string): IncrementCommand => {
  return { type: 'increment', week };
};

const isCommand = (message: Message): message is Command => {
  return message.type === 'decrement' || message.type === 'increment';
};

const isEvent = (message: Message): message is Event => {
  return !isCommand(message);
};

const newMessageBus = (): MessageBus => {
  const subject = new EventEmitter();
  const handle = (handler: Handler): Unhandle => {
    const l = (message: Message) => {
      // TODO: async
      const result = handler(message);
      if (typeof result !== 'undefined') {
        // TODO: nextTick
        setTimeout(() => void subject.emit('data', result));
      }
    };
    subject.on('data', l);
    return () => void subject.removeListener('data', l);
  };
  const publish: Publish = (command: Command): void => {
    subject.emit('data', command);
  };
  const subscribe: Subscribe = (
    listener: (event: Event) => void
  ): Unsubscribe => {
    return handle((message) => {
      return isEvent(message) ? void listener(message) : void 0;
    });
  };
  return { publish, subscribe, handle };
};

export { decrementCommand, incrementCommand, newMessageBus };
