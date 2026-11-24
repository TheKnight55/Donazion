"use client"
import React from 'react'
import axios from "axios"
import instance from "../aws"
import { refresh } from "next/cache";
import OrganizationHeader from "../../components/OrganizationHeader"
import { useRouter } from "next/navigation"
import styles from "../page.module.css";
let categories: string[] = [];

export default function OrganizationDashboard() {
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [result, setResult] = React.useState("")
    const [selected, setSelected] = React.useState("")
    const [redraw, setRedraw] = React.useState(0)
    const router = useRouter()

    const addCategory = () => {
        const category = document.getElementById("category") as HTMLInputElement
        // just get all values from the response, and use that
        instance.post('/addCategory', {name: category.value}).then((response) => {
        let status = response.data.statusCode
        categories=response.data.names
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

    const removeCategory = (c:string) => {
        const category = document.getElementById("category") as HTMLInputElement
        // just get all values from the response, and use that
        instance.post('/addCategory', {name: category.value}).then((response) => {
        let status = response.data.statusCode
        categories=response.data.names
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

    function list_category(c:string) {
        return (
          <li key={c} className={styles.clerks}>
              <h3>{c}</h3>
              <button onClick={() => add_catItems()}>Add category item</button>
              <button onClick={() => removeCategory(c)}>Remove category</button>
              <br></br>
          </li>
        )
    }
    const add_catItems = () => {
        // const clerkName = (document.getElementById(`clerkName-${v.ID}`) as HTMLInputElement).value
        // if ((model.find_clerk(clerkName) != undefined) && model.find_clerk(clerkName)?.helping==null) {
        //     model.assign_visitor(v, model.find_clerk(clerkName)!)
        // }
        // console.log("Visitors:", model.visitors)
        // setRedraw(redraw+1)
    }
    return (
        <main>
            <OrganizationHeader />
            <div className="dashboard">
                <h2>Organization Dashboard</h2>
                <div className="dashboard-buttons">
                    <button onClick={() =>router.push("/organization/donation-centers")}>List Donation Centers</button>
                </div>
                <section className="categories">
                    <h2>Categories</h2>
                    <div className="category">
                        <div className="category-header">
                            <button>Remove Category</button>
                        </div>
                        <div className="category-item">
                            <div>
                                
                            </div>
                            <div className="item-buttons">
                                <button>Edit Category Item</button>
                                <button>Remove Category Item</button>
                            </div>
                        </div>
                        <button>Add Category Item</button>
                    </div>
                    <div className="category">
                        <div className="category-header">
                            <h3>Vehicles</h3>
                            <button>Remove Category</button>
                        </div>
                        <button>Upload Category Items</button>
                        <button>Add Category Item</button>
                    </div> 
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