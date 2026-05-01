import { IyzicoClient } from "./iyzipay-modern";
import { PLAN_PRICES, PlanType, BillingCycle } from "./iyzico-config";

export { PLAN_PRICES };
export type { PlanType, BillingCycle };

const getIyzipay = () => new IyzicoClient({
  apiKey: process.env.IYZICO_API_KEY || "dummy_api_key",
  secretKey: process.env.IYZICO_SECRET_KEY || "dummy_secret_key",
  uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
});

/**
 * İyzico Fiyat Formatlayıcı
 * Önemli: Iyzico fiyatları .0 formatında bekler.
 */
function formatPrice(price: any): string {
  if (price === null || price === undefined) return "0.0";
  const numericPrice = parseFloat(price.toString());
  // Eğer tam sayıysa .0 ekle, değilse olduğu gibi bırak ama 1-2 hane olsun
  if (Number.isInteger(numericPrice)) {
    return numericPrice.toFixed(1);
  }
  return numericPrice.toString();
}

export async function initializeCheckoutForm(params: any): Promise<any> {
  const price = formatPrice(params.price);
  
  const request = {
    locale: "tr",
    conversationId: params.conversationId || Math.floor(Math.random() * 1000000).toString(),
    price: price,
    paidPrice: price,
    currency: "TRY",
    basketId: params.basketId || "B" + Math.floor(Math.random() * 1000000),
    paymentGroup: "PRODUCT",
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
      itemType: "VIRTUAL",
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
