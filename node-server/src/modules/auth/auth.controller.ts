import { NextFunction, Request, Response } from "express";
import { repo } from "../../configs/repo";
import customError from "../../helpers/customError";
import { User } from "../../entities/user.entity";
import map_user_req from "../../helpers/map_user_req";
import configs from "../../configs/config";
import { UserDetail } from "../../configs/interfaces";
const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");

function createToken(userId: number) {
  let token = jwt.sign(
    {
      id: userId,
    },
    configs.JWT_SEC
  );
  return token;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = req.body;
    let user = await repo.userRepo.findOneBy({ email: data?.email });
    if (user) {
      throw customError("Email Already Taken", 401);
    }
    let newUser = new User();
    let mappedUser = map_user_req(newUser, data);
    mappedUser.password = passwordHash.generate(data.password);
    await repo.userRepo.save(mappedUser);
    res.status(201).json({
      message: "User created successfully",
      status: 201,
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await repo.userRepo.findOneBy({ email: req.body.email });
    if (!user) {
      throw customError("Invalid credentials", 401);
    }
    let isMatched = passwordHash.verify(req?.body?.password, user.password);
    if (!isMatched) {
      throw customError("Invalid credentials", 401);
    }
    let token = createToken(user.id);
    let userDetail: UserDetail = user;
    delete userDetail.password;
    res.status(200).json({
      message: "Logged in successfully !",
      token,
      user: userDetail,
    });
  } catch (err) {
    return next(err);
  }
}
