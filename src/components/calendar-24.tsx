"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

type Calendar24Props = {
  value?: Date;
  onChangeAction?: (date: Date | undefined) => void;
};

export default function Calendar24({
  value,
  onChangeAction: onChange,
}: Calendar24Props) {
  const [open, setOpen] = React.useState(false);

  const [date, setDate] = React.useState<Date | undefined>(
    value
      ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
      : undefined,
  );
  const [time, setTime] = React.useState<string>(
    value
      ? `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`
      : "",
  );
  React.useEffect(() => {
    if (value) {
      setDate(new Date(value.getFullYear(), value.getMonth(), value.getDate()));
      setTime(
        `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`,
      );
    }
  }, [value]);

  const handleDateTimeChange = React.useCallback(
    (newDate?: Date, newTime?: string) => {
      const currentDate = newDate ?? date;
      const currentTime = newTime ?? time;

      if (currentDate && currentTime && currentTime.trim() !== "") {
        const [hours, minutes] = currentTime.split(":").map(Number);
        const combined = new Date(currentDate);
        combined.setHours(hours ?? 0, minutes ?? 0, 0, 0);
        onChange?.(combined);
      } else if (!currentDate || !currentTime || currentTime.trim() === "") {
        onChange?.(undefined);
      }
    },
    [date, time, onChange],
  );

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    handleDateTimeChange(newDate, undefined);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    handleDateTimeChange(undefined, newTime);
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(selectedDate) => {
                handleDateChange(selectedDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
