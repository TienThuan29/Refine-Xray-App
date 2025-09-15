import {heroui} from '@heroui/theme';

module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/components/(toast|spinner).js"
  ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'Helvetica', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'],
                mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'Monaco', 'monospace'],
            },
        },
    },
  plugins: [heroui()],
}
