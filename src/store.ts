import { Ratings, Work } from './type';
import { CookieStorage } from 'cookie-storage';

export interface Storage {
  load(weeks: string[]): Work[];
  save(works: Work[]): void;
}

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

const toRatings = (works: Work[]): Ratings => {
  return works.reduce((ratings, work) => {
    ratings[work.week] = work.rating;
    return ratings;
  }, <Ratings>{});
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

const newStorage = (): Storage => {
  const storage = new CookieStorage();
  return {
    load(weeks: string[]): Work[] {
      const ratings = loadRatings(storage);
      const works = toWorks(weeks, ratings);
      return works;
    },
    save(works: Work[]): void {
      const ratings = toRatings(works);
      saveRatings(storage, ratings);
    }
  };
};

export { newStorage };
