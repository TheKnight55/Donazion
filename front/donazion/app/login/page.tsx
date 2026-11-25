'use client'                     // NEED THIS to be able to embed HTML in TSX file
import React from 'react'
import axios from "axios"
import instance from "../aws"
import { refresh } from "next/cache";
import { useRouter } from 'next/navigation'
import styles from "../page.module.css";


export default function Home() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [result, setResult] = React.useState("")
  const [selected, setSelected] = React.useState("Organization")
  const [redraw, setRedraw] = React.useState(0)
  const router = useRouter()

  const login = () => {
    const email = document.getElementById("user") as HTMLInputElement
    const password = document.getElementById("pwd") as HTMLInputElement

    // just get all values from the response, and use that
    console.log("Email:", email.value)
    console.log("Password entered:", password.value ? "Yes" : "No")
    let endpoint;
    if (selected == "Organization") {
      console.log("Organization")
      endpoint = "/loginOrganization"
    } else {
      console.log("Donation Center")
      endpoint = "/loginDonationCenter"
    }
    instance.post(endpoint, {email: email.value, password: password.value}).then((response) => {
      let status = response.data.statusCode
      let resultComp = response.data.body
      if (status == 200) {
        setResult(resultComp)
        console.log("status"+status)
        if (selected == "Organization") {
          router.push('/organization')
        } else {
          router.push('/donation_center')
        }
        console.log("LOGGED IN")

      } else {
        setResult("error:" + resultComp)
        console.log(status)
        console.log("error:" + resultComp)
        console.log("NOT LOGGED IN")
      }
    }).catch(function (error) {
      // this is a 500-type error, where there is no such API on the server side
      setResult(error)
    })
    setRedraw(redraw+1)
  }

  return (
    <div>
      <main>
        <h1 className="title">Login</h1>
        <h2>Username: </h2><input id="user" value={email} onChange={(e) => setEmail(e.target.value)}></input>
        <h2>Password: </h2><input id="pwd" value={password} onChange={(p) => setPassword(p.target.value)}></input>
        <button onClick={() => login()}>Log In</button>

        <div>
        <label>Log in as: </label>

        <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}>
            <option value="Organization" className="{styles.option}">Organization</option>
            <option value="Donation center" className={styles.option}>Donation Center</option>
        </select>

        <p>Selected: {selected}</p>
        </div>

      </main>
    </div>
  );
}