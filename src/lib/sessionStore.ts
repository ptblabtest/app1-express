import { SessionData, Store } from "express-session";
import prisma from "./prisma";

export class PrismaSessionStore extends Store {
  async get(
    sid: string,
    callback: (err: any, session?: SessionData | null) => void
  ) {
    try {
      const session = await prisma.session.findUnique({
        where: { sid },
      });

      if (!session || session.expire < new Date()) {
        return callback(null, null);
      }

      callback(null, session.sess as any);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: any) => void) {
    try {
      const expire = session.cookie.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.session.upsert({
        where: { sid },
        update: {
          sess: session as any,
          expire,
        },
        create: {
          sid,
          sess: session as any,
          expire,
        },
      });

      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await prisma.session.deleteMany({
        where: { sid },
      });
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }
}
