'use client'                     // NEED THIS to be able to embed HTML in TSX file
import React from 'react'
import axios from "axios"
import instance from "../aws"
import { refresh } from "next/cache";


export default function Home() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [result, setResult] = React.useState("")

  const login = () => {
    const email = document.getElementById("user") as HTMLInputElement
    const password = document.getElementById("pwd") as HTMLInputElement

    // just get all values from the response, and use that
    instance.post('/loginOrganization', {email: email.value, password: password.value}).then((response) => {
      let status = response.data.statusCode
      let resultComp = response.data.body
      if (status == 200) {
        setResult(resultComp)
        console.log(email)
        console.log("   ")
        console.log(password)
        console.log(status)
      } else {
        setResult("error:" + resultComp)
        console.log("error:" + resultComp)
      }
    }).catch(function (error) {
      // this is a 500-type error, where there is no such API on the server side
      setResult(error)
    })

  }

  return (
    <div>
      <main>
        <h1>Welcome Donation center!</h1>
        <h2>Hello DC</h2>
        <button onClick={() => login()}>Show Dashboard</button>

      </main>
    </div>
  );
}