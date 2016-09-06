import * as Vue from 'vue';
import { CookieStorage } from 'cookie-storage';

type Ratings = {
  [week: string]: number;
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

const main = () => {
  const storage = new CookieStorage();
  const ratings = loadRatings(storage);
  const week = '2016-W31';
  type WorkComponent = { rating: number; };
  const data: WorkComponent = {
    rating: typeof ratings[week] === 'undefined' ? 0 : ratings[week]
  };
  const work1 = new Vue({
    el: `.work-${week}`,
    data,
    methods: {
      increment(this: WorkComponent): void {
        this.rating += 1;
      }
    }
  });
  console.log(work1);
  saveRatings(storage, ratings);
};

if (document.readyState === 'complete') {
  window.setTimeout(() => main());
} else {
  document.addEventListener('DOMContentLoaded', function listener() {
    document.removeEventListener("DOMContentLoaded", listener);
    main();
  });
}
