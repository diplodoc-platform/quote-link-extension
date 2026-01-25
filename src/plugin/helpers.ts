import type MdIt from 'markdown-it';

export type TokenMatch = {
    openToken: MdIt.Token;
    closeToken: MdIt.Token;
    closeTokenIndex: number;
};

const matchCloseToken = (tokens: MdIt.Token[], i: number) => {
    return tokens[i]?.type === 'blockquote_close';
};

const matchOpenToken = (tokens: MdIt.Token[], i: number) => {
    return tokens[i]?.type === 'blockquote_open';
};

/**
 * Matches a blockquote token pair starting at the given index.
 * Handles nested blockquotes correctly.
 *
 * @param tokens - Array of markdown-it tokens
 * @param idx - Starting index to check for blockquote
 * @returns TokenMatch with open/close tokens and close index, or null if not found
 */
export function matchBlockquote(tokens: MdIt.Token[], idx: number): TokenMatch | null {
    if (!matchOpenToken(tokens, idx)) {
        return null;
    }

    let level = 0;
    let i = idx + 1;
    while (i < tokens.length) {
        if (matchOpenToken(tokens, i)) {
            level++;
        } else if (matchCloseToken(tokens, i)) {
            if (level === 0) {
                return {
                    openToken: tokens[idx],
                    closeToken: tokens[i],
                    closeTokenIndex: i,
                };
            }
            level--;
        }

        i++;
    }

    return null;
}

/**
 * Checks if an inline token starts with a link and returns the link token match.
 *
 * @param inlineToken - The inline token to check
 * @returns TokenMatch with link open/close tokens and close index, or null if not found
 */
export function matchLinkAtInlineStart(inlineToken: MdIt.Token): TokenMatch | null {
    if (inlineToken.type !== 'inline' || !inlineToken.children?.length) {
        return null;
    }

    const {children: tokens} = inlineToken;
    if (tokens[0].type !== 'link_open') {
        return null;
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'link_close') {
            return {
                openToken: tokens[0],
                closeToken: token,
                closeTokenIndex: i,
            };
        }
    }

    return null;
}

/**
 * Creates a shallow copy of a markdown-it token.
 *
 * @param token - The token to clone
 * @returns A new token object with the same properties
 */
export const cloneToken = (token: MdIt.Token) =>
    Object.assign(Object.create(Object.getPrototypeOf(token)), token);
