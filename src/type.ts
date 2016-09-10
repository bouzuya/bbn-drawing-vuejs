export interface State {
  isValid: boolean;
  works: Work[];
}

export interface Work {
  rating: number;
  week: string;
}
