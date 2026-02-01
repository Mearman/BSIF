import eslint from "@eslint/js";
import jsonc from "eslint-plugin-jsonc";
import tseslint from "typescript-eslint";
import type { ConfigArray } from "typescript-eslint";

const jsoncPlugin = { jsonc: jsonc };

export default [
	// Global ignores
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			"coverage/**",
			"*.config.ts",
		],
	},

	// Base ESLint recommended rules
	{
		...eslint.configs.recommended,
		files: ["**/*.ts", "**/*.js"],
	},

	// TypeScript (strict type-aware) - only for src/**/*.ts files
	...tseslint.configs.strictTypeChecked.map((config) => ({
		...config,
		files: ["src/**/*.ts"],
	})),
	...tseslint.configs.stylisticTypeChecked.map((config) => ({
		...config,
		files: ["src/**/*.ts"],
	})),
	{
		files: ["src/**/*.ts"],
		linterOptions: {
			noInlineConfig: true,
		},
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["*.config.ts"],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowNumber: true },
			],
			"@typescript-eslint/restrict-plus-operands": [
				"error",
				{ allowNumberAndString: true },
			],
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/non-nullable-type-assertion-style": "off",
			"@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
			"@typescript-eslint/only-throw-error": "off",
			indent: ["error", "tab"],
			quotes: ["error", "double", { avoidEscape: true }],
		},
	},

	// TypeScript (basic rules without type checking) - for test files
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ["test/**/*.ts"],
	})),
	{
		files: ["test/**/*.ts"],
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/ban-ts-comment": ["error", {
				"ts-check": false,
				"ts-expect-error": "allow-with-description",
				"ts-ignore": true,
				"ts-nocheck": true,
			}],
			indent: ["error", "tab"],
			quotes: ["error", "double", { avoidEscape: true }],
		},
	},

	// JSON files
	...jsonc.configs["flat/recommended-with-json"].map((config) => ({
		...config,
		files: ["**/*.json"],
		ignores: ["**/*.md/**"],
	})),
	{
		files: ["**/*.json"],
		ignores: ["**/*.md/**", "package.json"],
		rules: {
			"jsonc/indent": ["error", "tab"],
			"jsonc/quotes": ["error", "double"],
			"jsonc/sort-keys": ["error", { pathPattern: "^(?!scripts|dependencies|devDependencies$).*$", order: { type: "asc" } }],
		},
	},

	// package.json - conventional field ordering
	{
		files: ["package.json"],
		plugins: jsoncPlugin,
		rules: {
			"jsonc/sort-keys": ["error",
				{
					pathPattern: "^$",
					order: [
						"name",
						"version",
						"description",
						"type",
						"exports",
						"bin",
						"files",
						"scripts",
						"dependencies",
						"devDependencies",
						"engines",
					],
				},
				{
					pathPattern: "^(?:dependencies|devDependencies)$",
					order: { type: "asc" },
				},
				{
					pathPattern: "^scripts$",
					order: { type: "asc" },
				},
			],
		},
	},
] satisfies ConfigArray;
