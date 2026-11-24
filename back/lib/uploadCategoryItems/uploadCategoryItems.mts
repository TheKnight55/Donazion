import mysql, { type ResultSetHeader, type QueryError } from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * Upload Category Item use case
 * 
 * If the category does not exist, return 400 error
 * If there is already an item with the same name and category, return 400 error
 * If the minimum price is higher than the maximum price, return 400 error
 * If multiple items are given and one or more failed, but not all, return 207 error
 */

interface CategoryItem extends RowDataPacket {
    category: string,
    name: string,
    min_price: number,
    max_price: number
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
  categoryItems: CategoryItem[]
}

/**
 * Outgoing JSON payload:
 * 
 * { "statusCode" : 200 | 207 | 400,
 *   on 200:
 *      will have the current list of "categoryItems" : {{category: "cat1", name: "name1", min_price: 5, max_price: 10}, 
 *                  {category: "cat2", name: "name2", min_price: 2, max_price: 6}, ...}
 *   on 207:
 *      will have the current list of "categoryItems" : {{category: "cat1", name: "name1", min_price: 5, max_price: 10}, 
 *                  {category: "cat2", name: "name2", min_price: 2, max_price: 6}, ...}
 *      but also a list of "error" that shows which items failed and for what : [{index: 1, error: "this item already exists in this category"}, ...]
 *   on 400:
 *      will still give a list of the current "categoryItems" from the database, but no changes were made
 *      also have a list of "error" that shows why each item failed
 * }
 */

interface returnError {
  index : number,
  error : string
}

interface ResponsePayload {
  statusCode: number,        // always exists
  categoryItems?: CategoryItem[],
  error?: returnError[]
}

// specify credentials. Created OUTSIDE handler, so it can be reused 
const pool = mysql.createPool({
    host: process.env.RDS_HOST!,
    user: process.env.RDS_USER!,
    password: process.env.RDS_PASSWORD!,
    database: process.env.RDS_DATABASE!,
    connectionLimit: 2, // keep small per lambda container
    decimalNumbers: true // makes decimals not strings when sql returns them
})

export const handler = async (event: RequestPayload): Promise<any> => {
  const raw: unknown = event.categoryItems // Turns the given category items into an unknown type
  let uploadedItems:CategoryItem[];
  if (Array.isArray(raw)) { // Checks if the unknown is an array
    uploadedItems = raw
  } else if (raw != null && typeof raw == "object") {
    uploadedItems = [raw as CategoryItem]
  } else {
    return {statusCode: 400, error: "categoryItems should be item or a list of items"}
  }
  // assume this will fail until proven that it will succeed.
  let response:ResponsePayload = { statusCode: 400 }

  if (uploadedItems.length == 0) { // Checks if the given category items has at least an item
    return { statusCode: 400, error: [{ index: -1, error: "categoryItems must have at least one item" }] }
  }

  const checkError = (error:QueryError): Error => { // Gives a custom error if the category doesn't exist or the item is a duplicate
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return new Error("category does not exist")
    } else if (error.code === "ER_DUP_ENTRY") {
      return new Error("this item already exists in this category")
    }
    return new Error("Database error: " + error.message)
  }
  
  const addCategoryItem = (item: CategoryItem) => {
    return new Promise<ResultSetHeader>((resolve, reject) => {
      const addQuery = "INSERT INTO donazion.category_item (category, name, min_price, max_price) VALUES (?, ?, ?, ?)"
      pool.query<ResultSetHeader>(addQuery, [item.category, item.name, Number(item.min_price), Number(item.max_price)], (error, result) => {
        if (error) {
          reject(checkError(error))
        } else {
          resolve(result)
        }
      })
    })
  }

  const allCategoryItems = () => {
    return new Promise<CategoryItem[]>((resolve, reject) => {
      const selectQuery = "SELECT * FROM donazion.category_item"
      pool.query<CategoryItem[]>(selectQuery, (error, rows) => {
        if (error) {
          reject(checkError(error)) // Should never happen
        } else {
          resolve(rows)
        }
      })
    })
  }
  
  let failed:number = 0
  for (let i = 0; i < uploadedItems.length; i++) {
    const currentItem:CategoryItem = uploadedItems[i]!
    try {
      if (!currentItem.category) {
        throw new Error("empty category")
      }
      if (!currentItem.name) {
        throw new Error("empty item name")
      }
      if (Number(currentItem.min_price) < 0) {
        throw new Error("minimum price is less than zero")
      }
      if (Number.isNaN(Number(currentItem.min_price)) || Number.isNaN(Number(currentItem.max_price))) { // Checks if the given min and max prices are numbers
        throw new Error("prices must be numbers")
      }
      if (Number(currentItem.min_price) > Number(currentItem.max_price)) {
        throw new Error("minimum price is greater than the maximum price")
      }
      await addCategoryItem(currentItem)
    } catch (error) {
      console.error(error)
      failed++
      if (failed == 1) response.error = []
      response.error?.push({index: i, error: error instanceof Error ? error.message : String(error)})
    }
  }

  try {
    response.categoryItems = await allCategoryItems()
  } catch (error) {
    console.error(error)
    console.error("How did we get here")
  }

  if (failed == 0) {
    response.statusCode = 200
  } else if (failed < uploadedItems.length) {
    response.statusCode = 207
  }

  return response
}