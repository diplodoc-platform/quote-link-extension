import transform from '@diplodoc/transform';
import dd from 'ts-dedent';
import MarkdownIt from 'markdown-it';
import attrs from 'markdown-it-attrs';

import * as quoteLinkExtension from '../../src/plugin';

const html = (text: string, opts?: quoteLinkExtension.TransformOptions) => {
    const {result} = transform(text, {
        plugins: [quoteLinkExtension.transform({bundle: false, ...opts})],
    });

    return result.html;
};

const meta = (text: string, opts?: quoteLinkExtension.TransformOptions) => {
    const {result} = transform(text, {
        plugins: [quoteLinkExtension.transform({bundle: false, ...opts})],
    });

    return result.meta;
};

const parse = (text: string, opts?: quoteLinkExtension.TransformOptions) => {
    const md = new MarkdownIt().use(quoteLinkExtension.transform({bundle: false, ...opts}));
    md.use(attrs, {leftDelimiter: '{', rightDelimiter: '}'});
    return md.parse(text, {});
};

describe('Quote link extension - plugin', () => {
    it('should render single quote link', () => {
        expect(
            html(dd`
            > [Quote link](https://ya.ru){data-quotelink}
            >
            > quote link text
            `),
        ).toBe(
            dd`
            <blockquote class="yfm-quote-link">
            <p><a href="https://ya.ru" data-quotelink>Quote link</a></p>
            <p>quote link text</p>
            </blockquote>
            ` + '\n',
        );
    });

    it('should render nested quote link', () => {
        expect(
            html(dd`
            > [Quote link](https://ya.ru){data-quotelink="true"}
            >
            > quote link text
            >
            > > [Nested](https://nested.ru){data-quotelink="true"}
            > >
            > > nested link text
            `),
        ).toBe(
            dd`
            <blockquote class="yfm-quote-link">
            <p><a href="https://ya.ru" data-quotelink="true">Quote link</a></p>
            <p>quote link text</p>
            <blockquote class="yfm-quote-link">
            <p><a href="https://nested.ru" data-quotelink="true">Nested</a></p>
            <p>nested link text</p>
            </blockquote>
            </blockquote>
            ` + '\n',
        );
    });

    it('should render simple quote inside quote link', () => {
        expect(
            html(dd`
            > [Quote link](https://ya.ru){data-quotelink="true"}
            >
            > quote link text
            >
            > > Simple quote
            > >
            > > simple quote text
            `),
        ).toBe(
            dd`
            <blockquote class="yfm-quote-link">
            <p><a href="https://ya.ru" data-quotelink="true">Quote link</a></p>
            <p>quote link text</p>
            <blockquote>
            <p>Simple quote</p>
            <p>simple quote text</p>
            </blockquote>
            </blockquote>
            ` + '\n',
        );

        expect(
            html(dd`
            > [Quote link](https://ya.ru){data-quotelink="true"}
            >
            > quote link text
            >
            > > [Simple quote with link](https://nested.ru)
            > >
            > > simple quote text
            `),
        ).toBe(
            dd`
            <blockquote class="yfm-quote-link">
            <p><a href="https://ya.ru" data-quotelink="true">Quote link</a></p>
            <p>quote link text</p>
            <blockquote>
            <p><a href="https://nested.ru">Simple quote with link</a></p>
            <p>simple quote text</p>
            </blockquote>
            </blockquote>
            ` + '\n',
        );
    });

    it('should render quote link inside simple quote', () => {
        expect(
            html(dd`
            > Simple quote
            >
            > simple quote text
            >
            > > [Nested quote link](https://nested.ru){data-quotelink="true"}
            > >
            > > nested quote link text
            `),
        ).toBe(
            dd`
            <blockquote>
            <p>Simple quote</p>
            <p>simple quote text</p>
            <blockquote class="yfm-quote-link">
            <p><a href="https://nested.ru" data-quotelink="true">Nested quote link</a></p>
            <p>nested quote link text</p>
            </blockquote>
            </blockquote>
            ` + '\n',
        );

        expect(
            html(dd`
            > [Simple link](https://ya.ru)
            >
            > simple link text
            >
            > > [Nested quote link](https://nested.ru){data-quotelink="true"}
            > >
            > > nested quote link text
            `),
        ).toBe(
            dd`
            <blockquote>
            <p><a href="https://ya.ru">Simple link</a></p>
            <p>simple link text</p>
            <blockquote class="yfm-quote-link">
            <p><a href="https://nested.ru" data-quotelink="true">Nested quote link</a></p>
            <p>nested quote link text</p>
            </blockquote>
            </blockquote>
            ` + '\n',
        );
    });

    it('should render simple quote without link', () => {
        expect(html('> quote text')).toBe(
            dd`
            <blockquote>
            <p>quote text</p>
            </blockquote>
            ` + '\n',
        );

        expect(
            html(dd`
        > [Simple link](https://ya.ru)
        >
        > link text
        `),
        ).toBe(
            dd`
            <blockquote>
            <p><a href="https://ya.ru">Simple link</a></p>
            <p>link text</p>
            </blockquote>
            ` + '\n',
        );
    });

    it('should not add assets to meta if no yfm-quote-link is found', () => {
        expect(meta('paragraph')).toBeUndefined();
    });

    it('should add default assets to meta', () => {
        expect(
            meta(dd`
            > [Quote link](https://ya.ru){data-quotelink="true"}
            >
            > quote link text
            `),
        ).toStrictEqual({
            script: ['_assets/quote-link-extension.js'],
            style: ['_assets/quote-link-extension.css'],
        });
    });

    it('should add custom assets to meta', () => {
        expect(
            meta(
                dd`
                > [Quote link](https://ya.ru){data-quotelink="true"}
                >
                > quote link text
                `,
                {runtime: 'yfm-quote-link'},
            ),
        ).toStrictEqual({
            script: ['yfm-quote-link'],
            style: ['yfm-quote-link'],
        });
    });

    it('should add custom assets to meta 2', () => {
        expect(
            meta(
                dd`
                > [Quote link](https://ya.ru){data-quotelink="true"}
                >
                > quote link text
                `,
                {
                    runtime: {script: 'yfm-quote-link.script', style: 'yfm-quote-link.style'},
                },
            ),
        ).toStrictEqual({script: ['yfm-quote-link.script'], style: ['yfm-quote-link.style']});
    });

    it('should parse markup with quote link to token stream', () => {
        expect(
            parse(dd`
            > [Quote link](https://ya.ru){data-quotelink="true"} content after qoute link
            >
            > quote link text
            `),
        ).toMatchSnapshot();
    });
});
