/**
 * Manual mock for next-intl used in Vitest tests.
 * Reads translations from en.json and supports parameter interpolation and rich text.
 */
import React from 'react'
import en from '@/messages/en.json'

type Params = Record<string, unknown>

const messages = en as Record<string, unknown>

// Resolves a (possibly dotted) key under an optional namespace by walking the
// nested message object. Supports both `useTranslations('wizard')` + `t('step1')`
// and namespace-less `useTranslations()` + `t('explain.capitalGain')`.
function getStr(namespace: string | undefined, key: string): string {
  const path = namespace ? `${namespace}.${key}` : key
  const value = path.split('.').reduce<unknown>(
    (node, segment) =>
      node && typeof node === 'object' ? (node as Record<string, unknown>)[segment] : undefined,
    messages,
  )
  return typeof value === 'string' ? value : key
}

function interpolatePlain(template: string, params: Params): string {
  return Object.entries(params).reduce((str, [k, v]) => {
    if (typeof v !== 'function') {
      return str.split(`{${k}}`).join(String(v))
    }
    return str
  }, template)
}

function stripHtmlLikeTags(input: string): string {
  let previous: string
  let current = input
  do {
    previous = current
    current = current.replace(/<[^>]+>/g, '')
  } while (current !== previous)
  return current
}

function renderRich(template: string, params: Params): React.ReactNode {
  // First substitute non-function params
  const str = interpolatePlain(template, params)

  // Parse and apply tag-component functions: <tagName>content</tagName>
  const tagPattern = /<(\w+)>([\s\S]*?)<\/\1>/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  tagPattern.lastIndex = 0
  while ((match = tagPattern.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.slice(lastIndex, match.index))
    }
    const tagName = match[1]
    const content = match[2]
    const fn = params[tagName]
    parts.push(typeof fn === 'function' ? (fn as (c: string[]) => React.ReactNode)([content]) : content)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < str.length) {
    parts.push(str.slice(lastIndex))
  }

  if (parts.length === 0) return str
  if (parts.length === 1) return parts[0]
  return React.createElement(React.Fragment, null, ...parts)
}

export function useLocale(): string {
  return 'en'
}

export function useTranslations(namespace?: string) {
  const t = (key: string, params?: Params): string => {
    const template = getStr(namespace, key)
    if (!params) return template
    // Strip any HTML-like tags for plain string output
    const interpolated = interpolatePlain(template, params)
    return stripHtmlLikeTags(interpolated)
  }

  t.rich = (key: string, params?: Params): React.ReactNode => {
    const template = getStr(namespace, key)
    if (!params) return template
    return renderRich(template, params)
  }

  return t
}

export { useTranslations as default }
