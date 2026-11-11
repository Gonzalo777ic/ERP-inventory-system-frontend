import type { ChartAccount } from "../../types/accounting";

export type AccountLookup = ReadonlyMap<number, ChartAccount>;

export function buildAccountLookup(
  accounts: readonly ChartAccount[],
): AccountLookup {
  return new Map(accounts.map((a) => [a.id, a]));
}

export function resolveAccountLabel(
  lookup: AccountLookup,
  accountId: number,
): { code: string; name: string } {
  const account = lookup.get(accountId);
  if (!account) {
    return { code: "—", name: `Cuenta #${accountId}` };
  }
  return { code: account.code, name: account.name };
}
