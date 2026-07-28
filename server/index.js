import app from "./app.js"
import dotenv from "dotenv"
dotenv.config()
import  connectBD from"./src/dp/index.js"

connectBD()

export default app