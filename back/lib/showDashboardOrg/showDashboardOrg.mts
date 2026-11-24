import mysql from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * Show Organization Dashboard use case
 *
 * Returns all categories and their category items,
 * including the low and high price for each item.
 */

/**
 * Incoming JSON payload:
 *
 * { }
 */

/**
 * Outgoing JSON payload:
 *
 * {
 *   "statusCode": 200 | 400,
 *
 *   on success:
 *      "categories": [
 *        {
 *          "name": "Clothes",
 *          "items": [
 *            {
 *              "name": "Nike Shoes",
 *              "minPrice": 20,
 *              "maxPrice": 50
 *            }
 *          ]
 *        }
 *      ]
 *
 *   on failure:
 *      "error": "e"
 * }
 */

interface ResponsePayload {
  statusCode: number
  categories?: Category[]
  error?: string
}

interface CategoryItem {
  name: string
  minPrice: number
  maxPrice: number
}

interface Category {
  name: string
  items: CategoryItem[]
}

// specify credentials. Created OUTSIDE handler, so it can be reused
const pool = mysql.createPool({
  host: process.env.RDS_HOST!,
  user: process.env.RDS_USER!,
  password: process.env.RDS_PASSWORD!,
  database: process.env.RDS_DATABASE!,
  connectionLimit: 2,
})

export const handler = async (event: any): Promise<any> => {

  // assume this will fail until proven that it will succeed.
  let response: ResponsePayload = { statusCode: 400 }

  /**
   * Get all categories and their category items.
   */
  interface CategoryRow extends RowDataPacket {
    categoryName: string
    itemName: string | null
    minPrice: number | null
    maxPrice: number | null
  }

  const getCategories = () => {
    return new Promise<CategoryRow[]>((resolve, reject) => {

      const selectQuery = `
        SELECT
          c.name AS categoryName,
          ci.name AS itemName,
          ci.min_price AS minPrice,
          ci.max_price AS maxPrice
        FROM donazion.category c
        LEFT JOIN donazion.category_item ci
          ON c.name = ci.category
        ORDER BY c.name, ci.name
      `

      pool.query<CategoryRow[]>(selectQuery, [], (error, rows) => {

        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(rows)
        }

      })
    })
  }

  try {

    const rows: CategoryRow[] = await getCategories()

    const categories: Category[] = []

    /**
     * Convert the SQL rows into the nested
     * category -> items structure expected by the frontend.
     */
    for (const row of rows) {

      let category = categories.find(
        c => c.name === row.categoryName
      )

      if (!category) {
        category = {
          name: row.categoryName,
          items: []
        }

        categories.push(category)
      }

      // LEFT JOIN means these can be null when
      // a category has no items yet.
      if (row.itemName !== null) {
        category.items.push({
          name: row.itemName,
          minPrice: Number(row.minPrice),
          maxPrice: Number(row.maxPrice)
        })
      }
    }

    response.statusCode = 200
    response.categories = categories

  } catch (error) {

    response.error = error instanceof Error
      ? error.message
      : String(error)

  }

  // Since pool is defined OUTSIDE of lambda function,
  // no need to end() or close()
  return response
}