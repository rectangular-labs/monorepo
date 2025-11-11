import { err, ok, safe } from "@rectangular-labs/result";
import { getContext } from "../../context";

export async function getGSCPropertyById(propertyId: string) {
  const context = await getContext();
  const gscProperty = await safe(() =>
    context.db.query.seoGscProperty.findFirst({
      where: (table, { eq }) => eq(table.id, propertyId),
      with: { account: true },
    }),
  );
  if (!gscProperty.ok) return gscProperty;
  if (!gscProperty.value)
    return err(new Error("Google Search Console property not found"));
  const account = gscProperty.value.account;
  const accessToken = await safe(() =>
    context.auth.api.getAccessToken({
      body: {
        accountId: account.id,
        userId: account.userId,
        providerId: account.providerId,
      },
    }),
  );
  if (!accessToken.ok) return accessToken;
  return ok({
    ...gscProperty.value,
    accessToken: accessToken.value.accessToken,
  });
}
