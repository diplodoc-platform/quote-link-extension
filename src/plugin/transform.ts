import type MarkdownIt from 'markdown-it';

import {quoteLinkPlugin} from './plugin';
import {type Runtime, copyRuntime, dynrequire, hidden} from './utils';
import {ENV_FLAG_NAME} from './const';

/**
 * Options for the quote link transform plugin.
 */
export type TransformOptions = {
    /**
     * Runtime script and style paths. If a string, the same value is used for both.
     * When `bundle: true`, must be an object with `script` and `style`.
     */
    runtime?:
        | string
        | {
              script: string;
              style: string;
          };
    /** If true, copy built runtime files to the transform output directory. Default: true. */
    bundle?: boolean;
};

type NormalizedPluginOptions = Omit<TransformOptions, 'runtime'> & {
    runtime: Runtime;
};

/**
 * Registers the quote link rule and the after-ruler that fills env.meta and optionally copies runtime.
 * @internal
 */
const registerTransform = (
    md: MarkdownIt,
    {
        runtime,
        bundle,
        output,
    }: Pick<NormalizedPluginOptions, 'bundle' | 'runtime'> & {
        output: string;
    },
) => {
    md.use(quoteLinkPlugin);

    md.core.ruler.push('yfm_quote-link_after', ({env}) => {
        hidden(env, 'bundled', new Set<string>());

        if (env?.[ENV_FLAG_NAME]) {
            env.meta = env.meta || {};
            env.meta.script = env.meta.script || [];
            env.meta.script.push(runtime.script);
            env.meta.style = env.meta.style || [];
            env.meta.style.push(runtime.style);

            if (bundle) {
                copyRuntime({runtime, output}, env.bundled);
            }
        }
    });
};

type InputOptions = {
    destRoot: string;
};

/**
 * Creates a MarkdownIt plugin for the quote link extension.
 * Converts blockquotes whose first paragraph starts with a link carrying `data-quotelink`
 * into quote link blocks (custom token types + CSS class) and fills `env.meta` with script/style paths.
 *
 * @param options - Plugin configuration (runtime paths, whether to bundle files)
 * @returns MarkdownIt plugin function with a `collect` method for batch processing
 * @throws {TypeError} When `bundle` is true and `runtime` is a string (must be `{ script, style }`)
 */
export function transform(options: Partial<TransformOptions> = {}) {
    const {bundle = true} = options;

    if (bundle && typeof options.runtime === 'string') {
        throw new TypeError('Option `runtime` should be record when `bundle` is enabled.');
    }

    const runtime: Runtime =
        typeof options.runtime === 'string'
            ? {script: options.runtime, style: options.runtime}
            : options.runtime || {
                  script: '_assets/quote-link-extension.js',
                  style: '_assets/quote-link-extension.css',
              };

    const plugin: MarkdownIt.PluginWithOptions<{output?: string}> = function (
        md: MarkdownIt,
        {output = '.'} = {},
    ) {
        registerTransform(md, {
            runtime,
            bundle,
            output,
        });
    };

    Object.assign(plugin, {
        collect(input: string, {destRoot = '.'}: InputOptions) {
            const MdIt = dynrequire('markdown-it');
            const md = new MdIt().use((md: MarkdownIt) => {
                registerTransform(md, {
                    runtime,
                    bundle,
                    output: destRoot,
                });
            });

            md.parse(input, {});
        },
    });

    return plugin;
}
