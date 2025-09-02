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
    description: "Generate a new package for the Acme Monorepo",
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
        type: "confirm",
        name: "needsDocs",
        message: "Do you want documentation for this package?",
        default: false,
      },
      {
        type: "confirm",
        name: "hasEnv",
        message: "Do you want to have env variables exported?",
        default: false,
        when: (answers) => answers.type === "private",
      },
      {
        type: "confirm",
        name: "needsUI",
        message: "Do you need React configured?",
        default: false,
        when: (answers) => answers.type === "private",
      },
      {
        type: "confirm",
        name: "needsStyles",
        message: "Do you need to have extra CSS styles?",
        default: false,
        when: (answers) => !!answers.needsUI,
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
        skip: (answers: object) => {
          return ("hasEnv" in answers && !answers.hasEnv)
        },
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/src/styles.css",
        templateFile: "templates/styles.css.hbs",
        skip: (answers :object) => {    
          return ("needsStyles" in answers && !answers.needsStyles)
        }
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/docs/index.mdx",
        templateFile: "templates/docs/index.mdx.hbs",
        skip: (answers: object) => {
          return ("needsDocs" in answers && !answers.needsDocs)
        },
      },
      {
        type: "add",
        path: "{{ turbo.paths.root }}/packages/{{ dashCase name }}/docs/meta.json",
        templateFile: "templates/docs/meta.json.hbs",
        skip: (answers: object) => {
          return ("needsDocs" in answers && !answers.needsDocs)
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
          if (data.hasEnv) {
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
          if (data.needsUI) {
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
          if (data.needsStyles) {
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
          if (!data.needsUI) {
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
