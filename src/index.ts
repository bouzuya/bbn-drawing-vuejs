import * as Vue from 'vue';
import { CookieStorage } from 'cookie-storage';
import { diff, applyChange } from 'deep-diff';
import { EventEmitter } from 'events';
import { Ratings, Work } from './type';

// store

const loadRatings = (storage: CookieStorage): Ratings => {
  const ratingsJsonOrNull = storage.getItem('ratings');
  const ratingsJson = ratingsJsonOrNull === null
    ? '{}' : ratingsJsonOrNull;
  const ratings = <Ratings>JSON.parse(ratingsJson);
  return ratings;
};

const saveRatings = (storage: CookieStorage, ratings: Ratings): void => {
  storage.setItem('ratings', JSON.stringify(ratings));
};

const toWorks = (weeks: string[], ratings: Ratings): Work[] => {
  const works = weeks.map<Work>((week) => {
    const work = {
      rating: typeof ratings[week] === 'undefined' ? 0 : ratings[week],
      week
    };
    return work;
  });
  return works;
};

const toRatings = (works: Work[]): Ratings => {
  return works.reduce((ratings, work) => {
    ratings[work.week] = work.rating;
    return ratings;
  }, <Ratings>{});
};

// message

type Message = Command | Event;

type Command = DecrementCommand | IncrementCommand;

interface DecrementCommand {
  type: 'decrement';
  week: string;
}

interface IncrementCommand {
  type: 'increment';
  week: string;
}

type Event = UpdatedEvent;

interface UpdatedEvent {
  type: 'updated';
  state: { works: Work[]; };
}

type Listener = (event: Event) => void;
type Handler = (message: Message) => Message | undefined;
type Publish = (command: Command) => void;
type Subscribe = (listener: Listener) => Unsubscribe;
type Unsubscribe = () => void;
type Handle = (handler: Handler) => Unhandle;
type Unhandle = () => void;
type MessageBus = {
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

// model

type State = { works: Work[]; };

const decrement = (state: State, week: string): State => {
  const { works } = state;
  const index = works.findIndex((work) => work.week === week);
  if (index < 0) return state;
  const oldWork = works[index];
  const newWork = Object.assign({}, oldWork, { rating: oldWork.rating - 1 });
  const newWorks = works
    .slice(0, index).concat(newWork, works.slice(index + 1));
  return Object.assign({}, state, { works: newWorks });
};

const increment = (state: State, week: string): State => {
  const { works } = state;
  const index = works.findIndex((work) => work.week === week);
  if (index < 0) return state;
  const oldWork = works[index];
  const newWork = Object.assign({}, oldWork, { rating: oldWork.rating + 1 });
  const newWorks = works
    .slice(0, index).concat(newWork, works.slice(index + 1));
  return Object.assign({}, state, { works: newWorks });
};

const newModel = (handle: Handle, initialState: State): any => {
  // FIXME: let
  let state = initialState;

  const removeCommandHandler = handle((message) => {
    if (message.type === 'decrement') {
      const newState = decrement(state, message.week);
      return { type: 'updated', state: newState };
    } else if (message.type === 'increment') {
      const newState = increment(state, message.week);
      return { type: 'updated', state: newState };
    } else {
      return void 0;
    }
  });

  const removeEventHandler = handle((message) => {
    if (message.type === 'updated') {
      state = message.state;
    }
    return void 0;
  });

  // for DEBUG
  const removeLogHandler = handle((message) => {
    return void console.log(message);
  });

  return () => {
    removeCommandHandler();
    removeEventHandler();
    removeLogHandler();
  };
};

// view
const merge = (target: any, source: any): void => {
  const patches = diff(target, source);
  if (typeof patches === 'undefined') return;
  patches.forEach((patch: any) => applyChange(target, source, patch));
};

const mountNewWorkVM = (state: Work, pub: Publish, sub: Function) => {
  return new Vue({
    el: `.work-${state.week}`,
    data: { state },
    ready(this: { unsubscribe: Function; state: Work; }): void {
      this.unsubscribe = sub((event: Event) => {
        if (event.type === 'updated') {
          const newState =
            event.state.works.find((w: Work) => w.week === this.state.week);
          merge(this.state, newState);
        }
      });
    },
    destroyed(this: { unsubscribe: Function; }): void {
      if (typeof this.unsubscribe !== 'undefined') this.unsubscribe();
    },
    methods: {
      decrement(this: { state: Work; }): void {
        pub(decrementCommand(this.state.week));
      },
      increment(this: { state: Work; }): void {
        pub(incrementCommand(this.state.week));
      }
    }
  });
};

const main = () => {
  const storage = new CookieStorage();
  const ratings = loadRatings(storage);
  const weeks = [
    '2016-W31',
    '2016-W32'
  ];
  const works = toWorks(weeks, ratings);
  const { handle, publish, subscribe } = newMessageBus();
  void newModel(handle, { works }); // TODO: finalize
  works.map((work) => mountNewWorkVM(work, publish, subscribe)); // TODO: vms
  saveRatings(storage, toRatings(works));
};

const ready = (callback: Function): void => {
  if (typeof document === 'undefined') return void callback();
  if (document.readyState === 'complete') {
    setTimeout(() => callback());
  } else {
    document.addEventListener('DOMContentLoaded', function listener() {
      document.removeEventListener("DOMContentLoaded", listener);
      callback();
    });
  }
};

ready(main);
