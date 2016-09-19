import { newStorage } from './store';
import { checkedEvent, newMessageBus } from './message';
import { newModel } from './model';
import { newView } from './view';
import { fetch } from './globals';

const fetchDrawingPosts = (): Promise<any> => {
  return fetch('http://blog.bouzuya.net/posts.json')
    .then((response) => response.json())
    .then((posts: { tags: string[]; }[]) => {
      return posts.filter(({ tags }) => tags.some((tag) => tag === 'drawing'));
    });
};

const main = () => {
  const storage = newStorage();
  const weeks = [
    '2016-W31',
    '2016-W32',
    '2016-W33',
    '2016-W34',
    '2016-W35',
    '2016-W36',
    '2016-W37'
  ];
  const works = storage.load(weeks);
  const state = { works, isValid: true };
  const bus = newMessageBus();
  void newModel(bus.handle, state); // TODO: finalize
  void newView(bus, state); // TODO: finalize
  // auto save. TODO: finalize
  void bus.handle((message) => {
    if (message.type === 'updated') {
      const works = message.state.works;
      storage.save(works);
    }
    return void 0;
  });

  void bus.handle((message) => {
    if (message.type === 'check') {
      fetchDrawingPosts()
        .then((posts) => {
          console.log(posts); // for DEBUG
          if (weeks.length < posts.length) {
            const isValid = weeks.length === posts.length;
            bus.publish(checkedEvent(isValid));
          }
        });
    }
    return void 0;
  });
  bus.publish({ type: 'check' });
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
