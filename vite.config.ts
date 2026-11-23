import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import pluginExternal from "vite-plugin-external";

const manifest = JSON.parse(
	readFileSync(resolve(import.meta.dirname, "plugin.json"), "utf-8"),
);
const packageJson = JSON.parse(
	readFileSync(resolve(import.meta.dirname, "package.json"), "utf-8"),
);

export default defineConfig({
	plugins: [
		pluginExternal({
			externals: {
				react: "SP_REACT",
				"react-dom": "SP_REACTDOM",
				"react/jsx-runtime": "SP_JSX",
				"@decky/ui": "DFL",
				"@decky/manifest": JSON.stringify(manifest),
			},
		}),
	],
	define: {
		__PLUGIN_VERSION__: JSON.stringify(packageJson.version),
		"process.env.NODE_ENV": JSON.stringify(
			process.env.NODE_ENV || "production",
		),
	},
	build: {
		target: "es2022",
		lib: {
			entry: resolve(import.meta.dirname, "src/index.tsx"),
			name: manifest.name,
			formats: ["es"],
			fileName: "index",
		},
		sourcemap: process.env.VITE_SOURCEMAP === "true",
		rolldownOptions: {
			context: "window",
			output: {
				dir: "dist",
				format: "esm",
				minify: true,
				sourcemapPathTransform: (relativeSourcePath) =>
					relativeSourcePath.replace(
						/^\.\.\//,
						`decky://decky/plugin/${encodeURIComponent(manifest.name)}/`,
					),
				exports: "default",
			},
		},
	},
	resolve: {
		alias: {
			"@src": resolve(import.meta.dirname, "src"),
			"@type": resolve(import.meta.dirname, "types"),
			"@utils": resolve(import.meta.dirname, "src/utils"),
		},
	},
});
