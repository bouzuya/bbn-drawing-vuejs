import { State } from './type';
import { newMessageBus as newBus } from './bus';

export type Message = Command | Event;

export type Command = CheckCommand | DecrementCommand | IncrementCommand;

export interface CheckCommand {
  type: 'check';
}

export interface DecrementCommand {
  type: 'decrement';
  week: string;
}

export interface IncrementCommand {
  type: 'increment';
  week: string;
}

export type Event = CheckedEvent | UpdatedEvent;

export interface CheckedEvent {
  type: 'checked';
  isValid: boolean;
}

export interface UpdatedEvent {
  type: 'updated';
  state: State;
}

export type Listener = (event: Event) => void;
export type Handler = (message: Message) => Message | undefined;
export type Publish = (message: Message) => void;
export type Subscribe = (listener: Listener) => Unsubscribe;
export type Unsubscribe = () => void;
export type Handle = (handler: Handler) => Unhandle;
export type Unhandle = () => void;
export type MessageBus = {
  publish: Publish; subscribe: Subscribe; handle: Handle;
};

const checkCommand = (): CheckCommand => {
  return { type: 'check' };
};

const decrementCommand = (week: string): DecrementCommand => {
  return { type: 'decrement', week };
};

const incrementCommand = (week: string): IncrementCommand => {
  return { type: 'increment', week };
};

const isCommand = (message: Message): message is Command => {
  return message.type === 'check' ||
    message.type === 'decrement' ||
    message.type === 'increment';
};

const checkedEvent = (isValid: boolean): CheckedEvent => {
  return { type: 'checked', isValid };
};

const updatedEvent = (state: State): UpdatedEvent => {
  return { type: 'updated', state };
};

const isEvent = (message: Message): message is Event => {
  return !isCommand(message);
};

const newMessageBus = (): MessageBus => {
  const bus = newBus();
  const handle = (handler: Handler): Unhandle => {
    return bus.subscribe((message) => {
      // TODO: async
      const result = handler(<Message>message);
      if (typeof result !== 'undefined') {
        bus.publish(result);
      }
    });
  };
  const publish: Publish = (message: Message): void => {
    bus.publish(message);
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

export {
  newMessageBus,
  checkCommand, decrementCommand, incrementCommand,
  checkedEvent, updatedEvent
};
