import { useState } from 'react'
import { FAQ_ITEMS } from '@/components/landing/landingData'

/** Accordion FAQ — content from approved mockup. */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(-1)

  return (
    <section id="faq" className="landing-faq">
      <div className="landing-faq-inner">
        <h2 className="landing-h2" style={{ marginBottom: 48 }}>
          Common questions.
        </h2>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <button
              key={item.q}
              type="button"
              className="landing-faq-item"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <div className="landing-faq-question">
                <span className="landing-faq-q">{item.q}</span>
                <span className="landing-faq-indicator" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </div>
              {isOpen && <p className="landing-faq-answer">{item.a}</p>}
            </button>
          )
        })}
        <div style={{ borderTop: '1px solid var(--landing-border)' }} />
      </div>
    </section>
  )
}
