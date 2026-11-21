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
 *   "email" : "login@donazion.com",
 *   "password" : "banana1234"
 *  }
 */
interface RequestPayload {
    email: string;
    password: string;
}
export declare const handler: (event: RequestPayload) => Promise<any>;
export {};
//# sourceMappingURL=loginOrganization.d.mts.map