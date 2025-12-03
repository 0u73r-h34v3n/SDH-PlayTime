import deckyPlugin from "@decky/rollup";
import css from "rollup-plugin-import-css";
import replace from "@rollup/plugin-replace";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

export default deckyPlugin({
	plugins: [
		css(),
		replace({
			preventAssignment: true,
			values: {
				__PLUGIN_VERSION__: JSON.stringify(packageJson.version),
			},
		}),
	],
});
