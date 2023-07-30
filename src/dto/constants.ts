export interface PopulateObject {
  path: string;
  model: string;
  select?: string;
  populate?: PopulateObject | PopulateObject[];
}

export const CartPopulateOptions: Array<PopulateObject> = [
  {
    path: 'subproducts.subproduct',
    model: 'Subproduct',
    select: '_id product sell_price buy_price size',
    populate: {
      path: 'product',
      model: 'Product',
      select: '_id name image',
    },
  },
];
