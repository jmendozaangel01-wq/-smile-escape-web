import React, { useEffect, useRef, useState } from 'react';

const TEAL = '#2EC4B6';
const BORDER = '#e5e7eb';

// Maia's opening message (STEP 1 of maia_agent.yaml, Spanish default), shown
// automatically on load. Display-only — it is not sent to the API (the Messages
// API history must start with a user turn).
const WELCOME = `¡Hola! Soy Maia 🦷✨ Bienvenido a Smile & Escape.

Soy una asistente con inteligencia artificial — lo que significa que puedo entenderte, acompañarte y guiarte durante todo el proceso de forma inteligente y personalizada, disponible para ti en cualquier momento.

Somos una plataforma de turismo médico-dental en Costa Rica. Conectamos a personas como tú con Prisma Dental, una clínica especializada en tratamientos de alta calidad — y además nos encargamos de que tu estadía sea una experiencia completa: alojamiento, transporte y todo lo que necesitas para que te sientas tranquilo y bien atendido desde que llegas.

Cuéntame — ¿qué te trajo por aquí hoy? 😊`;

const ERROR_MESSAGE =
  'Ups, algo salió mal. Por favor intentá de nuevo en un momento. · Oops, something went wrong. Please try again in a moment.';

export default function MaiaChat({ isMobile = false }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Auto-scroll to the latest message (and while Maia is typing).
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Drop the leading welcome (assistant) message so the API history starts
      // with a user turn, as the Messages API requires.
      const apiMessages = nextMessages.filter(
        (m, i) => !(i === 0 && m.role === 'assistant')
      );
      const res = await fetch('/api/maia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) throw new Error('bad_status');
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', content: data.text }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: ERROR_MESSAGE }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const height = isMobile ? 400 : 600;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height,
        borderRadius: 24,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        border: `1px solid rgba(0,168,150,0.15)`,
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(26,26,46,0.12)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 22px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: TEAL,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          🦷
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>Maia</div>
          <div style={{ fontSize: 12, color: '#1f9d5c', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1f9d5c', display: 'inline-block' }} />
            Online
          </div>
        </div>
      </div>

      {/* Messages (internal scroll) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              padding: '12px 16px',
              fontSize: 14.5,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              ...(m.role === 'user'
                ? {
                    background: TEAL,
                    color: '#fff',
                    borderRadius: '16px 16px 4px 16px',
                  }
                : {
                    background: '#fff',
                    color: 'rgba(26,26,46,0.85)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: '16px 16px 16px 4px',
                  }),
            }}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '82%',
              padding: '12px 16px',
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: '16px 16px 16px 4px',
              fontSize: 13.5,
              color: 'rgba(26,26,46,0.55)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Maia está escribiendo</span>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              <span className="maia-dot" />
              <span className="maia-dot" style={{ animationDelay: '0.2s' }} />
              <span className="maia-dot" style={{ animationDelay: '0.4s' }} />
            </span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '16px 22px',
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu mensaje..."
          aria-label="Escribe tu mensaje para Maia"
          style={{
            flex: 1,
            padding: '13px 18px',
            borderRadius: 100,
            border: `1px solid ${BORDER}`,
            background: 'rgba(26,26,46,0.03)',
            fontSize: 14,
            color: '#1A1A2E',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label="Enviar mensaje"
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: TEAL,
            border: 'none',
            color: '#fff',
            fontSize: 18,
            flexShrink: 0,
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.55 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
