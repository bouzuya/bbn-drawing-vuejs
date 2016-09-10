import {
  // workaround for warning
  CheckCommand, DecrementCommand, IncrementCommand,
  CheckedEvent, UpdatedEvent, updatedEvent,
  Handle
} from './message';
import { State } from './type';


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
      return updatedEvent(newState);
    } else if (message.type === 'increment') {
      const newState = increment(state, message.week);
      return updatedEvent(newState);
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

export { newModel };

// workaround for warning
export {
  CheckCommand, DecrementCommand, IncrementCommand,
  CheckedEvent, UpdatedEvent
};
