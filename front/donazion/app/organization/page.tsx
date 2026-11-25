"use client"
import React from 'react'
import axios from "axios"
import instance from "../aws"
import { refresh } from "next/cache";
import OrganizationHeader from "../../components/OrganizationHeader"
import { useRouter } from "next/navigation"
import styles from "../page.module.css";

interface DashboardItem { // Individual category item
    name: string,
    minPrice: number,
    maxPrice: number
}

interface DashboardCategory { // Category
    name: string,
    items: DashboardItem[] // Holds its category items in a list
}

export default function OrganizationDashboard() {
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [result, setResult] = React.useState("")
    const [selected, setSelected] = React.useState("")
    const [redraw, setRedraw] = React.useState(0)
    const router = useRouter()
    const [categories, setCategories] = React.useState<DashboardCategory[]>([]);

    const loadDashboard = () => { // loads the current database values
        instance.post('/showDashboardOrg', {})
            .then((response) => {
                if (response.data.statusCode === 200) {
                    setCategories(response.data.categories);
                }
            }).catch(function (error) {
                console.log(error)
            });
    }

    React.useEffect(() => { // Gets the current categories and category items from the database on start
        loadDashboard()
    }, []);

    React.useEffect(() => {
    instance.post('/addCategory', { name: "retrieve" })
        .then((response) => {
            if (response.data.statusCode === 200) {
                setCategories(response.data.names);
            }
        })
        .catch((error) => console.log(error));
}, []);
    const addCategory = () => {
        const category = document.getElementById("category") as HTMLInputElement
        // just get all values from the response, and use that
        instance.post('/addCategory', {name: category.value}).then((response) => {
        let status = response.data.statusCode
        let resultComp = response.data.body
        if (status == 200) {
            setResult(resultComp)
            loadDashboard()
            console.log("status: "+status)
            console.log(">> "+categories+" <<")

        } else {
            setResult("error: " + resultComp)
            console.log(status)
        }
        }).catch(function (error) {
        // this is a 500-type error, where there is no such API on the server side
        setResult(error)
        })
        category.value = "" // Clears text box
        setRedraw(redraw+1)
    }

    const removeCategory = (c:string) => {
        // just get all values from the response, and use that
        instance.post('/removeCategory', {name: c}).then((response) => {
        let status = response.data.statusCode
        loadDashboard()
        let resultComp = response.data.body
        if (status == 200) {
            setResult(resultComp)
            console.log("status: "+status)
            console.log(">> "+categories+" <<")

        } else {
            setResult("error: " + resultComp)
            console.log(status)
        }
        }).catch(function (error) {
        // this is a 500-type error, where there is no such API on the server side
        setResult(error)
        })
        setRedraw(redraw+1)
    }

    function list_category(c:DashboardCategory) {
        return (
          <li key={c.name} className={styles.clerks}>
              <h3>{c.name}</h3>
              <button onClick={() => add_catItems(c.name)}>Add category item</button>
              <button onClick={() => removeCategory(c.name)}>Remove Category</button>
              <ul>
                  {c.items.map(i => (
                      <li key={i.name}>
                          {i.name}: ${i.minPrice.toFixed(2)} to ${i.maxPrice.toFixed(2)}
                      </li>
                  ))}
              </ul>
              <br></br>
          </li>
        )
    }

    interface categoryItem {
        category: string,
        name: string,
        min_price: number,
        max_price: number
    }

    const add_catItems = (c:string) => {
        let catItems:categoryItem[] = [];
        let loop:boolean = true;
        while (loop) {
            const name = prompt("Item name?")
            const min = prompt("Minimum price?")
            const max = prompt("Maximum price?")
            const addAnother = prompt("Add another item? (y/n)")
            if (!addAnother || addAnother[0].toLowerCase() != "y") { // If the first character of the input is y, it accepts
                loop = false // breaks the loop
            }
            // If any of the values are empty, it doesn't even push it to the list
            if (!name || min == null || max == null || Number.isNaN(Number(min)) || Number.isNaN(Number(max))) continue
            catItems.push({category: c, name: name, min_price: Number(min), max_price: Number(max)})
        }
        if (catItems.length == 0) return // If the list is completely empty, it doesn't even do the post
        instance.post('/uploadCategoryItems', {categoryItems: catItems}).then((response) => {
            let status = response.data.statusCode
            if (status == 200) {
                setResult("Items added")
                console.log("status: "+status)
                console.log("Cat items added correctly")
            } else if (status == 207) {
                setResult("Some items failed: " + JSON.stringify(response.data.error))
                console.log("status: " + status)
                console.log("One or more cat items failed")
            } else {
                setResult("error: " + JSON.stringify(response.data.error))
                console.log(status)
                console.log("All cat items failed")
            }
            loadDashboard()
        }).catch(function (error) {
            // this is a 500-type error, where there is no such API on the server side
            setResult(error)
        })
        setRedraw(redraw+1)
    }
    return (
        <main>
            <OrganizationHeader />
            <div className="dashboard">
                <h2>Organization Dashboard</h2>
                <div className="dashboard-buttons">
                    <button 
                    //</div>onClick={() =>router.push("/organization/donation-centers")}
                    >List Donation Centers</button>
                </div>
                <section className="categories">
                    <h2>Categories</h2>
                    {
                        categories.map(c => 
                            list_category(c) 
                        )
                    }
                    <input id="category"></input>
                    <button className={styles.addCategory} onClick={() => addCategory()}>Add Category</button>
                </section>
            </div>
        </main>
    )
}