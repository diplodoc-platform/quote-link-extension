import type MdIt from 'markdown-it';

const matchCloseToken = (tokens: MdIt.Token[], i: number) => {
    return tokens[i].type === 'blockquote_close';
};

export const matchOpenToken = (tokens: MdIt.Token[], i: number) => {
    return tokens[i].type === 'blockquote_open';
};

export function findCloseTokenIdx(tokens: MdIt.Token[], idx: number) {
    let level = 0;
    let i = idx;
    while (i < tokens.length) {
        if (matchOpenToken(tokens, i)) {
            level++;
        } else if (matchCloseToken(tokens, i)) {
            if (level === 0) {
                return i;
            }
            level--;
        }

        i++;
    }

    return null;
}
