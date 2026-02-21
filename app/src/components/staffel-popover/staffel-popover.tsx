'use client'

/**
 * Staffelbedragen explanation popover content.
 * Used in data-table footer (clickable word) and filter-panel (Staffel label).
 */
export function StaffelPopover({ position = 'below' }: { position?: 'above' | 'below' }) {
  const positionClass = position === 'above'
    ? 'absolute bottom-full left-0 mb-2'
    : 'absolute top-full left-0 mt-2'

  return (
    <div className={`${positionClass} w-80 bg-[var(--navy-dark)] text-white rounded-lg shadow-xl z-50 overflow-hidden`}>
      <div className="h-1 bg-[var(--pink)]" />
      <div className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Staffelbedragen</h3>
        <p className="text-xs text-white/80 mb-3">
          Inkoopuitgaven en COA-subsidies worden niet als exact bedrag gepubliceerd, maar in staffels (bandbreedtes). De getoonde bedragen zijn het <strong>gemiddelde</strong> van elke staffel. Voor staffel 13 (&gt;€150M) wordt €225M gebruikt.
        </p>
        <div className="border-t border-white/20 pt-3 mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/60">
                <th className="text-left pb-1 font-semibold">Staffel</th>
                <th className="text-left pb-1 font-semibold">Bandbreedte</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr><td className="py-0.5">0</td><td>Negatief – €0</td></tr>
              <tr><td className="py-0.5">1</td><td>€1 – €10.000</td></tr>
              <tr><td className="py-0.5">2</td><td>€10.001 – €50.000</td></tr>
              <tr><td className="py-0.5">3</td><td>€50.001 – €100.000</td></tr>
              <tr><td className="py-0.5">4</td><td>€100.001 – €250.000</td></tr>
              <tr><td className="py-0.5">5</td><td>€250.001 – €500.000</td></tr>
              <tr><td className="py-0.5">6</td><td>€500.001 – €1.000.000</td></tr>
              <tr><td className="py-0.5">7</td><td>€1.000.001 – €5.000.000</td></tr>
              <tr><td className="py-0.5">8</td><td>€5.000.001 – €10.000.000</td></tr>
              <tr><td className="py-0.5">9</td><td>€10.000.001 – €25.000.000</td></tr>
              <tr><td className="py-0.5">10</td><td>€25.000.001 – €50.000.000</td></tr>
              <tr><td className="py-0.5">11</td><td>€50.000.001 – €100.000.000</td></tr>
              <tr><td className="py-0.5">12</td><td>€100.000.001 – €150.000.000</td></tr>
              <tr><td className="py-0.5">13</td><td>Meer dan €150.000.001</td></tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 text-xs text-white/70 bg-white/5 rounded-lg p-2.5">
          <span className="text-sm leading-none mt-0.5">ℹ</span>
          <span>Bron: data.overheid.nl. Bedragen incl. BTW.</span>
        </div>
      </div>
    </div>
  )
}
