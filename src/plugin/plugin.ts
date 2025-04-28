import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {parseMdAttrs} from '@diplodoc/utils';

import {ClassNames, ENV_FLAG_NAME, QUOTE_LINK_ATTR, TokenType} from './const';
import {cloneToken, matchBlockquote, matchLinkAtInlineStart} from './helpers';

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

                // move all the inline tokens, but not the link, to the next paragraph
                let restTokens = inlineToken.children?.splice(linkMatch.closeTokenIndex + 2);
                if (restTokens?.[0]?.type === 'softbreak') {
                    restTokens = restTokens.slice(1);
                }

                if (restTokens?.length) {
                    const paragraphCloseToken = tokens[i + 3];

                    if (paragraphCloseToken.type === 'paragraph_close') {
                        const inlineTokenForTheNewParagraph = cloneToken(inlineToken);
                        inlineTokenForTheNewParagraph.children = restTokens;

                        const newParagraphOpenToken = cloneToken(paragraphOpenToken);

                        if (paragraphOpenToken.map) {
                            paragraphOpenToken.map = [
                                paragraphOpenToken.map[0],
                                paragraphOpenToken.map[0] + 1,
                            ];
                            inlineToken.map = paragraphOpenToken.map;
                            newParagraphOpenToken.map = [
                                newParagraphOpenToken.map[0] + 2,
                                newParagraphOpenToken.map[1] + 1,
                            ];
                            inlineTokenForTheNewParagraph.map = newParagraphOpenToken.map;
                        }

                        const inlineTokenContentParts =
                            inlineToken.content.match(/(.+)\n([\s\S]+)/);
                        inlineToken.content = inlineTokenContentParts?.[1] ?? inlineToken.content;
                        inlineTokenForTheNewParagraph.content = inlineTokenContentParts?.[2] ?? '';

                        tokens.splice(
                            i + 4,
                            0,
                            newParagraphOpenToken,
                            inlineTokenForTheNewParagraph,
                            paragraphCloseToken,
                        );
                    }
                }

                state.env ??= {};
                state.env[ENV_FLAG_NAME] = true;
            }
        }
    };

    md.core.ruler.push('quoteLink', plugin);
};
