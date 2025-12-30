/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/renderer/**/*.{html,js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // Colores del sistema VR
                primary: {
                    DEFAULT: '#6366F1',
                    50: '#EEEEFF',
                    100: '#E0E1FE',
                    200: '#C3C5FD',
                    300: '#A5A8FC',
                    400: '#888CFB',
                    500: '#6366F1',
                    600: '#4F52E9',
                    700: '#3B3ED8',
                    800: '#2E31B0',
                    900: '#252888',
                    950: '#1C1F60',
                },
                header: {
                    DEFAULT: '#E85A5A',
                },
                login: {
                    bg: '#C5CDE8',
                },
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'spin-slow': 'spin 1.5s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
