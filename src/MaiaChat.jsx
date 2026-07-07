import React, { useEffect, useRef, useState } from 'react';

const TEAL = '#2EC4B6';
const BORDER = '#e5e7eb';

// n8n webhooks that bridge to the Maia Managed Agent. These are public
// endpoints (no secret) — the Anthropic key lives inside n8n, never here.
const START_URL = 'https://n8n.srv1587395.hstgr.cloud/webhook/smile-maia-start';
const CHAT_URL = 'https://n8n.srv1587395.hstgr.cloud/webhook/smile-maia-chat';
const AGENT_ID = 'agent_01Gaqnw9j3mq5qYqcNY73GG9';

const INIT_ERROR = 'No pudimos conectar con Maia. Por favor recarga la página.';
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

export default function MaiaChat({ isMobile = false }) {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [initFailed, setInitFailed] = useState(false);
  const [loading, setLoading] = useState(false); // Maia typing (post-init)
  const lastAgentMsgId = useRef(null);
  const startedRef = useRef(false); // guard against a double init
  const scrollRef = useRef(null);

  // Auto-scroll the INNER container only (never the page). scrollIntoView would
  // walk up and scroll the document too — here we pin scrollTop on the chat's
  // own scroll area.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, initializing]);

  // On mount: open a session, then ask Maia for her welcome via the Chat webhook.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const start = await postJSON(START_URL, { agent_id: AGENT_ID });
        if (!start?.session_id) throw new Error('no_session_id');
        setSessionId(start.session_id);

        // Maia sends the welcome automatically by replying to "hola".
        const welcome = await postJSON(CHAT_URL, {
          session_id: start.session_id,
          message: 'hola',
        });
        lastAgentMsgId.current = welcome?.lastAgentMsgId ?? null;
        setMessages([{ role: 'assistant', content: welcome?.reply ?? CHAT_ERROR }]);
      } catch {
        // If we never got a session, the chat can't work at all → hard error.
        // If the session opened but the welcome failed, still let the user try.
        setSessionId((sid) => {
          if (!sid) setInitFailed(true);
          else setMessages([{ role: 'assistant', content: CHAT_ERROR }]);
          return sid;
        });
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

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
        // Saved from the previous reply so n8n can thread the conversation.
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
  const inputDisabled = initializing || initFailed || !sessionId;

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
        {initFailed ? (
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '82%',
              padding: '12px 16px',
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: '16px 16px 16px 4px',
              fontSize: 14.5,
              lineHeight: 1.55,
              color: 'rgba(26,26,46,0.85)',
            }}
          >
            {INIT_ERROR}
          </div>
        ) : initializing ? (
          <div
            style={{
              margin: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13.5,
              color: 'rgba(26,26,46,0.5)',
            }}
          >
            <span>Conectando con Maia</span>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              <span className="maia-dot" />
              <span className="maia-dot" style={{ animationDelay: '0.2s' }} />
              <span className="maia-dot" style={{ animationDelay: '0.4s' }} />
            </span>
          </div>
        ) : (
          messages.map((m, i) => (
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
          ))
        )}

        {loading && !initializing && (
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
          disabled={inputDisabled}
          placeholder={inputDisabled ? 'Conectando con Maia...' : 'Escribe tu mensaje...'}
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
          disabled={loading || inputDisabled || !input.trim()}
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
            cursor: loading || inputDisabled || !input.trim() ? 'default' : 'pointer',
            opacity: loading || inputDisabled || !input.trim() ? 0.55 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
