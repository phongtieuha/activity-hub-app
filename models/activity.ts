import { ActivityResponseDtoAttire } from "@/__generated-client/http-client-integration";

export const ServerAttireToDisplayMapping: Record<
  ActivityResponseDtoAttire,
  string
> = {
  [ActivityResponseDtoAttire.ATTIRE_1]: "No. 1 dress",
  [ActivityResponseDtoAttire.ATTIRE_2]: "No. 2 dress",
  [ActivityResponseDtoAttire.ATTIRE_3]: "No. 3 dress",
  [ActivityResponseDtoAttire.ATTIRE_4]: "No. 4 dress",
  [ActivityResponseDtoAttire.ATTIRE_5]: "No. 5 dress",
};
