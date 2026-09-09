import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Wind,
  ShieldAlert,
  Fish,
  Waves,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { STORIES } from "./OutreachStoryModal";

export default function GlossaryOutreachView() {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const GLOSSARY_TERMS = [
    {
      term: "In-Situ Observation",
      badge: "Real-Life Measurement",
      definition:
        "Means 'on-site'. Instruments physically touching the water (like robotic floats or ship sensors) instead of estimating from space with satellites.",
    },
    {
      term: "Numerical Model (ROMS / HYCOM)",
      badge: "Computer Simulation",
      definition:
        "Supercomputer software that solves fluid equations to predict future ocean temperature, saltiness, and currents across India's waters.",
    },
    {
      term: "ARGO Profiling Float",
      badge: "Robotic Probe",
      definition:
        "Autonomous yellow robotic buoys that drift with ocean currents, dive down to 2,000 meters, and pop up every 10 days to transmit temperature and salinity via satellite.",
    },
    {
      term: "Exclusive Economic Zone (EEZ)",
      badge: "200nm Maritime Border",
      definition:
        "The sea zone stretching 200 nautical miles from India's coast where India holds exclusive rights to fishing, energy resources, and scientific exploration.",
    },
    {
      term: "Mixed Layer Depth (MLD)",
      badge: "Sunlit Surface",
      definition:
        "The upper ocean layer (top 20 to 80m) churned up by wind and sunlight into a uniform temperature. Beneath it, temperature plunges rapidly in the thermocline.",
    },
    {
      term: "Model Bias & RMSE",
      badge: "Forecast Accuracy",
      definition:
        "Bias measures if the computer model over-predicted or under-predicted temperatures. RMSE (Root Mean Square Error) measures the average degree error against real robots.",
    },
    {
      term: "NetCDF (.nc)",
      badge: "Scientific File Format",
      definition:
        "The universal binary file format used by NASA, NOAA, and INCOIS to package multi-dimensional 3D ocean data across time, depth, latitude, and longitude.",
    },
    {
      term: "SOFAR Channel (Sound Fixing and Ranging)",
      badge: "Underwater Acoustics",
      definition:
        "A natural underwater sound channel around 1,000m depth where low-frequency sounds can travel thousands of kilometers. Vital for submarine navigation and search-and-rescue.",
    },
  ];

  const story = STORIES[activeStoryIdx];
  const StoryIcon = story.icon;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
      {/* Title */}
      <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ocean Glossary & Science Outreach
            </h2>
            <p className="text-xs sm:text-sm text-[#7C98B3] mt-0.5">
              Demystifying complex oceanographic science for students, citizens, and operational decision-makers.
            </p>
          </div>
        </div>
      </div>

      {/* Part 1: Plain-English Glossary Cards */}
      <div>
        <h3 className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#38BDF8]" /> Plain-English Ocean Glossary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {GLOSSARY_TERMS.map((item) => (
            <div
              key={item.term}
              className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-4 shadow-md flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132A42] text-[#38BDF8] border border-[#1F456E]">
                  {item.badge}
                </span>
                <h4 className="text-sm font-bold text-white mt-2 leading-tight">{item.term}</h4>
                <p className="text-xs text-[#98B1C8] mt-2 leading-relaxed">{item.definition}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 2: Public Outreach Science Stories (Interactive Educational Tour) */}
      <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-6 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#18314C] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#38BDF8]" /> E-Learning Science Stories
            </h3>
            <p className="text-xs text-[#7C98B3]">
              Curated interactive ocean phenomena for school and college student education.
            </p>
          </div>
        </div>

        {/* Story Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STORIES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStoryIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeStoryIdx === idx
                  ? "bg-[#0284C7] text-white font-semibold shadow"
                  : "bg-[#091524] text-[#7C98B3] border border-[#182E47] hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
              {s.title.split(" ")[0]} {s.title.split(" ")[1]}
            </button>
          ))}
        </div>

        {/* Active Story Card */}
        <div className="p-5 rounded-2xl bg-[#091524] border border-[#1A3450] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] bg-[#122A42] px-2 py-0.5 rounded border border-[#1C3E61]">
                {story.badge}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-1">{story.title}</h4>
              <p className="text-xs text-[#8EA7BF]">{story.subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${story.color} text-white shrink-0 self-start shadow-md`}>
              <StoryIcon className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#BED3E7] leading-relaxed whitespace-pre-line bg-[#0C1C2F] p-4 rounded-xl border border-[#1B3552]">
            {story.content}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {story.keyPoints.map((pt, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[#0E2034] border border-[#19334F] text-[#C4D9EC]">
                <strong className="text-[#38BDF8] mr-1">0{i + 1}.</strong> {pt}
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#063328]/70 border border-[#059669]/40 flex items-start gap-2.5 text-xs text-[#D1FAE5]">
            <Sparkles className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#34D399]">Student Quick Fact:</strong> {story.studentFact}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
