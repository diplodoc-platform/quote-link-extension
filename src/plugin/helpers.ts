import type MdIt from 'markdown-it';

const matchCloseToken = (tokens: MdIt.Token[], i: number) => {
    return tokens[i].type === 'blockquote_close';
};

const matchOpenToken = (tokens: MdIt.Token[], i: number) => {
    return tokens[i].type === 'blockquote_open';
};

export function matchBlockquote(
    tokens: MdIt.Token[],
    idx: number,
): {openToken: MdIt.Token; closeToken: MdIt.Token; closeTokenIndex: number} | null {
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

export function matchLinkAtInlineStart(
    inlineToken: MdIt.Token,
): {openToken: MdIt.Token; closeToken: MdIt.Token; closeTokenIndex: number} | null {
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

export const cloneToken = (token: MdIt.Token) =>
    Object.assign(Object.create(Object.getPrototypeOf(token)), token);
