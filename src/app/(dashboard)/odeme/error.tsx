"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function OdemeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Odeme Page Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md shadow-2xl border-red-100">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Bir Hata Oluştu</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-slate-500 text-sm">
            Ödeme sayfası yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => reset()}
              className="w-full bg-[#0a3d34] hover:bg-[#072b25] font-bold"
            >
              <RefreshCcw className="mr-2 w-4 h-4" />
              Tekrar Dene
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/takvim"}
              className="w-full border-slate-200 text-slate-600 font-bold"
            >
              <Home className="mr-2 w-4 h-4" />
              Takvime Git
            </Button>
          </div>
          
          {error.digest && (
            <p className="text-[10px] text-slate-400 mt-4">
              Hata Kodu: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
