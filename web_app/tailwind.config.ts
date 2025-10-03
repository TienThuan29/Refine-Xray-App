

module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'Helvetica', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'],
                mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'Monaco', 'monospace'],
            },
        },
    },
  plugins: [],
}
