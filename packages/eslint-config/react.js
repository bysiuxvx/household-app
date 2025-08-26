module.exports = {
  extends: ['./index.js', 'plugin:react-hooks/recommended'],
  plugins: ['react', 'react-hooks', 'react-refresh'],
  rules: {
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/prop-types': 'off', // We use TypeScript for type checking
    'react/display-name': 'off',
    'react/no-unknown-property': ['error', { ignore: ['css'] }],

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Refresh
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // JSX specific rules
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-target-blank': 'warn',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
