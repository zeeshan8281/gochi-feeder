export const ECLOUD_URL =
  process.env.ECLOUD_URL || "http://34.91.17.188:8080";

export const APP_ID =
  process.env.NEXT_PUBLIC_APP_ID || "0x300Fd1aB21B169f5cdAe9016006126CF93D3A39c";

export const DEPLOY_TX =
  process.env.NEXT_PUBLIC_DEPLOY_TX ||
  "0x1c083667c8e54e1cbe167641fec71db760b91cfd6fe26441a488854ff87dcbad";

export const IMAGE_REF =
  process.env.NEXT_PUBLIC_IMAGE_REF || "ghcr.io/zeeshan8281/gochi-feeder:latest";

export const INSTANCE = "g1-standard-4t (Intel TDX)";

export const DASHBOARD_URL = `https://verify-sepolia.eigencloud.xyz/app/${APP_ID}`;
export const TX_URL = `https://sepolia.etherscan.io/tx/${DEPLOY_TX}`;
export const REPO_URL = "https://github.com/zeeshan8281";
