import * as Vue from 'vue';
import { CookieStorage } from 'cookie-storage';

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

const main = () => {
  const storage = new CookieStorage();
  const ratings = loadRatings(storage);
  const weeks = ['2016-W31'];
  const works = toWorks(weeks, ratings);
  works.map(({ week, rating }) => {
    type WorkComponent = { rating: number; };
    const data: WorkComponent = { rating };
    const work1 = new Vue({
      el: `.work-${week}`,
      data,
      methods: {
        decrement(this: WorkComponent): void {
          this.rating -= 1;
        },
        increment(this: WorkComponent): void {
          this.rating += 1;
        }
      }
    });
    console.log(work1);
  });
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
