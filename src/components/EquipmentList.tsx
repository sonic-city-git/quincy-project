import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Tool, Trash } from "lucide-react";

const MOCK_EQUIPMENT = [
  {
    name: "Sony FX6",
    category: "Camera",
    serialNumber: "FX6-12345",
    status: "Available",
    lastMaintenance: "15.03.24",
    nextBooking: "28.06.24",
  },
  {
    name: "Aputure 600D",
    category: "Lighting",
    serialNumber: "AP600-789",
    status: "In Use",
    lastMaintenance: "10.02.24",
    nextBooking: "29.09.24",
  },
  {
    name: "DJI Ronin 2",
    category: "Camera Support",
    serialNumber: "RN2-456",
    status: "Maintenance",
    lastMaintenance: "20.03.24",
    nextBooking: null,
  },
];

export function EquipmentList() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="secondary" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
        <Button variant="secondary" className="gap-2">
          <Tool className="h-4 w-4" />
          Schedule Maintenance
        </Button>
        <Button variant="secondary" className="gap-2">
          <Trash className="h-4 w-4" />
          Remove Equipment
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Maintenance</TableHead>
            <TableHead>Next Booking</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_EQUIPMENT.map((equipment) => (
            <TableRow key={equipment.serialNumber} className="hover:bg-zinc-800/50">
              <TableCell className="w-12">
                <div className="w-4 h-4 rounded border border-zinc-700"></div>
              </TableCell>
              <TableCell>{equipment.name}</TableCell>
              <TableCell>{equipment.category}</TableCell>
              <TableCell className="font-mono text-sm">{equipment.serialNumber}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-sm ${
                  equipment.status === "Available" ? "bg-green-500/20 text-green-300" :
                  equipment.status === "In Use" ? "bg-blue-500/20 text-blue-300" :
                  "bg-amber-500/20 text-amber-300"
                }`}>
                  {equipment.status}
                </span>
              </TableCell>
              <TableCell>{equipment.lastMaintenance}</TableCell>
              <TableCell>{equipment.nextBooking || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}