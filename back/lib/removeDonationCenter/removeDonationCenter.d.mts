/**
 * Register Donation Center use case (donation center dashboard)
 *
 * Called by a logged-in donation center to register itself with the organization.
 * Only changes the registered flag. The center's account, inventory, wishlist and
 * location are untouched, so it can keep using the site either way.
 *
 * If the donation center does not exist, return 400 error
 * If it is already registered, return 400 error ("already registered")
 * Otherwise set registered = true.
 */
/**
 * Incoming JSON payload (name of the logged-in donation center):
 *
 * {
 *   "name" : "Some Center"
 * }
 */
interface RequestPayload {
    name: string;
}
export declare const handler: (event: RequestPayload) => Promise<any>;
export {};
//# sourceMappingURL=removeDonationCenter.d.mts.map