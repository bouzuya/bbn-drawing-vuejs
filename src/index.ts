import * as Vue from 'vue';
import { diff, applyChange } from 'deep-diff';
import { Work } from './type';
import { newStorage } from './store';
import {
  Event,
  Publish,
  decrementCommand,
  incrementCommand,
  newMessageBus
} from './message';
import { newModel } from './model';

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
