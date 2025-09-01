import { MDXContent } from "@content-collections/mdx/react";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TypeTable: ({ ref, ...props }) => <TypeTable ref={ref} {...props} />,
    // HTML `ref` attribute conflicts with `forwardRef`
    // pre: ({ ref: _ref, ...props }) => (
    //   <CodeBlock {...props}>
    //     <Pre>{props.children}</Pre>
    //   </CodeBlock>
    // ),
    ...components,
  };
}

export function MDXRenderer(
  props: React.ComponentPropsWithRef<typeof MDXContent>,
) {
  return (
    <MDXContent
      {...props}
      code={props.code}
      components={getMDXComponents(props.components)}
    />
  );
}
