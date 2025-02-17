import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';
import {findCloseTokenIdx, matchOpenToken} from './helpers';

export const quoteLinkPlugin: MarkdownIt.PluginSimple = (md) => {
    const plugin: Core.RuleCore = (state) => {
        const tokens = state.tokens;
        let i = 0;

        while (i < tokens.length) {
            const match = matchOpenToken(tokens, i);

            if (match) {
                const closeTokenIdx = findCloseTokenIdx(tokens, i + 1);

                if (!closeTokenIdx) {
                    i += 1;
                    continue;
                }

                if (
                    tokens[i + 1]?.type === 'paragraph_open' &&
                    tokens[i + 2]?.type === 'inline' &&
                    tokens[i + 2].children?.[0]?.type === 'link_open' &&
                    tokens[i + 2].children?.[0]?.attrs?.some(
                        (attr) => attr[0] === 'data-quotelink' && attr[1] === 'true',
                    )
                ) {
                    tokens[i].type = TokenType.QuoteLinkOpen;
                    tokens[i].attrSet('class', ClassNames.QuoteLink);

                    tokens[closeTokenIdx].type = TokenType.QuoteLinkClose;

                    state.env ??= {};
                    state.env[ENV_FLAG_NAME] = true;
                }

                i++;
            } else {
                i++;
            }
        }
    };

    md.core.ruler.push('quoteLink', plugin);
};
