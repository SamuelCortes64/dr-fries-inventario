import { Suspense } from "react";
import { EnviosPage } from "@/components/pages/EnviosPage";

export default function Envios() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Cargando...</div>}>
      <EnviosPage />
    </Suspense>
  );
}
