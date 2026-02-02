import { Suspense } from "react";
import { ProduccionPage } from "@/components/pages/ProduccionPage";

export default function Produccion() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Cargando...</div>}>
      <ProduccionPage />
    </Suspense>
  );
}
