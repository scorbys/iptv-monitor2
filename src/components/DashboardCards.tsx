export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((card) => (
        <div
          key={card}
          className="bg-slate-2 dark:bg-slate-3 border border-slate-5 dark:border-slate-8 rounded-2xl shadow-sm p-6 min-h-[220px] flex flex-col justify-between transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-12 dark:text-slate-1 mb-2">
              Card Title {card}
            </h3>
            <p className="text-slate-10 dark:text-slate-5 text-sm">
              This is a card content. Use Radix Colors for consistent theming.
            </p>
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 rounded-lg bg-iris-9 text-white font-medium hover:bg-iris-10 dark:bg-iris-6 dark:hover:bg-iris-8 transition">
              Action
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
