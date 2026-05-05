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
      <div className="glass ring-soft rounded-2xl p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">{lootCase.name}</div>
            <div className="text-sm text-white/60">Открытие на сервере. Забирай предмет или продавай за баланс.</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill">{lootCase.itemIds.length} предметов</span>
            <span className="pill">{lootCase.price} ₽</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-3">
          <div className="glass ring-soft rounded-2xl p-4">
            <CaseOpenPanel lootCase={lootCase} />
          </div>
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

