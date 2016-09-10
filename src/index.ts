import { newStorage } from './store';
import { newMessageBus } from './message';
import { newModel } from './model';
import { newView } from './view';

const main = () => {
  const storage = newStorage();
  const weeks = [
    '2016-W31',
    '2016-W32'
  ];
  const works = storage.load(weeks);
  const bus = newMessageBus();
  void newModel(bus.handle, { works }); // TODO: finalize
  void newView(bus, { works }); // TODO: finalize
  // auto save. TODO: finalize
  void bus.handle((message) => {
    if (message.type === 'updated') {
      const works = message.state.works;
      storage.save(works);
    }
    return void 0;
  });
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
