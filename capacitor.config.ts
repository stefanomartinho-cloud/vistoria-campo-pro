import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vistoriapro.app",
  appName: "VistoriaPro",
  webDir: "dist/public",
  android: {
    backgroundColor: "#073f3b",
    allowMixedContent: false,
  },
};

export default config;
