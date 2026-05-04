import { notFound } from "next/navigation";
import { getCase } from "@/lib/game/catalog";
import { CaseOpenPanel } from "@/components/cases/CaseOpenPanel";
import { CaseContents } from "@/components/cases/CaseContents";
import { CaseQuickList } from "@/components/cases/CaseQuickList";

export default function CasePage({ params }: { params: { caseId: string } }) {
  const lootCase = getCase(params.caseId);
  if (!lootCase) return notFound();

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl bg-panel/60 p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">{lootCase.name}</div>
            <div className="text-sm text-white/60">Содержимое ниже. Открытие — с серверным RNG.</div>
          </div>
          <div className="text-sm text-white/70">Цена: {lootCase.price} ₽</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-3">
          <CaseOpenPanel lootCase={lootCase} />
          <div className="lg:hidden">
            <CaseQuickList lootCase={lootCase} />
          </div>
          <CaseContents lootCase={lootCase} />
        </div>
        <div className="hidden lg:block">
          <CaseQuickList lootCase={lootCase} />
        </div>
      </div>
    </div>
  );
}
