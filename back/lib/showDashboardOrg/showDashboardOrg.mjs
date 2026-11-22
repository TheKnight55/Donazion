import mysql from 'mysql2';
import { RowDataPacket } from 'mysql2/promise';
// specify credentials. Created OUTSIDE handler, so it can be reused
const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
    connectionLimit: 2,
});
export const handler = async (event) => {
    // assume this will fail until proven that it will succeed.
    let response = { statusCode: 400 };
    const getDonationCenterCount = () => {
        return new Promise((resolve, reject) => {
            const selectQuery = `
        SELECT COUNT(*) AS donationCenters
        FROM donazion.donation_center
        WHERE registered = 1
      `;
            pool.query(selectQuery, [], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(rows[0]?.donationCenters || 0);
                }
            });
        });
    };
    const getInventoryTotals = () => {
        return new Promise((resolve, reject) => {
            const selectQuery = `
        SELECT
          COALESCE(SUM(quantity), 0) AS totalItems,
          COALESCE(SUM(market_value * quantity), 0) AS totalValue
        FROM donazion.inventory
      `;
            pool.query(selectQuery, [], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(rows[0]);
                }
            });
        });
    };
    try {
        const donationCenters = await getDonationCenterCount();
        const inventoryTotals = await getInventoryTotals();
        response.statusCode = 200;
        response.donationCenters = donationCenters;
        response.totalItems = inventoryTotals.totalItems;
        response.totalValue = inventoryTotals.totalValue;
    }
    catch (error) {
        response.error = `error: ${JSON.stringify(event)}`;
    }
    // Since pool is defined OUTSIDE of lambda function,
    // no need to end() or close()
    return response;
};
//# sourceMappingURL=showDashboardOrg.mjs.map