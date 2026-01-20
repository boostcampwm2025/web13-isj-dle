import { Controller } from "@nestjs/common";

import { BreakoutService } from "./breakout.service";

@Controller("breakout")
export class BreakoutController {
  constructor(private readonly breakoutService: BreakoutService) {}
}
