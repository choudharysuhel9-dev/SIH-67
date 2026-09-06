import { useState } from "react";
import {
  X,
  Compass,
  Wind,
  Waves,
  ShieldAlert,
  Fish,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Sparkles,
  ArrowRight
} from "lucide-react";

export const STORIES = [
  {
    id: "monsoon_currents",
    title: "The Great Indian Summer Monsoon Reversal",
    subtitle: "How seasonal winds reverse entire ocean gyres across the Arabian Sea",
    badge: "Climate Dynamics",
    icon: Wind,
    color: "from-cyan-500 to-blue-600",
    depthTarget: 0,
    variableTarget: "currents",
    content: `Unlike the Atlantic or Pacific oceans which have steady year-round circulation, the North Indian Ocean completely flips its surface current directions twice a year driven by the Indian Monsoon.
    
During the Southwest Monsoon (June–September), intense south-westerly winds generate the ferocious Somali Current, jetting northeastward along the Horn of Africa at speeds over 2.5 m/s. This transports immense volumes of water toward the west coast of India, creating the West India Coastal Current (WICC).`,
    keyPoints: [
      "Wind stress drives full seasonal circulation reversal",
      "Somali Jet velocity exceeds 2.5 m/s (strongest open-ocean current)",
      "Essential for India's agricultural rainfall timing and intensity"
    ],
    studentFact: "Did you know? Ocean models at INCOIS predict these current reversals to help commercial vessels save thousands of tons of fuel by riding with the flow!",
  },
  {
    id: "cyclone_heat",
    title: "Tropical Cyclone Heat Potential (TCHP) in Bay of Bengal",
    subtitle: "The thermal engine behind rapid cyclone intensification",
    badge: "Hazard Warning",
    icon: ShieldAlert,
    color: "from-amber-500 to-red-600",
    depthTarget: 50,
    variableTarget: "temp",
    content: `The Bay of Bengal is one of the most active breeding grounds for deadly tropical cyclones. While Sea Surface Temperature (SST > 28°C) provides initial energy, the key to catastrophic intensification lies deep beneath the surface in Tropical Cyclone Heat Potential (TCHP).
    
When high thermal energy extends down to 50–100 meters (depth of the 26°C isotherm), strong cyclone winds cannot churn up cold subsurface waters. This feeds uninterrupted heat moisture to the storm, leading to explosive Category 4/5 super-cyclones.`,
    keyPoints: [
      "TCHP measures integrated heat content above the 26°C isotherm",
      "Thick barrier layers in the Bay of Bengal insulate surface heat",
      "INCOIS provides real-time TCHP maps to IMD for cyclone path & intensity forecasts"
    ],
    studentFact: "Argo floats diving up to 2,000m are the secret heroes that sample this subsurface heat before satellite eyes can see the cyclone form!",
  },
  {
    id: "upwelling_fisheries",
    title: "Coastal Upwelling & Malabar Fishery Grounds (PFZ)",
    subtitle: "Deep nutrient pump driving the Arabian Sea marine food web",
    badge: "Fishery Advisories",
    icon: Fish,
    color: "from-emerald-500 to-teal-600",
    depthTarget: 100,
    variableTarget: "salinity",
    content: `Along the southwestern coast of India (Kerala and Karnataka), monsoonal winds push surface water offshore through Ekman transport. To replace this displaced water, cold, nutrient-rich deep water ascends from 100–200m depths to the sunlit surface.
    
This surge of nitrates and phosphates sparks explosive phytoplankton blooms, visible as high Chlorophyll-a. These blooms attract massive shoals of Indian oil sardine and mackerel, creating India's richest fishing grounds.`,
    keyPoints: [
      "Ekman transport forces deep cold water up the continental shelf",
      "Dramatically lowers sea surface temperature by 3–5°C along Malabar",
      "Directly powers INCOIS's Potential Fishing Zone (PFZ) mobile advisories"
    ],
    studentFact: "INCOIS disseminates daily PFZ advisories via satellite radio and mobile apps to over 500,000 Indian artisanal fishermen!",
  },
  {
    id: "omz_arabian_sea",
    title: "The Extreme Oxygen Minimum Zone (OMZ)",
    subtitle: "Understanding sub-surface twilight zones in the Northern Indian Ocean",
    badge: "Marine Ecosystems",
    icon: Waves,
    color: "from-purple-500 to-indigo-600",
    depthTarget: 250,
    variableTarget: "salinity",
    content: `Between 150m and 1,000m depth, the Arabian Sea harbors one of the thickest and most severe Oxygen Minimum Zones on Earth. High surface biological productivity leads to vast amounts of dead organic matter sinking into the twilight zone.
    
As bacteria decompose this sinking organic carbon, they consume almost all dissolved oxygen (< 0.1 ml/L). Autonomous BGC-Argo floats and gliders continuously monitor this boundary to evaluate marine habitat compression and greenhouse gas emissions (nitrous oxide).`,
    keyPoints: [
      "Oxygen drops below 0.1 ml/L between 150m and 1000m depths",
      "Forces commercial fish species into narrow surface layer habitats",
      "Monitored in real-time by INCOIS Bio-Argo floats with optical oxygen sensors"
    ],
    studentFact: "Certain deep-sea organisms have developed specialized ultra-efficient hemoglobin to survive in this oxygen-depleted ocean layer!",
  },
];

