// components/MarketplaceTable.tsx
type Row = {
  market: string;
  finalPrice: string; // „Endpreis“ inkl. Fees/FX
  trend7d: string;    // z. B. "+3.2%" oder "-1.1%"
  link: string;
};

const data: Row[] = [
  { market: "Steam Community Market", finalPrice: "€ 12,49", trend7d: "+2,1%", link: "#" },
  { market: "Buff163",                finalPrice: "€ 11,98", trend7d: "+0,4%", link: "#" },
  { market: "CSFloat",                finalPrice: "€ 12,10", trend7d: "-0,8%", link: "#" },
];

export default function MarketplaceTable() {
  return (
    <div className="mt-16 border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">
          Live‑Vergleich (Demo)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Endpreise inkl. Gebühren & Währungsumrechnung. Trend über die letzten 7 Tage.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left font-medium px-6 py-3 whitespace-nowrap">Marktplatz</th>
              <th className="text-left font-medium px-6 py-3 whitespace-nowrap">Endpreis</th>
              <th className="text-left font-medium px-6 py-3 whitespace-nowrap">Trend (7d)</th>
              <th className="text-left font-medium px-6 py-3 whitespace-nowrap">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => {
              const up = row.trend7d.trim().startsWith("+");
              return (
                <tr key={row.market} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{row.market}</td>
                  <td className="px-6 py-3 font-medium">{row.finalPrice}</td>
                  <td className={`px-6 py-3 font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
                    {row.trend7d}
                  </td>
                  <td className="px-6 py-3">
                    <a
                      href={row.link}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Öffnen
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}