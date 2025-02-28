import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';
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

            if (linkMatch.openToken.attrIndex('data-quotelink') !== -1) {
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
