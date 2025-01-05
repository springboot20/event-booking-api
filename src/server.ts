import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import passport from "passport";
import expressSession from "express-session";
import cookieParser from "cookie-parser";
import http from "http";

import { errorHandler } from "./middlewares/error.middleware";
import { connectToDatabase } from "./db/connection";
import * as routes from "./routes/index";

const app = express();
const PORT = process.env.PORT ?? 4040;
const httpServer = http.createServer(app);

mongoose.connection.on("connected", () => {
  console.log("Mongodb connected ....");
});

process.on("SIGINT", () => {
  mongoose.connection.once("disconnect", () => {
    console.log("Mongodb disconnected..... ");
    process.exit(0);
  });
});

app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cookieParser(process.env.EXPRESS_SESSION_SECRET));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// APP API ROUTES
app.use("/api/v1/bookings/auth", routes.authRoutes.router);
app.use("/api/v1/bookings/profile", routes.profileRoutes.router);
app.use("/api/v1/bookings/events", routes.eventRoutes.router);
app.use("/api/v1/bookings/seats", routes.seatRoutes.router);
app.use("/api/v1/bookings/bookmarks", routes.bookmarkRoutes.router);
app.use("/api/v1/bookings/categories", routes.categoryRoutes.router);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");

  next();
});

app.listen(PORT, () => {
  console.log(`🌟🌟 Server running at port http://localhost:${PORT} ⚡⚡`);
});

// DATABASE CONNECTION
connectToDatabase();

// Error handler middleware
app.use(errorHandler);

httpServer.on("error", function (error) {
  if (error?.message === "EADDRINUSE") {
    console.log(`Port, ${PORT} already in use`);
  }
  console.log(`Server Error : ${error}`);
});
