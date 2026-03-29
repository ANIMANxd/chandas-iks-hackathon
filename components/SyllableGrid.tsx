'use client'

import { Syllable, Gana, Violation } from '@/lib/types'

interface SyllableGridProps {
  id: string
  syllables: Syllable[]
  ganas: Gana[]
  violations: Violation[]
  activePos?: number
}

function SylEl({
  syl,
  isViolation,
  delayMs,
  activePos,
}: {
  syl: Syllable
  isViolation: boolean
  delayMs: number
  activePos?: number
}) {
  const isActive = activePos !== undefined && syl.position === activePos

  return (
    <div
      className={`syl ${syl.weight || 'L'}${isViolation ? ' V' : ''}`}
      style={{ animationDelay: `${Math.min(delayMs, 600)}ms` }}
    >
      <div
        className="syl-text"
        style={isActive ? { color: '#FAF0D8' } : undefined}
      >
        {syl.text || ''}
      </div>
      <div
        className="syl-bar"
        data-pos={syl.position}
        style={
          activePos !== undefined
            ? {
                opacity: isActive ? 1 : 0.4,
                filter: isActive ? 'brightness(1.5)' : 'brightness(1)',
              }
            : undefined
        }
      />
      <div className="tooltip">{syl.reason || syl.weight || ''}</div>
    </div>
  )
}

export default function SyllableGrid({
  id,
  syllables,
  ganas,
  violations,
  activePos,
}: SyllableGridProps) {
  const violPos = new Set((violations || []).map((v) => v.position ?? -1))

  if (ganas && ganas.length > 0) {
    const groups: React.ReactNode[] = []
    let pos = 0

    ganas.forEach((g, gi) => {
      const groupSyls = syllables.slice(pos, pos + 3)
      pos += 3
      groups.push(
        <div key={`gana-${gi}`} className="gana-group">
          <div className="gana-name">{g.name || ''}</div>
          <div className="gana-syls">
            {groupSyls.map((syl, si) => (
              <SylEl
                key={`${gi}-${si}`}
                syl={syl}
                isViolation={violPos.has(syl.position)}
                delayMs={(gi * 3 + si) * 40}
                activePos={activePos}
              />
            ))}
          </div>
        </div>
      )
    })

    const remaining = syllables.slice(pos)
    remaining.forEach((syl, si) => {
      groups.push(
        <SylEl
          key={`rem-${si}`}
          syl={syl}
          isViolation={violPos.has(syl.position)}
          delayMs={(pos + si) * 40}
          activePos={activePos}
        />
      )
    })

    return (
      <div id={id} className="syllable-row">
        {groups}
      </div>
    )
  }

  return (
    <div id={id} className="syllable-row">
      {syllables.map((syl, i) => (
        <SylEl
          key={i}
          syl={syl}
          isViolation={violPos.has(syl.position)}
          delayMs={i * 40}
          activePos={activePos}
        />
      ))}
    </div>
  )
}
