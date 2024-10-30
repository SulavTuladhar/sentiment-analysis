import { appDataSource } from "../appDataSource";
import { User } from "../entities/user.entity";

export const repo = {
  userRepo: appDataSource.getRepository(User),
};
