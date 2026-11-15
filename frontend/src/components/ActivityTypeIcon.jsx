import {
  Activity,
  Bike,
  BusFront,
  CarFront,
  Footprints,
  Plane,
  TrainFront,
} from "lucide-react";

const ACTIVITY_ICONS = {
  car_travel: CarFront,
  cycling: Bike,
  walking: Footprints,
  bus_travel: BusFront,
  train_travel: TrainFront,
  flight_travel: Plane,
};

export function iconForActivityType(activityType) {
  return ACTIVITY_ICONS[String(activityType || "").toLowerCase()] || Activity;
}

export default function ActivityTypeIcon({ activityType, className = "" }) {
  const Icon = iconForActivityType(activityType);

  return (
    <span className={`activity-type-icon ${className}`.trim()} aria-hidden="true">
      <Icon size={20} strokeWidth={1.8} />
    </span>
  );
}
