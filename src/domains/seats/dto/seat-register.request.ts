import * as v from "valibot";

export const SeatRegisterRequestSchema = v.object({
  seatId: v.pipe(v.string(), v.uuid("Neplatný formát SeatId (musí být GUID)"))
});

export type SeatRegisterRequest = v.InferOutput<typeof SeatRegisterRequestSchema>;
