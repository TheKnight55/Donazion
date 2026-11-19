/**
 * Create ToDo List use case
 *
 * If the list already exists, then it is returned. So better to consider this as a
 * CreateOrAdd use case
 */
/**
 * Incoming JSON payload:
 *
 * { "name" : "ToDo" }
 */
interface RequestPayload {
    email: string,
    name: string

}
export declare const handler: (event: RequestPayload) => Promise<any>;
export {};