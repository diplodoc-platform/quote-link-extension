/**
 * Defines a non-enumerable property on an object if it does not already exist.
 *
 * @param box - Object to attach the property to
 * @param field - Property key
 * @param value - Property value (used only when the property is created)
 * @returns The same object typed with the new property
 */
export function hidden<B extends Record<string | symbol, unknown>, F extends string | symbol, V>(
    box: B,
    field: F,
    value: V,
) {
    if (!(field in box)) {
        Object.defineProperty(box, field, {
            enumerable: false,
            value: value,
        });
    }

    return box as B & {[_P in F]: V};
}

/** Paths for the quote-link runtime script and stylesheet exposed in transform result. */
export type Runtime = {
    script: string;
    style: string;
};

declare const __dirname: string;

/**
 * Copies built runtime files (JS + CSS) to the output directory and records them in the cache.
 *
 * @param options - Runtime paths and output directory
 * @param cache - Set of already-copied file paths (avoids duplicate copies)
 */
export function copyRuntime(
    {runtime, output}: {runtime: Runtime; output: string},
    cache: Set<string>,
) {
    const PATH_TO_RUNTIME = '../runtime';
    const {join, resolve} = dynrequire('node:path');
    const runtimeFiles = {
        'index.js': runtime.script,
        'index.css': runtime.style,
    };
    for (const [originFile, outputFile] of Object.entries(runtimeFiles)) {
        const file = join(PATH_TO_RUNTIME, originFile);
        if (!cache.has(file)) {
            cache.add(file);
            copy(resolve(__dirname, file), join(output, outputFile));
        }
    }
}

/**
 * Copies a single file, creating the destination directory if needed.
 *
 * @param from - Source file path
 * @param to - Destination file path
 */
export function copy(from: string, to: string) {
    const {mkdirSync, copyFileSync} = dynrequire('node:fs');
    const {dirname} = dynrequire('node:path');

    mkdirSync(dirname(to), {recursive: true});
    copyFileSync(from, to);
}

/**
 * Dynamically requires a Node.js module by name.
 * Used so bundlers (e.g. esbuild) do not pull in optional dependencies at build time.
 *
 * @param module - Module name (e.g. `'markdown-it'`, `'node:path'`)
 * @returns The required module
 */
export function dynrequire(module: string) {
    // eslint-disable-next-line no-eval
    return eval(`require('${module}')`);
}
