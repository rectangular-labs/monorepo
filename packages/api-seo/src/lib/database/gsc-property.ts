import { err, ok, safe } from "@rectangular-labs/result";
import { getContext, getWebsocketContext } from "../../context";

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

export async function getGSCPropertyInWebsocketChat() {
  const websocketContext = getWebsocketContext();
  if (websocketContext.cache.gscProperty) {
    return ok(websocketContext.cache.gscProperty);
  }
  const gscPropertyId = websocketContext.cache.project?.gscPropertyId;
  if (!gscPropertyId) {
    return ok(null);
  }

  const gscPropertyResult = await getGSCPropertyById(gscPropertyId);
  if (!gscPropertyResult.ok) {
    return gscPropertyResult;
  }
  websocketContext.cache.gscProperty = gscPropertyResult.value;
  return ok(gscPropertyResult.value);
}
