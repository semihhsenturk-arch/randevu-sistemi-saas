import Iyzipay from 'iyzipay';
import { PLAN_PRICES, PlanType, BillingCycle } from "./iyzico-config";

export { PLAN_PRICES };
export type { PlanType, BillingCycle };

let iyzipayInstance: any = null;

function getIyzipay() {
  if (!iyzipayInstance) {
    const API_KEY = process.env.IYZICO_API_KEY || '';
    const SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
    const BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

    if (!API_KEY || !SECRET_KEY) {
      console.warn("IYZICO_API_KEY or IYZICO_SECRET_KEY is missing.");
    }

    iyzipayInstance = new Iyzipay({
      apiKey: API_KEY,
      secretKey: SECRET_KEY,
      uri: BASE_URL
    });
  }
  return iyzipayInstance;
}

/**
 * İyzico Fiyat Formatlayıcı
 * Iyzico fiyatları .0 formatında bekler.
 */
function formatPrice(price: any): string {
  if (price === null || price === undefined) return "0.0";
  const numericPrice = parseFloat(price.toString());
  return numericPrice.toFixed(1);
}

export async function initializeCheckoutForm(params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const price = formatPrice(params.price);
    
    const request = {
      locale: 'tr',
      conversationId: params.conversationId || Math.floor(Math.random() * 1000000).toString(),
      price: price,
      paidPrice: price,
      currency: 'TRY',
      basketId: params.basketId || "B" + Math.floor(Math.random() * 1000000),
      paymentGroup: 'PRODUCT',
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: params.buyer.id || "BY" + Math.floor(Math.random() * 1000000),
        name: params.buyer.name || "Müşteri",
        surname: params.buyer.surname || "Soyad",
        gsmNumber: "+905000000000",
        email: params.buyer.email || "email@email.com",
        identityNumber: params.buyer.identityNumber || "11111111111",
        lastLoginDate: "2023-01-01 12:00:00",
        registrationDate: "2023-01-01 12:00:00",
        registrationAddress: params.buyer.registrationAddress || "Istanbul",
        ip: params.buyer.ip || "85.34.78.112",
        city: params.buyer.city || "Istanbul",
        country: params.buyer.country || "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: (params.buyer.name || "Müşteri") + " " + (params.buyer.surname || "Soyad"),
        city: params.buyer.city || "Istanbul",
        country: params.buyer.country || "Turkey",
        address: params.buyer.registrationAddress || "Istanbul",
        zipCode: "34000",
      },
      billingAddress: {
        contactName: (params.buyer.name || "Müşteri") + " " + (params.buyer.surname || "Soyad"),
        city: params.buyer.city || "Istanbul",
        country: params.buyer.country || "Turkey",
        address: params.buyer.registrationAddress || "Istanbul",
        zipCode: "34000",
      },
      basketItems: params.basketItems.map((item: any) => ({
        id: item.id || "I" + Math.floor(Math.random() * 1000000),
        name: item.name || "Ürün",
        category1: item.category1 || "Genel",
        itemType: item.itemType || "VIRTUAL",
        price: formatPrice(item.price),
      })),
    };

    getIyzipay().checkoutFormInitialize.create(request, function (err: any, result: any) {
      if (err) {
        console.error("Iyzipay Error:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function retrieveCheckoutForm(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    getIyzipay().checkoutForm.retrieve({
      locale: 'tr',
      token: token
    }, function (err: any, result: any) {
      if (err) {
        console.error("Iyzipay Retrieve Error:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

