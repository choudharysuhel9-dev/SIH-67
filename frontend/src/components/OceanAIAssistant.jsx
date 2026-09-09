import { useState } from "react";
import { Send, Bot, User, Sparkles, HelpCircle, Compass, Waves } from "lucide-react";

export default function OceanAIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hello! I am your INCOIS Ocean AI Assistant. How can I help you understand ocean state variables, Argo floats, or numerical models today?",
    },
  ]);
  const [input, setInput] = useState("");

  const PRESET_QUESTIONS = [
    "What is an ARGO float?",
    "Why compare In-Situ vs Model?",
    "What is Mixed Layer Depth?",
    "Somali Current reversal",
    "Cyclone Heat Potential",
    "Oxygen Minimum Zone",
  ];

  const KNOWLEDGE_BASE = {
    "what is an argo float":
      "An ARGO float is an autonomous robotic probe that drifts in the ocean. Every 10 days, it sinks down to 2,000 meters and rises to the surface, measuring temperature, salinity, and pressure throughout the water column. There are thousands of them worldwide, giving scientists a continuous stream of real-time subsurface ocean data.",
    "why compare in-situ vs model":
      "Numerical ocean models (like ROMS and HYCOM) use mathematical equations to simulate and forecast ocean conditions. However, ocean turbulence and wind shifts can cause model drift. By comparing model forecasts with real in-situ observations (like Argo floats and Gliders), oceanographers calculate error metrics (Bias and RMSE) to validate and calibrate the forecasts.",
    "what is mixed layer depth":
      "Mixed Layer Depth (MLD) is the upper surface layer of the ocean where wind, waves, and surface cooling stir the water into a nearly uniform temperature and salinity. It usually spans the top 20 to 80 meters. Below the MLD, temperature drops sharply in an area called the thermocline.",
    "somali current reversal":
      "Unlike the Atlantic or Pacific oceans, the North Indian Ocean reverses its circulation twice a year due to the monsoons. During the Southwest Monsoon (summer), strong winds create the fast-flowing Somali Current (over 2.5 m/s) flowing northward. In winter, the Northeast Monsoon reverses the current southward.",
    "cyclone heat potential":
      "Tropical Cyclone Heat Potential (TCHP) measures the integrated heat energy stored in the ocean from the surface down to the 26°C isotherm. In the Bay of Bengal, deep pools of warm water prevent cyclone winds from churning up cold water, supplying non-stop moisture that rapidly intensifies cyclones into super-storms.",
    "oxygen minimum zone":
      "Between 150m and 1,000m depth, the Arabian Sea has very little dissolved oxygen (< 0.1 ml/L). High surface biological productivity sinks down and decomposes, consuming almost all available oxygen. BGC-Argo floats monitor this layer to track fish habitat compression and marine health.",
  };

  function handleSend(userText) {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    if (!userText) setInput("");

    setTimeout(() => {
      const lower = textToSend.toLowerCase().trim();
      let matchedResponse = null;

      for (const [key, answer] of Object.entries(KNOWLEDGE_BASE)) {
        if (lower.includes(key) || key.includes(lower)) {
          matchedResponse = answer;
          break;
        }
      }

      if (!matchedResponse) {
        matchedResponse = `That is an excellent oceanographic question regarding "${textToSend}". In operational oceanography at INCOIS, numerical models (like ROMS 0.1°) simulate 3D ocean state variables across India's EEZ. In-situ instruments like autonomous Argo floats and underwater gliders validate these predictions to support hazard warnings, search-and-rescue, and fishery advisories.`;
      }

      setMessages((prev) => [...prev, { role: "bot", content: matchedResponse }]);
    }, 350);
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col gap-3 sm:gap-5 overflow-y-auto">
      {/* Hero Header */}
      <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-3.5 sm:p-5 shadow-xl shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 rounded-xl bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
              Ocean AI Intelligence Assistant
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7C98B3] mt-0.5">
              Ask natural language questions about ARGO floats, ocean state variables, or INCOIS models.
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-3 pt-3 border-t border-[#182E47]">
          <p className="text-[10px] font-semibold text-[#8EA7BF] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#38BDF8]" /> Common Oceanographic Questions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-[#081524] hover:bg-[#132A42] text-[#B8D3EB] border border-[#193552] hover:border-[#38BDF8] transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 min-h-[220px] bg-[#091524] border border-[#182F47] rounded-2xl p-3.5 sm:p-5 overflow-y-auto flex flex-col gap-3 shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-[#0284C7] text-white"
                  : "bg-[#11273F] text-[#38BDF8] border border-[#1E4369]"
              }`}
            >
              {msg.role === "user" ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            <div
              className={`max-w-[85%] sm:max-w-[78%] p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[#0284C7] text-white rounded-tr-none"
                  : "bg-[#0E1F33] text-[#DCE8F0] border border-[#193552] rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-[#0C1B2E] border border-[#1C3652] rounded-xl p-1.5 sm:p-2 shadow-lg shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about ARGO floats, MLD, salinity, or cyclone heat..."
          className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm text-white placeholder-[#5A7794] focus:outline-none"
        />
        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shrink-0"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
