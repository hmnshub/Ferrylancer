import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleEarnings } from "../data/sampleData";
import { Badge, Card, Icon, PageHeader, PrimaryButton } from "../ui/primitives";

export default function Earnings({ session }) {
  const { data: wallet } = useSupabaseQuery(
    (sb) => sb.from("wallets").select("*").eq("user_id", session?.user?.id || "").maybeSingle(),
    [session?.user?.id],
    sampleEarnings
  );

  const { data: transactions } = useSupabaseQuery(
    (sb) => sb.from("transactions").select("*").eq("user_id", session?.user?.id || "").order("created_at", { ascending: false }),
    [session?.user?.id],
    sampleEarnings.transactions
  );

  return (
    <div>
      <PageHeader
        title="Earnings & Wallet"
        actions={
          <PrimaryButton>
            <Icon className="text-[18px]">account_balance_wallet</Icon>
            Withdraw
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#565e74]">Available Balance</div>
          <div className="mt-1 text-2xl font-bold text-[#0b1c30]">${wallet.balance ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#565e74]">Pending</div>
          <div className="mt-1 text-2xl font-bold text-[#0b1c30]">${wallet.pending ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#565e74]">Lifetime Earnings</div>
          <div className="mt-1 text-2xl font-bold text-[#0b1c30]">${wallet.lifetime ?? 0}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[#e5eeff] p-5">
          <h2 className="text-base font-bold text-[#0b1c30]">Transaction History</h2>
        </div>
        <div className="divide-y divide-[#e5eeff]">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-semibold text-[#0b1c30]">{t.label}</div>
                <div className="text-xs text-[#565e74]">{t.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#0b1c30]">+${t.amount}</span>
                <Badge tone={t.status === "Completed" ? "success" : "warning"}>{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
