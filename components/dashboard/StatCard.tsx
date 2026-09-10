export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-3xl font-semibold text-neutral-900 mt-1">{value}</p>
    </div>
  );
}
