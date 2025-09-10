import { execSync } from "node:child_process";
import type { PlopTypes } from "@turbo/gen";

interface TSConfig {
  compilerOptions: {
    lib?: string[];
    jsx?: string;
  };
}

interface PackageJson {
  name: string;
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: Record<string, {types?: string, default?: string, imports?: string}|string>;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "Generate a new package for the Monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@rectangular-labs/` prefix)",
        validate: (input: string) => {
          if (!input) {
            return "package name is required";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "type",
        message: "What type of package should be created?",
        choices: ["public", "private"],
      },
      {
        type: "checkbox",
        name: "features",
        message: "Select features to include",
        choices: [
          { name: "Documentation", value: "docs" },
          { name: "Env variables", value: "env" },
          { name: "React UI", value: "react" },
          { name: "Extra CSS styles", value: "styles" },
          { name: "", value:""}
        ],
        default: [],
      },
    ],
    actions: [
      (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          if (answers.name.startsWith("@rectangular-labs/")) {
            answers.name = answers.name.replace("@rectangular-labs/", "");
          }
        }
        return "Config sanitized";
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/package.json",
        skip: (answer: object) => {
          if ("type" in answer && answer.type === "private") {
            return "Skipping public package.json for private package";
          }
          return;
        },
        templateFile: "templates/public-package.json.hbs",
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/tsup.config.ts",
        skip: (answer: object) => {
          if ("type" in answer && answer.type === "private") {
            return "Skipping tsup.config.ts for private package";
          }
          return;
        },
        templateFile: "templates/tsup.config.ts.hbs",
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/package.json",
        skip: (answer: object) => {
          if ("type" in answer && answer.type === "public") {
            return "Skipping private package.json for public package";
          }
          return;
        },
        templateFile: "templates/private-package.json.hbs",
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/tsconfig.json",
        templateFile: "templates/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/src/index.ts",
        template: "export const name = '{{ name }}';",
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/src/env.ts",
        templateFile: "templates/env.ts.hbs",
        skip: (answers: {features?: string[]}) => {
         return answers.features?.includes("env") ? undefined : "Skipping env.ts"
        },
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/src/styles.css",
        templateFile: "templates/styles.css.hbs",
        skip: (answers :{features?: string[]}) => {    
          return answers.features?.includes("styles") ? undefined : "Skipping styles.css"
        }
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/docs/index.mdx",
        templateFile: "templates/docs/index.mdx.hbs",
        skip: (answers: {features?: string[]}) => {
          return answers.features?.includes("docs") ? undefined : "Skipping docs/index.mdx"
        },
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/docs/meta.json",
        templateFile: "templates/docs/meta.json.hbs",
        skip: (answers: {features?: string[]}) => {
          return answers.features?.includes("docs") ? undefined : "Skipping docs/meta.json"
        },
      },
      {
        type: "modify",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/package.json",
        async transform(content, data) {
          const grabPackageVersion = async (packageName: string) => {
            const version = await fetch(
              `https://registry.npmjs.org/-/package/${packageName}/dist-tags`,
            )
              .then(async (res) => {
                if (!res.ok) {
                  // For workspace packages, the fetch call will fail, so we return the workspace version
                  return { latest: "workspace:*" };
                }
                const result = await res.json();
                return result;
              })
              .then((json) => {
                return (json as { latest: string }).latest;
              });
            return version;
          };

          const pkg = JSON.parse(content) as PackageJson;
   
          // Ensure objects exist
          pkg.dependencies ||= {};
          pkg.devDependencies ||= {};
          pkg.peerDependencies ||= {};
          pkg.exports ||= {};

          // ENV support
          if (data.features.includes("env")) {
            pkg.dependencies["@t3-oss/env-core"] ||= "";
            pkg.dependencies["arktype"] ||= "";
            pkg.devDependencies["@types/node"] ||= "";

            // Add exports for env
            const exportsField = pkg.exports 
            exportsField["./env"] = {
              types: "./dist/src/env.d.ts",
              default: "./src/env.ts",
            };
          }

          // UI support
          if (data.features.includes("react")) {
            pkg.devDependencies["@rectangular-labs/ui"] ||= "";
            pkg.peerDependencies["@rectangular-labs/ui"] ||= "";
            pkg.devDependencies["react"] ||= "";
            pkg.devDependencies["react-dom"] ||= "";
            pkg.devDependencies["@types/react"] ||= "";
            pkg.devDependencies["@types/react-dom"] ||= "";
            pkg.peerDependencies["react"] ||= "";
            pkg.peerDependencies["react-dom"] ||= "";
          }

          // Styles export when requested
          if (data.features.includes("styles")) {
            const exportsField = pkg.exports;
            exportsField["./styles.css"] = "./src/styles.css";
          }

          // Normalize dependency versions (dev, deps, and peers)
          // Automatically update the package.json with the latest version of the dependencies
          const updateVersions = async (
            deps: Record<string, string> | undefined,
          ) => {
            if (!deps) return;
            for (const depName of Object.keys(deps)) {
              const version = await grabPackageVersion(depName);
              deps[depName] = version.startsWith("workspace:")
                ? version
                : `^${version}`;
            }
          };
          await updateVersions(pkg.devDependencies);
          await updateVersions(pkg.dependencies);
          await updateVersions(pkg.peerDependencies);

          return JSON.stringify(pkg, null, 2);
        },
      },
      {
        type: "modify",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/tsconfig.json",
        async transform(content, data) {
          if (!data.features.includes("react")) {
            return content
          }
          const tsConfig = JSON.parse(content) as TSConfig
          tsConfig.compilerOptions.jsx = "preserve";
          tsConfig.compilerOptions.lib = ["ES2024", "DOM", "DOM.Iterable"];
          
          return JSON.stringify(tsConfig, null, 2);
        },
      },
      (answers) => {
        // Install deps and format everything
        if ("name" in answers && typeof answers.name === "string") {
          execSync("pnpx sherif@latest -f", { stdio: "inherit" });
          execSync("pnpm i", { stdio: "inherit" });
          execSync("pnpm run format", { stdio: "inherit" });
          execSync("pnpm run lint", { stdio: "inherit" });
          return "Package scaffolded";
        }
        return "Package not scaffolded";
      },
    ],
  });
}
