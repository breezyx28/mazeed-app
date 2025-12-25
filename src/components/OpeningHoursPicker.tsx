import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";

export type DaySchedule = {
  enabled: boolean;
  open: string;
  close: string;
};

export type OpeningHoursData = {
  type: "24_7" | "custom";
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
};

interface OpeningHoursPickerProps {
  value: OpeningHoursData;
  onChange: (value: OpeningHoursData) => void;
}

const defaultDaySchedule: DaySchedule = {
  enabled: true,
  open: "09:00",
  close: "17:00",
};

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function OpeningHoursPicker({
  value,
  onChange,
}: OpeningHoursPickerProps) {
  const { t } = useTranslation();

  // Ensure we have a valid structure even if value is partial
  const safeValue: OpeningHoursData = {
    type: value?.type || "custom",
    schedule: {
      monday: { ...defaultDaySchedule, ...value?.schedule?.monday },
      tuesday: { ...defaultDaySchedule, ...value?.schedule?.tuesday },
      wednesday: { ...defaultDaySchedule, ...value?.schedule?.wednesday },
      thursday: { ...defaultDaySchedule, ...value?.schedule?.thursday },
      friday: { ...defaultDaySchedule, ...value?.schedule?.friday },
      saturday: { ...defaultDaySchedule, ...value?.schedule?.saturday },
      sunday: { ...defaultDaySchedule, ...value?.schedule?.sunday },
    },
  };

  const updateSchedule = (
    day: keyof OpeningHoursData["schedule"],
    updates: Partial<DaySchedule>
  ) => {
    const newSchedule = {
      ...safeValue.schedule,
      [day]: { ...safeValue.schedule[day], ...updates },
    };
    onChange({ ...safeValue, schedule: newSchedule });
  };

  const toggle247 = (checked: boolean) => {
    onChange({ ...safeValue, type: checked ? "24_7" : "custom" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base">Open 24/7</Label>
          <div className="text-sm text-muted-foreground">
            Allow customers to order at any time
          </div>
        </div>
        <Switch
          checked={safeValue.type === "24_7"}
          onCheckedChange={toggle247}
        />
      </div>

      {safeValue.type === "custom" && (
        <div className="space-y-3 pt-2">
          <Label>Weekly Schedule</Label>
          <div className="grid gap-2">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={`day-${day}`}
                  checked={safeValue.schedule[day].enabled}
                  onCheckedChange={(checked) =>
                    updateSchedule(day, { enabled: checked === true })
                  }
                  className="mr-1"
                />
                <Label
                  htmlFor={`day-${day}`}
                  className="w-16 text-[12px] capitalize cursor-pointer"
                >
                  {t(day) !== day
                    ? t(day)
                    : day.charAt(0).toUpperCase() + day.slice(1)}
                </Label>

                {safeValue.schedule[day].enabled ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={safeValue.schedule[day].open}
                      onChange={(e) =>
                        updateSchedule(day, { open: e.target.value })
                      }
                      className="w-24 h-8 !text-[12px]"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={safeValue.schedule[day].close}
                      onChange={(e) =>
                        updateSchedule(day, { close: e.target.value })
                      }
                      className="w-24 h-8 !text-[12px]"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm italic ml-2">
                    Closed
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
