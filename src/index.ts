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
  const ratingsObj = loadRatings(storage);
  saveRatings(storage, ratingsObj);
};

if (document.readyState === 'complete') {
  window.setTimeout(() => main());
} else {
  document.addEventListener('DOMContentLoaded', function listener() {
    document.removeEventListener("DOMContentLoaded", listener);
    main();
  });
}
