import { IyzicoClient } from "./iyzipay-modern";
import { PLAN_PRICES, PlanType, BillingCycle } from "./iyzico-config";

export { PLAN_PRICES };
export type { PlanType, BillingCycle };

/**
 * Modern Iyzico API Yapılandırması
 * Eski 'iyzipay' kütüphanesi yerine modern, bağımsız istemciyi kullanıyoruz.
 * Bu sayede Vercel üzerindeki modül hataları tamamen çözülmüş oldu.
 */
const getIyzipay = () => new IyzicoClient({
  apiKey: process.env.IYZICO_API_KEY || "dummy_api_key",
  secretKey: process.env.IYZICO_SECRET_KEY || "dummy_secret_key",
  uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
});

/**
 * İyzico Fiyat Formatlayıcı
 */
function formatPrice(price: any): string {
  if (price === null || price === undefined) return "0.0";
  const numericPrice = parseFloat(price.toString());
  return isNaN(numericPrice) ? "0.0" : numericPrice.toFixed(1);
}

export async function initializeCheckoutForm(params: any): Promise<any> {
  const request = {
    locale: "tr",
    conversationId: params.conversationId,
    price: formatPrice(params.price),
    paidPrice: formatPrice(params.price),
    currency: "TRY",
    basketId: params.basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: params.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: params.buyer.id,
      name: params.buyer.name,
      surname: params.buyer.surname,
      gsmNumber: "+905350000000",
      email: params.buyer.email,
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
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      city: params.buyer.city || "Istanbul",
      country: params.buyer.country || "Turkey",
      address: params.buyer.registrationAddress || "Istanbul",
      zipCode: "34000",
    },
    billingAddress: {
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      city: params.buyer.city || "Istanbul",
      country: params.buyer.country || "Turkey",
      address: params.buyer.registrationAddress || "Istanbul",
      zipCode: "34000",
    },
    basketItems: params.basketItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      category1: item.category1,
      itemType: item.itemType === "VIRTUAL" ? "VIRTUAL" : "PHYSICAL",
      price: formatPrice(item.price),
    })),
  };

  return await getIyzipay().checkoutFormInitialize.create(request);
}

export async function retrieveCheckoutForm(token: string): Promise<any> {
  const request = {
    locale: "tr",
    token: token,
  };

  return await getIyzipay().checkoutForm.retrieve(request);
}
