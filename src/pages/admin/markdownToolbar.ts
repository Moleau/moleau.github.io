// Helpers that wrap selected text in a textarea with markdown syntax,
// or insert a snippet at the cursor. Returns the new value + selection.

export interface TextOp {
  value: string;
  selStart: number;
  selEnd: number;
}

export function wrapSelection(
  text: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string = prefix
): TextOp {
  const selected = text.slice(start, end);
  const next = text.slice(0, start) + prefix + selected + suffix + text.slice(end);
  const selStart = start + prefix.length;
  const selEnd = end + prefix.length;
  return { value: next, selStart, selEnd };
}

export function insertAtCursor(
  text: string,
  start: number,
  end: number,
  snippet: string,
  selectInside = false
): TextOp {
  const next = text.slice(0, start) + snippet + text.slice(end);
  if (selectInside) {
    return {
      value: next,
      selStart: start + snippet.indexOf('│') >= 0 ? start + snippet.indexOf('│') : start,
      selEnd: start + snippet.length,
    };
  }
  return { value: next, selStart: start + snippet.length, selEnd: start + snippet.length };
}

export interface ToolButton {
  label: string;
  title: string;
  apply: (text: string, s: number, e: number) => TextOp;
}

export const tools: ToolButton[] = [
  { label: 'B', title: '加粗', apply: (t, s, e) => wrapSelection(t, s, e, '**') },
  { label: 'I', title: '斜体', apply: (t, s, e) => wrapSelection(t, s, e, '*') },
  { label: 'S', title: '删除线', apply: (t, s, e) => wrapSelection(t, s, e, '~~') },
  { label: 'H1', title: '一级标题', apply: (t, s) => insertAtCursor(t, s, s, '\n# ', false) },
  { label: 'H2', title: '二级标题', apply: (t, s) => insertAtCursor(t, s, s, '\n## ', false) },
  { label: 'H3', title: '三级标题', apply: (t, s) => insertAtCursor(t, s, s, '\n### ', false) },
  { label: '"', title: '引用', apply: (t, s) => insertAtCursor(t, s, s, '\n> ', false) },
  { label: '•', title: '无序列表', apply: (t, s) => insertAtCursor(t, s, s, '\n- ', false) },
  { label: '1.', title: '有序列表', apply: (t, s) => insertAtCursor(t, s, s, '\n1. ', false) },
  { label: '☑', title: '任务列表', apply: (t, s) => insertAtCursor(t, s, s, '\n- [ ] ', false) },
  {
    label: '</>',
    title: '行内代码',
    apply: (t, s, e) => wrapSelection(t, s, e, '`'),
  },
  {
    label: '{}',
    title: '行内公式',
    apply: (t, s, e) => wrapSelection(t, s, e, '$'),
  },
  {
    label: '∑',
    title: '块级公式',
    apply: (t, s, e) =>
      wrapSelection(t, s, e, '\n$$\n', '\n$$\n'),
  },
  {
    label: '🖼',
    title: '插入图片',
    apply: (t, s) => insertAtCursor(t, s, s, '\n![]()\n', false),
  },
  {
    label: '🔗',
    title: '插入链接',
    apply: (t, s, e) => {
      const sel = t.slice(s, e) || '链接文字';
      const snippet = `[${sel}](https://)`;
      const next = t.slice(0, s) + snippet + t.slice(e);
      return { value: next, selStart: s + sel.length + 3, selEnd: s + sel.length + 11 };
    },
  },
  {
    label: '⌗',
    title: '分割线',
    apply: (t, s) => insertAtCursor(t, s, s, '\n\n---\n\n', false),
  },
  {
    label: '▦',
    title: '表格',
    apply: (t, s) =>
      insertAtCursor(
        t,
        s,
        s,
        '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| a | b | c |\n',
        false
      ),
  },
  {
    label: '```',
    title: '代码块',
    apply: (t, s, e) => wrapSelection(t, s, e, '\n```ts\n', '\n```\n'),
  },
];
