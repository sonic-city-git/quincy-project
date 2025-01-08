export const TAGS = [
  { id: "foh", label: "FOH" },
  { id: "mon", label: "MON" },
  { id: "playback", label: "Playback" },
  { id: "backline", label: "Backline" },
] as const;

export const PROJECT_ASSIGNMENTS = {
  "1": [
    { startDate: "2024-03-20", endDate: "2024-03-25", projectName: "Project A" },
    { startDate: "2024-04-01", endDate: "2024-04-05", projectName: "Project B" }
  ],
  "2": [
    { startDate: "2024-03-22", endDate: "2024-03-24", projectName: "Project C" }
  ],
  "3": [
    { startDate: "2024-03-28", endDate: "2024-04-02", projectName: "Project D" }
  ]
};