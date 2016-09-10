import * as Vue from 'vue';
import { diff, applyChange } from 'deep-diff';
import { Work } from './type';
import {
  MessageBus,
  Event,
  Publish,
  decrementCommand,
  incrementCommand,

  // workaround for warning
  DecrementCommand, IncrementCommand, UpdatedEvent,
} from './message';

type State = { works: Work[]; };

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

const newView = (bus: MessageBus, initialState: State): any => {
  const { publish, subscribe } = bus;
  const { works } = initialState;
  works.map((work) => mountNewWorkVM(work, publish, subscribe)); // TODO: vms
};

export { newView };

// workaround for warning
export { DecrementCommand, IncrementCommand, UpdatedEvent };
