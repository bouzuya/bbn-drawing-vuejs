import * as Vue from 'vue';
import { CookieStorage } from 'cookie-storage';
import { EventEmitter } from 'events';

type Ratings = {
  [week: string]: number;
};

type Work = {
  rating: number;
  week: string;
};

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

const mountNewWorkVM = (state: Work) => {
  return new Vue({
    el: `.work-${state.week}`,
    data: { state },
    methods: {
      decrement(this: { state: Work; }): void {
        this.state.rating -= 1;
      },
      increment(this: { state: Work; }): void {
        this.state.rating += 1;
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
  void newMessageBus(); // TODO
  works.map((work) => mountNewWorkVM(work)); // TODO: vms
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
