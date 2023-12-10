import { expect, test } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Component from './component'
import { Lexer, createToken } from 'chevrotain';

test('App Router: Works with Client Components (React State)', () => {

const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/ });
// We specify the "longer_alt" property to resolve keywords vs identifiers ambiguity.
// See: https://github.com/chevrotain/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
const Select = createToken({
  name: "Select",
  pattern: /SELECT/,
  longer_alt: Identifier,
});
const From = createToken({
  name: "From",
  pattern: /FROM/,
  longer_alt: Identifier,
});
const Where = createToken({
  name: "Where",
  pattern: /WHERE/,
  longer_alt: Identifier,
});

const Comma = createToken({ name: "Comma", pattern: /,/ });

const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d*/ });

const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });

const LessThan = createToken({ name: "LessThan", pattern: /</ });

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});


  render(<Component />)
  expect(screen.getByRole('heading', { level: 2, name: '0' })).toBeDefined()
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('heading', { level: 2, name: '1' })).toBeDefined()
})
