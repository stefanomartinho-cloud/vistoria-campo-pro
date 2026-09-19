import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("storage.uploadImage", () => {
  it("rejects data that is not a base64 image", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.storage.uploadImage({
      fileName: "foto.jpg",
      contentType: "image/jpeg",
      dataUrl: "not-an-image",
    })).rejects.toThrow("Imagem inválida");
  });

  it("rejects unsupported content types before attempting storage", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.storage.uploadImage({
      fileName: "arquivo.pdf",
      contentType: "application/pdf" as "image/jpeg",
      dataUrl: "data:image/jpeg;base64,AA==",
    })).rejects.toThrow();
  });
});