export default function OutreachStoryModal({
  isOpen,
  onClose,
  onApplyStorySetting
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isOpen) return null;

  const story = STORIES[currentIdx];
  const Icon = story.icon;

  function handleApply() {
    if (onApplyStorySetting) {
      onApplyStorySetting({
        depth: story.depthTarget,
        variable: story.variableTarget,
      });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1726] border border-[#1E3A5F] shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D42] bg-[#0E1F33]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#142A45] text-[#38BDF8]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  INCOIS Public Outreach & Science Communication
                </h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#0284C7]/30 text-[#38BDF8] border border-[#0284C7]/50 font-medium">
                  Education Tour
                </span>
              </div>
              <p className="text-xs text-[#7C98B3]">
                Story {currentIdx + 1} of {STORIES.length} • Interactive 3D Ocean Insights
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7C98B3] hover:text-white hover:bg-[#1A3048] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Selector Bar */}
        <div className="flex border-b border-[#16273D] bg-[#071321] overflow-x-auto">
          {STORIES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIdx(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs whitespace-nowrap transition-all border-b-2 ${
                currentIdx === idx
                  ? "bg-[#0E2034] text-[#38BDF8] border-[#38BDF8] font-medium"
                  : "text-[#7C98B3] border-transparent hover:text-[#D8E6F3] hover:bg-[#0A1828]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              {s.title.split(" ")[0]} {s.title.split(" ")[1]}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#091524]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] bg-[#122A42] px-2.5 py-1 rounded-full border border-[#1C3E61]">
                {story.badge}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{story.title}</h2>
              <p className="text-sm text-[#8EA7BF] mt-1">{story.subtitle}</p>
            </div>
            <div className={`p-4 rounded-xl bg-gradient-to-br ${story.color} text-white shadow-lg shrink-0 self-start`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>

          {/* Narrative */}
          <div className="p-4 rounded-xl bg-[#0C1B2E] border border-[#1B3450] text-sm leading-relaxed text-[#D2E2F0]">
            <p className="whitespace-pre-line">{story.content}</p>
          </div>

          {/* Key Insights Cards */}
          <div>
            <h4 className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider mb-2">
              Key Oceanographic Takeaways
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {story.keyPoints.map((point, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0E1F33] border border-[#19324D] text-xs text-[#BED2E5]">
                  <span className="text-[#38BDF8] font-bold mr-1">0{i + 1}.</span> {point}
                </div>
              ))}
            </div>
          </div>

          {/* Educational Fun Fact */}
          <div className="p-3.5 rounded-xl bg-[#063328]/60 border border-[#059669]/40 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
            <div className="text-xs text-[#D1FAE5]">
              <strong className="text-[#34D399] block mb-0.5">E-Learning & Student Highlight:</strong>
              {story.studentFact}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 border-t border-[#1E2D42] bg-[#0A1625] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((c) => c - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#7C98B3] hover:text-white hover:bg-[#172D45] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Story
            </button>
            <button
              disabled={currentIdx === STORIES.length - 1}
              onClick={() => setCurrentIdx((c) => c + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#7C98B3] hover:text-white hover:bg-[#172D45] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Next Story <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-medium shadow-md transition-all"
          >
            Apply Scene Settings & Explore <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
