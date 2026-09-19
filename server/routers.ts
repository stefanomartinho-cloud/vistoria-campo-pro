import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  storage: router({
    uploadImage: publicProcedure
      .input(z.object({
        fileName: z.string().min(1).max(180),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        dataUrl: z.string().max(8_000_000),
      }))
      .mutation(async ({ input }) => {
        const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
        if (!match?.[1]) throw new Error("Imagem inválida");
        const buffer = Buffer.from(match[1], "base64");
        if (buffer.byteLength > 6 * 1024 * 1024) throw new Error("Imagem excede o limite de 6 MB");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        return storagePut(`vistoria-campo-pro/${Date.now()}-${safeName}`, buffer, input.contentType);
      }),
  }),
});

export type AppRouter = typeof appRouter;
