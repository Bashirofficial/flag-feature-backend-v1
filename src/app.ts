import express from "express";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.middleware"; 

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //simply urlencoded() will also work
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));
 
app.get("/", (req, res) => {
  res.send("🚀 API is running");
});

//Routes
import userRouter from "./routes/user.route";
 
app.use("/api/v1/users", userRouter);
app.use("/api/v1/projects/:id/files", fileRouter);
app.use(errorHandler);

 
export { app, server };
