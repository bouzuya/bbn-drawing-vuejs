import { newStorage } from './store';
import { newMessageBus } from './message';
import { newModel } from './model';
import { mountNewWorkVM } from './view';

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
