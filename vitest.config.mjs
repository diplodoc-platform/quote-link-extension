import {coverageConfigDefaults, defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        exclude: ['node_modules', 'build', 'dist', 'coverage'],
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: true,
        },
        coverage: {
            provider: 'v8',
            include: ['src/**'],
            exclude: [
                'src/**/__tests__/**',
                '**/*.spec.ts',
                '**/*.test.ts',
                ...coverageConfigDefaults.exclude,
            ],
            reporter: ['text', 'json', 'html', 'lcov'],
        },
    },
});
