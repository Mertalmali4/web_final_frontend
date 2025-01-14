import axios from 'axios';
const apiUrl = process.env.REACT_APP_API_URL;
const API = axios.create({
  baseURL: '${apiUrl}', // Strapi'nin temel URL'si
});

export default API;