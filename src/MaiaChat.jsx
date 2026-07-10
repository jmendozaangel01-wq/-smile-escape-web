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

const CHAT_ERROR = 'Maia tuvo un problema. Por favor intenta de nuevo.';
const START_ERROR = 'No pudimos iniciar el chat. Intentá de nuevo.';

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

// Matches a Markdown image OR link in one pass. The optional leading "!"
// (group 1) tells them apart: present -> image ![alt](url), absent -> link
// [text](url). Scanning left-to-right with the "!" captured means an image is
// never mistaken for the link hiding inside it. Global so a single Maia message
// can carry several tokens interleaved with text.
const MD_TOKEN = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;

// Only https:// URLs are ever rendered as live elements. Anything else (http,
// data:, javascript:, relative) is left as its original Markdown text — safe by
// default, never injected into the DOM as a real src/href.
const isHttps = (url) => url.trim().toLowerCase().startsWith('https://');

// Turn a Maia message into React nodes: Markdown images become <img>, Markdown
// links become <a>, and the text around them stays intact. Plain messages (no
// image or link) fall through as-is, so nothing changes for text-only replies.
function renderMaiaContent(content) {
  if (!content || !content.includes('[')) return content;

  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  MD_TOKEN.lastIndex = 0;
  while ((match = MD_TOKEN.exec(content)) !== null) {
    const [full, bang, text, rawUrl] = match;
    const url = rawUrl.trim();

    // Text before this token.
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    if (bang === '!') {
      // Image.
      nodes.push(
        isHttps(url) ? (
          <img
            key={`img-${key++}`}
            src={url}
            alt={text}
            style={{ display: 'block', maxWidth: '100%', borderRadius: 8, margin: '8px 0' }}
          />
        ) : (
          full
        )
      );
    } else {
      // Link.
      nodes.push(
        isHttps(url) ? (
          <a
            key={`link-${key++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2EC4B6', fontWeight: 500, textDecoration: 'underline' }}
          >
            {text}
          </a>
        ) : (
          full
        )
      );
    }

    lastIndex = match.index + full.length;
  }

  // Trailing text after the last token.
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      <span className="maia-dot" />
      <span className="maia-dot" style={{ animationDelay: '0.2s' }} />
      <span className="maia-dot" style={{ animationDelay: '0.4s' }} />
    </span>
  );
}

export default function MaiaChat({ isMobile = false }) {
  const restored = useMemo(readStore, []);

  const [messages, setMessages] = useState(restored?.messages ?? []);
  const [sessionId, setSessionId] = useState(restored?.sessionId ?? null);
  const [input, setInput] = useState('');
  const [starting, setStarting] = useState(false); // opening the session
  const [startError, setStartError] = useState(false);
  const [loading, setLoading] = useState(false); // Maia typing
  const lastAgentMsgId = useRef(restored?.lastAgentMsgId ?? null);
  const scrollRef = useRef(null);

  // The chat is "live" once a session exists (fresh click or restored reload).
  const hasStarted = sessionId !== null;

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

  // User clicked "Iniciar chat": open the session and let Maia send her real
  // welcome. Nothing hits the managed agent until this deliberate click.
  const startChat = async () => {
    if (starting) return;
    setStarting(true);
    setStartError(false);
    try {
      const start = await postJSON(START_URL, { agent_id: AGENT_ID });
      const sid = start?.session_id;
      if (!sid) throw new Error('no_session_id');

      // "hola" elicits Maia's own STEP 1 welcome (not shown as a user bubble).
      const welcome = await postJSON(CHAT_URL, { session_id: sid, message: 'hola' });
      lastAgentMsgId.current = welcome?.lastAgentMsgId ?? null;
      setSessionId(sid);
      setMessages([{ role: 'assistant', content: welcome?.reply ?? CHAT_ERROR }]);
    } catch {
      setStartError(true);
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const data = await postJSON(CHAT_URL, {
        session_id: sessionId,
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
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

      {/* Body. data-lenis-prevent stops the page's Lenis smooth-scroll from
          hijacking the wheel/touch inside this container. */}
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
        {!hasStarted ? (
          // Pre-start: a deliberate "Iniciar chat" gate — no session yet.
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
              padding: '0 12px',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: TEAL,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              🦷
            </div>
            <div style={{ fontSize: 15, color: 'rgba(26,26,46,0.6)', maxWidth: '32ch', lineHeight: 1.55 }}>
              Chatea con Maia, tu asistente de sonrisa con IA. Te ayuda a planear tu tratamiento — cuando quieras.
            </div>
            {starting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(26,26,46,0.5)' }}>
                <span>Conectando con Maia</span>
                <Dots />
              </div>
            ) : (
              <>
                {startError && <div style={{ fontSize: 13, color: '#c0392b' }}>{START_ERROR}</div>}
                <button
                  onClick={startChat}
                  style={{
                    background: TEAL,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 100,
                    padding: '14px 30px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Iniciar chat con Maia
                </button>
              </>
            )}
          </div>
        ) : (
          <>
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
                {m.role === 'assistant' ? renderMaiaContent(m.content) : m.content}
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
                <Dots />
              </div>
            )}
          </>
        )}
      </div>

      {/* Input — only once the chat has started. */}
      {hasStarted && (
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
      )}
    </div>
  );
}
