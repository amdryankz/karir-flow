import { ZodError } from "zod";
import { CustomError } from "./customError";

interface IErrorResponse {
  message: string;
  status: number;
}

export default function errorHandler(err: unknown): IErrorResponse {
  if (err instanceof ZodError) {
    const issues = err.issues;
    let message: string = "";

    issues.forEach((el) => (message = `${el.message}`));

    return { message, status: 400 };
  } else if (err instanceof CustomError) {
    return { message: err.message, status: err.status };
  } else {
    return { message: "Internal Server Error", status: 500 };
  }
}
