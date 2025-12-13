import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma";
import errorHandler from "./utils/errorHandler";

interface ILoginInfo {
  session: {
    userId: string;
  };
}

export async function proxy(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    const protectedPaths = ["/api/cv", "/api/job-recommendation"];

    if (path.startsWith("/api")) {
      if (protectedPaths.includes(path) || path.startsWith("/api/cv")) {
        const cookieStore = await cookies();
        const token = cookieStore.get("better-auth.session_data");
        if (!token) throw new Error("Unauthorized");

        const payload = jwt.verify(
          token.value,
          process.env.BETTER_AUTH_SECRET || ""
        ) as ILoginInfo;

        const user = await prisma.user.findUnique({
          where: {
            id: payload.session.userId,
          },
        });
        if (!user) throw new Error("Unauthorized");

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
