import type { RowDataPacket } from 'mysql2/promise';
/**
 * Upload Category Item use case
 *
 * If the category does not exist, return 400 error
 * If there is already an item with the same name and category, return 400 error
 * If the minimum price is higher than the maximum price, return 400 error
 * If multiple items are given at once, and one or more failed
 */
interface CategoryItem extends RowDataPacket {
    category: string;
    name: string;
    min_price: number;
    max_price: number;
}
/**
 * Incoming JSON payload:
 *
 * {
 *   "categoryItems" : [{
 *     "category" : "cat1",
 *     "name" : "name1",
 *     "min_price" : 2,
 *     "max_price" : 6,
 *    },
 *    ...]
 *  }
 */
interface RequestPayload {
    categoryItems: CategoryItem[];
}
export declare const handler: (event: RequestPayload) => Promise<any>;
export {};
//# sourceMappingURL=uploadCategoryItems.d.mts.map