import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  Radio,
  Calendar
} from "lucide-react";

export default function TimelinePlayer({
  currentTimeStep = 3,
  onChangeTimeStep,
  maxSteps = 7
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 5x, 24x

  // Forecast dates for the 7 steps
  const forecastDates = [
    { day: "Day 0", date: "Sep 07 00:00Z", label: "Hindcast" },
    { day: "Day 1", date: "Sep 08 00:00Z", label: "Analysis" },
    { day: "Day 2", date: "Sep 09 00:00Z", label: "Nowcast" },
    { day: "Day 3", date: "Sep 10 00:00Z", label: "Forecast +24h" },
    { day: "Day 4", date: "Sep 11 00:00Z", label: "Forecast +48h" },
    { day: "Day 5", date: "Sep 12 00:00Z", label: "Forecast +72h" },
    { day: "Day 6", date: "Sep 13 00:00Z", label: "Forecast +96h" },
  ];

  // Auto-play interval
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const intervalMs = Math.max(300, 1500 / playbackSpeed);
      timer = setInterval(() => {
        onChangeTimeStep((prev) => {
          if (prev >= maxSteps - 1) return 0; // Loop back
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, maxSteps, onChangeTimeStep]);

  const activeDateInfo = forecastDates[currentTimeStep] || forecastDates[0];

  return (
    <div className="bg-[#091524]/90 backdrop-blur-md border border-[#1C3652] rounded-xl px-4 py-2.5 shadow-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full max-w-2xl text-xs text-[#DCE8F0]">
      {/* Play / Step Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChangeTimeStep(Math.max(0, currentTimeStep - 1))}
          className="p-1.5 rounded-lg text-[#7C98B3] hover:text-white hover:bg-[#13283E] transition-colors"
          title="Previous Step (-24h)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-lg font-medium flex items-center justify-center transition-all ${
            isPlaying
              ? "bg-[#F59E0B] text-black hover:bg-[#D97706] shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              : "bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-[0_0_12px_rgba(2,132,199,0.4)]"
          }`}
          title={isPlaying ? "Pause 4D Animation" : "Play 4D Ocean Animation"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
        </button>

        <button
          onClick={() => onChangeTimeStep(Math.min(maxSteps - 1, currentTimeStep + 1))}
          className="p-1.5 rounded-lg text-[#7C98B3] hover:text-white hover:bg-[#13283E] transition-colors"
          title="Next Step (+24h)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Scrubber & Time Display */}
      <div className="flex-1 w-full flex flex-col gap-1">
        <div className="flex justify-between items-baseline text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#38BDF8] flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {activeDateInfo.day}
            </span>
            <span className="font-mono text-[#7C98B3]">{activeDateInfo.date}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#102336] text-[#34D399] border border-[#193B57]">
            {activeDateInfo.label}
          </span>
        </div>

        {/* Range Scrubber */}
        <input
          type="range"
          min={0}
          max={maxSteps - 1}
          value={currentTimeStep}
          onChange={(e) => onChangeTimeStep(Number(e.target.value))}
          className="w-full accent-[#38BDF8] h-1.5 bg-[#142A42] rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[9px] font-mono text-[#557593]">
          {forecastDates.map((f, i) => (
            <span
              key={f.day}
              onClick={() => onChangeTimeStep(i)}
              className={`cursor-pointer hover:text-[#38BDF8] ${
                currentTimeStep === i ? "text-[#38BDF8] font-bold" : ""
              }`}
            >
              {f.day}
            </span>
          ))}
        </div>
      </div>

      {/* Speed multiplier */}
      <div className="flex items-center gap-1 bg-[#0A1828] border border-[#172F47] rounded-lg p-0.5 text-[10px]">
        {[1, 5, 24].map((speed) => (
          <button
            key={speed}
            onClick={() => setPlaybackSpeed(speed)}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              playbackSpeed === speed
                ? "bg-[#18395B] text-[#38BDF8] font-semibold"
                : "text-[#6E879E] hover:text-white"
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}
