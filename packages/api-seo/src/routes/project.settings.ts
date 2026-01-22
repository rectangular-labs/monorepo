import { ORPCError } from "@orpc/client";
import {
  businessBackgroundSchema,
  imageSettingsSchema,
  publishingSettingsSchema,
  writingSettingsSchema,
} from "@rectangular-labs/core/schemas/project-parsers";
import { schema } from "@rectangular-labs/db";
import {
  deleteRemainingSeoProjectAuthors,
  getSeoProjectByIdentifierAndOrgId,
  getSeoProjectWithWritingSettingAndAuthors,
  upsertSeoProjectAuthors,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";
import { apiEnv } from "../env";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";
import { getImageSettingImages } from "../lib/project/get-image-setting-images";
import {
  getPrivateImageUri,
  getPublicImageUri,
  ProjectImageKindSchema,
} from "../lib/project/get-project-image-uri";

export const getBusinessBackground = withOrganizationIdBase
  .route({ method: "GET", path: "/{identifier}/business-background" })
  .input(type({ identifier: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      id: "string",
      name: "string|null",
      organizationId: "string",
      websiteUrl: "string.url",
      businessBackground: businessBackgroundSchema.or(type.null),
    }),
  )
  .handler(async ({ context, input }) => {
    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.identifier,
      context.organization.id,
      {
        businessBackground: true,
      },
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: projectResult.error.message,
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found with identifier.",
      });
    }
    return {
      id: projectResult.value.id,
      name: projectResult.value.name,
      organizationId: context.organization.id,
      websiteUrl: projectResult.value.websiteUrl,
      businessBackground: projectResult.value.businessBackground,
    };
  });

export const getImageSettings = withOrganizationIdBase
  .route({ method: "GET", path: "/{identifier}/image-settings" })
  .input(type({ identifier: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      id: "string",
      organizationId: "string",
      imageSettings: imageSettingsSchema.or(type.null),
    }),
  )
  .handler(async ({ context, input }) => {
    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.identifier,
      context.organization.id,
      {
        imageSettings: true,
      },
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: projectResult.error.message,
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found with identifier.",
      });
    }

    if (!projectResult.value.imageSettings) {
      return {
        imageSettings: null,
        id: projectResult.value.id,
        organizationId: context.organization.id,
      };
    }

    const imagesResult = await getImageSettingImages(
      projectResult.value.imageSettings,
    );
    if (!imagesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: imagesResult.error.message,
        cause: imagesResult.error,
      });
    }
    return {
      imageSettings: {
        ...projectResult.value.imageSettings,
        ...imagesResult.value,
      },
      id: projectResult.value.id,
      organizationId: context.organization.id,
    };
  });

export const getWritingSettings = withOrganizationIdBase
  .route({ method: "GET", path: "/{identifier}/writing-settings" })
  .input(type({ identifier: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      id: "string",
      organizationId: "string",
      writingSettings: writingSettingsSchema.or(type.null),
      authors: schema.seoProjectAuthorSelectSchema.array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const projectResult = await getSeoProjectWithWritingSettingAndAuthors(
      context.db,
      input.identifier,
      context.organization.id,
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: projectResult.error.message,
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found with identifier.",
      });
    }

    const projectWithAuthors = projectResult.value;

    return {
      ...projectWithAuthors,
      organizationId: context.organization.id,
    };
  });

export const getPublishingSettings = withOrganizationIdBase
  .route({ method: "GET", path: "/{identifier}/publishing-settings" })
  .input(type({ identifier: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      id: "string",
      organizationId: "string",
      publishingSettings: publishingSettingsSchema.or(type.null),
    }),
  )
  .handler(async ({ context, input }) => {
    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.identifier,
      context.organization.id,
      {
        publishingSettings: true,
      },
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: projectResult.error.message,
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found with identifier.",
      });
    }

    return {
      id: projectResult.value.id,
      organizationId: context.organization.id,
      publishingSettings: projectResult.value.publishingSettings,
    };
  });

export const upsertAuthors = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}/authors" })
  .input(
    type({
      id: "string",
      organizationIdentifier: "string",
      authors: schema.seoProjectAuthorInsertSchema
        .merge(type({ "id?": "string.uuid" }))
        .array(),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoProjectAuthorSelectSchema.array())
  .handler(async ({ context, input }) => {
    const result = await upsertSeoProjectAuthors(
      context.db,
      input.id,
      input.authors,
    );
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Something went wrong while updating authors",
        cause: result.error,
      });
    }

    const deletedResult = await deleteRemainingSeoProjectAuthors(
      context.db,
      input.id,
      result.value.map((author) => author.id),
    );

    if (!deletedResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Something went wrong while deleting authors",
        cause: deletedResult.error,
      });
    }
    return result.value;
  });

export const uploadProjectImage = withOrganizationIdBase
  .route({ method: "POST", path: "/{id}/image" })
  .input(
    type({
      id: "string",
      organizationIdentifier: "string",
      kind: ProjectImageKindSchema,
      files: type({
        name: "string",
        url: "string.url",
      }).array(),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      publicUris: "string[]",
      privateUris: "string[]",
    }),
  )
  .handler(async ({ context, input }) => {
    const { files, kind, id } = input;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ] as const;

    const maxSize =
      kind === "author-avatar"
        ? 500_000 // 500KB
        : 3_000_000; // 3MB

    const privateStore: { key: string; value: Blob }[] = [];
    const publicStore: { key: string; value: Blob }[] = [];
    for (const file of files) {
      // TODO (uploads): use presigned urls and upload directly from the frontend
      if (!file.url.startsWith("data:")) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File URL must be a data URL (starting with 'data:').",
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      let blob: Blob;
      try {
        blob = await fetch(file.url, {
          signal: controller.signal,
        }).then((res) => res.blob());
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Request timed out after 10 seconds.",
          });
        }
        throw new ORPCError("BAD_REQUEST", {
          message: "Failed to fetch file.",
          cause: error,
        });
      }
      // end todo

      if (!allowedTypes.includes(blob.type as (typeof allowedTypes)[number])) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Unsupported image type. Use jpeg, png, gif, or webp.",
        });
      }
      if (blob.size > maxSize) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            kind === "author-avatar"
              ? "Author avatar must be at most 500KB."
              : "Image must be at most 5MB.",
        });
      }

      if (kind === "author-avatar" || kind === "content-image") {
        publicStore.push({
          key: getPublicImageUri({
            orgId: context.organization.id,
            projectId: id,
            kind,
            fileName: file.name,
          }),
          value: blob,
        });
      } else {
        privateStore.push({
          key: getPrivateImageUri({
            orgId: context.organization.id,
            projectId: id,
            kind,
            fileName: file.name,
          }),
          value: blob,
        });
      }
    }
    await Promise.all([
      ...publicStore.map(({ key, value }) =>
        context.publicImagesBucket.storeImage(key, value),
      ),
      ...privateStore.map(({ key, value }) =>
        context.workspaceBucket.storeImage(key, value),
      ),
    ]);

    return {
      publicUris: publicStore.map(
        ({ key }) => `${apiEnv().SEO_PUBLIC_BUCKET_URL}/${key}`,
      ),
      privateUris: privateStore.map(({ key }) => key),
    } as const;
  });
