/** A model from the live OpenRouter catalog. Prices are USD per 1M tokens. */
export type CatalogModel = {
  id: string;
  name: string;
  provider: string;
  input: number;
  output: number;
};
