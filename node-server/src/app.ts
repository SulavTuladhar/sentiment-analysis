import express, { NextFunction, Request, Response } from "express";
import { appDataSource } from "./appDataSource";
import cors from "cors";

const app = express();
const PORT = 9191;
const API_ROUTE = require("./api.router");

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true, // Allow credentials (cookies, headers, etc.)
  })
);

appDataSource
  .initialize()
  .then(() => console.log("Database Connection Successfully"))
  .catch((err) => console.log("Error while connecting to database > ", err));

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

app.use("/", API_ROUTE);

app.use(function (req: Request, res: Response, next: NextFunction) {
  next({
    message: "Page not found",
    status: 404,
  });
});

app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  res.status(err.status || 500);
  res.json({
    message: err.message || err,
    status: err.status || 500,
  });
});

app.listen(PORT, "172.16.0.2", () => {
  console.log("Server is listening to PORT ", PORT);
});
