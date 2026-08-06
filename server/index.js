import dotenv from "dotenv"
dotenv.config()
import app from "./app.js"
import connectDB from "./src/dp/index.js"

const PORT = process.env.PORT || 8000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Server is running at port: ${PORT}`)
    })
  })
  .catch((error) => {
    console.log("MongoDB connection failed !!! ", error)
  })