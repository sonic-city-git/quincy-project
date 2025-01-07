import { ProjectCard } from "./ProjectCard";

const MOCK_PROJECTS = [
  {
    title: "Summer Music Festival",
    customer: "Eventify Productions",
    equipmentCount: 15,
    staffCount: 8,
    nextBooking: "Apr 15, 2024",
  },
  {
    title: "Corporate Conference",
    customer: "TechCorp International",
    equipmentCount: 10,
    staffCount: 5,
    nextBooking: "Apr 20, 2024",
  },
  {
    title: "Wedding Season",
    customer: "Perfect Day Events",
    equipmentCount: 20,
    staffCount: 12,
    nextBooking: "Apr 18, 2024",
  },
];

export function ProjectList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {MOCK_PROJECTS.map((project, index) => (
        <ProjectCard key={index} {...project} />
      ))}
    </div>
  );
}