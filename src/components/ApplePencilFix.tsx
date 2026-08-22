"use client";

import { useEffect } from "react";

export function ApplePencilFix() {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Sadece Apple Pencil (pen) için müdahale et
      if (e.pointerType === "pen") {
        const target = e.target as HTMLElement;
        
        // Eğer tıklanan element tıklanabilir bir elementse (buton, link veya onClick olan bir div/span)
        // tıklamayı anında tetikle ve Safari'nin varsayılan davranışını (çizim/seçim modunu) engelle.
        const isClickable = target.closest('button, a, [role="button"], .cursor-pointer, [onclick]');
        
        if (isClickable) {
          // Safari'nin kalemi "kaydırma/çizim/metin seçme/Scribble" moduna geçirmesini GÜÇLÜ bir şekilde önle
          e.preventDefault();
          e.stopPropagation();
          
          // Biraz gecikme ile tıklatıyoruz ki React event döngüsü bozulmasın
          setTimeout(() => {
            if (isClickable instanceof HTMLElement) {
              isClickable.click();
            } else {
              target.click();
            }
          }, 10);
        }
      }
    };

    // Capture phase'de yakalayalım ki React'ten önce devreye girsin
    document.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: false });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
    };
  }, []);

  return null;
}
