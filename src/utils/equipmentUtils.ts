import { SerialNumber } from "@/types/equipment";

export const calculateAvailableStock = (serialNumbers: SerialNumber[]): number => {
  return serialNumbers.filter(sn => sn.status === "Available").length;
};

export const calculateTotalStock = (serialNumbers: SerialNumber[]): number => {
  return serialNumbers.length;
};