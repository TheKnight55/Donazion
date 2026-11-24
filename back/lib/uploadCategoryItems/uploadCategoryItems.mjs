import mysql, {} from 'mysql2';
// specify credentials. Created OUTSIDE handler, so it can be reused 
const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
    connectionLimit: 2, // keep small per lambda container
    decimalNumbers: true // makes decimals not strings when sql returns them
});
export const handler = async (event) => {
    const raw = event.categoryItems; // Turns the given category items into an unknown type
    let uploadedItems;
    if (Array.isArray(raw)) { // Checks if the unknown is an array
        uploadedItems = raw;
    }
    else if (raw != null && typeof raw == "object") {
        uploadedItems = [raw];
    }
    else {
        return { statusCode: 400, error: "categoryItems should be item or a list of items" };
    }
    // assume this will fail until proven that it will succeed.
    let response = { statusCode: 400 };
    if (uploadedItems.length == 0) { // Checks if the given category items has at least an item
        return { statusCode: 400, error: [{ index: -1, error: "categoryItems must have at least one item" }] };
    }
    const checkError = (error) => {
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return new Error("category does not exist");
        }
        else if (error.code === "ER_DUP_ENTRY") {
            return new Error("this item already exists in this category");
        }
        return new Error("Database error: " + error.message);
    };
    const addCategoryItem = (item) => {
        return new Promise((resolve, reject) => {
            const addQuery = "INSERT INTO donazion.category_item (category, name, min_price, max_price) VALUES (?, ?, ?, ?)";
            pool.query(addQuery, [item.category, item.name, Number(item.min_price), Number(item.max_price)], (error, result) => {
                if (error) {
                    reject(checkError(error));
                }
                else {
                    resolve(result);
                }
            });
        });
    };
    const allCategoryItems = () => {
        return new Promise((resolve, reject) => {
            const selectQuery = "SELECT * FROM donazion.category_item";
            pool.query(selectQuery, (error, rows) => {
                if (error) {
                    reject(checkError(error)); // Should never happen
                }
                else {
                    resolve(rows);
                }
            });
        });
    };
    let failed = 0;
    for (let i = 0; i < uploadedItems.length; i++) {
        const currentItem = uploadedItems[i];
        try {
            if (!currentItem.category) {
                throw new Error("empty category");
            }
            if (!currentItem.name) {
                throw new Error("empty item name");
            }
            if (Number(currentItem.min_price) < 0) {
                throw new Error("minimum price is less than zero");
            }
            if (Number.isNaN(Number(currentItem.min_price)) || Number.isNaN(Number(currentItem.max_price))) { // Checks if the given min and max prices are numbers
                throw new Error("prices must be numbers");
            }
            if (Number(currentItem.min_price) > Number(currentItem.max_price)) {
                throw new Error("minimum price is greater than the maximum price");
            }
            await addCategoryItem(currentItem);
        }
        catch (error) {
            console.error(error);
            failed++;
            if (failed == 1)
                response.error = [];
            response.error?.push({ index: i, error: error instanceof Error ? error.message : String(error) });
        }
    }
    try {
        response.categoryItems = await allCategoryItems();
    }
    catch (error) {
        console.error(error);
        console.error("How did we get here");
    }
    if (failed == 0) {
        response.statusCode = 200;
    }
    else if (failed < uploadedItems.length) {
        response.statusCode = 207;
    }
    return response;
};
//# sourceMappingURL=uploadCategoryItems.mjs.map