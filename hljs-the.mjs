import hljs from 'highlight.js'

const keywords = {
  keyword: ['as', 'break', 'catch', 'const', 'continue', 'elif', 'else', 'enum', 'export', 'fn', 'from', 'if', 'import', 'is', 'loop', 'main', 'mut', 'obj', 'ref', 'return', 'throw', 'try', 'union'],
  type: ['any', 'bool', 'byte', 'char', 'float', 'f32', 'f64', 'int', 'i8', 'i16', 'i32', 'i64', 'str', 'u8', 'u16', 'u32', 'u64', 'void'],
  literal: ['true', 'false', 'nil'],
  built_in: ['exit', 'print', 'sleepSync']
}

hljs.registerLanguage('the', (hljs) => {
  return {
    name: 'The',
    aliases: ['the', 'thelang'],
    keywords,
    illegal: '</',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: 'string',
        variants: [
          hljs.QUOTE_STRING_MODE,
          hljs.APOS_STRING_MODE
        ]
      },
      {
        begin: /:=/
      },
      {
        className: 'function',
        beginKeywords: 'fn',
        end: '\\s*(\\{|$)',
        excludeEnd: true,
        contains: [
          hljs.TITLE_MODE,
          {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            endsParent: true,
            keywords,
            illegal: /["']/
          }
        ]
      }
    ]
  }
})
