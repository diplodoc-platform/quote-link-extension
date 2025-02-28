import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {parseMdAttrs} from '@diplodoc/utils';

import {ClassNames, ENV_FLAG_NAME, QUOTE_LINK_ATTR, TokenType} from './const';
import {matchBlockquote, matchLinkAtInlineStart} from './helpers';

export const quoteLinkPlugin: MarkdownIt.PluginSimple = (md) => {
    const plugin: Core.RuleCore = (state) => {
        const {tokens} = state;

        for (let i = 0; i < tokens.length; i++) {
            const quoteMatch = matchBlockquote(tokens, i);
            if (!quoteMatch) {
                continue;
            }

            if (tokens[i + 1]?.type !== 'paragraph_open' || !tokens[i + 2]) {
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

                state.env ??= {};
                state.env[ENV_FLAG_NAME] = true;
            }
        }
    };

    md.core.ruler.push('quoteLink', plugin);
};
