import mysql from 'mysql2';
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
    const getDonationCenters = () => {
        return new Promise((resolve, reject) => {
            const selectQuery = `
        SELECT
          dc.name,
          dc.email,
          l.street,
          l.city,
          l.state,
          l.zipcode,
          l.latitude,
          l.longitude

        FROM donazion.donation_center dc

        LEFT JOIN donazion.location l
          ON dc.name = l.donation_center_name

        WHERE dc.registered = 1

        ORDER BY dc.name
      `;
            pool.query(selectQuery, [], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    let donationCenters = rows.map((row) => ({
                        name: row.name,
                        email: row.email,
                        street: row.street,
                        city: row.city,
                        state: row.state,
                        zipcode: row.zipcode,
                        latitude: row.latitude,
                        longitude: row.longitude
                    }));
                    resolve(donationCenters || []);
                }
            });
        });
    };
    try {
        const donationCenters = await getDonationCenters();
        response.statusCode = 200;
        response.donationCenters = donationCenters;
    }
    catch (error) {
        response.error = `error: ${JSON.stringify(event)}`;
    }
    // Since pool is defined OUTSIDE of lambda function,
    // no need to end() or close()
    return response;
};
//# sourceMappingURL=listDonationCentersDon.mjs.map