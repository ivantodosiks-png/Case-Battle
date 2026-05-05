import { catalog } from "@/lib/game/catalog";
import { CasesGrid } from "@/components/cases/CasesGrid";

export default function CasesHomePage() {
  return (
    <div className="pb-10">
      <CasesGrid cases={catalog.cases} />
    </div>
  );
}

