import { describe, expect, it } from "vitest";
import {
  Bike,
  BusFront,
  CarFront,
  Footprints,
  Plane,
  TrainFront,
} from "lucide-react";
import { iconForActivityType } from "./ActivityTypeIcon.jsx";

describe("iconForActivityType", () => {
  it.each([
    ["car_travel", CarFront],
    ["cycling", Bike],
    ["walking", Footprints],
    ["bus_travel", BusFront],
    ["train_travel", TrainFront],
    ["flight_travel", Plane],
  ])("maps %s to its transport icon", (activityType, icon) => {
    expect(iconForActivityType(activityType)).toBe(icon);
  });
});
