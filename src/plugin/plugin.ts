import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';
import type Token from 'markdown-it/lib/token';

import {parseMdAttrs} from '@diplodoc/utils';

import {ClassNames, ENV_FLAG_NAME, QUOTE_LINK_ATTR, TokenType} from './const';
import {cloneToken, matchBlockquote, matchLinkAtInlineStart} from './helpers';

/**
 * Splits a paragraph that contains both the quote link and trailing content into two paragraphs.
 * Inserts a new paragraph after the link and moves `restTokens` into it; updates source maps and content.
 *
 * @param tokens - Full token list (mutated in place)
 * @param quoteIndex - Index of the blockquote_open token for this quote link
 * @param paragraphOpenToken - The paragraph_open token of the current paragraph
 * @param inlineToken - The inline token that holds the link and the rest content
 * @param restTokens - Inline tokens to move into the new paragraph (content after the link)
 * @internal
 */
function createNewParagraphWithRestTokens(
    tokens: Token[],
    quoteIndex: number,
    paragraphOpenToken: Token,
    inlineToken: Token,
    restTokens: Token[],
): void {
    const paragraphCloseToken = tokens[quoteIndex + 3];
    if (paragraphCloseToken?.type !== 'paragraph_close') {
        return;
    }

    const inlineTokenForTheNewParagraph = cloneToken(inlineToken);
    inlineTokenForTheNewParagraph.children = restTokens;

    const newParagraphOpenToken = cloneToken(paragraphOpenToken);

    if (paragraphOpenToken.map) {
        paragraphOpenToken.map = [paragraphOpenToken.map[0], paragraphOpenToken.map[0] + 1];
        inlineToken.map = paragraphOpenToken.map;
        newParagraphOpenToken.map = [
            (newParagraphOpenToken.map?.[0] ?? 0) + 2,
            (newParagraphOpenToken.map?.[1] ?? 0) + 1,
        ];
        inlineTokenForTheNewParagraph.map = newParagraphOpenToken.map;
    }

    const inlineTokenContentParts = inlineToken.content.match(/(.+)\n([\s\S]+)/);
    inlineToken.content = inlineTokenContentParts?.[1] ?? inlineToken.content;
    inlineTokenForTheNewParagraph.content = inlineTokenContentParts?.[2] ?? '';

    tokens.splice(
        quoteIndex + 4,
        0,
        newParagraphOpenToken,
        inlineTokenForTheNewParagraph,
        paragraphCloseToken,
    );
}

/**
 * MarkdownIt plugin that turns blockquotes into quote link blocks when the first paragraph
 * starts with a link that has the `data-quotelink` attribute (or `{data-quotelink}` in YFM).
 * Sets custom token types and CSS class so the block can be styled and wired to the runtime.
 *
 * @param md - MarkdownIt instance to attach the rule to
 */
export const quoteLinkPlugin: MarkdownIt.PluginSimple = (md) => {
    const plugin: Core.RuleCore = (state) => {
        const {tokens} = state;

        for (let i = 0; i < tokens.length; i++) {
            const quoteMatch = matchBlockquote(tokens, i);
            if (!quoteMatch) {
                continue;
            }

            const paragraphOpenToken = tokens[i + 1];
            if (paragraphOpenToken?.type !== 'paragraph_open' || !tokens[i + 2]) {
                continue;
            }

            const inlineToken = tokens[i + 2];
            const linkMatch = matchLinkAtInlineStart(inlineToken);
            if (!linkMatch) {
                continue;
            }

            // if attr not exist, parse markup after link
            if (linkMatch.openToken.attrIndex(QUOTE_LINK_ATTR) === -1) {
                const nextTextToken = inlineToken.children?.[linkMatch.closeTokenIndex + 1];
                if (!nextTextToken || nextTextToken.type !== 'text') {
                    continue;
                }

                const res = parseMdAttrs(
                    md,
                    nextTextToken.content,
                    0,
                    nextTextToken.content.length,
                );

                if (!res) {
                    continue;
                }

                nextTextToken.content = nextTextToken.content.slice(res.pos);

                if (res.attrs[QUOTE_LINK_ATTR]?.length) {
                    linkMatch.openToken.attrSet(QUOTE_LINK_ATTR, res.attrs[QUOTE_LINK_ATTR][0]);
                }
            }

            if (linkMatch.openToken.attrIndex(QUOTE_LINK_ATTR) !== -1) {
                quoteMatch.openToken.type = TokenType.QuoteLinkOpen;
                quoteMatch.openToken.attrSet('class', ClassNames.QuoteLink);

                quoteMatch.closeToken.type = TokenType.QuoteLinkClose;

                // Move all the inline tokens after the link to a new paragraph
                let restTokens = inlineToken.children?.splice(linkMatch.closeTokenIndex + 2);
                if (restTokens?.[0]?.type === 'softbreak') {
                    restTokens = restTokens.slice(1);
                }

                if (restTokens?.length) {
                    createNewParagraphWithRestTokens(
                        tokens,
                        i,
                        paragraphOpenToken,
                        inlineToken,
                        restTokens,
                    );
                }

                state.env ??= {};
                state.env[ENV_FLAG_NAME] = true;
            }
        }
    };

    md.core.ruler.push('quoteLink', plugin);
};
