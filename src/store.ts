import { Ratings, Work } from './type';
import { CookieStorage } from 'cookie-storage';

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

export { loadRatings, saveRatings, toRatings, toWorks };
