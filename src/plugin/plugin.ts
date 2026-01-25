import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';
import type Token from 'markdown-it/lib/token';

import {parseMdAttrs} from '@diplodoc/utils';

import {ClassNames, ENV_FLAG_NAME, QUOTE_LINK_ATTR, TokenType} from './const';
import {cloneToken, matchBlockquote, matchLinkAtInlineStart} from './helpers';

/**
 * Creates a new paragraph with remaining tokens after the quote link.
 * This is used when the quote link has content after it in the same paragraph.
 *
 * @param tokens - Array of all tokens in the state
 * @param quoteIndex - Index of the quote open token
 * @param paragraphOpenToken - The paragraph open token
 * @param inlineToken - The inline token containing the link
 * @param restTokens - Tokens to move to the new paragraph
 * @returns void
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
 * Quote link plugin for MarkdownIt.
 * Transforms blockquotes with data-quotelink attribute into special quote link blocks.
 *
 * @param md - MarkdownIt instance
 * @returns void
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
