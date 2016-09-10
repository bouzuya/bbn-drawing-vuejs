import 'whatwg-fetch';

const myFetch: typeof window.fetch = window.fetch.bind(window);

export { myFetch as fetch };
