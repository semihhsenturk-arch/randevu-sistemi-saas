import { useMemo } from "react";
import type { Appointment, FaceTreatment, InventoryItem } from "@/hooks/use-database";

/* ──────────────────────────────────────────────────────────────────
 *  useTransactionMapping
 * 
 *  Tek bir yerde, randevu ↔ işlem numarası eşleştirmesini hesaplar.
 *  Hem hasta-listesi hem dashboard bu hook'u kullanır.
 * ────────────────────────────────────────────────────────────────── */

export interface TxMappingResult {
  /** appointmentId → txNo  (ör: { "abc-123": "#ISL-0007" }) */
  appointmentTxMap: Record<string, string>;
  /** txNo → appointmentId  (ters yönde lookup) */
  txToAppointmentId: Record<string, string>;
}

/**
 * Tüm randevu ve profil verilerini alarak global txNo eşleştirmesi üretir.
 */
export function useTransactionMapping(
  appointments: Appointment[],
  profiles: Record<string, any>
): TxMappingResult {
  return useMemo(() => {
    const map: Record<string, string> = {};

    // Randevuları tarih+saat sırasına göre sırala
    const sorted = [...appointments]
      .filter(a => a.durum !== "iptal")
      .sort((a, b) => {
        if (a.created_at && b.created_at) {
          const cA = new Date(a.created_at).getTime();
          const cB = new Date(b.created_at).getTime();
          if (cA !== cB) return cA - cB;
        }
        const dComp = (a.tarih || "").localeCompare(b.tarih || "");
        if (dComp !== 0) return dComp;
        return (a.saat || "").localeCompare(b.saat || "");
      });

    // 1. Profillerdeki face_treatments'tan mevcut txNo'ları topla
    const manualTxNos = new Set<number>();
    const manualTxNoToApptId = new Map<number, string>();

    if (typeof window !== "undefined") {
      Object.keys(profiles).forEach(pName => {
        const pNameLower = pName.toLocaleLowerCase("tr-TR").trim();
        const p = profiles[pName];
        p.face_treatments?.forEach((t: FaceTreatment) => {
          if (t.transactionNo) {
            const m = t.transactionNo.match(/ISL[- ]*(\d+)/i);
            if (m) {
              const num = parseInt(m[1], 10);
              manualTxNos.add(num);

              const parts = (t.date || "").split(" ");
              let tDateStr = parts[0] || "";
              const tTimeStr = parts[1] || "";

              if (tDateStr.includes(".")) {
                const dateParts = tDateStr.split(".");
                if (dateParts.length === 3) {
                  tDateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                }
              }

              const possibleApts = sorted.filter(
                a =>
                  a.tarih === tDateStr &&
                  (a.musteriAdi || "").toLocaleLowerCase("tr-TR").trim() === pNameLower
              );

              // Aynı saatteki randevu varsa onu bağla
              let aptToBind = possibleApts.find(
                a =>
                  (a.saat || "") === tTimeStr &&
                  !Array.from(manualTxNoToApptId.values()).includes(a.id)
              );

              // Bulunamazsa, o günün henüz bağlanmamış herhangi bir randevusu
              if (!aptToBind) {
                aptToBind = possibleApts.find(
                  a => !Array.from(manualTxNoToApptId.values()).includes(a.id)
                );
              }

              if (aptToBind) {
                manualTxNoToApptId.set(num, aptToBind.id);
              }
            }
          }
        });
      });
    }

    // 2. Sıralı randevulara txNo ata
    let counter = 1;
    sorted.forEach(a => {
      let foundPreAssigned = false;
      for (const [num, aptId] of manualTxNoToApptId.entries()) {
        if (aptId === a.id) {
          map[a.id] = `#ISL-${num.toString().padStart(4, "0")}`;
          foundPreAssigned = true;
          manualTxNoToApptId.delete(num);
          break;
        }
      }
      if (!foundPreAssigned) {
        while (manualTxNos.has(counter)) {
          counter++;
        }
        map[a.id] = `#ISL-${counter.toString().padStart(4, "0")}`;
        manualTxNos.add(counter);
        counter++;
      }
    });

    // Ters mapping
    const txToAppointmentId: Record<string, string> = {};
    Object.entries(map).forEach(([aptId, txNo]) => {
      txToAppointmentId[txNo] = aptId;
    });

    return { appointmentTxMap: map, txToAppointmentId };
  }, [appointments, profiles]);
}

/* ──────────────────────────────────────────────────────────────────
 *  parseMaterialCost
 *
 *  Bir stock_history item'inin text alanından malzeme maliyetini
 *  güvenilir bir şekilde hesaplar.
 *  - Yapısal `cost_items` varsa → onu kullan (yeni format)
 *  - Yoksa → regex fallback (eski format)
 * ────────────────────────────────────────────────────────────────── */

