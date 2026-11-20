/**
 * Append ToDo List use case
 *
 * If the list does not exists, return 400 error
 * If it does exist, append to its list of values.
 */
/**
 * Incoming JSON payload:
 *
 * {
 *   "name" : "ToDo",
 *   "entry" : "Pack Lunch"
 *  }
 */
interface RequestPayload {
    name: string;
    entry: string;
}
export declare const handler: (event: RequestPayload) => Promise<any>;
export {};
//# sourceMappingURL=registerDonationCenter.d.mts.map