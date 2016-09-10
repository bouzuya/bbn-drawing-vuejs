import * as Vue from 'vue';
import { diff, applyChange } from 'deep-diff';
import { Work } from './type';
import { newStorage } from './store';
import {
  Event,
  Handle,
  Publish,
  decrementCommand,
  incrementCommand,
  newMessageBus
} from './message';

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
  const storage = newStorage();
  const weeks = [
    '2016-W31',
    '2016-W32'
  ];
  const works = storage.load(weeks);
  const { handle, publish, subscribe } = newMessageBus();
  void newModel(handle, { works }); // TODO: finalize
  works.map((work) => mountNewWorkVM(work, publish, subscribe)); // TODO: vms
  storage.save(works);
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
