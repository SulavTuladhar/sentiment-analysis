export default function customError(errMsg: string, status: number) {
  let error: any = new Error(errMsg);
  error.status = status;
  return error;
}
