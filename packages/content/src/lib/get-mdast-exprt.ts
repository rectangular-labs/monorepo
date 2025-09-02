import { valueToEstree } from "estree-util-value-to-estree";
import type { RootContent } from "mdast";
import type { MdxjsEsm } from "mdast-util-mdxjs-esm";

declare module "mdast" {
  interface RootContentMap {
    mdxjsEsm: MdxjsEsm;
  }
}

/**
 * MDX.js first converts javascript (with esm support) into mdast nodes with remark-mdx, then handle the other remark plugins
 *
 * Therefore, if we want to inject an export, we must convert the object into AST, then add the mdast node
 */
export function getMdastExport(name: string, value: unknown): RootContent {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            attributes: [],
            specifiers: [],
            source: null,
            declaration: {
              type: "VariableDeclaration",
              kind: "let",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name,
                  },
                  init: valueToEstree(value),
                },
              ],
            },
          },
        ],
      },
    },
  };
}
