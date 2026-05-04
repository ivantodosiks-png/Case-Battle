import { catalog } from "@/lib/game/catalog";
import { CasesGrid } from "@/components/cases/CasesGrid";

export default function CasesHomePage() {
  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl bg-panel/60 p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-1">
          <div className="font-display text-lg tracking-wide text-white">Кейсы</div>
          <div className="text-sm text-white/60">Открывай кейсы, пополняй инвентарь и пробуй апгрейд.</div>
        </div>
      </div>
      <CasesGrid cases={catalog.cases} />
    </div>
  );
}

