/** Env key set when at least one quote link block is present in the document. */
export const ENV_FLAG_NAME = 'has-yfm-quote-link';

/** MarkdownIt token types for quote link block open/close. */
export const TokenType = {
    QuoteLink: 'yfm_quote-link',
    QuoteLinkOpen: 'yfm_quote-link_open',
    QuoteLinkClose: 'yfm_quote-link_close',
} as const;

/** CSS class applied to quote link blockquote elements. */
export const ClassNames = {
    QuoteLink: 'yfm-quote-link',
} as const;

/** HTML attribute name used to mark a link as the trigger for a quote link block. */
export const QUOTE_LINK_ATTR = 'data-quotelink';
