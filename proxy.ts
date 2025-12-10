import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma";
import errorHandler from "./utils/errorHandler";
import { UnauthorizedError } from "./utils/customError";

interface ILoginInfo {
  session: {
    userId: string;
  };
}

export async function proxy(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    const protectedPaths = [
      "/api/cv",
      "/api/interview",
      "/api/interview/question",
      "/api/interview/generate-question",
    ];

    if (path.startsWith("/api")) {
      if (protectedPaths.includes(path)) {
        const cookieStore = await cookies();
        const token = cookieStore.get("better-auth.session_data");
        if (!token) throw new UnauthorizedError();

        const payload = jwt.verify(
          token.value,
          process.env.BETTER_AUTH_SECRET || ""
        ) as ILoginInfo;

        const user = await prisma.user.findUnique({
          where: {
            id: payload.session.userId,
          },
        });
        if (!user) throw new UnauthorizedError();

        const newHeader = new Headers(req.headers);
        newHeader.set("x-user-id", user.id);
        const response = NextResponse.next({
          headers: newHeader,
        });

        return response;
      }
    }
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
