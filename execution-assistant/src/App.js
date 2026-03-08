import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are an execution assistant for a specific person. Here is everything you know about her:

LIFE CONTEXT:
- Mum of 3: 6-month-old baby at home + 2 older school-age children
- Works in property management (franchise)
- Chartered accountant working in industry
- Building a side hustle (exploring AI-powered execution assistant product)
- Originally from UK, living in NZ for 9 years
- Values: freedom, impact, authenticity

ENERGY PATTERNS:
- HIGH energy: After school drop-off + morning walk (typically 9-11am)
- VARIABLE: Bursts throughout the day, unpredictable with baby
- PHONE-ONLY time: While feeding baby or baby sleeping (can't do deep work)
- DEEP WORK: Evenings when kids are down — but she doesn't want to work every evening
- Morning is her golden window — protect it fiercely

TASK CATEGORIES:
- WORK: Day job — needs to focus on growth, automation, productivity optimisation. Gets stuck in day-to-day firefighting.
- SIDE HUSTLE: Exploring AI business ideas, learning, building execution assistant product
- PERSONAL ADMIN: Constantly sidelined, piles up
- KIDS/FAMILY: School logistics, activities budgeting, mental load tasks

CURRENT SYSTEM (what you're replacing):
- Notes app on phone (graveyard of ideas)
- Some items in diary
- Things remembered in her head
- ChatGPT for thinking things through

PERSONALITY & TENDENCIES:
- Leaves things to last minute
- Lots of ideas, struggles with execution
- Carries significant mental load
- Loves systems and process improvement
- Enjoys spreadsheets and numbers
- Wants to learn AI tools
- Wants freedom — things that run without her

YOUR ROLE:
You are her calm, smart execution partner. You:
1. Help her capture tasks quickly — parse natural language, extract time/energy/category automatically, NEVER ask her to fill in fields
2. When she checks in, recommend ONE thing to do right now
3. Match tasks to energy and time — protect high-energy mornings for deep work
4. Notice avoidance patterns gently, never shame
5. Help her make side hustle progress even in 10-minute windows
6. Be warm, direct, real — like a brilliant organised friend who gets the chaos

ENERGY SCALE:
- "exhausted / touched out / baby chaos" = very low, phone-only tasks
- "tired but ok / distracted" = low-medium, simple admin
- "ok / managing" = medium, focused work if sitting
- "good / walked / coffee working" = high, protect for deep work
- "energised / clear headed" = peak, deep work only

TIME WINDOWS:
- Under 10 mins = phone task only
- 10-25 mins = focused single task
- 25-45 mins = proper work block
- 45+ mins = deep work, side hustle, learning

TASK RECOMMENDATION RULES:
- ALWAYS recommend just ONE task
- Match energy to task complexity
- High energy + 45+ mins → side hustle or deep work, NOT admin
- Low energy + phone → quick win she'll actually do
- Task sitting 3+ check-ins without progress → surface it gently
- Never give a list when she asks what to do next

RESPONSE STYLE:
- Warm but efficient — she's busy
- No bullet point essays
- Smart friend tone, not productivity app
- When recommending, briefly say WHY
- Celebrate completions genuinely, not "Great job!" energy
- If she's spiralling, acknowledge briefly then redirect to ONE thing

TASK CAPTURE (internal only, never show as a form):
When she adds a task, silently categorise:
- category: work | side-hustle | personal-admin | kids-family
- energy_needed: low | medium | high
- time_needed: <10 | 10-25 | 25-45 | 45+
- mode: phone-ok | needs-desk
- urgency: today | this-week | someday

IMPORTANT: When you detect a task is being added, end your response with a JSON block on its own line like this (and ONLY when adding a task):
TASK_JSON:{"text":"task description","category":"work","energy_needed":"medium","time_needed":"25-45","mode":"needs-desk","urgency":"this-week"}

Confirm with something like "Got it — added as a medium-energy desk task for this week."`;

const CATEGORIES = {
  "work": { color: "#E8B4B8", label: "Work", emoji: "💼" },
  "side-hustle": { color: "#B4D4E8", label: "Side Hustle", emoji: "✦" },
  "personal-admin": { color: "#C8E8B4", label: "Admin", emoji: "📋" },
  "kids-family": { color: "#E8D4B4", label: "Kids & Family", emoji: "🌿" }
};

const ENERGY_OPTIONS = [
  { value: "exhausted", label: "💀 Exhausted", desc: "touched out, baby chaos" },
  { value: "tired", label: "😮‍💨 Tired but OK", desc: "distracted, surviving" },
  { value: "ok", label: "😐 OK", desc: "managing, semi-focused" },
  { value: "good", label: "✨ Good", desc: "walked, coffee working" },
  { value: "energised", label: "⚡ Energised", desc: "clear headed, let's go" }
];

const TIME_OPTIONS = [
  { value: "<10", label: "< 10 mins", desc: "phone only" },
  { value: "10-25", label: "10–25 mins", desc: "focused burst" },
  { value: "25-45", label: "25–45 mins", desc: "proper block" },
  { value: "45+", label: "45+ mins", desc: "deep work" }
];

const STORAGE_KEYS = {
  messages: "ea_messages",
  tasks: "ea_tasks",
  apiKey: "ea_apikey"
};

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) { return fallback; }
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => loadFromStorage(STORAGE_KEYS.apiKey, ""));
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [messages, setMessages] = useState(() => loadFromStorage(STORAGE_KEYS.messages, []));
  const [tasks, setTasks] = useState(() => loadFromStorage(STORAGE_KEYS.tasks, []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("chat");
  const [checkinData, setCheckinData] = useState({});
  const [greeting, setGreeting] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening");

    if (messages.length === 0) {
      const welcome = {
        role: "assistant",
        content: `${hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"} 👋 What's going on right now? Dump tasks, check in for a recommendation, or just tell me what's on your mind.`
      };
      const initial = [welcome];
      setMessages(initial);
      saveToStorage(STORAGE_KEYS.messages, initial);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.messages, messages);
  }, [messages]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  const saveApiKey = () => {
    const key = apiKeyInput.trim();
    if (!key.startsWith("sk-ant-")) {
      alert("That doesn't look right — Anthropic API keys start with sk-ant-");
      return;
    }
    setApiKey(key);
    saveToStorage(STORAGE_KEYS.apiKey, key);
    setShowApiSetup(false);
    setApiKeyInput("");
  };

  const parseTaskFromReply = (reply) => {
    const match = reply.match(/TASK_JSON:(\{[^\n]+\})/);
    if (match) {
      try {
        const task = JSON.parse(match[1]);
        task.id = Date.now();
        task.addedAt = new Date().toISOString();
        task.checkinCount = 0;
        return task;
      } catch (e) {}
    }
    return null;
  };

  const cleanReply = (reply) => reply.replace(/TASK_JSON:\{[^\n]+\}/, "").trim();

  const buildHistory = (currentMessages, userMessage) => {
    const history = currentMessages.map(m => ({ role: m.role, content: m.content }));
    let context = userMessage;
    if (tasks.length > 0) {
      context += `\n\n[TASK LIST (${tasks.length} tasks):\n${tasks.map(t =>
        `- "${t.text}" | ${t.category} | ${t.energy_needed} energy | ${t.time_needed} | ${t.urgency} | seen ${t.checkinCount || 0} check-ins`
      ).join("\n")}]`;
    }
    return [...history, { role: "user", content: context }];
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;
    if (!apiKey) { setShowApiSetup(true); return; }

    const userMsg = { role: "user", content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: buildHistory(messages, messageText)
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const rawReply = data.content?.map(b => b.text || "").join("") || "Something went wrong.";
      const task = parseTaskFromReply(rawReply);
      const cleanedReply = cleanReply(rawReply);

      if (task) {
        setTasks(prev => {
          const updated = [...prev, task];
          saveToStorage(STORAGE_KEYS.tasks, updated);
          return updated;
        });
      }

      // Increment checkin count for all tasks on check-in messages
      if (messageText.toLowerCase().includes("what should i do") || messageText.toLowerCase().includes("checking in")) {
        setTasks(prev => prev.map(t => ({ ...t, checkinCount: (t.checkinCount || 0) + 1 })));
      }

      const assistantMsg = { role: "assistant", content: cleanedReply };
      setMessages(prev => {
        const updated = [...prev, assistantMsg];
        saveToStorage(STORAGE_KEYS.messages, updated);
        return updated;
      });

    } catch (err) {
      const errMsg = { role: "assistant", content: `Connection issue: ${err.message}. Check your API key in settings.` };
      setMessages(prev => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const handleCheckin = async () => {
    const msg = `Checking in. Energy: ${checkinData.energy}. Time: ${checkinData.time}.${checkinData.context ? ` Context: ${checkinData.context}` : ""} What's the one thing I should do right now?`;
    setView("chat");
    setCheckinData({});
    await sendMessage(msg);
  };

  const completeTask = (taskId) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      saveToStorage(STORAGE_KEYS.tasks, updated);
      return updated;
    });
    sendMessage("I just completed a task ✓");
  };

  const clearHistory = () => {
    if (window.confirm("Clear all chat history? Tasks will be kept.")) {
      setMessages([]);
      saveToStorage(STORAGE_KEYS.messages, []);
    }
  };

  // API Key Setup Screen
  if (!apiKey || showApiSetup) {
    return (
      <div style={{
        fontFamily: "'Georgia', serif",
        background: "#FAF7F2",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        maxWidth: "480px",
        margin: "0 auto"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "56px", height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E8B4B8, #B4D4E8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", margin: "0 auto 16px"
          }}>✦</div>
          <h1 style={{ fontSize: "26px", fontWeight: "400", color: "#2C2416", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            One Thing
          </h1>
          <p style={{ color: "#9A8E82", fontSize: "15px", margin: 0, lineHeight: "1.5" }}>
            Your execution assistant.<br />One API key to get started.
          </p>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            background: "#FFF8E8",
            border: "1px solid #E8D4A0",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "13px",
            color: "#6B5E42",
            lineHeight: "1.6"
          }}>
            <strong>How to get your API key:</strong><br />
            1. Go to <strong>console.anthropic.com</strong><br />
            2. Sign up / log in (free)<br />
            3. Click "API Keys" → "Create Key"<br />
            4. Copy and paste it below<br /><br />
            Cost: ~$0.01–0.05 per day of normal use.
          </div>

          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveApiKey()}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1.5px solid #D4C8BC",
              background: "#FFFFFF",
              color: "#2C2416",
              fontSize: "14px",
              fontFamily: "monospace",
              outline: "none",
              width: "100%",
              boxSizing: "border-box"
            }}
          />

          <button
            onClick={saveApiKey}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: "#2C2416",
              color: "#FAF7F2",
              fontSize: "16px",
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            Save & Start →
          </button>

          {showApiSetup && (
            <button onClick={() => setShowApiSetup(false)} style={{
              background: "none", border: "none", color: "#9A8E82",
              fontSize: "14px", cursor: "pointer", fontFamily: "inherit"
            }}>← Back</button>
          )}

          <p style={{ fontSize: "12px", color: "#B4A89C", textAlign: "center", margin: 0 }}>
            Your key is stored only on this device. Never shared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#FAF7F2",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      maxWidth: "480px",
      margin: "0 auto",
      position: "relative"
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid #E8E0D4",
        background: "#FAF7F2",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", color: "#9A8E82", textTransform: "uppercase", marginBottom: "2px" }}>
              {greeting}
            </div>
            <h1 style={{ margin: 0, fontSize: "21px", fontWeight: "400", color: "#2C2416", letterSpacing: "-0.02em" }}>
              Let's get one thing done.
            </h1>
          </div>
          <button
            onClick={() => setShowApiSetup(true)}
            style={{
              width: "36px", height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E8B4B8, #B4D4E8)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px"
            }}
            title="Settings"
          >✦</button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          {[
            { id: "chat", label: "Chat" },
            { id: "checkin", label: "Check In" },
            { id: "tasks", label: `Tasks${tasks.length > 0 ? ` (${tasks.length})` : ""}` }
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: view === tab.id ? "1.5px solid #2C2416" : "1.5px solid #D4C8BC",
              background: view === tab.id ? "#2C2416" : "transparent",
              color: view === tab.id ? "#FAF7F2" : "#6B5E52",
              fontSize: "13px", cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.02em"
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* CHAT */}
      {view === "chat" && (
        <>
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: "16px",
            minHeight: "400px", maxHeight: "calc(100vh - 230px)"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  background: msg.role === "user" ? "#2C2416" : "#FFFFFF",
                  color: msg.role === "user" ? "#FAF7F2" : "#2C2416",
                  fontSize: "15px", lineHeight: "1.55",
                  boxShadow: msg.role === "assistant" ? "0 1px 4px rgba(44,36,22,0.08)" : "none",
                  border: msg.role === "assistant" ? "1px solid #EDE6DC" : "none",
                  whiteSpace: "pre-wrap"
                }}>{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "14px 18px",
                  borderRadius: "4px 18px 18px 18px",
                  background: "#FFFFFF", border: "1px solid #EDE6DC",
                  display: "flex", gap: "5px", alignItems: "center"
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#C8B4A0",
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "8px 24px 0", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["What should I do right now?", "Add a task", "I'm overwhelmed", "Brain dump"].map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                padding: "5px 12px", borderRadius: "16px",
                border: "1px solid #D4C8BC", background: "transparent",
                color: "#6B5E52", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
              }}>{q}</button>
            ))}
            <button onClick={clearHistory} style={{
              padding: "5px 12px", borderRadius: "16px",
              border: "1px solid #EDE6DC", background: "transparent",
              color: "#B4A89C", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
            }}>Clear chat</button>
          </div>

          <div style={{ padding: "10px 24px 28px", display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Dump tasks, check in, ask anything..."
              rows={2}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: "16px",
                border: "1.5px solid #D4C8BC", background: "#FFFFFF",
                color: "#2C2416", fontSize: "15px", fontFamily: "inherit",
                resize: "none", outline: "none", lineHeight: "1.4"
              }}
            />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
              width: "44px", height: "44px", borderRadius: "50%", border: "none",
              background: input.trim() ? "#2C2416" : "#D4C8BC",
              color: "#FAF7F2", fontSize: "20px", cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s"
            }}>↑</button>
          </div>
        </>
      )}

      {/* CHECK IN */}
      {view === "checkin" && (
        <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#9A8E82", marginBottom: "6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Energy right now</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ENERGY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setCheckinData(p => ({ ...p, energy: opt.value }))} style={{
                  padding: "12px 16px", borderRadius: "12px",
                  border: checkinData.energy === opt.value ? "2px solid #2C2416" : "1.5px solid #D4C8BC",
                  background: checkinData.energy === opt.value ? "#2C2416" : "#FFFFFF",
                  color: checkinData.energy === opt.value ? "#FAF7F2" : "#2C2416",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontSize: "15px" }}>{opt.label}</span>
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#9A8E82", marginBottom: "6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Time available</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {TIME_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setCheckinData(p => ({ ...p, time: opt.value }))} style={{
                  padding: "14px", borderRadius: "12px",
                  border: checkinData.time === opt.value ? "2px solid #2C2416" : "1.5px solid #D4C8BC",
                  background: checkinData.time === opt.value ? "#2C2416" : "#FFFFFF",
                  color: checkinData.time === opt.value ? "#FAF7F2" : "#2C2416",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "center"
                }}>
                  <div style={{ fontSize: "15px", fontWeight: "500" }}>{opt.label}</div>
                  <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <input
            placeholder="Anything else? (optional — baby napping, pickup in 40 mins...)"
            value={checkinData.context || ""}
            onChange={e => setCheckinData(p => ({ ...p, context: e.target.value }))}
            style={{
              padding: "12px 16px", borderRadius: "12px",
              border: "1.5px solid #D4C8BC", background: "#FFFFFF",
              color: "#2C2416", fontSize: "14px", fontFamily: "inherit",
              outline: "none", width: "100%", boxSizing: "border-box"
            }}
          />

          <button onClick={handleCheckin} disabled={!checkinData.energy || !checkinData.time} style={{
            padding: "16px", borderRadius: "14px", border: "none",
            background: checkinData.energy && checkinData.time ? "#2C2416" : "#D4C8BC",
            color: "#FAF7F2", fontSize: "16px",
            cursor: checkinData.energy && checkinData.time ? "pointer" : "default",
            fontFamily: "inherit", letterSpacing: "0.02em"
          }}>
            Tell me what to do →
          </button>
        </div>
      )}

      {/* TASKS */}
      {view === "tasks" && (
        <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
          <p style={{ margin: "0 0 4px", color: "#6B5E52", fontSize: "14px", lineHeight: "1.5" }}>
            Tasks are captured automatically from your chat. Tick them off when done.
          </p>

          {tasks.length === 0 ? (
            <div style={{
              padding: "40px 24px", textAlign: "center",
              background: "#FFFFFF", borderRadius: "16px",
              border: "1.5px dashed #D4C8BC", marginTop: "8px"
            }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🌿</div>
              <div style={{ color: "#9A8E82", fontSize: "14px", lineHeight: "1.6" }}>
                Nothing captured yet.<br />Head to chat and start talking.
              </div>
            </div>
          ) : (
            <>
              {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                const catTasks = tasks.filter(t => t.category === catKey);
                if (catTasks.length === 0) return null;
                return (
                  <div key={catKey}>
                    <div style={{
                      fontSize: "11px", letterSpacing: "0.1em",
                      color: "#9A8E82", textTransform: "uppercase",
                      marginBottom: "8px", marginTop: "8px"
                    }}>{cat.emoji} {cat.label}</div>
                    {catTasks.map(task => (
                      <div key={task.id} style={{
                        padding: "12px 14px", background: "#FFFFFF",
                        borderRadius: "12px", border: "1px solid #EDE6DC",
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", marginBottom: "6px"
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", color: "#2C2416", marginBottom: "4px", lineHeight: "1.4" }}>{task.text}</div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: "10px",
                              background: cat.color + "50", color: "#6B5E52", fontSize: "11px"
                            }}>{task.urgency}</span>
                            <span style={{ color: "#B4A89C", fontSize: "11px" }}>
                              {task.time_needed} · {task.energy_needed} energy · {task.mode === "phone-ok" ? "📱" : "💻"}
                            </span>
                            {task.checkinCount > 2 && (
                              <span style={{ color: "#E8A0A0", fontSize: "11px" }}>👀 been waiting</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => completeTask(task.id)} style={{
                          background: "none", border: "1.5px solid #D4C8BC",
                          borderRadius: "50%", width: "28px", height: "28px",
                          color: "#C8B4A0", cursor: "pointer", fontSize: "14px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginLeft: "10px"
                        }}>✓</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; }
        textarea:focus { border-color: #2C2416 !important; }
        input:focus { border-color: #2C2416 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4C8BC; border-radius: 2px; }
      `}</style>
    </div>
  );
}
