import React, { useEffect, useMemo, useRef, useState } from 'react';

const TEAL = '#2EC4B6';
const BORDER = '#e5e7eb';

// n8n webhooks that bridge to the Maia Managed Agent. These are public
// endpoints (no secret) — the Anthropic key lives inside n8n, never here.
const START_URL = 'https://n8n.srv1587395.hstgr.cloud/webhook/smile-maia-start';
const CHAT_URL = 'https://n8n.srv1587395.hstgr.cloud/webhook/smile-maia-chat';
const AGENT_ID = 'agent_01Gaqnw9j3mq5qYqcNY73GG9';

// Persist the session + transcript per browser tab so a reload REUSES the same
// managed-agent session instead of spawning a new one. Expires after 30 min so
// a stale session doesn't get reused forever.
const STORE_KEY = 'smileMaiaChat';
const SESSION_TTL_MS = 30 * 60 * 1000;

// Maia's opening message (STEP 1 of maia_agent.yaml, Spanish default). Shown as
// static text — NOT an agent call — so merely loading the page costs nothing.
// The managed-agent session is only created on the user's first real message.
const WELCOME = `¡Hola! Soy Maia 🦷✨ Bienvenido a Smile & Escape.

Soy una asistente con inteligencia artificial — lo que significa que puedo entenderte, acompañarte y guiarte durante todo el proceso de forma inteligente y personalizada, disponible para ti en cualquier momento.

Somos una plataforma de turismo médico-dental en Costa Rica. Conectamos a personas como tú con Prisma Dental, una clínica especializada en tratamientos de alta calidad — y además nos encargamos de que tu estadía sea una experiencia completa: alojamiento, transporte y todo lo que necesitas para que te sientas tranquilo y bien atendido desde que llegas.

Cuéntame — ¿qué te trajo por aquí hoy? 😊`;

const CHAT_ERROR = 'Maia tuvo un problema. Por favor intenta de nuevo.';

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`bad_status_${res.status}`);
  return res.json();
}

function readStore() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.ts || Date.now() - data.ts > SESSION_TTL_MS) return null; // stale
    return data;
  } catch {
    return null;
  }
}

export default function MaiaChat({ isMobile = false }) {
  const restored = useMemo(readStore, []);

  const [messages, setMessages] = useState(
    restored?.messages ?? [{ role: 'assistant', content: WELCOME }]
  );
  const [sessionId, setSessionId] = useState(restored?.sessionId ?? null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const lastAgentMsgId = useRef(restored?.lastAgentMsgId ?? null);
  const scrollRef = useRef(null);

  // Auto-scroll the INNER container only (never the page).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Persist session + transcript so a reload reuses the same session.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ sessionId, messages, lastAgentMsgId: lastAgentMsgId.current, ts: Date.now() })
      );
    } catch {
      // storage unavailable (private mode / quota) — degrade silently
    }
  }, [messages, sessionId]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      // Lazily open a session on the first real message (reused afterwards).
      let sid = sessionId;
      if (!sid) {
        const start = await postJSON(START_URL, { agent_id: AGENT_ID });
        if (!start?.session_id) throw new Error('no_session_id');
        sid = start.session_id;
        setSessionId(sid);
      }

      const data = await postJSON(CHAT_URL, {
        session_id: sid,
        message: text,
        lastAgentMsgId: lastAgentMsgId.current ?? undefined,
      });
      lastAgentMsgId.current = data?.lastAgentMsgId ?? lastAgentMsgId.current;
      setMessages((m) => [...m, { role: 'assistant', content: data?.reply ?? CHAT_ERROR }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: CHAT_ERROR }]);
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

      {/* Messages (internal scroll). data-lenis-prevent stops the page's Lenis
          smooth-scroll from hijacking the wheel/touch inside this container. */}
      <div
        ref={scrollRef}
        data-lenis-prevent=""
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
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
