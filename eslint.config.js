import pluginVue from 'eslint-plugin-vue';
import fs from 'fs';
import path from 'path';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import { fileURLToPath } from 'url';
import { configureVueProject } from '@vue/eslint-config-typescript';

configureVueProject({ scriptLangs: ['ts', 'tsx'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const autoImportsPath = path.resolve(__dirname, './auto-import.json');
const autoImports = JSON.parse(fs.readFileSync(autoImportsPath, 'utf-8'));

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'typed-router.d.ts'],
  },

  pluginVue.configs['flat/recommended'],
  eslintPluginPrettierRecommended,
  vueTsConfigs.recommended,
  [
    {
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
          ...globals.es2021,
        },
      },
      ignores: ['dist'],
      rules: {
        'no-irregular-whitespace': 'error',
        'vue/attribute-hyphenation': ['error', 'always'],
        'vue/multi-word-component-names': 'off',
        'vue/no-deprecated-v-on-native-modifier': 'off',
        'prefer-const': 'error',
        'no-undef': 'error',
        'no-var': 'error',
        'vue/no-unused-properties': [
          'error',
          {
            ignorePublicMembers: true,
            groups: ['props', 'methods', 'computed', 'data'],
          },
        ],
        'padded-blocks': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'no-multiple-empty-lines': ['error', { max: 1 }],
        'key-spacing': [
          'error',
          {
            beforeColon: false,
            afterColon: true,
          },
        ],
        'space-infix-ops': 'error',
        'no-multi-spaces': 'error',
        'array-bracket-spacing': ['error', 'never'],
        'array-callback-return': 'error',
        'arrow-spacing': 'error',
        'block-spacing': 'error',
        'brace-style': 'error',
        camelcase: 'off',
        'default-case': 'error',
        eqeqeq: 'off',
        'no-alert': 'off',
        'prefer-rest-params': 'off',
        'no-await-in-loop': 'off',
        'no-console': 'off',
        'no-debugger': 'off',
        'no-else-return': 'error',
        'no-empty-function': 'error',
        'no-labels': 'off',
        'no-loop-func': 'error',
        'no-new': 'off',
        'no-prototype-builtins': 'off',
        'no-return-await': 'error',
        'no-shadow': 'error',
        'no-useless-catch': 'off',
        'prefer-spread': 'error',
        'require-await': 'error',
        'template-curly-spacing': 'off',
        'vue/comma-spacing': [
          'error',
          {
            before: false,
            after: true,
          },
        ],
        'vue/component-definition-name-casing': ['error', 'PascalCase'],
        'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
        'vue/custom-event-name-casing': ['error', 'kebab-case', { ignores: ['/^[a-z]+(?:-[a-z]+)*:[a-z]+(?:-[a-z]+)*$/u'] }],
        'vue/html-end-tags': 'error',
        'vue/match-component-file-name': [
          'error',
          {
            extensions: ['vue'],
            shouldMatchCase: false,
          },
        ],
        'vue/no-v-html': 'off',
        'vue/require-default-prop': 'off',
        'vue/this-in-template': ['error', 'never'],
        'vue/v-bind-style': ['error', 'shorthand'],
        'vue/v-on-style': ['error', 'shorthand'],
        'comma-spacing': [
          'error',
          {
            before: false,
            after: true,
          },
        ],
      },
    },
  ],
  {
    name: 'app/rules-to-override',
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          endOfLine: 'auto',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
      ],
      'vue/no-v-text-v-html-on-component': 'off',
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        {
          blankLine: 'always',
          prev: 'if',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'if',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'return',
          next: '*',
        },
      ],
      'space-in-parens': ['error', 'never'],
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true,
        },
      ],
      'quote-props': ['error', 'as-needed'],
      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true,
        },
      ],
      curly: ['error', 'all'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Ignore variables that start with an underscore
          varsIgnorePattern: '^_', // Ignore variables that start with an underscore
          caughtErrorsIgnorePattern: '^_', // Ignore caught errors that start with an underscore
        },
      ],
      'vue/no-multi-spaces': 'error',
      'vue/html-closing-bracket-spacing': [
        'error',
        {
          startTag: 'never',
          endTag: 'never',
          selfClosingTag: 'always',
        },
      ],
    },
  },
  {
    name: 'app/auto-imports',
    languageOptions: { globals: autoImports.globals },
  },
);
