import Iyzipay from "iyzipay";
import { PLAN_PRICES, PlanType, BillingCycle } from "./iyzico-config";
export { PLAN_PRICES };
export type { PlanType, BillingCycle };

// İyzico API yapılandırması
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || "",
  secretKey: process.env.IYZICO_SECRET_KEY || "",
  uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
});

/**
 * İyzico Fiyat Formatlayıcı
 * SDK string bekler: "999.0"
 */
function formatPrice(price: any): string {
  const numericPrice = parseFloat(price.toString());
  return isNaN(numericPrice) ? "0.0" : numericPrice.toFixed(1);
}

export async function initializeCheckoutForm(params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: params.conversationId,
      price: formatPrice(params.price),
      paidPrice: formatPrice(params.price),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: params.basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
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
        itemType: item.itemType === "VIRTUAL" ? Iyzipay.BASKET_ITEM_TYPE.VIRTUAL : Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: formatPrice(item.price),
      })),
    };

    iyzipay.checkoutFormInitialize.create(request as any, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export async function retrieveCheckoutForm(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = {
      locale: Iyzipay.LOCALE.TR,
      token: token,
    };

    iyzipay.checkoutForm.retrieve(request as any, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
