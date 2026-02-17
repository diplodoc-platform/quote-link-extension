import type MdIt from 'markdown-it';

/**
 * Result of matching a paired token (e.g. blockquote_open + blockquote_close or link_open + link_close).
 */
export type TokenMatch = {
    /** Opening token of the pair. */
    openToken: MdIt.Token;
    /** Closing token of the pair. */
    closeToken: MdIt.Token;
    /** Index of the closing token in the token array. */
    closeTokenIndex: number;
};

/** @internal */
const matchCloseToken = (tokens: MdIt.Token[], i: number) => tokens[i]?.type === 'blockquote_close';

/** @internal */
const matchOpenToken = (tokens: MdIt.Token[], i: number) => tokens[i]?.type === 'blockquote_open';

/**
 * Finds a blockquote token pair starting at the given index.
 * Correctly skips nested blockquotes so the returned close token matches the open at `idx`.
 *
 * @param tokens - Full list of markdown-it block tokens
 * @param idx - Index at which to look for a blockquote_open
 * @returns Match with open token, close token, and close index, or null if no valid pair
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
 * If the inline token’s first child is a link, returns the link_open/link_close pair and close index.
 *
 * @param inlineToken - Inline token (e.g. contents of a paragraph) to inspect
 * @returns Match with link open/close tokens and close index, or null if not starting with a link
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
 * Shallow-copies a markdown-it token (same prototype, same own properties).
 *
 * @param token - Token to clone
 * @returns New token instance with identical properties
 */
export const cloneToken = (token: MdIt.Token) =>
    Object.assign(Object.create(Object.getPrototypeOf(token)), token);
