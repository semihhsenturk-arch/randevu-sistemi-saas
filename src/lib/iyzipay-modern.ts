import crypto from "crypto";

/**
 * Modern Iyzico Client
 * NO DEPENDENCIES - Works everywhere (Vercel, Lambda, Edge, Node.js)
 * Fixed "Cannot find module" issues forever.
 */

interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  uri: string;
}

export class IyzicoClient {
  private config: IyzicoConfig;

  constructor(config: IyzicoConfig) {
    this.config = config;
  }

  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Iyzico Signature Algorithm
   */
  private generateSignature(randomString: string, pkiString: string): string {
    const data = this.config.apiKey + randomString + this.config.secretKey + pkiString;
    return crypto.createHash("sha1").update(data).digest("base64");
  }

  /**
   * Iyzico PKI String Builder
   * This is the format required by Iyzico for security
   */
  private toPKIString(request: any): string {
    const buildPKI = (obj: any): string => {
      if (obj === null || obj === undefined) return "";
      if (Array.isArray(obj)) {
        let str = "[";
        for (let i = 0; i < obj.length; i++) {
          str += buildPKI(obj[i]) + (i < obj.length - 1 ? ", " : "");
        }
        return str + "]";
      }
      if (typeof obj === "object") {
        let str = "[";
        const keys = Object.keys(obj).sort();
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = obj[key];
          if (value !== undefined && value !== null) {
            str += key + "=" + buildPKI(value) + (i < keys.length - 1 ? ", " : "");
          }
        }
        // Remove trailing comma if exists
        if (str.endsWith(", ")) str = str.slice(0, -2);
        return str + "]";
      }
      return obj.toString();
    };
    return buildPKI(request);
  }

  private async request(path: string, request: any): Promise<any> {
    const randomString = this.generateRandomString();
    const pkiString = this.toPKIString(request);
    const signature = this.generateSignature(randomString, pkiString);

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `IYZWS ${this.config.apiKey}:${signature}`,
      "x-iyzi-rnd": randomString,
    };

    const response = await fetch(this.config.uri + path, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    return await response.json();
  }

  public checkoutFormInitialize = {
    create: async (request: any) => {
      return this.request("/payment/iyzipay/checkoutform/initialize/auth/ecom", request);
    }
  };

  public checkoutForm = {
    retrieve: async (request: any) => {
      return this.request("/payment/iyzipay/checkoutform/auth/ecom/detail", request);
    }
  };
}
