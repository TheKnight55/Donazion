import axios from "axios"

// all WEB traffic using this API instance. You should replace this endpoint with whatever
// you developed for the tutorial and adjust resources as necessary.
const instance = axios.create({
  baseURL: 'https://7fsr2aqaq4.execute-api.us-east-2.amazonaws.com/prod/todo/'
});

export default instance