export interface CostItem {
  name: string;
  amount: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

/**
 * Tek bir stock_history kaydından malzeme maliyetini çıkarır.
 * Eğer kayıtta yapısal `cost_items` varsa onu kullanır, yoksa text'ten regex ile parse eder.
 */
export function parseStockEntryCost(
  stockEntry: any,
  inventoryItems: InventoryItem[]
): { totalCost: number; items: CostItem[] } {
  // Yeni yapısal format: cost_items array'i varsa direkt onu kullan
  if (stockEntry.cost_items && Array.isArray(stockEntry.cost_items) && stockEntry.cost_items.length > 0) {
    let total = 0;
    const items: CostItem[] = stockEntry.cost_items.map((ci: any) => {
      const cost = (ci.unitCost || 0) * (ci.amount || 0);
      total += cost;
      return { name: ci.name, amount: ci.amount, unit: ci.unit, unitCost: ci.unitCost, totalCost: cost };
    });
    return { totalCost: total, items };
  }

  // Eski format: text'ten regex ile parse et
  const text: string = stockEntry.text || "";
  if (!text) return { totalCost: 0, items: [] };

  let totalCost = 0;
  const items: CostItem[] = [];

  text.split(", ").forEach((itemStr: string) => {
    const costMatch = itemStr.match(/\[Maliyet:\s*([\d.]+)\]/);
    const embeddedUnitPrice = costMatch ? parseFloat(costMatch[1]) : null;

    const cleanItemStr = itemStr
      .replace(/\s*\(Toplam Maliyet:.*?\)/g, "")
      .replace(/\s*\(Maliyet:.*?\)/g, "")
      .replace(/\s*\[Toplam Maliyet:.*?\]/g, "")
      .replace(/\s*\[Maliyet:.*?\]/g, "")
      .trim();

    const parts = cleanItemStr.split(" ");
    const amount = parseFloat(parts[0]) || 0;
    const unit = parts[1] || "";
    const name = parts.slice(2).join(" ");

    const invItem = inventoryItems.find(item => item.ad === name);
    const unitCost = embeddedUnitPrice !== null ? embeddedUnitPrice : (invItem?.fiyat || 0);
    const cost = unitCost * amount;
    totalCost += cost;

    items.push({ name: name || itemStr, amount, unit, unitCost, totalCost: cost });
  });

  return { totalCost, items };
}

/**
 * Belirli bir txNo ve hasta adı için toplam malzeme maliyetini hesaplar.
 * Kontrol seanslarının maliyetlerini de ana işleme ekler.
 */
export function calculateMaterialCostForTx(
  txNo: string,
  patientName: string,
  targetDateStr: string,
  patientProfiles: Record<string, any>,
  inventoryItems: InventoryItem[],
  allTxs?: { txNo: string; patientName: string; dateStr: string; type: string; isControl: boolean }[]
): number {
  let materialCost = 0;
  const profile = patientProfiles[patientName.toLocaleUpperCase("tr-TR")] || patientProfiles[patientName];
  if (!profile) return 0;

  const stockHistory = profile.stock_history || [];
  let relevantStocks: any[] = [];

  if (txNo && txNo !== "-") {
    relevantStocks = stockHistory.filter((h: any) => h.transaction_no === txNo);
  }
  if (relevantStocks.length === 0) {
    relevantStocks = stockHistory.filter(
      (h: any) =>
        !h.transaction_no &&
        (h.date.split(" ")[0] === targetDateStr ||
          (h.treatment_date && h.treatment_date.split(" ")[0] === targetDateStr))
    );
  }

  relevantStocks.forEach((stock: any) => {
    materialCost += parseStockEntryCost(stock, inventoryItems).totalCost;
  });

  // Kontrol seanslarının maliyetlerini de ekle
  if (txNo !== "-" && allTxs) {
    const childControls = allTxs.filter(
      t =>
        t.isControl &&
        (profile.face_treatments || []).some(
          (ft: any) => ft.transactionNo === t.txNo && ft.parentTransactionNo === txNo
        )
    );

    childControls.forEach(child => {
      const childDateStr = child.dateStr;
      const relevantStocksForChild = stockHistory.filter(
        (h: any) =>
          h.transaction_no === child.txNo ||
          (!h.transaction_no &&
            (h.date.split(" ")[0] === childDateStr ||
              (h.treatment_date && h.treatment_date.split(" ")[0] === childDateStr)))
      );
      relevantStocksForChild.forEach((stock: any) => {
        materialCost += parseStockEntryCost(stock, inventoryItems).totalCost;
      });
    });
  }

  return materialCost;
}

/**
 * Tüm profillerdeki txNo'ları toplar (dashboard'daki orphan hesabı için).
 */
export function collectAllTxNos(
  patientProfiles: Record<string, any>
): { txNo: string; patientName: string; dateStr: string; type: string; isControl: boolean }[] {
  const allTxs: { txNo: string; patientName: string; dateStr: string; type: string; isControl: boolean }[] = [];

  Object.keys(patientProfiles).forEach(pName => {
    const profile = patientProfiles[pName];
    if (profile.face_treatments) {
      profile.face_treatments.forEach((ft: any) => {
        if (ft.transactionNo && !allTxs.some(x => x.txNo === ft.transactionNo)) {
          const day = ft.date.split(" ")[0];
          allTxs.push({
            txNo: ft.transactionNo,
            patientName: pName,
            dateStr: day,
            type: ft.type || "",
            isControl: !!ft.isControl,
          });
        }
      });
    }
    if (profile.stock_history) {
      profile.stock_history.forEach((sh: any) => {
        if (sh.transaction_no && sh.transaction_no !== "-" && !allTxs.some(x => x.txNo === sh.transaction_no)) {
          const day = sh.treatment_date ? sh.treatment_date.split(" ")[0] : sh.date.split(" ")[0];
          allTxs.push({
            txNo: sh.transaction_no,
            patientName: pName,
            dateStr: day,
            type: "",
            isControl: sh.transaction_no.includes("-K"),
          });
        }
      });
    }
  });

  return allTxs;
}
