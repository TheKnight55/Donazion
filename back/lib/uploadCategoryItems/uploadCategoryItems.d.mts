/**
 * Upload Category Item use case
 *
 * If the category does not exist, return 400 error
 * If there is already an item with the same name and category, return 400 error
 * If the minimum price is higher than the maximum price, return 400 error
 */
/**
 * Incoming JSON payload:
 *
 * {
 *   "category" : "cat1",
 *   "name" : "name1",
 *   "min_price" : "min_price1",
 *   "max_price" : "max_price1",
 *  }
 */
interface RequestPayload {
    category: string;
    name: string;
    min_price: number;
    max_price: number;
}
export declare const handler: (event: RequestPayload) => Promise<any>;
export {};
//# sourceMappingURL=uploadCategoryItems.d.mts.map