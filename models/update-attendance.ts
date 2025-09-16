import {
  CheckIcon,
  CircleEqualIcon,
  FlagIcon,
  ThumbsUpIcon,
  XIcon,
} from "lucide-react-native";
export type TUpdateAttendanceRecord = {
  id: string;
  name: string;
  nric: string;
  isChecked: boolean;
  attendanceStatus: AttendanceStatus;
};

export enum AttendanceStatus {
  UNMARKED = "Unmarked",
  PRESENT = "Present",
  ABSENT = "Absent",
  FALL_OUT = "Fall Out",
  EXCUSED = "Excused",
}

export const AttendanceStatusValues: AttendanceStatus[] = (
  Object.keys(AttendanceStatus) as (keyof typeof AttendanceStatus)[]
).map((key) => AttendanceStatus[key]);

export const AttendanceStatusToIconMapping: Record<
  AttendanceStatus,
  React.ElementType
> = {
  [AttendanceStatus.UNMARKED]: FlagIcon,
  [AttendanceStatus.PRESENT]: CheckIcon,
  [AttendanceStatus.ABSENT]: XIcon,
  [AttendanceStatus.FALL_OUT]: CircleEqualIcon,
  [AttendanceStatus.EXCUSED]: ThumbsUpIcon,
};
