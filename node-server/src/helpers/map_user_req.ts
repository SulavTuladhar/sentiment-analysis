import { User } from "../entities/user.entity";

export default function (user: User, userDetail: User) {
  if (userDetail.name) user.name = userDetail.name;
  if (userDetail.password) user.password = userDetail.password;
  if (userDetail.number) user.number = userDetail.number;
  if (userDetail.email) user.email = userDetail.email;
  if (userDetail.role) user.role = userDetail.role;
  return user;
}
